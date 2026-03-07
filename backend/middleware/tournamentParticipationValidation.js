/**
 * Tournament Participation Validation Middleware
 * Prevents duplicate participation and payment attempts
 */

const Tournament = require('../models/Tournament');
const Transaction = require('../models/Transaction');

/**
 * Middleware to validate tournament participation eligibility
 */
const validateTournamentParticipation = async (req, res, next) => {
  try {
    const { id: tournamentId } = req.params;
    const userId = req.user._id;

    // Find the tournament
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found',
        code: 'TOURNAMENT_NOT_FOUND'
      });
    }

    // Check tournament status
    if (tournament.status === 'completed' || tournament.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Tournament is no longer accepting participants',
        code: 'TOURNAMENT_CLOSED'
      });
    }

    // Check if tournament is full
    if (tournament.currentParticipants >= tournament.maxParticipants) {
      return res.status(400).json({
        success: false,
        error: 'Tournament is full',
        code: 'TOURNAMENT_FULL'
      });
    }

    // Check for existing participation
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

    // if entry fee is charged we no longer allow the user to join directly
    // via the normal participation endpoints; they must use the manual
    // payment form and wait for an admin to approve their entry.
    if (tournament.entryFee && tournament.entryFee > 0) {
      return res.status(400).json({
        success: false,
        error: 'Tournament requires manual payment. Please submit details and wait for approval.',
        code: 'MANUAL_PAYMENT_REQUIRED'
      });
    }

    // Add tournament and validation data to request
    req.tournament = tournament;
    req.validationData = {
      existingPayments,
      canJoin: true
    };

    next();
  } catch (error) {
    console.error('Tournament participation validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate tournament participation',
      code: 'VALIDATION_ERROR'
    });
  }
};

/**
 * Middleware to check if user is a tournament participant
 */
const requireTournamentParticipation = async (req, res, next) => {
  try {
    const tournamentId = req.params.id || req.params.tournamentId;
    const userId = req.user._id;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    const participation = tournament.getUserParticipation(userId);
    if (!participation) {
      return res.status(403).json({
        success: false,
        error: 'You are not a participant in this tournament',
        code: 'NOT_PARTICIPANT'
      });
    }

    req.tournament = tournament;
    req.userParticipation = participation;
    next();
  } catch (error) {
    console.error('Tournament participation check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify tournament participation'
    });
  }
};

/**
 * Middleware to validate slot editing permissions
 */
const validateSlotEditPermissions = async (req, res, next) => {
  try {
    const tournamentId = req.params.id || req.params.tournamentId;
    const userId = req.user._id;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Check if tournament allows slot editing
    if (tournament.status === 'completed' || tournament.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Cannot edit slots for completed or cancelled tournaments',
        code: 'TOURNAMENT_ENDED'
      });
    }

    // Check if user is a participant
    const participation = tournament.getUserParticipation(userId);
    if (!participation) {
      return res.status(403).json({
        success: false,
        error: 'You are not a participant in this tournament',
        code: 'NOT_PARTICIPANT'
      });
    }

    // Lock slot editing only when tournament is live/ongoing or has ended.
    // Admin explicit slot locks are enforced at the RoomSlot level.
    const lockedStatuses = ['live', 'active', 'completed', 'cancelled'];
    const tournamentStatus = (tournament.status || '').toLowerCase();
    if (lockedStatuses.includes(tournamentStatus)) {
      return res.status(403).json({
        success: false,
        error: 'Slots are locked for this tournament status.',
        code: 'SLOTS_LOCKED',
        data: {
          status: tournament.status
        }
      });
    }

    req.tournament = tournament;
    req.userParticipation = participation;
    next();
  } catch (error) {
    console.error('Slot edit validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate slot editing permissions'
    });
  }
};

module.exports = {
  validateTournamentParticipation,
  requireTournamentParticipation,
  validateSlotEditPermissions
};