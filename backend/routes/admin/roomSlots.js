/**
 * Admin Room Slot Management Routes
 * Handles admin controls for BGMI-style room layout and slot assignments
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const RoomSlot = require('../../models/RoomSlot');
const Tournament = require('../../models/Tournament');
const User = require('../../models/User');
const { authenticateAdmin } = require('../../middleware/adminAuth');
const router = express.Router();

// Get room layout for a tournament (Admin view)
router.get('/tournament/:tournamentId', authenticateAdmin, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    
    // Get tournament details
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }
    
    // Get room slot layout
    let roomSlot = await RoomSlot.findOne({ tournament: tournamentId })
      .populate('teams.slots.player', 'username displayName gameProfile.bgmiName gameProfile.bgmiId avatar email phone')
      .populate('teams.captain', 'username displayName gameProfile.bgmiName')
      .populate('lockedBy', 'username');
    
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
        .populate('teams.slots.player', 'username displayName gameProfile.bgmiName gameProfile.bgmiId avatar email phone')
        .populate('teams.captain', 'username displayName gameProfile.bgmiName')
        .populate('lockedBy', 'username');
    }
    
    res.json({
      success: true,
      data: {
        roomSlot,
        tournament: {
          _id: tournament._id,
          title: tournament.title,
          tournamentType: tournament.tournamentType,
          status: tournament.status,
          startDate: tournament.startDate,
          maxParticipants: tournament.maxParticipants,
          currentParticipants: tournament.currentParticipants,
          roomDetails: tournament.roomDetails
        },
        stats: {
          totalSlots: roomSlot.maxTeams * roomSlot.maxPlayersPerTeam,
          occupiedSlots: roomSlot.totalPlayers,
          availableSlots: (roomSlot.maxTeams * roomSlot.maxPlayersPerTeam) - roomSlot.totalPlayers,
          completeTeams: roomSlot.teams.filter(t => t.isComplete).length,
          totalTeams: roomSlot.maxTeams
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin room layout:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch room layout'
    });
  }
});

// Move player to specific slot (Admin action)
router.post('/tournament/:tournamentId/move-player', [
  authenticateAdmin,
  body('playerId').notEmpty().withMessage('Player ID is required'),
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
    const { playerId, toTeam, toSlot } = req.body;
    const adminId = req.admin._id;
    
    // Get room slot layout
    const roomSlot = await RoomSlot.findOne({ tournament: tournamentId });
    if (!roomSlot) {
      return res.status(404).json({
        success: false,
        error: 'Room layout not found'
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
      io.to(`tournament_${tournamentId}`).emit('adminSlotChanged', {
        tournamentId,
        playerId,
        fromTeam: currentSlot.teamNumber,
        fromSlot: currentSlot.slotNumber,
        toTeam,
        toSlot,
        adminAction: true,
        adminId,
        roomSlot: updatedRoomSlot
      });
    }
    
    res.json({
      success: true,
      message: 'Player moved successfully',
      data: {
        roomSlot: updatedRoomSlot
      }
    });
  } catch (error) {
    console.error('Error moving player (admin):', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to move player'
    });
  }
});

// Lock/Unlock specific slot
router.post('/tournament/:tournamentId/toggle-slot-lock', [
  authenticateAdmin,
  body('teamNumber').isInt({ min: 1 }).withMessage('Valid team number required'),
  body('slotNumber').isInt({ min: 1, max: 4 }).withMessage('Valid slot number required'),
  body('action').isIn(['lock', 'unlock']).withMessage('Action must be lock or unlock')
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
    const { teamNumber, slotNumber, action } = req.body;
    const adminId = req.admin._id;
    
    // Get room slot layout
    const roomSlot = await RoomSlot.findOne({ tournament: tournamentId });
    if (!roomSlot) {
      return res.status(404).json({
        success: false,
        error: 'Room layout not found'
      });
    }
    
    // Perform lock/unlock action
    if (action === 'lock') {
      roomSlot.lockSlot(teamNumber, slotNumber, adminId);
    } else {
      roomSlot.unlockSlot(teamNumber, slotNumber);
    }
    
    await roomSlot.save();
    
    // Populate updated data
    const updatedRoomSlot = await RoomSlot.findById(roomSlot._id)
      .populate('teams.slots.player', 'username displayName gameProfile.bgmiName gameProfile.bgmiId avatar')
      .populate('teams.captain', 'username displayName gameProfile.bgmiName')
      .populate('lockedBy', 'username');
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`tournament_${tournamentId}`).emit('slotLockChanged', {
        tournamentId,
        teamNumber,
        slotNumber,
        action,
        adminId,
        roomSlot: updatedRoomSlot
      });
    }
    
    res.json({
      success: true,
      message: `Slot ${action}ed successfully`,
      data: {
        roomSlot: updatedRoomSlot
      }
    });
  } catch (error) {
    console.error('Error toggling slot lock:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to toggle slot lock'
    });
  }
});

// Lock/Unlock all slots in tournament
router.post('/tournament/:tournamentId/toggle-all-slots', [
  authenticateAdmin,
  body('action').isIn(['lock', 'unlock']).withMessage('Action must be lock or unlock')
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
    const { action } = req.body;
    const adminId = req.admin._id;
    
    // Get room slot layout
    const roomSlot = await RoomSlot.findOne({ tournament: tournamentId });
    if (!roomSlot) {
      return res.status(404).json({
        success: false,
        error: 'Room layout not found'
      });
    }
    
    // Lock/unlock all slots
    roomSlot.isLocked = action === 'lock';
    roomSlot.lockedBy = action === 'lock' ? adminId : null;
    roomSlot.lockedAt = action === 'lock' ? new Date() : null;
    
    // Also update settings
    roomSlot.settings.allowSlotChange = action === 'unlock';
    
    await roomSlot.save();
    
    // Populate updated data
    const updatedRoomSlot = await RoomSlot.findById(roomSlot._id)
      .populate('teams.slots.player', 'username displayName gameProfile.bgmiName gameProfile.bgmiId avatar')
      .populate('teams.captain', 'username displayName gameProfile.bgmiName')
      .populate('lockedBy', 'username');
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`tournament_${tournamentId}`).emit('slotsLocked', {
        tournamentId,
        action,
        adminId,
        roomSlot: updatedRoomSlot
      });
    }
    
    res.json({
      success: true,
      message: `All slots ${action}ed successfully`,
      data: {
        roomSlot: updatedRoomSlot
      }
    });
  } catch (error) {
    console.error('Error toggling all slots:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to toggle all slots'
    });
  }
});

// Remove player from tournament and free up slot
router.post('/tournament/:tournamentId/remove-player', [
  authenticateAdmin,
  body('playerId').notEmpty().withMessage('Player ID is required')
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
    const { playerId } = req.body;
    const adminId = req.admin._id;
    
    // Get tournament and room slot
    const tournament = await Tournament.findById(tournamentId);
    const roomSlot = await RoomSlot.findOne({ tournament: tournamentId });
    
    if (!tournament || !roomSlot) {
      return res.status(404).json({
        success: false,
        error: 'Tournament or room layout not found'
      });
    }
    
    // Get player info before removal
    const playerSlot = roomSlot.getPlayerSlot(playerId);
    const player = await User.findById(playerId);
    
    // Remove from tournament participants
    tournament.participants = tournament.participants.filter(p => 
      p.user.toString() !== playerId.toString()
    );
    tournament.currentParticipants = Math.max(0, tournament.currentParticipants - 1);
    
    // Remove from room slots
    roomSlot.removePlayerFromAllSlots(playerId);
    
    await tournament.save();
    await roomSlot.save();
    
    // Populate updated data
    const updatedRoomSlot = await RoomSlot.findById(roomSlot._id)
      .populate('teams.slots.player', 'username displayName gameProfile.bgmiName gameProfile.bgmiId avatar')
      .populate('teams.captain', 'username displayName gameProfile.bgmiName');
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`tournament_${tournamentId}`).emit('playerRemoved', {
        tournamentId,
        playerId,
        playerName: player?.username,
        previousSlot: playerSlot,
        adminAction: true,
        adminId,
        roomSlot: updatedRoomSlot
      });
      
      // Notify the removed player
      io.to(`user_${playerId}`).emit('removedFromTournament', {
        tournamentId,
        tournamentTitle: tournament.title,
        reason: 'Removed by admin'
      });
    }
    
    res.json({
      success: true,
      message: 'Player removed successfully',
      data: {
        roomSlot: updatedRoomSlot,
        removedPlayer: {
          id: playerId,
          username: player?.username,
          previousSlot: playerSlot
        }
      }
    });
  } catch (error) {
    console.error('Error removing player:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to remove player'
    });
  }
});

// Update room settings
router.put('/tournament/:tournamentId/settings', [
  authenticateAdmin,
  body('allowSlotChange').optional().isBoolean(),
  body('allowTeamSwitch').optional().isBoolean(),
  body('autoAssignTeams').optional().isBoolean(),
  body('slotChangeDeadline').optional().isISO8601()
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
    const settings = req.body;
    
    // Get room slot layout
    const roomSlot = await RoomSlot.findOne({ tournament: tournamentId });
    if (!roomSlot) {
      return res.status(404).json({
        success: false,
        error: 'Room layout not found'
      });
    }
    
    // Update settings
    Object.keys(settings).forEach(key => {
      if (settings[key] !== undefined) {
        roomSlot.settings[key] = settings[key];
      }
    });
    
    await roomSlot.save();
    
    // Populate updated data
    const updatedRoomSlot = await RoomSlot.findById(roomSlot._id)
      .populate('teams.slots.player', 'username displayName gameProfile.bgmiName gameProfile.bgmiId avatar')
      .populate('teams.captain', 'username displayName gameProfile.bgmiName');
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`tournament_${tournamentId}`).emit('roomSettingsChanged', {
        tournamentId,
        settings: updatedRoomSlot.settings,
        roomSlot: updatedRoomSlot
      });
    }
    
    res.json({
      success: true,
      message: 'Room settings updated successfully',
      data: {
        roomSlot: updatedRoomSlot
      }
    });
  } catch (error) {
    console.error('Error updating room settings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update room settings'
    });
  }
});

// Get room statistics
router.get('/tournament/:tournamentId/stats', authenticateAdmin, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    
    const roomSlot = await RoomSlot.findOne({ tournament: tournamentId })
      .populate('teams.slots.player', 'username gameProfile.bgmiName createdAt');
    
    if (!roomSlot) {
      return res.status(404).json({
        success: false,
        error: 'Room layout not found'
      });
    }
    
    // Calculate statistics
    const stats = {
      totalSlots: roomSlot.maxTeams * roomSlot.maxPlayersPerTeam,
      occupiedSlots: roomSlot.totalPlayers,
      availableSlots: (roomSlot.maxTeams * roomSlot.maxPlayersPerTeam) - roomSlot.totalPlayers,
      completeTeams: roomSlot.teams.filter(t => t.isComplete).length,
      incompleteTeams: roomSlot.teams.filter(t => !t.isComplete && t.slots.some(s => s.player)).length,
      emptyTeams: roomSlot.teams.filter(t => !t.slots.some(s => s.player)).length,
      totalTeams: roomSlot.maxTeams,
      occupancyRate: ((roomSlot.totalPlayers / (roomSlot.maxTeams * roomSlot.maxPlayersPerTeam)) * 100).toFixed(1),
      teamCompletionRate: ((roomSlot.teams.filter(t => t.isComplete).length / roomSlot.maxTeams) * 100).toFixed(1),
      playersPerTeam: roomSlot.teams.map(team => ({
        teamNumber: team.teamNumber,
        playerCount: team.slots.filter(s => s.player).length,
        isComplete: team.isComplete,
        captain: team.captain ? {
          id: team.captain._id,
          username: team.captain.username || team.captain.gameProfile?.bgmiName
        } : null
      }))
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching room stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch room statistics'
    });
  }
});

module.exports = router;