const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Tournament = require('../models/Tournament');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { authenticateAdmin, requirePermission, auditLog } = require('../middleware/adminAuth');
const { uploadImage } = require('../config/cloudinary');

const router = express.Router();
const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

// Cloudinary storage uses a guaranteed fallback config
const hasCloudinaryConfig = () => true;

// Memory storage for multer - files go directly to Cloudinary
const memoryStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(require('path').extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }

  cb(new Error('Only JPG, PNG, or WEBP images are allowed'));
};

const screenshotUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

// Upload screenshot directly to Cloudinary
const uploadScreenshotToCloudinary = async (file, tournamentId) => {
  if (!hasCloudinaryConfig()) {
    throw new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
  }

  try {
    console.log(`Uploading payment screenshot to Cloudinary for tournament: ${tournamentId}`);
    console.log('File details:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    const result = await uploadImage(file, `gameon/payments/${tournamentId}`);
    console.log('Cloudinary screenshot upload successful:', result.url);
    return result.url;
  } catch (error) {
    console.error('Cloudinary screenshot upload failed:', error);
    throw new Error(`Failed to upload payment screenshot to Cloudinary: ${error.message}`);
  }
};

// Debug route - no authentication required
router.get('/debug', async (req, res) => {
  try {
    console.log('Manual payments debug route - No auth required');
    
    const payments = await Payment.find({})
      .sort({ createdAt: -1 })
      .lean();

    console.log('Debug route - Found payments:', payments.length);
    
    res.json({
      success: true,
      data: payments,
      payments: payments,
      total: payments.length,
      message: 'Debug payments fetched successfully'
    });
  } catch (error) {
    console.error('Debug route error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug route failed',
      error: error.message
    });
  }
});

/**
 * User submits manual payment information for a tournament entry
 */
router.post(
  '/manual/submit',
  authenticateToken,
  screenshotUpload.single('screenshot'),
  [
    body('tournamentId').notEmpty().withMessage('Tournament ID is required'),
    body('playerName').notEmpty().withMessage('Player name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('gameId').notEmpty().withMessage('Game ID is required'),
    body('transactionId').notEmpty().withMessage('Transaction ID is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
      }

      const { tournamentId, playerName, email, phone, gameId, transactionId } = req.body;
      const file = req.file;

      // fail early if screenshot not provided (schema also marks it required)
      if (!file) {
        return res.status(400).json({ success: false, message: 'Payment screenshot is required' });
      }

      // ensure tournament exists
      const tournament = await Tournament.findById(tournamentId);
      if (!tournament) {
        return res.status(404).json({ success: false, message: 'Tournament not found' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const screenshotUrl = await uploadScreenshotToCloudinary(file, tournamentId);
      const userId = req.user._id;
      // 1. Check for global transaction ID duplicate
      const existingTx = await Payment.findOne({ transactionId });
      if (existingTx && existingTx.user.toString() !== userId.toString()) {
        return res.status(409).json({
          success: false,
          message: 'This Transaction ID has already been used. Please provide a valid, unique transaction ID.'
        });
      }

      // 2. Find user's existing payment for this tournament
      const existing = await Payment.findOne({
        tournament: tournamentId,
        $or: [{ user: userId }, { email: normalizedEmail }]
      });

      let paymentId;

      if (existing) {
        if (existing.user.toString() !== userId.toString()) {
          return res.status(409).json({
            success: false,
            message: 'This email is already registered for this tournament by another user.'
          });
        }

        if (existing.paymentStatus === 'approved') {
          return res.status(409).json({
            success: false,
            message: 'You are already registered for this tournament.',
            paymentStatus: existing.paymentStatus
          });
        }

        // If pending or rejected, update it
        existing.playerName = playerName;
        existing.email = normalizedEmail;
        existing.phone = phone;
        existing.gameId = gameId;
        existing.transactionId = transactionId;
        existing.screenshotUrl = screenshotUrl;
        existing.paymentStatus = 'pending';
        existing.user = userId;
        await existing.save();
        
        paymentId = existing._id;
      } else {
        // If no existing record
        const payment = new Payment({
          tournament: tournamentId,
          user: userId,
          playerName,
          email: normalizedEmail,
          phone,
          gameId,
          transactionId,
          screenshotUrl,
          paymentStatus: 'pending'
        });
        await payment.save();
        paymentId = payment._id;
      }

      // 3. Add to or update participants with pending status
      let existingParticipant = tournament.participants.find(p => p.user.toString() === userId.toString());
      if (!existingParticipant && tournament.currentParticipants < tournament.maxParticipants) {
        tournament.participants.push({
          user: userId,
          joinedAt: new Date(),
          slotNumber: tournament.currentParticipants + 1,
          paymentStatus: 'pending',
          paymentData: { method: 'manual', paymentId, transactionId }
        });
        tournament.currentParticipants += 1;
        await tournament.save();
      } else if (existingParticipant) {
        existingParticipant.paymentStatus = 'pending';
        existingParticipant.paymentData = { method: 'manual', paymentId, transactionId };
        await tournament.save();
      }

      res.json({
        success: true,
        message: existing ? 'Payment resubmitted successfully. Your payment is under verification.' : 'Payment submitted successfully. Your payment is under verification.',
        data: {
          paymentStatus: 'pending',
          paymentId: paymentId,
          tournamentId: tournamentId
        }
      });
    } catch (error) {
      console.error('Manual payment submission error:', error);
      // E11000 = MongoDB duplicate key — transactionId or tournament+email already exists
      if (Payment.isDuplicateKeyError(error)) {
        return res.status(409).json({
          success: false,
          message: 'A payment with this transaction ID or email already exists for this tournament.'
        });
      }
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to submit payment'
      });
    }
  }
);

/**
 * Get payment status for a tournament
 */
router.get('/manual/status/:tournamentId', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const userId = req.user._id;

    const payment = await Payment.findOne({
      tournament: tournamentId,
      user: userId
    }).sort({ createdAt: -1 });

    if (!payment) {
      return res.json({
        success: true,
        data: {
          paymentStatus: null,
          message: 'No payment found for this tournament'
        }
      });
    }

    res.json({
      success: true,
      data: {
        paymentStatus: payment.paymentStatus,
        playerName: payment.playerName,
        email: payment.email,
        phone: payment.phone,
        gameId: payment.gameId,
        transactionId: payment.transactionId,
        screenshotUrl: payment.screenshotUrl,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt
      }
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status'
    });
  }
});

/**
 * Admin routes for payment verification
 */

const listPaymentsForAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status && req.query.status !== 'all') {
      filter.paymentStatus = req.query.status;
    }
    if (req.query.tournament) {
      filter.tournament = req.query.tournament;
    }

    const payments = await Payment.find(filter)
      .populate('tournament', 'title startDate status maxParticipants currentParticipants participants')
      .populate('user', 'username displayName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(filter);

    res.json({
      success: true,
      data: payments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      message: 'Payments fetched successfully'
    });
  } catch (error) {
    console.error('Admin get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments'
    });
  }
};

const applyPaymentStatusUpdate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { status, rejectionReason } = req.body;
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId).populate('tournament');
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const tournament = await Tournament.findById(payment.tournament._id);
    if (!tournament) {
      return res.status(404).json({ success: false, message: 'Tournament not found' });
    }

    const oldStatus = payment.paymentStatus;

    if (status === 'approved') {
      if (['completed', 'cancelled'].includes(tournament.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot approve payment for a completed or cancelled tournament'
        });
      }

      const existingParticipant = tournament.participants.find((participant) =>
        participant.user.toString() === payment.user.toString()
      );

      if (!existingParticipant && tournament.currentParticipants >= tournament.maxParticipants) {
        return res.status(400).json({
          success: false,
          message: 'Cannot approve payment because the tournament is already full'
        });
      }

      if (!existingParticipant) {
        tournament.participants.push({
          user: payment.user,
          joinedAt: new Date(),
          slotNumber: tournament.currentParticipants + 1,
          paymentStatus: 'completed',
          paymentData: {
            method: 'manual',
            paymentId: payment._id,
            transactionId: payment.transactionId
          }
        });
        tournament.currentParticipants += 1;
      } else {
        existingParticipant.paymentStatus = 'completed';
        existingParticipant.paymentData = {
          ...(existingParticipant.paymentData || {}),
          method: 'manual',
          paymentId: payment._id,
          transactionId: payment.transactionId
        };
      }

      await tournament.save();

      // Auto-assign player to room slot after manual payment is approved
      try {
        const RoomSlot = require('../models/RoomSlot');
        let roomSlot = await RoomSlot.findOne({ tournament: tournament._id });
        if (!roomSlot) {
          roomSlot = await RoomSlot.createForTournament(
            tournament._id,
            tournament.tournamentType,
            tournament.maxParticipants
          );
        }
        
        const existingSlot = roomSlot.getPlayerSlot(payment.user);
        if (!existingSlot) {
          roomSlot.autoAssignPlayer(payment.user);
          await roomSlot.save();
          console.log(`[Admin Payment Approve] Auto-assigned user ${payment.user} to room slot`);
          
          // Emit socket updates to sync the new player assignment instantly across clients
          const io = req.app.get('io');
          if (io) {
            const updatedRoomSlot = await RoomSlot.findById(roomSlot._id)
              .populate('teams.slots.player', 'username displayName gameProfile.bgmiName gameProfile.bgmiId avatar')
              .populate('teams.captain', 'username displayName gameProfile.bgmiName');
            
            const playerSlot = updatedRoomSlot.getPlayerSlot(payment.user);
            const userModel = await require('../models/User').findById(payment.user).select('username');
            
            io.to(`tournament_${tournament._id}`).emit('playerAssigned', {
              tournamentId: tournament._id,
              playerId: payment.user.toString(),
              username: userModel?.username || 'A player',
              teamNumber: playerSlot.teamNumber,
              slotNumber: playerSlot.slotNumber,
              roomSlot: updatedRoomSlot,
              playerSlot
            });

            io.emit('roomSlotUpdated', {
              tournamentId: tournament._id,
              playerId: payment.user.toString(),
              action: 'assigned',
              teamNumber: playerSlot.teamNumber,
              slotNumber: playerSlot.slotNumber,
              roomSlot: updatedRoomSlot,
              timestamp: new Date()
            });
          }
        }
      } catch (roomSlotErr) {
        console.error('[Admin Payment Approve] Failed to auto-assign player to room slot:', roomSlotErr.message);
      }
    } else if (oldStatus === 'approved') {
      const participantIndex = tournament.participants.findIndex((participant) =>
        participant.user.toString() === payment.user.toString()
      );

      if (participantIndex !== -1) {
        tournament.participants.splice(participantIndex, 1);
        tournament.currentParticipants = Math.max(0, tournament.currentParticipants - 1);
        await tournament.save();
      }
    }

    payment.paymentStatus = status;
    if (status === 'rejected' && rejectionReason) {
      payment.rejectionReason = rejectionReason;
    } else if (status !== 'rejected') {
      payment.rejectionReason = '';
    }
    await payment.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('paymentStatusUpdated', {
        paymentId: payment._id,
        tournamentId: tournament._id,
        userId: payment.user,
        status: payment.paymentStatus,
        oldStatus
      });

      if (status === 'approved') {
        // Re-fetch tournament with populated participants so clients get current counts
        const updatedTournament = await Tournament.findById(tournament._id)
          .populate('participants.user', 'username displayName gameProfile.bgmiId')
          .lean();
        if (updatedTournament) {
          io.emit('tournamentUpdated', {
            type: 'tournamentUpdated',
            data: updatedTournament
          });
          io.emit('participantsUpdated', {
            tournamentId: tournament._id,
            participants: updatedTournament.participants,
            currentParticipants: updatedTournament.currentParticipants
          });
        }
      }
    }

    res.json({
      success: true,
      message: `Payment status updated to ${status}`,
      data: payment
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update payment status'
    });
  }
};

const paymentStatusValidation = [
  body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Invalid status'),
  body('rejectionReason').optional().isString().withMessage('Rejection reason must be a string')
];

// Current admin route
router.get(
  '/admin/all',
  authenticateAdmin,
  requirePermission('payments_manage'),
  listPaymentsForAdmin
);

// Legacy admin route for backward compatibility with old deployed admin bundles
router.get(
  '/admin/payments',
  authenticateAdmin,
  requirePermission('payments_manage'),
  listPaymentsForAdmin
);

router.patch(
  '/admin/:paymentId/status',
  authenticateAdmin,
  requirePermission('payments_manage'),
  auditLog('update_payment_status'),
  paymentStatusValidation,
  applyPaymentStatusUpdate
);

// Legacy approve/reject aliases for backward compatibility
router.post(
  '/admin/payments/:paymentId/:action(approve|reject)',
  authenticateAdmin,
  requirePermission('payments_manage'),
  auditLog('update_payment_status'),
  (req, res, next) => {
    req.body.status = req.params.action === 'approve' ? 'approved' : 'rejected';
    next();
  },
  paymentStatusValidation,
  applyPaymentStatusUpdate
);

module.exports = router;
