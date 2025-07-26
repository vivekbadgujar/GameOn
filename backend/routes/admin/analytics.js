const express = require('express');
const router = express.Router();

// Get Dashboard Analytics
router.get('/dashboard', async (req, res) => {
  try {
    // Mock data for now - replace with actual database queries
    const dashboardData = {
      totalTournaments: 25,
      activeTournaments: 8,
      totalUsers: 1250,
      totalRevenue: 15000,
      recentActivity: [
        {
          id: 1,
          type: 'tournament_created',
          message: 'New tournament "BGMI Championship" created',
          timestamp: new Date().toISOString()
        },
        {
          id: 2,
          type: 'user_registered',
          message: 'New user registered: Player123',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        }
      ],
      charts: {
        tournamentStats: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          data: [12, 19, 15, 25, 22, 30]
        },
        userGrowth: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          data: [100, 150, 200, 300, 450, 600]
        }
      }
    };

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
router.get('/tournaments', async (req, res) => {
  try {
    const stats = {
      total: 25,
      active: 8,
      completed: 15,
      cancelled: 2,
      participationRate: 85,
      averagePrize: 2500
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Tournament stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tournament statistics'
    });
  }
});

// Get User Statistics
router.get('/users', async (req, res) => {
  try {
    const stats = {
      total: 1250,
      active: 890,
      newThisMonth: 150,
      verified: 1100,
      banned: 5
    };

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

module.exports = router; 