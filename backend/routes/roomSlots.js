/**
 * Room Slot Management Routes - UNIFIED & FIXED
 * Single source of truth for all slot operations
 */

const express = require('express');
const mongoose = require('mongoose');
const RoomSlot = require('../models/RoomSlot');
const Tournament = require('../models/Tournament');
const { authenticateToken } = require('../middleware/auth');
const {
  requireTournamentParticipation,
  validateSlotEditPermissions
} = require('../middleware/tournamentParticipationValidation');
const router = express.Router();

// Helper: emit slot update to all relevant rooms
function emitSlotUpdate(io, tournamentId, event, data) {
  if (!io) return;
  // Players watching their tournament room
  io.to(`tournament_${tournamentId}`).emit(event, data);
  // Admin panel global listener
  io.emit('roomSlotUpdated', { ...data, event, tournamentId });
  // Admin-specific room
  io.to('admin_room').emit('roomSlotUpdated', { ...data, event, tournamentId });
}

// Helper: populate room slot
function populateRoomSlot(query) {
  return query
    .populate('teams.slots.player', 'username displayName gameProfile.bgmiName gameProfile.bgmiId avatar')
    .populate('teams.captain', 'username displayName gameProfile.bgmiName');
}

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Room slots API is working', timestamp: new Date().toISOString() });
});

// ─── GET room layout for a tournament ────────────────────────────────────────
router.get('/tournament/:tournamentId', authenticateToken, requireTournamentParticipation, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const tournament = req.tournament; // already fetched by middleware

    // Get or create room slot layout
    let roomSlot = await populateRoomSlot(RoomSlot.findOne({ tournament: tournamentId }));

    if (!roomSlot) {
      // Create fresh layout and auto-assign all existing participants
      const raw = await RoomSlot.createForTournament(
        tournamentId,
        tournament.tournamentType,
        tournament.maxParticipants
      );

      for (const participant of tournament.participants) {
        try { raw.autoAssignPlayer(participant.user); } catch (_) {}
      }
      await raw.save();

      roomSlot = await populateRoomSlot(RoomSlot.findById(raw._id));
    }

    // Self-heal: if requesting user has no slot, assign one
    let playerSlot = roomSlot.getPlayerSlot(req.user._id);
    if (!playerSlot) {
      try {
        const raw = await RoomSlot.findById(roomSlot._id);
        raw.autoAssignPlayer(req.user._id);
        await raw.save();
        roomSlot = await populateRoomSlot(RoomSlot.findById(raw._id));
        playerSlot = roomSlot.getPlayerSlot(req.user._id);

        const io = req.app.get('io');
        emitSlotUpdate(io, tournamentId, 'playerAssigned', {
          tournamentId,
          playerId: req.user._id.toString(),
          username: req.user.username || 'A player',
          teamNumber: playerSlot?.teamNumber,
          slotNumber: playerSlot?.slotNumber,
          roomSlot,
          playerSlot
        });
      } catch (assignErr) {
        console.error('[GET Room Layout] Self-healing failed:', assignErr.message);
      }
    }

    return res.json({
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
          roomDetails: tournament.roomDetails,
          // Include slotLock so frontend can read backend config
          slotLock: tournament.slotLock || { enabled: false, mode: 'manual', autoLockMinutes: 10 }
        }
      }
    });
  } catch (error) {
    console.error('[GET Room Layout] Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch room layout' });
  }
});

// ─── MOVE player to a different slot ─────────────────────────────────────────
router.post('/tournament/:tournamentId/move', [authenticateToken, validateSlotEditPermissions], async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const playerId = req.user._id;
    const body = req.body || {};

    // Parse destination - handle both payload shapes:
    // Shape A: { toTeam: 2, toSlot: 3 }
    // Shape B: { toSlot: { teamNumber: 2, slotNumber: 3 } }
    let toTeam, toSlot;
    if (body.toSlot && typeof body.toSlot === 'object') {
      toTeam = Number(body.toSlot.teamNumber);
      toSlot = Number(body.toSlot.slotNumber);
    } else {
      toTeam = Number(body.toTeam);
      toSlot = Number(body.toSlot);
    }

    if (!Number.isInteger(toTeam) || toTeam < 1) {
      return res.status(400).json({ success: false, error: 'Valid destination team is required' });
    }
    if (!Number.isInteger(toSlot) || toSlot < 1) {
      return res.status(400).json({ success: false, error: 'Valid destination slot is required' });
    }

    // Validate playerId if sent (cross-check)
    if (body.playerId && body.playerId.toString() !== playerId.toString()) {
      return res.status(400).json({ success: false, error: 'Player ID mismatch' });
    }

    // Validate tournamentId if sent
    if (body.tournamentId && body.tournamentId.toString() !== tournamentId.toString()) {
      return res.status(400).json({ success: false, error: 'Tournament ID mismatch' });
    }

    // Fetch room slot
    const roomSlot = await RoomSlot.findOne({ tournament: tournamentId });
    if (!roomSlot) {
      return res.status(404).json({ success: false, error: 'Room layout not found' });
    }

    // Lock checks
    if (!roomSlot.settings.allowSlotChange) {
      return res.status(403).json({ success: false, error: 'Slot changes are not allowed' });
    }
    if (roomSlot.isLocked) {
      return res.status(403).json({ success: false, error: 'Slots are locked' });
    }
    if (roomSlot.settings.slotChangeDeadline && new Date() > roomSlot.settings.slotChangeDeadline) {
      return res.status(403).json({ success: false, error: 'Slot change deadline has passed' });
    }

    // Get player's current slot
    const currentSlot = roomSlot.getPlayerSlot(playerId);
    if (!currentSlot) {
      return res.status(400).json({ success: false, error: 'Player not found in any slot' });
    }

    // Validate fromSlot if provided
    if (body.fromSlot) {
      const fromTeamNum = Number(body.fromSlot.teamNumber);
      const fromSlotNum = Number(body.fromSlot.slotNumber);
      if (fromTeamNum !== currentSlot.teamNumber || fromSlotNum !== currentSlot.slotNumber) {
        return res.status(400).json({
          success: false,
          error: 'Current slot does not match request payload',
          details: {
            expected: { teamNumber: currentSlot.teamNumber, slotNumber: currentSlot.slotNumber },
            received: body.fromSlot
          }
        });
      }
    }

    // Same slot?
    if (currentSlot.teamNumber === toTeam && currentSlot.slotNumber === toSlot) {
      return res.status(400).json({ success: false, error: 'Player is already in this slot' });
    }

    // Check destination slot
    const destTeamObj = roomSlot.teams.find(t => t.teamNumber === toTeam);
    const destSlotObj = destTeamObj?.slots.find(s => s.slotNumber === toSlot);

    if (!destTeamObj || !destSlotObj) {
      return res.status(400).json({ success: false, error: 'Destination slot not found' });
    }
    if (destSlotObj.player) {
      return res.status(409).json({ success: false, error: 'Destination slot is occupied' });
    }
    if (destSlotObj.isLocked) {
      // Check if it's a stale temporary lock (> 10s old)
      const now = new Date();
      if (destSlotObj.lockedAt && (now - destSlotObj.lockedAt) < 10000) {
        return res.status(409).json({ success: false, error: 'Slot is temporarily locked. Try again.' });
      }
      // Stale lock — treat as unlocked
    }

    // Perform the move atomically using findOneAndUpdate with optimistic approach
    // Avoid nested transactions; use a single save
    try {
      roomSlot.movePlayer(playerId, currentSlot.teamNumber, currentSlot.slotNumber, toTeam, toSlot);
      await roomSlot.save();
    } catch (moveErr) {
      console.error('[Slot Move] Move failed:', moveErr.message);
      return res.status(409).json({ success: false, error: moveErr.message });
    }

    // Sync Tournament participant record (best-effort, no transaction needed)
    try {
      await Tournament.updateOne(
        { _id: tournamentId, 'participants.user': playerId },
        {
          $set: {
            'participants.$.teamNumber': toTeam,
            'participants.$.slotNumber': toSlot,
            'participants.$.hasEditedSlot': true,
            'participants.$.slotUpdatedAt': new Date()
          }
        }
      );
    } catch (syncErr) {
      console.warn('[Slot Move] Tournament sync failed (non-fatal):', syncErr.message);
    }

    // Populate and return
    const updatedRoomSlot = await populateRoomSlot(RoomSlot.findById(roomSlot._id));
    const updatedPlayerSlot = updatedRoomSlot.getPlayerSlot(playerId);

    // Emit real-time update
    const io = req.app.get('io');
    emitSlotUpdate(io, tournamentId, 'slotChanged', {
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

    // Sync service (best-effort)
    try {
      const syncService = req.app.get('syncService');
      if (syncService?.syncSlotUpdate) {
        syncService.syncSlotUpdate(tournamentId, 'slot_changed', {
          tournamentId, playerId: playerId.toString(), fromTeam: currentSlot.teamNumber,
          fromSlot: currentSlot.slotNumber, toTeam, toSlot
        });
      }
    } catch (_) {}

    console.log('[Slot Move] Success:', { tournamentId, playerId: playerId.toString(), from: `T${currentSlot.teamNumber}S${currentSlot.slotNumber}`, to: `T${toTeam}S${toSlot}` });

    return res.json({
      success: true,
      message: 'Slot moved successfully',
      data: {
        roomSlot: updatedRoomSlot,
        playerSlot: updatedPlayerSlot,
        previousPosition: { teamNumber: currentSlot.teamNumber, slotNumber: currentSlot.slotNumber },
        newPosition: updatedPlayerSlot
      }
    });
  } catch (error) {
    console.error('[Slot Move] Error:', error);
    const knownErrors = {
      'Source team not found': 400,
      'Player not found in source slot': 400,
      'Destination team not found': 400,
      'Destination slot not found': 400,
      'Destination slot is occupied': 409,
      'Destination slot is locked': 403
    };
    const statusCode = knownErrors[error.message] || 500;
    return res.status(statusCode).json({ success: false, error: error.message || 'Failed to move player slot' });
  }
});

// ─── AUTO-ASSIGN player to slot (called after joining/payment) ───────────────
router.post('/tournament/:tournamentId/assign', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const playerId = req.user._id;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ success: false, error: 'Tournament not found' });

    const isParticipant = tournament.participants.some(p => p.user.toString() === playerId.toString());
    if (!isParticipant) return res.status(403).json({ success: false, error: 'You are not a participant' });

    let roomSlot = await RoomSlot.findOne({ tournament: tournamentId });
    if (!roomSlot) {
      roomSlot = await RoomSlot.createForTournament(tournamentId, tournament.tournamentType, tournament.maxParticipants);
    }

    // Already assigned?
    const existingSlot = roomSlot.getPlayerSlot(playerId);
    if (existingSlot) {
      const populated = await populateRoomSlot(RoomSlot.findById(roomSlot._id));
      return res.json({ success: true, message: 'Player already assigned', data: { roomSlot: populated, playerSlot: existingSlot } });
    }

    // Assign
    try {
      roomSlot.autoAssignPlayer(playerId);
      await roomSlot.save();
    } catch (assignErr) {
      return res.status(409).json({ success: false, error: assignErr.message });
    }

    // Sync Tournament
    const newSlot = roomSlot.getPlayerSlot(playerId);
    if (newSlot) {
      try {
        await Tournament.updateOne(
          { _id: tournamentId, 'participants.user': playerId },
          { $set: { 'participants.$.teamNumber': newSlot.teamNumber, 'participants.$.slotNumber': newSlot.slotNumber } }
        );
      } catch (_) {}
    }

    const updatedRoomSlot = await populateRoomSlot(RoomSlot.findById(roomSlot._id));
    const playerSlot = updatedRoomSlot.getPlayerSlot(playerId);

    // Emit
    const io = req.app.get('io');
    emitSlotUpdate(io, tournamentId, 'playerAssigned', {
      tournamentId,
      playerId: playerId.toString(),
      username: req.user.username || 'A player',
      teamNumber: playerSlot?.teamNumber,
      slotNumber: playerSlot?.slotNumber,
      roomSlot: updatedRoomSlot,
      playerSlot,
      timestamp: new Date()
    });

    return res.json({
      success: true,
      message: 'Player assigned to slot successfully',
      data: { roomSlot: updatedRoomSlot, playerSlot }
    });
  } catch (error) {
    console.error('[Assign] Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Failed to assign player' });
  }
});

// ─── GET available slots ──────────────────────────────────────────────────────
router.get('/tournament/:tournamentId/available', authenticateToken, async (req, res) => {
  try {
    const roomSlot = await RoomSlot.findOne({ tournament: req.params.tournamentId });
    if (!roomSlot) return res.status(404).json({ success: false, error: 'Room layout not found' });

    const availableSlots = roomSlot.availableSlots;
    return res.json({
      success: true,
      data: {
        availableSlots,
        totalAvailable: availableSlots.length,
        totalSlots: roomSlot.maxTeams * roomSlot.maxPlayersPerTeam,
        totalPlayers: roomSlot.totalPlayers
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ─── JOIN tournament room (socket confirmation) ───────────────────────────────
router.post('/tournament/:tournamentId/join-room', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ success: false, error: 'Tournament not found' });

    const isParticipant = tournament.participants.some(p => p.user.toString() === req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ success: false, error: 'Not a participant' });

    return res.json({
      success: true,
      message: 'Ready to join tournament room',
      data: { roomName: `tournament_${tournamentId}`, tournamentId }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ─── ADMIN: Lock/Unlock all slots ────────────────────────────────────────────
router.post('/tournament/:tournamentId/lock', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { lock = true, reason = '' } = req.body;

    const roomSlot = await RoomSlot.findOne({ tournament: tournamentId });
    if (!roomSlot) return res.status(404).json({ success: false, error: 'Room layout not found' });

    roomSlot.isLocked = lock;
    if (lock) {
      roomSlot.lockedAt = new Date();
    } else {
      roomSlot.lockedAt = null;
      roomSlot.lockedBy = null;
    }
    await roomSlot.save();

    const io = req.app.get('io');
    const eventData = { tournamentId, isLocked: lock, reason, lockedAt: roomSlot.lockedAt };
    emitSlotUpdate(io, tournamentId, lock ? 'slotsLocked' : 'slotsUnlocked', eventData);

    return res.json({ success: true, message: `Slots ${lock ? 'locked' : 'unlocked'}`, data: eventData });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ─── ADMIN: Move any player's slot ───────────────────────────────────────────
router.post('/tournament/:tournamentId/admin-move', authenticateToken, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { playerId, toTeam, toSlot } = req.body;

    if (!playerId || !toTeam || !toSlot) {
      return res.status(400).json({ success: false, error: 'playerId, toTeam, toSlot are required' });
    }

    const roomSlot = await RoomSlot.findOne({ tournament: tournamentId });
    if (!roomSlot) return res.status(404).json({ success: false, error: 'Room layout not found' });

    const currentSlot = roomSlot.getPlayerSlot(playerId);
    if (!currentSlot) {
      // Just assign to the target slot
      roomSlot.assignPlayerToSlot(playerId, Number(toTeam), Number(toSlot));
    } else {
      roomSlot.movePlayer(playerId, currentSlot.teamNumber, currentSlot.slotNumber, Number(toTeam), Number(toSlot));
    }
    await roomSlot.save();

    const updatedRoomSlot = await populateRoomSlot(RoomSlot.findById(roomSlot._id));
    const updatedPlayerSlot = updatedRoomSlot.getPlayerSlot(playerId);

    const io = req.app.get('io');
    emitSlotUpdate(io, tournamentId, 'adminSlotChanged', {
      tournamentId,
      playerId: playerId.toString(),
      fromTeam: currentSlot?.teamNumber,
      fromSlot: currentSlot?.slotNumber,
      toTeam: Number(toTeam),
      toSlot: Number(toSlot),
      roomSlot: updatedRoomSlot,
      playerSlot: updatedPlayerSlot,
      timestamp: new Date()
    });

    return res.json({ success: true, message: 'Admin slot move successful', data: { roomSlot: updatedRoomSlot, playerSlot: updatedPlayerSlot } });
  } catch (error) {
    console.error('[Admin Move] Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
