const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const Tournament = require('../../models/Tournament');
const Transaction = require('../../models/Transaction');
const AIFlag = require('../../models/AIFlag');
const { authenticateAdmin } = require('../../middleware/adminAuth');

// Get AI-powered suggestions for admin
router.get('/suggestions', authenticateAdmin, async (req, res) => {
  try {
    const suggestions = [];

    // 1. Analyze suspicious user behavior
    const suspiciousUsers = await analyzeSuspiciousUsers();
    if (suspiciousUsers.length > 0) {
      suggestions.push({
        id: 'suspicious-users',
        title: `${suspiciousUsers.length} Users Flagged for Suspicious Activity`,
        category: 'security',
        priority: 'high',
        description: 'Users with unusual win patterns, multiple accounts, or rapid skill improvement detected.',
        impact: 'Prevent potential cheating and maintain fair play',
        confidence: 85,
        data: suspiciousUsers,
        actions: [
          { id: 'review-users', label: 'Review flagged users', type: 'manual' },
          { id: 'auto-monitor', label: 'Enable enhanced monitoring', type: 'auto' }
        ],
        applied: false
      });
    }

    // 2. Tournament scheduling optimization
    const schedulingSuggestion = await analyzeSchedulingOptimization();
    if (schedulingSuggestion) {
      suggestions.push(schedulingSuggestion);
    }

    // 3. Revenue optimization
    const revenueSuggestion = await analyzeRevenueOptimization();
    if (revenueSuggestion) {
      suggestions.push(revenueSuggestion);
    }

    // 4. User engagement analysis
    const engagementSuggestion = await analyzeUserEngagement();
    if (engagementSuggestion) {
      suggestions.push(engagementSuggestion);
    }

    // 5. Prize pool optimization
    const prizePoolSuggestion = await analyzePrizePoolOptimization();
    if (prizePoolSuggestion) {
      suggestions.push(prizePoolSuggestion);
    }

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI suggestions'
    });
  }
});

// Analyze suspicious user behavior
async function analyzeSuspiciousUsers() {
  const suspiciousUsers = [];

  try {
    // Find users with unusually high win rates
    const users = await User.find({ isActive: true }).lean();
    
    for (const user of users) {
      const userTournaments = await Tournament.find({
        'participants.user': user._id,
        status: 'completed'
      }).lean();

      if (userTournaments.length >= 5) {
        const wins = userTournaments.filter(t => 
          t.winners && t.winners.some(w => w.user.toString() === user._id.toString())
        ).length;
        
        const winRate = (wins / userTournaments.length) * 100;
        
        // Flag users with >80% win rate in 5+ tournaments
        if (winRate > 80) {
          suspiciousUsers.push({
            userId: user._id,
            username: user.username,
            email: user.email,
            winRate: winRate.toFixed(1),
            totalTournaments: userTournaments.length,
            totalWins: wins,
            reason: 'Unusually high win rate',
            riskLevel: winRate > 90 ? 'high' : 'medium'
          });
        }
      }
    }

    // Find users with multiple recent registrations from same IP (if available)
    // This would require storing IP addresses during registration

    return suspiciousUsers;
  } catch (error) {
    console.error('Error analyzing suspicious users:', error);
    return [];
  }
}

// Analyze tournament scheduling optimization
async function analyzeSchedulingOptimization() {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const tournaments = await Tournament.find({
      createdAt: { $gte: lastMonth }
    }).lean();

    if (tournaments.length === 0) return null;

    // Analyze participation by hour
    const hourlyParticipation = {};
    tournaments.forEach(tournament => {
      const hour = new Date(tournament.startTime).getHours();
      if (!hourlyParticipation[hour]) {
        hourlyParticipation[hour] = { count: 0, totalParticipants: 0 };
      }
      hourlyParticipation[hour].count++;
      hourlyParticipation[hour].totalParticipants += tournament.currentParticipants || 0;
    });

    // Find peak hours
    const peakHours = Object.entries(hourlyParticipation)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        avgParticipants: data.totalParticipants / data.count
      }))
      .sort((a, b) => b.avgParticipants - a.avgParticipants)
      .slice(0, 3);

    if (peakHours.length > 0) {
      const bestHour = peakHours[0];
      return {
        id: 'scheduling-optimization',
        title: 'Optimize Tournament Scheduling',
        category: 'scheduling',
        priority: 'medium',
        description: `Peak participation occurs at ${bestHour.hour}:00 with ${bestHour.avgParticipants.toFixed(1)} average participants.`,
        impact: 'Expected 15-25% increase in participation',
        confidence: 78,
        data: { peakHours },
        actions: [
          { id: 'schedule-peak', label: 'Schedule more tournaments at peak hours', type: 'manual' },
          { id: 'auto-schedule', label: 'Enable auto-scheduling for peak hours', type: 'auto' }
        ],
        applied: false
      };
    }

    return null;
  } catch (error) {
    console.error('Error analyzing scheduling:', error);
    return null;
  }
}

// Analyze revenue optimization
async function analyzeRevenueOptimization() {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const tournaments = await Tournament.find({
      createdAt: { $gte: lastMonth }
    }).lean();

    if (tournaments.length === 0) return null;

    // Analyze entry fee vs participation correlation
    const feeAnalysis = {};
    tournaments.forEach(tournament => {
      const fee = tournament.entryFee;
      if (!feeAnalysis[fee]) {
        feeAnalysis[fee] = { count: 0, totalParticipants: 0 };
      }
      feeAnalysis[fee].count++;
      feeAnalysis[fee].totalParticipants += tournament.currentParticipants || 0;
    });

    const optimalFee = Object.entries(feeAnalysis)
      .map(([fee, data]) => ({
        fee: parseInt(fee),
        avgParticipants: data.totalParticipants / data.count,
        revenue: parseInt(fee) * data.totalParticipants
      }))
      .sort((a, b) => b.revenue - a.revenue)[0];

    if (optimalFee) {
      return {
        id: 'revenue-optimization',
        title: 'Optimize Entry Fees for Maximum Revenue',
        category: 'optimization',
        priority: 'medium',
        description: `₹${optimalFee.fee} entry fee shows highest revenue potential with ${optimalFee.avgParticipants.toFixed(1)} average participants.`,
        impact: `Potential revenue increase of ₹${(optimalFee.revenue * 0.1).toLocaleString()}`,
        confidence: 72,
        data: { optimalFee, feeAnalysis },
        actions: [
          { id: 'adjust-fees', label: 'Adjust entry fees to optimal range', type: 'manual' },
          { id: 'ab-test', label: 'Run A/B test with different fee structures', type: 'manual' }
        ],
        applied: false
      };
    }

    return null;
  } catch (error) {
    console.error('Error analyzing revenue:', error);
    return null;
  }
}

// Analyze user engagement
async function analyzeUserEngagement() {
  try {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const totalUsers = await User.countDocuments({ isActive: true });
    const activeLastWeek = await User.countDocuments({
      isActive: true,
      lastLogin: { $gte: lastWeek }
    });
    const activeLastMonth = await User.countDocuments({
      isActive: true,
      lastLogin: { $gte: lastMonth }
    });

    const weeklyEngagement = (activeLastWeek / totalUsers) * 100;
    const monthlyEngagement = (activeLastMonth / totalUsers) * 100;

    if (weeklyEngagement < 30) {
      return {
        id: 'user-engagement',
        title: 'Low User Engagement Detected',
        category: 'performance',
        priority: 'high',
        description: `Only ${weeklyEngagement.toFixed(1)}% of users were active in the last week. Consider engagement campaigns.`,
        impact: 'Improve user retention and tournament participation',
        confidence: 85,
        data: { weeklyEngagement, monthlyEngagement, totalUsers, activeLastWeek },
        actions: [
          { id: 'send-notifications', label: 'Send re-engagement notifications', type: 'auto' },
          { id: 'create-campaign', label: 'Create special tournament campaign', type: 'manual' },
          { id: 'analyze-churn', label: 'Analyze user churn patterns', type: 'manual' }
        ],
        applied: false
      };
    }

    return null;
  } catch (error) {
    console.error('Error analyzing engagement:', error);
    return null;
  }
}

// Analyze prize pool optimization
async function analyzePrizePoolOptimization() {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const tournaments = await Tournament.find({
      createdAt: { $gte: lastMonth },
      status: 'completed'
    }).lean();

    if (tournaments.length === 0) return null;

    // Analyze prize pool vs participation
    const avgParticipation = tournaments.reduce((sum, t) => sum + (t.currentParticipants || 0), 0) / tournaments.length;
    const lowParticipationTournaments = tournaments.filter(t => (t.currentParticipants || 0) < avgParticipation * 0.7);

    if (lowParticipationTournaments.length > tournaments.length * 0.3) {
      return {
        id: 'prize-pool-optimization',
        title: 'Increase Prize Pools to Boost Participation',
        category: 'optimization',
        priority: 'medium',
        description: `${lowParticipationTournaments.length} tournaments had below-average participation. Higher prize pools may increase interest.`,
        impact: 'Expected 20-30% increase in tournament participation',
        confidence: 68,
        data: { 
          avgParticipation: avgParticipation.toFixed(1),
          lowParticipationCount: lowParticipationTournaments.length,
          totalTournaments: tournaments.length
        },
        actions: [
          { id: 'increase-prizes', label: 'Increase prize pools for low-participation games', type: 'manual' },
          { id: 'dynamic-prizes', label: 'Implement dynamic prize pool scaling', type: 'auto' }
        ],
        applied: false
      };
    }

    return null;
  } catch (error) {
    console.error('Error analyzing prize pools:', error);
    return null;
  }
}

// Export data functionality
router.get('/export/:type', authenticateAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'csv', startDate, endDate } = req.query;

    let data = [];
    let filename = '';

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    switch (type) {
      case 'tournaments':
        data = await Tournament.find(
          Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}
        ).populate('createdBy', 'username').lean();
        filename = `tournaments_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'users':
        data = await User.find(
          Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}
        ).select('-password').lean();
        filename = `users_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'transactions':
        data = await Transaction.find(
          Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}
        ).populate('user', 'username email').lean();
        filename = `transactions_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'payouts':
        data = await Transaction.find({
          type: 'payout',
          ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
        }).populate('user', 'username email').lean();
        filename = `payouts_${new Date().toISOString().split('T')[0]}`;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type'
        });
    }

    if (format === 'csv') {
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        data,
        filename: `${filename}.json`
      });
    }

  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export data'
    });
  }
});

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value).replace(/"/g, '""');
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}

module.exports = router;