/**
 * Admin Authentication Routes
 * Handles admin login, logout, and session management
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const Admin = require('../../models/Admin');
const { generateToken, generateRefreshToken } = require('../../middleware/auth');

const router = express.Router();

// Rate limiting for admin login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin Login
router.post('/login', 
  loginLimiter,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password, rememberMe = false } = req.body;

      // Find admin by email
      const admin = await Admin.findOne({ 
        email: email.toLowerCase(),
        status: 'active'
      });

      // Check if admin exists and password is correct
      if (!admin || !(await admin.comparePassword(password))) {
        // If admin exists, increment login attempts
        if (admin) {
          await admin.incrementLoginAttempts();
        }
        
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if account is locked
      if (admin.isLocked) {
        return res.status(423).json({
          success: false,
          message: 'Account is temporarily locked due to multiple failed login attempts'
        });
      }

      // Check if email is verified (for new admins)
      if (!admin.isEmailVerified && admin.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: 'Email not verified. Please contact super admin.'
        });
      }

      // Reset login attempts on successful login
      await admin.resetLoginAttempts();

      // Update last activity
      admin.lastActivity = new Date();
      
      // Track IP address
      const clientIP = req.ip || req.connection.remoteAddress;
      if (!admin.ipAddresses.includes(clientIP)) {
        admin.ipAddresses.push(clientIP);
        if (admin.ipAddresses.length > 10) {
          admin.ipAddresses = admin.ipAddresses.slice(-10);
        }
      }
      
      await admin.save();

      // Generate tokens
      const tokenExpiry = rememberMe ? '30d' : '8h';
      const accessToken = generateToken(admin._id, tokenExpiry);
      const refreshToken = generateRefreshToken(admin._id);

      // Set secure HTTP-only cookie for refresh token
      res.cookie('adminRefreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          admin: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions,
            avatar: admin.avatar,
            department: admin.department
          },
          accessToken,
          expiresIn: tokenExpiry
        }
      });

    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed due to server error'
      });
    }
  }
);

// Admin Logout
router.post('/logout', async (req, res) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('adminRefreshToken');
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// Refresh Token
router.post('/refresh-token', async (req, res) => {
  try {
    const refreshToken = req.cookies.adminRefreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not provided'
      });
    }

    // Verify refresh token
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find admin
    const admin = await Admin.findById(decoded.userId).select('-password');
    
    if (!admin || admin.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const accessToken = generateToken(admin._id, '8h');
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken,
        expiresIn: '8h'
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// Get Admin Profile
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.userId).select('-password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      data: admin
    });

  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// Change Password
router.post('/change-password',
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Access token required'
        });
      }

      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const admin = await Admin.findById(decoded.userId);

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found'
        });
      }

      const { currentPassword, newPassword } = req.body;

      // Verify current password
      if (!(await admin.comparePassword(currentPassword))) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      admin.password = newPassword;
      await admin.save();

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password'
      });
    }
  }
);

module.exports = router;
