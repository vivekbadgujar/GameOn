/**
 * Tournament Video Model for GameOn Platform
 * Handles YouTube videos related to tournaments
 */

const mongoose = require('mongoose');

const TournamentVideoSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  
  // YouTube Details
  youtubeUrl: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        if (!v) return false;
        
        // Use a simpler validation approach
        const patterns = [
          /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
          /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
          /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
          /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
          /youtube\.com\/watch\?.*[&?]v=([a-zA-Z0-9_-]{11})/,
          /(?:m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/
        ];
        
        const isValid = patterns.some(pattern => pattern.test(v));
        console.log('Validating YouTube URL:', v, 'Valid:', isValid);
        
        return isValid;
      },
      message: 'Please provide a valid YouTube URL (youtube.com/watch?v=... or youtu.be/...)'
    }
  },
  youtubeId: {
    type: String,
    required: true
  },
  thumbnail: {
    type: String,
    default: ''
  },
  duration: {
    type: String,
    default: ''
  },
  
  // Association
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament'
  },
  game: {
    type: String,
    required: true
  },
  
  // Visibility
  isVisible: {
    type: Boolean,
    default: false
  },
  
  // Category
  category: {
    type: String,
    enum: ['highlights', 'tutorial', 'announcement', 'live_stream', 'recap', 'other'],
    default: 'highlights'
  },
  
  // Tags
  tags: [{
    type: String,
    trim: true
  }],
  
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  
  // Creator
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  
  // Order for display
  displayOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
TournamentVideoSchema.index({ isVisible: 1, displayOrder: 1 });
TournamentVideoSchema.index({ game: 1, isVisible: 1 });
TournamentVideoSchema.index({ tournament: 1 });
TournamentVideoSchema.index({ category: 1, isVisible: 1 });
TournamentVideoSchema.index({ createdBy: 1, createdAt: -1 });

// Static method to get visible videos
TournamentVideoSchema.statics.getVisibleVideos = function(options = {}) {
  const { game, category, tournament, limit = 20 } = options;
  
  let query = { isVisible: true };
  
  if (game) query.game = game;
  if (category) query.category = category;
  if (tournament) query.tournament = tournament;
  
  return this.find(query)
    .populate('tournament', 'title game')
    .populate('createdBy', 'name')
    .sort({ displayOrder: 1, createdAt: -1 })
    .limit(limit);
};

// Method to extract YouTube ID from URL
TournamentVideoSchema.statics.extractYouTubeId = function(url) {
  if (!url || typeof url !== 'string') return null;
  
  console.log('Extracting YouTube ID from URL:', url);
  
  // Clean the URL
  url = url.trim();
  
  // Handle different YouTube URL formats
  const patterns = [
    // Standard watch URLs
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    // Short URLs
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    // Embed URLs
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    // Old format
    /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
    // Watch URLs with additional parameters
    /youtube\.com\/watch\?.*[&?]v=([a-zA-Z0-9_-]{11})/,
    // Mobile URLs
    /(?:m\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1] && match[1].length === 11) {
      console.log('Successfully extracted YouTube ID:', match[1]);
      return match[1];
    }
  }
  
  console.log('Failed to extract YouTube ID from URL:', url);
  return null;
};

// Pre-save middleware to extract YouTube ID
TournamentVideoSchema.pre('save', function(next) {
  if (this.youtubeUrl && !this.youtubeId) {
    this.youtubeId = this.constructor.extractYouTubeId(this.youtubeUrl);
  }
  
  // Set default thumbnail if not provided
  if (this.youtubeId && !this.thumbnail) {
    this.thumbnail = `https://img.youtube.com/vi/${this.youtubeId}/maxresdefault.jpg`;
  }
  
  next();
});

module.exports = mongoose.model('TournamentVideo', TournamentVideoSchema);