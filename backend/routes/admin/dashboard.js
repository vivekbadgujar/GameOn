/**
 * Admin Dashboard Routes
 * Provides dashboard statistics and activity data
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../../models/User');
const Tournament = require('../../models/Tournament');
const Transaction = require('../../models/Transaction');
const { Notification } = require('../../models/Notification');
const { authenticateAdmin } = require('../../middleware/adminAuth');

// Get Dashboard Statistics
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    // Get basic counts
    const totalTournaments = await Tournament.countDocuments();
    const activeTournaments = await Tournament.countDocuments({ 
      status: { $in: ['upcoming', 'live'] } 
    });
    const totalUsers = await User.countDocuments();
    
    // Get prize pool total
    const totalPrizePool = await Tournament.aggregate([
      { $group: { _id: null, total: { $sum: '$prizePool' } } }
    ]);
    
    // Get revenue from entry fees
    const totalRevenue = await Transaction.aggregate([
      { $match: { type: 'tournament_entry', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Get total transactions
    const totalTransactions = await Transaction.countDocuments();
    
    // Get recent tournaments
    const recentTournaments = await Tournament.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('participants.user', 'username')
      .lean();
    
    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username displayName createdAt')
      .lean();

    // Get tournament stats for charts
    const tournamentStats = [];
    const monthlyTournaments = [];
    const monthlyUsers = [];
    
    // Get data for last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthTournaments = await Tournament.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });
      
      const monthUsers = await User.countDocuments({
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      });
      
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      
      tournamentStats.push({
        month: monthName,
        tournaments: monthTournaments
      });
      
      monthlyTournaments.push(monthTournaments);
      monthlyUsers.push(monthUsers);
    }

    const stats = {
      totalTournaments,
      activeTournaments,
      totalUsers,
      totalPrizePool: totalPrizePool[0]?.total || 0,
      totalRevenue: totalRevenue[0]?.total || 0,
      totalTransactions,
      recentTournaments: recentTournaments.map(tournament => ({
        _id: tournament._id,
        title: tournament.title,
        status: tournament.status,
        prizePool: tournament.prizePool,
        participants: tournament.participants || [],
        createdAt: tournament.createdAt
      })),
      recentUsers,
      tournamentStats,
      monthlyTournaments,
      monthlyUsers
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
});

// Get Dashboard Activity
router.get('/activity', authenticateAdmin, async (req, res) => {
  try {
    const activity = [];
    
    // Get recent tournaments
    const recentTournaments = await Tournament.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    // Get recent transactions
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'username')
      .lean();
    
    // Add tournament activities
    recentTournaments.forEach(tournament => {
      activity.push({
        type: 'tournament',
        title: `Tournament "${tournament.title}" created`,
        timestamp: tournament.createdAt,
        data: tournament
      });
    });
    
    // Add user activities
    recentUsers.forEach(user => {
      activity.push({
        type: 'user',
        title: `New user "${user.username}" registered`,
        timestamp: user.createdAt,
        data: user
      });
    });
    
    // Add transaction activities
    recentTransactions.forEach(transaction => {
      activity.push({
        type: 'transaction',
        title: `${transaction.type} transaction by ${transaction.user?.username || 'Unknown'}`,
        timestamp: transaction.createdAt,
        data: transaction
      });
    });
    
    // Sort by timestamp and limit to 10
    activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivity = activity.slice(0, 10);

    res.json({
      success: true,
      data: limitedActivity
    });

  } catch (error) {
    console.error('Dashboard activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard activity',
      error: error.message
    });
  }
});

// Get Real-time Stats (for live updates)
router.get('/realtime', authenticateAdmin, async (req, res) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Get stats for the last hour
    const newUsers = await User.countDocuments({
      createdAt: { $gte: oneHourAgo }
    });
    
    const newTournaments = await Tournament.countDocuments({
      createdAt: { $gte: oneHourAgo }
    });
    
    const newTransactions = await Transaction.countDocuments({
      createdAt: { $gte: oneHourAgo }
    });
    
    // Get active tournaments
    const liveTournaments = await Tournament.countDocuments({
      status: 'live'
    });
    
    // Get online users (simplified - in real app, track active sessions)
    const onlineUsers = await User.countDocuments({
      'security.lastLogin': { $gte: new Date(now.getTime() - 30 * 60 * 1000) }
    });

    const realtimeStats = {
      newUsers,
      newTournaments,
      newTransactions,
      liveTournaments,
      onlineUsers,
      timestamp: now
    };

    res.json({
      success: true,
      data: realtimeStats
    });

  } catch (error) {
    console.error('Realtime stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch realtime statistics',
      error: error.message
    });
  }
});

module.exports = router;