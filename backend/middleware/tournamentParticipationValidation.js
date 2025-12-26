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

    // Check for existing payments
    const existingPayments = await Transaction.find({
      user: userId,
      tournament: tournamentId,
      type: 'tournament_entry'
    }).sort({ createdAt: -1 });

    // Check for pending payments
    const pendingPayment = existingPayments.find(p => p.status === 'pending');
    if (pendingPayment) {
      const paymentId = pendingPayment.cashfreePaymentId || pendingPayment.paymentGateway?.gatewayTransactionId || null;
      const orderId = pendingPayment.cashfreeOrderId || pendingPayment.paymentGateway?.gatewayOrderId || null;
      return res.status(400).json({
        success: false,
        error: 'You have a pending payment for this tournament. Please complete or cancel it first.',
        code: 'PAYMENT_PENDING',
        data: {
          paymentId,
          orderId,
          amount: pendingPayment.amount,
          createdAt: pendingPayment.createdAt
        }
      });
    }

    // Check for completed payments without participation (inconsistent state)
    const completedPayment = existingPayments.find(p => p.status === 'completed');
    if (completedPayment && !existingParticipation) {
      console.error('Inconsistent state detected:', {
        userId: userId.toString(),
        tournamentId,
        paymentId: completedPayment._id,
        message: 'Payment completed but no participation record found'
      });
      
      return res.status(400).json({
        success: false,
        error: 'Payment already completed for this tournament. Please contact support.',
        code: 'INCONSISTENT_STATE',
        data: {
          paymentId: completedPayment.cashfreePaymentId || completedPayment.paymentGateway?.gatewayTransactionId || null,
          amount: completedPayment.amount,
          completedAt: completedPayment.updatedAt
        }
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

    // Check if slots are locked due to tournament timing
    const now = new Date();
    const startTime = new Date(tournament.startDate);
    const lockTime = new Date(startTime.getTime() - 10 * 60 * 1000); // 10 minutes before start

    if (now >= lockTime) {
      return res.status(403).json({
        success: false,
        error: 'Slots are locked! Tournament starts soon.',
        code: 'SLOTS_LOCKED',
        data: {
          lockTime,
          startTime,
          reason: 'Tournament starts in less than 10 minutes'
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