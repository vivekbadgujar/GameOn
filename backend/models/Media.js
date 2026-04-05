/**
 * Media Model Schema for GameOn Platform
 * Handles media files (images, videos, documents) uploaded by admins
 */

const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  
  // File Information
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
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
  
  // Cloudinary-specific fields
  publicId: {
    type: String,
    required: false // Optional for backward compatibility
  },
  format: {
    type: String,
    required: false
  },
  resourceType: {
    type: String,
    enum: ['image', 'video', 'raw', 'auto'],
    default: 'auto'
  },
  
  // Media Type
  type: {
    type: String,
    enum: ['poster', 'banner', 'logo', 'document', 'video', 'image', 'other'],
    default: 'image'
  },
  
  // Metadata
  tags: [{
    type: String,
    trim: true
  }],
  
  // Visibility
  isVisible: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  
  // Upload Information
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  
  // Usage Tracking
  downloadCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  
  // Associated Content
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament'
  },
  
  // File Properties (for images/videos)
  dimensions: {
    width: Number,
    height: Number
  },
  duration: Number, // for videos in seconds
  
  // Cloudinary dimensions (stored separately for better querying)
  width: Number,
  height: Number,
  
  // SEO
  altText: {
    type: String,
    trim: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
MediaSchema.index({ type: 1, isVisible: 1 });
MediaSchema.index({ uploadedBy: 1 });
MediaSchema.index({ createdAt: -1 });
MediaSchema.index({ tags: 1 });
MediaSchema.index({ tournament: 1 });

// Virtual for file size in human readable format
MediaSchema.virtual('sizeFormatted').get(function() {
  const bytes = this.size;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Virtual for full URL - now returns Cloudinary URL directly
MediaSchema.virtual('fullUrl').get(function() {
  // If URL is already a full Cloudinary URL, return as-is
  if (this.url && this.url.startsWith('http')) {
    return this.url;
  }
  
  // Fallback for legacy data
  const baseUrl = process.env.BASE_URL || 'https://api.gameonesport.xyz';
  return `${baseUrl}${this.url}`;
});

// Virtual for thumbnail URL (for images) - now uses Cloudinary transformations
MediaSchema.virtual('thumbnailUrl').get(function() {
  if (this.type === 'image' || this.mimeType.startsWith('image/')) {
    // If we have a Cloudinary public ID, we can generate optimized thumbnails
    if (this.publicId) {
      const cloudinary = require('cloudinary').v2;
      return cloudinary.url(this.publicId, {
        width: 300,
        height: 200,
        crop: 'fill',
        quality: 'auto:good',
        format: 'auto',
        secure: true
      });
    }
    
    // Fallback for legacy data
    if (this.url && this.url.startsWith('http')) {
      return this.url;
    }
    
    const baseUrl = process.env.BASE_URL || 'https://api.gameonesport.xyz';
    return `${baseUrl}/uploads/thumbnails/${this.filename}`;
  }
  return null;
});

// Virtual for optimized URL
MediaSchema.virtual('optimizedUrl').get(function() {
  if (this.publicId) {
    const cloudinary = require('cloudinary').v2;
    const options = {
      quality: 'auto:good',
      format: 'auto',
      secure: true
    };
    
    // Add size-specific optimizations
    if (this.width && this.height) {
      options.width = Math.min(this.width, 1200);
      options.height = Math.min(this.height, 800);
      options.crop = 'limit';
    }
    
    return cloudinary.url(this.publicId, options);
  }
  
  return this.fullUrl;
});

// Instance methods
MediaSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  return this.save();
};

MediaSchema.methods.incrementView = function() {
  this.viewCount += 1;
  return this.save();
};

MediaSchema.methods.archive = function() {
  this.status = 'archived';
  this.isVisible = false;
  return this.save();
};

MediaSchema.methods.restore = function() {
  this.status = 'active';
  this.isVisible = true;
  return this.save();
};

// Static methods
MediaSchema.statics.getByType = function(type, isVisible = true) {
  return this.find({ 
    type, 
    isVisible, 
    status: 'active' 
  }).sort({ createdAt: -1 });
};

MediaSchema.statics.getPublicMedia = function(type = null, limit = 50) {
  const filter = { 
    isPublic: true, 
    isVisible: true, 
    status: 'active' 
  };
  
  if (type) filter.type = type;
  
  return this.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-uploadedBy')
    .lean();
};

MediaSchema.statics.getMediaStats = function() {
  return this.aggregate([
    {
      $match: { status: 'active' }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalSize: { $sum: '$size' },
        totalDownloads: { $sum: '$downloadCount' },
        totalViews: { $sum: '$viewCount' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Pre-save middleware
MediaSchema.pre('save', function(next) {
  // Auto-generate alt text if not provided
  if (!this.altText && this.type === 'image') {
    this.altText = this.title || this.originalName;
  }
  
  next();
});

// Pre-remove middleware
MediaSchema.pre('remove', function(next) {
  // Mark as deleted instead of actually removing
  this.status = 'deleted';
  this.isVisible = false;
  next();
});

module.exports = mongoose.model('Media', MediaSchema);