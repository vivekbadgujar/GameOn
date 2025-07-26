/**
 * Admin Model for GameOn Platform
 * Handles admin authentication and permissions
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AdminSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  
  // Role and Permissions
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator', 'support'],
    default: 'admin'
  },
  permissions: [{
    type: String,
    enum: [
      'tournaments_manage',
      'users_manage', 
      'payments_view',
      'payments_manage',
      'analytics_view',
      'notifications_send',
      'ai_moderation',
      'system_settings'
    ]
  }],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // Security
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  ipAddresses: [String],
  
  // Two-Factor Authentication
  twoFactorSecret: String,
  isTwoFactorEnabled: {
    type: Boolean,
    default: false
  },
  
  // Profile
  avatar: String,
  phone: String,
  department: String,
  
  // Activity Tracking
  totalTournamentsCreated: {
    type: Number,
    default: 0
  },
  totalUsersManaged: {
    type: Number,
    default: 0
  },
  lastActivity: Date
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.twoFactorSecret;
      return ret;
    }
  }
});

// Indexes
AdminSchema.index({ role: 1 });
AdminSchema.index({ status: 1 });

// Virtual for account lock status
AdminSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware
AdminSchema.pre('save', async function(next) {
  // Hash password if modified
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  
  // Set default permissions based on role
  if (this.isNew && this.permissions.length === 0) {
    switch (this.role) {
      case 'super_admin':
        this.permissions = [
          'tournaments_manage', 'users_manage', 'payments_view', 
          'payments_manage', 'analytics_view', 'notifications_send',
          'ai_moderation', 'system_settings'
        ];
        break;
      case 'admin':
        this.permissions = [
          'tournaments_manage', 'users_manage', 'payments_view',
          'analytics_view', 'notifications_send', 'ai_moderation'
        ];
        break;
      case 'moderator':
        this.permissions = ['users_manage', 'ai_moderation'];
        break;
      case 'support':
        this.permissions = ['users_manage', 'analytics_view'];
        break;
    }
  }
  
  next();
});

// Instance Methods
AdminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

AdminSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

AdminSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: new Date() }
  });
};

AdminSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission) || this.role === 'super_admin';
};

// Static Methods
AdminSchema.statics.createSuperAdmin = async function(adminData) {
  const existingSuperAdmin = await this.findOne({ role: 'super_admin' });
  if (existingSuperAdmin) {
    throw new Error('Super admin already exists');
  }
  
  return this.create({
    ...adminData,
    role: 'super_admin',
    status: 'active',
    isEmailVerified: true
  });
};

module.exports = mongoose.model('Admin', AdminSchema);
