/**
 * Challenge Model Schema for GameOn Platform
 * Handles friend challenges, duos, and mini-tournaments
 */

const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
  // Challenge Details
  challenger: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  challenged: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Challenge Type
  type: {
    type: String,
    enum: ['1v1', 'duo', 'squad', 'mini-tournament', 'custom'],
    required: true
  },
  
  // Game Details
  game: {
    type: String,
    enum: ['BGMI', 'Free Fire', 'COD Mobile', 'Valorant Mobile'],
    default: 'BGMI'
  },
  
  // Challenge Configuration
  config: {
    mode: {
      type: String,
      enum: ['Classic', 'Arcade', 'Arena', 'TDM', 'Sniper Training'],
      default: 'Classic'
    },
    map: String,
    duration: { type: Number, default: 30 }, // minutes
    maxPlayers: { type: Number, default: 2 },
    entryFee: { type: Number, default: 0 },
    prizePool: { type: Number, default: 0 }
  },
  
  // Status and Timing
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'in-progress', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  
  scheduledAt: Date,
  startedAt: Date,
  completedAt: Date,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  },
  
  // Participants (for squad/mini-tournament challenges)
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    team: { type: String, enum: ['A', 'B'] },
    joinedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['joined', 'ready', 'playing', 'finished'], default: 'joined' }
  }],
  
  // Results
  results: {
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    winnerTeam: { type: String, enum: ['A', 'B'] },
    scores: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      kills: { type: Number, default: 0 },
      damage: { type: Number, default: 0 },
      survival: { type: Number, default: 0 }, // seconds
      rank: { type: Number, default: 0 }
    }],
    screenshots: [String], // URLs to result screenshots
    verified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
  // Rewards
  rewards: {
    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    badges: [String],
    items: [String]
  },
  
  // Chat and Communication
  chatEnabled: { type: Boolean, default: true },
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['text', 'system', 'result'], default: 'text' }
  }],
  
  // Settings
  settings: {
    isPrivate: { type: Boolean, default: false },
    allowSpectators: { type: Boolean, default: true },
    autoStart: { type: Boolean, default: false },
    recordMatch: { type: Boolean, default: false }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
ChallengeSchema.index({ challenger: 1, status: 1 });
ChallengeSchema.index({ challenged: 1, status: 1 });
ChallengeSchema.index({ status: 1, scheduledAt: 1 });
ChallengeSchema.index({ type: 1, status: 1 });
ChallengeSchema.index({ createdAt: -1 });
ChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for challenge duration
ChallengeSchema.virtual('duration').get(function() {
  if (this.startedAt && this.completedAt) {
    return this.completedAt.getTime() - this.startedAt.getTime();
  }
  return 0;
});

// Virtual for time remaining
ChallengeSchema.virtual('timeRemaining').get(function() {
  if (this.expiresAt) {
    const remaining = this.expiresAt.getTime() - Date.now();
    return Math.max(0, remaining);
  }
  return 0;
});

// Static methods
ChallengeSchema.statics.getUserChallenges = function(userId, status = null) {
  const query = {
    $or: [
      { challenger: userId },
      { challenged: userId },
      { 'participants.user': userId }
    ]
  };
  
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('challenger challenged', 'username displayName avatar gameProfile.bgmiName stats.level')
    .populate('participants.user', 'username displayName avatar gameProfile.bgmiName')
    .sort({ createdAt: -1 });
};

ChallengeSchema.statics.getActiveChallenges = function() {
  return this.find({
    status: { $in: ['accepted', 'in-progress'] },
    expiresAt: { $gt: new Date() }
  }).populate('challenger challenged', 'username displayName avatar gameProfile.bgmiName');
};

ChallengeSchema.statics.getLeaderboard = function(timeframe = 'week') {
  const startDate = new Date();
  if (timeframe === 'week') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (timeframe === 'month') {
    startDate.setMonth(startDate.getMonth() - 1);
  }
  
  return this.aggregate([
    {
      $match: {
        status: 'completed',
        completedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$results.winner',
        wins: { $sum: 1 },
        totalKills: { $sum: { $sum: '$results.scores.kills' } },
        totalDamage: { $sum: { $sum: '$results.scores.damage' } }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $sort: { wins: -1, totalKills: -1 }
    },
    {
      $limit: 10
    }
  ]);
};

// Instance methods
ChallengeSchema.methods.accept = function() {
  this.status = 'accepted';
  return this.save();
};

ChallengeSchema.methods.decline = function() {
  this.status = 'declined';
  return this.save();
};

ChallengeSchema.methods.start = function() {
  this.status = 'in-progress';
  this.startedAt = new Date();
  return this.save();
};

ChallengeSchema.methods.complete = function(results) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.results = { ...this.results, ...results };
  return this.save();
};

ChallengeSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

ChallengeSchema.methods.addMessage = function(senderId, message, type = 'text') {
  this.messages.push({
    sender: senderId,
    message,
    type
  });
  return this.save();
};

ChallengeSchema.methods.joinChallenge = function(userId, team = 'A') {
  const existingParticipant = this.participants.find(p => p.user.toString() === userId.toString());
  if (!existingParticipant) {
    this.participants.push({
      user: userId,
      team
    });
  }
  return this.save();
};

module.exports = mongoose.model('Challenge', ChallengeSchema);