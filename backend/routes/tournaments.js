/**
 * Tournament Routes for GameOn Platform
 * Handles tournament listing, joining, and management
 */

const express = require('express');
const router = express.Router();

// Get all tournaments
router.get('/', async (req, res) => {
  try {
    // Mock data for now
    const tournaments = [
      {
        _id: '1',
        title: 'BGMI Pro League',
        status: 'upcoming',
        map: 'Erangel',
        teamType: 'Squad',
        maxParticipants: 100,
        participants: [],
        entryFee: 20,
        prizePool: 1000,
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        rules: 'Standard BGMI rules apply'
      },
      {
        _id: '2',
        title: 'Solo Showdown',
        status: 'active',
        map: 'Miramar',
        teamType: 'Solo',
        maxParticipants: 50,
        participants: [],
        entryFee: 30,
        prizePool: 2000,
        scheduledAt: new Date(),
        rules: 'Solo mode rules apply'
      }
    ];

    res.json({
      success: true,
      data: tournaments,
      message: 'Tournaments fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tournaments',
      data: []
    });
  }
});

// Get tournament by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock data for now
    const tournament = {
      _id: id,
      title: 'BGMI Pro League',
      status: 'upcoming',
      map: 'Erangel',
      teamType: 'Squad',
      maxParticipants: 100,
      participants: [],
      entryFee: 20,
      prizePool: 1000,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      rules: 'Standard BGMI rules apply'
    };

    res.json({
      success: true,
      data: tournament,
      message: 'Tournament details fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching tournament details:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tournament details',
      data: null
    });
  }
});

// Join tournament
router.post('/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    
    res.json({
      success: true,
      message: 'Successfully joined tournament',
      data: { tournamentId: id }
    });
  } catch (error) {
    console.error('Error joining tournament:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to join tournament'
    });
  }
});

module.exports = router;
