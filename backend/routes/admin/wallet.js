/**
 * Admin Wallet Management Routes
 * Handles viewing wallet balances and earnings
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../../models/User');
const Transaction = require('../../models/Transaction');
const Tournament = require('../../models/Tournament');
const { authenticateAdmin, requirePermission } = require('../../middleware/adminAuth');
const router = express.Router();

// Middleware to protect all admin wallet routes
router.use(authenticateAdmin);

// Get platform earnings overview
router.get('/earnings', requirePermission('finance_manage'), async (req, res) => {
  try {
    // Get date range from query params or default to last 30 days
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate) 
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    // Ensure dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }
    
    // Get total entry fees collected
    const entryFeesAggregate = await Transaction.aggregate([
      {
        $match: {
          type: 'tournament_entry',
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    // Get total prizes distributed
    const prizesAggregate = await Transaction.aggregate([
      {
        $match: {
          type: 'prize',
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    // Get total deposits
    const depositsAggregate = await Transaction.aggregate([
      {
        $match: {
          type: 'deposit',
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    // Get total withdrawals
    const withdrawalsAggregate = await Transaction.aggregate([
      {
        $match: {
          type: 'withdrawal',
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    // Get tournament statistics
    const tournamentsCount = await Tournament.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    const completedTournamentsCount = await Tournament.countDocuments({
      status: 'completed',
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    // Calculate platform revenue (entry fees - prizes)
    const entryFees = entryFeesAggregate.length > 0 ? entryFeesAggregate[0].total : 0;
    const prizes = prizesAggregate.length > 0 ? prizesAggregate[0].total : 0;
    const deposits = depositsAggregate.length > 0 ? depositsAggregate[0].total : 0;
    const withdrawals = withdrawalsAggregate.length > 0 ? withdrawalsAggregate[0].total : 0;
    
    const platformRevenue = entryFees - prizes;
    
    // Get daily earnings for the chart
    const dailyEarnings = await Transaction.aggregate([
      {
        $match: {
          type: 'tournament_entry',
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          entryFees: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const dailyPrizes = await Transaction.aggregate([
      {
        $match: {
          type: 'prize',
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          prizes: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Combine daily data
    const dailyData = {};
    
    dailyEarnings.forEach(item => {
      if (!dailyData[item._id]) {
        dailyData[item._id] = { date: item._id, entryFees: 0, prizes: 0, revenue: 0 };
      }
      dailyData[item._id].entryFees = item.entryFees;
    });
    
    dailyPrizes.forEach(item => {
      if (!dailyData[item._id]) {
        dailyData[item._id] = { date: item._id, entryFees: 0, prizes: 0, revenue: 0 };
      }
      dailyData[item._id].prizes = item.prizes;
    });
    
    // Calculate daily revenue
    Object.keys(dailyData).forEach(date => {
      dailyData[date].revenue = dailyData[date].entryFees - dailyData[date].prizes;
    });
    
    res.json({
      success: true,
      data: {
        overview: {
          entryFees,
          prizes,
          platformRevenue,
          deposits,
          withdrawals,
          tournamentsCount,
          completedTournamentsCount
        },
        dailyData: Object.values(dailyData)
      }
    });
  } catch (error) {
    console.error('Error fetching earnings overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch earnings overview',
      error: error.message
    });
  }
});

// Get user wallet balances
router.get('/user-balances', requirePermission('finance_manage'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Build filter based on query parameters
    const filter = {};
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { gameID: searchRegex }
      ];
    }
    
    if (req.query.minBalance) {
      filter.walletBalance = { $gte: parseFloat(req.query.minBalance) };
    }
    
    // Execute query with pagination
    const users = await User.find(filter)
      .select('name email gameID walletBalance')
      .sort({ walletBalance: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await User.countDocuments(filter);
    
    // Get total wallet balance across all users
    const totalBalanceAggregate = await User.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$walletBalance' } } }
    ]);
    
    const totalBalance = totalBalanceAggregate.length > 0 ? totalBalanceAggregate[0].total : 0;
    
    res.json({
      success: true,
      data: {
        users,
        totalBalance,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user balances:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user balances',
      error: error.message
    });
  }
});

// Get transaction history
router.get('/transactions', requirePermission('finance_manage'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Build filter based on query parameters
    const filter = {};
    
    if (req.query.type) {
      filter.type = req.query.type;
    }
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.userId) {
      filter.user = req.query.userId;
    }
    
    if (req.query.startDate && req.query.endDate) {
      filter.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // Execute query with pagination
    const transactions = await Transaction.find(filter)
      .populate('user', 'name email gameID')
      .populate('tournamentId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Transaction.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

// Get user transaction history
router.get('/user/:id/transactions', requirePermission('finance_manage'), async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Check if user exists
    const user = await User.findById(userId).select('name email gameID walletBalance');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get user's transactions
    const transactions = await Transaction.find({ user: userId })
      .populate('tournamentId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await Transaction.countDocuments({ user: userId });
    
    // Get transaction statistics
    const stats = await Transaction.aggregate([
      { $match: { user: user._id } },
      { $group: {
          _id: '$type',
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    // Format statistics
    const statistics = {};
    stats.forEach(stat => {
      statistics[stat._id] = {
        count: stat.count,
        total: stat.total
      };
    });
    
    res.json({
      success: true,
      data: {
        user,
        transactions,
        statistics,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user transactions',
      error: error.message
    });
  }
});

module.exports = router;