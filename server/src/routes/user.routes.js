const express = require('express');
const { getAllUsers, getUserById, updateProfile, deleteUser } = require('../controllers/user.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect); // All user routes require authentication

router.get('/', authorize('admin'), getAllUsers);
router.get('/:id', authorize('admin'), getUserById);
router.put('/profile', updateProfile);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;
