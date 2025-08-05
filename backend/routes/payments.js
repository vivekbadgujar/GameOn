/**
 * Payment Routes for GameOn Platform
 * Handles Razorpay integration for wallet top-ups and tournament payments
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Tournament = require('../models/Tournament');
const RoomSlot = require('../models/RoomSlot');
const { authenticateToken } = require('../middleware/auth');
const { processReferralBonus } = require('../utils/razorpayUtils');

const router = express.Router();

// Initialize Razorpay
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.log('⚠️  Razorpay not configured in payments route');
}

// Rate limiting for payment requests
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 payment requests per IP
  message: {
    success: false,
    message: 'Too many payment requests. Please try again later.'
  }
});

// Create Razorpay order for wallet top-up
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

      // Check if Razorpay is configured
      if (!razorpay) {
        return res.status(503).json({
          success: false,
          message: 'Payment service is currently unavailable'
        });
      }

      // Create Razorpay order
      const orderOptions = {
        amount: amount * 100, // Convert to paise
        currency: currency,
        receipt: `wallet_topup_${userId}_${Date.now()}`,
        notes: {
          userId: userId,
          type: 'wallet_topup'
        }
      };

      const order = await razorpay.orders.create(orderOptions);

      // Create pending transaction record
      const transaction = new Transaction({
        user: userId,
        amount: amount,
        type: 'wallet_topup',
        status: 'pending',
        razorpayOrderId: order.id,
        description: `Wallet top-up of ₹${amount}`,
        metadata: {
          currency: currency,
          receipt: order.receipt
        }
      });

      await transaction.save();

      res.json({
        success: true,
        message: 'Order created successfully',
        data: {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt
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
    body('razorpay_order_id').notEmpty().withMessage('Order ID is required'),
    body('razorpay_payment_id').notEmpty().withMessage('Payment ID is required'),
    body('razorpay_signature').notEmpty().withMessage('Signature is required')
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

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      const userId = req.user.id;

      // Verify signature
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex');

      if (signature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment signature'
        });
      }

      // Find and update transaction
      const transaction = await Transaction.findOne({
        razorpayOrderId: razorpay_order_id,
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
      transaction.razorpayPaymentId = razorpay_payment_id;
      transaction.completedAt = new Date();
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

      // If this is a tournament payment, automatically confirm participant
      if (transaction.type === 'tournament_entry' && transaction.tournamentId) {
        try {
          const tournament = await Tournament.findById(transaction.tournamentId);
          if (tournament) {
            const participant = tournament.participants.find(p => 
              p.user.toString() === userId.toString()
            );
            
            if (participant && participant.status !== 'confirmed') {
              participant.status = 'confirmed';
              participant.paymentConfirmedAt = new Date();
              await tournament.save();

              // Emit Socket.IO event for real-time updates
              const io = req.app.get('io');
              if (io) {
                io.emit('participantConfirmed', {
                  tournamentId: transaction.tournamentId,
                  participantId: participant._id,
                  userId: userId
                });
              }

              console.log(`Auto-confirmed participant ${userId} for tournament ${transaction.tournamentId}`);
            }
          }
        } catch (error) {
          console.error('Error auto-confirming participant:', error);
          // Don't fail the payment verification if participant confirmation fails
        }
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

      // Create Razorpay order
      const order = await razorpay.orders.create({
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        receipt: `tournament_${tournamentId}_${userId}_${Date.now()}`,
        notes: {
          tournamentId,
          userId,
          joinType,
          squadMembers: joinType === 'squad' ? JSON.stringify(squadMembers) : undefined
        }
      });

      // Create transaction record
      const transaction = new Transaction({
        user: userId,
        amount: amount,
        type: 'tournament_entry',
        status: 'pending',
        description: `Tournament entry: ${tournament.title}`,
        razorpayOrderId: order.id,
        tournamentId: tournamentId,
        metadata: {
          joinType,
          squadMembers: joinType === 'squad' ? squadMembers : undefined
        }
      });

      await transaction.save();

      res.json({
        success: true,
        message: 'Tournament payment order created successfully',
        data: {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt
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
    body('razorpay_order_id').notEmpty().withMessage('Order ID is required'),
    body('razorpay_payment_id').notEmpty().withMessage('Payment ID is required'),
    body('razorpay_signature').notEmpty().withMessage('Signature is required'),
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

      const { 
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature,
        tournamentId,
        joinType,
        squadMembers,
        gameProfile
      } = req.body;
      const userId = req.user.id;

      // Verify signature
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex');

      if (signature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment signature'
        });
      }

      // Find and update transaction
      const transaction = await Transaction.findOne({
        razorpayOrderId: razorpay_order_id,
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
      transaction.razorpayPaymentId = razorpay_payment_id;
      transaction.completedAt = new Date();
      await transaction.save();

      // Update user's game profile
      const user = await User.findById(userId);
      if (gameProfile.bgmiName) user.gameProfile.bgmiName = gameProfile.bgmiName;
      if (gameProfile.bgmiId) user.gameProfile.bgmiId = gameProfile.bgmiId;
      await user.save();

      // Add participant(s) to tournament
      const tournament = await Tournament.findById(tournamentId);
      
      if (joinType === 'squad') {
        // Add all squad members
        const startingSlot = tournament.currentParticipants + 1;
        const squadId = `squad_${Date.now()}`;
        
        for (let i = 0; i < squadMembers.length; i++) {
          const memberUser = await User.findOne({ username: squadMembers[i] });
          if (memberUser) {
            tournament.participants.push({
              user: memberUser._id,
              joinedAt: new Date(),
              slotNumber: startingSlot + i,
              status: 'confirmed',
              squadId: squadId,
              paymentConfirmedAt: new Date()
            });
          }
        }
        tournament.currentParticipants += squadMembers.length;
      } else {
        // Add solo participant
        const slotNumber = tournament.currentParticipants + 1;
        tournament.participants.push({
          user: userId,
          joinedAt: new Date(),
          slotNumber: slotNumber,
          status: 'confirmed',
          paymentConfirmedAt: new Date()
        });
        tournament.currentParticipants += 1;
      }

      await tournament.save();

      // Auto-assign to room slots after successful payment
      let roomSlot = await RoomSlot.findOne({ tournament: tournamentId });
      if (!roomSlot) {
        // Create room slot layout if it doesn't exist
        roomSlot = await RoomSlot.createForTournament(
          tournamentId,
          tournament.tournamentType,
          tournament.maxParticipants
        );
      }

      let assignedSlots = [];
      
      if (joinType === 'squad') {
        // Auto-assign all squad members to consecutive slots in the same team
        for (let i = 0; i < squadMembers.length; i++) {
          const memberUser = await User.findOne({ username: squadMembers[i] });
          if (memberUser) {
            try {
              roomSlot.autoAssignPlayer(memberUser._id);
              const playerSlot = roomSlot.getPlayerSlot(memberUser._id);
              assignedSlots.push({
                userId: memberUser._id,
                username: memberUser.username,
                teamNumber: playerSlot.teamNumber,
                slotNumber: playerSlot.slotNumber
              });
            } catch (error) {
              console.log(`Could not auto-assign squad member ${memberUser.username}:`, error.message);
            }
          }
        }
      } else {
        // Auto-assign solo player
        try {
          roomSlot.autoAssignPlayer(userId);
          const playerSlot = roomSlot.getPlayerSlot(userId);
          assignedSlots.push({
            userId: userId,
            username: user.username,
            teamNumber: playerSlot.teamNumber,
            slotNumber: playerSlot.slotNumber
          });
        } catch (error) {
          console.log(`Could not auto-assign player ${user.username}:`, error.message);
        }
      }

      await roomSlot.save();

      // Emit Socket.IO events
      const io = req.app.get('io');
      if (io) {
        // Emit participant joined event
        io.emit('participantJoined', {
          tournamentId,
          userId,
          username: user.username,
          joinType,
          squadMembers: joinType === 'squad' ? squadMembers : undefined
        });

        // Emit room slot assignment events
        assignedSlots.forEach(slot => {
          io.to(`tournament_${tournamentId}`).emit('playerAssigned', {
            tournamentId,
            playerId: slot.userId,
            username: slot.username,
            teamNumber: slot.teamNumber,
            slotNumber: slot.slotNumber,
            roomSlot: roomSlot
          });
        });
      }

      res.json({
        success: true,
        message: 'Tournament payment verified and participant added successfully',
        data: {
          transactionId: transaction._id,
          paymentId: razorpay_payment_id,
          slotNumber: joinType === 'squad' 
            ? `${tournament.currentParticipants - squadMembers.length + 1}-${tournament.currentParticipants}`
            : tournament.currentParticipants,
          status: 'confirmed',
          roomSlots: assignedSlots,
          redirectTo: `/tournament/${tournamentId}/room-lobby`
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

// Get payment status
router.get('/status/:orderId',
  authenticateToken,
  async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user.id;

      const transaction = await Transaction.findOne({
        razorpayOrderId: orderId,
        user: userId
      });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      res.json({
        success: true,
        data: {
          status: transaction.status,
          amount: transaction.amount,
          type: transaction.type,
          createdAt: transaction.createdAt,
          completedAt: transaction.completedAt
        }
      });

    } catch (error) {
      console.error('Get payment status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment status'
      });
    }
  }
);

// Withdraw money to UPI
router.post('/withdraw',
  paymentLimiter,
  authenticateToken,
  [
    body('amount')
      .isInt({ min: 50, max: 10000 })
      .withMessage('Withdrawal amount must be between ₹50 and ₹10,000'),
    body('upiId')
      .matches(/^[a-zA-Z0-9._-]+@[a-zA-Z]{3,}$/)
      .withMessage('Please provide a valid UPI ID')
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

      const { amount, upiId } = req.body;
      const userId = req.user.id;

      // Check user balance
      const user = await User.findById(userId);
      if (user.wallet.balance < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient wallet balance'
        });
      }

      // Create withdrawal transaction
      const transaction = new Transaction({
        user: userId,
        amount: amount,
        type: 'withdrawal',
        status: 'pending',
        description: `Withdrawal to ${upiId}`,
        metadata: {
          upiId: upiId,
          withdrawalMethod: 'upi'
        }
      });

      await transaction.save();

      // Deduct from wallet
      user.wallet.balance -= amount;
      user.wallet.totalWithdrawals += amount;
      user.wallet.pendingAmount += amount;
      await user.save();

      // TODO: Integrate with actual UPI payout service
      // For now, we'll simulate the process
      setTimeout(async () => {
        transaction.status = 'completed';
        transaction.completedAt = new Date();
        await transaction.save();

        user.wallet.pendingAmount -= amount;
        await user.save();
      }, 5000);

      res.json({
        success: true,
        message: 'Withdrawal request submitted successfully',
        data: {
          transactionId: transaction._id,
          amount: amount,
          upiId: upiId,
          estimatedTime: '24-48 hours'
        }
      });

    } catch (error) {
      console.error('Withdrawal error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process withdrawal'
      });
    }
  }
);

// Get payment methods
router.get('/methods',
  authenticateToken,
  async (req, res) => {
    try {
      const methods = [
        {
          id: 'upi',
          name: 'UPI',
          description: 'Pay using any UPI app',
          icon: 'upi-icon',
          enabled: true
        },
        {
          id: 'card',
          name: 'Credit/Debit Card',
          description: 'Visa, Mastercard, RuPay',
          icon: 'card-icon',
          enabled: true
        },
        {
          id: 'netbanking',
          name: 'Net Banking',
          description: 'All major banks supported',
          icon: 'bank-icon',
          enabled: true
        },
        {
          id: 'wallet',
          name: 'Digital Wallets',
          description: 'Paytm, PhonePe, Google Pay',
          icon: 'wallet-icon',
          enabled: true
        }
      ];

      res.json({
        success: true,
        data: methods
      });

    } catch (error) {
      console.error('Get payment methods error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment methods'
      });
    }
  }
);

// Get Razorpay configuration
router.get('/razorpay-config',
  authenticateToken,
  async (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          keyId: process.env.RAZORPAY_KEY_ID,
          currency: 'INR',
          name: 'GameOn Platform',
          description: 'BGMI Tournament Platform',
          image: process.env.APP_LOGO_URL || '/logo192.png',
          theme: {
            color: '#22c55e'
          }
        }
      });

    } catch (error) {
      console.error('Get Razorpay config error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment configuration'
      });
    }
  }
);

// Webhook for Razorpay events
router.post('/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const signature = req.headers['x-razorpay-signature'];
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(req.body)
        .digest('hex');

      if (signature !== expectedSignature) {
        return res.status(400).json({ error: 'Invalid signature' });
      }

      const event = JSON.parse(req.body);
      
      switch (event.event) {
        case 'payment.captured':
          await handlePaymentCaptured(event.payload.payment.entity);
          break;
        case 'payment.failed':
          await handlePaymentFailed(event.payload.payment.entity);
          break;
        default:
          console.log('Unhandled webhook event:', event.event);
      }

      res.json({ received: true });

    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

// Handle successful payment
async function handlePaymentCaptured(payment) {
  try {
    const transaction = await Transaction.findOne({
      razorpayOrderId: payment.order_id,
      status: 'pending'
    });

    if (transaction) {
      transaction.status = 'completed';
      transaction.razorpayPaymentId = payment.id;
      transaction.completedAt = new Date();
      await transaction.save();

      // Update user wallet
      const user = await User.findById(transaction.user);
      user.wallet.balance += transaction.amount;
      user.wallet.totalDeposits += transaction.amount;
      await user.save();
    }
  } catch (error) {
    console.error('Handle payment captured error:', error);
  }
}

// Handle failed payment
async function handlePaymentFailed(payment) {
  try {
    const transaction = await Transaction.findOne({
      razorpayOrderId: payment.order_id,
      status: 'pending'
    });

    if (transaction) {
      transaction.status = 'failed';
      transaction.razorpayPaymentId = payment.id;
      transaction.metadata.failureReason = payment.error_description;
      await transaction.save();
    }
  } catch (error) {
    console.error('Handle payment failed error:', error);
  }
}

module.exports = router;
