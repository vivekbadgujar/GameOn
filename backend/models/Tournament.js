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
    enum: ['upcoming', 'live', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    slotNumber: { type: Number, required: true },
    kills: { type: Number, default: 0 },
    rank: { type: Number },
    paymentData: { type: mongoose.Schema.Types.Mixed }
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

// Pre-save middleware for timestamps
TournamentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Tournament', TournamentSchema);

