const mongoose = require('mongoose');

/**
 * Manual payment record for tournament entries.
 * This is intentionally kept minimal since we already track participants
 * inside the Tournament collection.  When an admin approves a payment,
 * the corresponding participant entry is created.
 */

const PaymentSchema = new mongoose.Schema({
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true,
    index: true
  },
  playerName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  gameId: {
    type: String,
    required: true,
    trim: true
  },
  transactionId: {
    type: String,
    required: true,
    trim: true,
    index: true,
    unique: true // prevent duplicate transaction ids
  },
  screenshotUrl: {
    type: String,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
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

// ensure one entry per email per tournament
PaymentSchema.index({ tournament: 1, email: 1 }, { unique: true });

PaymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Payment', PaymentSchema);
