/**
 * Group/Clan Model Schema for GameOn Platform
 * Handles squads, clans, and group-based activities
 */

const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema({
  // Basic Group Information
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9\s_-]+$/
  },
  
  tag: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 2,
    maxlength: 6,
    match: /^[A-Z0-9]+$/
  },
  
  description: {
    type: String,
    maxlength: 500
  },
  
  avatar: String,
  banner: String,
  
  // Group Type and Settings
  type: {
    type: String,
    enum: ['squad', 'clan', 'team', 'community'],
    default: 'squad'
  },
  
  privacy: {
    type: String,
    enum: ['public', 'private', 'invite-only'],
    default: 'public'
  },
  
  maxMembers: {
    type: Number,
    default: 50,
    min: 4,
    max: 100
  },
  
  // Leadership
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  admins: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    appointedAt: { type: Date, default: Date.now },
    appointedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    permissions: [{
      type: String,
      enum: ['invite_members', 'remove_members', 'manage_tournaments', 'manage_settings', 'moderate_chat']
    }]
  }],
  
  // Members
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'recruit'],
      default: 'member'
    },
    joinedAt: { type: Date, default: Date.now },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['active', 'inactive', 'banned'],
      default: 'active'
    },
    contributions: {
      tournamentsWon: { type: Number, default: 0 },
      totalKills: { type: Number, default: 0 },
      totalDamage: { type: Number, default: 0 },
      activeDays: { type: Number, default: 0 }
    }
  }],
  
  // Join Requests (for private/invite-only groups)
  joinRequests: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    requestedAt: { type: Date, default: Date.now },
    message: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  }],
  
  // Group Statistics
  stats: {
    totalMembers: { type: Number, default: 0 },
    activeMembersWeek: { type: Number, default: 0 },
    tournamentsParticipated: { type: Number, default: 0 },
    tournamentsWon: { type: Number, default: 0 },
    totalKills: { type: Number, default: 0 },
    totalDamage: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    averageRank: { type: Number, default: 0 },
    groupLevel: { type: Number, default: 1 },
    groupXP: { type: Number, default: 0 }
  },
  
  // Group Activities
  activities: [{
    type: {
      type: String,
      enum: ['member_joined', 'member_left', 'tournament_won', 'tournament_participated', 'achievement_earned', 'level_up']
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: String,
    data: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Group Tournaments and Events
  tournaments: [{
    tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
    participatedAt: { type: Date, default: Date.now },
    result: {
      position: Number,
      prize: Number,
      participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }
  }],
  
  // Group Challenges
  challenges: [{
    challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
    createdAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active'
    }
  }],
  
  // Group Settings
  settings: {
    allowMemberInvites: { type: Boolean, default: true },
    requireApprovalForJoin: { type: Boolean, default: false },
    allowMemberChallenges: { type: Boolean, default: true },
    showMemberStats: { type: Boolean, default: true },
    enableGroupChat: { type: Boolean, default: true },
    autoKickInactive: { type: Number, default: 30 }, // days
    minLevelToJoin: { type: Number, default: 1 }
  },
  
  // Group Achievements and Badges
  achievements: [{
    type: String,
    name: String,
    description: String,
    icon: String,
    earnedAt: { type: Date, default: Date.now },
    earnedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'disbanded'],
    default: 'active'
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient queries
GroupSchema.index({ name: 1 }, { unique: true });
GroupSchema.index({ tag: 1 }, { unique: true });
GroupSchema.index({ owner: 1 });
GroupSchema.index({ 'members.user': 1 });
GroupSchema.index({ type: 1, privacy: 1 });
GroupSchema.index({ 'stats.groupLevel': -1 });
GroupSchema.index({ 'stats.groupXP': -1 });
GroupSchema.index({ createdAt: -1 });

// Virtual for member count
GroupSchema.virtual('memberCount').get(function() {
  return this.members.filter(member => member.status === 'active').length;
});

// Virtual for group rank based on XP
GroupSchema.virtual('rank').get(function() {
  const xp = this.stats.groupXP;
  if (xp < 1000) return 'Rookie Squad';
  if (xp < 5000) return 'Amateur Team';
  if (xp < 15000) return 'Pro Clan';
  if (xp < 50000) return 'Elite Squad';
  if (xp < 150000) return 'Master Clan';
  return 'Legendary Squad';
});

// Static methods
GroupSchema.statics.findByTag = function(tag) {
  return this.findOne({ tag: tag.toUpperCase() });
};

GroupSchema.statics.getUserGroups = function(userId) {
  return this.find({
    'members.user': userId,
    'members.status': 'active',
    status: 'active'
  }).populate('owner', 'username displayName avatar')
    .populate('members.user', 'username displayName avatar gameProfile.bgmiName stats.level');
};

GroupSchema.statics.getPublicGroups = function(options = {}) {
  const query = {
    privacy: 'public',
    status: 'active'
  };
  
  if (options.type) {
    query.type = options.type;
  }
  
  return this.find(query)
    .populate('owner', 'username displayName avatar')
    .sort({ 'stats.groupXP': -1, memberCount: -1 })
    .limit(options.limit || 20);
};

GroupSchema.statics.searchGroups = function(searchTerm, options = {}) {
  const query = {
    $or: [
      { name: { $regex: searchTerm, $options: 'i' } },
      { tag: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } }
    ],
    status: 'active'
  };
  
  if (options.privacy) {
    query.privacy = options.privacy;
  }
  
  return this.find(query)
    .populate('owner', 'username displayName avatar')
    .sort({ 'stats.groupXP': -1 })
    .limit(options.limit || 10);
};

GroupSchema.statics.getLeaderboard = function(type = 'xp', limit = 10) {
  let sortField = 'stats.groupXP';
  
  if (type === 'members') {
    sortField = 'stats.totalMembers';
  } else if (type === 'tournaments') {
    sortField = 'stats.tournamentsWon';
  } else if (type === 'kills') {
    sortField = 'stats.totalKills';
  }
  
  return this.find({ status: 'active' })
    .populate('owner', 'username displayName avatar')
    .sort({ [sortField]: -1 })
    .limit(limit);
};

// Instance methods
GroupSchema.methods.addMember = function(userId, invitedBy = null, role = 'member') {
  const existingMember = this.members.find(member => member.user.toString() === userId.toString());
  
  if (!existingMember) {
    this.members.push({
      user: userId,
      role,
      invitedBy
    });
    
    this.stats.totalMembers = this.memberCount;
    
    // Add activity
    this.activities.unshift({
      type: 'member_joined',
      user: userId,
      description: 'joined the group'
    });
  }
  
  return this.save();
};

GroupSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(member => member.user.toString() !== userId.toString());
  this.stats.totalMembers = this.memberCount;
  
  // Add activity
  this.activities.unshift({
    type: 'member_left',
    user: userId,
    description: 'left the group'
  });
  
  return this.save();
};

GroupSchema.methods.promoteToAdmin = function(userId, promotedBy, permissions = []) {
  const member = this.members.find(member => member.user.toString() === userId.toString());
  
  if (member) {
    member.role = 'admin';
    
    this.admins.push({
      user: userId,
      appointedBy: promotedBy,
      permissions
    });
  }
  
  return this.save();
};

GroupSchema.methods.addXP = function(points, reason = 'activity') {
  this.stats.groupXP += points;
  
  // Check for level up
  const newLevel = Math.floor(this.stats.groupXP / 1000) + 1;
  if (newLevel > this.stats.groupLevel) {
    this.stats.groupLevel = newLevel;
    
    // Add achievement
    this.achievements.push({
      type: 'level_up',
      name: `Level ${newLevel}`,
      description: `Group reached level ${newLevel}`,
      icon: 'level-up'
    });
    
    // Add activity
    this.activities.unshift({
      type: 'level_up',
      description: `Group reached level ${newLevel}`
    });
  }
  
  return this.save();
};

GroupSchema.methods.updateStats = function(statsUpdate) {
  Object.keys(statsUpdate).forEach(key => {
    if (this.stats[key] !== undefined) {
      this.stats[key] += statsUpdate[key];
    }
  });
  
  // Update win rate
  if (this.stats.tournamentsParticipated > 0) {
    this.stats.winRate = (this.stats.tournamentsWon / this.stats.tournamentsParticipated) * 100;
  }
  
  return this.save();
};

GroupSchema.methods.addActivity = function(type, userId, description, data = {}) {
  this.activities.unshift({
    type,
    user: userId,
    description,
    data
  });
  
  // Keep only last 100 activities
  if (this.activities.length > 100) {
    this.activities = this.activities.slice(0, 100);
  }
  
  return this.save();
};

module.exports = mongoose.model('Group', GroupSchema);