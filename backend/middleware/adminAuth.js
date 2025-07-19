/**
 * Admin Authentication Middleware
 * Handles admin authentication and permission checking
 */

const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Verify Admin Token
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Admin access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.userId).select('-password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - admin not found'
      });
    }

    if (admin.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Admin account is not active'
      });
    }

    if (admin.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Admin account is temporarily locked'
      });
    }

    // Update last activity
    admin.lastActivity = new Date();
    await admin.save();

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Admin token has expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin token'
      });
    }

    console.error('Admin auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin authentication error'
    });
  }
};

// Check Admin Permission
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: 'Admin authentication required'
        });
      }

      if (!req.admin.hasPermission(permission)) {
        return res.status(403).json({
          success: false,
          message: `Permission required: ${permission}`
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed'
      });
    }
  };
};

// Check Admin Role
const requireRole = (role) => {
  return async (req, res, next) => {
    try {
      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: 'Admin authentication required'
        });
      }

      if (req.admin.role !== role && req.admin.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: `Admin role required: ${role}`
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Role check failed'
      });
    }
  };
};

// Check if Super Admin
const requireSuperAdmin = async (req, res, next) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin authentication required'
      });
    }

    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin privileges required'
      });
    }

    next();
  } catch (error) {
    console.error('Super admin check error:', error);
    res.status(500).json({
      success: false,
      message: 'Super admin check failed'
    });
  }
};

// Audit Log Middleware
const auditLog = (action) => {
  return async (req, res, next) => {
    try {
      // Create audit log entry
      const auditEntry = {
        adminId: req.admin._id,
        adminName: req.admin.name,
        action,
        resource: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        requestData: req.method === 'POST' || req.method === 'PUT' ? req.body : req.query
      };

      // Store audit log (you might want to create a separate AuditLog model)
      console.log('Admin Audit Log:', auditEntry);
      
      // Continue with the request
      next();
    } catch (error) {
      console.error('Audit log error:', error);
      // Don't fail the request due to audit log issues
      next();
    }
  };
};

// Rate limiting for admin actions
const adminRateLimit = (windowMs = 60 * 1000, max = 100) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.admin._id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    const adminAttempts = attempts.get(key) || [];
    const recentAttempts = adminAttempts.filter(timestamp => timestamp > windowStart);

    if (recentAttempts.length >= max) {
      return res.status(429).json({
        success: false,
        message: 'Too many admin actions. Please slow down.',
        retryAfter: Math.ceil((recentAttempts[0] + windowMs - now) / 1000)
      });
    }

    // Record this attempt
    recentAttempts.push(now);
    attempts.set(key, recentAttempts);

    next();
  };
};

module.exports = {
  authenticateAdmin,
  requirePermission,
  requireRole,
  requireSuperAdmin,
  auditLog,
  adminRateLimit
};
