/**
 * Admin Tournament Management Routes
 * Handles tournament creation, editing, deletion, and management
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Tournament = require('../../models/Tournament');
const User = require('../../models/User');
const Transaction = require('../../models/Transaction');
const { authenticateAdmin, requirePermission } = require('../../middleware/adminAuth');
const router = express.Router();

// Middleware to protect all admin tournament routes
router.use(authenticateAdmin);

// Get all tournaments with detailed information
router.get('/', requirePermission('tournaments_manage'), async (req, res) => {
  try {
    const tournaments = await Tournament.find({})
      .sort({ createdAt: -1 })
      .populate('participants.user', 'name gameID');

    res.json({
      success: true,
      data: tournaments
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tournaments',
      error: error.message
    });
  }
});

// Get single tournament details
router.get('/:id', requirePermission('tournaments_manage'), async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('participants.user', 'name gameID email')
      .populate('winners.user', 'name gameID email');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    res.json({
      success: true,
      data: tournament
    });
  } catch (error) {
    console.error('Error fetching tournament details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tournament details',
      error: error.message
    });
  }
});

// Create new tournament
router.post('/', 
  requirePermission('tournaments_manage'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('game').notEmpty().withMessage('Game is required'),
    body('tournamentType').isIn(['solo', 'duo', 'squad']).withMessage('Invalid tournament type'),
    body('entryFee').isNumeric().withMessage('Entry fee must be a number'),
    body('prizePool').isNumeric().withMessage('Prize pool must be a number'),
    body('maxParticipants').isNumeric().withMessage('Max participants must be a number'),
    body('startDate').isISO8601().withMessage('Start date must be a valid date')
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      // Create new tournament
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
  async (req, res) => {
    try {
      const tournamentId = req.params.id;
      const updates = req.body;
      
      // Prevent updating certain fields directly
      delete updates.participants;
      delete updates.winners;
      delete updates.createdBy;
      
      const tournament = await Tournament.findByIdAndUpdate(
        tournamentId,
        { ...updates, updatedAt: Date.now() },
        { new: true, runValidators: true }
      );
      
      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: 'Tournament not found'
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
      
      // Check if tournament has participants
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

// Set room details (ID and password)
router.post('/:id/set-room', 
  requirePermission('tournaments_manage'),
  [
    body('roomId').notEmpty().withMessage('Room ID is required'),
    body('password').notEmpty().withMessage('Room password is required')
  ],
  async (req, res) => {
    try {
      // Validate request
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
      
      // Update room details
      tournament.roomDetails = { roomId, password };
      
      // If tournament is upcoming, set it to live
      if (tournament.status === 'upcoming') {
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

// Distribute rewards for a tournament
router.post('/:id/distribute-rewards', 
  requirePermission('tournaments_manage'),
  async (req, res) => {
    try {
      const tournamentId = req.params.id;
      const { winners, isAutomatic } = req.body;
      
      const tournament = await Tournament.findById(tournamentId);
      
      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: 'Tournament not found'
        });
      }
      
      // Check if tournament is completed
      if (tournament.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot distribute rewards for a tournament that is not completed'
        });
      }
      
      // Check if rewards already distributed
      if (tournament.rewardsDistributed) {
        return res.status(400).json({
          success: false,
          message: 'Rewards have already been distributed for this tournament'
        });
      }
      
      // Process winners and distribute rewards
      let updatedWinners = [];
      const transactions = [];
      
      if (isAutomatic) {
        // Automatic distribution based on tournament rules and results
        // This would typically use some algorithm based on tournament performance
        // For now, we'll use a simple distribution based on position
        
        // Get top participants based on scores
        const sortedParticipants = [...tournament.participants].sort((a, b) => b.score - a.score);
        const prizeDistribution = calculatePrizeDistribution(tournament.prizePool, tournament.tournamentType);
        
        // Assign prizes to top players
        for (let i = 0; i < prizeDistribution.length && i < sortedParticipants.length; i++) {
          const participant = sortedParticipants[i];
          const prize = prizeDistribution[i];
          
          updatedWinners.push({
            user: participant.user,
            position: i + 1,
            prize: prize,
            paymentStatus: 'pending'
          });
          
          // Create transaction record
          transactions.push({
            user: participant.user,
            amount: prize,
            type: 'prize',
            description: `Prize for ${tournament.title} (Position: ${i + 1})`,
            status: 'completed',
            tournamentId: tournament._id
          });
        }
      } else {
        // Manual distribution based on admin input
        if (!winners || !Array.isArray(winners) || winners.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Winners data is required for manual distribution'
          });
        }
        
        // Validate winners data
        for (const winner of winners) {
          if (!winner.userId || !winner.position || !winner.prize) {
            return res.status(400).json({
              success: false,
              message: 'Each winner must have userId, position, and prize'
            });
          }
          
          // Check if user exists and participated in tournament
          const userExists = tournament.participants.some(p => p.user.toString() === winner.userId);
          if (!userExists) {
            return res.status(400).json({
              success: false,
              message: `User ${winner.userId} did not participate in this tournament`
            });
          }
          
          updatedWinners.push({
            user: winner.userId,
            position: winner.position,
            prize: winner.prize,
            paymentStatus: 'pending'
          });
          
          // Create transaction record
          transactions.push({
            user: winner.userId,
            amount: winner.prize,
            type: 'prize',
            description: `Prize for ${tournament.title} (Position: ${winner.position})`,
            status: 'completed',
            tournamentId: tournament._id
          });
        }
      }
      
      // Update tournament with winners and mark rewards as distributed
      tournament.winners = updatedWinners;
      tournament.rewardsDistributed = true;
      tournament.status = 'completed';
      await tournament.save();
      
      // Create transactions for all winners
      if (transactions.length > 0) {
        await Transaction.insertMany(transactions);
        
        // Update user wallets
        for (const transaction of transactions) {
          await User.findByIdAndUpdate(
            transaction.user,
            { $inc: { walletBalance: transaction.amount } }
          );
        }
      }
      
      res.json({
        success: true,
        message: 'Tournament rewards distributed successfully',
        data: {
          winners: updatedWinners,
          totalDistributed: updatedWinners.reduce((sum, w) => sum + w.prize, 0)
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

// Helper function to calculate prize distribution
function calculatePrizeDistribution(prizePool, tournamentType) {
  // Default distribution percentages based on tournament type
  let distribution;
  
  switch (tournamentType) {
    case 'solo':
      // Solo tournaments typically have more winners with smaller prizes
      distribution = [0.5, 0.3, 0.15, 0.05]; // 50%, 30%, 15%, 5%
      break;
    case 'duo':
      // Duo tournaments have fewer winners with larger prizes
      distribution = [0.6, 0.3, 0.1]; // 60%, 30%, 10%
      break;
    case 'squad':
      // Squad tournaments usually have fewer winning teams with larger prizes
      distribution = [0.7, 0.3]; // 70%, 30%
      break;
    default:
      distribution = [0.5, 0.3, 0.2]; // Default distribution
  }
  
  // Calculate actual prize amounts
  return distribution.map(percentage => Math.round(prizePool * percentage));
}

module.exports = router;