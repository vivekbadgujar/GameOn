/**
 * Tournament Routes for GameOn Platform
 * Handles tournament listing, joining, and management
 */

const express = require('express');
const Tournament = require('../models/Tournament');
const User = require('../models/User');
const router = express.Router();

// Get all tournaments
router.get('/', async (req, res) => {
  try {
    const { status, game, type } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (game) filter.game = game;
    if (type) filter.tournamentType = type;
    
    // Only show upcoming and active tournaments to users
    if (!status) {
      filter.status = { $in: ['upcoming', 'active'] };
    }

    const tournaments = await Tournament.find(filter)
      .sort({ startDate: 1 })
      .populate('participants.user', 'username displayName gameProfile.bgmiId')
      .lean();

    // Transform data for frontend compatibility
    const transformedTournaments = tournaments.map(tournament => ({
      _id: tournament._id,
      title: tournament.title,
      description: tournament.description,
      status: tournament.status,
      game: tournament.game,
      map: tournament.map || 'TBD',
      teamType: tournament.tournamentType,
      maxParticipants: tournament.maxParticipants,
      currentParticipants: tournament.currentParticipants,
      participants: tournament.participants || [],
      entryFee: tournament.entryFee,
      prizePool: tournament.prizePool,
      scheduledAt: tournament.startDate,
      rules: Array.isArray(tournament.rules) ? tournament.rules.join('\n') : tournament.rules,
      createdAt: tournament.createdAt
    }));

    res.json({
      success: true,
      tournaments: transformedTournaments,
      message: 'Tournaments fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tournaments',
      tournaments: []
    });
  }
});

// Get tournament by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const tournament = await Tournament.findById(id)
      .populate('participants.user', 'username displayName gameProfile.bgmiId')
      .populate('winners.user', 'username displayName')
      .lean();

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found',
        tournament: null
      });
    }

    // Transform data for frontend compatibility
    const transformedTournament = {
      _id: tournament._id,
      title: tournament.title,
      description: tournament.description,
      status: tournament.status,
      game: tournament.game,
      map: tournament.map || 'TBD',
      teamType: tournament.tournamentType,
      maxParticipants: tournament.maxParticipants,
      currentParticipants: tournament.currentParticipants,
      participants: tournament.participants || [],
      winners: tournament.winners || [],
      entryFee: tournament.entryFee,
      prizePool: tournament.prizePool,
      scheduledAt: tournament.startDate,
      endDate: tournament.endDate,
      rules: Array.isArray(tournament.rules) ? tournament.rules.join('\n') : tournament.rules,
      roomDetails: tournament.roomDetails,
      createdAt: tournament.createdAt
    };

    res.json({
      success: true,
      tournament: transformedTournament,
      message: 'Tournament details fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching tournament details:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tournament details',
      tournament: null
    });
  }
});

// Join tournament
router.post('/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentData } = req.body;
    
    // Find the tournament
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Check if tournament is still accepting participants
    if (tournament.status === 'completed' || tournament.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Tournament is no longer accepting participants'
      });
    }

    // Check if tournament is full
    if (tournament.currentParticipants >= tournament.maxParticipants) {
      return res.status(400).json({
        success: false,
        error: 'Tournament is full'
      });
    }

    // Mock user ID (in real app, get from auth middleware)
    const userId = req.user?.id || 'mock_user_' + Date.now();

    // Check if user already joined
    const alreadyJoined = tournament.participants.some(p => 
      p.user.toString() === userId
    );

    if (alreadyJoined) {
      return res.status(400).json({
        success: false,
        error: 'You have already joined this tournament'
      });
    }

    // Generate unique slot number
    const slotNumber = tournament.currentParticipants + 1;

    // Add participant to tournament
    tournament.participants.push({
      user: userId,
      joinedAt: new Date(),
      slotNumber: slotNumber,
      paymentData: paymentData || null
    });

    // Update participant count
    tournament.currentParticipants += 1;

    // Save tournament
    await tournament.save();

    // Generate room credentials if close to start time (for demo)
    const roomCredentials = {
      roomId: `ROOM${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      password: `PASS${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    };

    // Update tournament with room details if not already set
    if (!tournament.roomDetails || !tournament.roomDetails.roomId) {
      tournament.roomDetails = roomCredentials;
      await tournament.save();
    }

    res.json({
      success: true,
      message: 'Successfully joined tournament',
      data: { 
        tournamentId: id,
        slotNumber: slotNumber,
        participantCount: tournament.currentParticipants,
        roomCredentials: tournament.roomDetails
      }
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
