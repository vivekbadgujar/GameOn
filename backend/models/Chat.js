/**
 * Chat Model Schema for GameOn Platform
 * Handles tournament chat messages and direct messages between users
 */

const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  // Message Information
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  
  // Message Type
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  
  // Sender Information
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderUsername: {
    type: String,
    required: true
  },
  senderGamerTag: {
    type: String
  },
  
  // Chat Context
  chatType: {
    type: String,
    enum: ['tournament', 'direct'],
    required: true
  },
  
  // Tournament Chat
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: function() { return this.chatType === 'tournament'; }
  },
  
  // Direct Message
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return this.chatType === 'direct'; }
  },
  
  // Message Status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'deleted'],
    default: 'sent'
  },
  
  // Read Status (for direct messages)
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Moderation
  isModerated: {
    type: Boolean,
    default: false
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  moderationReason: {
    type: String
  },
  
  // File Attachment (for image/file messages)
  attachment: {
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String
  },
  
  // Reactions
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Reply Information
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat'
  },
  
  // Mentions
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Message Metadata
  editedAt: Date,
  deletedAt: Date,
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
ChatSchema.index({ tournament: 1, createdAt: -1 });
ChatSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
ChatSchema.index({ chatType: 1, createdAt: -1 });
ChatSchema.index({ status: 1 });
ChatSchema.index({ createdAt: -1 });

// Virtual for conversation ID (for direct messages)
ChatSchema.virtual('conversationId').get(function() {
  if (this.chatType === 'direct') {
    const ids = [this.sender.toString(), this.recipient.toString()].sort();
    return ids.join('_');
  }
  return null;
});

// Virtual for formatted timestamp
ChatSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
});

// Instance methods
ChatSchema.methods.markAsRead = function(userId) {
  if (!this.readBy.find(r => r.user.toString() === userId.toString())) {
    this.readBy.push({ user: userId, readAt: new Date() });
    return this.save();
  }
  return Promise.resolve(this);
};

ChatSchema.methods.addReaction = function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
  
  // Add new reaction
  this.reactions.push({ user: userId, emoji });
  return this.save();
};

ChatSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(r => r.user.toString() !== userId.toString());
  return this.save();
};

ChatSchema.methods.softDelete = function() {
  this.status = 'deleted';
  this.deletedAt = new Date();
  return this.save();
};

ChatSchema.methods.moderate = function(adminId, reason) {
  this.isModerated = true;
  this.moderatedBy = adminId;
  this.moderationReason = reason;
  this.status = 'deleted';
  return this.save();
};

// Static methods
ChatSchema.statics.getTournamentMessages = function(tournamentId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  return this.find({
    tournament: tournamentId,
    chatType: 'tournament',
    status: { $ne: 'deleted' }
  })
  .populate('sender', 'username gameProfile.bgmiId')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .lean();
};

ChatSchema.statics.getDirectMessages = function(userId1, userId2, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  return this.find({
    chatType: 'direct',
    $or: [
      { sender: userId1, recipient: userId2 },
      { sender: userId2, recipient: userId1 }
    ],
    status: { $ne: 'deleted' }
  })
  .populate('sender recipient', 'username gameProfile.bgmiId')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .lean();
};

ChatSchema.statics.getUserConversations = function(userId) {
  return this.aggregate([
    {
      $match: {
        chatType: 'direct',
        $or: [{ sender: userId }, { recipient: userId }],
        status: { $ne: 'deleted' }
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$sender', userId] },
            '$recipient',
            '$sender'
          ]
        },
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$sender', userId] },
                  { $not: { $in: [userId, '$readBy.user'] } }
                ]
              },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'otherUser'
      }
    },
    {
      $unwind: '$otherUser'
    },
    {
      $sort: { 'lastMessage.createdAt': -1 }
    }
  ]);
};

// Pre-save middleware
ChatSchema.pre('save', function(next) {
  // Auto-detect mentions
  if (this.type === 'text' && this.message) {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(this.message)) !== null) {
      mentions.push(match[1]);
    }
    
    // You would need to resolve usernames to user IDs here
    // this.mentions = resolvedUserIds;
  }
  
  next();
});

module.exports = mongoose.model('Chat', ChatSchema);