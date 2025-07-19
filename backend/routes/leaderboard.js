const express = require('express');
const router = express.Router();

// Get global leaderboard
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, sortBy = 'earnings' } = req.query;
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Mock leaderboard data - would query from database
    const leaderboard = [
      {
        rank: 1,
        userId: 'user_001',
        username: 'ProGamer2024',
        gamerTag: 'PG_Champion',
        totalEarnings: 5500.00,
        tournamentsWon: 12,
        tournamentsPlayed: 45,
        winRate: 26.7,
        currentStreak: 3,
        favoriteGame: 'Valorant',
        avatar: '/avatars/user_001.jpg'
      },
      {
        rank: 2,
        userId: 'user_002',
        username: 'EsportsKing',
        gamerTag: 'ESK_Legend',
        totalEarnings: 4800.50,
        tournamentsWon: 10,
        tournamentsPlayed: 38,
        winRate: 26.3,
        currentStreak: 1,
        favoriteGame: 'CS:GO',
        avatar: '/avatars/user_002.jpg'
      },
      {
        rank: 3,
        userId: 'user_003',
        username: 'GameMaster',
        gamerTag: 'GM_Elite',
        totalEarnings: 4200.75,
        tournamentsWon: 8,
        tournamentsPlayed: 42,
        winRate: 19.0,
        currentStreak: 0,
        favoriteGame: 'League of Legends',
        avatar: '/avatars/user_003.jpg'
      }
      // ... more players
    ];
    
    res.json({
      success: true,
      message: 'Leaderboard retrieved successfully',
      data: {
        players: leaderboard,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(500 / limit), // Assuming 500 total players
          totalPlayers: 500,
          limit: parseInt(limit)
        }
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve leaderboard', 
      error: err.message 
    });
  }
});

// Get leaderboard by game
router.get('/game/:gameTitle', async (req, res) => {
  try {
    const { gameTitle } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Mock game-specific leaderboard
    const gameLeaderboard = [
      {
        rank: 1,
        userId: 'user_001',
        username: 'ValorantPro',
        gamerTag: 'VP_Ace',
        gameEarnings: 2500.00,
        gameWins: 8,
        gameTournaments: 20,
        gameWinRate: 40.0,
        averagePlacement: 2.5,
        bestPlacement: 1
      }
      // ... more game-specific data
    ];
    
    res.json({
      success: true,
      message: `${gameTitle} leaderboard retrieved successfully`,
      data: {
        game: gameTitle,
        players: gameLeaderboard,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(150 / limit), // Game-specific player count
          totalPlayers: 150,
          limit: parseInt(limit)
        }
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve game leaderboard', 
      error: err.message 
    });
  }
});

// Get monthly leaderboard
router.get('/monthly', async (req, res) => {
  try {
    const { year, month } = req.query;
    const currentDate = new Date();
    const targetYear = year || currentDate.getFullYear();
    const targetMonth = month || currentDate.getMonth() + 1;
    
    // Mock monthly leaderboard
    const monthlyLeaderboard = [
      {
        rank: 1,
        userId: 'user_004',
        username: 'MonthlyChamp',
        gamerTag: 'MC_Rising',
        monthlyEarnings: 1200.00,
        monthlyWins: 4,
        monthlyTournaments: 8,
        monthlyWinRate: 50.0,
        improvement: '+15 positions'
      }
      // ... more monthly data
    ];
    
    res.json({
      success: true,
      message: `Monthly leaderboard for ${targetYear}-${targetMonth} retrieved successfully`,
      data: {
        period: { year: targetYear, month: targetMonth },
        players: monthlyLeaderboard,
        totalPrizePool: 25000.00,
        totalTournaments: 48
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve monthly leaderboard', 
      error: err.message 
    });
  }
});

// Get weekly leaderboard
router.get('/weekly', async (req, res) => {
  try {
    // Mock weekly leaderboard
    const weeklyLeaderboard = [
      {
        rank: 1,
        userId: 'user_005',
        username: 'WeekWarrior',
        gamerTag: 'WW_Fast',
        weeklyEarnings: 450.00,
        weeklyWins: 2,
        weeklyTournaments: 3,
        weeklyWinRate: 66.7,
        trend: 'up'
      }
      // ... more weekly data
    ];
    
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of current week
    
    res.json({
      success: true,
      message: 'Weekly leaderboard retrieved successfully',
      data: {
        weekStart: weekStart.toISOString().split('T')[0],
        players: weeklyLeaderboard,
        totalPrizePool: 5000.00,
        totalTournaments: 12
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve weekly leaderboard', 
      error: err.message 
    });
  }
});

// Get top earning players
router.get('/top-earners', async (req, res) => {
  try {
    const { period = 'all-time', limit = 10 } = req.query;
    
    // Mock top earners data
    const topEarners = [
      {
        rank: 1,
        userId: 'user_001',
        username: 'TopEarner1',
        gamerTag: 'TE1_Legend',
        earnings: 12500.00,
        tournamentsWon: 25,
        averageEarnings: 500.00
      }
      // ... more top earners
    ];
    
    res.json({
      success: true,
      message: `Top ${limit} earners (${period}) retrieved successfully`,
      data: {
        period,
        players: topEarners.slice(0, limit)
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve top earners', 
      error: err.message 
    });
  }
});

// Get rising stars (new players with good performance)
router.get('/rising-stars', async (req, res) => {
  try {
    // Mock rising stars data - players who joined recently but performing well
    const risingStars = [
      {
        userId: 'user_101',
        username: 'NewcomerAce',
        gamerTag: 'NA_Rising',
        joinedDate: '2024-01-01',
        currentRank: 45,
        earningsGrowth: 850.00,
        winRate: 42.5,
        tournamentsPlayed: 12,
        potential: 'High'
      }
      // ... more rising stars
    ];
    
    res.json({
      success: true,
      message: 'Rising stars retrieved successfully',
      data: risingStars
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve rising stars', 
      error: err.message 
    });
  }
});

// Get player's position in leaderboard
router.get('/position/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Mock player position data
    const playerPosition = {
      userId,
      globalRank: 156,
      totalEarnings: 845.50,
      tournamentsWon: 3,
      tournamentsPlayed: 28,
      winRate: 10.7,
      rankChange: -5, // Moved down 5 positions
      nearbyPlayers: {
        above: [
          { rank: 154, username: 'Player154', earnings: 852.00 },
          { rank: 155, username: 'Player155', earnings: 848.75 }
        ],
        below: [
          { rank: 157, username: 'Player157', earnings: 843.25 },
          { rank: 158, username: 'Player158', earnings: 840.00 }
        ]
      },
      nextMilestone: {
        rank: 150,
        earningsNeeded: 7.00,
        description: 'Top 150 players'
      }
    };
    
    res.json({
      success: true,
      message: 'Player position retrieved successfully',
      data: playerPosition
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve player position', 
      error: err.message 
    });
  }
});

// Get leaderboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Mock leaderboard statistics
    const stats = {
      totalPlayers: 2547,
      activePlayers: 1823, // Played in last 30 days
      totalPrizeDistributed: 125000.00,
      averageEarnings: 49.10,
      topEarning: 12500.00,
      mostPopularGame: 'Valorant',
      totalTournaments: 1250,
      averageTournamentsPerPlayer: 8.5,
      topCountries: [
        { country: 'USA', playerCount: 512 },
        { country: 'Canada', playerCount: 298 },
        { country: 'UK', playerCount: 267 }
      ]
    };
    
    res.json({
      success: true,
      message: 'Leaderboard statistics retrieved successfully',
      data: stats
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve leaderboard statistics', 
      error: err.message 
    });
  }
});

module.exports = router;
