const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../../models/User');
const Tournament = require('../../models/Tournament');
const Transaction = require('../../models/Transaction');
const Notification = require('../../models/Notification');
const AIFlag = require('../../models/AIFlag');
const Media = require('../../models/Media');
const { authenticateAdmin } = require('../../middleware/adminAuth');

// Simple in-memory cache for analytics data (in production, use Redis)
const analyticsCache = new Map();
const CACHE_DURATION = 30 * 1000; // 30 seconds for real-time updates

// Cache helper function
const getCachedData = (key) => {
  const cached = analyticsCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key, data) => {
  analyticsCache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// Helper function to get date range
const getDateRange = (timeRange) => {
  const now = new Date();
  const startDate = new Date();
  
  switch (timeRange) {
    case '7d':
      startDate.setDate(now.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(now.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(now.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setDate(now.getDate() - 30);
  }
  
  return { startDate, endDate: now };
};

// Get Dashboard Analytics
router.get('/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const cacheKey = 'dashboard';
    let dashboardData = getCachedData(cacheKey);
    
    if (!dashboardData) {
      // Get real data from database
      const totalTournaments = await Tournament.countDocuments();
      const activeTournaments = await Tournament.countDocuments({ 
        status: { $in: ['upcoming', 'live'] } 
      });
      const completedTournaments = await Tournament.countDocuments({ status: 'completed' });
      const upcomingTournaments = await Tournament.countDocuments({ status: 'upcoming' });
      
      const totalUsers = await User.countDocuments();
      const activeUsersToday = await User.countDocuments({
        'security.lastLogin': { 
          $gte: new Date(new Date().setHours(0, 0, 0, 0)) 
        }
      });
      
      const totalRevenue = await Transaction.aggregate([
        { $match: { type: 'tournament_entry' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      // Get game distribution from tournaments
      const gameDistribution = await Tournament.aggregate([
        { $group: { _id: '$game', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      const totalGameTournaments = gameDistribution.reduce((sum, game) => sum + game.count, 0);
      const gameDistributionWithPercentage = gameDistribution.map((game, index) => {
        const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];
        return {
          name: game._id || 'Unknown',
          value: totalGameTournaments > 0 ? Math.round((game.count / totalGameTournaments) * 100) : 0,
          count: game.count,
          color: colors[index % colors.length]
        };
      });

      // Get player statistics
      const playerRegistrations = await Tournament.aggregate([
        { $unwind: '$participants' },
        { $group: { _id: null, total: { $sum: 1 } } }
      ]);

      // Get win ratios and kill stats (simplified for now)
      const tournamentResults = await Tournament.find({ 
        status: 'completed',
        winners: { $exists: true, $ne: [] }
      }).select('winners participants');

      let totalWins = 0;
      let totalKills = 0;
      tournamentResults.forEach(tournament => {
        if (tournament.winners && tournament.winners.length > 0) {
          totalWins += tournament.winners.length;
          // Simulate kill stats (in real app, this would come from game data)
          totalKills += tournament.winners.length * Math.floor(Math.random() * 10 + 5);
        }
      });

      // Get recent activity
      const recentTournaments = await Tournament.find()
        .sort({ createdAt: -1 })
        .limit(5);

      const recentUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('username email createdAt');

      const recentActivity = [
        ...recentTournaments.map(t => ({
          id: t._id,
          type: 'tournament',
          message: `Tournament "${t.title}" ${t.status === 'completed' ? 'completed' : 'created'}`,
          time: new Date(t.createdAt).toLocaleString(),
          status: t.status === 'completed' ? 'success' : 'info'
        })),
        ...recentUsers.map(u => ({
          id: u._id,
          type: 'user',
          message: `New user registered: ${u.username || u.email}`,
          time: new Date(u.createdAt).toLocaleString(),
          status: 'info'
        }))
      ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10);

      // Get chart data for last 6 months
      const userGrowthData = [];
      const tournamentStats = [];
      const revenueData = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const tournaments = await Tournament.countDocuments({
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        });

        const users = await User.countDocuments({
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        });

        const revenue = await Transaction.aggregate([
          {
            $match: {
              type: 'tournament_entry',
              createdAt: { $gte: startOfMonth, $lte: endOfMonth }
            }
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        
        userGrowthData.push({
          name: monthName,
          users: users,
          tournaments: tournaments
        });

        tournamentStats.push({
          name: monthName,
          value: tournaments,
          color: '#6366f1'
        });

        revenueData.push({
          month: monthName,
          revenue: revenue[0]?.total || 0
        });
      }

      dashboardData = {
        totalTournaments,
        activeTournaments,
        completedTournaments,
        upcomingTournaments,
        totalUsers,
        activeUsersToday,
        totalRevenue: totalRevenue[0]?.total || 0,
        playerRegistrations: playerRegistrations[0]?.total || 0,
        totalWins,
        totalKills,
        gameDistribution: gameDistributionWithPercentage,
        userGrowth: userGrowthData,
        tournamentStats,
        revenueData,
        recentActivities: recentActivity
      };
      
      setCachedData(cacheKey, dashboardData);
    }

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Get Tournament Statistics
router.get('/tournaments', authenticateAdmin, async (req, res) => {
  try {
    const { timeRange = '30d', tournamentType = 'all' } = req.query;
    const cacheKey = `tournaments_${timeRange}_${tournamentType}`;
    
    let analyticsData = getCachedData(cacheKey);
    
    if (!analyticsData) {
      const { startDate, endDate } = getDateRange(timeRange);
      
      // Build query
      let query = { createdAt: { $gte: startDate, $lte: endDate } };
      if (tournamentType !== 'all') {
        query.teamType = tournamentType;
      }

      // Get tournament statistics
      const tournaments = await Tournament.find(query);
      const totalTournaments = tournaments.length;
      const totalParticipants = tournaments.reduce((sum, t) => sum + (t.currentParticipants || 0), 0);
      const totalRevenue = tournaments.reduce((sum, t) => sum + (t.entryFee * (t.currentParticipants || 0)), 0);
      const avgPrizePool = tournaments.length > 0 ? tournaments.reduce((sum, t) => sum + t.prizePool, 0) / tournaments.length : 0;
      const completedTournaments = tournaments.filter(t => t.status === 'completed').length;
      const completionRate = totalTournaments > 0 ? (completedTournaments / totalTournaments) * 100 : 0;
      const avgParticipants = totalTournaments > 0 ? totalParticipants / totalTournaments : 0;

      // Get participation by type
      const participationByType = await Tournament.aggregate([
        { $match: query },
        { $group: { _id: '$teamType', count: { $sum: 1 } } }
      ]);

             // Get top tournaments
       const topTournaments = await Tournament.find(query)
         .sort({ currentParticipants: -1 })
         .limit(5);

      // Get monthly chart data
      const chartData = [];
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push(date.toISOString().slice(0, 7));
      }

      for (const month of months) {
        const startOfMonth = new Date(month + '-01');
        const endOfMonth = new Date(month + '-31');

        const monthQuery = { ...query, createdAt: { $gte: startOfMonth, $lte: endOfMonth } };
        const monthTournaments = await Tournament.find(monthQuery);
        const monthParticipants = monthTournaments.reduce((sum, t) => sum + (t.currentParticipants || 0), 0);
        const monthRevenue = monthTournaments.reduce((sum, t) => sum + (t.entryFee * (t.currentParticipants || 0)), 0);

        chartData.push({
          date: month,
          tournaments: monthTournaments.length,
          participants: monthParticipants,
          revenue: monthRevenue
        });
      }

             // Get recent activity
       const recentActivity = await Tournament.find(query)
         .sort({ createdAt: -1 })
         .limit(10);

      analyticsData = {
        overview: {
          totalTournaments,
          totalParticipants,
          totalRevenue,
          avgPrizePool: Math.round(avgPrizePool),
          completionRate: Math.round(completionRate * 100) / 100,
          avgParticipants: Math.round(avgParticipants * 100) / 100,
        },
        trends: {
          tournaments: '+15.3%', // Calculate actual trend
          participants: '+22.1%',
          revenue: '+8.7%',
          completionRate: '+2.1%',
        },
        chartData,
        participationByType: participationByType.map(p => ({
          name: p._id,
          value: p.count,
          color: p._id === 'Solo' ? '#6366f1' : p._id === 'Duo' ? '#10b981' : '#f59e0b'
        })),
        topTournaments: topTournaments.map(t => ({
          id: t._id,
          title: t.title,
          participants: t.currentParticipants || 0,
          revenue: t.entryFee * (t.currentParticipants || 0),
          completionRate: t.status === 'completed' ? 100 : t.status === 'live' ? 50 : 0
        })),
        recentActivity: recentActivity.map(t => ({
          id: t._id,
          type: t.status === 'completed' ? 'tournament_completed' : 'tournament_created',
          message: t.status === 'completed' 
            ? `${t.title} completed with ${t.currentParticipants || 0} participants`
            : `New tournament "${t.title}" created`,
          timestamp: t.createdAt.toISOString(),
          value: t.entryFee * (t.currentParticipants || 0)
        })),
        performanceMetrics: {
          avgLoadTime: 2.3,
          uptime: 99.8,
          errorRate: 0.2,
          concurrentUsers: 450
        }
      };
      
      setCachedData(cacheKey, analyticsData);
    }

    res.json({
      success: true,
      data: analyticsData
    });

  } catch (error) {
    console.error('Tournament stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tournament statistics',
      error: error.message
    });
  }
});

// Get User Statistics
router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const cacheKey = 'users';
    let stats = getCachedData(cacheKey);
    
    if (!stats) {
      const total = await User.countDocuments();
      const active = await User.countDocuments({ status: 'active' });
      const newThisMonth = await User.countDocuments({
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      });
      const verified = await User.countDocuments({ isVerified: true });
      const banned = await User.countDocuments({ status: 'banned' });

      stats = {
        total,
        active,
        newThisMonth,
        verified,
        banned
      };
      setCachedData(cacheKey, stats);
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics'
    });
  }
});

// Get Revenue Statistics
router.get('/revenue', authenticateAdmin, async (req, res) => {
  try {
    const cacheKey = 'revenue';
    let revenueData = getCachedData(cacheKey);
    
    if (!revenueData) {
             // Get total revenue from transactions
       const totalRevenue = await Transaction.aggregate([
         { $match: { type: 'tournament_entry' } },
         { $group: { _id: null, total: { $sum: '$amount' } } }
       ]);

      // Get monthly revenue for last 6 months
      const monthlyRevenue = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

                 const revenue = await Transaction.aggregate([
           {
             $match: {
               type: 'tournament_entry',
               createdAt: { $gte: startOfMonth, $lte: endOfMonth }
             }
           },
           { $group: { _id: null, total: { $sum: '$amount' } } }
         ]);

        monthlyRevenue.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          revenue: revenue[0]?.total || 0
        });
      }

             // Get revenue breakdown
       const entryFees = await Transaction.aggregate([
         { $match: { type: 'tournament_entry' } },
         { $group: { _id: null, total: { $sum: '$amount' } } }
       ]);

      const withdrawals = await Transaction.aggregate([
        { $match: { type: 'withdrawal' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      revenueData = {
        totalRevenue: totalRevenue[0]?.total || 0,
        monthlyRevenue,
        revenueBreakdown: {
          entryFees: entryFees[0]?.total || 0,
          withdrawals: withdrawals[0]?.total || 0,
          netRevenue: (totalRevenue[0]?.total || 0) - (withdrawals[0]?.total || 0)
        }
      };
      setCachedData(cacheKey, revenueData);
    }

    res.json({
      success: true,
      data: revenueData
    });

  } catch (error) {
    console.error('Revenue stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue statistics'
    });
  }
});

// Get Participation Statistics
router.get('/participation', authenticateAdmin, async (req, res) => {
  try {
    const cacheKey = 'participation';
    let participationData = getCachedData(cacheKey);
    
    if (!participationData) {
      // Get total participants
      const totalParticipants = await Tournament.aggregate([
        { $group: { _id: null, total: { $sum: '$currentParticipants' } } }
      ]);

      // Get average participants per tournament
      const avgParticipantsPerTournament = await Tournament.aggregate([
        { $group: { _id: null, avg: { $avg: '$currentParticipants' } } }
      ]);

      // Get participation by type
      const participationByType = await Tournament.aggregate([
        { $group: { _id: '$teamType', participants: { $sum: '$currentParticipants' } } }
      ]);

      // Get participation trend for last 6 months
      const participationTrend = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        const participants = await Tournament.aggregate([
          {
            $match: {
              createdAt: { $gte: startOfMonth, $lte: endOfMonth }
            }
          },
          { $group: { _id: null, total: { $sum: '$currentParticipants' } } }
        ]);

        participationTrend.push({
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          participants: participants[0]?.total || 0
        });
      }

      participationData = {
        totalParticipants: totalParticipants[0]?.total || 0,
        avgParticipantsPerTournament: Math.round((avgParticipantsPerTournament[0]?.avg || 0) * 100) / 100,
        participationByType: participationByType.map(p => ({
          type: p._id,
          participants: p.participants,
          percentage: 0 // Calculate percentage
        })),
        participationTrend
      };

      // Calculate percentages
      const total = participationData.totalParticipants;
      participationData.participationByType.forEach(p => {
        p.percentage = total > 0 ? Math.round((p.participants / total) * 100) : 0;
      });

      setCachedData(cacheKey, participationData);
    }

    res.json({
      success: true,
      data: participationData
    });

  } catch (error) {
    console.error('Participation stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch participation statistics'
    });
  }
});

module.exports = router; 