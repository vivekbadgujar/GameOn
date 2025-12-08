const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Friend = require('../models/Friend');
const { authenticateToken: auth } = require('../middleware/auth');

// Get friends list
router.get('/list', auth, async (req, res) => {
  try {
    const { status = 'accepted', page = 1, limit = 20 } = req.query;
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
      .populate('requester', 'username displayName email avatar gameProfile stats badges lastActive')
      .populate('recipient', 'username displayName email avatar gameProfile stats badges lastActive')
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
          interactions: friendship.interactions || {},
          friendsSince: friendship.createdAt
        };
      });

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
router.get('/search', auth, async (req, res) => {
  try {
    const { query: searchQuery, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;
    const skip = (page - 1) * limit;

    if (!searchQuery || searchQuery.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

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
router.post('/request', auth, async (req, res) => {
  try {
    const { recipientId } = req.body;
    const requesterId = req.user.id;

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID is required'
      });
    }

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

    const referralLink = `${process.env.FRONTEND_URL || 'https://gameonesport.xyz'}/register?ref=${user.referral.code}`;

    res.json({
      success: true,
      referral: {
        code: user.referral.code,
        link: referralLink,
        totalReferrals: user.referral.totalReferrals || 0,
        successfulReferrals: user.referral.successfulReferrals || 0,
        referralEarnings: user.referral.referralEarnings || 0
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

module.exports = router;