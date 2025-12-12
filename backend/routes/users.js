const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/profiles');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Get current user profile (supports both header and cookie auth)
router.get('/profile', async (req, res) => {
  try {
    // Check both Authorization header and cookie
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];
    
    // If no token in header, check cookie
    if (!token && req.cookies && req.cookies.gameon_user_token) {
      token = req.cookies.gameon_user_token;
      console.log('[USER /profile] Using token from cookie');
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
      console.error('[USER /profile] JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET.trim());
    } catch (jwtError) {
      console.error('[USER /profile] JWT verification error:', jwtError.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    const user = await User.findById(decoded.userId).select('-password -otp');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.status === 'banned' || user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Account has been suspended or banned'
      });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        gameProfile: user.gameProfile,
        wallet: user.wallet,
        stats: user.stats,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('[USER /profile] Error:', error);
    console.error('[USER /profile] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { type = 'global' } = req.query;
    
    // Mock leaderboard data (replace with actual DB query)
    const leaderboard = [
      {
        _id: '1',
        username: 'ProGamer123',
        gameProfile: { bgmiId: 'BGMI001' },
        stats: { matches: 50, wins: 25, points: 1250 }
      },
      {
        _id: '2',
        username: 'GameMaster',
        gameProfile: { bgmiId: 'BGMI002' },
        stats: { matches: 45, wins: 20, points: 1100 }
      },
      {
        _id: '3',
        username: 'VictoryKing',
        gameProfile: { bgmiId: 'BGMI003' },
        stats: { matches: 40, wins: 18, points: 950 }
      }
    ];
    
    res.json({
      success: true,
      data: leaderboard
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve leaderboard', 
      error: err.message 
    });
  }
});

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch user from database
    const user = {
      id,
      username: 'SampleUser',
      email: 'user@example.com',
      gamerTag: 'Pro_Gamer_123',
      wins: 15,
      losses: 3,
      totalEarnings: 500.00,
      joinedTournaments: 8,
      createdAt: new Date('2024-01-15')
    }; // Placeholder - should query DB
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      message: 'User profile retrieved successfully',
      data: user
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve user profile', 
      error: err.message 
    });
  }
});

// Update user profile
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Validate allowed updates
    const allowedUpdates = ['gamerTag', 'email', 'bio', 'favoriteGames'];
    const updateKeys = Object.keys(updates);
    const isValidUpdate = updateKeys.every(key => allowedUpdates.includes(key));
    
    if (!isValidUpdate) {
      return res.status(400).json({
        success: false,
        message: 'Invalid update fields'
      });
    }
    
    // Update user in database
    // const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true });
    
    res.json({
      success: true,
      message: 'User profile updated successfully',
      data: { id, ...updates }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update user profile', 
      error: err.message 
    });
  }
});

// Get user's tournament history
router.get('/:id/tournaments', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch user's tournaments from database
    const tournaments = [
      {
        id: 1,
        title: 'Valorant Championship',
        game: 'Valorant',
        placement: 2,
        earnings: 150.00,
        date: '2024-01-20'
      },
      {
        id: 2,
        title: 'CS:GO Masters',
        game: 'CS:GO',
        placement: 1,
        earnings: 300.00,
        date: '2024-01-15'
      }
    ]; // Placeholder - should query DB
    
    res.json({
      success: true,
      message: 'Tournament history retrieved successfully',
      data: tournaments
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve tournament history', 
      error: err.message 
    });
  }
});

// Get user's statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Calculate user statistics from database
    const stats = {
      totalTournaments: 8,
      wins: 3,
      top3Finishes: 5,
      winRate: 37.5,
      totalEarnings: 500.00,
      averageEarnings: 62.50,
      favoriteGame: 'Valorant',
      currentRank: 'Gold',
      monthlyStats: {
        tournamentsThisMonth: 2,
        earningsThisMonth: 200.00
      }
    }; // Placeholder - should calculate from DB
    
    res.json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: stats
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve user statistics', 
      error: err.message 
    });
  }
});

// Upload profile photo
router.post('/upload-photo', authenticateToken, upload.single('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const userId = req.user.userId;
    const photoUrl = `/uploads/profiles/${req.file.filename}`;

    // Update user's avatar in database
    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: photoUrl },
      { new: true }
    ).select('-password');

    if (!user) {
      // Delete uploaded file if user not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile photo updated successfully',
      user: user
    });
  } catch (err) {
    // Delete uploaded file on error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (deleteErr) {
        console.error('Error deleting file:', deleteErr);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload profile photo', 
      error: err.message 
    });
  }
});

// Get user leaderboard position
router.get('/:id/rank', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Calculate user's rank in leaderboard
    const rankInfo = {
      userId: id,
      globalRank: 245,
      totalEarnings: 500.00,
      pointsToNextRank: 150.00,
      tier: 'Gold',
      percentile: 78.5
    }; // Placeholder - should calculate from DB
    
    res.json({
      success: true,
      message: 'User rank retrieved successfully',
      data: rankInfo
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve user rank', 
      error: err.message 
    });
  }
});

module.exports = router;
