/**
 * Authentication Middleware for GameOn Platform
 * Handles JWT token validation and user authentication
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT Token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password -otp');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    if (user.status === 'banned' || user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account has been suspended or banned'
      });
    }

    if (user.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to failed login attempts'
      });
    }

    // Update last login and IP
    const clientIP = req.ip || req.connection.remoteAddress;
    if (!user.security.ipAddresses.includes(clientIP)) {
      user.security.ipAddresses.push(clientIP);
      if (user.security.ipAddresses.length > 10) {
        user.security.ipAddresses = user.security.ipAddresses.slice(-10);
      }
    }
    user.security.lastLogin = new Date();
    await user.save();

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password -otp');
      
      if (user && user.status === 'active' && !user.isLocked) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Ignore token errors for optional auth
    next();
  }
};

// Check if user is verified
const requireVerification = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your account first'
    });
  }
  next();
};

// Check if user has admin role
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has admin privileges
    // This would depend on your admin model structure
    // For now, checking if user has admin role in a separate field
    const adminUser = await User.findById(req.user._id);
    if (!adminUser.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin privileges required'
      });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization error'
    });
  }
};

// Check if user owns the resource or is admin
const requireOwnershipOrAdmin = (resourceUserIdField = 'userId') => {
  return async (req, res, next) => {
    try {
      const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
      
      // Check if user owns the resource
      if (req.user._id.toString() === resourceUserId) {
        return next();
      }

      // Check if user is admin
      const adminUser = await User.findById(req.user._id);
      if (adminUser.isAdmin) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied - insufficient permissions'
      });
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization error'
      });
    }
  };
};

// Rate limiting for sensitive operations
const rateLimiter = (windowMs = 15 * 60 * 1000, maxAttempts = 5) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip + ':' + (req.user ? req.user._id : 'anonymous');
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    const userAttempts = attempts.get(key) || [];
    const recentAttempts = userAttempts.filter(timestamp => timestamp > windowStart);

    if (recentAttempts.length >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((recentAttempts[0] + windowMs - now) / 1000)
      });
    }

    // Record this attempt
    recentAttempts.push(now);
    attempts.set(key, recentAttempts);

    next();
  };
};

// Generate JWT Token
const generateToken = (userId, expiresIn = '7d') => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn });
};

// Generate Refresh Token
const generateRefreshToken = (userId) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET environment variable is not set');
  }
  return jwt.sign({ userId, type: 'refresh' }, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireVerification,
  requireAdmin,
  requireOwnershipOrAdmin,
  rateLimiter,
  generateToken,
  generateRefreshToken
};
