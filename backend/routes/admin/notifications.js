/**
 * Admin Notifications Routes
 * Handles broadcasting notifications to users
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Notification = require('../../models/Notification');
const User = require('../../models/User');
const { authenticateAdmin, requirePermission } = require('../../middleware/adminAuth');
const router = express.Router();

// Middleware to protect all admin notification routes
router.use(authenticateAdmin);

// Get all notifications created by admins
router.get('/', requirePermission('notifications_manage'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Find all broadcast notifications
    const notifications = await Notification.find({ type: 'broadcast' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Notification.countDocuments({ type: 'broadcast' });
    
    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// Broadcast a notification to all users
router.post('/broadcast', 
  requirePermission('notifications_manage'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('priority').isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
    body('link').optional().isURL().withMessage('Link must be a valid URL'),
    body('expiresAt').optional().isISO8601().withMessage('Expiry date must be a valid date')
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const { title, message, priority, link, expiresAt } = req.body;
      
      // Create a broadcast notification template
      const broadcastNotification = new Notification({
        type: 'broadcast',
        title,
        message,
        priority,
        link,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: req.admin._id,
        isAdminGenerated: true
      });
      
      await broadcastNotification.save();
      
      // Get all active users
      const users = await User.find({ status: 'active' }).select('_id');
      
      // Create individual notifications for each user
      const userNotifications = users.map(user => ({
        type: 'system',
        title,
        message,
        priority,
        link,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        user: user._id,
        isAdminGenerated: true,
        broadcastId: broadcastNotification._id
      }));
      
      // Insert all notifications in bulk
      if (userNotifications.length > 0) {
        await Notification.insertMany(userNotifications);
      }
      
      res.status(201).json({
        success: true,
        message: `Notification broadcast to ${users.length} users`,
        data: {
          notification: broadcastNotification,
          recipientCount: users.length
        }
      });
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to broadcast notification',
        error: error.message
      });
    }
  }
);

// Delete a broadcast notification
router.delete('/:id', requirePermission('notifications_manage'), async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    // Find the broadcast notification
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    if (notification.type !== 'broadcast') {
      return res.status(400).json({
        success: false,
        message: 'Only broadcast notifications can be deleted through this endpoint'
      });
    }
    
    // Delete the broadcast notification
    await Notification.findByIdAndDelete(notificationId);
    
    // Delete all user notifications associated with this broadcast
    const deleteResult = await Notification.deleteMany({ broadcastId: notificationId });
    
    res.json({
      success: true,
      message: 'Broadcast notification deleted successfully',
      data: {
        deletedUserNotifications: deleteResult.deletedCount
      }
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
});

// Send notification to specific users
router.post('/targeted', 
  requirePermission('notifications_manage'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('priority').isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
    body('userIds').isArray().withMessage('User IDs must be an array'),
    body('userIds.*').isMongoId().withMessage('Invalid user ID format'),
    body('link').optional().isURL().withMessage('Link must be a valid URL'),
    body('expiresAt').optional().isISO8601().withMessage('Expiry date must be a valid date')
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const { title, message, priority, userIds, link, expiresAt } = req.body;
      
      // Verify all users exist
      const users = await User.find({ _id: { $in: userIds } }).select('_id');
      
      if (users.length !== userIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more user IDs are invalid'
        });
      }
      
      // Create individual notifications for each user
      const notifications = users.map(user => ({
        type: 'system',
        title,
        message,
        priority,
        link,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        user: user._id,
        isAdminGenerated: true,
        createdBy: req.admin._id
      }));
      
      // Insert all notifications in bulk
      const result = await Notification.insertMany(notifications);
      
      res.status(201).json({
        success: true,
        message: `Notification sent to ${users.length} users`,
        data: {
          notificationCount: result.length,
          recipients: users.map(u => u._id)
        }
      });
    } catch (error) {
      console.error('Error sending targeted notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send notifications',
        error: error.message
      });
    }
  }
);

module.exports = router;