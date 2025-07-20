const mongoose = require('mongoose');

const AIFlagSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: false // Can be null if not related to a specific tournament
  },
  screenshotUrl: {
    type: String,
    required: true
  },
  analysisResult: {
    type: String,
    required: true
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  status: {
    type: String,
    enum: ['PendingReview', 'UnderInvestigation', 'Approved', 'Rejected', 'Banned'],
    default: 'PendingReview'
  },
  adminNotes: {
    type: String,
    default: ''
  },
  detectionMethod: {
    type: String,
    enum: ['AI', 'Manual', 'Report'],
    default: 'AI'
  },
  flaggedAt: {
    type: Date,
    default: Date.now
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: false
  },
  reviewedAt: {
    type: Date,
    required: false
  }
}, { timestamps: true });

module.exports = mongoose.model('AIFlag', AIFlagSchema);