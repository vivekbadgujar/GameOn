/**
 * Tournament Participants Management Routes
 * Handles participant management for admin panel
 */

const express = require('express');
const router = express.Router();
const Tournament = require('../../models/Tournament');
const User = require('../../models/User');
const { authenticateAdmin } = require('../../middleware/adminAuth');

// Get tournament participants with detailed information
router.get('/:tournamentId/participants', authenticateAdmin, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    
    const tournament = await Tournament.findById(tournamentId)
      .populate({
        path: 'participants.user',
        select: 'username email phone gameProfile avatar createdAt'
      })
      .lean();

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Sort participants by slot number
    tournament.participants.sort((a, b) => a.slotNumber - b.slotNumber);

    res.json({
      success: true,
      data: tournament
    });
  } catch (error) {
    console.error('Error fetching tournament participants:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Kick a participant
router.post('/:tournamentId/participants/:participantId/kick', authenticateAdmin, async (req, res) => {
  try {
    const { tournamentId, participantId } = req.params;
    const { reason } = req.body;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Find the participant
    const participantIndex = tournament.participants.findIndex(
      p => p._id.toString() === participantId
    );

    if (participantIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Participant not found'
      });
    }

    // Update participant status
    tournament.participants[participantIndex].status = 'kicked';
    tournament.participants[participantIndex].kickedAt = new Date();
    tournament.participants[participantIndex].kickReason = reason || 'No reason provided';
    tournament.participants[participantIndex].kickedBy = req.admin._id;

    // Decrease current participants count
    tournament.currentParticipants = Math.max(0, tournament.currentParticipants - 1);

    await tournament.save();

    // Emit Socket.IO event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('participantKicked', {
        tournamentId,
        participantId,
        reason,
        kickedBy: req.admin.name
      });
    }

    res.json({
      success: true,
      message: 'Participant kicked successfully'
    });
  } catch (error) {
    console.error('Error kicking participant:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update participant slot number
router.patch('/:tournamentId/participants/:participantId/slot', authenticateAdmin, async (req, res) => {
  try {
    const { tournamentId, participantId } = req.params;
    const { slotNumber } = req.body;

    if (!slotNumber || slotNumber < 1) {
      return res.status(400).json({
        success: false,
        error: 'Valid slot number is required'
      });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Find the participant
    const participantIndex = tournament.participants.findIndex(
      p => p._id.toString() === participantId
    );

    if (participantIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Participant not found'
      });
    }

    // Check if slot number is already taken
    const existingParticipant = tournament.participants.find(
      p => p.slotNumber === slotNumber && p._id.toString() !== participantId
    );

    if (existingParticipant) {
      // Swap slot numbers
      const oldSlotNumber = tournament.participants[participantIndex].slotNumber;
      const existingIndex = tournament.participants.findIndex(
        p => p.slotNumber === slotNumber
      );
      
      tournament.participants[existingIndex].slotNumber = oldSlotNumber;
      tournament.participants[participantIndex].slotNumber = slotNumber;
    } else {
      // Simply update the slot number
      tournament.participants[participantIndex].slotNumber = slotNumber;
    }

    await tournament.save();

    // Emit Socket.IO event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('participantSlotUpdated', {
        tournamentId,
        participantId,
        newSlotNumber: slotNumber
      });
    }

    res.json({
      success: true,
      message: 'Slot updated successfully'
    });
  } catch (error) {
    console.error('Error updating participant slot:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update participant information
router.patch('/:tournamentId/participants/:participantId', authenticateAdmin, async (req, res) => {
  try {
    const { tournamentId, participantId } = req.params;
    const { bgmiName, bgmiId, slotNumber } = req.body;

    const tournament = await Tournament.findById(tournamentId)
      .populate('participants.user');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Find the participant
    const participant = tournament.participants.find(
      p => p._id.toString() === participantId
    );

    if (!participant) {
      return res.status(404).json({
        success: false,
        error: 'Participant not found'
      });
    }

    // Update user's game profile
    if (bgmiName || bgmiId) {
      const user = await User.findById(participant.user._id);
      if (user) {
        if (bgmiName) user.gameProfile.bgmiName = bgmiName;
        if (bgmiId) user.gameProfile.bgmiId = bgmiId;
        await user.save();
      }
    }

    // Update slot number if provided
    if (slotNumber && slotNumber !== participant.slotNumber) {
      // Check if slot is already taken
      const existingParticipant = tournament.participants.find(
        p => p.slotNumber === slotNumber && p._id.toString() !== participantId
      );

      if (existingParticipant) {
        return res.status(400).json({
          success: false,
          error: 'Slot number is already taken'
        });
      }

      participant.slotNumber = slotNumber;
      await tournament.save();
    }

    // Emit Socket.IO event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('participantUpdated', {
        tournamentId,
        participantId,
        updates: { bgmiName, bgmiId, slotNumber }
      });
    }

    res.json({
      success: true,
      message: 'Participant updated successfully'
    });
  } catch (error) {
    console.error('Error updating participant:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get participant statistics
router.get('/:tournamentId/participants/stats', authenticateAdmin, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    const stats = {
      total: tournament.participants.length,
      confirmed: tournament.participants.filter(p => p.status === 'confirmed').length,
      waiting: tournament.participants.filter(p => p.status === 'waiting' || !p.status).length,
      kicked: tournament.participants.filter(p => p.status === 'kicked').length,
      maxParticipants: tournament.maxParticipants,
      availableSlots: tournament.maxParticipants - tournament.participants.filter(p => p.status !== 'kicked').length,
      recentJoins: tournament.participants.filter(p => {
        const joinTime = new Date(p.joinedAt);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return joinTime > fiveMinutesAgo;
      }).length
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching participant stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Bulk actions for participants
router.post('/:tournamentId/participants/bulk-action', authenticateAdmin, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { action, participantIds, data } = req.body;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    let updatedCount = 0;

    switch (action) {
      case 'kick':
        participantIds.forEach(participantId => {
          const participant = tournament.participants.find(
            p => p._id.toString() === participantId
          );
          if (participant && participant.status !== 'kicked') {
            participant.status = 'kicked';
            participant.kickedAt = new Date();
            participant.kickReason = data.reason || 'Bulk action';
            participant.kickedBy = req.admin._id;
            updatedCount++;
          }
        });
        tournament.currentParticipants = Math.max(0, tournament.currentParticipants - updatedCount);
        break;

      case 'confirm':
        participantIds.forEach(participantId => {
          const participant = tournament.participants.find(
            p => p._id.toString() === participantId
          );
          if (participant) {
            participant.status = 'confirmed';
            updatedCount++;
          }
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action'
        });
    }

    await tournament.save();

    // Emit Socket.IO event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('participantsBulkUpdate', {
        tournamentId,
        action,
        participantIds,
        updatedCount
      });
    }

    res.json({
      success: true,
      message: `${updatedCount} participants ${action}ed successfully`
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Swap player slots (for drag and drop)
router.post('/:tournamentId/participants/swap-slots', authenticateAdmin, async (req, res) => {
  try {
    const { sourceSlot, destSlot } = req.body;
    const tournament = await Tournament.findById(req.params.tournamentId);

    if (!tournament) {
      return res.status(404).json({ 
        success: false,
        error: 'Tournament not found' 
      });
    }

    // Find participants in source and destination slots
    const sourceParticipant = tournament.participants.find(p => p.slotNumber === sourceSlot);
    const destParticipant = tournament.participants.find(p => p.slotNumber === destSlot);

    if (sourceParticipant && destParticipant) {
      // Swap slot numbers
      sourceParticipant.slotNumber = destSlot;
      destParticipant.slotNumber = sourceSlot;
    } else if (sourceParticipant && !destParticipant) {
      // Move to empty slot
      sourceParticipant.slotNumber = destSlot;
    }

    await tournament.save();

    // Emit Socket.IO event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('slotsSwapped', {
        tournamentId: req.params.tournamentId,
        sourceSlot,
        destSlot
      });
    }

    res.json({
      success: true,
      message: 'Slots swapped successfully'
    });

  } catch (error) {
    console.error('Swap slots error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to swap slots' 
    });
  }
});

// Confirm player
router.post('/:tournamentId/participants/:participantId/confirm', authenticateAdmin, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.tournamentId);
    if (!tournament) {
      return res.status(404).json({ 
        success: false,
        error: 'Tournament not found' 
      });
    }

    const participant = tournament.participants.find(
      p => p._id.toString() === req.params.participantId
    );
    if (!participant) {
      return res.status(404).json({ 
        success: false,
        error: 'Participant not found' 
      });
    }

    participant.status = 'confirmed';
    await tournament.save();

    // Emit Socket.IO event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('participantConfirmed', {
        tournamentId: req.params.tournamentId,
        participantId: req.params.participantId
      });
    }

    res.json({
      success: true,
      message: 'Player confirmed successfully'
    });

  } catch (error) {
    console.error('Confirm player error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to confirm player' 
    });
  }
});

// Bulk confirm players
router.post('/:tournamentId/participants/bulk-confirm', authenticateAdmin, async (req, res) => {
  try {
    const { participantIds } = req.body;
    const tournament = await Tournament.findById(req.params.tournamentId);

    if (!tournament) {
      return res.status(404).json({ 
        success: false,
        error: 'Tournament not found' 
      });
    }

    let confirmedCount = 0;
    participantIds.forEach(participantId => {
      const participant = tournament.participants.find(
        p => p._id.toString() === participantId
      );
      if (participant) {
        participant.status = 'confirmed';
        confirmedCount++;
      }
    });

    await tournament.save();

    // Emit Socket.IO event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('participantsBulkConfirmed', {
        tournamentId: req.params.tournamentId,
        participantIds,
        confirmedCount
      });
    }

    res.json({
      success: true,
      message: `${confirmedCount} players confirmed successfully`
    });

  } catch (error) {
    console.error('Bulk confirm error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to confirm players' 
    });
  }
});

module.exports = router;