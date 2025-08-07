const Tournament = require('../models/Tournament');

/**
 * Middleware to validate tournament join request
 * Checks for duplicate participation and payment
 */
const validateTournamentJoin = async (req, res, next) => {
  try {
    const tournamentId = req.params.id || req.body.tournamentId;
    const userId = req.user._id;

    // Find the tournament
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Check if user has already joined
    const existingParticipation = tournament.participants.find(
      p => p.user.toString() === userId.toString()
    );

    if (existingParticipation) {
      // If already joined, return their slot info instead of error
      return res.status(200).json({
        success: true,
        alreadyJoined: true,
        data: {
          message: 'You have already joined this tournament',
          redirectTo: `/tournament/${tournamentId}/room-lobby`,
          slotNumber: existingParticipation.slotNumber,
          participationStatus: existingParticipation.status
        }
      });
    }

    // Check tournament status and capacity
    if (tournament.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        error: 'Tournament registration is closed'
      });
    }

    if (tournament.currentParticipants >= tournament.maxParticipants) {
      return res.status(400).json({
        success: false,
        error: 'Tournament is full'
      });
    }

    // Attach tournament to request for next middleware
    req.tournament = tournament;
    next();

  } catch (error) {
    console.error('Tournament join validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate tournament join'
    });
  }
};

module.exports = validateTournamentJoin;
