const express = require('express');
const { body, validationResult } = require('express-validator');
const Transaction = require('../../models/Transaction');
const User = require('../../models/User');
const Tournament = require('../../models/Tournament');
const { authenticateAdmin, requirePermission, auditLog } = require('../../middleware/adminAuth');
const router = express.Router();

// Middleware to protect all admin payout routes
router.use(authenticateAdmin);

// Get all payouts
router.get('/', 
  requirePermission('payouts_manage'),
  async (req, res) => {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      
      const filter = { type: 'tournament_win' };
      if (status) filter.status = status;
      
      const skip = (page - 1) * limit;
      
      const payouts = await Transaction.find(filter)
        .populate('user', 'username displayName email')
        .populate('tournament', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
      
      const total = await Transaction.countDocuments(filter);
      
      res.json({
        success: true,
        data: payouts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching payouts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payouts'
      });
    }
  }
);

// Get payout by ID
router.get('/:id', 
  requirePermission('payouts_manage'),
  async (req, res) => {
    try {
      const payout = await Transaction.findById(req.params.id)
        .populate('user', 'username displayName email phone')
        .populate('tournament', 'title entryFee prizePool')
        .populate('processedBy', 'username email')
        .lean();
      
      if (!payout) {
        return res.status(404).json({
          success: false,
          message: 'Payout not found'
        });
      }
      
      res.json({
        success: true,
        data: payout
      });
    } catch (error) {
      console.error('Error fetching payout:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payout'
      });
    }
  }
);

// Update payout status
router.patch('/:id/status', 
  requirePermission('payouts_manage'),
  [
    body('status').isIn(['pending', 'completed', 'failed', 'cancelled']).withMessage('Invalid status'),
    body('adminNotes').optional().isString().withMessage('Admin notes must be a string')
  ],
  auditLog('update_payout_status'),
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

      const { status, adminNotes } = req.body;
      const payout = await Transaction.findById(req.params.id);
      
      if (!payout) {
        return res.status(404).json({
          success: false,
          message: 'Payout not found'
        });
      }
      
      payout.status = status;
      if (adminNotes) payout.adminNotes = adminNotes;
      
      if (status === 'completed') {
        payout.processedBy = req.admin._id;
        payout.processedAt = new Date();
      }
      
      await payout.save();
      
      res.json({
        success: true,
        message: 'Payout status updated successfully',
        data: payout
      });
    } catch (error) {
      console.error('Error updating payout status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update payout status'
      });
    }
  }
);

// Process payout
router.post('/:id/process', 
  requirePermission('payouts_manage'),
  auditLog('process_payout'),
  async (req, res) => {
    try {
      const payout = await Transaction.findById(req.params.id)
        .populate('user')
        .populate('tournament');
      
      if (!payout) {
        return res.status(404).json({
          success: false,
          message: 'Payout not found'
        });
      }
      
      if (payout.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: 'Payout is not in pending status'
        });
      }
      
      // Update payout status
      payout.status = 'completed';
      payout.processedBy = req.admin._id;
      payout.processedAt = new Date();
      
      // Update user wallet balance
      await User.findByIdAndUpdate(payout.user._id, {
        $inc: { 'wallet.balance': payout.amount }
      });
      
      await payout.save();
      
      // Emit Socket.IO event for real-time updates
      req.app.get('io').emit('payoutProcessed', {
        userId: payout.user._id,
        amount: payout.amount,
        tournamentId: payout.tournament?._id
      });
      
      res.json({
        success: true,
        message: 'Payout processed successfully',
        data: payout
      });
    } catch (error) {
      console.error('Error processing payout:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process payout'
      });
    }
  }
);

// Get pending payouts
router.get('/pending', 
  requirePermission('payouts_manage'),
  async (req, res) => {
    try {
      const pendingPayouts = await Transaction.find({ 
        type: 'tournament_win',
        status: 'pending' 
      })
        .populate('user', 'username displayName email')
        .populate('tournament', 'title')
        .sort({ createdAt: 1 })
        .lean();
      
      res.json({
        success: true,
        data: pendingPayouts
      });
    } catch (error) {
      console.error('Error fetching pending payouts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending payouts'
      });
    }
  }
);

// Bulk process payouts
router.post('/bulk-process', 
  requirePermission('payouts_manage'),
  [
    body('payoutIds').isArray().withMessage('Payout IDs must be an array'),
    body('payoutIds.*').isMongoId().withMessage('Invalid payout ID format')
  ],
  auditLog('bulk_process_payouts'),
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

      const { payoutIds } = req.body;
      
      const payouts = await Transaction.find({
        _id: { $in: payoutIds },
        status: 'pending',
        type: 'tournament_win'
      }).populate('user');
      
      if (payouts.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No pending payouts found'
        });
      }
      
      const processedPayouts = [];
      const failedPayouts = [];
      
      for (const payout of payouts) {
        try {
          // Update payout status
          payout.status = 'completed';
          payout.processedBy = req.admin._id;
          payout.processedAt = new Date();
          
          // Update user wallet balance
          await User.findByIdAndUpdate(payout.user._id, {
            $inc: { 'wallet.balance': payout.amount }
          });
          
          await payout.save();
          processedPayouts.push(payout._id);
          
          // Emit Socket.IO event
          req.app.get('io').emit('payoutProcessed', {
            userId: payout.user._id,
            amount: payout.amount,
            tournamentId: payout.tournament
          });
        } catch (error) {
          console.error(`Error processing payout ${payout._id}:`, error);
          failedPayouts.push(payout._id);
        }
      }
      
      res.json({
        success: true,
        message: 'Bulk payout processing completed',
        data: {
          processed: processedPayouts.length,
          failed: failedPayouts.length,
          processedIds: processedPayouts,
          failedIds: failedPayouts
        }
      });
    } catch (error) {
      console.error('Error bulk processing payouts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk process payouts'
      });
    }
  }
);

module.exports = router; 