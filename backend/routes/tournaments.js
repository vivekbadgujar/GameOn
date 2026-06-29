/**
 * Tournament Routes for GameOn Platform
 * Handles tournament listing, joining, and management
 */

const express = require('express');
const Tournament = require('../models/Tournament');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { validateTournamentParticipation } = require('../middleware/tournamentParticipationValidation');
const router = express.Router();

// Get user's tournaments (for mobile sync)
router.get('/my-tournaments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log('Fetching tournaments for user:', userId.toString());
    
    // Find tournaments where user is a participant
    const tournaments = await Tournament.find({
      'participants.user': userId,
      status: { $in: ['upcoming', 'registration_open', 'registration_closed', 'live'] }
    })
    .populate('participants.user', 'username displayName gameProfile.bgmiId')
    .sort({ startDate: -1 })
    .lean();

    console.log('Found tournaments for user:', tournaments.length);

    // Transform data and add user's slot information
    const transformedTournaments = tournaments.map(tournament => {
      const userParticipant = tournament.participants.find(p => 
        p.user._id.toString() === userId.toString()
      );

      // Normalize roomDetails — credentialsReleased is true whenever roomId AND password exist
      const rawRoom = tournament.roomDetails || {};
      const hasRoomId = !!(rawRoom.roomId && rawRoom.roomId.trim());
      const hasPassword = !!(rawRoom.password && rawRoom.password.trim());
      const normalizedRoomDetails = {
        roomId: rawRoom.roomId || '',
        password: rawRoom.password || '',
        credentialsReleased: rawRoom.credentialsReleased || (hasRoomId && hasPassword),
        manualRelease: rawRoom.manualRelease || false,
        releaseTime: rawRoom.releaseTime || null
      };

      return {
        _id: tournament._id,
        title: tournament.title,
        description: tournament.description,
        status: tournament.status,
        game: tournament.game,
        tournamentType: tournament.tournamentType,
        maxParticipants: tournament.maxParticipants,
        currentParticipants: tournament.currentParticipants,
        entryFee: tournament.entryFee,
        prizePool: tournament.prizePool,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        userSlot: userParticipant?.slotNumber || null,
        joinedAt: userParticipant?.joinedAt || null,
        paymentStatus: userParticipant?.paymentData ? 'completed' : 'pending',
        roomDetails: normalizedRoomDetails,
        createdAt: tournament.createdAt
      };
    });

    res.json({
      success: true,
      data: transformedTournaments,
      message: 'User tournaments fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching user tournaments:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch user tournaments'
    });
  }
});

// Get all tournaments
router.get('/', async (req, res) => {
  try {
    console.log('Public tournaments route - Query params:', req.query);
    
    // Extract and validate query parameters
    const { status, game, type, limit } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Handle status parameter (map frontend categories to strict lifecycle)
    if (status && typeof status === 'string') {
      if (status === 'upcoming') {
        filter.status = { $in: ['upcoming', 'registration_open', 'registration_closed'] };
      } else if (status === 'completed') {
        filter.status = { $in: ['completed', 'archived'] };
      } else {
        filter.status = status;
      }
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
      thumbnail: tournament.thumbnail || tournament.poster || tournament.posterUrl || '',
      poster: tournament.thumbnail || tournament.poster || '',
      posterUrl: tournament.thumbnail || tournament.posterUrl || '',
      upiId: tournament.upiId || '',
      qrCode: tournament.qrCode || tournament.upiQrImage || '',
      upiQrImage: tournament.qrCode || tournament.upiQrImage || '',
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

// Check user participation status
router.get('/:id/participation-status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the tournament
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Check if user has joined
    const participation = tournament.participants.find(p => 
      p.user.toString() === userId.toString()
    );

    // Check for any payments
    const Payment = require('../models/Payment');
    const payments = await Payment.find({
      user: userId,
      tournament: id
    }).sort({ createdAt: -1 });

    // Determine payment status
    let paymentStatus = 'none';
    if (participation) {
      // First check the participation record's payment status
      paymentStatus = participation.paymentStatus || 'pending';
      
      // Then check if there are any completed transactions
      if (payments.length > 0) {
        const latestPayment = payments[0];
        if (latestPayment.status === 'completed') {
          paymentStatus = 'completed';
        } else if (latestPayment.status === 'pending') {
          paymentStatus = 'pending';
        }
      }
    }

    res.json({
      success: true,
      data: {
        hasJoined: !!participation,
        participation: participation || null,
        payments: payments,
        paymentStatus: paymentStatus,
        canJoin: !participation && ['upcoming', 'registration_open'].includes(tournament.status) && 
                tournament.currentParticipants < tournament.maxParticipants
      }
    });
  } catch (error) {
    console.error('Error checking participation status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check participation status'
    });
  }
});

// Get tournament by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Tournament Details Request:', {
      id,
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin,
      referer: req.headers.referer
    });
    
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
    // Normalize roomDetails — credentialsReleased is true whenever roomId AND password are set
    const rawRoom = tournament.roomDetails || {};
    const hasRoomId = !!(rawRoom.roomId && rawRoom.roomId.trim());
    const hasPassword = !!(rawRoom.password && rawRoom.password.trim());
    const normalizedRoomDetails = {
      roomId: rawRoom.roomId || '',
      password: rawRoom.password || '',
      credentialsReleased: rawRoom.credentialsReleased || (hasRoomId && hasPassword),
      manualRelease: rawRoom.manualRelease || false,
      releaseTime: rawRoom.releaseTime || null,
      releasedAt: rawRoom.releasedAt || null
    };

    const transformedTournament = {
      _id: tournament._id,
      title: tournament.title,
      name: tournament.title, // Add name field for compatibility
      description: tournament.description,
      status: tournament.status,
      game: tournament.game,
      map: tournament.map || 'TBD',
      teamType: tournament.tournamentType,
      tournamentType: tournament.tournamentType, // Add for compatibility
      maxParticipants: tournament.maxParticipants,
      currentParticipants: tournament.currentParticipants,
      participants: tournament.participants || [],
      winners: tournament.winners || [],
      entryFee: tournament.entryFee,
      prizePool: tournament.prizePool,
      startDate: tournament.startDate, // Add for compatibility
      scheduledAt: tournament.startDate,
      endDate: tournament.endDate,
      rules: Array.isArray(tournament.rules) ? tournament.rules.join('\n') : tournament.rules,
      roomDetails: normalizedRoomDetails,
      thumbnail: tournament.thumbnail || tournament.poster || tournament.posterUrl || '',
      poster: tournament.thumbnail || tournament.poster || '',
      posterUrl: tournament.thumbnail || tournament.posterUrl || '',
      upiId: tournament.upiId || '',
      qrCode: tournament.qrCode || tournament.upiQrImage || '',
      upiQrImage: tournament.qrCode || tournament.upiQrImage || '',
      prizeDistribution: tournament.prizeDistribution || [],
      slotLock: tournament.slotLock || {},
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
      userIdString: req.user._id.toString(),
      paymentData: paymentData ? 'provided' : 'none'
    });
    
    // Find the tournament
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      console.log('Tournament not found with ID:', id);
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    console.log('Tournament found:', {
      id: tournament._id,
      title: tournament.title,
      status: tournament.status,
      currentParticipants: tournament.currentParticipants,
      maxParticipants: tournament.maxParticipants,
      participantsCount: tournament.participants?.length || 0
    });

    // Check if tournament is still accepting participants
    if (tournament.status === 'completed' || tournament.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Tournament is no longer accepting participants'
      });
    }

    // Paid tournaments must be processed via manual payment workflow.  Users
    // cannot directly hit this endpoint for entry – an admin will add them
    // after payment verification.  This keeps the old auto-join logic safe
    // for free tournaments only.
    if (tournament.entryFee && tournament.entryFee > 0) {
      return res.status(403).json({
        success: false,
        error: 'Please complete manual payment and wait for admin approval before joining.'
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

    // Duplicate participation check
    const existingParticipation = tournament.getUserParticipation(userId);
    if (existingParticipation) {
      return res.status(400).json({
        success: false,
        error: 'You have already joined this tournament',
        code: 'ALREADY_JOINED'
      });
    }

    // Generate unique slot number
    const slotNumber = tournament.currentParticipants + 1;

    // Add participant to tournament
    tournament.participants.push({
      user: userId,
      joinedAt: new Date(),
      slotNumber: slotNumber,
      paymentStatus: 'completed',
      paymentData: paymentData || { method: 'free' }
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

    // Auto-assign player to room slot after successful payment
    try {
      // Use internal API URL - in production this should be the same server
      const apiBaseUrl = process.env.API_URL || process.env.BASE_URL || 'https://api.gameonesport.xyz/api';
      const roomSlotResponse = await fetch(`${apiBaseUrl}/room-slots/tournament/${id}/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${req.headers.authorization?.split(' ')[1]}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (roomSlotResponse.ok) {
        console.log('Player auto-assigned to room slot successfully');
      } else {
        console.log('Failed to auto-assign player to room slot, will be assigned when they visit lobby');
      }
    } catch (error) {
      console.log('Error auto-assigning to room slot:', error.message);
    }

    // Enhanced real-time sync for unified platform
    const syncService = req.app.get('syncService');
    const pushService = req.app.get('pushNotificationService');
    
    if (syncService) {
      // Sync tournament update across all platforms
      syncService.syncTournamentUpdate(id, 'tournament_joined', {
        tournamentId: id,
        title: tournament.title,
        currentParticipants: tournament.currentParticipants,
        maxParticipants: tournament.maxParticipants,
        participants: tournament.participants,
        userJoined: {
          userId: userId.toString(),
          slotNumber: slotNumber,
          joinedAt: new Date().toISOString()
        }
      });

      // Sync user update for the joining user
      syncService.syncUserUpdate(userId.toString(), 'tournament_joined', {
        tournamentId: id,
        tournamentTitle: tournament.title,
        slotNumber: slotNumber,
        roomCredentials: tournament.roomDetails
      });
    }

    // Send push notification to user
    if (pushService) {
      await pushService.sendTournamentNotification(
        id,
        [userId.toString()],
        'tournament_joined',
        {
          tournamentTitle: tournament.title,
          slotNumber: slotNumber,
          startTime: tournament.startDate
        }
      );
    }

    // Legacy socket events for backward compatibility
    const io = req.app.get('io');
    if (io) {
      io.emit('tournamentUpdated', {
        _id: tournament._id,
        currentParticipants: tournament.currentParticipants,
        participants: tournament.participants
      });
      
      io.to(`user_${userId}`).emit('tournamentJoined', {
        tournamentId: id,
        slotNumber: slotNumber,
        tournament: tournament
      });
    }

    res.json({
      success: true,
      message: 'Successfully joined tournament',
      data: { 
        tournamentId: id,
        slotNumber: slotNumber,
        participantCount: tournament.currentParticipants,
        roomCredentials: tournament.roomDetails,
        roomLobbyUrl: `/tournament/${id}/room-lobby`
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
    if (!['upcoming', 'registration_open'].includes(tournament.status)) {
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

// Get user's tournaments (My Tournaments)
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
      credentialsReleased: true,
      releasedAt: new Date()
    };

    tournament.roomDetails = roomCredentials;
    await tournament.save();

    // Emit real-time update to all participants
    const io = req.app.get('io');
    if (io) {
      io.to(`tournament_${id}`).emit('roomCredentialsReleased', {
        tournamentId: id,
        roomCredentials: {
          roomId: roomCredentials.roomId,
          password: roomCredentials.password
        }
      });
    }

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

// Get user's tournaments (joined tournaments)
// Get tournament results
router.get('/:id/results', async (req, res) => {
  try {
    const { id } = req.params;
    
    const tournament = await Tournament.findById(id)
      .populate('winners.user', 'username displayName avatar email gameProfile')
      .populate('participants.user', 'username displayName avatar email gameProfile')
      .lean();

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    if (tournament.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Results are only available for completed tournaments'
      });
    }

    // Prepare match summary
    const totalPrizeDistributed = tournament.winners?.reduce((sum, w) => sum + (w.prize || 0), 0) || 0;
    const totalKills = tournament.participants?.reduce((sum, p) => sum + (p.kills || 0), 0) || 0;
    const uniqueTeams = new Set(tournament.participants?.map(p => p.teamNumber).filter(Boolean)).size || 0;

    const resultsData = {
      winners: tournament.winners || [],
      participants: tournament.participants?.map(p => ({
        user: p.user,
        rank: p.rank,
        kills: p.kills,
        points: p.points || (p.kills || 0) * 10,
        teamNumber: p.teamNumber,
        slotNumber: p.slotNumber
      })) || [],
      matchSummary: {
        totalKills,
        totalTeams: uniqueTeams,
        totalPrizeDistributed,
        matchDuration: '~30-45 mins'
      }
    };

    res.json({
      success: true,
      data: resultsData
    });

  } catch (error) {
    console.error('Error fetching tournament results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tournament results'
    });
  }
});

module.exports = router;
