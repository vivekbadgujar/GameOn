const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Tournament = require('../models/Tournament');
const { authenticateToken } = require('../middleware/auth');
const { authenticateAdmin, requirePermission, auditLog } = require('../middleware/adminAuth');

const router = express.Router();

// store screenshots in uploads/payments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/payments');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
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
    const allowed = /jpeg|jpg|png/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (ext && mimetype) return cb(null, true);
    cb(new Error('Only JPG/PNG images are allowed')); 
  }
});

/**
 * User submits manual payment information for a tournament entry
 */
router.post(
  '/manual/submit',
  authenticateToken,
  upload.single('screenshot'),
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

      // ensure tournament exists
      const tournament = await Tournament.findById(tournamentId);
      if (!tournament) {
        return res.status(404).json({ success: false, message: 'Tournament not found' });
      }

      // check duplicate transaction id or email/tournament
      const existing = await Payment.findOne({
        $or: [{ transactionId }, { tournament: tournamentId, email }]
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Duplicate payment record detected' });
      }

      const screenshotUrl = file ? `/uploads/payments/${file.filename}` : '';
      const userId = req.user._id;

      const payment = new Payment({
        tournament: tournamentId,
        user: userId,
        playerName,
        email,
        phone,
        gameId,
        transactionId,
        screenshotUrl,
        paymentStatus: 'pending'
      });

      await payment.save();

      res.json({ success: true, message: 'Payment submitted successfully. Your payment is under verification.' });
    } catch (error) {
      console.error('Manual payment submission error:', error);
      res.status(500).json({ success: false, message: 'Failed to submit payment' });
    }
  }
);

/**
 * User can check status of their submission
 */
router.get('/manual/status/:tournamentId', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const userEmail = req.user.email;

    const payment = await Payment.findOne({ tournament: tournamentId, email: userEmail });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'No payment record found' });
    }

    res.json({ success: true, data: { status: payment.paymentStatus } });
  } catch (error) {
    console.error('Manual payment status error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve payment status' });
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
