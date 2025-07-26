const express = require('express');
const { body, validationResult } = require('express-validator');
const AIFlag = require('../../models/AIFlag');
const User = require('../../models/User');
const Tournament = require('../../models/Tournament');
const { authenticateAdmin, requirePermission, auditLog } = require('../../middleware/adminAuth');
const router = express.Router();

// Middleware to protect all admin AI routes
router.use(authenticateAdmin);

// Get suspicious activity
router.get('/suspicious', 
  requirePermission('ai_monitoring'),
  async (req, res) => {
    try {
      const { status, severity, page = 1, limit = 10 } = req.query;
      
      const filter = { type: 'suspicious_activity' };
      if (status) filter.status = status;
      if (severity) filter.severity = severity;
      
      const skip = (page - 1) * limit;
      
      const suspiciousActivity = await AIFlag.find(filter)
        .populate('user', 'username displayName email')
        .populate('tournament', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
      
      const total = await AIFlag.countDocuments(filter);
      
      res.json({
        success: true,
        data: suspiciousActivity,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching suspicious activity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch suspicious activity'
      });
    }
  }
);

// Get hacker detection
router.get('/hackers', 
  requirePermission('ai_monitoring'),
  async (req, res) => {
    try {
      const { status, hackType, page = 1, limit = 10 } = req.query;
      
      const filter = { type: 'hack_detection' };
      if (status) filter.status = status;
      if (hackType) filter.details.hackType = hackType;
      
      const skip = (page - 1) * limit;
      
      const hackerDetection = await AIFlag.find(filter)
        .populate('user', 'username displayName email')
        .populate('tournament', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
      
      const total = await AIFlag.countDocuments(filter);
      
      res.json({
        success: true,
        data: hackerDetection,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching hacker detection:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch hacker detection'
      });
    }
  }
);

// Get violations
router.get('/violations', 
  requirePermission('ai_monitoring'),
  async (req, res) => {
    try {
      const { status, violationType, page = 1, limit = 10 } = req.query;
      
      const filter = { type: 'violation' };
      if (status) filter.status = status;
      if (violationType) filter.details.violationType = violationType;
      
      const skip = (page - 1) * limit;
      
      const violations = await AIFlag.find(filter)
        .populate('user', 'username displayName email')
        .populate('tournament', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
      
      const total = await AIFlag.countDocuments(filter);
      
      res.json({
        success: true,
        data: violations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching violations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch violations'
      });
    }
  }
);

// Flag user
router.post('/flag-user', 
  requirePermission('ai_monitoring'),
  [
    body('userId').isMongoId().withMessage('Valid user ID is required'),
    body('reason').notEmpty().withMessage('Flag reason is required'),
    body('type').isIn(['suspicious_activity', 'hack_detection', 'violation']).withMessage('Invalid flag type'),
    body('severity').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level'),
    body('details').optional().isObject().withMessage('Details must be an object')
  ],
  auditLog('flag_user_ai'),
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

      const { userId, reason, type, severity = 'medium', details = {}, tournamentId } = req.body;
      
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Create AI flag
      const aiFlag = new AIFlag({
        user: userId,
        tournament: tournamentId,
        type,
        reason,
        severity,
        details,
        status: 'pending',
        flaggedBy: req.admin._id
      });
      
      await aiFlag.save();
      
      // Emit Socket.IO event for real-time updates
      req.app.get('io').emit('userFlagged', {
        userId,
        type,
        severity,
        reason
      });
      
      res.json({
        success: true,
        message: 'User flagged successfully',
        data: aiFlag
      });
    } catch (error) {
      console.error('Error flagging user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to flag user'
      });
    }
  }
);

// Update flag status
router.patch('/:id/status', 
  requirePermission('ai_monitoring'),
  [
    body('status').isIn(['pending', 'investigating', 'resolved', 'false_positive']).withMessage('Invalid status'),
    body('adminNotes').optional().isString().withMessage('Admin notes must be a string')
  ],
  auditLog('update_ai_flag_status'),
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

      const { status, adminNotes } = req.body;
      const aiFlag = await AIFlag.findById(req.params.id);
      
      if (!aiFlag) {
        return res.status(404).json({
          success: false,
          message: 'AI flag not found'
        });
      }
      
      aiFlag.status = status;
      if (adminNotes) aiFlag.adminNotes = adminNotes;
      aiFlag.reviewedBy = req.admin._id;
      aiFlag.reviewedAt = new Date();
      
      await aiFlag.save();
      
      res.json({
        success: true,
        message: 'AI flag status updated successfully',
        data: aiFlag
      });
    } catch (error) {
      console.error('Error updating AI flag status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update AI flag status'
      });
    }
  }
);

// Get AI suggestions
router.get('/suggestions', 
  requirePermission('ai_monitoring'),
  async (req, res) => {
    try {
      const { type, priority } = req.query;
      
      // Generate AI suggestions based on current data
      const suggestions = [];
      
      // Get recent flags for analysis
      const recentFlags = await AIFlag.find({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }).populate('user');
      
      // Analyze patterns and generate suggestions
      const highSeverityFlags = recentFlags.filter(flag => flag.severity === 'high' || flag.severity === 'critical');
      const suspiciousUsers = recentFlags.filter(flag => flag.type === 'suspicious_activity');
      const hackDetections = recentFlags.filter(flag => flag.type === 'hack_detection');
      
      if (highSeverityFlags.length > 10) {
        suggestions.push({
          type: 'security',
          title: 'Increase monitoring frequency',
          description: `High number of critical flags (${highSeverityFlags.length}) detected in the last week`,
          priority: 'high',
          impact: 'Prevents potential security breaches',
          implementation: 'Easy - adjust AI monitoring parameters'
        });
      }
      
      if (suspiciousUsers.length > 20) {
        suggestions.push({
          type: 'security',
          title: 'Implement stricter verification',
          description: `High number of suspicious activities (${suspiciousUsers.length}) detected`,
          priority: 'medium',
          impact: 'Reduces false positives and improves detection accuracy',
          implementation: 'Medium - update verification algorithms'
        });
      }
      
      if (hackDetections.length > 5) {
        suggestions.push({
          type: 'security',
          title: 'Enhance anti-cheat system',
          description: `Multiple hack detections (${hackDetections.length}) in the last week`,
          priority: 'high',
          impact: 'Maintains fair gameplay and user trust',
          implementation: 'Hard - requires system-wide updates'
        });
      }
      
      // Filter suggestions based on query parameters
      let filteredSuggestions = suggestions;
      if (type) {
        filteredSuggestions = filteredSuggestions.filter(suggestion => suggestion.type === type);
      }
      if (priority) {
        filteredSuggestions = filteredSuggestions.filter(suggestion => suggestion.priority === priority);
      }
      
      res.json({
        success: true,
        data: filteredSuggestions
      });
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch AI suggestions'
      });
    }
  }
);

// Get AI analytics
router.get('/analytics', 
  requirePermission('ai_monitoring'),
  async (req, res) => {
    try {
      const { timeRange = '7d' } = req.query;
      
      let startDate;
      switch (timeRange) {
        case '24h':
          startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      }
      
      const flags = await AIFlag.find({
        createdAt: { $gte: startDate }
      });
      
      const analytics = {
        totalFlags: flags.length,
        byType: {
          suspicious_activity: flags.filter(f => f.type === 'suspicious_activity').length,
          hack_detection: flags.filter(f => f.type === 'hack_detection').length,
          violation: flags.filter(f => f.type === 'violation').length
        },
        bySeverity: {
          low: flags.filter(f => f.severity === 'low').length,
          medium: flags.filter(f => f.severity === 'medium').length,
          high: flags.filter(f => f.severity === 'high').length,
          critical: flags.filter(f => f.severity === 'critical').length
        },
        byStatus: {
          pending: flags.filter(f => f.status === 'pending').length,
          investigating: flags.filter(f => f.status === 'investigating').length,
          resolved: flags.filter(f => f.status === 'resolved').length,
          false_positive: flags.filter(f => f.status === 'false_positive').length
        },
        timeRange
      };
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error fetching AI analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch AI analytics'
      });
    }
  }
);

module.exports = router; 