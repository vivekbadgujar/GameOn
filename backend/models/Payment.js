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
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  rejectionReason: {
    type: String,
    trim: true,
    default: ''
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  }
}, {
  // Use Mongoose built-in timestamps — correctly updates updatedAt on
  // findOneAndUpdate / updateOne, not just on save()
  timestamps: true
});

// ensure one entry per email per tournament
PaymentSchema.index({ tournament: 1, email: 1 }, { unique: true });

// Helper: detect MongoDB duplicate key errors (E11000)
PaymentSchema.statics.isDuplicateKeyError = function(err) {
  return err && err.code === 11000;
};

module.exports = mongoose.model('Payment', PaymentSchema);
