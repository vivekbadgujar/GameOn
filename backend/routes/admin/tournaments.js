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
      if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
      if (req.query.game && req.query.game !== 'all') filter.game = req.query.game;
      if (req.query.type && req.query.type !== 'all') filter.tournamentType = req.query.type;
      
      // For admin panel, show all tournaments including hidden ones
      // Don't filter by isVisible or isPublic
      if (req.query.startDate) {
        filter.startDate = {
          $gte: new Date(req.query.startDate),
          $lt: new Date(new Date(req.query.startDate).setDate(new Date(req.query.startDate).getDate() + 1))
        };
      }

      console.log('Admin tournaments route - Query params:', req.query);
      console.log('Admin tournaments route - Filter:', filter);

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

      console.log('Admin tournaments found:', tournamentsWithStats.length);
      console.log('Sample tournament:', tournamentsWithStats[0] ? {
        id: tournamentsWithStats[0]._id,
        title: tournamentsWithStats[0].title,
        status: tournamentsWithStats[0].status,
        isVisible: tournamentsWithStats[0].isVisible,
        isPublic: tournamentsWithStats[0].isPublic
      } : 'No tournaments');
      console.log('Filter used:', filter);
      console.log('Total count:', total);

      res.json({
        success: true,
        data: tournamentsWithStats,
        tournaments: tournamentsWithStats, // Ensure this field is present
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
        message: 'Tournaments fetched successfully'
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

// Debug route - no authentication required
router.get('/debug', async (req, res) => {
  try {
    console.log('Debug route - No auth required');
    
    const tournaments = await Tournament.find({})
      .sort({ startDate: -1 })
      .lean();

    console.log('Debug route - Found tournaments:', tournaments.length);
    
    res.json({
      success: true,
      data: tournaments,
      tournaments: tournaments,
      total: tournaments.length,
      message: 'Debug tournaments fetched successfully'
    });
  } catch (error) {
    console.error('Debug route error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug route failed',
      error: error.message
    });
  }
});

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

      // Create tournament with proper field mapping
      const tournamentData = {
        title: req.body.title && req.body.title.trim() ? req.body.title.trim() : 'Untitled Tournament',
        description: req.body.description && req.body.description.trim() ? req.body.description.trim() : 'Tournament description not provided',
        game: req.body.game || 'BGMI',
        map: req.body.map || 'TBD',
        tournamentType: req.body.tournamentType || 'squad',
        entryFee: parseInt(req.body.entryFee) || 0,
        prizePool: parseInt(req.body.prizePool) || 0,
        maxParticipants: parseInt(req.body.maxParticipants) || 16,
        currentParticipants: 0,
        startDate: req.body.startDate ? new Date(req.body.startDate) : new Date(Date.now() + 24 * 60 * 60 * 1000),
        endDate: req.body.endDate ? new Date(req.body.endDate) : new Date(Date.now() + 26 * 60 * 60 * 1000),
        rules: Array.isArray(req.body.rules) ? req.body.rules.filter(rule => rule && rule.trim()) : ['No cheating allowed', 'Follow fair play guidelines'],
        status: req.body.status || 'upcoming',
        roomDetails: req.body.roomDetails || {},
        createdBy: req.admin._id,
        participants: [],
        winners: [],
        isVisible: req.body.isVisible !== undefined ? req.body.isVisible : true,
        isPublic: req.body.isPublic !== undefined ? req.body.isPublic : true,
        poster: req.body.poster || req.body.posterUrl || req.body.image || '',
        posterUrl: req.body.posterUrl || req.body.poster || req.body.image || ''
      };

      console.log('Creating tournament with data:', JSON.stringify(tournamentData, null, 2));
      
      const tournament = new Tournament(tournamentData);
      await tournament.save();

      console.log('Tournament saved to database:', tournament._id);

      // Update admin stats
      await req.admin.updateOne({ $inc: { totalTournamentsCreated: 1 } });

      // Emit Socket.IO events for real-time updates
      const io = req.app.get('io');
      if (io) {
        console.log('Emitting socket events for tournament creation');
        console.log('Emitting tournamentAdded', tournament._id);
        // Emit to all clients with structured data
        io.emit('tournamentAdded', {
          type: 'tournamentAdded',
          data: tournament
        });
        // Emit specifically to admin clients
        io.emit('adminUpdate', {
          type: 'tournamentAdded',
          data: tournament
        });
      } else {
        console.warn('Socket.IO not available for real-time updates');
      }

      // Populate the tournament with admin details for response
      await tournament.populate('createdBy', 'name username');
      
      console.log('Sending tournament response:', {
        id: tournament._id,
        title: tournament.title,
        status: tournament.status,
        isVisible: tournament.isVisible,
        isPublic: tournament.isPublic
      });

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

      // Emit Socket.IO events for real-time updates
      const io = req.app.get('io');
      if (io) {
        console.log('Emitting socket events for tournament update');
        // Emit to all clients with structured data
        io.emit('tournamentUpdated', {
          type: 'tournamentUpdated',
          data: tournament
        });
        // Emit specifically to admin clients
        io.emit('adminUpdate', {
          type: 'tournamentUpdated',
          data: tournament
        });
      }
      
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

      // Emit Socket.IO event
      req.app.get('io').emit('tournamentDeleted', tournamentId);
      
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

// Post tournament results
router.post('/:id/results', 
  requirePermission('tournaments_manage'),
  auditLog('post_tournament_results'),
  async (req, res) => {
    try {
      const tournamentId = req.params.id;
      const { results } = req.body;
      
      if (!results || !Array.isArray(results)) {
        return res.status(400).json({
          success: false,
          message: 'Results array is required'
        });
      }
      
      const tournament = await Tournament.findById(tournamentId)
        .populate('participants.user', 'username displayName wallet');
      
      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: 'Tournament not found'
        });
      }
      
      if (tournament.status !== 'live') {
        return res.status(400).json({
          success: false,
          message: 'Can only post results for live tournaments'
        });
      }
      
      // Update participant results
      for (const result of results) {
        const participant = tournament.participants.find(
          p => p.user._id.toString() === result.userId
        );
        
        if (participant) {
          participant.kills = result.kills || 0;
          participant.rank = result.rank || 0;
        }
      }
      
      // Calculate and distribute prizes
      const prizeDistribution = calculatePrizeDistribution(tournament.prizePool, tournament.tournamentType);
      const sortedParticipants = tournament.participants
        .filter(p => p.rank > 0)
        .sort((a, b) => a.rank - b.rank);
      
      const winners = [];
      const transactions = [];
      
      for (let i = 0; i < Math.min(sortedParticipants.length, prizeDistribution.length); i++) {
        const participant = sortedParticipants[i];
        const prize = prizeDistribution[i];
        
        if (prize > 0) {
          winners.push({
            user: participant.user._id,
            prize: prize,
            position: i + 1,
            kills: participant.kills
          });
          
          // Update user wallet
          await User.findByIdAndUpdate(participant.user._id, {
            $inc: { 
              'wallet.balance': prize,
              'stats.totalEarnings': prize,
              'stats.tournamentsWon': i === 0 ? 1 : 0
            }
          });
          
          // Create transaction record
          transactions.push({
            user: participant.user._id,
            amount: prize,
            type: 'tournament_prize',
            description: `Prize for ${tournament.title} (Position: ${i + 1})`,
            status: 'completed',
            tournamentId: tournament._id
          });
        }
      }
      
      // Save transactions
      if (transactions.length > 0) {
        await Transaction.insertMany(transactions);
      }
      
      // Update tournament
      tournament.winners = winners;
      tournament.status = 'completed';
      tournament.endDate = new Date();
      await tournament.save();
      
      // Emit real-time updates
      req.app.get('io').emit('tournamentCompleted', {
        tournamentId: tournament._id,
        winners: winners,
        timestamp: new Date().toISOString()
      });
      
      // Notify all participants
      for (const participant of tournament.participants) {
        req.app.get('emitToUser')(participant.user._id, 'tournament_results', {
          tournamentId: tournament._id,
          tournamentTitle: tournament.title,
          yourRank: participant.rank,
          yourKills: participant.kills,
          yourPrize: winners.find(w => w.user.toString() === participant.user._id.toString())?.prize || 0
        });
      }
      
      res.json({
        success: true,
        message: 'Tournament results posted successfully',
        data: {
          tournament: tournament,
          winners: winners,
          totalPrizeDistributed: winners.reduce((sum, w) => sum + w.prize, 0)
        }
      });
      
    } catch (error) {
      console.error('Error posting tournament results:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to post tournament results',
        error: error.message
      });
    }
  }
);

// Update tournament status
router.patch('/:id/status', 
  requirePermission('tournaments_manage'),
  auditLog('update_tournament_status'),
  async (req, res) => {
    try {
      const tournamentId = req.params.id;
      const { status } = req.body;
      
      // Validate status
      const validStatuses = ['upcoming', 'live', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
        });
      }
      
      const tournament = await Tournament.findById(tournamentId);
      
      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: 'Tournament not found'
        });
      }
      
      // Update status
      tournament.status = status;
      
      // Set end date if completing or cancelling
      if (['completed', 'cancelled'].includes(status)) {
        tournament.endDate = new Date();
      }
      
      await tournament.save();
      
      // Emit Socket.IO events for real-time updates
      const io = req.app.get('io');
      if (io) {
        console.log('Emitting socket events for tournament update');
        // Emit to all clients with structured data
        io.emit('tournamentUpdated', {
          type: 'tournamentUpdated',
          data: tournament
        });
        // Emit specifically to admin clients
        io.emit('adminUpdate', {
          type: 'tournamentUpdated',
          data: tournament
        });
      }
      req.app.get('emitToTournament')(tournamentId, 'tournament_status_updated', {
        tournamentId,
        status,
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        message: 'Tournament status updated successfully',
        data: {
          id: tournament._id,
          status: tournament.status,
          endDate: tournament.endDate
        }
      });
    } catch (error) {
      console.error('Error updating tournament status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update tournament status',
        error: error.message
      });
    }
  }
);

// Update tournament status
router.patch('/:id/status', 
  requirePermission('tournaments_manage'),
  auditLog('update_tournament_status'),
  async (req, res) => {
    try {
      const tournamentId = req.params.id;
      const { status } = req.body;
      
      if (!['upcoming', 'live', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be one of: upcoming, live, completed, cancelled'
        });
      }
      
      const tournament = await Tournament.findById(tournamentId);
      
      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: 'Tournament not found'
        });
      }
      
      // Validate status transitions
      const validTransitions = {
        upcoming: ['live', 'cancelled'],
        live: ['completed', 'cancelled'],
        completed: [], // Cannot change from completed
        cancelled: [] // Cannot change from cancelled
      };
      
      if (!validTransitions[tournament.status].includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot change status from ${tournament.status} to ${status}`
        });
      }
      
      tournament.status = status;
      
      // Set end date if completing tournament
      if (status === 'completed' && !tournament.endDate) {
        tournament.endDate = new Date();
      }
      
      await tournament.save();
      
      // Emit Socket.IO event for real-time updates
      req.app.get('io').emit('tournamentStatusUpdated', {
        tournamentId: tournament._id,
        status: tournament.status,
        endDate: tournament.endDate
      });
      
      const tournaments = await Tournament.find({ status: tournament.status })
        .sort({ createdAt: -1 })
        .populate('createdBy', 'name username')
        .lean();
        
      res.json({
        success: true,
        message: 'Tournament status updated successfully',
        data: tournaments
      });
    } catch (error) {
      console.error('Error updating tournament status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update tournament status',
        error: error.message
      });
    }
  }
);

// Export tournaments
router.get('/export', 
  requirePermission('tournaments_manage'),
  auditLog('export_tournaments'),
  async (req, res) => {
    try {
      const { format = 'csv', status, game, startDate, endDate } = req.query;
      
      // Build filter
      const filter = {};
      if (status) filter.status = status;
      if (game) filter.game = game;
      if (startDate || endDate) {
        filter.startDate = {};
        if (startDate) filter.startDate.$gte = new Date(startDate);
        if (endDate) filter.startDate.$lte = new Date(endDate);
      }

      // Get tournaments
      const tournaments = await Tournament.find(filter)
        .populate('participants.user', 'username email gameProfile.bgmiId')
        .populate('winners.user', 'username email')
        .lean();

      // Transform data for export
      const exportData = tournaments.map(tournament => ({
        id: tournament._id,
        title: tournament.title,
        game: tournament.game,
        status: tournament.status,
        tournamentType: tournament.tournamentType,
        maxParticipants: tournament.maxParticipants,
        currentParticipants: tournament.currentParticipants,
        entryFee: tournament.entryFee,
        prizePool: tournament.prizePool,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        createdAt: tournament.createdAt,
        fillRate: Math.round((tournament.currentParticipants / tournament.maxParticipants) * 100),
        totalPrize: tournament.winners.reduce((sum, w) => sum + (w.prize || 0), 0),
        participantsList: tournament.participants.map(p => p.user.username).join(', '),
        winnersList: tournament.winners.map(w => `${w.user.username} (${w.position})`).join(', ')
      }));

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=tournaments_${new Date().toISOString().split('T')[0]}.json`);
        return res.json(exportData);
      }

      // CSV format
      const csv = require('csv-writer').createObjectCsvWriter;
      const path = require('path');
      const fs = require('fs');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `tournaments_${timestamp}.csv`;
      const filepath = path.join(__dirname, '../../exports', filename);
      
      // Ensure exports directory exists
      const exportDir = path.dirname(filepath);
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      const csvWriter = csv({
        path: filepath,
        header: [
          { id: 'id', title: 'ID' },
          { id: 'title', title: 'Title' },
          { id: 'game', title: 'Game' },
          { id: 'status', title: 'Status' },
          { id: 'tournamentType', title: 'Type' },
          { id: 'maxParticipants', title: 'Max Participants' },
          { id: 'currentParticipants', title: 'Current Participants' },
          { id: 'fillRate', title: 'Fill Rate (%)' },
          { id: 'entryFee', title: 'Entry Fee' },
          { id: 'prizePool', title: 'Prize Pool' },
          { id: 'totalPrize', title: 'Total Prize Distributed' },
          { id: 'startDate', title: 'Start Date' },
          { id: 'endDate', title: 'End Date' },
          { id: 'createdAt', title: 'Created At' },
          { id: 'participantsList', title: 'Participants' },
          { id: 'winnersList', title: 'Winners' }
        ]
      });

      await csvWriter.writeRecords(exportData);

      // Send file
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      
      const fileStream = fs.createReadStream(filepath);
      fileStream.pipe(res);
      
      // Clean up file after sending
      fileStream.on('end', () => {
        fs.unlink(filepath, (err) => {
          if (err) console.error('Error deleting temp file:', err);
        });
      });

    } catch (error) {
      console.error('Error exporting tournaments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export tournaments',
        error: error.message
      });
    }
  }
);

// Add video to tournament
router.post('/:id/video',
  requirePermission('tournaments_manage'),
  auditLog('add_tournament_video'),
  async (req, res) => {
    try {
      const tournamentId = req.params.id;
      const { title, description, youtubeUrl, category, tags, isVisible, displayOrder } = req.body;

      // Validate tournament exists
      const tournament = await Tournament.findById(tournamentId);
      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: 'Tournament not found'
        });
      }

      // Import TournamentVideo model
      const TournamentVideo = require('../../models/TournamentVideo');

      // Extract YouTube ID
      const youtubeId = TournamentVideo.extractYouTubeId(youtubeUrl);
      if (!youtubeId) {
        return res.status(400).json({
          success: false,
          message: 'Invalid YouTube URL. Please use a valid YouTube URL format.'
        });
      }

      // Create video
      const video = new TournamentVideo({
        title,
        description,
        youtubeUrl,
        youtubeId,
        tournament: tournamentId,
        game: tournament.game,
        category: category || 'highlights',
        tags: tags || [],
        isVisible: isVisible !== undefined ? isVisible : false,
        displayOrder: displayOrder || 0,
        createdBy: req.admin._id
      });

      await video.save();

      // Emit Socket.IO events for real-time updates
      const io = req.app.get('io');
      if (io) {
        console.log('Emitting videoAdded event for tournament:', tournamentId);
        // Emit to all clients
        io.emit('videoAdded', {
          type: 'videoAdded',
          data: video
        });
        // Emit specifically to admin clients
        io.emit('adminUpdate', {
          type: 'videoAdded',
          data: video
        });
      }

      // Populate the response
      await video.populate('tournament', 'title game');
      await video.populate('createdBy', 'name');

      res.json({
        success: true,
        message: 'Video added to tournament successfully',
        data: video
      });
    } catch (error) {
      console.error('Error adding video to tournament:', error);
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validation failed: ' + validationErrors.join(', ')
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to add video to tournament',
        error: error.message
      });
    }
  }
);

module.exports = router;