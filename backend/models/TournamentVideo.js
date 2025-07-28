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
        return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(v);
      },
      message: 'Please provide a valid YouTube URL'
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
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
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