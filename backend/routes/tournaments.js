/**
 * Tournament Routes for GameOn Platform
 * Handles tournament listing, joining, and management
 */

const express = require('express');
const Tournament = require('../models/Tournament');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all tournaments
router.get('/', async (req, res) => {
  try {
    console.log('Public tournaments route - Query params:', req.query);
    
    // Extract and validate query parameters
    const { status, game, type, limit } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Handle status parameter (avoid nested object issues)
    if (status && typeof status === 'string') {
      filter.status = status;
    }
    
    if (game && typeof game === 'string') {
      filter.game = game;
    }
    
    if (type && typeof type === 'string') {
      filter.tournamentType = type;
    }
    
    // For frontend, show ALL tournaments without any visibility filtering
    // Removed visibility filter to ensure all tournaments are shown
    // filter.$or = [
    //   { isVisible: true },
    //   { isVisible: { $exists: false } },
    //   { isVisible: null }
    // ];
    
    console.log('Public tournaments route - Filter:', filter);

    // Build query with optional limit
    let query = Tournament.find(filter)
      .sort({ startDate: 1 })
      .populate('participants.user', 'username displayName gameProfile.bgmiId');
    
    // Apply limit if specified and valid
    if (limit && !isNaN(parseInt(limit)) && parseInt(limit) > 0) {
      query = query.limit(parseInt(limit));
      console.log('Public tournaments route - Applied limit:', parseInt(limit));
    }
    
    const tournaments = await query.lean();

    console.log('Public tournaments found:', tournaments.length);
    console.log('Sample tournament data:', tournaments[0] ? {
      id: tournaments[0]._id,
      title: tournaments[0].title,
      status: tournaments[0].status,
      isVisible: tournaments[0].isVisible,
      isPublic: tournaments[0].isPublic
    } : 'No tournaments');

    // Transform data for frontend compatibility
    const transformedTournaments = tournaments.map(tournament => ({
      _id: tournament._id,
      title: tournament.title,
      name: tournament.title, // Add name field for compatibility
      description: tournament.description,
      status: tournament.status,
      game: tournament.game,
      map: tournament.map || 'TBD',
      teamType: tournament.tournamentType,
      tournamentType: tournament.tournamentType,
      maxParticipants: tournament.maxParticipants,
      currentParticipants: tournament.currentParticipants,
      participants: tournament.participants || [],
      entryFee: tournament.entryFee,
      prizePool: tournament.prizePool,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      scheduledAt: tournament.startDate,
      poster: tournament.poster || '',
      posterUrl: tournament.posterUrl || '',
      rules: Array.isArray(tournament.rules) ? tournament.rules.join('\n') : tournament.rules,
      createdAt: tournament.createdAt
    }));
    
    console.log('Transformed tournaments count:', transformedTournaments.length);

    res.json({
      success: true,
      tournaments: transformedTournaments,
      message: 'Tournaments fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    console.error('Error stack:', error.stack);
    console.error('Query params that caused error:', req.query);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tournaments',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentData } = req.body;
    
    console.log('Tournament join request:', {
      tournamentId: id,
      userId: req.user._id,
      paymentData: paymentData ? 'provided' : 'none'
    });
    
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

    // Get user ID from authenticated user
    const userId = req.user._id;

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
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid tournament data'
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid tournament ID'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to join tournament'
    });
  }
});

// Join tournament as a squad (4 players together)
router.post('/:id/join-squad', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { squadMembers, paymentData } = req.body; // squadMembers: array of user IDs

    // Validate squad size
    if (!squadMembers || squadMembers.length !== 4) {
      return res.status(400).json({
        success: false,
        error: 'Squad must have exactly 4 members'
      });
    }

    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Check if tournament is open for registration
    if (tournament.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        error: 'Tournament registration is closed'
      });
    }

    // Check if tournament has enough slots for the squad
    if (tournament.currentParticipants + 4 > tournament.maxParticipants) {
      return res.status(400).json({
        success: false,
        error: 'Not enough slots available for the squad'
      });
    }

    // Check if any squad member already joined
    const alreadyJoined = squadMembers.some(memberId => 
      tournament.participants.some(p => p.user.toString() === memberId)
    );

    if (alreadyJoined) {
      return res.status(400).json({
        success: false,
        error: 'One or more squad members have already joined this tournament'
      });
    }

    // Validate all squad members exist
    const users = await User.find({ _id: { $in: squadMembers } });
    if (users.length !== 4) {
      return res.status(400).json({
        success: false,
        error: 'One or more squad members not found'
      });
    }

    // Generate consecutive slot numbers for the squad
    const startingSlot = tournament.currentParticipants + 1;
    const squadSlots = [startingSlot, startingSlot + 1, startingSlot + 2, startingSlot + 3];

    // Add all squad members as participants
    squadMembers.forEach((memberId, index) => {
      tournament.participants.push({
        user: memberId,
        joinedAt: new Date(),
        slotNumber: squadSlots[index],
        status: paymentData ? 'confirmed' : 'waiting', // Auto-confirm if payment provided
        squadId: `squad_${Date.now()}`, // Unique squad identifier
        paymentData: paymentData || null
      });
    });

    // Update participant count
    tournament.currentParticipants += 4;

    // Save tournament
    await tournament.save();

    // Emit Socket.IO event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('squadJoined', {
        tournamentId: id,
        squadMembers,
        squadSlots,
        participantCount: tournament.currentParticipants
      });
    }

    res.json({
      success: true,
      message: 'Squad successfully joined tournament',
      data: { 
        tournamentId: id,
        squadSlots,
        participantCount: tournament.currentParticipants,
        squadMembers: users.map(u => ({
          id: u._id,
          username: u.username,
          gameProfile: u.gameProfile
        }))
      }
    });

  } catch (error) {
    console.error('Error joining tournament as squad:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to join tournament as squad'
    });
  }
});

// Get tournament participants (for waiting room)
router.get('/:id/participants', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const tournament = await Tournament.findById(id)
      .populate('participants.user', 'username email gameProfile')
      .lean();

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Filter out kicked participants for public view
    const activeParticipants = tournament.participants.filter(p => p.status !== 'kicked');

    res.json({
      success: true,
      data: {
        participants: activeParticipants,
        totalSlots: tournament.maxParticipants,
        availableSlots: tournament.maxParticipants - activeParticipants.length
      }
    });

  } catch (error) {
    console.error('Error fetching tournament participants:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch participants'
    });
  }
});

// Swap player slot (for waiting room drag & drop)
router.post('/:id/swap-slot', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { sourceSlot, destSlot } = req.body;
    const userId = req.user._id;

    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Check if slots are locked
    const now = new Date();
    const startTime = new Date(tournament.startDate);
    const lockTime = new Date(startTime.getTime() - 10 * 60 * 1000); // 10 minutes before start

    if (now >= lockTime) {
      return res.status(400).json({
        success: false,
        error: 'Slots are locked! No more position changes allowed.'
      });
    }

    // Find user's current participant record
    const userParticipant = tournament.participants.find(p => 
      p.user.toString() === userId.toString() && p.slotNumber === sourceSlot
    );

    if (!userParticipant) {
      return res.status(400).json({
        success: false,
        error: 'You can only move your own slot position'
      });
    }

    // Check if destination slot is occupied
    const destParticipant = tournament.participants.find(p => p.slotNumber === destSlot);

    if (destParticipant) {
      // Swap positions
      destParticipant.slotNumber = sourceSlot;
      userParticipant.slotNumber = destSlot;
    } else {
      // Move to empty slot
      userParticipant.slotNumber = destSlot;
    }

    await tournament.save();

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.emit('slotsSwapped', {
        tournamentId: id,
        sourceSlot,
        destSlot,
        userId
      });
    }

    res.json({
      success: true,
      message: 'Slot position updated successfully'
    });

  } catch (error) {
    console.error('Error swapping slots:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to swap slots'
    });
  }
});

// Leave tournament
router.post('/:id/leave', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Find and remove participant
    const participantIndex = tournament.participants.findIndex(p => 
      p.user.toString() === userId.toString()
    );

    if (participantIndex === -1) {
      return res.status(400).json({
        success: false,
        error: 'You are not registered for this tournament'
      });
    }

    const participant = tournament.participants[participantIndex];
    tournament.participants.splice(participantIndex, 1);
    tournament.currentParticipants = Math.max(0, tournament.currentParticipants - 1);

    await tournament.save();

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) {
      io.emit('participantLeft', {
        tournamentId: id,
        userId,
        username: req.user.username,
        slotNumber: participant.slotNumber
      });
    }

    res.json({
      success: true,
      message: 'Successfully left the tournament'
    });

  } catch (error) {
    console.error('Error leaving tournament:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to leave tournament'
    });
  }
});

// Update tournament status (Admin only)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['draft', 'upcoming', 'live', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }

    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    tournament.status = status;
    await tournament.save();

    res.json({
      success: true,
      message: `Tournament status updated to ${status}`,
      data: tournament
    });
  } catch (error) {
    console.error('Error updating tournament status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update tournament status'
    });
  }
});

// Release room credentials (Admin only)
router.post('/:id/release-credentials', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Generate new room credentials
    const roomCredentials = {
      roomId: `ROOM${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      password: `PASS${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      releasedAt: new Date()
    };

    tournament.roomDetails = roomCredentials;
    await tournament.save();

    res.json({
      success: true,
      message: 'Room credentials released successfully',
      data: {
        tournamentId: id,
        roomCredentials: roomCredentials
      }
    });
  } catch (error) {
    console.error('Error releasing room credentials:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to release room credentials'
    });
  }
});

module.exports = router;
