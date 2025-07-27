const mongoose = require('mongoose');

const exportSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['users', 'tournaments', 'transactions', 'notifications', 'ai_flags', 'media']
  },
  format: {
    type: String,
    required: true,
    enum: ['csv', 'json', 'excel', 'pdf']
  },
  status: {
    type: String,
    required: true,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  filename: {
    type: String
  },
  downloadUrl: {
    type: String
  },
  recordCount: {
    type: Number,
    default: 0
  },
  fileSize: {
    type: String
  },
  filters: {
    dateRange: {
      start: Date,
      end: Date
    },
    additionalFilters: mongoose.Schema.Types.Mixed
  },
  error: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient querying
exportSchema.index({ requestedBy: 1, createdAt: -1 });
exportSchema.index({ type: 1, status: 1 });

module.exports = mongoose.model('Export', exportSchema); 