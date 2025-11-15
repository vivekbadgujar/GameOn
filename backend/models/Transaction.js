/**
 * Transaction Model for GameOn Platform
 * Handles all payment and wallet transactions
 */

const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  transactionId: {
    type: String,
    unique: true,
    required: true
  },
  
  type: {
    type: String,
    enum: [
      'deposit',
      'withdrawal', 
      'tournament_entry',
      'tournament_win',
      'referral_bonus',
      'refund',
      'admin_credit',
      'admin_debit'
    ],
    required: true
  },
  
  amount: {
    type: Number,
    required: true
  },
  
  currency: {
    type: String,
    default: 'INR'
  },
  
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  
  // For tournament-related transactions
  tournament: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament'
  },
  
  // Payment gateway details
  paymentGateway: {
    provider: {
      type: String,
      enum: ['cashfree', 'razorpay', 'paytm', 'upi', 'wallet'],
      default: 'cashfree'
    },
    gatewayTransactionId: String,
    gatewayOrderId: String,
    gatewayResponse: Object
  },

  // Cashfree specific fields
  cashfreeOrderId: {
    type: String,
    index: true
  },
  cashfreePaymentId: String,
  
  // Legacy Razorpay fields (for backward compatibility)
  razorpayOrderId: {
    type: String,
    index: true
  },
  razorpayPaymentId: String,
  
  // Wallet balance before and after transaction
  walletBalance: {
    before: Number,
    after: Number
  },
  
  description: {
    type: String,
    maxlength: 200
  },
  
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceInfo: Object,
    referenceId: String
  },
  
  // For failed transactions
  failureReason: String,
  retryCount: {
    type: Number,
    default: 0
  },
  
  // Admin notes for manual transactions
  adminNotes: String,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin who processed
  }
}, {
  timestamps: true
});

// Only add compound and non-duplicate indexes
TransactionSchema.index({ user: 1, createdAt: -1 });
TransactionSchema.index({ transactionId: 1 }, { unique: true });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ 'paymentGateway.gatewayTransactionId': 1 });

// Static methods
TransactionSchema.statics.generateTransactionId = function() {
  return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
};

TransactionSchema.statics.getUserTransactionHistory = function(userId, options = {}) {
  const { page = 1, limit = 20, type = null, status = null } = options;
  
  let query = { user: userId };
  if (type) query.type = type;
  if (status) query.status = status;
  
  return this.find(query)
    .populate('tournament', 'title')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

TransactionSchema.statics.getUserBalance = async function(userId) {
  const result = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId), status: 'completed' } },
    {
      $group: {
        _id: null,
        credits: {
          $sum: {
            $cond: [
              { $in: ['$type', ['deposit', 'tournament_win', 'referral_bonus', 'refund', 'admin_credit']] },
              '$amount',
              0
            ]
          }
        },
        debits: {
          $sum: {
            $cond: [
              { $in: ['$type', ['withdrawal', 'tournament_entry', 'admin_debit']] },
              '$amount',
              0
            ]
          }
        }
      }
    }
  ]);
  
  if (result.length === 0) return 0;
  return result[0].credits - result[0].debits;
};

module.exports = mongoose.model('Transaction', TransactionSchema);
