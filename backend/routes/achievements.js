/**
 * Achievements Routes for GameOn Platform
 * Handles user achievements, social feed, and gamification
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Friend = require('../models/Friend');
const Achievement = require('../models/Achievement');

// Get user's achievements
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { category, type, rarity, page = 1, limit = 20 } = req.query;
    
    const options = {
      category,
      type,
      rarity,
      limit: parseInt(limit)
    };
    
    const achievements = await Achievement.getUserAchievements(userId, options);
    
    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedAchievements = achievements.slice(startIndex, endIndex);
    
    // Group achievements by category
    const groupedAchievements = paginatedAchievements.reduce((groups, achievement) => {
      const category = achievement.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push({
        id: achievement._id,
        type: achievement.type,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        rarity: achievement.rarity,
        value: achievement.value,
        threshold: achievement.threshold,
        rewards: achievement.rewards,
        status: achievement.status,
        earnedAt: achievement.earnedAt,
        claimedAt: achievement.claimedAt,
        progress: achievement.progress,
        completionPercentage: achievement.completionPercentage,
        rarityScore: achievement.rarityScore,
        likeCount: achievement.likeCount,
        shareCount: achievement.shareCount,
        commentCount: achievement.commentCount
      });
      return groups;
    }, {});
    
    // Calculate achievement stats
    const stats = {
      total: achievements.length,
      claimed: achievements.filter(a => a.status === 'claimed').length,
      unclaimed: achievements.filter(a => a.status === 'earned').length,
      byRarity: {
        common: achievements.filter(a => a.rarity === 'common').length,
        rare: achievements.filter(a => a.rarity === 'rare').length,
        epic: achievements.filter(a => a.rarity === 'epic').length,
        legendary: achievements.filter(a => a.rarity === 'legendary').length,
        mythic: achievements.filter(a => a.rarity === 'mythic').length
      },
      totalXP: achievements.reduce((sum, a) => sum + (a.rewards.xp || 0), 0),
      totalCoins: achievements.reduce((sum, a) => sum + (a.rewards.coins || 0), 0)
    };
    
    res.json({
      success: true,
      achievements: groupedAchievements,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: achievements.length,
        hasMore: endIndex < achievements.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch achievements'
    });
  }
});

// Get social feed (friends' achievements)
router.get('/feed', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    
    // Get user's friends
    const friendships = await Friend.getFriends(userId);
    const friendIds = friendships.map(friendship => {
      return friendship.requester._id.toString() === userId ? friendship.recipient._id : friendship.requester._id;
    });
    
    // Add current user to see their own achievements in feed
    friendIds.push(userId);
    
    const options = {
      limit: parseInt(limit)
    };
    
    const feed = await Achievement.getPublicFeed(friendIds, options);
    
    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedFeed = feed.slice(startIndex, endIndex);
    
    // Format feed items
    const formattedFeed = paginatedFeed.map(achievement => ({
      id: achievement._id,
      user: achievement.user,
      type: achievement.type,
      category: achievement.category,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      rarity: achievement.rarity,
      value: achievement.value,
      rewards: achievement.rewards,
      earnedAt: achievement.earnedAt,
      likeCount: achievement.likeCount,
      shareCount: achievement.shareCount,
      commentCount: achievement.commentCount,
      isLiked: achievement.likes.some(like => like.user._id.toString() === userId),
      comments: achievement.comments.slice(-3).map(comment => ({
        id: comment._id,
        user: comment.user,
        comment: comment.comment,
        timestamp: comment.timestamp,
        likeCount: comment.likes.length,
        isLiked: comment.likes.includes(userId)
      })),
      context: achievement.context
    }));
    
    res.json({
      success: true,
      feed: formattedFeed,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: feed.length,
        hasMore: endIndex < feed.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching achievements feed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch achievements feed'
    });
  }
});

// Like an achievement
router.post('/:achievementId/like', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { achievementId } = req.params;
    
    const achievement = await Achievement.findById(achievementId);
    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }
    
    if (!achievement.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Cannot like private achievement'
      });
    }
    
    await achievement.like(userId);
    
    res.json({
      success: true,
      message: 'Achievement liked',
      likeCount: achievement.likeCount
    });
    
  } catch (error) {
    console.error('Error liking achievement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like achievement'
    });
  }
});

// Unlike an achievement
router.delete('/:achievementId/like', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { achievementId } = req.params;
    
    const achievement = await Achievement.findById(achievementId);
    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }
    
    await achievement.unlike(userId);
    
    res.json({
      success: true,
      message: 'Achievement unliked',
      likeCount: achievement.likeCount
    });
    
  } catch (error) {
    console.error('Error unliking achievement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlike achievement'
    });
  }
});

// Add comment to achievement
router.post('/:achievementId/comments', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { achievementId } = req.params;
    const { comment } = req.body;
    
    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot be empty'
      });
    }
    
    if (comment.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Comment too long (max 500 characters)'
      });
    }
    
    const achievement = await Achievement.findById(achievementId);
    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }
    
    if (!achievement.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Cannot comment on private achievement'
      });
    }
    
    await achievement.addComment(userId, comment.trim());
    
    // Populate the new comment
    await achievement.populate('comments.user', 'username displayName avatar');
    const newComment = achievement.comments[achievement.comments.length - 1];
    
    res.json({
      success: true,
      message: 'Comment added',
      comment: {
        id: newComment._id,
        user: newComment.user,
        comment: newComment.comment,
        timestamp: newComment.timestamp,
        likeCount: newComment.likes.length
      },
      commentCount: achievement.commentCount
    });
    
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    });
  }
});

// Share achievement
router.post('/:achievementId/share', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { achievementId } = req.params;
    const { platform } = req.body;
    
    if (!platform || !['whatsapp', 'telegram', 'instagram', 'facebook', 'twitter'].includes(platform)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sharing platform'
      });
    }
    
    const achievement = await Achievement.findById(achievementId)
      .populate('user', 'username displayName avatar');
    
    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }
    
    if (!achievement.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'Cannot share private achievement'
      });
    }
    
    await achievement.share(userId, platform);
    
    // Generate sharing content
    const shareText = `🏆 ${achievement.user.displayName} just earned "${achievement.title}" on GameOn! ${achievement.description}`;
    const shareUrl = `${process.env.FRONTEND_URL || 'https://gameon-platform.vercel.app'}/achievements/${achievementId}`;
    
    let shareLink = '';
    switch (platform) {
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        break;
      case 'telegram':
        shareLink = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      default:
        shareLink = shareUrl;
    }
    
    res.json({
      success: true,
      message: 'Achievement shared',
      shareCount: achievement.shareCount,
      shareLink
    });
    
  } catch (error) {
    console.error('Error sharing achievement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share achievement'
    });
  }
});

// Claim achievement rewards
router.post('/:achievementId/claim', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { achievementId } = req.params;
    
    const achievement = await Achievement.findOne({
      _id: achievementId,
      user: userId,
      status: 'earned'
    });
    
    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found or already claimed'
      });
    }
    
    // Claim the achievement
    await achievement.claim();
    
    // Award rewards to user
    const user = await User.findById(userId);
    if (achievement.rewards.xp > 0) {
      await user.addXP(achievement.rewards.xp, 'achievement_reward');
    }
    
    if (achievement.rewards.coins > 0) {
      user.wallet.balance += achievement.rewards.coins;
      await user.save();
    }
    
    // Add badge if specified
    if (achievement.rewards.badge) {
      await user.addBadge({
        name: achievement.rewards.badge,
        description: `Earned from ${achievement.title}`,
        icon: achievement.icon,
        category: achievement.category
      });
    }
    
    res.json({
      success: true,
      message: 'Achievement rewards claimed',
      rewards: achievement.rewards,
      claimedAt: achievement.claimedAt
    });
    
  } catch (error) {
    console.error('Error claiming achievement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to claim achievement rewards'
    });
  }
});

// Get achievements leaderboard
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const { type = 'all', timeframe = 'month' } = req.query;
    
    const leaderboard = await Achievement.getLeaderboard(type, timeframe);
    
    res.json({
      success: true,
      leaderboard: leaderboard.map((entry, index) => ({
        rank: index + 1,
        user: {
          id: entry.user._id,
          username: entry.user.username,
          displayName: entry.user.displayName,
          avatar: entry.user.avatar,
          gameProfile: entry.user.gameProfile,
          stats: entry.user.stats
        },
        achievementCount: entry.achievementCount,
        totalXP: entry.totalXP,
        totalCoins: entry.totalCoins,
        rarityScore: entry.rarityScore,
        categories: entry.categories
      })),
      type,
      timeframe
    });
    
  } catch (error) {
    console.error('Error fetching achievements leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard'
    });
  }
});

// Get trending achievements
router.get('/trending', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const trending = await Achievement.getTrendingAchievements(parseInt(limit));
    
    res.json({
      success: true,
      trending: trending.map(trend => ({
        type: trend._id,
        count: trend.count,
        totalLikes: trend.totalLikes,
        totalShares: trend.totalShares,
        trendScore: trend.trendScore,
        recentAchievements: trend.recentAchievements.slice(0, 3).map(achievement => ({
          id: achievement._id,
          user: achievement.user,
          title: achievement.title,
          earnedAt: achievement.earnedAt
        }))
      }))
    });
    
  } catch (error) {
    console.error('Error fetching trending achievements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending achievements'
    });
  }
});

// Get achievement details
router.get('/:achievementId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { achievementId } = req.params;
    
    const achievement = await Achievement.findById(achievementId)
      .populate('user', 'username displayName avatar gameProfile.bgmiName gameProfile.tier stats.level')
      .populate('likes.user', 'username displayName avatar')
      .populate('comments.user', 'username displayName avatar')
      .populate('context.tournamentId', 'title')
      .populate('context.challengeId', 'type');
    
    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'Achievement not found'
      });
    }
    
    // Check if user can view this achievement
    if (!achievement.isPublic && achievement.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      achievement: {
        id: achievement._id,
        user: achievement.user,
        type: achievement.type,
        category: achievement.category,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        rarity: achievement.rarity,
        value: achievement.value,
        threshold: achievement.threshold,
        context: achievement.context,
        rewards: achievement.rewards,
        status: achievement.status,
        earnedAt: achievement.earnedAt,
        claimedAt: achievement.claimedAt,
        progress: achievement.progress,
        completionPercentage: achievement.completionPercentage,
        isPublic: achievement.isPublic,
        likeCount: achievement.likeCount,
        shareCount: achievement.shareCount,
        commentCount: achievement.commentCount,
        isLiked: achievement.likes.some(like => like.user._id.toString() === userId),
        likes: achievement.likes.map(like => ({
          user: like.user,
          timestamp: like.timestamp
        })),
        comments: achievement.comments.map(comment => ({
          id: comment._id,
          user: comment.user,
          comment: comment.comment,
          timestamp: comment.timestamp,
          likeCount: comment.likes.length,
          isLiked: comment.likes.includes(userId)
        })),
        shares: achievement.shares.map(share => ({
          platform: share.platform,
          timestamp: share.timestamp
        }))
      }
    });
    
  } catch (error) {
    console.error('Error fetching achievement details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch achievement details'
    });
  }
});

module.exports = router;