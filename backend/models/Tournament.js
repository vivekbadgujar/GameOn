/**
 * Tournament Model for GameOn Platform
 */

const mongoose = require('mongoose');

const TournamentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 50
  },
  description: {
    type: String,
    maxlength: 500
  },
  poster: {
    type: String,
    default: ''
  },
  posterUrl: {
    type: String,
    default: ''
  },
  game: {
    type: String,
    required: true
  },
  map: {
    type: String,
    default: 'TBD'
  },
  tournamentType: {
    type: String,
    enum: ['solo', 'duo', 'squad'],
    default: 'squad'
  },
  entryFee: {
    type: Number,
    required: true
  },
  prizePool: {
    type: Number,
    required: true
  },
  maxParticipants: {
    type: Number,
    default: 100
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  roomDetails: {
    roomId: String,
    password: String,
    credentialsReleased: { type: Boolean, default: false },
    manualRelease: { type: Boolean, default: false },
    releaseTime: Date // When credentials should be auto-released
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'live', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    slotNumber: { type: Number, default: 0 }, // Changed from required: true to default: 0
    teamNumber: { type: Number }, // BGMI team number (1-25)
    kills: { type: Number, default: 0 },
    rank: { type: Number },
    paymentData: { type: mongoose.Schema.Types.Mixed },
    paymentStatus: { 
      type: String, 
      enum: ['pending', 'completed', 'failed'], 
      default: 'pending' 
    },
    paymentId: { type: String }, // Razorpay payment ID
    hasEditedSlot: { type: Boolean, default: false }, // Track if user has used slot editing
    slotUpdatedAt: { type: Date } // Track when slot was last updated
  }],
  winners: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    prize: Number
  }],
  screenshots: [{
    participant: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    url: String,
    verified: { type: Boolean, default: false }
  }],
  rules: {
    type: [String],
    default: [
      'No cheating or use of hacks',
      'Respect all players and moderators'
    ]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
TournamentSchema.index({ status: 1, startDate: 1 });
TournamentSchema.index({ 'participants.user': 1 });
TournamentSchema.index({ game: 1, status: 1 });

// Pre-save middleware for timestamps
TournamentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to check if user has joined
TournamentSchema.methods.hasUserJoined = function(userId) {
  return this.participants.some(p => p.user.toString() === userId.toString());
};

// Instance method to get user participation
TournamentSchema.methods.getUserParticipation = function(userId) {
  return this.participants.find(p => p.user.toString() === userId.toString());
};

module.exports = mongoose.model('Tournament', TournamentSchema);

