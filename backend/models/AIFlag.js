const mongoose = require('mongoose');

const AIFlagSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: false // Can be null if not related to a specific tournament
  },
  
  // Flag type and details
  type: {
    type: String,
    enum: ['suspicious_activity', 'hack_detection', 'violation', 'screenshot_analysis'],
    required: true
  },
  reason: {
    type: String,
    required: true,
    maxlength: 500
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Analysis details
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.5
  },
  
  // Screenshot analysis (for existing functionality)
  screenshotUrl: {
    type: String,
    required: false
  },
  analysisResult: {
    type: String,
    required: false
  },
  
  // Status and review
  status: {
    type: String,
    enum: ['pending', 'investigating', 'resolved', 'false_positive', 'confirmed'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  
  // Detection method
  detectionMethod: {
    type: String,
    enum: ['AI', 'Manual', 'Report', 'Behavioral_Analysis', 'Server_Validation'],
    default: 'AI'
  },
  
  // Timestamps
  flaggedAt: {
    type: Date,
    default: Date.now
  },
  flaggedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false
  },
  reviewedAt: {
    type: Date,
    required: false
  },
  
  // Evidence and metadata
  evidence: {
    type: String,
    maxlength: 1000
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceInfo: Object,
    gameSession: String,
    matchId: String
  }
}, { 
  timestamps: true,
  indexes: [
    { user: 1, createdAt: -1 },
    { type: 1, status: 1 },
    { severity: 1, createdAt: -1 },
    { tournament: 1, createdAt: -1 }
  ]
});

// Virtual for formatted timestamp
AIFlagSchema.virtual('formattedFlaggedAt').get(function() {
  return this.flaggedAt ? this.flaggedAt.toLocaleString() : '';
});

// Virtual for formatted reviewed timestamp
AIFlagSchema.virtual('formattedReviewedAt').get(function() {
  return this.reviewedAt ? this.reviewedAt.toLocaleString() : '';
});

// Ensure virtuals are included in JSON output
AIFlagSchema.set('toJSON', { virtuals: true });
AIFlagSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('AIFlag', AIFlagSchema);