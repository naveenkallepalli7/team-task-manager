const express = require('express');
const { body } = require('express-validator');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  updateProjectMembers,
  deleteProject,
} = require('../controllers/project.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect); // All project routes require auth

const projectValidation = [
  body('name').trim().notEmpty().withMessage('Project name is required').isLength({ max: 100 }),
  body('description').optional().isLength({ max: 500 }),
];

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', authorize('admin'), projectValidation, createProject);
router.put('/:id', authorize('admin'), updateProject);
router.put('/:id/members', authorize('admin'), updateProjectMembers);
router.delete('/:id', authorize('admin'), deleteProject);

module.exports = router;
