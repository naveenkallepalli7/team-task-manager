const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

/**
 * Middleware: Verify JWT token and attach user to request
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (exclude password)
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Token invalid or user no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.' });
    }
    next(err);
  }
};

/**
 * Middleware: Restrict to specific roles
 * Usage: authorize('admin') or authorize('admin', 'member')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route.`,
      });
    }
    next();
  };
};

/**
 * Middleware: Ensure only the assigned user (or admin) can update a task
 * Usage: Apply to PUT /tasks/:id
 * Requires the task to be fetched and attached to req.task by a prior step,
 * OR performs the check inline using the Task model.
 */
const Task = require('../models/Task.model');

const checkAssignee = async (req, res, next) => {
  try {
    // Admins can always update any task
    if (req.user.role === 'admin') return next();

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    // Members can only update tasks assigned to them
    if (!task.assignedTo || task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update tasks assigned to you.',
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { protect, authorize, checkAssignee };
