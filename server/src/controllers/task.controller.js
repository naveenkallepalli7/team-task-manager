const { validationResult } = require('express-validator');
const Task = require('../models/Task.model');
const Project = require('../models/Project.model');

/**
 * @desc    Create a task (Admin only)
 * @route   POST /api/tasks
 * @access  Private/Admin
 */
const createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { title, description, assignedTo, dueDate, projectId, priority, tags } = req.body;

  try {
    // Verify project exists and admin has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const task = await Task.create({
      title,
      description,
      assignedTo: assignedTo || null,
      dueDate,
      projectId,
      priority: priority || 'Medium',
      tags: tags || [],
      createdBy: req.user._id,
    });

    await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'projectId', select: 'name' },
      { path: 'createdBy', select: 'name email' },
    ]);

    res.status(201).json({ success: true, message: 'Task created.', task });
  } catch (err) {
    console.error('Create task error:', err.message);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get all tasks with filtering
 * @route   GET /api/tasks
 * @access  Private
 * @query   status, projectId, assignedTo, priority, search, overdue
 */
const getTasks = async (req, res) => {
  try {
    const { status, projectId, assignedTo, priority, search, overdue } = req.query;

    let query = {};

    // Members can only see tasks assigned to them
    if (req.user.role === 'member') {
      query.assignedTo = req.user._id;
    } else {
      // Admin filters
      if (assignedTo) query.assignedTo = assignedTo;
    }

    if (status) query.status = status;
    if (projectId) query.projectId = projectId;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (overdue === 'true') {
      query.dueDate = { $lt: new Date() };
      query.status = { $ne: 'Completed' };
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1, createdAt: -1 });

    res.json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get single task
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name description')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    // Members can only access tasks assigned to them
    if (
      req.user.role === 'member' &&
      task.assignedTo?._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Update task
 * @route   PUT /api/tasks/:id
 * @access  Private (Admin: full update, Member: status only)
 */
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    // Members can only update status of their own tasks
    if (req.user.role === 'member') {
      if (task.assignedTo?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ success: false, message: 'Members can only update status.' });
      }
      task.status = status;
    } else {
      // Admin can update all fields
      const { title, description, assignedTo, dueDate, status, priority, tags } = req.body;
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
      if (dueDate) task.dueDate = dueDate;
      if (status) task.status = status;
      if (priority) task.priority = priority;
      if (tags) task.tags = tags;
    }

    await task.save();
    await task.populate([
      { path: 'assignedTo', select: 'name email' },
      { path: 'projectId', select: 'name' },
      { path: 'createdBy', select: 'name email' },
    ]);

    res.json({ success: true, message: 'Task updated.', task });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Delete task (Admin only)
 * @route   DELETE /api/tasks/:id
 * @access  Private/Admin
 */
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }
    res.json({ success: true, message: 'Task deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get dashboard stats
 * @route   GET /api/tasks/stats
 * @access  Private
 */
const getStats = async (req, res) => {
  try {
    const now = new Date();
    let matchQuery = {};

    // Members see only their own tasks
    if (req.user.role === 'member') {
      matchQuery.assignedTo = req.user._id;
    }

    const [total, completed, pending, inProgress, overdue] = await Promise.all([
      Task.countDocuments(matchQuery),
      Task.countDocuments({ ...matchQuery, status: 'Completed' }),
      Task.countDocuments({ ...matchQuery, status: 'Pending' }),
      Task.countDocuments({ ...matchQuery, status: 'In Progress' }),
      Task.countDocuments({
        ...matchQuery,
        status: { $ne: 'Completed' },
        dueDate: { $lt: now },
      }),
    ]);

    // Status breakdown for chart
    const statusBreakdown = [
      { name: 'Pending', value: pending, color: '#f59e0b' },
      { name: 'In Progress', value: inProgress, color: '#6366f1' },
      { name: 'Completed', value: completed, color: '#10b981' },
    ];

    res.json({
      success: true,
      stats: { total, completed, pending, inProgress, overdue, statusBreakdown },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask, getStats };
