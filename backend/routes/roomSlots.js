/**
 * Room Slot Management Routes
 * Handles BGMI-style room layout and slot assignments
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const RoomSlot = require('../models/RoomSlot');
const Tournament = require('../models/Tournament');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get room layout for a tournament
router.get('/tournament/:tournamentId', authenticateToken, async (req, res) => {
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
  body('toTeam').isInt({ min: 1 }).withMessage('Valid team number required'),
  body('toSlot').isInt({ min: 1, max: 4 }).withMessage('Valid slot number required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    
    const { tournamentId } = req.params;
    const { toTeam, toSlot } = req.body;
    const playerId = req.user._id;
    
    console.log('Player slot move request:', {
      tournamentId,
      playerId: playerId.toString(),
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
    
    // Check if deadline has passed
    if (roomSlot.settings.slotChangeDeadline && new Date() > roomSlot.settings.slotChangeDeadline) {
      return res.status(403).json({
        success: false,
        error: 'Slot change deadline has passed'
      });
    }
    
    // Get current player slot
    const currentSlot = roomSlot.getPlayerSlot(playerId);
    if (!currentSlot) {
      return res.status(400).json({
        success: false,
        error: 'Player not found in any slot'
      });
    }
    
    // Check if trying to move to same slot
    if (currentSlot.teamNumber === toTeam && currentSlot.slotNumber === toSlot) {
      return res.status(400).json({
        success: false,
        error: 'Player is already in this slot'
      });
    }
    
    // Perform the move
    roomSlot.movePlayer(playerId, currentSlot.teamNumber, currentSlot.slotNumber, toTeam, toSlot);
    await roomSlot.save();
    
    // Populate updated data
    const updatedRoomSlot = await RoomSlot.findById(roomSlot._id)
      .populate('teams.slots.player', 'username displayName gameProfile.bgmiName gameProfile.bgmiId avatar')
      .populate('teams.captain', 'username displayName gameProfile.bgmiName');
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`tournament_${tournamentId}`).emit('slotChanged', {
        tournamentId,
        playerId: playerId.toString(),
        fromTeam: currentSlot.teamNumber,
        fromSlot: currentSlot.slotNumber,
        toTeam,
        toSlot,
        roomSlot: updatedRoomSlot
      });
    }
    
    res.json({
      success: true,
      message: 'Slot changed successfully',
      data: {
        roomSlot: updatedRoomSlot,
        playerSlot: updatedRoomSlot.getPlayerSlot(playerId)
      }
    });
  } catch (error) {
    console.error('Error moving player slot:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to move player slot'
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
      io.to(`tournament_${tournamentId}`).emit('playerAssigned', {
        tournamentId,
        playerId: playerId.toString(),
        teamNumber: playerSlot.teamNumber,
        slotNumber: playerSlot.slotNumber,
        roomSlot: updatedRoomSlot
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