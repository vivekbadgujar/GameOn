/**
 * Room Slot Management Routes
 * Handles BGMI-style room layout and slot assignments
 */

const express = require('express');
const RoomSlot = require('../models/RoomSlot');
const Tournament = require('../models/Tournament');
const { authenticateToken } = require('../middleware/auth');
const { 
  requireTournamentParticipation, 
  validateSlotEditPermissions 
} = require('../middleware/tournamentParticipationValidation');
const router = express.Router();

// Test endpoint to verify API is working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Room slots API is working',
    timestamp: new Date().toISOString()
  });
});

// Get room layout for a tournament
router.get('/tournament/:tournamentId', authenticateToken, requireTournamentParticipation, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    
    // Check if user is participant in the tournament
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }
    
    const isParticipant = tournament.participants.some(p => 
      p.user.toString() === req.user._id.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: 'You are not a participant in this tournament'
      });
    }
    
    // Get or create room slot layout
    let roomSlot = await RoomSlot.findOne({ tournament: tournamentId })
      .populate('teams.slots.player', 'username displayName gameProfile.bgmiName gameProfile.bgmiId avatar')
      .populate('teams.captain', 'username displayName gameProfile.bgmiName');
    
    if (!roomSlot) {
      // Create room slot layout if it doesn't exist
      roomSlot = await RoomSlot.createForTournament(
        tournamentId,
        tournament.tournamentType,
        tournament.maxParticipants
      );
      
      // Auto-assign existing participants
      for (const participant of tournament.participants) {
        try {
          roomSlot.autoAssignPlayer(participant.user);
        } catch (error) {
          console.log(`Could not auto-assign player ${participant.user}:`, error.message);
        }
      }
      
      await roomSlot.save();
      
      // Populate after save
      roomSlot = await RoomSlot.findById(roomSlot._id)
        .populate('teams.slots.player', 'username displayName gameProfile.bgmiName gameProfile.bgmiId avatar')
        .populate('teams.captain', 'username displayName gameProfile.bgmiName');
    }
    
    // Get current player's slot info
    const playerSlot = roomSlot.getPlayerSlot(req.user._id);
    
    res.json({
      success: true,
      data: {
        roomSlot,
        playerSlot,
        tournament: {
          _id: tournament._id,
          title: tournament.title,
          tournamentType: tournament.tournamentType,
          status: tournament.status,
          startDate: tournament.startDate,
          roomDetails: tournament.roomDetails
        }
      }
    });
  } catch (error) {
    console.error('Error fetching room layout:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch room layout'
    });
  }
});

// Move player to a different slot
router.post('/tournament/:tournamentId/move', [
  authenticateToken,
  validateSlotEditPermissions
], async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const playerId = req.user._id;
    const payload = req.body || {};
    const requestedPlayerId = payload.playerId;
    const requestedTournamentId = payload.tournamentId;
    const requestedFromSlot = payload.fromSlot || null;
    const toTeam = Number(payload.toTeam ?? payload.toSlot?.teamNumber);
    const toSlot = Number(
      typeof payload.toSlot === 'object' ? payload.toSlot?.slotNumber : payload.toSlot
    );
    const validationContext = {
      tournamentId,
      authPlayerId: playerId.toString(),
      requestedPlayerId,
      requestedTournamentId,
      requestedFromSlot,
      requestedToSlot: payload.toSlot,
      requestedToTeam: payload.toTeam
    };

    if (requestedTournamentId && requestedTournamentId.toString() !== tournamentId.toString()) {
      console.warn('Slot move rejected: tournamentId mismatch', validationContext);
      return res.status(400).json({
        success: false,
        error: 'Tournament ID mismatch',
        details: {
          expectedTournamentId: tournamentId,
          receivedTournamentId: requestedTournamentId
        }
      });
    }

    if (requestedPlayerId && requestedPlayerId.toString() !== playerId.toString()) {
      console.warn('Slot move rejected: playerId mismatch', validationContext);
      return res.status(400).json({
        success: false,
        error: 'Player ID mismatch',
        details: {
          authenticatedPlayerId: playerId.toString(),
          receivedPlayerId: requestedPlayerId
        }
      });
    }

    if (!Number.isInteger(toTeam) || toTeam < 1) {
      console.warn('Slot move rejected: invalid destination team', validationContext);
      return res.status(400).json({
        success: false,
        error: 'Valid destination team is required',
        details: {
          toSlot: payload.toSlot,
          toTeam: payload.toTeam
        }
      });
    }

    if (!Number.isInteger(toSlot) || toSlot < 1 || toSlot > 4) {
      console.warn('Slot move rejected: invalid destination slot', validationContext);
      return res.status(400).json({
        success: false,
        error: 'Valid destination slot is required',
        details: {
          toSlot: payload.toSlot
        }
      });
    }
    
    console.log('Player slot move request:', {
      tournamentId,
      playerId: playerId.toString(),
      requestedPlayerId,
      requestedTournamentId,
      requestedFromSlot,
      toTeam,
      toSlot
    });
    
    // Get room slot layout
    const roomSlot = await RoomSlot.findOne({ tournament: tournamentId });
    if (!roomSlot) {
      return res.status(404).json({
        success: false,
        error: 'Room layout not found'
      });
    }
    
    // Check if slot changes are allowed
    if (!roomSlot.settings.allowSlotChange) {
      return res.status(403).json({
        success: false,
        error: 'Slot changes are not allowed'
      });
    }

    // Admin explicit lock: lock the entire room layout.
    if (roomSlot.isLocked) {
      return res.status(403).json({
        success: false,
        error: 'Slots are locked!'
      });
    }

    // Optional deadline-based lock (admin-controlled)
    const now = new Date();
    if (roomSlot.settings.slotChangeDeadline && now > roomSlot.settings.slotChangeDeadline) {
      return res.status(403).json({
        success: false,
        error: 'Slot change deadline has passed'
      });
    }
    
    // Get current player slot
    const currentSlot = roomSlot.getPlayerSlot(playerId);
    if (!currentSlot) {
      console.warn('Slot move rejected: player not assigned', validationContext);
      return res.status(400).json({
        success: false,
        error: 'Player not found in any slot'
      });
    }

    if (
      requestedFromSlot &&
      (
        Number(requestedFromSlot.teamNumber) !== currentSlot.teamNumber ||
        Number(requestedFromSlot.slotNumber) !== currentSlot.slotNumber
      )
    ) {
      console.warn('Slot move rejected: fromSlot mismatch', {
        ...validationContext,
        actualFromSlot: currentSlot
      });
      return res.status(400).json({
        success: false,
        error: 'Current slot does not match request payload',
        details: {
          expectedFromSlot: {
            teamNumber: currentSlot.teamNumber,
            slotNumber: currentSlot.slotNumber
          },
          receivedFromSlot: requestedFromSlot
        }
      });
    }
    
    // Check if trying to move to same slot
    if (currentSlot.teamNumber === toTeam && currentSlot.slotNumber === toSlot) {
      return res.status(400).json({
        success: false,
        error: 'Player is already in this slot'
      });
    }
    
    // Check if destination slot is temporarily locked (to prevent simultaneous moves)
    const destTeam = roomSlot.teams.find(t => t.teamNumber === toTeam);
    const destSlot = destTeam?.slots.find(s => s.slotNumber === toSlot);
    
    if (destSlot?.isLocked && destSlot.lockedAt && 
        (now - destSlot.lockedAt) < 5000) { // 5 second temporary lock
      return res.status(409).json({
        success: false,
        error: 'Slot is temporarily locked. Please try again.',
        code: 'SLOT_TEMPORARILY_LOCKED'
      });
    }

    // Admin (or persistent) slot lock
    if (destSlot?.isLocked) {
      return res.status(403).json({
        success: false,
        error: 'Slot is locked.'
      });
    }

    // Temporarily lock the destination slot
    if (destSlot) {
      destSlot.isLocked = true;
      destSlot.lockedAt = now;
      destSlot.lockedBy = playerId;
    }

    try {
      // Perform the move
      roomSlot.movePlayer(playerId, currentSlot.teamNumber, currentSlot.slotNumber, toTeam, toSlot);
      
      // Unlock the slot after successful move
      if (destSlot) {
        destSlot.isLocked = false;
        destSlot.lockedAt = null;
        destSlot.lockedBy = null;
      }
      
      await roomSlot.save();
    } catch (moveError) {
      // Unlock the slot if move failed
      if (destSlot) {
        destSlot.isLocked = false;
        destSlot.lockedAt = null;
        destSlot.lockedBy = null;
      }
      throw moveError;
    }
    
    // Populate updated data
    const updatedRoomSlot = await RoomSlot.findById(roomSlot._id)
      .populate('teams.slots.player', 'username displayName gameProfile.bgmiName gameProfile.bgmiId avatar')
      .populate('teams.captain', 'username displayName gameProfile.bgmiName');
    
    const updatedPlayerSlot = updatedRoomSlot.getPlayerSlot(playerId);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      // Emit to tournament room for players
      io.to(`tournament_${tournamentId}`).emit('slotChanged', {
        tournamentId,
        playerId: playerId.toString(),
        fromTeam: currentSlot.teamNumber,
        fromSlot: currentSlot.slotNumber,
        toTeam,
        toSlot,
        roomSlot: updatedRoomSlot,
        playerSlot: updatedPlayerSlot
      });

      // Emit to admin panel for live updates
      io.emit('roomSlotUpdated', {
        tournamentId,
        playerId: playerId.toString(),
        fromTeam: currentSlot.teamNumber,
        fromSlot: currentSlot.slotNumber,
        toTeam,
        toSlot,
        roomSlot: updatedRoomSlot,
        playerSlot: updatedPlayerSlot,
        timestamp: new Date()
      });
    }

    console.log('Slot move saved successfully:', {
      tournamentId,
      playerId: playerId.toString(),
      previousPosition: {
        teamNumber: currentSlot.teamNumber,
        slotNumber: currentSlot.slotNumber
      },
      newPosition: updatedPlayerSlot
    });
    
    res.json({
      success: true,
      message: 'Slot moved successfully',
      data: {
        roomSlot: updatedRoomSlot,
        playerSlot: updatedPlayerSlot,
        previousPosition: {
          teamNumber: currentSlot.teamNumber,
          slotNumber: currentSlot.slotNumber
        },
        newPosition: updatedPlayerSlot
      }
    });
  } catch (error) {
    console.error('Error moving player slot:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
      params: req.params,
      userId: req.user?._id?.toString()
    });

    const knownClientErrors = new Map([
      ['Source team not found', 400],
      ['Player not found in source slot', 400],
      ['Destination team not found', 400],
      ['Destination slot not found', 400],
      ['Destination slot is occupied', 409],
      ['Destination slot is locked', 403]
    ]);
    const statusCode = knownClientErrors.get(error.message) || 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to move player slot',
      message: error.message || 'Failed to move player slot'
    });
  }
});

// Auto-assign player to available slot (called after payment)
router.post('/tournament/:tournamentId/assign', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const playerId = req.user._id;
    
    console.log('Auto-assign player request:', {
      tournamentId,
      playerId: playerId.toString()
    });
    
    // Check if user is participant in the tournament
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }
    
    const isParticipant = tournament.participants.some(p => 
      p.user.toString() === playerId.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: 'You are not a participant in this tournament'
      });
    }
    
    // Get or create room slot layout
    let roomSlot = await RoomSlot.findOne({ tournament: tournamentId });
    if (!roomSlot) {
      roomSlot = await RoomSlot.createForTournament(
        tournamentId,
        tournament.tournamentType,
        tournament.maxParticipants
      );
    }
    
    // Check if player is already assigned
    const existingSlot = roomSlot.getPlayerSlot(playerId);
    if (existingSlot) {
      // Player already has a slot, return current assignment
      const populatedRoomSlot = await RoomSlot.findById(roomSlot._id)
        .populate('teams.slots.player', 'username displayName gameProfile.bgmiName gameProfile.bgmiId avatar')
        .populate('teams.captain', 'username displayName gameProfile.bgmiName');
      
      return res.json({
        success: true,
        message: 'Player already assigned to slot',
        data: {
          roomSlot: populatedRoomSlot,
          playerSlot: existingSlot
        }
      });
    }
    
    // Auto-assign to available slot
    roomSlot.autoAssignPlayer(playerId);
    await roomSlot.save();
    
    // Populate updated data
    const updatedRoomSlot = await RoomSlot.findById(roomSlot._id)
      .populate('teams.slots.player', 'username displayName gameProfile.bgmiName gameProfile.bgmiId avatar')
      .populate('teams.captain', 'username displayName gameProfile.bgmiName');
    
    const playerSlot = updatedRoomSlot.getPlayerSlot(playerId);
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      // Emit to tournament room for players
      io.to(`tournament_${tournamentId}`).emit('playerAssigned', {
        tournamentId,
        playerId: playerId.toString(),
        teamNumber: playerSlot.teamNumber,
        slotNumber: playerSlot.slotNumber,
        roomSlot: updatedRoomSlot
      });

      // Emit to admin panel for live updates
      io.emit('roomSlotUpdated', {
        tournamentId,
        playerId: playerId.toString(),
        action: 'assigned',
        teamNumber: playerSlot.teamNumber,
        slotNumber: playerSlot.slotNumber,
        roomSlot: updatedRoomSlot,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Player assigned to slot successfully',
      data: {
        roomSlot: updatedRoomSlot,
        playerSlot
      }
    });
  } catch (error) {
    console.error('Error auto-assigning player:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to assign player to slot'
    });
  }
});

// Get available slots
router.get('/tournament/:tournamentId/available', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    
    const roomSlot = await RoomSlot.findOne({ tournament: tournamentId });
    if (!roomSlot) {
      return res.status(404).json({
        success: false,
        error: 'Room layout not found'
      });
    }
    
    const availableSlots = roomSlot.availableSlots;
    
    res.json({
      success: true,
      data: {
        availableSlots,
        totalAvailable: availableSlots.length,
        totalSlots: roomSlot.maxTeams * roomSlot.maxPlayersPerTeam,
        totalPlayers: roomSlot.totalPlayers
      }
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch available slots'
    });
  }
});

// Join tournament room (Socket.IO room)
router.post('/tournament/:tournamentId/join-room', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const playerId = req.user._id;
    
    // Verify player is participant
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }
    
    const isParticipant = tournament.participants.some(p => 
      p.user.toString() === playerId.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        error: 'You are not a participant in this tournament'
      });
    }
    
    // Join Socket.IO room
    const io = req.app.get('io');
    if (io) {
      // This would typically be handled in Socket.IO connection handler
      // For now, just return success
      res.json({
        success: true,
        message: 'Ready to join tournament room',
        data: {
          roomName: `tournament_${tournamentId}`,
          tournamentId
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Real-time service not available'
      });
    }
  } catch (error) {
    console.error('Error joining tournament room:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to join tournament room'
    });
  }
});

module.exports = router;
