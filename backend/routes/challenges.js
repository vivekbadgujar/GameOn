const express = require('express');
const router = express.Router();
const Challenge = require('../models/Challenge');
const User = require('../models/User');
const Friend = require('../models/Friend');
const auth = require('../middleware/auth');
const { body, validationResult, query } = require('express-validator');

// Get user's challenges
router.get('/', [
  auth,
  query('status').optional().isIn(['pending', 'accepted', 'active', 'completed', 'cancelled']),
  query('type').optional().isIn(['sent', 'received', 'all']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status, type = 'all', page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (type === 'sent') {
      query.challenger = userId;
    } else if (type === 'received') {
      query.challenged = userId;
    } else {
      query.$or = [
        { challenger: userId },
        { challenged: userId }
      ];
    }

    if (status) {
      query.status = status;
    }

    const challenges = await Challenge.find(query)
      .populate('challenger', 'username displayName avatar gameProfile stats')
      .populate('challenged', 'username displayName avatar gameProfile stats')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const processedChallenges = challenges.map(challenge => ({
      id: challenge._id,
      type: challenge.type,
      game: challenge.game,
      config: challenge.config,
      status: challenge.status,
      challenger: {
        id: challenge.challenger._id,
        username: challenge.challenger.username,
        displayName: challenge.challenger.displayName,
        avatar: challenge.challenger.avatar,
        gameProfile: challenge.challenger.gameProfile,
        stats: challenge.challenger.stats
      },
      challenged: {
        id: challenge.challenged._id,
        username: challenge.challenged.username,
        displayName: challenge.challenged.displayName,
        avatar: challenge.challenged.avatar,
        gameProfile: challenge.challenged.gameProfile,
        stats: challenge.challenged.stats
      },
      scheduledAt: challenge.scheduledAt,
      startedAt: challenge.startedAt,
      completedAt: challenge.completedAt,
      results: challenge.results,
      chat: challenge.chat,
      settings: challenge.settings,
      createdAt: challenge.createdAt,
      isChallenger: challenge.challenger._id.toString() === userId,
      canAccept: challenge.challenged._id.toString() === userId && challenge.status === 'pending',
      canStart: (challenge.challenger._id.toString() === userId || challenge.challenged._id.toString() === userId) && challenge.status === 'accepted'
    }));

    const totalCount = await Challenge.countDocuments(query);

    res.json({
      success: true,
      challenges: processedChallenges,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch challenges'
    });
  }
});

// Create new challenge
router.post('/create', [
  auth,
  body('challengedId').isMongoId(),
  body('type').isIn(['1v1', 'duo', 'squad', 'mini-tournament']),
  body('game').isIn(['BGMI', 'PUBG', 'COD', 'Free Fire']),
  body('config.mode').isString().isLength({ min: 1, max: 50 }),
  body('config.duration').isInt({ min: 5, max: 120 }),
  body('config.entryFee').optional().isInt({ min: 0, max: 10000 }),
  body('scheduledAt').optional().isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { challengedId, type, game, config, scheduledAt, settings } = req.body;
    const challengerId = req.user.id;

    // Check if trying to challenge self
    if (challengerId === challengedId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot challenge yourself'
      });
    }

    // Check if challenged user exists
    const challengedUser = await User.findById(challengedId);
    if (!challengedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if users are friends
    const friendship = await Friend.findOne({
      $or: [
        { requester: challengerId, recipient: challengedId, status: 'accepted' },
        { requester: challengedId, recipient: challengerId, status: 'accepted' }
      ]
    });

    if (!friendship) {
      return res.status(400).json({
        success: false,
        message: 'You can only challenge friends'
      });
    }

    // Check for existing pending challenge between users
    const existingChallenge = await Challenge.findOne({
      $or: [
        { challenger: challengerId, challenged: challengedId, status: { $in: ['pending', 'accepted', 'active'] } },
        { challenger: challengedId, challenged: challengerId, status: { $in: ['pending', 'accepted', 'active'] } }
      ]
    });

    if (existingChallenge) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active challenge with this user'
      });
    }

    // Calculate prize pool
    const entryFee = config.entryFee || 0;
    const prizePool = entryFee > 0 ? entryFee * 2 * 0.9 : 0; // 10% platform fee

    // Create challenge
    const challenge = new Challenge({
      challenger: challengerId,
      challenged: challengedId,
      type,
      game,
      config: {
        ...config,
        prizePool
      },
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      settings: settings || {
        isPrivate: false,
        allowSpectators: true,
        autoStart: false,
        recordMatch: false
      },
      status: 'pending'
    });

    await challenge.save();

    // Populate challenge data
    await challenge.populate([
      { path: 'challenger', select: 'username displayName avatar gameProfile' },
      { path: 'challenged', select: 'username displayName avatar gameProfile' }
    ]);

    // Emit real-time notification to challenged user
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${challengedId}`).emit('challenge_received', {
        type: 'challenge_received',
        challenge: {
          id: challenge._id,
          type: challenge.type,
          game: challenge.game,
          config: challenge.config,
          challenger: challenge.challenger,
          scheduledAt: challenge.scheduledAt
        },
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Challenge sent successfully',
      challenge: {
        id: challenge._id,
        type: challenge.type,
        game: challenge.game,
        config: challenge.config,
        challenger: challenge.challenger,
        challenged: challenge.challenged,
        status: challenge.status,
        scheduledAt: challenge.scheduledAt,
        settings: challenge.settings,
        createdAt: challenge.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create challenge'
    });
  }
});

// Accept challenge
router.post('/:challengeId/accept', auth, async (req, res) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user.id;

    const challenge = await Challenge.findOne({
      _id: challengeId,
      challenged: userId,
      status: 'pending'
    }).populate('challenger', 'username displayName avatar');

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found or already processed'
      });
    }

    // Update challenge status
    challenge.status = 'accepted';
    challenge.acceptedAt = new Date();
    await challenge.save();

    // Emit real-time notification to challenger
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${challenge.challenger._id}`).emit('challenge_accepted', {
        type: 'challenge_accepted',
        challenge: {
          id: challenge._id,
          type: challenge.type,
          game: challenge.game
        },
        acceptedBy: {
          id: req.user.id,
          username: req.user.username,
          displayName: req.user.displayName,
          avatar: req.user.avatar
        },
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Challenge accepted successfully',
      challenge: {
        id: challenge._id,
        status: challenge.status,
        acceptedAt: challenge.acceptedAt
      }
    });

  } catch (error) {
    console.error('Error accepting challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept challenge'
    });
  }
});

// Decline challenge
router.post('/:challengeId/decline', auth, async (req, res) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user.id;

    const challenge = await Challenge.findOne({
      _id: challengeId,
      challenged: userId,
      status: 'pending'
    }).populate('challenger', 'username displayName avatar');

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found or already processed'
      });
    }

    // Update challenge status
    challenge.status = 'declined';
    await challenge.save();

    // Emit real-time notification to challenger
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${challenge.challenger._id}`).emit('challenge_declined', {
        type: 'challenge_declined',
        challenge: {
          id: challenge._id,
          type: challenge.type,
          game: challenge.game
        },
        declinedBy: {
          id: req.user.id,
          username: req.user.username,
          displayName: req.user.displayName,
          avatar: req.user.avatar
        },
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Challenge declined'
    });

  } catch (error) {
    console.error('Error declining challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline challenge'
    });
  }
});

// Start challenge
router.post('/:challengeId/start', auth, async (req, res) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user.id;

    const challenge = await Challenge.findOne({
      _id: challengeId,
      $or: [{ challenger: userId }, { challenged: userId }],
      status: 'accepted'
    }).populate(['challenger', 'challenged']);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found or not ready to start'
      });
    }

    // Check if scheduled time has passed (if scheduled)
    if (challenge.scheduledAt && new Date() < challenge.scheduledAt) {
      return res.status(400).json({
        success: false,
        message: 'Challenge is scheduled for later'
      });
    }

    // Update challenge status
    challenge.status = 'active';
    challenge.startedAt = new Date();
    await challenge.save();

    // Emit real-time notification to both users
    const io = req.app.get('io');
    if (io) {
      const participants = [challenge.challenger._id, challenge.challenged._id];
      participants.forEach(participantId => {
        io.to(`user_${participantId}`).emit('challenge_started', {
          type: 'challenge_started',
          challenge: {
            id: challenge._id,
            type: challenge.type,
            game: challenge.game,
            config: challenge.config,
            startedAt: challenge.startedAt
          },
          timestamp: new Date()
        });
      });
    }

    res.json({
      success: true,
      message: 'Challenge started successfully',
      challenge: {
        id: challenge._id,
        status: challenge.status,
        startedAt: challenge.startedAt
      }
    });

  } catch (error) {
    console.error('Error starting challenge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start challenge'
    });
  }
});

// Submit challenge results
router.post('/:challengeId/results', [
  auth,
  body('results.winner').optional().isMongoId(),
  body('results.scores').optional().isArray(),
  body('results.screenshots').optional().isArray(),
  body('results.stats').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { challengeId } = req.params;
    const { results } = req.body;
    const userId = req.user.id;

    const challenge = await Challenge.findOne({
      _id: challengeId,
      $or: [{ challenger: userId }, { challenged: userId }],
      status: 'active'
    }).populate(['challenger', 'challenged']);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found or not active'
      });
    }

    // Update challenge results
    if (!challenge.results) {
      challenge.results = {};
    }

    challenge.results[userId] = {
      submittedBy: userId,
      submittedAt: new Date(),
      ...results
    };

    // Check if both players have submitted results
    const bothSubmitted = challenge.challenger._id.toString() in challenge.results && 
                          challenge.challenged._id.toString() in challenge.results;

    if (bothSubmitted) {
      challenge.status = 'completed';
      challenge.completedAt = new Date();

      // Determine winner and update stats
      const challengerResults = challenge.results[challenge.challenger._id];
      const challengedResults = challenge.results[challenge.challenged._id];

      // Simple winner determination (can be made more sophisticated)
      let winner = null;
      if (challengerResults.winner && challengedResults.winner) {
        // If both claim to be winner, need manual review
        challenge.status = 'disputed';
      } else if (challengerResults.winner) {
        winner = challenge.challenger._id;
      } else if (challengedResults.winner) {
        winner = challenge.challenged._id;
      }

      if (winner) {
        challenge.results.finalWinner = winner;
        
        // Update user stats
        const winnerXP = challenge.type === '1v1' ? 25 : challenge.type === 'duo' ? 35 : 50;
        const loserXP = Math.floor(winnerXP * 0.4);

        await User.findByIdAndUpdate(winner, {
          $inc: {
            'stats.xpPoints': winnerXP,
            'stats.challengesWon': 1,
            'stats.totalChallenges': 1
          }
        });

        const loserId = winner.toString() === challenge.challenger._id.toString() 
          ? challenge.challenged._id 
          : challenge.challenger._id;

        await User.findByIdAndUpdate(loserId, {
          $inc: {
            'stats.xpPoints': loserXP,
            'stats.totalChallenges': 1
          }
        });

        // Award prize pool if applicable
        if (challenge.config.prizePool > 0) {
          await User.findByIdAndUpdate(winner, {
            $inc: { 'wallet.balance': challenge.config.prizePool }
          });
        }
      }
    }

    await challenge.save();

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      const otherUserId = userId === challenge.challenger._id.toString() 
        ? challenge.challenged._id 
        : challenge.challenger._id;

      io.to(`user_${otherUserId}`).emit('challenge_results_submitted', {
        type: 'challenge_results_submitted',
        challenge: {
          id: challenge._id,
          status: challenge.status,
          bothSubmitted
        },
        submittedBy: {
          id: req.user.id,
          username: req.user.username,
          displayName: req.user.displayName
        },
        timestamp: new Date()
      });

      if (challenge.status === 'completed') {
        const participants = [challenge.challenger._id, challenge.challenged._id];
        participants.forEach(participantId => {
          io.to(`user_${participantId}`).emit('challenge_completed', {
            type: 'challenge_completed',
            challenge: {
              id: challenge._id,
              winner: challenge.results.finalWinner,
              completedAt: challenge.completedAt
            },
            timestamp: new Date()
          });
        });
      }
    }

    res.json({
      success: true,
      message: bothSubmitted ? 'Challenge completed' : 'Results submitted successfully',
      challenge: {
        id: challenge._id,
        status: challenge.status,
        results: challenge.results,
        completedAt: challenge.completedAt
      }
    });

  } catch (error) {
    console.error('Error submitting challenge results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit results'
    });
  }
});

// Get challenge details
router.get('/:challengeId', auth, async (req, res) => {
  try {
    const { challengeId } = req.params;
    const userId = req.user.id;

    const challenge = await Challenge.findOne({
      _id: challengeId,
      $or: [{ challenger: userId }, { challenged: userId }]
    }).populate([
      { path: 'challenger', select: 'username displayName avatar gameProfile stats' },
      { path: 'challenged', select: 'username displayName avatar gameProfile stats' }
    ]);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    res.json({
      success: true,
      challenge: {
        id: challenge._id,
        type: challenge.type,
        game: challenge.game,
        config: challenge.config,
        status: challenge.status,
        challenger: challenge.challenger,
        challenged: challenge.challenged,
        scheduledAt: challenge.scheduledAt,
        startedAt: challenge.startedAt,
        completedAt: challenge.completedAt,
        acceptedAt: challenge.acceptedAt,
        results: challenge.results,
        chat: challenge.chat,
        settings: challenge.settings,
        createdAt: challenge.createdAt,
        isChallenger: challenge.challenger._id.toString() === userId
      }
    });

  } catch (error) {
    console.error('Error fetching challenge details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch challenge details'
    });
  }
});

// Add message to challenge chat
router.post('/:challengeId/chat', [
  auth,
  body('message').isString().isLength({ min: 1, max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { challengeId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    const challenge = await Challenge.findOne({
      _id: challengeId,
      $or: [{ challenger: userId }, { challenged: userId }]
    }).populate(['challenger', 'challenged']);

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    const chatMessage = {
      id: new Date().getTime().toString(),
      userId,
      username: req.user.username,
      displayName: req.user.displayName,
      message,
      timestamp: new Date()
    };

    challenge.chat.push(chatMessage);
    await challenge.save();

    // Emit real-time message
    const io = req.app.get('io');
    if (io) {
      const otherUserId = userId === challenge.challenger._id.toString() 
        ? challenge.challenged._id 
        : challenge.challenger._id;

      io.to(`user_${otherUserId}`).emit('challenge_message', {
        challengeId: challenge._id,
        message: chatMessage
      });
    }

    res.json({
      success: true,
      message: chatMessage
    });

  } catch (error) {
    console.error('Error sending challenge message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

module.exports = router;