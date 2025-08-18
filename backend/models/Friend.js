/**
 * Friend Model Schema for GameOn Platform
 * Handles friend requests, friendships, and social interactions
 */

const mongoose = require('mongoose');

const FriendSchema = new mongoose.Schema({
  // Friend Request Details
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Request Status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'blocked'],
    default: 'pending',
    index: true
  },
  
  // Timestamps
  requestedAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: Date,
  
  // Interaction Stats
  interactions: {
    messagesExchanged: { type: Number, default: 0 },
    gamesPlayedTogether: { type: Number, default: 0 },
    challengesSent: { type: Number, default: 0 },
    challengesReceived: { type: Number, default: 0 },
    lastInteraction: Date
  },
  
  // Privacy Settings
  privacy: {
    showOnlineStatus: { type: Boolean, default: true },
    allowChallenges: { type: Boolean, default: true },
    allowMessages: { type: Boolean, default: true }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
FriendSchema.index({ requester: 1, recipient: 1 }, { unique: true });
FriendSchema.index({ requester: 1, status: 1 });
FriendSchema.index({ recipient: 1, status: 1 });
FriendSchema.index({ status: 1, createdAt: -1 });

// Virtual for friendship duration
FriendSchema.virtual('friendshipDuration').get(function() {
  if (this.status === 'accepted' && this.respondedAt) {
    return Date.now() - this.respondedAt.getTime();
  }
  return 0;
});

// Static methods
FriendSchema.statics.findFriendship = function(userId1, userId2) {
  return this.findOne({
    $or: [
      { requester: userId1, recipient: userId2 },
      { requester: userId2, recipient: userId1 }
    ]
  });
};

FriendSchema.statics.getFriends = function(userId) {
  return this.find({
    $or: [
      { requester: userId, status: 'accepted' },
      { recipient: userId, status: 'accepted' }
    ]
  }).populate('requester recipient', 'username displayName avatar gameProfile.bgmiName stats.level preferences.privacy.showOnline security.lastLogin');
};

FriendSchema.statics.getPendingRequests = function(userId) {
  return this.find({
    recipient: userId,
    status: 'pending'
  }).populate('requester', 'username displayName avatar gameProfile.bgmiName stats.level');
};

FriendSchema.statics.getSentRequests = function(userId) {
  return this.find({
    requester: userId,
    status: 'pending'
  }).populate('recipient', 'username displayName avatar gameProfile.bgmiName stats.level');
};

// Instance methods
FriendSchema.methods.accept = function() {
  this.status = 'accepted';
  this.respondedAt = new Date();
  return this.save();
};

FriendSchema.methods.decline = function() {
  this.status = 'declined';
  this.respondedAt = new Date();
  return this.save();
};

FriendSchema.methods.block = function() {
  this.status = 'blocked';
  this.respondedAt = new Date();
  return this.save();
};

FriendSchema.methods.incrementInteraction = function(type) {
  if (this.interactions[type] !== undefined) {
    this.interactions[type]++;
    this.interactions.lastInteraction = new Date();
    return this.save();
  }
};

module.exports = mongoose.model('Friend', FriendSchema);