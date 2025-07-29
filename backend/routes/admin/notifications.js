const express = require('express');
const router = express.Router();
const { Notification, UserNotification } = require('../../models/Notification');
const Tournament = require('../../models/Tournament');
const User = require('../../models/User');
const { authenticateAdmin } = require('../../middleware/adminAuth');

// Get all notifications
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const notifications = await Notification.find()
      .populate('createdBy', 'name')
      .populate('targetTournament', 'title')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create notification
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      targetAudience,
      targetUsers,
      targetTournament,
      priority,
      scheduledAt,
      expiresAt
    } = req.body;

    const notification = new Notification({
      title,
      message,
      type,
      targetAudience,
      targetUsers,
      targetTournament,
      priority,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: req.admin._id,
      status: scheduledAt ? 'scheduled' : 'draft'
    });

    await notification.save();
    
    // Emit Socket.IO events for real-time updates
    const io = req.app.get('io');
    if (io) {
      console.log('Emitting notificationAdded event:', notification._id);
      io.emit('notificationAdded', notification);
    }

    // If no scheduling, send immediately
    if (!scheduledAt) {
      await sendNotification(notification);
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update notification
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    if (notification.status === 'sent') {
      return res.status(400).json({
        success: false,
        error: 'Cannot edit sent notification'
      });
    }

    Object.assign(notification, req.body);
    await notification.save();
    
    // Emit Socket.IO events for real-time updates
    const io = req.app.get('io');
    if (io) {
      console.log('Emitting notificationUpdated event:', notification._id);
      io.emit('notificationUpdated', notification);
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Send notification
router.post('/:id/send', authenticateAdmin, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    if (notification.status === 'sent') {
      return res.status(400).json({
        success: false,
        error: 'Notification already sent'
      });
    }

    await sendNotification(notification);
    
    // Emit Socket.IO events for real-time updates
    const io = req.app.get('io');
    if (io) {
      console.log('Emitting notificationSent event:', notification._id);
      io.emit('notificationSent', notification);
      // Also emit to all users for frontend notifications
      io.emit('newNotification', notification);
    }

    res.json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        notification: notification,
        totalRecipients: notification.totalRecipients
      }
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete notification
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // Delete associated user notifications
    await UserNotification.deleteMany({ notification: req.params.id });
    
    // Delete the notification
    await Notification.findByIdAndDelete(req.params.id);
    
    // Emit Socket.IO events for real-time updates
    const io = req.app.get('io');
    if (io) {
      console.log('Emitting notificationDeleted event:', req.params.id);
      io.emit('notificationDeleted', req.params.id);
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function to send notification
async function sendNotification(notification) {
  let recipients = [];

  switch (notification.targetAudience) {
    case 'all_users':
      recipients = await User.find({ isActive: true }).select('_id');
      break;
      
    case 'tournament_participants':
      if (notification.targetTournament) {
        const tournament = await Tournament.findById(notification.targetTournament)
          .populate('participants.user');
        recipients = tournament.participants.map(p => ({ _id: p.user._id }));
      }
      break;
      
    case 'specific_users':
      recipients = notification.targetUsers.map(id => ({ _id: id }));
      break;
  }

  // Create user notifications
  const userNotifications = recipients.map(user => ({
    user: user._id,
    notification: notification._id,
    deliveryStatus: 'delivered',
    deliveredAt: new Date()
  }));

  if (userNotifications.length > 0) {
    await UserNotification.insertMany(userNotifications);
  }

  // Update notification status
  notification.status = 'sent';
  notification.totalRecipients = recipients.length;
  notification.deliveryStats.delivered = recipients.length;
  await notification.save();

  return notification;
}

module.exports = router;