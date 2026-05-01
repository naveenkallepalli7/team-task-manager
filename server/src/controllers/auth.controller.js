const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User.model');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
const signup = async (req, res) => {
  // Validate request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, password, role, adminKey } = req.body;

  try {
    // ── Admin Key Validation ──────────────────────────────────────────────────
    // If the client requests admin role, verify the secret key.
    // This prevents any user from self-promoting to admin without the key.
    let resolvedRole = 'member'; // always default to member

    if (role === 'admin') {
      const validAdminKey = process.env.ADMIN_SECRET_KEY;

      if (!adminKey) {
        return res.status(403).json({
          success: false,
          message: 'Admin Key is required to create an admin account.',
        });
      }

      if (adminKey !== validAdminKey) {
        return res.status(403).json({
          success: false,
          message: 'Invalid Admin Key. Admin account creation denied.',
        });
      }

      // Key is valid — allow admin role
      resolvedRole = 'admin';
    }

    // ── Duplicate Email Check ─────────────────────────────────────────────────
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // ── Create User ───────────────────────────────────────────────────────────
    const user = await User.create({
      name,
      email,
      password,      // hashed automatically by User model pre-save hook
      role: resolvedRole,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: `Account created successfully as ${resolvedRole}`,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ success: false, message: 'Server error during signup.' });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

/**
 * @desc    Get current logged-in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { signup, login, getMe };
