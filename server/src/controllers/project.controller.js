const { validationResult } = require('express-validator');
const Project = require('../models/Project.model');
const Task = require('../models/Task.model');

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private/Admin
 */
const createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, description, members } = req.body;

  try {
    const project = await Project.create({
      name,
      description,
      createdBy: req.user._id,
      members: members || [],
    });

    await project.populate([
      { path: 'createdBy', select: 'name email role' },
      { path: 'members', select: 'name email role' },
    ]);

    res.status(201).json({ success: true, message: 'Project created.', project });
  } catch (err) {
    console.error('Create project error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get all projects (Admin sees all, Members see their own)
 * @route   GET /api/projects
 * @access  Private
 */
const getProjects = async (req, res) => {
  try {
    let query = {};

    // Members can only see projects they belong to
    if (req.user.role === 'member') {
      query = { members: req.user._id };
    }

    const projects = await Project.find(query)
      .populate('createdBy', 'name email')
      .populate('members', 'name email role')
      .populate('taskCount')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: projects.length, projects });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get single project
 * @route   GET /api/projects/:id
 * @access  Private
 */
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('members', 'name email role');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Members can only access projects they're part of
    if (
      req.user.role === 'member' &&
      !project.members.some((m) => m._id.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private/Admin
 */
const updateProject = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (status) updates.status = status;

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email')
      .populate('members', 'name email role');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    res.json({ success: true, message: 'Project updated.', project });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Add/remove members from project
 * @route   PUT /api/projects/:id/members
 * @access  Private/Admin
 */
const updateProjectMembers = async (req, res) => {
  try {
    const { members } = req.body; // Array of user IDs

    if (!Array.isArray(members)) {
      return res.status(400).json({ success: false, message: 'Members must be an array.' });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { members },
      { new: true }
    )
      .populate('createdBy', 'name email')
      .populate('members', 'name email role');

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    res.json({ success: true, message: 'Project members updated.', project });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Delete project (and its tasks)
 * @route   DELETE /api/projects/:id
 * @access  Private/Admin
 */
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    // Delete all tasks in this project
    await Task.deleteMany({ projectId: req.params.id });
    await Project.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Project and its tasks deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  updateProjectMembers,
  deleteProject,
};
