/**
 * Achievement Model Schema for GameOn Platform
 * Handles user achievements, social feed, and gamification
 */

const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema({
  // Achievement Details
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Achievement Type and Category
  type: {
    type: String,
    enum: [
      'tournament_win', 'tournament_participation', 'kill_streak', 'damage_dealt',
      'survival_time', 'headshots', 'wins', 'level_up', 'referral', 'social',
      'challenge_win', 'duo_win', 'squad_win', 'first_blood', 'clutch',
      'marksman', 'survivor', 'team_player', 'veteran', 'legend'
    ],
    required: true,
    index: true
  },
  
  category: {
    type: String,
    enum: ['combat', 'social', 'progression', 'tournament', 'special'],
    required: true,
    index: true
  },
  
  // Achievement Metadata
  title: {
    type: String,
    required: true
  },
  description: String,
  icon: String,
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary', 'mythic'],
    default: 'common'
  },
  
  // Achievement Value and Context
  value: Number, // The value that triggered this achievement (e.g., kills, damage, etc.)
  threshold: Number, // The threshold required for this achievement
  context: {
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
    gameMode: String,
    additionalData: mongoose.Schema.Types.Mixed
  },
  
  // Rewards
  rewards: {
    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    badge: String,
    title: String,
    avatar: String,
    items: [String]
  },
  
  // Social Features
  isPublic: { type: Boolean, default: true },
  shareCount: { type: Number, default: 0 },
  likeCount: { type: Number, default: 0 },
  commentCount: { type: Number, default: 0 },
  
  // Social Interactions
  likes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
  }],
  
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment: String,
    timestamp: { type: Date, default: Date.now },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }],
  
  // Sharing
  shares: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    platform: { type: String, enum: ['whatsapp', 'telegram', 'instagram', 'facebook', 'twitter'] },
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Achievement Status
  status: {
    type: String,
    enum: ['earned', 'claimed', 'shared'],
    default: 'earned'
  },
  
  earnedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  claimedAt: Date,
  
  // Progress tracking (for progressive achievements)
  progress: {
    current: { type: Number, default: 0 },
    target: { type: Number, default: 1 },
    milestones: [{
      value: Number,
      reached: { type: Boolean, default: false },
      reachedAt: Date
    }]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
AchievementSchema.index({ user: 1, type: 1 });
AchievementSchema.index({ user: 1, earnedAt: -1 });
AchievementSchema.index({ type: 1, earnedAt: -1 });
AchievementSchema.index({ category: 1, earnedAt: -1 });
AchievementSchema.index({ rarity: 1, earnedAt: -1 });
AchievementSchema.index({ isPublic: 1, earnedAt: -1 });

// Virtual for completion percentage
AchievementSchema.virtual('completionPercentage').get(function() {
  if (this.progress.target > 0) {
    return Math.min(100, (this.progress.current / this.progress.target) * 100);
  }
  return 100;
});

// Virtual for rarity score
AchievementSchema.virtual('rarityScore').get(function() {
  const scores = {
    common: 1,
    rare: 2,
    epic: 3,
    legendary: 4,
    mythic: 5
  };
  return scores[this.rarity] || 1;
});

// Static methods
AchievementSchema.statics.getUserAchievements = function(userId, options = {}) {
  const query = { user: userId };
  
  if (options.category) {
    query.category = options.category;
  }
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.rarity) {
    query.rarity = options.rarity;
  }
  
  return this.find(query)
    .sort({ earnedAt: -1 })
    .limit(options.limit || 50);
};

AchievementSchema.statics.getPublicFeed = function(userIds = [], options = {}) {
  const query = {
    isPublic: true
  };
  
  if (userIds.length > 0) {
    query.user = { $in: userIds };
  }
  
  return this.find(query)
    .populate('user', 'username displayName avatar gameProfile.bgmiName stats.level')
    .populate('likes.user', 'username displayName avatar')
    .populate('comments.user', 'username displayName avatar')
    .sort({ earnedAt: -1 })
    .limit(options.limit || 20);
};

AchievementSchema.statics.getLeaderboard = function(type, timeframe = 'month') {
  const startDate = new Date();
  if (timeframe === 'week') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (timeframe === 'month') {
    startDate.setMonth(startDate.getMonth() - 1);
  } else if (timeframe === 'year') {
    startDate.setFullYear(startDate.getFullYear() - 1);
  }
  
  const matchQuery = {
    earnedAt: { $gte: startDate }
  };
  
  if (type && type !== 'all') {
    matchQuery.type = type;
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$user',
        achievementCount: { $sum: 1 },
        totalXP: { $sum: '$rewards.xp' },
        totalCoins: { $sum: '$rewards.coins' },
        rarityScore: { $sum: '$rarityScore' },
        categories: { $addToSet: '$category' }
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
      $sort: { rarityScore: -1, achievementCount: -1, totalXP: -1 }
    },
    {
      $limit: 10
    }
  ]);
};

AchievementSchema.statics.getTrendingAchievements = function(limit = 10) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        earnedAt: { $gte: oneDayAgo },
        isPublic: true
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalLikes: { $sum: '$likeCount' },
        totalShares: { $sum: '$shareCount' },
        avgRarityScore: { $avg: '$rarityScore' },
        recentAchievements: { $push: '$$ROOT' }
      }
    },
    {
      $addFields: {
        trendScore: {
          $add: [
            { $multiply: ['$count', 2] },
            '$totalLikes',
            { $multiply: ['$totalShares', 3] },
            { $multiply: ['$avgRarityScore', 5] }
          ]
        }
      }
    },
    {
      $sort: { trendScore: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

// Instance methods
AchievementSchema.methods.like = function(userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString());
  
  if (!existingLike) {
    this.likes.push({ user: userId });
    this.likeCount = this.likes.length;
  }
  
  return this.save();
};

AchievementSchema.methods.unlike = function(userId) {
  this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  this.likeCount = this.likes.length;
  return this.save();
};

AchievementSchema.methods.addComment = function(userId, comment) {
  this.comments.push({
    user: userId,
    comment
  });
  this.commentCount = this.comments.length;
  return this.save();
};

AchievementSchema.methods.share = function(userId, platform) {
  this.shares.push({
    user: userId,
    platform
  });
  this.shareCount = this.shares.length;
  return this.save();
};

AchievementSchema.methods.claim = function() {
  this.status = 'claimed';
  this.claimedAt = new Date();
  return this.save();
};

AchievementSchema.methods.updateProgress = function(newValue) {
  this.progress.current = Math.min(newValue, this.progress.target);
  
  // Check milestones
  this.progress.milestones.forEach(milestone => {
    if (!milestone.reached && this.progress.current >= milestone.value) {
      milestone.reached = true;
      milestone.reachedAt = new Date();
    }
  });
  
  return this.save();
};

module.exports = mongoose.model('Achievement', AchievementSchema);