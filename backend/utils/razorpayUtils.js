/**
 * Razorpay Payment Utilities for GameOn Platform
 * Handles UPI payments, wallet transactions, and payouts
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');
const Transaction = require('../models/Transaction');

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Create a payment order for tournament entry
 * @param {Object} params - Payment parameters
 * @returns {Object} Razorpay order details
 */
const createTournamentPaymentOrder = async ({ 
  userId, 
  tournamentId, 
  amount, 
  currency = 'INR',
  description = 'Tournament Entry Fee'
}) => {
  try {
    // Validate amount (minimum ₹10, maximum ₹500)
    if (amount < 10 || amount > 500) {
      throw new Error('Invalid amount. Must be between ₹10 and ₹500');
    }

    // Create order with Razorpay
    const orderOptions = {
      amount: amount * 100, // Razorpay expects amount in paisa
      currency,
      receipt: `tournament_${tournamentId}_${userId}_${Date.now()}`,
      payment_capture: 1, // Auto capture
      notes: {
        userId,
        tournamentId,
        type: 'tournament_entry',
        platform: 'gameon'
      }
    };

    const razorpayOrder = await razorpayInstance.orders.create(orderOptions);

    // Create transaction record in database
    const transaction = new Transaction({
      user: userId,
      transactionId: Transaction.generateTransactionId(),
      type: 'tournament_entry',
      amount,
      currency,
      status: 'pending',
      tournament: tournamentId,
      paymentGateway: {
        provider: 'razorpay',
        gatewayOrderId: razorpayOrder.id
      },
      description,
      metadata: {
        referenceId: razorpayOrder.receipt
      }
    });

    await transaction.save();

    return {
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt
      },
      transactionId: transaction.transactionId,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID
    };

  } catch (error) {
    console.error('Create payment order error:', error);
    throw new Error(`Payment order creation failed: ${error.message}`);
  }
};

/**
 * Verify payment signature from Razorpay webhook
 * @param {Object} paymentData - Payment data from Razorpay
 * @param {string} signature - Payment signature
 * @returns {boolean} Verification result
 */
const verifyPaymentSignature = (paymentData, signature) => {
  try {
    const { razorpay_order_id, razorpay_payment_id } = paymentData;
    
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Payment verification error:', error);
    return false;
  }
};

/**
 * Process successful payment
 * @param {Object} paymentData - Payment data from Razorpay
 * @returns {Object} Processing result
 */
const processSuccessfulPayment = async (paymentData) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

    // Find the transaction by order ID
    const transaction = await Transaction.findOne({
      'paymentGateway.gatewayOrderId': razorpay_order_id,
      status: 'pending'
    }).populate('user tournament');

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Verify signature
    const isValidSignature = verifyPaymentSignature(paymentData, razorpay_signature);
    if (!isValidSignature) {
      throw new Error('Invalid payment signature');
    }

    // Fetch payment details from Razorpay
    const paymentDetails = await razorpayInstance.payments.fetch(razorpay_payment_id);

    // Update transaction status
    transaction.status = 'completed';
    transaction.paymentGateway.gatewayTransactionId = razorpay_payment_id;
    transaction.paymentGateway.gatewayResponse = paymentDetails;

    // Update wallet balance
    const currentBalance = await Transaction.getUserBalance(transaction.user._id);
    transaction.walletBalance = {
      before: currentBalance,
      after: currentBalance - transaction.amount
    };

    await transaction.save();

    // Update user's tournament participation
    // This would typically be handled in the tournament service
    
    return {
      success: true,
      transaction,
      message: 'Payment processed successfully'
    };

  } catch (error) {
    console.error('Payment processing error:', error);
    throw error;
  }
};

/**
 * Process failed payment
 * @param {string} orderId - Razorpay order ID
 * @param {string} reason - Failure reason
 * @returns {Object} Processing result
 */
const processFailedPayment = async (orderId, reason = 'Payment failed') => {
  try {
    const transaction = await Transaction.findOne({
      'paymentGateway.gatewayOrderId': orderId,
      status: 'pending'
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    transaction.status = 'failed';
    transaction.failureReason = reason;
    await transaction.save();

    return {
      success: true,
      transaction,
      message: 'Payment failure recorded'
    };

  } catch (error) {
    console.error('Payment failure processing error:', error);
    throw error;
  }
};

/**
 * Create deposit order for wallet recharge
 * @param {Object} params - Deposit parameters
 * @returns {Object} Razorpay order details
 */
const createDepositOrder = async ({ userId, amount, currency = 'INR' }) => {
  try {
    // Validate amount (minimum ₹50, maximum ₹10000)
    if (amount < 50 || amount > 10000) {
      throw new Error('Invalid amount. Must be between ₹50 and ₹10,000');
    }

    const orderOptions = {
      amount: amount * 100,
      currency,
      receipt: `deposit_${userId}_${Date.now()}`,
      payment_capture: 1,
      notes: {
        userId,
        type: 'wallet_deposit',
        platform: 'gameon'
      }
    };

    const razorpayOrder = await razorpayInstance.orders.create(orderOptions);

    // Create transaction record
    const transaction = new Transaction({
      user: userId,
      transactionId: Transaction.generateTransactionId(),
      type: 'deposit',
      amount,
      currency,
      status: 'pending',
      paymentGateway: {
        provider: 'razorpay',
        gatewayOrderId: razorpayOrder.id
      },
      description: 'Wallet Recharge',
      metadata: {
        referenceId: razorpayOrder.receipt
      }
    });

    await transaction.save();

    return {
      success: true,
      order: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt
      },
      transactionId: transaction.transactionId,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID
    };

  } catch (error) {
    console.error('Create deposit order error:', error);
    throw new Error(`Deposit order creation failed: ${error.message}`);
  }
};

/**
 * Process withdrawal request
 * @param {Object} params - Withdrawal parameters
 * @returns {Object} Withdrawal processing result
 */
const processWithdrawal = async ({ 
  userId, 
  amount, 
  accountDetails, 
  withdrawalMethod = 'upi' 
}) => {
  try {
    // Validate minimum withdrawal amount
    if (amount < 100) {
      throw new Error('Minimum withdrawal amount is ₹100');
    }

    // Check user balance
    const currentBalance = await Transaction.getUserBalance(userId);
    if (currentBalance < amount) {
      throw new Error('Insufficient balance');
    }

    // Create withdrawal transaction
    const transaction = new Transaction({
      user: userId,
      transactionId: Transaction.generateTransactionId(),
      type: 'withdrawal',
      amount,
      status: 'pending',
      description: `Withdrawal via ${withdrawalMethod}`,
      metadata: {
        accountDetails,
        withdrawalMethod
      },
      walletBalance: {
        before: currentBalance,
        after: currentBalance - amount
      }
    });

    await transaction.save();

    // For demo purposes, we'll mark it as completed immediately
    // In production, this would involve actual payout processing
    if (process.env.NODE_ENV === 'development') {
      transaction.status = 'completed';
      await transaction.save();
    }

    return {
      success: true,
      transaction,
      message: 'Withdrawal request processed',
      estimatedTime: '1-3 business days'
    };

  } catch (error) {
    console.error('Withdrawal processing error:', error);
    throw error;
  }
};

/**
 * Distribute tournament winnings
 * @param {string} tournamentId - Tournament ID
 * @param {Array} winners - Array of winner objects
 * @returns {Object} Distribution result
 */
const distributeTournamentWinnings = async (tournamentId, winners) => {
  try {
    const transactions = [];

    for (const winner of winners) {
      const { userId, prize } = winner;

      if (prize <= 0) continue;

      // Get user's current balance
      const currentBalance = await Transaction.getUserBalance(userId);

      // Create winning transaction
      const transaction = new Transaction({
        user: userId,
        transactionId: Transaction.generateTransactionId(),
        type: 'tournament_win',
        amount: prize,
        status: 'completed',
        tournament: tournamentId,
        description: `Tournament Prize - Rank ${winners.indexOf(winner) + 1}`,
        walletBalance: {
          before: currentBalance,
          after: currentBalance + prize
        }
      });

      await transaction.save();
      transactions.push(transaction);
    }

    return {
      success: true,
      message: 'Winnings distributed successfully',
      transactions: transactions.length
    };

  } catch (error) {
    console.error('Winnings distribution error:', error);
    throw error;
  }
};

/**
 * Process referral bonus
 * @param {string} referrerId - Referrer user ID
 * @param {string} referredId - Referred user ID
 * @param {number} bonus - Bonus amount (default ₹20)
 * @returns {Object} Processing result
 */
const processReferralBonus = async (referrerId, referredId, bonus = 20) => {
  try {
    // Check if bonus already given for this referral
    const existingBonus = await Transaction.findOne({
      user: referrerId,
      type: 'referral_bonus',
      'metadata.referredUserId': referredId
    });

    if (existingBonus) {
      throw new Error('Referral bonus already processed');
    }

    const currentBalance = await Transaction.getUserBalance(referrerId);

    // Create referral bonus transaction
    const transaction = new Transaction({
      user: referrerId,
      transactionId: Transaction.generateTransactionId(),
      type: 'referral_bonus',
      amount: bonus,
      status: 'completed',
      description: 'Referral Bonus',
      metadata: {
        referredUserId: referredId,
        bonusType: 'referral'
      },
      walletBalance: {
        before: currentBalance,
        after: currentBalance + bonus
      }
    });

    await transaction.save();

    return {
      success: true,
      transaction,
      message: 'Referral bonus processed successfully'
    };

  } catch (error) {
    console.error('Referral bonus processing error:', error);
    throw error;
  }
};

/**
 * Get payment analytics
 * @param {Object} filters - Date and other filters
 * @returns {Object} Analytics data
 */
const getPaymentAnalytics = async (filters = {}) => {
  try {
    const { startDate, endDate, type } = filters;
    
    let matchQuery = { status: 'completed' };
    
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }
    
    if (type) matchQuery.type = type;

    const analytics = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    return {
      success: true,
      analytics
    };

  } catch (error) {
    console.error('Analytics error:', error);
    throw error;
  }
};

module.exports = {
  createTournamentPaymentOrder,
  createDepositOrder,
  verifyPaymentSignature,
  processSuccessfulPayment,
  processFailedPayment,
  processWithdrawal,
  distributeTournamentWinnings,
  processReferralBonus,
  getPaymentAnalytics
};
