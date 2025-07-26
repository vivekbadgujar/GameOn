/**
 * Admin User Monitoring Routes
 * Handles suspicious user detection and behavior analysis
 */

const express = require('express');
const User = require('../../models/User');
const Tournament = require('../../models/Tournament');
const Transaction = require('../../models/Transaction');
const AIFlag = require('../../models/AIFlag');
const { authenticateAdmin, requirePermission, auditLog } = require('../../middleware/adminAuth');
const router = express.Router();

// Middleware to protect all admin user monitoring routes
router.use(authenticateAdmin);

// Get suspicious users based on behavior analysis
router.get('/suspicious-users', 
  requirePermission('users_manage'),
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Analyze user behavior patterns
      const suspiciousUsers = await analyzeSuspiciousUsers();
      
      // Paginate results
      const paginatedUsers = suspiciousUsers.slice(skip, skip + limit);
      
      res.json({
        success: true,
        data: {
          users: paginatedUsers,
          pagination: {
            total: suspiciousUsers.length,
            page,
            pages: Math.ceil(suspiciousUsers.length / limit),
            limit
          }
        }
      });
    } catch (error) {
      console.error('Error fetching suspicious users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch suspicious users',
        error: error.message
      });
    }
  }
);

// Get detailed analysis for a specific user
router.get('/user-analysis/:userId', 
  requirePermission('users_manage'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Perform detailed analysis
      const analysis = await performDetailedUserAnalysis(userId);
      
      res.json({
        success: true,
        data: {
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            gameProfile: user.gameProfile,
            createdAt: user.createdAt,
            status: user.status
          },
          analysis
        }
      });
    } catch (error) {
      console.error('Error performing user analysis:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform user analysis',
        error: error.message
      });
    }
  }
);

// Flag a user as suspicious
router.post('/flag-user/:userId', 
  requirePermission('users_manage'),
  auditLog('flag_suspicious_user'),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { reason, severity, notes } = req.body;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Create AI flag for manual review
      const flag = new AIFlag({
        userId,
        reason: reason || 'Manual flag by admin',
        confidence: 1.0, // Manual flags have 100% confidence
        detectedIssues: [{
          type: 'manual_review',
          confidence: 1.0,
          description: notes || 'Flagged by admin for manual review'
        }],
        severity: severity || 'medium',
        status: 'pending',
        createdBy: req.admin._id,
        adminNotes: notes
      });

      await flag.save();

      // Update user status if high severity
      if (severity === 'high') {
        user.status = 'suspended';
        await user.save();
      }

      // Emit Socket.IO event
      req.app.get('io').emit('userFlagged', {
        userId: user._id,
        username: user.username,
        reason,
        severity,
        flaggedBy: req.admin._id
      });

      res.json({
        success: true,
        message: 'User flagged successfully',
        data: {
          flag,
          userStatus: user.status
        }
      });
    } catch (error) {
      console.error('Error flagging user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to flag user',
        error: error.message
      });
    }
  }
);

// Get user behavior patterns
router.get('/behavior-patterns', 
  requirePermission('users_manage'),
  async (req, res) => {
    try {
      const patterns = await analyzeBehaviorPatterns();
      
      res.json({
        success: true,
        data: patterns
      });
    } catch (error) {
      console.error('Error analyzing behavior patterns:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze behavior patterns',
        error: error.message
      });
    }
  }
);

// Helper function to analyze suspicious users
async function analyzeSuspiciousUsers() {
  try {
    const users = await User.find({ status: { $ne: 'deleted' } })
      .populate('tournaments.tournament', 'title prizePool')
      .lean();

    const suspiciousUsers = [];

    for (const user of users) {
      const suspicionScore = await calculateSuspicionScore(user);
      
      if (suspicionScore.totalScore > 50) { // Threshold for suspicious behavior
        suspiciousUsers.push({
          ...user,
          suspicionScore,
          riskLevel: getRiskLevel(suspicionScore.totalScore)
        });
      }
    }

    // Sort by suspicion score (highest first)
    return suspiciousUsers.sort((a, b) => b.suspicionScore.totalScore - a.suspicionScore.totalScore);
  } catch (error) {
    console.error('Error in analyzeSuspiciousUsers:', error);
    return [];
  }
}

// Helper function to calculate suspicion score
async function calculateSuspicionScore(user) {
  let score = 0;
  const factors = [];

  // Factor 1: Account age vs tournament participation
  const accountAge = (new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24); // days
  const tournamentCount = user.tournaments?.length || 0;
  
  if (accountAge < 7 && tournamentCount > 5) {
    score += 30;
    factors.push({ factor: 'New account with high activity', score: 30 });
  }

  // Factor 2: Win rate analysis
  const wins = user.tournaments?.filter(t => t.position === 1).length || 0;
  const winRate = tournamentCount > 0 ? (wins / tournamentCount) * 100 : 0;
  
  if (winRate > 80 && tournamentCount > 3) {
    score += 25;
    factors.push({ factor: 'Unusually high win rate', score: 25 });
  }

  // Factor 3: Multiple accounts detection (same device/IP patterns)
  // This would require additional tracking - simplified for demo
  if (user.email && user.email.includes('+')) {
    score += 15;
    factors.push({ factor: 'Potential multiple accounts', score: 15 });
  }

  // Factor 4: Rapid skill improvement
  const recentTournaments = user.tournaments?.slice(-5) || [];
  const earlyTournaments = user.tournaments?.slice(0, 5) || [];
  
  if (recentTournaments.length > 0 && earlyTournaments.length > 0) {
    const recentAvgPosition = recentTournaments.reduce((sum, t) => sum + (t.position || 10), 0) / recentTournaments.length;
    const earlyAvgPosition = earlyTournaments.reduce((sum, t) => sum + (t.position || 10), 0) / earlyTournaments.length;
    
    if (earlyAvgPosition - recentAvgPosition > 5) {
      score += 20;
      factors.push({ factor: 'Rapid skill improvement', score: 20 });
    }
  }

  // Factor 5: Unusual gaming patterns
  if (user.gameProfile?.bgmiId && user.gameProfile.bgmiId.length < 5) {
    score += 10;
    factors.push({ factor: 'Suspicious game ID format', score: 10 });
  }

  // Factor 6: AI flags history
  const aiFlags = await AIFlag.countDocuments({ userId: user._id });
  if (aiFlags > 2) {
    score += aiFlags * 10;
    factors.push({ factor: `Multiple AI flags (${aiFlags})`, score: aiFlags * 10 });
  }

  return {
    totalScore: Math.min(score, 100), // Cap at 100
    factors,
    accountAge: Math.round(accountAge),
    tournamentCount,
    winRate: Math.round(winRate),
    aiFlags
  };
}

// Helper function to perform detailed user analysis
async function performDetailedUserAnalysis(userId) {
  try {
    // Get user's tournament history
    const tournaments = await Tournament.find({
      'participants.user': userId
    }).populate('participants.user', 'username').lean();

    // Get user's transaction history
    const transactions = await Transaction.find({ user: userId }).lean();

    // Get AI flags
    const aiFlags = await AIFlag.find({ userId }).lean();

    // Analyze patterns
    const tournamentAnalysis = analyzeTournamentPatterns(tournaments, userId);
    const transactionAnalysis = analyzeTransactionPatterns(transactions);
    const timeAnalysis = analyzeTimePatterns(tournaments, userId);

    return {
      tournamentHistory: {
        total: tournaments.length,
        wins: tournaments.filter(t => {
          const participant = t.participants.find(p => p.user._id.toString() === userId);
          return participant && participant.position === 1;
        }).length,
        analysis: tournamentAnalysis
      },
      transactionHistory: {
        total: transactions.length,
        totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
        analysis: transactionAnalysis
      },
      aiFlags: {
        total: aiFlags.length,
        pending: aiFlags.filter(f => f.status === 'pending').length,
        rejected: aiFlags.filter(f => f.status === 'rejected').length
      },
      timePatterns: timeAnalysis,
      riskAssessment: calculateRiskAssessment(tournaments, transactions, aiFlags, userId)
    };
  } catch (error) {
    console.error('Error in performDetailedUserAnalysis:', error);
    return {};
  }
}

// Helper functions for pattern analysis
function analyzeTournamentPatterns(tournaments, userId) {
  const patterns = [];
  
  // Check for consistent high performance
  const positions = tournaments.map(t => {
    const participant = t.participants.find(p => p.user._id.toString() === userId);
    return participant ? participant.position : null;
  }).filter(p => p !== null);

  const avgPosition = positions.length > 0 ? positions.reduce((sum, p) => sum + p, 0) / positions.length : 0;
  
  if (avgPosition < 3 && positions.length > 5) {
    patterns.push({
      type: 'consistent_high_performance',
      description: 'User consistently places in top 3',
      riskLevel: 'medium'
    });
  }

  return patterns;
}

function analyzeTransactionPatterns(transactions) {
  const patterns = [];
  
  // Check for unusual transaction amounts
  const amounts = transactions.map(t => t.amount);
  const avgAmount = amounts.length > 0 ? amounts.reduce((sum, a) => sum + a, 0) / amounts.length : 0;
  
  const largeTransactions = amounts.filter(a => a > avgAmount * 3);
  if (largeTransactions.length > 2) {
    patterns.push({
      type: 'unusual_transaction_amounts',
      description: 'Multiple transactions significantly above average',
      riskLevel: 'low'
    });
  }

  return patterns;
}

function analyzeTimePatterns(tournaments, userId) {
  const patterns = [];
  
  // Check for unusual playing hours
  const playTimes = tournaments.map(t => {
    const participant = t.participants.find(p => p.user._id.toString() === userId);
    return participant ? new Date(t.startDate).getHours() : null;
  }).filter(h => h !== null);

  const nightPlaying = playTimes.filter(h => h >= 22 || h <= 6).length;
  const nightPercentage = playTimes.length > 0 ? (nightPlaying / playTimes.length) * 100 : 0;

  if (nightPercentage > 70 && playTimes.length > 5) {
    patterns.push({
      type: 'unusual_playing_hours',
      description: 'Primarily plays during night hours (10 PM - 6 AM)',
      percentage: Math.round(nightPercentage),
      riskLevel: 'low'
    });
  }

  return patterns;
}

function calculateRiskAssessment(tournaments, transactions, aiFlags, userId) {
  let riskScore = 0;
  const factors = [];

  // AI flags contribute heavily to risk
  if (aiFlags.length > 0) {
    riskScore += aiFlags.length * 20;
    factors.push(`${aiFlags.length} AI flags detected`);
  }

  // High win rate
  const wins = tournaments.filter(t => {
    const participant = t.participants.find(p => p.user._id.toString() === userId);
    return participant && participant.position === 1;
  }).length;
  
  const winRate = tournaments.length > 0 ? (wins / tournaments.length) * 100 : 0;
  if (winRate > 60 && tournaments.length > 3) {
    riskScore += 15;
    factors.push(`High win rate: ${Math.round(winRate)}%`);
  }

  return {
    score: Math.min(riskScore, 100),
    level: getRiskLevel(riskScore),
    factors
  };
}

function getRiskLevel(score) {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  if (score >= 20) return 'low';
  return 'minimal';
}

function analyzeBehaviorPatterns() {
  // This would analyze overall platform behavior patterns
  return {
    totalUsers: 0,
    suspiciousUsers: 0,
    commonPatterns: [
      {
        pattern: 'New accounts with high activity',
        frequency: 15,
        riskLevel: 'medium'
      },
      {
        pattern: 'Unusual win rates',
        frequency: 8,
        riskLevel: 'high'
      }
    ],
    recommendations: [
      'Implement stricter verification for new accounts',
      'Monitor users with win rates above 70%',
      'Review accounts with multiple AI flags'
    ]
  };
}

module.exports = router;