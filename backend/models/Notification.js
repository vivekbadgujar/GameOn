/**
 * Notification Model for GameOn Platform
 * Handles admin notifications and user notifications
 */

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  
  // Type and Category
  type: {
    type: String,
    enum: [
      'tournament_announcement',
      'system_maintenance', 
      'reward_distributed',
      'tournament_result',
      'general_update',
      'promotional',
      'security_alert'
    ],
    required: true
  },
  
  // Targeting
  targetAudience: {
    type: String,
    enum: ['all_users', 'tournament_participants', 'specific_users', 'college_specific'],
    default: 'all_users'
  },
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  targetCollege: String,
  targetTournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament'
  },
  
  // Content
  imageUrl: String,
  actionUrl: String, // Deep link or web URL
  actionText: String, // "Join Now", "View Details", etc.
  
  // Scheduling
  scheduledAt: Date,
  expiresAt: Date,
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sent', 'cancelled'],
    default: 'draft'
  },
  
  // Analytics
  totalRecipients: {
    type: Number,
    default: 0
  },
  deliveryStats: {
    delivered: { type: Number, default: 0 },
    viewed: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    failed: { type: Number, default: 0 }
  },
  
  // Creator
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Metadata
  metadata: {
    platform: {
      type: [String],
      enum: ['web', 'mobile', 'email', 'sms'],
      default: ['web', 'mobile']
    },
    tags: [String]
  }
}, {
  timestamps: true
});

// User Notification Schema (for individual user notifications)
const UserNotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification',
    required: true
  },
  
  // Status
  isRead: {
    type: Boolean,
    default: false
  },
  isClicked: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  clickedAt: Date,
  
  // Delivery
  deliveryStatus: {
    type: String,
    enum: ['pending', 'delivered', 'failed'],
    default: 'pending'
  },
  deliveredAt: Date,
  failureReason: String
}, {
  timestamps: true
});

// Indexes
NotificationSchema.index({ status: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ targetAudience: 1 });
NotificationSchema.index({ scheduledAt: 1 });
NotificationSchema.index({ createdBy: 1 });

UserNotificationSchema.index({ user: 1, createdAt: -1 });
UserNotificationSchema.index({ notification: 1 });
UserNotificationSchema.index({ isRead: 1 });

// Instance Methods for Notification
NotificationSchema.methods.canSend = function() {
  const now = new Date();
  return this.status === 'scheduled' && 
         (!this.scheduledAt || this.scheduledAt <= now) &&
         (!this.expiresAt || this.expiresAt > now);
};

NotificationSchema.methods.markAsSent = function() {
  this.status = 'sent';
  return this.save();
};

// Static Methods for Notification
NotificationSchema.statics.getScheduledNotifications = function() {
  const now = new Date();
  return this.find({
    status: 'scheduled',
    $or: [
      { scheduledAt: { $lte: now } },
      { scheduledAt: { $exists: false } }
    ],
    $or: [
      { expiresAt: { $gt: now } },
      { expiresAt: { $exists: false } }
    ]
  });
};

// Static Methods for UserNotification
UserNotificationSchema.statics.markAsRead = function(userId, notificationId) {
  return this.updateOne(
    { user: userId, notification: notificationId },
    { 
      isRead: true, 
      readAt: new Date() 
    }
  );
};

UserNotificationSchema.statics.markAsClicked = function(userId, notificationId) {
  return this.updateOne(
    { user: userId, notification: notificationId },
    { 
      isClicked: true, 
      clickedAt: new Date() 
    }
  );
};

UserNotificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const { page = 1, limit = 20, unreadOnly = false } = options;
  
  let query = { user: userId };
  if (unreadOnly) {
    query.isRead = false;
  }
  
  return this.find(query)
    .populate('notification')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

const Notification = mongoose.model('Notification', NotificationSchema);
const UserNotification = mongoose.model('UserNotification', UserNotificationSchema);

module.exports = { Notification, UserNotification };
