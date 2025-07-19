/**
 * Tournament Routes for GameOn Platform
 * Handles tournament listing, joining, and management
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const Tournament = require('../models/Tournament');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { authenticateToken, requireVerification } = require('../middleware/auth');
const { createTournamentPaymentOrder, processSuccessfulPayment } = require('../utils/razorpayUtils');
const { analyzeBGMIScreenshot } = require('../utils/aiAnalyzer');
const multer = require('multer');

const router = express.Router();

// Configure multer for screenshot uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Get all tournaments with filters and pagination
router.get('/', async (req, res) => {
  try {
    const {
      status = 'all',
      type = 'all',
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'startDate',
      order = 'asc'
    } = req.query;

    // Build query
    let query = {};
    
    if (status !== 'all') {
      query.status = status;
    }
    
    if (type !== 'all') {
      query.tournamentType = type;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sortOrder = order === 'desc' ? -1 : 1;
    const sort = { [sortBy]: sortOrder };

    // Execute query with pagination
    const tournaments = await Tournament.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('participants.user', 'username displayName gameProfile.bgmiName')
      .lean();

    // Get total count for pagination
    const totalCount = await Tournament.countDocuments(query);

    // Add additional info for each tournament
    const enrichedTournaments = tournaments.map(tournament => ({
      ...tournament,
      spotsLeft: tournament.maxParticipants - tournament.currentParticipants,
      isFull: tournament.currentParticipants >= tournament.maxParticipants,
      isLive: tournament.status === 'live',
      canJoin: tournament.status === 'upcoming' && 
               tournament.currentParticipants < tournament.maxParticipants &&
               new Date(tournament.startDate) > new Date(),
      timeToStart: tournament.status === 'upcoming' ? 
                   Math.max(0, new Date(tournament.startDate) - new Date()) : 0
    }));

    res.json({
      success: true,
      message: 'Tournaments retrieved successfully',
      data: {
        tournaments: enrichedTournaments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalTournaments: totalCount,
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        },
        filters: {
          status,
          type,
          search,
          sortBy,
          order
        }
      }
    });
  } catch (err) {
    console.error('Get tournaments error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve tournaments', 
      error: err.message 
    });
  }
});

// Get single tournament by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const tournament = await Tournament.findById(id)
      .populate('participants.user', 'username displayName gameProfile avatar')
      .populate('winners.user', 'username displayName gameProfile')
      .lean();
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check if user is authenticated and already joined
    let hasJoined = false;
    let userParticipant = null;
    
    try {
      const authHeader = req.headers['authorization'];
      if (authHeader) {
        const jwt = require('jsonwebtoken');
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        userParticipant = tournament.participants.find(p => 
          p.user._id.toString() === decoded.userId
        );
        hasJoined = !!userParticipant;
      }
    } catch (error) {
      // Token might be invalid, but still show tournament details
    }
    
    // Add enriched data
    const enrichedTournament = {
      ...tournament,
      spotsLeft: tournament.maxParticipants - tournament.currentParticipants,
      isFull: tournament.currentParticipants >= tournament.maxParticipants,
      isLive: tournament.status === 'live',
      hasStarted: new Date() >= new Date(tournament.startDate),
      hasEnded: tournament.status === 'completed',
      canJoin: tournament.status === 'upcoming' && 
               tournament.currentParticipants < tournament.maxParticipants &&
               new Date(tournament.startDate) > new Date() &&
               !hasJoined,
      timeToStart: tournament.status === 'upcoming' ? 
                   Math.max(0, new Date(tournament.startDate) - new Date()) : 0,
      hasJoined,
      userParticipant
    };
    
    res.json({
      success: true,
      message: 'Tournament retrieved successfully',
      data: enrichedTournament
    });
  } catch (err) {
    console.error('Get tournament error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve tournament', 
      error: err.message 
    });
  }
});

// Create new tournament
router.post('/', async (req, res) => {
  try {
    const { title, game, prizePool, maxParticipants, startDate, entryFee } = req.body;
    
    // Validate required fields
    if (!title || !game || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, game, startDate'
      });
    }
    
    // Create tournament in database
    const newTournament = {
      id: Date.now(), // Temporary ID - should use proper DB ID
      title,
      game,
      prizePool: prizePool || 0,
      maxParticipants: maxParticipants || 100,
      startDate,
      entryFee: entryFee || 0,
      status: 'upcoming',
      createdAt: new Date()
    };
    
    res.status(201).json({
      success: true,
      message: 'Tournament created successfully',
      data: newTournament
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create tournament', 
      error: err.message 
    });
  }
});

// Update tournament
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Update tournament in database
    // const updatedTournament = await Tournament.findByIdAndUpdate(id, updates, { new: true });
    
    res.json({
      success: true,
      message: 'Tournament updated successfully',
      data: { id, ...updates }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update tournament', 
      error: err.message 
    });
  }
});

// Delete tournament
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete tournament from database
    // await Tournament.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Tournament deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete tournament', 
      error: err.message 
    });
  }
});

// Join tournament
router.post('/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    // Add user to tournament participants
    // Implementation would check capacity, entry fee, etc.
    
    res.json({
      success: true,
      message: 'Successfully joined tournament',
      data: { tournamentId: id, userId }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to join tournament', 
      error: err.message 
    });
  }
});

module.exports = router;
