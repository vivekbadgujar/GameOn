const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
    unique: true
  },
  originalName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['image', 'video', 'document', 'audio'],
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    maxlength: 500
  },
  category: {
    type: String,
    enum: ['tournament', 'promotional', 'branding', 'documentation', 'other'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  metadata: {
    width: Number,
    height: Number,
    duration: Number, // for videos
    format: String,
    mimeType: String
  },
  usage: {
    usedInTournaments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament'
    }],
    usedInNotifications: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Notification'
    }],
    downloadCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  indexes: [
    { type: 1, status: 1 },
    { category: 1, status: 1 },
    { uploadedBy: 1, createdAt: -1 },
    { tags: 1 },
    { 'usage.usedInTournaments': 1 }
  ]
});

// Virtual for formatted file size
MediaSchema.virtual('formattedSize').get(function() {
  const bytes = this.size;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual for formatted upload date
MediaSchema.virtual('formattedUploadDate').get(function() {
  return this.createdAt ? this.createdAt.toLocaleDateString() : '';
});

// Ensure virtuals are included in JSON output
MediaSchema.set('toJSON', { virtuals: true });
MediaSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Media', MediaSchema); 