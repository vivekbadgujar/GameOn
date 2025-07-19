const express = require('express');
const router = express.Router();

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

// Upload profile picture
router.post('/:id/avatar', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Handle file upload (would use multer middleware)
    // const avatarUrl = await uploadAvatar(req.file);
    
    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: { avatarUrl: '/uploads/avatars/user_' + id + '.jpg' }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload profile picture', 
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
