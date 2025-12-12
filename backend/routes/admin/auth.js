/**
 * Admin Authentication Routes
 * Handles admin login, logout, and session management
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const Admin = require('../../models/Admin');
const { generateToken, generateRefreshToken } = require('../../middleware/auth');

const router = express.Router();

// Rate limiting for admin login (relaxed for development)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // More attempts in development
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin Login
router.post('/login', 
  loginLimiter, // Re-enabled with relaxed limits for development
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
    const startTime = Date.now();
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('Admin login validation failed:', errors.array());
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password, rememberMe = false } = req.body;
      
      console.log('[ADMIN LOGIN] Attempt started for:', email);

      // Find admin by email
      let admin;
      try {
        admin = await Admin.findOne({ 
          email: email.toLowerCase(),
          status: 'active'
        });
        console.log('[ADMIN LOGIN] Admin lookup result:', admin ? 'Found' : 'Not found');
      } catch (dbError) {
        console.error('[ADMIN LOGIN] Database error during admin lookup:', dbError.message);
        return res.status(500).json({
          success: false,
          message: 'Database error during authentication'
        });
      }

      if (!admin) {
        console.warn('[ADMIN LOGIN] Admin not found for email:', email);
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if account is locked BEFORE password comparison
      if (admin.isLocked) {
        console.warn('[ADMIN LOGIN] Account locked for:', email);
        return res.status(423).json({
          success: false,
          message: 'Account is temporarily locked due to multiple failed login attempts'
        });
      }

      // Check if email is verified (for new admins)
      if (!admin.isEmailVerified && admin.role !== 'super_admin') {
        console.warn('[ADMIN LOGIN] Email not verified for:', email);
        return res.status(403).json({
          success: false,
          message: 'Email not verified. Please contact super admin.'
        });
      }

      // Now compare password
      let passwordMatch;
      try {
        console.log('[ADMIN LOGIN] Starting password comparison...');
        passwordMatch = await admin.comparePassword(password);
        console.log('[ADMIN LOGIN] Password comparison result:', passwordMatch);

        if (!passwordMatch) {
          // Check if password is plaintext (not hashed with bcrypt)
          if (admin.password && !admin.password.startsWith('$2')) {
            console.error('[ADMIN LOGIN] ⚠️ WARNING: Password in database appears to be plaintext (not bcrypt hashed)');
            console.error('[ADMIN LOGIN] Admin:', email);
            console.error('[ADMIN LOGIN] MANUAL INTERVENTION REQUIRED: Password needs to be hashed before login can work');
            // Still fail the login
            await admin.incrementLoginAttempts();
            return res.status(401).json({
              success: false,
              message: 'Invalid credentials'
            });
          }
          
          await admin.incrementLoginAttempts();
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }
      } catch (bcryptError) {
        console.error('[ADMIN LOGIN] Error during password comparison:', bcryptError.message);
        console.error('[ADMIN LOGIN] Error stack:', bcryptError.stack);
        await admin.incrementLoginAttempts();
        return res.status(500).json({
          success: false,
          message: 'Authentication service error'
        });
      }

      // Reset login attempts on successful password match
      try {
        await admin.resetLoginAttempts();
        console.log('[ADMIN LOGIN] Login attempts reset for:', email);
      } catch (resetError) {
        console.error('[ADMIN LOGIN] Error resetting login attempts:', resetError.message);
      }

      // Update last activity and track IP
      try {
        admin.lastActivity = new Date();
        
        // Track IP address
        const clientIP = req.ip || req.connection.remoteAddress;
        if (!admin.ipAddresses) {
          admin.ipAddresses = [];
        }
        if (!admin.ipAddresses.includes(clientIP)) {
          admin.ipAddresses.push(clientIP);
          if (admin.ipAddresses.length > 10) {
            admin.ipAddresses = admin.ipAddresses.slice(-10);
          }
        }
        
        await admin.save();
        console.log('[ADMIN LOGIN] Admin profile updated for:', email);
      } catch (updateError) {
        console.error('[ADMIN LOGIN] Error updating admin profile:', updateError.message);
      }

      // Generate JWT token with 7 days expiry
      const tokenExpiry = rememberMe ? '30d' : '7d';
      
      if (!process.env.JWT_SECRET) {
        console.error('[ADMIN LOGIN] ❌ CRITICAL: JWT_SECRET environment variable is NOT set');
        return res.status(500).json({
          success: false,
          message: 'Server configuration error - authentication service unavailable'
        });
      }

      let accessToken;
      try {
        // Explicitly use jwt.sign as requested
        accessToken = jwt.sign(
          { userId: admin._id }, 
          process.env.JWT_SECRET, 
          { expiresIn: tokenExpiry }
        );
        console.log('[ADMIN LOGIN] Access token generated with expiry:', tokenExpiry);
      } catch (tokenError) {
        console.error('[ADMIN LOGIN] ❌ ADMIN TOKEN ERROR:', tokenError);
        return res.status(500).json({
          success: false,
          message: 'Failed to generate authentication token'
        });
      }

      // Generate refresh token only if JWT_REFRESH_SECRET is available
      let refreshToken = null;
      if (process.env.JWT_REFRESH_SECRET) {
        try {
          refreshToken = jwt.sign(
            { userId: admin._id, type: 'refresh' }, 
            process.env.JWT_REFRESH_SECRET, 
            { expiresIn: '30d' }
          );
          console.log('[ADMIN LOGIN] Refresh token generated');
        } catch (refreshError) {
          console.error('[ADMIN LOGIN] Error generating refresh token:', refreshError.message);
        }
      }

      // Set secure HTTP-only cookie for main admin token
      try {
        const cookieOptions = {
          httpOnly: true,
          secure: true, // Production only as requested, but forcing true for now as per instructions "secure: true (production only)" - assuming we are targeting production behavior
          sameSite: 'None',
          domain: '.gameonesport.xyz',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        };
        
        // Adjust secure flag based on environment if needed, but instructions said "secure: true (production only)"
        // We'll use the environment check to be safe for local dev if not on https
        if (process.env.NODE_ENV !== 'production') {
           // cookieOptions.secure = false; // Uncomment if testing locally without https
           // cookieOptions.domain = undefined; // Uncomment if testing locally
        }

        res.cookie('gameon_admin_token', accessToken, cookieOptions);
        console.log('[ADMIN LOGIN] gameon_admin_token cookie set');
      } catch (cookieError) {
        console.error('[ADMIN LOGIN] Error setting main cookie:', cookieError.message);
      }

      // Set secure HTTP-only cookie for refresh token (only if available)
      if (refreshToken) {
        try {
          res.cookie('adminRefreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'None',
            domain: '.gameonesport.xyz',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
          });
          console.log('[ADMIN LOGIN] adminRefreshToken cookie set');
        } catch (refreshCookieError) {
          console.error('[ADMIN LOGIN] Error setting refresh token cookie:', refreshCookieError.message);
        }
      }

      console.log('[ADMIN LOGIN] ✅ Login successful for:', email, '| Duration:', Date.now() - startTime, 'ms');

      res.json({
        success: true,
        message: 'Login successful',
        token: accessToken,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
          avatar: admin.avatar,
          department: admin.department
        }
      });

    } catch (error) {
      console.error('[ADMIN LOGIN] ❌ FATAL LOGIN ERROR:', error.message);
      console.error('[ADMIN LOGIN] Error type:', error.constructor.name);
      console.error('[ADMIN LOGIN] Error stack:', error.stack);
      console.error('[ADMIN LOGIN] Request email:', req.body?.email);
      
      res.status(500).json({
        success: false,
        message: 'Login failed due to server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    if (!process.env.JWT_REFRESH_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Refresh token functionality not configured'
      });
    }
    
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

// Check Authentication Status
router.get('/check', async (req, res) => {
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
      admin: admin
    });

  } catch (error) {
    console.error('Auth check error:', error);
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
