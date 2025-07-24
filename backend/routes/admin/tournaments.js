/**
 * Admin Tournament Management Routes
 * Handles tournament creation, editing, deletion, and management
 */

const express = require('express');
const { validationResult } = require('express-validator');
const Tournament = require('../../models/Tournament');
const User = require('../../models/User');
const Transaction = require('../../models/Transaction');
const { authenticateAdmin, requirePermission, auditLog } = require('../../middleware/adminAuth');
const { validateTournament, validateRoomDetails, validateWinnerDistribution } = require('../../middleware/tournamentValidation');
const router = express.Router();

// Middleware to protect all admin tournament routes
router.use(authenticateAdmin);

// Get all tournaments with filtering and pagination
router.get('/', 
  requirePermission('tournaments_manage'),
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Build filter object
      const filter = {};
      if (req.query.status) filter.status = req.query.status;
      if (req.query.game) filter.game = req.query.game;
      if (req.query.type) filter.tournamentType = req.query.type;
      if (req.query.startDate) {
        filter.startDate = {
          $gte: new Date(req.query.startDate),
          $lt: new Date(new Date(req.query.startDate).setDate(new Date(req.query.startDate).getDate() + 1))
        };
      }

      // Get total count for pagination
      const total = await Tournament.countDocuments(filter);

      // Get tournaments with populated fields
      const tournaments = await Tournament.find(filter)
        .sort({ startDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('participants.user', 'username displayName gameProfile.bgmiId')
        .populate('winners.user', 'username displayName')
        .lean();

      // Add statistics for each tournament
      const tournamentsWithStats = tournaments.map(tournament => ({
        ...tournament,
        stats: {
          fillRate: (tournament.currentParticipants / tournament.maxParticipants) * 100,
          totalPrize: tournament.winners.reduce((sum, w) => sum + (w.prize || 0), 0),
          averageKills: tournament.participants.reduce((sum, p) => sum + p.kills, 0) / tournament.currentParticipants || 0
        }
      }));

      res.json({
        success: true,
        data: tournamentsWithStats,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
        }
      });
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tournaments',
        error: error.message
      });
    }
  }
);

// Get tournament statistics
router.get('/stats', 
  requirePermission('tournaments_manage'),
  async (req, res) => {
    try {
      const timeRange = req.query.range || '30d'; // Default to last 30 days
      const now = new Date();
      let startDate;

      switch(timeRange) {
        case '7d':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case '30d':
          startDate = new Date(now.setDate(now.getDate() - 30));
          break;
        case '90d':
          startDate = new Date(now.setDate(now.getDate() - 90));
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 30));
      }

      const stats = await Tournament.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: null,
            totalTournaments: { $sum: 1 },
            totalParticipants: { $sum: '$currentParticipants' },
            totalPrizePool: { $sum: '$prizePool' },
            averageParticipants: { $avg: '$currentParticipants' },
            completedTournaments: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            cancelledTournaments: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            }
          }
        }
      ]);

      // Get tournament type distribution
      const typeDistribution = await Tournament.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$tournamentType',
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          overview: stats[0] || {
            totalTournaments: 0,
            totalParticipants: 0,
            totalPrizePool: 0,
            averageParticipants: 0,
            completedTournaments: 0,
            cancelledTournaments: 0
          },
          typeDistribution: typeDistribution.reduce((acc, type) => {
            acc[type._id] = type.count;
            return acc;
          }, {})
        }
      });
    } catch (error) {
      console.error('Error fetching tournament stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tournament statistics',
        error: error.message
      });
    }
  }
);

// Get single tournament details with extended information
router.get('/:id', 
  requirePermission('tournaments_manage'),
  async (req, res) => {
    try {
      const tournament = await Tournament.findById(req.params.id)
        .populate('participants.user', 'username displayName gameProfile email')
        .populate('winners.user', 'username displayName gameProfile')
        .lean();

      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: 'Tournament not found'
        });
      }

      // Get related transactions
      const transactions = await Transaction.find({
        tournamentId: tournament._id
      }).populate('user', 'username displayName');

      // Calculate tournament statistics
      const stats = {
        fillRate: (tournament.currentParticipants / tournament.maxParticipants) * 100,
        totalPrize: tournament.winners.reduce((sum, w) => sum + (w.prize || 0), 0),
        averageKills: tournament.participants.reduce((sum, p) => sum + p.kills, 0) / tournament.currentParticipants || 0,
        totalTransactions: transactions.length,
        totalRevenue: tournament.currentParticipants * tournament.entryFee
      };

      res.json({
        success: true,
        data: {
          ...tournament,
          stats,
          transactions
        }
      });
    } catch (error) {
      console.error('Error fetching tournament details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tournament details',
        error: error.message
      });
    }
  }
);

// Create new tournament
router.post('/', 
  requirePermission('tournaments_manage'),
  validateTournament,
  auditLog('create_tournament'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const tournament = new Tournament({
        ...req.body,
        createdBy: req.admin._id
      });

      await tournament.save();

      // Update admin stats
      await req.admin.updateOne({ $inc: { totalTournamentsCreated: 1 } });

      res.status(201).json({
        success: true,
        message: 'Tournament created successfully',
        data: tournament
      });
    } catch (error) {
      console.error('Error creating tournament:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create tournament',
        error: error.message
      });
    }
  }
);

// Update tournament
router.put('/:id', 
  requirePermission('tournaments_manage'),
  validateTournament,
  auditLog('update_tournament'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const tournamentId = req.params.id;
      const updates = req.body;
      
      // Prevent updating certain fields directly
      delete updates.participants;
      delete updates.winners;
      delete updates.createdBy;
      delete updates.currentParticipants;
      
      const tournament = await Tournament.findById(tournamentId);
      
      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: 'Tournament not found'
        });
      }

      // Check if tournament can be updated
      if (['completed', 'cancelled'].includes(tournament.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update completed or cancelled tournament'
        });
      }

      // If tournament is live, only allow updating certain fields
      if (tournament.status === 'live') {
        const allowedUpdates = ['endDate', 'rules', 'roomDetails'];
        Object.keys(updates).forEach(key => {
          if (!allowedUpdates.includes(key)) {
            delete updates[key];
          }
        });
      }

      Object.assign(tournament, updates);
      await tournament.save();
      
      res.json({
        success: true,
        message: 'Tournament updated successfully',
        data: tournament
      });
    } catch (error) {
      console.error('Error updating tournament:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update tournament',
        error: error.message
      });
    }
  }
);

// Delete tournament
router.delete('/:id', 
  requirePermission('tournaments_manage'),
  auditLog('delete_tournament'),
  async (req, res) => {
    try {
      const tournamentId = req.params.id;
      const tournament = await Tournament.findById(tournamentId);
      
      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: 'Tournament not found'
        });
      }
      
      // Check if tournament can be deleted
      if (tournament.currentParticipants > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete tournament with participants. Cancel it instead.'
        });
      }
      
      await Tournament.findByIdAndDelete(tournamentId);
      
      res.json({
        success: true,
        message: 'Tournament deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting tournament:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete tournament',
        error: error.message
      });
    }
  }
);

// Set room details
router.post('/:id/set-room', 
  requirePermission('tournaments_manage'),
  validateRoomDetails,
  auditLog('set_tournament_room'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const tournamentId = req.params.id;
      const { roomId, password } = req.body;
      
      const tournament = await Tournament.findById(tournamentId);
      
      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: 'Tournament not found'
        });
      }
      
      // Check if tournament can have room details set
      if (!['upcoming', 'live'].includes(tournament.status)) {
        return res.status(400).json({
          success: false,
          message: 'Can only set room details for upcoming or live tournaments'
        });
      }
      
      // Update room details
      tournament.roomDetails = { roomId, password };
      
      // If tournament is upcoming and has participants, set it to live
      if (tournament.status === 'upcoming' && tournament.currentParticipants > 0) {
        tournament.status = 'live';
      }
      
      await tournament.save();
      
      res.json({
        success: true,
        message: 'Room details set successfully',
        data: {
          roomId,
          password,
          status: tournament.status
        }
      });
    } catch (error) {
      console.error('Error setting room details:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to set room details',
        error: error.message
      });
    }
  }
);

// Distribute rewards
router.post('/:id/distribute-rewards', 
  requirePermission('tournaments_manage'),
  validateWinnerDistribution,
  auditLog('distribute_tournament_rewards'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const tournamentId = req.params.id;
      const { winners, isAutomatic } = req.body;
      
      const tournament = await Tournament.findById(tournamentId)
        .populate('participants.user');
      
      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: 'Tournament not found'
        });
      }
      
      // Check if tournament is ready for reward distribution
      if (tournament.status !== 'live') {
        return res.status(400).json({
          success: false,
          message: 'Tournament must be live before distributing rewards'
        });
      }
      
      // Check if rewards already distributed
      if (tournament.winners && tournament.winners.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Rewards have already been distributed for this tournament'
        });
      }
      
      // Process winners and distribute rewards
      let updatedWinners = [];
      const transactions = [];
      
      if (isAutomatic) {
        // Sort participants by kills and rank for automatic distribution
        const sortedParticipants = [...tournament.participants].sort((a, b) => {
          if (a.kills === b.kills) {
            return a.rank - b.rank;
          }
          return b.kills - a.kills;
        });

        const prizeDistribution = calculatePrizeDistribution(
          tournament.prizePool,
          tournament.tournamentType
        );
        
        // Assign prizes to top players
        for (let i = 0; i < prizeDistribution.length && i < sortedParticipants.length; i++) {
          const participant = sortedParticipants[i];
          const prize = prizeDistribution[i];
          
          updatedWinners.push({
            user: participant.user._id,
            position: i + 1,
            prize,
            kills: participant.kills,
            rank: participant.rank
          });
          
          // Create transaction record
          transactions.push({
            user: participant.user._id,
            amount: prize,
            type: 'tournament_prize',
            description: `Prize for ${tournament.title} (Position: ${i + 1}, Kills: ${participant.kills})`,
            status: 'completed',
            tournamentId: tournament._id
          });

          // Update user stats
          await User.findByIdAndUpdate(participant.user._id, {
            $inc: {
              'stats.totalEarnings': prize,
              'stats.tournamentsWon': 1,
              'wallet.balance': prize
            }
          });
        }
      } else {
        // Manual distribution
        if (!winners || winners.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Winners data is required for manual distribution'
          });
        }
        
        // Validate total prize amount
        const totalPrize = winners.reduce((sum, w) => sum + w.prize, 0);
        if (totalPrize > tournament.prizePool) {
          return res.status(400).json({
            success: false,
            message: 'Total distributed prize cannot exceed prize pool'
          });
        }
        
        // Process each winner
        for (const winner of winners) {
          const participant = tournament.participants.find(
            p => p.user._id.toString() === winner.userId
          );
          
          if (!participant) {
            return res.status(400).json({
              success: false,
              message: `User ${winner.userId} did not participate in this tournament`
            });
          }
          
          updatedWinners.push({
            user: winner.userId,
            position: winner.position,
            prize: winner.prize,
            kills: participant.kills,
            rank: participant.rank
          });
          
          // Create transaction record
          transactions.push({
            user: winner.userId,
            amount: winner.prize,
            type: 'tournament_prize',
            description: `Prize for ${tournament.title} (Position: ${winner.position}, Kills: ${participant.kills})`,
            status: 'completed',
            tournamentId: tournament._id
          });

          // Update user stats
          await User.findByIdAndUpdate(winner.userId, {
            $inc: {
              'stats.totalEarnings': winner.prize,
              'stats.tournamentsWon': 1,
              'wallet.balance': winner.prize
            }
          });
        }
      }
      
      // Update tournament
      tournament.winners = updatedWinners;
      tournament.status = 'completed';
      tournament.endDate = new Date();
      await tournament.save();
      
      // Create transactions
      await Transaction.insertMany(transactions);
      
      res.json({
        success: true,
        message: 'Tournament rewards distributed successfully',
        data: {
          winners: updatedWinners,
          totalDistributed: updatedWinners.reduce((sum, w) => sum + w.prize, 0),
          transactions: transactions.length
        }
      });
    } catch (error) {
      console.error('Error distributing rewards:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to distribute rewards',
        error: error.message
      });
    }
  }
);

// Cancel tournament
router.post('/:id/cancel',
  requirePermission('tournaments_manage'),
  auditLog('cancel_tournament'),
  async (req, res) => {
    try {
      const tournamentId = req.params.id;
      const tournament = await Tournament.findById(tournamentId)
        .populate('participants.user');
      
      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: 'Tournament not found'
        });
      }
      
      // Check if tournament can be cancelled
      if (!['upcoming', 'live'].includes(tournament.status)) {
        return res.status(400).json({
          success: false,
          message: 'Can only cancel upcoming or live tournaments'
        });
      }
      
      // Process refunds if tournament has participants
      const refundTransactions = [];
      if (tournament.currentParticipants > 0) {
        for (const participant of tournament.participants) {
          refundTransactions.push({
            user: participant.user._id,
            amount: tournament.entryFee,
            type: 'tournament_refund',
            description: `Refund for cancelled tournament: ${tournament.title}`,
            status: 'completed',
            tournamentId: tournament._id
          });

          // Update user wallet
          await User.findByIdAndUpdate(participant.user._id, {
            $inc: { 'wallet.balance': tournament.entryFee }
          });
        }
        
        // Create refund transactions
        await Transaction.insertMany(refundTransactions);
      }
      
      // Update tournament status
      tournament.status = 'cancelled';
      tournament.endDate = new Date();
      await tournament.save();
      
      res.json({
        success: true,
        message: 'Tournament cancelled successfully',
        data: {
          refundsProcessed: refundTransactions.length,
          totalRefunded: refundTransactions.length * tournament.entryFee
        }
      });
    } catch (error) {
      console.error('Error cancelling tournament:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel tournament',
        error: error.message
      });
    }
  }
);

// Helper function to calculate prize distribution
function calculatePrizeDistribution(prizePool, tournamentType) {
  let distribution;
  
  switch (tournamentType) {
    case 'solo':
      distribution = [0.5, 0.3, 0.15, 0.05]; // 50%, 30%, 15%, 5%
      break;
    case 'duo':
      distribution = [0.6, 0.3, 0.1]; // 60%, 30%, 10%
      break;
    case 'squad':
      distribution = [0.7, 0.3]; // 70%, 30%
      break;
    default:
      distribution = [0.5, 0.3, 0.2]; // Default distribution
  }
  
  return distribution.map(percentage => Math.round(prizePool * percentage));
}

module.exports = router;