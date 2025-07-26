const express = require('express');
const { body, validationResult } = require('express-validator');
const Notification = require('../../models/Notification');
const User = require('../../models/User');
const Tournament = require('../../models/Tournament');
const { authenticateAdmin, requirePermission, auditLog } = require('../../middleware/adminAuth');
const router = express.Router();

// Middleware to protect all admin broadcast routes
router.use(authenticateAdmin);

// Get broadcast history
router.get('/history', 
  requirePermission('notifications_manage'),
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const notifications = await Notification.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'username email')
        .lean();

      const total = await Notification.countDocuments({});

      res.json({
        success: true,
        data: notifications,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      });
    } catch (error) {
      console.error('Error fetching broadcast history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch broadcast history'
      });
    }
  }
);

// Send broadcast message
router.post('/send', 
  requirePermission('notifications_manage'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('type').isIn(['tournament_announcement', 'system_maintenance', 'general_update', 'promotional', 'security_alert']).withMessage('Invalid notification type'),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority level'),
    body('targetAudience').optional().isIn(['all_users', 'tournament_participants', 'specific_users', 'college_specific']).withMessage('Invalid target audience')
  ],
  auditLog('send_broadcast'),
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

      const { title, message, type, priority = 'normal', targetAudience = 'all_users', targetUsers = [], targetCollege, targetTournament, imageUrl, actionUrl, actionText } = req.body;

      // Create notification
      const notification = new Notification({
        title,
        message,
        type,
        priority,
        targetAudience,
        targetUsers,
        targetCollege,
        targetTournament,
        imageUrl,
        actionUrl,
        actionText,
        status: 'sent',
        createdBy: req.admin._id
      });

      await notification.save();

      // Get recipient count based on target audience
      let recipientCount = 0;
      if (targetAudience === 'all_users') {
        recipientCount = await User.countDocuments({ status: 'active' });
      } else if (targetAudience === 'tournament_participants' && targetTournament) {
        const tournament = await Tournament.findById(targetTournament);
        recipientCount = tournament ? tournament.currentParticipants : 0;
      } else if (targetAudience === 'specific_users') {
        recipientCount = targetUsers.length;
      } else if (targetAudience === 'college_specific' && targetCollege) {
        recipientCount = await User.countDocuments({ 
          status: 'active',
          'profile.college': targetCollege 
        });
      }

      // Update notification with recipient count
      notification.totalRecipients = recipientCount;
      await notification.save();

      // Emit Socket.IO event for real-time updates
      req.app.get('io').emit('broadcastSent', {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        sentAt: notification.createdAt
      });

      res.json({
        success: true,
        message: 'Broadcast sent successfully',
        data: {
          ...notification.toObject(),
          recipients: recipientCount
        }
      });
    } catch (error) {
      console.error('Error sending broadcast:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send broadcast'
      });
    }
  }
);

// Schedule broadcast message
router.post('/schedule', 
  requirePermission('notifications_manage'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('type').isIn(['tournament_announcement', 'system_maintenance', 'general_update', 'promotional', 'security_alert']).withMessage('Invalid notification type'),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']).withMessage('Invalid priority level'),
    body('scheduledAt').isISO8601().withMessage('Valid scheduled date is required'),
    body('targetAudience').optional().isIn(['all_users', 'tournament_participants', 'specific_users', 'college_specific']).withMessage('Invalid target audience')
  ],
  auditLog('schedule_broadcast'),
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

      const { title, message, type, priority = 'normal', scheduledAt, targetAudience = 'all_users', targetUsers = [], targetCollege, targetTournament, imageUrl, actionUrl, actionText } = req.body;

      // Create scheduled notification
      const notification = new Notification({
        title,
        message,
        type,
        priority,
        targetAudience,
        targetUsers,
        targetCollege,
        targetTournament,
        imageUrl,
        actionUrl,
        actionText,
        scheduledAt: new Date(scheduledAt),
        status: 'scheduled',
        createdBy: req.admin._id
      });

      await notification.save();

      res.json({
        success: true,
        message: 'Broadcast scheduled successfully',
        data: notification
      });
    } catch (error) {
      console.error('Error scheduling broadcast:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule broadcast'
      });
    }
  }
);

// Cancel scheduled broadcast
router.delete('/:id', 
  requirePermission('notifications_manage'),
  auditLog('cancel_broadcast'),
  async (req, res) => {
    try {
      const notification = await Notification.findById(req.params.id);
      
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Broadcast not found'
        });
      }

      if (notification.status !== 'scheduled') {
        return res.status(400).json({
          success: false,
          message: 'Can only cancel scheduled broadcasts'
        });
      }

      notification.status = 'cancelled';
      await notification.save();

      res.json({
        success: true,
        message: 'Broadcast cancelled successfully'
      });
    } catch (error) {
      console.error('Error cancelling broadcast:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel broadcast'
      });
    }
  }
);

module.exports = router; 