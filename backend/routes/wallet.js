const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const WalletService = require('../services/walletService');

const router = express.Router();

// Get wallet balance
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const balance = await WalletService.getBalance(userId);
    
    res.json({
      success: true,
      balance: balance,
      message: 'Wallet balance fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch wallet balance',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Deduct from wallet (for tournament entry fees)
router.post('/deduct', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount, description, tournamentId } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }
    
    // Deduct using wallet service
    const result = await WalletService.deductFromWallet(
      userId,
      amount,
      'tournament_entry',
      {
        description: description || 'Tournament entry fee',
        tournamentId: tournamentId || null
      }
    );

    // Enhanced real-time sync for unified platform
    const syncService = req.app.get('syncService');
    const pushService = req.app.get('pushNotificationService');
    
    if (syncService) {
      syncService.syncWalletUpdate(userId.toString(), 'wallet_debited', {
        amount: amount,
        newBalance: result.newBalance,
        transaction: result.transaction,
        description: description,
        tournamentId: tournamentId
      });
    }

    // Send push notification for significant deductions
    if (pushService && amount >= 50) {
      await pushService.sendWalletNotification(
        userId.toString(),
        'wallet_debited',
        {
          amount: amount,
          balance: result.newBalance,
          description: description
        }
      );
    }

    // Legacy socket events for backward compatibility
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('walletUpdated', {
        userId: userId.toString(),
        type: 'debit',
        amount: amount,
        newBalance: result.newBalance,
        description: description
      });

      io.to(`user_${userId}`).emit('transactionAdded', {
        userId: userId.toString(),
        transaction: result.transaction
      });
    }
    
    res.json({
      success: true,
      message: 'Amount deducted successfully',
      newBalance: result.newBalance,
      transaction: result.transaction
    });
    
  } catch (error) {
    console.error('Error deducting from wallet:', error);
    const statusCode = error.message.includes('Insufficient') ? 400 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to deduct from wallet',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Add to wallet (for winnings, refunds, etc.)
// Note: This endpoint is for admin/internal use. For deposits, use payment routes
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount, description, tournamentId, type = 'admin_credit' } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }
    
    // Add using wallet service
    const result = await WalletService.addToWallet(
      userId,
      amount,
      type,
      {
        description: description || 'Amount added to wallet',
        tournamentId: tournamentId || null
      }
    );

    // Emit real-time wallet update
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('walletUpdated', {
        userId: userId.toString(),
        type: 'credit',
        amount: amount,
        newBalance: result.newBalance,
        description: description
      });

      io.to(`user_${userId}`).emit('transactionAdded', {
        userId: userId.toString(),
        transaction: result.transaction
      });
    }
    
    res.json({
      success: true,
      message: 'Amount added successfully',
      newBalance: result.newBalance,
      transaction: result.transaction
    });
    
  } catch (error) {
    console.error('Error adding to wallet:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add to wallet',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get wallet transactions
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 50, page = 1, type, status } = req.query;
    
    // Get transactions using wallet service
    const transactions = await WalletService.getTransactions(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      type: type || null,
      status: status || null
    });
    
    res.json({
      success: true,
      transactions: transactions,
      page: parseInt(page),
      limit: parseInt(limit),
      message: 'Wallet transactions fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching wallet transactions:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch wallet transactions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
