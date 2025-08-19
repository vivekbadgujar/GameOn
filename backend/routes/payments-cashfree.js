/**
 * Payment Routes for GameOn Platform
 * Handles Cashfree integration for wallet top-ups and tournament payments
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Tournament = require('../models/Tournament');
const RoomSlot = require('../models/RoomSlot');
const { authenticateToken } = require('../middleware/auth');
const cashfreeService = require('../services/cashfreeService');

const router = express.Router();

// Rate limiting for payment requests
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 payment requests per IP
  message: {
    success: false,
    message: 'Too many payment requests. Please try again later.'
  }
});

// Create Cashfree order for wallet top-up
router.post('/create-order',
  paymentLimiter,
  authenticateToken,
  [
    body('amount')
      .isInt({ min: 10, max: 10000 })
      .withMessage('Amount must be between ₹10 and ₹10,000'),
    body('currency')
      .optional()
      .isIn(['INR'])
      .withMessage('Only INR currency is supported')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { amount, currency = 'INR' } = req.body;
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Generate unique order ID
      const orderId = `wallet_${userId}_${Date.now()}`;

      // Create Cashfree order
      const orderData = {
        orderId: orderId,
        amount: amount,
        currency: currency,
        customerDetails: {
          customerId: userId,
          customerName: user.profile?.name || user.username || 'GameOn User',
          customerEmail: user.email || `${userId}@gameonesport.xyz`,
          customerPhone: user.profile?.phone || '9999999999'
        },
        orderMeta: {
          userId: userId,
          type: 'wallet_topup'
        },
        orderNote: `Wallet top-up of ₹${amount}`
      };

      const cashfreeOrder = await cashfreeService.createOrder(orderData);

      if (!cashfreeOrder.success) {
        return res.status(503).json({
          success: false,
          message: 'Payment service is currently unavailable'
        });
      }

      // Create pending transaction record
      const transaction = new Transaction({
        user: userId,
        amount: amount,
        type: 'wallet_topup',
        status: 'pending',
        cashfreeOrderId: orderId,
        description: `Wallet top-up of ₹${amount}`,
        metadata: {
          currency: currency,
          cashfreeData: cashfreeOrder.data
        }
      });

      await transaction.save();

      res.json({
        success: true,
        message: 'Order created successfully',
        data: {
          orderId: orderId,
          amount: amount,
          currency: currency,
          paymentSessionId: cashfreeOrder.data.payment_session_id,
          cashfreeOrderToken: cashfreeOrder.data.order_token
        }
      });

    } catch (error) {
      console.error('Create order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create payment order'
      });
    }
  }
);

// Verify payment and update wallet
router.post('/verify',
  authenticateToken,
  [
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('orderAmount').notEmpty().withMessage('Order amount is required'),
    body('referenceId').notEmpty().withMessage('Reference ID is required'),
    body('txStatus').notEmpty().withMessage('Transaction status is required'),
    body('signature').notEmpty().withMessage('Signature is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const paymentData = req.body;
      const userId = req.user.id;

      // Verify signature
      const isValidSignature = cashfreeService.verifyPayment(paymentData);
      
      if (!isValidSignature) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment signature'
        });
      }

      // Check if payment was successful
      if (paymentData.txStatus !== 'SUCCESS') {
        return res.status(400).json({
          success: false,
          message: 'Payment was not successful'
        });
      }

      // Find and update transaction
      const transaction = await Transaction.findOne({
        cashfreeOrderId: paymentData.orderId,
        user: userId,
        status: 'pending'
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // Update transaction status
      transaction.status = 'completed';
      transaction.cashfreePaymentId = paymentData.referenceId;
      transaction.completedAt = new Date();
      transaction.metadata = {
        ...transaction.metadata,
        paymentData: paymentData
      };
      await transaction.save();

      // Update user wallet
      const user = await User.findById(userId);
      user.wallet.balance += transaction.amount;
      user.wallet.totalDeposits += transaction.amount;
      await user.save();

      // Process referral bonus if applicable
      if (user.referral.referredBy) {
        await processReferralBonus(user.referral.referredBy, transaction.amount);
      }

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          transactionId: transaction._id,
          amount: transaction.amount,
          newBalance: user.wallet.balance
        }
      });

    } catch (error) {
      console.error('Payment verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify payment'
      });
    }
  }
);

// Create tournament payment order
router.post('/create-tournament-order',
  paymentLimiter,
  authenticateToken,
  [
    body('tournamentId').notEmpty().withMessage('Tournament ID is required'),
    body('joinType').isIn(['solo', 'squad']).withMessage('Invalid join type'),
    body('squadMembers').optional().isArray({ min: 4, max: 4 }).withMessage('Squad must have exactly 4 members')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { tournamentId, joinType, squadMembers } = req.body;
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Fetch tournament details
      const tournament = await Tournament.findById(tournamentId);
      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: 'Tournament not found'
        });
      }

      // Check if tournament is open for registration
      if (tournament.status !== 'upcoming') {
        return res.status(400).json({
          success: false,
          message: 'Tournament registration is closed'
        });
      }

      // Check if user already joined
      const alreadyJoined = tournament.participants.some(p => 
        p.user.toString() === userId
      );

      if (alreadyJoined) {
        return res.status(400).json({
          success: false,
          message: 'You have already joined this tournament'
        });
      }

      // Calculate amount and check availability
      const requiredSlots = joinType === 'squad' ? 4 : 1;
      const availableSlots = tournament.maxParticipants - tournament.currentParticipants;
      
      if (availableSlots < requiredSlots) {
        return res.status(400).json({
          success: false,
          message: `Not enough slots available. Required: ${requiredSlots}, Available: ${availableSlots}`
        });
      }

      const amount = tournament.entryFee * requiredSlots;
      const orderId = `tournament_${tournamentId}_${userId}_${Date.now()}`;

      // Create Cashfree order
      const orderData = {
        orderId: orderId,
        amount: amount,
        currency: 'INR',
        customerDetails: {
          customerId: userId,
          customerName: user.profile?.name || user.username || 'GameOn User',
          customerEmail: user.email || `${userId}@gameonesport.xyz`,
          customerPhone: user.profile?.phone || '9999999999'
        },
        orderMeta: {
          tournamentId,
          userId,
          joinType,
          squadMembers: joinType === 'squad' ? JSON.stringify(squadMembers) : undefined
        },
        orderNote: `Tournament entry: ${tournament.title}`
      };

      const cashfreeOrder = await cashfreeService.createOrder(orderData);

      if (!cashfreeOrder.success) {
        return res.status(503).json({
          success: false,
          message: 'Payment service is currently unavailable'
        });
      }

      // Create transaction record
      const transaction = new Transaction({
        user: userId,
        amount: amount,
        type: 'tournament_entry',
        status: 'pending',
        description: `Tournament entry: ${tournament.title}`,
        cashfreeOrderId: orderId,
        tournamentId: tournamentId,
        metadata: {
          joinType,
          squadMembers: joinType === 'squad' ? squadMembers : undefined,
          cashfreeData: cashfreeOrder.data
        }
      });

      await transaction.save();

      res.json({
        success: true,
        message: 'Tournament payment order created successfully',
        data: {
          orderId: orderId,
          amount: amount,
          currency: 'INR',
          paymentSessionId: cashfreeOrder.data.payment_session_id,
          cashfreeOrderToken: cashfreeOrder.data.order_token
        }
      });

    } catch (error) {
      console.error('Create tournament order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create tournament payment order'
      });
    }
  }
);

// Verify tournament payment
router.post('/verify-tournament',
  authenticateToken,
  [
    body('orderId').notEmpty().withMessage('Order ID is required'),
    body('orderAmount').notEmpty().withMessage('Order amount is required'),
    body('referenceId').notEmpty().withMessage('Reference ID is required'),
    body('txStatus').notEmpty().withMessage('Transaction status is required'),
    body('signature').notEmpty().withMessage('Signature is required'),
    body('tournamentId').notEmpty().withMessage('Tournament ID is required'),
    body('joinType').isIn(['solo', 'squad']).withMessage('Invalid join type'),
    body('gameProfile').isObject().withMessage('Game profile is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const paymentData = req.body;
      const { tournamentId, joinType, squadMembers, gameProfile } = req.body;
      const userId = req.user.id;

      // Verify signature
      const isValidSignature = cashfreeService.verifyPayment(paymentData);
      
      if (!isValidSignature) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment signature'
        });
      }

      // Check if payment was successful
      if (paymentData.txStatus !== 'SUCCESS') {
        return res.status(400).json({
          success: false,
          message: 'Payment was not successful'
        });
      }

      // Find and update transaction
      const transaction = await Transaction.findOne({
        cashfreeOrderId: paymentData.orderId,
        user: userId,
        status: 'pending'
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // Update transaction status
      transaction.status = 'completed';
      transaction.cashfreePaymentId = paymentData.referenceId;
      transaction.completedAt = new Date();
      transaction.metadata = {
        ...transaction.metadata,
        paymentData: paymentData
      };
      await transaction.save();

      // Add participant to tournament
      const tournament = await Tournament.findById(tournamentId);
      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: 'Tournament not found'
        });
      }

      // Create participant entry
      const participantData = {
        user: userId,
        joinType: joinType,
        gameProfile: gameProfile,
        status: 'confirmed',
        paymentConfirmedAt: new Date(),
        transactionId: transaction._id
      };

      if (joinType === 'squad' && squadMembers) {
        participantData.squadMembers = squadMembers;
      }

      tournament.participants.push(participantData);
      tournament.currentParticipants += (joinType === 'squad' ? 4 : 1);
      await tournament.save();

      // Emit Socket.IO event for real-time updates
      const io = req.app.get('io');
      if (io) {
        io.emit('participantJoined', {
          tournamentId: tournamentId,
          participantId: participantData._id,
          userId: userId,
          joinType: joinType
        });
      }

      res.json({
        success: true,
        message: 'Tournament payment verified and participant added successfully',
        data: {
          transactionId: transaction._id,
          amount: transaction.amount,
          tournamentId: tournamentId,
          participantId: participantData._id
        }
      });

    } catch (error) {
      console.error('Tournament payment verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify tournament payment'
      });
    }
  }
);

// Cashfree webhook endpoint
router.post('/webhook', async (req, res) => {
  try {
    const paymentData = req.body;
    
    // Verify webhook signature
    const isValidSignature = cashfreeService.verifyPayment(paymentData);
    
    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    // Find transaction
    const transaction = await Transaction.findOne({
      cashfreeOrderId: paymentData.orderId,
      status: 'pending'
    });

    if (!transaction) {
      console.error('Transaction not found for webhook:', paymentData.orderId);
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Update transaction based on payment status
    if (paymentData.txStatus === 'SUCCESS') {
      transaction.status = 'completed';
      transaction.cashfreePaymentId = paymentData.referenceId;
      transaction.completedAt = new Date();
      
      // Update user wallet for wallet top-ups
      if (transaction.type === 'wallet_topup') {
        const user = await User.findById(transaction.user);
        if (user) {
          user.wallet.balance += transaction.amount;
          user.wallet.totalDeposits += transaction.amount;
          await user.save();
        }
      }
    } else if (paymentData.txStatus === 'FAILED' || paymentData.txStatus === 'CANCELLED') {
      transaction.status = 'failed';
      transaction.failureReason = paymentData.txMsg;
    }

    transaction.metadata = {
      ...transaction.metadata,
      webhookData: paymentData
    };
    
    await transaction.save();

    res.json({ success: true, message: 'Webhook processed successfully' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});

// Helper function for referral bonus (to be implemented)
async function processReferralBonus(referrerId, amount) {
  try {
    // Implement referral bonus logic here
    console.log(`Processing referral bonus for ${referrerId}, amount: ${amount}`);
  } catch (error) {
    console.error('Referral bonus processing error:', error);
  }
}

module.exports = router;