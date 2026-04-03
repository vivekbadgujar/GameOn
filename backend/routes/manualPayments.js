const express = require('express');
const multer = require('multer');
const os = require('os');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Tournament = require('../models/Tournament');
const { authenticateToken } = require('../middleware/auth');
const { authenticateAdmin, requirePermission, auditLog } = require('../middleware/adminAuth');

const router = express.Router();
const PAYMENT_SCREENSHOT_SUBDIR = 'payment_screenshots';

const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

const resolveManualPaymentBaseDir = () => {
  if (process.env.MANUAL_PAYMENT_UPLOAD_DIR) {
    return process.env.MANUAL_PAYMENT_UPLOAD_DIR;
  }

  if (isServerless) {
    return path.join(os.tmpdir(), 'gameon-uploads');
  }

  return path.join(__dirname, '../uploads');
};

// store screenshots in uploads/payment_screenshots
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // allow custom base path via env (useful on serverless platforms where __dirname may be read-only)
    // we always create/use a "payments" subdirectory inside the base directory
    const baseDir = resolveManualPaymentBaseDir();
    const uploadDir = path.join(baseDir, PAYMENT_SCREENSHOT_SUBDIR);
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    } catch (err) {
      if (!isServerless) {
        console.error('Failed to create upload directory:', err);
        return cb(err);
      }

      try {
        const fallbackDir = path.join(os.tmpdir(), 'gameon-uploads', PAYMENT_SCREENSHOT_SUBDIR);
        if (!fs.existsSync(fallbackDir)) {
          fs.mkdirSync(fallbackDir, { recursive: true });
        }
        cb(null, fallbackDir);
      } catch (fallbackErr) {
        console.error('Failed to create upload directory:', err);
        console.error('Failed to create fallback upload directory:', fallbackErr);
        cb(fallbackErr);
      }
    }
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `payment-${unique}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (ext && mimetype) return cb(null, true);
    cb(new Error('Only JPG, PNG, or WEBP images are allowed'));
  }
});

/**
 * User submits manual payment information for a tournament entry
 */
// wrap multer upload to intercept errors so they don't fall through to global handler
function handleUpload(req, res, next) {
  upload.single('screenshot')(req, res, (err) => {
    if (err) {
      // Multer errors are considered user mistakes, respond 400
      console.error('Screenshot upload error:', err);
      const msg = err.message || 'Screenshot upload failed';
      return res.status(400).json({ success: false, message: msg });
    }
    next();
  });
}

router.post(
  '/manual/submit',
  authenticateToken,
  handleUpload,
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
      // ensure DB is connected before proceeding
      if (mongoose.connection.readyState !== 1) {
        console.error('MongoDB not connected when processing manual payment');
        return res.status(503).json({ success: false, message: 'Database not available' });
      }

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
      const screenshotUrl = `https://api.gameonesport.xyz/uploads/${PAYMENT_SCREENSHOT_SUBDIR}/${file.filename}`;
      const userId = req.user._id;
      const existing = await Payment.findOne({
        $or: [
          { transactionId },
          { tournament: tournamentId, user: userId },
          { tournament: tournamentId, email: normalizedEmail }
        ]
      });

      if (existing && existing.paymentStatus !== 'rejected') {
        return res.status(409).json({
          success: false,
          message: existing.paymentStatus === 'approved'
            ? 'You are already registered for this tournament.'
            : 'Your payment has already been submitted and is pending verification.',
          paymentStatus: existing.paymentStatus
        });
      }

      if (existing && existing.paymentStatus === 'rejected') {
        existing.playerName = playerName;
        existing.email = normalizedEmail;
        existing.phone = phone;
        existing.gameId = gameId;
        existing.transactionId = transactionId;
        existing.screenshotUrl = screenshotUrl;
        existing.paymentStatus = 'pending';
        existing.user = userId;
        await existing.save();

        return res.json({
          success: true,
          message: 'Payment resubmitted successfully. Your payment is under verification.',
          data: {
            paymentStatus: existing.paymentStatus,
            paymentId: existing._id,
            screenshotUrl: existing.screenshotUrl
          }
        });
      }

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

      res.json({
        success: true,
        message: 'Payment submitted successfully. Your payment is under verification.',
        data: {
          paymentStatus: payment.paymentStatus,
          paymentId: payment._id,
          screenshotUrl: payment.screenshotUrl
        }
      });
    } catch (error) {
      // log full error for debugging
      console.error('Manual payment submission error:', error);

      // if mongoose validation error, send details back
      if (error.name === 'ValidationError') {
        const msgs = Object.values(error.errors).map(e => e.message).join('; ');
        return res.status(400).json({ success: false, message: msgs });
      }

      // duplicate key (transaction/email) - mongo error code 11000
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Duplicate transaction ID or email already submitted for this tournament'
        });
      }

      res.status(500).json({ success: false, message: 'Failed to submit payment' });
    }
  }
);

/**
 * Debug route to check if payment exists (no auth required)
 */
router.get('/debug/payment/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid payment ID format' 
      });
    }

    const payment = await Payment.findById(paymentId)
      .populate('tournament', 'title')
      .populate('user', 'username email');
    
    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found',
        paymentId: paymentId
      });
    }

    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        tournament: payment.tournament,
        user: payment.user,
        status: payment.paymentStatus,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt
      }
    });
  } catch (error) {
    console.error('Debug payment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * User can check status of their submission - Enhanced with better error handling
 * No authentication required - users can check payment status with email/phone
 */
router.get('/manual/status/:tournamentId', async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { email, phone } = req.query; // Allow email/phone as query params for status check

    console.log(`[PAYMENT STATUS] Checking status for tournament: ${tournamentId}`);

    // Validate tournamentId format
    if (!mongoose.Types.ObjectId.isValid(tournamentId)) {
      console.warn(`[PAYMENT STATUS] Invalid tournament ID format: ${tournamentId}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid tournament ID format',
        error: 'INVALID_TOURNAMENT_ID',
        tournamentId: tournamentId
      });
    }

    // Check if tournament exists first
    let tournament;
    try {
      tournament = await Tournament.findById(tournamentId).select('title status entryFee');
      if (!tournament) {
        console.warn(`[PAYMENT STATUS] Tournament not found: ${tournamentId}`);
        return res.status(404).json({ 
          success: false, 
          message: 'Tournament not found',
          error: 'TOURNAMENT_NOT_FOUND',
          tournamentId: tournamentId
        });
      }
    } catch (tournamentError) {
      console.error('[PAYMENT STATUS] Error checking tournament:', tournamentError.message);
      return res.status(500).json({ 
        success: false, 
        message: 'Error verifying tournament',
        error: 'TOURNAMENT_CHECK_ERROR'
      });
    }

    // Build payment query
    const paymentQuery = { tournament: tournamentId };
    
    // If user is authenticated, use their ID
    if (req.user) {
      const userEmail = req.user.email?.trim().toLowerCase();
      const userId = req.user._id;
      paymentQuery.$or = [
        { user: userId },
        ...(userEmail ? [{ email: userEmail }] : [])
      ];
    } else if (email || phone) {
      // For unauthenticated users, use email/phone from query
      if (email) {
        paymentQuery.email = email.trim().toLowerCase();
      }
      if (phone) {
        paymentQuery.phone = phone;
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Authentication required or provide email/phone to check status',
        error: 'MISSING_IDENTIFIER'
      });
    }

    // Find payment with detailed error handling
    let payment;
    try {
      payment = await Payment.findOne(paymentQuery)
        .sort({ updatedAt: -1, createdAt: -1 })
        .populate('user', 'username email')
        .populate('tournament', 'title entryFee');
        
    } catch (paymentError) {
      console.error('[PAYMENT STATUS] Database error during payment lookup:', paymentError.message);
      return res.status(500).json({ 
        success: false, 
        message: 'Database error during payment lookup',
        error: 'DATABASE_ERROR'
      });
    }
    
    if (!payment) {
      console.log(`[PAYMENT STATUS] No payment found for tournament: ${tournamentId}`);
      return res.status(404).json({ 
        success: false, 
        message: 'No payment record found for this tournament',
        error: 'PAYMENT_NOT_FOUND',
        tournamentInfo: {
          id: tournament._id,
          title: tournament.title,
          entryFee: tournament.entryFee
        }
      });
    }

    console.log(`[PAYMENT STATUS] Found payment: ${payment._id}, status: ${payment.paymentStatus}`);

    // Return comprehensive payment information
    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        status: payment.paymentStatus,
        screenshotUrl: payment.screenshotUrl,
        transactionId: payment.transactionId,
        email: payment.email,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        submittedAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        tournament: {
          id: tournament._id,
          title: tournament.title,
          entryFee: tournament.entryFee
        },
        user: payment.user ? {
          id: payment.user._id,
          username: payment.user.username,
          email: payment.user.email
        } : null
      },
      message: 'Payment status retrieved successfully'
    });
  } catch (error) {
    console.error('[PAYMENT STATUS] Unexpected error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve payment status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_SERVER_ERROR'
    });
  }
});

/**
 * ADMIN routes – list, approve, reject
 */
router.use('/admin', authenticateAdmin);

// list all manual payments (with optional status filter)
router.get('/admin/payments', requirePermission('finance_manage'), async (req, res) => {
  try {
    const { status, tournamentId, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.paymentStatus = status;
    if (tournamentId) filter.tournament = tournamentId;

    const payments = await Payment.find(filter)
      .populate('tournament', 'title entryFee')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Payment.countDocuments(filter);

    res.json({ success: true, data: payments, pagination: { total, page, limit } });
  } catch (error) {
    console.error('Admin list manual payments error:', error);
    res.status(500).json({ success: false, message: 'Unable to fetch payments' });
  }
});

// helper to add participant when approving
async function addParticipantFromPayment(payment) {
  const tournament = await Tournament.findById(payment.tournament);
  if (!tournament) throw new Error('Tournament not found');

  // ensure slot still available
  if (tournament.currentParticipants >= tournament.maxParticipants) {
    throw new Error('Tournament is full');
  }

  // prevent duplicate entry by email
  if (tournament.participants.some(p => p.paymentData?.email === payment.email)) {
    throw new Error('Participant already added');
  }

  const slotNumber = tournament.currentParticipants + 1;
  tournament.participants.push({
    user: payment.user,
    joinedAt: new Date(),
    slotNumber,
    paymentStatus: 'completed',
    paymentData: {
      method: 'manual',
      playerName: payment.playerName,
      email: payment.email,
      phone: payment.phone,
      transactionId: payment.transactionId
    }
  });
  tournament.currentParticipants += 1;
  await tournament.save();
}

// approve a payment
router.post('/admin/payments/:id/approve', requirePermission('finance_manage'), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (payment.paymentStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Payment is not pending' });
    }

    // add participant record in tournament
    await addParticipantFromPayment(payment);

    payment.paymentStatus = 'approved';
    await payment.save();

    res.json({ success: true, message: 'Payment approved and participant added' });
  } catch (error) {
    console.error('Approve manual payment error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to approve payment' });
  }
});

// reject a payment
router.post('/admin/payments/:id/reject', requirePermission('finance_manage'), async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (payment.paymentStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'Payment is not pending' });
    }

    payment.paymentStatus = 'rejected';
    await payment.save();

    res.json({ success: true, message: 'Payment rejected' });
  } catch (error) {
    console.error('Reject manual payment error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject payment' });
  }
});

module.exports = router;
