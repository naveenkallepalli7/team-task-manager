const express = require('express');
const { body } = require('express-validator');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getStats,
} = require('../controllers/task.controller');
const { protect, authorize, checkAssignee } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect); // All task routes require auth

const taskValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required').isLength({ max: 150 }),
  body('dueDate').notEmpty().withMessage('Due date is required').isISO8601().withMessage('Invalid date'),
  body('projectId').notEmpty().withMessage('Project ID is required').isMongoId(),
  body('status').optional().isIn(['Pending', 'In Progress', 'Completed']),
  body('priority').optional().isIn(['Low', 'Medium', 'High']),
];

// Dashboard stats — must be before /:id route
router.get('/stats', getStats);

router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', authorize('admin'), taskValidation, createTask);
router.put('/:id', checkAssignee, updateTask); // Admin or assigned user only
router.delete('/:id', authorize('admin'), deleteTask);

module.exports = router;
