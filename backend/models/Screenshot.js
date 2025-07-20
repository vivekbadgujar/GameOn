const mongoose = require('mongoose');

const ScreenshotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: false
  },
  imageUrl: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  // Reference to AIFlag if this screenshot resulted in a flag
  aiFlagId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIFlag',
    required: false
  }
});

module.exports = mongoose.model('Screenshot', ScreenshotSchema);