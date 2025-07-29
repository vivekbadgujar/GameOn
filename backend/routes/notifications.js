const express = require('express');
const router = express.Router();
const { Notification, UserNotification } = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');

// Get user notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user-specific notifications
    const userNotifications = await UserNotification.find({ user: userId })
      .populate({
        path: 'notification',
        match: { status: 'sent' },
        populate: {
          path: 'targetTournament',
          select: 'title'
        }
      })
      .sort({ createdAt: -1 })
      .limit(50);

    // Filter out null notifications (where populate didn't match)
    const validNotifications = userNotifications
      .filter(un => un.notification)
      .map(un => ({
        _id: un.notification._id,
        title: un.notification.title,
        message: un.notification.message,
        type: un.notification.type,
        priority: un.notification.priority,
        targetTournament: un.notification.targetTournament,
        isRead: un.isRead,
        readAt: un.readAt,
        deliveredAt: un.deliveredAt,
        createdAt: un.notification.createdAt
      }));

    res.json({
      success: true,
      notifications: validNotifications,
      total: validNotifications.length
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
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const notificationId = req.params.id;

    const userNotification = await UserNotification.findOneAndUpdate(
      { user: userId, notification: notificationId },
      { 
        isRead: true, 
        readAt: new Date() 
      },
      { new: true }
    );

    if (!userNotification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
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
router.patch('/mark-all-read', authenticateToken, async (req, res) => {
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

// Get unread notification count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const count = await UserNotification.countDocuments({
      user: userId,
      isRead: false
    });

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;