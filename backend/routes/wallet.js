const express = require('express');
const { authenticateToken } = require('../middleware/auth');
// const User = require('../models/User');

const router = express.Router();

// Get wallet balance
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const balance = 1000; // Mock balance
    
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

// Get wallet transactions
router.get('/transactions', authenticateToken, async (req, res) => {
  try {
    // Mock transactions data
    const transactions = [
      {
        id: '1',
        type: 'credit',
        amount: 500,
        description: 'Tournament win reward',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        type: 'debit',
        amount: 100,
        description: 'Tournament entry fee',
        timestamp: new Date(Date.now() - 86400000).toISOString()
      }
    ];
    
    res.json({
      success: true,
      transactions: transactions,
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
