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
    
    // Find tournaments where user is a participant
    const tournaments = await Tournament.find({
      'participants.user': userId
    })
    .populate('participants.user', 'username displayName gameProfile.bgmiId')
    .sort({ startDate: -1 });
    
    res.json({
      success: true,
      tournaments,
      count: tournaments.length,
      message: 'User tournaments fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching user tournaments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user tournaments',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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
    const Transaction = require('../models/Transaction');
    const payments = await Transaction.find({
      user: userId,
      tournament: id,
      type: 'tournament_entry'
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
        canJoin: !participation && tournament.status === 'upcoming' && 
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

    // Check if tournament is full
    if (tournament.currentParticipants >= tournament.maxParticipants) {
      return res.status(400).json({
        success: false,
        error: 'Tournament is full'
      });
    }

    // Get user ID from authenticated user
    const userId = req.user._id;

    // Enhanced duplicate participation check using model method
    const existingParticipation = tournament.getUserParticipation(userId);
    if (existingParticipation) {
      return res.status(400).json({
        success: false,
        error: 'You have already joined this tournament',
        code: 'ALREADY_JOINED',
        data: {
          joinedAt: existingParticipation.joinedAt,
          slotNumber: existingParticipation.slotNumber,
          paymentStatus: existingParticipation.paymentStatus || 'pending'
        }
      });
    }

    // Check for duplicate payment attempts with more detailed validation
    const Transaction = require('../models/Transaction');
    const existingPayments = await Transaction.find({
      user: userId,
      tournament: id,
      type: 'tournament_entry'
    }).sort({ createdAt: -1 });

    // Check for pending payments
    const pendingPayment = existingPayments.find(p => p.status === 'pending');
    if (pendingPayment) {
      return res.status(400).json({
        success: false,
        error: 'You have a pending payment for this tournament. Please complete or cancel it first.',
        code: 'PAYMENT_PENDING',
        data: {
          paymentId: pendingPayment.razorpayPaymentId,
          orderId: pendingPayment.razorpayOrderId,
          amount: pendingPayment.amount,
          createdAt: pendingPayment.createdAt
        }
      });
    }

    // Check for completed payments
    const completedPayment = existingPayments.find(p => p.status === 'completed');
    if (completedPayment) {
      return res.status(400).json({
        success: false,
        error: 'You have already paid for this tournament',
        code: 'PAYMENT_COMPLETED',
        data: {
          paymentId: completedPayment.razorpayPaymentId,
          amount: completedPayment.amount,
          completedAt: completedPayment.updatedAt
        }
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

// Get user's tournaments (My Tournaments)
router.get('/my-tournaments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log('Fetching tournaments for user:', userId.toString());
    
    // Find tournaments where user is a participant
    const tournaments = await Tournament.find({
      'participants.user': userId
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
        roomDetails: tournament.roomDetails,
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
router.get('/my-tournaments', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Find tournaments where user is a participant
    const tournaments = await Tournament.find({
      'participants.user': userId
    })
    .populate('participants.user', 'username displayName gameProfile.bgmiId')
    .sort({ startDate: -1 })
    .lean();

    // Transform data and add user-specific information
    const userTournaments = tournaments.map(tournament => {
      const userParticipation = tournament.participants.find(p => 
        p.user._id.toString() === userId.toString()
      );

      return {
        _id: tournament._id,
        title: tournament.title,
        description: tournament.description,
        status: tournament.status,
        game: tournament.game,
        map: tournament.map || 'TBD',
        tournamentType: tournament.tournamentType,
        maxParticipants: tournament.maxParticipants,
        currentParticipants: tournament.currentParticipants,
        entryFee: tournament.entryFee,
        prizePool: tournament.prizePool,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        createdAt: tournament.createdAt,
        userSlot: userParticipation?.slotNumber,
        joinedAt: userParticipation?.joinedAt,
        paymentStatus: userParticipation?.paymentData ? 'completed' : 'pending'
      };
    });

    res.json({
      success: true,
      data: userTournaments,
      message: 'User tournaments fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching user tournaments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user tournaments'
    });
  }
});

// Get user's participation status for a tournament
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

    // Check participation
    const participation = tournament.getUserParticipation(userId);
    
    // Get payment history
    const Transaction = require('../models/Transaction');
    const payments = await Transaction.find({
      user: userId,
      tournament: id,
      type: 'tournament_entry'
    }).sort({ createdAt: -1 });

    // Determine if user can join
    const canJoin = !participation && 
                   tournament.status === 'upcoming' && 
                   tournament.currentParticipants < tournament.maxParticipants &&
                   !payments.some(p => p.status === 'pending');

    res.json({
      success: true,
      data: {
        hasJoined: !!participation,
        participation: participation || null,
        payments: payments || [],
        canJoin,
        tournament: {
          id: tournament._id,
          status: tournament.status,
          currentParticipants: tournament.currentParticipants,
          maxParticipants: tournament.maxParticipants
        }
      }
    });
  } catch (error) {
    console.error('Error fetching participation status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch participation status'
    });
  }
});

// Move player to different slot
router.post('/:id/move-slot', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { teamNumber, slotNumber } = req.body;
    const userId = req.user._id;

    console.log('Move slot request:', {
      tournamentId: id,
      userId: userId.toString(),
      teamNumber,
      slotNumber
    });

    // Validate input
    if (!teamNumber || !slotNumber) {
      return res.status(400).json({
        success: false,
        error: 'Team number and slot number are required'
      });
    }

    if (teamNumber < 1 || teamNumber > 25 || slotNumber < 1 || slotNumber > 4) {
      return res.status(400).json({
        success: false,
        error: 'Invalid team or slot number'
      });
    }

    // Find the tournament
    const tournament = await Tournament.findById(id);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Check if user is a participant
    const userParticipation = tournament.participants.find(p => 
      p.user.toString() === userId.toString()
    );

    if (!userParticipation) {
      return res.status(403).json({
        success: false,
        error: 'You are not a participant in this tournament'
      });
    }

    // Check if the target slot is already occupied by another player
    const targetSlotOccupied = tournament.participants.find(p => 
      p.user.toString() !== userId.toString() &&
      p.teamNumber === teamNumber && 
      p.slotNumber === slotNumber
    );

    if (targetSlotOccupied) {
      return res.status(400).json({
        success: false,
        error: 'This slot is already occupied by another player'
      });
    }

    // Update user's slot
    userParticipation.teamNumber = teamNumber;
    userParticipation.slotNumber = slotNumber;
    userParticipation.slotUpdatedAt = new Date();

    // Save tournament
    await tournament.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`tournament_${id}`).emit('slot_updated', {
        tournamentId: id,
        teamNumber,
        slotNumber,
        player: {
          _id: userId,
          username: req.user.username || req.user.displayName,
          avatar: req.user.avatar
        }
      });
    }

    res.json({
      success: true,
      message: 'Slot updated successfully',
      data: {
        teamNumber,
        slotNumber,
        updatedAt: userParticipation.slotUpdatedAt
      }
    });

  } catch (error) {
    console.error('Error moving slot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to move slot'
    });
  }
});

// Get tournament room state
router.get('/:id/room-state', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const tournament = await Tournament.findById(id)
      .populate('participants.user', 'username displayName avatar gameProfile.bgmiId')
      .lean();

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Check if user is a participant
    const userParticipation = tournament.participants.find(p => 
      p.user._id.toString() === userId.toString()
    );

    if (!userParticipation) {
      return res.status(403).json({
        success: false,
        error: 'You are not a participant in this tournament'
      });
    }

    res.json({
      success: true,
      data: {
        tournament: {
          _id: tournament._id,
          title: tournament.title,
          status: tournament.status,
          roomDetails: tournament.roomDetails
        },
        participants: tournament.participants.map(p => ({
          user: {
            _id: p.user._id,
            username: p.user.username || p.user.displayName,
            avatar: p.user.avatar
          },
          teamNumber: p.teamNumber,
          slotNumber: p.slotNumber,
          joinedAt: p.joinedAt
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching room state:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch room state'
    });
  }
});

// Get tournament results
router.get('/:id/results', async (req, res) => {
  try {
    const { id } = req.params;
    
    const tournament = await Tournament.findById(id)
      .populate('participants.user', 'username displayName gameProfile.bgmiName gameProfile.bgmiId avatar')
      .populate('winners.user', 'username displayName gameProfile.bgmiName gameProfile.bgmiId avatar')
      .lean();

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Only show results if tournament is completed
    if (tournament.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Tournament results not available yet'
      });
    }

    // Calculate match summary
    const matchSummary = {
      totalKills: tournament.participants.reduce((sum, p) => sum + (p.kills || 0), 0),
      totalTeams: Math.ceil(tournament.participants.length / (tournament.tournamentType === 'solo' ? 1 : tournament.tournamentType === 'duo' ? 2 : 4)),
      totalPrizeDistributed: tournament.winners.reduce((sum, w) => sum + (w.prize || 0), 0),
      matchDuration: tournament.endDate && tournament.startDate 
        ? Math.round((new Date(tournament.endDate) - new Date(tournament.startDate)) / (1000 * 60)) + ' minutes'
        : 'N/A'
    };

    const results = {
      tournament: {
        _id: tournament._id,
        title: tournament.title,
        status: tournament.status,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        prizePool: tournament.prizePool
      },
      winners: tournament.winners || [],
      participants: tournament.participants || [],
      matchSummary
    };

    res.json({
      success: true,
      data: results,
      message: 'Tournament results fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching tournament results:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tournament results'
    });
  }
});

// Get room layout for a tournament (BGMI-style)
router.get('/:id/room-layout', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    console.log('Room layout request:', { tournamentId: id, userId: userId.toString() });
    
    // Find the tournament
    const tournament = await Tournament.findById(id)
      .populate('participants.user', 'username displayName gameProfile.bgmiName gameProfile.bgmiId');
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }
    
    // Check if user is a participant
    const isParticipant = tournament.participants.some(p => 
      p.user._id.toString() === userId.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: 'You need to join this tournament first to access the room layout'
      });
    }
    
    // Create BGMI-style room layout
    const maxPlayersPerTeam = tournament.tournamentType === 'solo' ? 1 : 
                             tournament.tournamentType === 'duo' ? 2 : 4;
    const maxTeams = Math.ceil(tournament.maxParticipants / maxPlayersPerTeam);
    
    // Initialize teams
    const teams = [];
    for (let i = 1; i <= maxTeams; i++) {
      const team = {
        teamNumber: i,
        teamName: `Team ${i}`,
        slots: [],
        isComplete: false
      };
      
      for (let j = 1; j <= maxPlayersPerTeam; j++) {
        team.slots.push({
          slotNumber: j,
          player: null
        });
      }
      
      teams.push(team);
    }
    
    // Assign participants to their actual slot positions
    tournament.participants.forEach((participant, index) => {
      let teamNumber = participant.teamNumber;
      let slotNumber = participant.slotNumber;
      
      // If participant doesn't have assigned slot, auto-assign them
      if (!teamNumber || !slotNumber) {
        // Find the first available slot
        let assigned = false;
        for (let t = 0; t < teams.length && !assigned; t++) {
          for (let s = 0; s < teams[t].slots.length && !assigned; s++) {
            if (!teams[t].slots[s].player) {
              teamNumber = teams[t].teamNumber;
              slotNumber = teams[t].slots[s].slotNumber;
              
              // Update the participant's slot assignment in the database
              participant.teamNumber = teamNumber;
              participant.slotNumber = slotNumber;
              assigned = true;
            }
          }
        }
      }
      
      // Place the participant in their assigned slot
      if (teamNumber && slotNumber) {
        const targetTeam = teams.find(t => t.teamNumber === teamNumber);
        if (targetTeam) {
          const targetSlot = targetTeam.slots.find(s => s.slotNumber === slotNumber);
          if (targetSlot && !targetSlot.player) {
            targetSlot.player = {
              _id: participant.user._id,
              username: participant.user.username,
              displayName: participant.user.displayName,
              gameProfile: participant.user.gameProfile,
              hasEditedSlot: participant.hasEditedSlot || false,
              slotUpdatedAt: participant.slotUpdatedAt
            };
          }
        }
      }
    });
    
    // Save any auto-assignments made
    if (tournament.participants.some(p => p.isModified && p.isModified())) {
      await tournament.save();
    }
    
    // Update team completion status
    teams.forEach(team => {
      team.isComplete = team.slots.every(slot => slot.player !== null);
    });
    
    // Find user's current slot
    let userSlot = null;
    teams.forEach((team, teamIndex) => {
      team.slots.forEach((slot, slotIndex) => {
        if (slot.player && slot.player._id.toString() === userId.toString()) {
          userSlot = {
            teamNumber: team.teamNumber,
            slotNumber: slot.slotNumber,
            teamIndex,
            slotIndex
          };
        }
      });
    });
    
    res.json({
      success: true,
      data: {
        tournament: {
          _id: tournament._id,
          title: tournament.title,
          status: tournament.status,
          tournamentType: tournament.tournamentType,
          maxParticipants: tournament.maxParticipants,
          currentParticipants: tournament.currentParticipants,
          startDate: tournament.startDate
        },
        teams,
        userSlot,
        settings: {
          canEditSlots: tournament.status === 'upcoming' || tournament.status === 'live',
          maxPlayersPerTeam,
          maxTeams
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching room layout:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch room layout'
    });
  }
});

// Move player to different slot
router.post('/:id/move-slot', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { toTeam, toSlot } = req.body;
    const userId = req.user._id;
    
    console.log('Move slot request:', { tournamentId: id, userId: userId.toString(), toTeam, toSlot });
    
    // Validate input parameters
    if (!toTeam || !toSlot || toTeam < 1 || toSlot < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid team or slot number'
      });
    }
    
    // Find the tournament with populated participants
    const tournament = await Tournament.findById(id)
      .populate('participants.user', 'username displayName gameProfile.bgmiName gameProfile.bgmiId');
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }
    
    // Check if user is a participant
    const userParticipant = tournament.participants.find(p => 
      p.user._id.toString() === userId.toString()
    );
    
    if (!userParticipant) {
      return res.status(403).json({
        success: false,
        error: 'You are not a participant in this tournament'
      });
    }
    
    // Check if tournament allows slot changes
    if (tournament.status !== 'upcoming' && tournament.status !== 'live') {
      return res.status(400).json({
        success: false,
        error: 'Slot changes are not allowed for this tournament status'
      });
    }
    
    // Check if slots are locked (10 minutes before tournament start)
    const now = new Date();
    const startTime = new Date(tournament.startDate);
    const lockTime = new Date(startTime.getTime() - 10 * 60 * 1000); // 10 minutes before start
    
    if (now >= lockTime) {
      return res.status(400).json({
        success: false,
        error: 'Slots are locked. Changes not allowed within 10 minutes of tournament start.'
      });
    }
    
    // Validate team and slot numbers based on tournament type
    const maxPlayersPerTeam = tournament.tournamentType === 'solo' ? 1 : 
                             tournament.tournamentType === 'duo' ? 2 : 4;
    const maxTeams = Math.ceil(tournament.maxParticipants / maxPlayersPerTeam);
    
    if (toTeam > maxTeams) {
      return res.status(400).json({
        success: false,
        error: `Invalid team number. Maximum teams: ${maxTeams}`
      });
    }
    
    if (toSlot > maxPlayersPerTeam) {
      return res.status(400).json({
        success: false,
        error: `Invalid slot number. Maximum slots per team: ${maxPlayersPerTeam}`
      });
    }
    
    // Check if the target slot is already occupied by another player
    const targetSlotOccupied = tournament.participants.find(p => 
      p.user._id.toString() !== userId.toString() && 
      p.teamNumber === toTeam && 
      p.slotNumber === toSlot
    );
    
    if (targetSlotOccupied) {
      return res.status(400).json({
        success: false,
        error: 'This slot is already taken by another player'
      });
    }
    
    // Store the user's previous position for logging
    const previousTeam = userParticipant.teamNumber;
    const previousSlot = userParticipant.slotNumber;
    
    // Update the user's slot position
    userParticipant.teamNumber = toTeam;
    userParticipant.slotNumber = toSlot;
    userParticipant.hasEditedSlot = true;
    userParticipant.slotUpdatedAt = new Date();
    
    // Save the tournament with updated slot information
    await tournament.save();
    
    console.log('Slot move completed:', {
      userId: userId.toString(),
      username: userParticipant.user.username,
      from: { team: previousTeam, slot: previousSlot },
      to: { team: toTeam, slot: toSlot }
    });
    
    // Emit socket event for real-time updates (if socket is available)
    if (req.app.get('io')) {
      req.app.get('io').to(`tournament_${id}`).emit('slotChanged', {
        tournamentId: id,
        playerId: userId.toString(),
        username: userParticipant.user.username,
        fromTeam: previousTeam,
        fromSlot: previousSlot,
        toTeam: toTeam,
        toSlot: toSlot,
        playerSlot: {
          teamNumber: toTeam,
          slotNumber: toSlot
        }
      });
    }
    
    res.json({
      success: true,
      message: `Successfully moved to Team ${toTeam}, Slot ${toSlot}`,
      data: {
        newPosition: {
          teamNumber: toTeam,
          slotNumber: toSlot
        },
        previousPosition: {
          teamNumber: previousTeam,
          slotNumber: previousSlot
        },
        updatedAt: userParticipant.slotUpdatedAt
      }
    });
    
  } catch (error) {
    console.error('Error moving slot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to move slot'
    });
  }
});

module.exports = router;
