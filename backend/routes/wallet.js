const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Get wallet balance
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find user and get wallet balance
    const user = await User.findById(userId).select('wallet');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const balance = user.wallet?.balance || 0;
    
    res.json({
      success: true,
      balance: balance,
      message: 'Wallet balance fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet balance',
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
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Initialize wallet if it doesn't exist
    if (!user.wallet) {
      user.wallet = { balance: 0, transactions: [] };
    }
    
    // Check if user has sufficient balance
    if (user.wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient wallet balance',
        currentBalance: user.wallet.balance,
        requiredAmount: amount
      });
    }
    
    // Deduct amount
    user.wallet.balance -= amount;
    
    // Add transaction record
    const transaction = {
      type: 'debit',
      amount: amount,
      description: description || 'Tournament entry fee',
      tournamentId: tournamentId || null,
      timestamp: new Date(),
      balanceAfter: user.wallet.balance
    };
    
    if (!user.wallet.transactions) {
      user.wallet.transactions = [];
    }
    user.wallet.transactions.push(transaction);
    
    // Save user
    await user.save();

    // Enhanced real-time sync for unified platform
    const syncService = req.app.get('syncService');
    const pushService = req.app.get('pushNotificationService');
    
    if (syncService) {
      // Sync wallet update across all platforms
      syncService.syncWalletUpdate(userId.toString(), 'wallet_debited', {
        amount: amount,
        newBalance: user.wallet.balance,
        transaction: transaction,
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
          balance: user.wallet.balance,
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
        newBalance: user.wallet.balance,
        description: description
      });

      io.to(`user_${userId}`).emit('transactionAdded', {
        userId: userId.toString(),
        transaction: transaction
      });
    }
    
    res.json({
      success: true,
      message: 'Amount deducted successfully',
      newBalance: user.wallet.balance,
      transaction: transaction
    });
    
  } catch (error) {
    console.error('Error deducting from wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deduct from wallet',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Add to wallet (for winnings, refunds, etc.)
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { amount, description, tournamentId } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Initialize wallet if it doesn't exist
    if (!user.wallet) {
      user.wallet = { balance: 0, transactions: [] };
    }
    
    // Add amount
    user.wallet.balance += amount;
    
    // Add transaction record
    const transaction = {
      type: 'credit',
      amount: amount,
      description: description || 'Amount added to wallet',
      tournamentId: tournamentId || null,
      timestamp: new Date(),
      balanceAfter: user.wallet.balance
    };
    
    if (!user.wallet.transactions) {
      user.wallet.transactions = [];
    }
    user.wallet.transactions.push(transaction);
    
    // Save user
    await user.save();

    // Emit real-time wallet update
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('walletUpdated', {
        userId: userId.toString(),
        type: 'credit',
        amount: amount,
        newBalance: user.wallet.balance,
        description: description
      });

      io.to(`user_${userId}`).emit('transactionAdded', {
        userId: userId.toString(),
        transaction: transaction
      });
    }
    
    res.json({
      success: true,
      message: 'Amount added successfully',
      newBalance: user.wallet.balance,
      transaction: transaction
    });
    
  } catch (error) {
    console.error('Error adding to wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to wallet',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get wallet transactions
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 50, offset = 0 } = req.query;
    
    // Find user and get wallet transactions
    const user = await User.findById(userId).select('wallet');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const transactions = user.wallet?.transactions || [];
    
    // Sort by timestamp (newest first) and apply pagination
    const sortedTransactions = transactions
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    
    res.json({
      success: true,
      transactions: sortedTransactions,
      total: transactions.length,
      message: 'Wallet transactions fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching wallet transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet transactions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
