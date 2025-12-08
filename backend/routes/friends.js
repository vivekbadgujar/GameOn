const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Friend = require('../models/Friend');
const auth = require('../middleware/auth');
const { body, validationResult, query } = require('express-validator');

// Get friends list with pagination and filtering
router.get('/list', [
  auth,
  query('status').optional().isIn(['accepted', 'pending', 'blocked']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('search').optional().isLength({ min: 1, max: 100 }),
  query('online').optional().isBoolean()
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

    const { status = 'accepted', page = 1, limit = 20, search, online } = req.query;
    const userId = req.user.id;
    const skip = (page - 1) * limit;

    // Build query
    let query = {
      $or: [
        { requester: userId, status },
        { recipient: userId, status }
      ]
    };

    // Get friends with populated user data
    const friends = await Friend.find(query)
      .populate({
        path: 'requester',
        select: 'username displayName email avatar gameProfile stats badges lastActive',
        match: search ? {
          $or: [
            { username: { $regex: search, $options: 'i' } },
            { displayName: { $regex: search, $options: 'i' } },
            { 'gameProfile.bgmiName': { $regex: search, $options: 'i' } }
          ]
        } : {}
      })
      .populate({
        path: 'recipient',
        select: 'username displayName email avatar gameProfile stats badges lastActive',
        match: search ? {
          $or: [
            { username: { $regex: search, $options: 'i' } },
            { displayName: { $regex: search, $options: 'i' } },
            { 'gameProfile.bgmiName': { $regex: search, $options: 'i' } }
          ]
        } : {}
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Process friends data
    const processedFriends = friends
      .filter(friendship => friendship.requester && friendship.recipient)
      .map(friendship => {
        const friend = friendship.requester._id.toString() === userId 
          ? friendship.recipient 
          : friendship.requester;

        // Calculate online status
        const lastActiveTime = new Date(friend.lastActive);
        const now = new Date();
        const timeDiff = now - lastActiveTime;
        
        let onlineStatus = 'offline';
        if (timeDiff < 5 * 60 * 1000) { // 5 minutes
          onlineStatus = 'online';
        } else if (timeDiff < 30 * 60 * 1000) { // 30 minutes
          onlineStatus = 'recently_played';
        }

        // Filter by online status if requested
        if (online === 'true' && onlineStatus !== 'online') {
          return null;
        }

        return {
          friendshipId: friendship._id,
          friend: {
            id: friend._id,
            username: friend.username,
            displayName: friend.displayName,
            avatar: friend.avatar,
            gameProfile: friend.gameProfile,
            stats: friend.stats,
            badges: friend.badges || [],
            onlineStatus,
            lastActive: friend.lastActive
          },
          interactions: friendship.interactions,
          friendsSince: friendship.createdAt
        };
      })
      .filter(Boolean);

    // Get total count for pagination
    const totalCount = await Friend.countDocuments(query);

    res.json({
      success: true,
      friends: processedFriends,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching friends list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch friends list'
    });
  }
});

// Search users to add as friends
router.get('/search', [
  auth,
  query('query').isLength({ min: 2, max: 100 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 20 })
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

    const { query: searchQuery, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;
    const skip = (page - 1) * limit;

    // Get existing friend relationships
    const existingFriends = await Friend.find({
      $or: [
        { requester: userId },
        { recipient: userId }
      ]
    }).select('requester recipient status');

    const friendIds = existingFriends.map(f => 
      f.requester.toString() === userId ? f.recipient.toString() : f.requester.toString()
    );

    // Search users excluding current user and existing friends
    const users = await User.find({
      _id: { $nin: [userId, ...friendIds] },
      $or: [
        { username: { $regex: searchQuery, $options: 'i' } },
        { displayName: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } },
        { 'gameProfile.bgmiName': { $regex: searchQuery, $options: 'i' } }
      ]
    })
    .select('username displayName email avatar gameProfile stats badges')
    .sort({ 'stats.level': -1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    // Add friendship status for each user
    const usersWithStatus = users.map(user => {
      const friendship = existingFriends.find(f => 
        f.requester.toString() === user._id.toString() || 
        f.recipient.toString() === user._id.toString()
      );

      return {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        gameProfile: user.gameProfile,
        stats: user.stats,
        badges: user.badges || [],
        friendshipStatus: friendship ? friendship.status : 'none'
      };
    });

    res.json({
      success: true,
      users: usersWithStatus,
      pagination: {
        currentPage: parseInt(page),
        hasNext: users.length === parseInt(limit),
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search users'
    });
  }
});

// Send friend request
router.post('/request', [
  auth,
  body('recipientId').isMongoId()
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

    const { recipientId } = req.body;
    const requesterId = req.user.id;

    // Check if trying to add self
    if (requesterId === recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send friend request to yourself'
      });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if friendship already exists
    const existingFriendship = await Friend.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId }
      ]
    });

    if (existingFriendship) {
      return res.status(400).json({
        success: false,
        message: `Friend request already ${existingFriendship.status}`
      });
    }

    // Create friend request
    const friendRequest = new Friend({
      requester: requesterId,
      recipient: recipientId,
      status: 'pending'
    });

    await friendRequest.save();

    // Emit real-time notification to recipient
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${recipientId}`).emit('friend_request', {
        type: 'friend_request',
        from: {
          id: req.user.id,
          username: req.user.username,
          displayName: req.user.displayName,
          avatar: req.user.avatar
        },
        requestId: friendRequest._id,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Friend request sent successfully',
      requestId: friendRequest._id
    });

  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send friend request'
    });
  }
});

// Get friend requests (received or sent)
router.get('/requests/:type', [
  auth,
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const { type } = req.params; // 'received' or 'sent'
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id;
    const skip = (page - 1) * limit;

    if (!['received', 'sent'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request type. Use "received" or "sent"'
      });
    }

    const query = {
      status: 'pending',
      [type === 'received' ? 'recipient' : 'requester']: userId
    };

    const requests = await Friend.find(query)
      .populate({
        path: type === 'received' ? 'requester' : 'recipient',
        select: 'username displayName avatar gameProfile stats badges'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const processedRequests = requests.map(request => ({
      id: request._id,
      [type === 'received' ? 'requester' : 'recipient']: {
        id: request[type === 'received' ? 'requester' : 'recipient']._id,
        username: request[type === 'received' ? 'requester' : 'recipient'].username,
        displayName: request[type === 'received' ? 'requester' : 'recipient'].displayName,
        avatar: request[type === 'received' ? 'requester' : 'recipient'].avatar,
        gameProfile: request[type === 'received' ? 'requester' : 'recipient'].gameProfile,
        stats: request[type === 'received' ? 'requester' : 'recipient'].stats,
        badges: request[type === 'received' ? 'requester' : 'recipient'].badges || []
      },
      requestedAt: request.createdAt
    }));

    const totalCount = await Friend.countDocuments(query);

    res.json({
      success: true,
      requests: processedRequests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch friend requests'
    });
  }
});

// Accept friend request
router.post('/requests/:requestId/accept', auth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const friendRequest = await Friend.findOne({
      _id: requestId,
      recipient: userId,
      status: 'pending'
    }).populate('requester', 'username displayName avatar');

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    // Update request status
    friendRequest.status = 'accepted';
    friendRequest.acceptedAt = new Date();
    await friendRequest.save();

    // Update both users' friend counts
    await User.updateMany(
      { _id: { $in: [friendRequest.requester._id, userId] } },
      { $inc: { 'stats.friendsCount': 1 } }
    );

    // Emit real-time notification to requester
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${friendRequest.requester._id}`).emit('friend_request_accepted', {
        type: 'friend_request_accepted',
        from: {
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
      message: 'Friend request accepted',
      friendship: {
        id: friendRequest._id,
        friend: friendRequest.requester,
        friendsSince: friendRequest.acceptedAt
      }
    });

  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept friend request'
    });
  }
});

// Decline friend request
router.post('/requests/:requestId/decline', auth, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const friendRequest = await Friend.findOne({
      _id: requestId,
      recipient: userId,
      status: 'pending'
    });

    if (!friendRequest) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    // Update request status
    friendRequest.status = 'declined';
    await friendRequest.save();

    res.json({
      success: true,
      message: 'Friend request declined'
    });

  } catch (error) {
    console.error('Error declining friend request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline friend request'
    });
  }
});

// Remove friend
router.delete('/:friendId', auth, async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.id;

    const friendship = await Friend.findOne({
      $or: [
        { requester: userId, recipient: friendId },
        { requester: friendId, recipient: userId }
      ],
      status: 'accepted'
    });

    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: 'Friendship not found'
      });
    }

    // Remove friendship
    await Friend.deleteOne({ _id: friendship._id });

    // Update both users' friend counts
    await User.updateMany(
      { _id: { $in: [userId, friendId] } },
      { $inc: { 'stats.friendsCount': -1 } }
    );

    res.json({
      success: true,
      message: 'Friend removed successfully'
    });

  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove friend'
    });
  }
});

// Get referral information
router.get('/referral', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('referral stats');
    
    if (!user.referral || !user.referral.code) {
      // Generate referral code if not exists
      const referralCode = `${user.username.toUpperCase().slice(0, 4)}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      user.referral = {
        code: referralCode,
        totalReferrals: 0,
        successfulReferrals: 0,
        referralEarnings: 0,
        referredUsers: []
      };
      await user.save();
    }

    // Calculate referral tier and next milestone
    const referralCount = user.referral.successfulReferrals || 0;
    const tiers = [
      { level: 0, required: 1, reward: { coins: 50, xp: 100, badge: null } },
      { level: 1, required: 5, reward: { coins: 250, xp: 500, badge: 'Bronze Recruiter' } },
      { level: 2, required: 10, reward: { coins: 500, xp: 1000, badge: 'Silver Recruiter' } },
      { level: 3, required: 25, reward: { coins: 1000, xp: 2500, badge: 'Gold Recruiter' } },
      { level: 4, required: 50, reward: { coins: 2000, xp: 5000, badge: 'Platinum Recruiter' } },
      { level: 5, required: 100, reward: { coins: 5000, xp: 10000, badge: 'Diamond Recruiter' } }
    ];

    let currentTier = tiers.find(tier => referralCount >= tier.required) || tiers[0];
    let nextTier = tiers.find(tier => referralCount < tier.required);

    const referralLink = `${process.env.FRONTEND_URL || 'https://gameonesport.xyz'}/register?ref=${user.referral.code}`;

    res.json({
      success: true,
      referral: {
        code: user.referral.code,
        link: referralLink,
        totalReferrals: user.referral.totalReferrals || 0,
        successfulReferrals: user.referral.successfulReferrals || 0,
        referralEarnings: user.referral.referralEarnings || 0,
        currentTier: {
          level: currentTier.level,
          badge: currentTier.reward.badge,
          achieved: referralCount >= currentTier.required
        },
        nextTier: nextTier ? {
          level: nextTier.level,
          required: nextTier.required,
          remaining: nextTier.required - referralCount,
          reward: nextTier.reward
        } : null,
        allTiers: tiers
      }
    });

  } catch (error) {
    console.error('Error fetching referral info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch referral information'
    });
  }
});

// Get friends leaderboard
router.get('/leaderboard', [
  auth,
  query('type').optional().isIn(['xp', 'level', 'tournaments', 'wins', 'kills', 'earnings']),
  query('timeframe').optional().isIn(['week', 'month', 'all'])
], async (req, res) => {
  try {
    const { type = 'xp', timeframe = 'week' } = req.query;
    const userId = req.user.id;

    // Get user's friends
    const friendships = await Friend.find({
      $or: [
        { requester: userId, status: 'accepted' },
        { recipient: userId, status: 'accepted' }
      ]
    });

    const friendIds = friendships.map(f => 
      f.requester.toString() === userId ? f.recipient : f.requester
    );

    // Include current user in leaderboard
    friendIds.push(userId);

    // Build aggregation pipeline based on type and timeframe
    let matchStage = { _id: { $in: friendIds } };
    let sortField = `stats.${type === 'xp' ? 'xpPoints' : type}`;

    if (timeframe !== 'all') {
      const timeLimit = new Date();
      if (timeframe === 'week') {
        timeLimit.setDate(timeLimit.getDate() - 7);
      } else if (timeframe === 'month') {
        timeLimit.setMonth(timeLimit.getMonth() - 1);
      }
      // For time-based filtering, we'd need additional fields in user stats
      // For now, we'll use all-time data
    }

    const users = await User.find(matchStage)
      .select('username displayName avatar gameProfile stats badges')
      .sort({ [sortField]: -1 })
      .limit(50);

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      user: {
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        gameProfile: user.gameProfile,
        stats: user.stats,
        badges: user.badges || []
      },
      value: user.stats[type === 'xp' ? 'xpPoints' : type] || 0,
      isCurrentUser: user._id.toString() === userId
    }));

    res.json({
      success: true,
      leaderboard,
      type,
      timeframe
    });

  } catch (error) {
    console.error('Error fetching friends leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard'
    });
  }
});

module.exports = router;