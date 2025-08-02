/**
 * User Notifications Routes
 * Handles user-facing notification functionality
 */

const express = require('express');
const router = express.Router();
const { Notification, UserNotification } = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');

// Get notifications (public endpoint for basic notifications)
router.get('/', async (req, res) => {
  try {
    // Return basic system notifications or empty array for unauthenticated users
    const notifications = await Notification.find({
      type: 'system_announcement',
      status: 'sent',
      targetAudience: 'all_users'
    })
    .select('title message type priority createdAt')
    .sort({ createdAt: -1 })
    .limit(10);

    res.json({
      success: true,
      data: notifications,
      unreadCount: 0 // For unauthenticated users
    });
  } catch (error) {
    console.error('Error fetching public notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
});

// Get user notifications
router.get('/user/notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user notifications with populated notification data
    const userNotifications = await UserNotification.find({ user: userId })
      .populate({
        path: 'notification',
        match: { status: 'sent' }, // Only sent notifications
        populate: {
          path: 'targetTournament',
          select: 'title game'
        }
      })
      .sort({ createdAt: -1 })
      .limit(50);

    // Filter out notifications where the notification was deleted
    const validNotifications = userNotifications.filter(un => un.notification);
    
    // Count unread notifications
    const unreadCount = validNotifications.filter(un => !un.isRead).length;
    
    // Format notifications for frontend
    const notifications = validNotifications.map(un => ({
      _id: un._id,
      title: un.notification.title,
      message: un.notification.message,
      type: un.notification.type,
      priority: un.notification.priority,
      isRead: un.isRead,
      readAt: un.readAt,
      createdAt: un.createdAt,
      tournament: un.notification.targetTournament,
      expiresAt: un.notification.expiresAt
    }));

    res.json({
      success: true,
      notifications,
      unreadCount,
      total: notifications.length
    });
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mark notification as read
router.patch('/user/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const notificationId = req.params.id;
    
    const userNotification = await UserNotification.findOne({
      _id: notificationId,
      user: userId
    });
    
    if (!userNotification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
    
    if (!userNotification.isRead) {
      userNotification.isRead = true;
      userNotification.readAt = new Date();
      await userNotification.save();
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mark all notifications as read
router.patch('/user/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    await UserNotification.updateMany(
      { user: userId, isRead: false },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get notification count
router.get('/user/notifications/count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const unreadCount = await UserNotification.countDocuments({
      user: userId,
      isRead: false
    });
    
    res.json({
      success: true,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;