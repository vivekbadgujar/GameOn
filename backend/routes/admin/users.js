/**
 * Admin User Management Routes
 * Handles user management, banning, and disqualification
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../../models/User');
const Tournament = require('../../models/Tournament');
const { authenticateAdmin, requirePermission } = require('../../middleware/adminAuth');
const router = express.Router();

// Debug route - no authentication required (must be before middleware)
router.get('/debug', async (req, res) => {
  try {
    console.log('Debug route - No auth required');
    
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    console.log('Debug route - Found users:', users.length);
    
    // Get recent users (last 24 hours)
    const recentUsers = await User.find({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    console.log('Debug route - Recent users (24h):', recentUsers.length);
    
    res.json({
      success: true,
      message: 'Debug users data',
      count: users.length,
      recentCount: recentUsers.length,
      users: users.slice(0, 5), // Return first 5 users
      recentUsers: recentUsers.slice(0, 3), // Return first 3 recent users
      sampleUser: users[0] || null
    });
  } catch (error) {
    console.error('Debug route error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug route failed',
      error: error.message
    });
  }
});

// Middleware to protect all admin user routes
router.use(authenticateAdmin);

// Get all users with pagination and filtering
router.get('/', requirePermission('users_manage'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Build filter based on query parameters
    const filter = {};
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { username: searchRegex },
        { email: searchRegex },
        { 'gameProfile.bgmiName': searchRegex },
        { 'gameProfile.bgmiId': searchRegex }
      ];
    }
    
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }
    
    // Execute query with pagination
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await User.countDocuments(filter);
    
    // Calculate statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const bannedUsers = await User.countDocuments({ status: 'banned' });
    const newThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });
    
    // Add tournament count for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const tournamentCount = await Tournament.countDocuments({
          'participants.user': user._id
        });
        
        return {
          ...user.toObject(),
          stats: {
            totalTournaments: tournamentCount
          }
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        users: usersWithStats,
        total,
        stats: {
          totalUsers,
          activeUsers,
          bannedUsers,
          newThisMonth,
          userGrowth: 0, // Could calculate from historical data
          activeGrowth: 0,
          newUserGrowth: 0,
          bannedGrowth: 0
        },
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Get user reports
router.get('/reports', requirePermission('users_manage'), async (req, res) => {
  try {
    // For now, return empty reports data
    res.json({
      success: true,
      data: [],
      pagination: {
        total: 0,
        page: 1,
        limit: 20,
        pages: 0
      }
    });
  } catch (error) {
    console.error('Error fetching user reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user reports',
      error: error.message
    });
  }
});

// Get user details by ID
router.get('/:id', requirePermission('users_manage'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get user's tournament history
    const tournaments = await Tournament.find({
      'participants.user': user._id
    }).select('title startDate status');
    
    res.json({
      success: true,
      data: {
        user,
        tournaments
      }
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
      error: error.message
    });
  }
});

// Ban a user
router.post('/:id/ban', 
  requirePermission('users_manage'),
  [
    body('reason').notEmpty().withMessage('Ban reason is required'),
    body('duration').optional().isNumeric().withMessage('Duration must be a number (days)')
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const userId = req.params.id;
      const { reason, duration, permanent = false } = req.body;
      
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Calculate ban expiry date if not permanent
      let banExpiresAt = null;
      if (!permanent && duration) {
        banExpiresAt = new Date();
        banExpiresAt.setDate(banExpiresAt.getDate() + parseInt(duration));
      }
      
      // Update user status
      user.status = 'banned';
      user.banReason = reason;
      user.banExpiresAt = permanent ? null : banExpiresAt;
      user.bannedBy = req.admin._id;
      user.bannedAt = new Date();
      
      await user.save();
      
      // Disqualify user from active tournaments
      await Tournament.updateMany(
        { 
          'participants.user': userId,
          status: { $in: ['upcoming', 'live'] }
        },
        {
          $pull: { participants: { user: userId } },
          $inc: { currentParticipants: -1 }
        }
      );
      
      res.json({
        success: true,
        message: `User banned ${permanent ? 'permanently' : `for ${duration} days`}`,
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            status: user.status,
            banReason: user.banReason,
            banExpiresAt: user.banExpiresAt
          }
        }
      });
    } catch (error) {
      console.error('Error banning user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to ban user',
        error: error.message
      });
    }
  }
);

// Unban a user
router.post('/:id/unban', requirePermission('users_manage'), async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.status !== 'banned') {
      return res.status(400).json({
        success: false,
        message: 'User is not currently banned'
      });
    }
    
    // Update user status
    user.status = 'active';
    user.banReason = null;
    user.banExpiresAt = null;
    user.unbannedBy = req.admin._id;
    user.unbannedAt = new Date();
    
    await user.save();
    
    res.json({
      success: true,
      message: 'User unbanned successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          status: user.status
        }
      }
    });
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unban user',
      error: error.message
    });
  }
});

// Disqualify a user from a specific tournament
router.post('/:id/disqualify/:tournamentId', 
  requirePermission('tournaments_manage'),
  [
    body('reason').notEmpty().withMessage('Disqualification reason is required')
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const userId = req.params.id;
      const tournamentId = req.params.tournamentId;
      const { reason } = req.body;
      
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Check if tournament exists
      const tournament = await Tournament.findById(tournamentId);
      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: 'Tournament not found'
        });
      }
      
      // Check if user is a participant in the tournament
      const participantIndex = tournament.participants.findIndex(
        p => p.user.toString() === userId
      );
      
      if (participantIndex === -1) {
        return res.status(400).json({
          success: false,
          message: 'User is not a participant in this tournament'
        });
      }
      
      // Check if tournament is still active
      if (tournament.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot disqualify user from a completed tournament'
        });
      }
      
      // Remove user from participants
      tournament.participants.splice(participantIndex, 1);
      tournament.currentParticipants -= 1;
      
      // Add disqualification record
      if (!tournament.disqualifications) {
        tournament.disqualifications = [];
      }
      
      tournament.disqualifications.push({
        user: userId,
        reason,
        disqualifiedBy: req.admin._id,
        disqualifiedAt: new Date()
      });
      
      await tournament.save();
      
      // If tournament has entry fee, refund it to the user
      if (tournament.entryFee > 0) {
        // Create refund transaction
        // This would typically be handled by a payment service
        // For now, we'll just update the user's wallet balance
        await User.findByIdAndUpdate(
          userId,
          { $inc: { walletBalance: tournament.entryFee } }
        );
      }
      
      res.json({
        success: true,
        message: 'User disqualified from tournament successfully',
        data: {
          user: {
            _id: user._id,
            name: user.name
          },
          tournament: {
            _id: tournament._id,
            title: tournament.title
          },
          reason
        }
      });
    } catch (error) {
      console.error('Error disqualifying user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to disqualify user',
        error: error.message
      });
    }
  }
);

module.exports = router;