/**
 * User Model Schema for GameOn Platform
 * Handles user registration, profile, and gaming statistics
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  // Authentication fields
  phone: {
    type: String,
    required: true,
    unique: true,
    index: true,
    match: /^[6-9]\d{9}$/ // Indian mobile number validation
  },
  email: {
    type: String,
    unique: true,
    sparse: true, // Allows null values but enforces uniqueness when present
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    minlength: 6
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    code: String,
    expiresAt: Date,
    attempts: { type: Number, default: 0 }
  },

  // Profile Information
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_]+$/
  },
  displayName: {
    type: String,
    required: true,
    maxlength: 30
  },
  avatar: {
    type: String,
    default: null
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: null
  },

  // Gaming Profile
  gameProfile: {
    bgmiId: {
      type: String,
      required: true,
      unique: true
    },
    bgmiName: {
      type: String,
      required: true
    },
    tier: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Crown', 'Ace', 'Conqueror'],
      default: 'Bronze'
    },
    level: {
      type: Number,
      default: 1
    }
  },

  // College Information
  college: {
    name: String,
    city: String,
    state: String,
    year: {
      type: String,
      enum: ['1st', '2nd', '3rd', '4th', 'Graduate']
    }
  },

  // Location
  location: {
    city: String,
    state: String,
    country: { type: String, default: 'India' }
  },

  // Gaming Statistics
  stats: {
    totalTournaments: { type: Number, default: 0 },
    tournamentsWon: { type: Number, default: 0 },
    totalKills: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    averageRank: { type: Number, default: 0 },
    xpPoints: { type: Number, default: 0 },
    level: { type: Number, default: 1 }
  },

  // Wallet & Transactions
  wallet: {
    balance: { type: Number, default: 0 },
    totalDeposits: { type: Number, default: 0 },
    totalWithdrawals: { type: Number, default: 0 },
    pendingAmount: { type: Number, default: 0 }
  },

  // Referral System
  referral: {
    code: {
      type: String,
      unique: true,
      sparse: true
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    referredUsers: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      dateReferred: { type: Date, default: Date.now },
      rewardClaimed: { type: Boolean, default: false }
    }],
    totalReferrals: { type: Number, default: 0 },
    referralEarnings: { type: Number, default: 0 }
  },

  // Badges & Achievements
  badges: [{
    name: String,
    description: String,
    icon: String,
    earnedAt: { type: Date, default: Date.now },
    category: {
      type: String,
      enum: ['tournament', 'kills', 'streak', 'referral', 'special']
    }
  }],

  // Account Security
  security: {
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    lastLogin: Date,
    ipAddresses: [String],
    deviceTokens: [String] // For push notifications
  },

  // Account Status
  status: {
    type: String,
    enum: ['active', 'suspended', 'banned', 'inactive'],
    default: 'active'
  },
  
  // AI & Moderation
  aiFlags: {
    suspiciousActivity: { type: Number, default: 0 },
    cheatReports: { type: Number, default: 0 },
    lastFlaggedAt: Date,
    riskScore: { type: Number, default: 0, min: 0, max: 100 }
  },

  // Preferences
  preferences: {
    notifications: {
      tournaments: { type: Boolean, default: true },
      matches: { type: Boolean, default: true },
      rewards: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false }
    },
    privacy: {
      showProfile: { type: Boolean, default: true },
      showStats: { type: Boolean, default: true },
      showOnline: { type: Boolean, default: true }
    }
  },

  // Subscription
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro'],
      default: 'free'
    },
    expiresAt: Date,
    features: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Only add indexes that aren't already defined in the schema
UserSchema.index({ 'stats.totalEarnings': -1 });
UserSchema.index({ 'stats.xpPoints': -1 });
UserSchema.index({ createdAt: -1 });

// Virtual for account lock status
UserSchema.virtual('isLocked').get(function() {
  return !!(this.security.lockUntil && this.security.lockUntil > Date.now());
});

// Virtual for user rank based on XP
UserSchema.virtual('rank').get(function() {
  const xp = this.stats.xpPoints;
  if (xp < 100) return 'Rookie';
  if (xp < 500) return 'Amateur';
  if (xp < 1500) return 'Pro';
  if (xp < 5000) return 'Expert';
  if (xp < 15000) return 'Master';
  return 'Legend';
});

// Pre-save middleware
UserSchema.pre('save', async function(next) {
  // Hash password if it's modified
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }

  // Generate referral code if not exists
  if (this.isNew && !this.referral.code) {
    this.referral.code = this.username.toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
  }

  // Update win rate
  if (this.stats.totalTournaments > 0) {
    this.stats.winRate = (this.stats.tournamentsWon / this.stats.totalTournaments) * 100;
  }

  // Update level based on XP
  this.stats.level = Math.floor(this.stats.xpPoints / 100) + 1;

  next();
});

// Instance methods
UserSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.security.lockUntil && this.security.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { 'security.lockUntil': 1 },
      $set: { 'security.loginAttempts': 1 }
    });
  }
  
  const updates = { $inc: { 'security.loginAttempts': 1 } };
  
  // Lock account after 5 attempts for 2 hours
  if (this.security.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates['$set'] = { 'security.lockUntil': Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

UserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { 'security.loginAttempts': 1, 'security.lockUntil': 1 }
  });
};

UserSchema.methods.addXP = function(points, reason = 'gameplay') {
  this.stats.xpPoints += points;
  
  // Check for level-up badges
  const newLevel = Math.floor(this.stats.xpPoints / 100) + 1;
  if (newLevel > this.stats.level) {
    this.badges.push({
      name: `Level ${newLevel}`,
      description: `Reached level ${newLevel}`,
      icon: 'level-up',
      category: 'special'
    });
  }
  
  return this.save();
};

UserSchema.methods.addBadge = function(badgeData) {
  const existingBadge = this.badges.find(b => b.name === badgeData.name);
  if (!existingBadge) {
    this.badges.push(badgeData);
    return this.save();
  }
  return Promise.resolve(this);
};

// Static methods
UserSchema.statics.findByPhoneOrUsername = function(identifier) {
  return this.findOne({
    $or: [
      { phone: identifier },
      { username: identifier }
    ]
  });
};

UserSchema.statics.getLeaderboard = function(limit = 50, sortBy = 'totalEarnings') {
  const sortField = `stats.${sortBy}`;
  return this.find({ status: 'active' })
    .sort({ [sortField]: -1 })
    .limit(limit)
    .select('username displayName avatar stats gameProfile.tier')
    .lean();
};

module.exports = mongoose.model('User', UserSchema);
