/**
 * Groups/Clans Routes for GameOn Platform
 * Handles squads, clans, and group-based activities
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Group = require('../models/Group');
const Achievement = require('../models/Achievement');

// Get user's groups
router.get('/my-groups', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const groups = await Group.getUserGroups(userId);
    
    const formattedGroups = groups.map(group => ({
      id: group._id,
      name: group.name,
      tag: group.tag,
      description: group.description,
      avatar: group.avatar,
      banner: group.banner,
      type: group.type,
      privacy: group.privacy,
      owner: group.owner,
      memberCount: group.memberCount,
      maxMembers: group.maxMembers,
      stats: group.stats,
      rank: group.rank,
      userRole: group.members.find(m => m.user._id.toString() === userId)?.role || 'member',
      joinedAt: group.members.find(m => m.user._id.toString() === userId)?.joinedAt,
      createdAt: group.createdAt
    }));
    
    res.json({
      success: true,
      groups: formattedGroups
    });
    
  } catch (error) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch groups'
    });
  }
});

// Get public groups
router.get('/public', auth, async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    
    const options = {
      type,
      limit: parseInt(limit)
    };
    
    const groups = await Group.getPublicGroups(options);
    
    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedGroups = groups.slice(startIndex, endIndex);
    
    const formattedGroups = paginatedGroups.map(group => ({
      id: group._id,
      name: group.name,
      tag: group.tag,
      description: group.description,
      avatar: group.avatar,
      banner: group.banner,
      type: group.type,
      privacy: group.privacy,
      owner: group.owner,
      memberCount: group.memberCount,
      maxMembers: group.maxMembers,
      stats: group.stats,
      rank: group.rank,
      createdAt: group.createdAt
    }));
    
    res.json({
      success: true,
      groups: formattedGroups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: groups.length,
        hasMore: endIndex < groups.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching public groups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public groups'
    });
  }
});

// Search groups
router.get('/search', auth, async (req, res) => {
  try {
    const { q: searchTerm, privacy, type, page = 1, limit = 10 } = req.query;
    
    if (!searchTerm || searchTerm.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search term must be at least 2 characters'
      });
    }
    
    const options = {
      privacy,
      type,
      limit: parseInt(limit)
    };
    
    const groups = await Group.searchGroups(searchTerm.trim(), options);
    
    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedGroups = groups.slice(startIndex, endIndex);
    
    const formattedGroups = paginatedGroups.map(group => ({
      id: group._id,
      name: group.name,
      tag: group.tag,
      description: group.description,
      avatar: group.avatar,
      type: group.type,
      privacy: group.privacy,
      owner: group.owner,
      memberCount: group.memberCount,
      maxMembers: group.maxMembers,
      stats: group.stats,
      rank: group.rank
    }));
    
    res.json({
      success: true,
      groups: formattedGroups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: groups.length,
        hasMore: endIndex < groups.length
      }
    });
    
  } catch (error) {
    console.error('Error searching groups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search groups'
    });
  }
});

// Create a new group
router.post('/create', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      tag,
      description,
      type = 'squad',
      privacy = 'public',
      maxMembers = 50,
      settings = {}
    } = req.body;
    
    // Validate required fields
    if (!name || !tag) {
      return res.status(400).json({
        success: false,
        message: 'Group name and tag are required'
      });
    }
    
    // Check if user already owns maximum groups
    const userOwnedGroups = await Group.countDocuments({
      owner: userId,
      status: 'active'
    });
    
    if (userOwnedGroups >= 3) {
      return res.status(400).json({
        success: false,
        message: 'You can only own up to 3 groups'
      });
    }
    
    // Check if name or tag already exists
    const existingGroup = await Group.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${name}$`, 'i') } },
        { tag: tag.toUpperCase() }
      ]
    });
    
    if (existingGroup) {
      return res.status(400).json({
        success: false,
        message: 'Group name or tag already exists'
      });
    }
    
    // Create group
    const group = new Group({
      name: name.trim(),
      tag: tag.toUpperCase().trim(),
      description: description?.trim(),
      type,
      privacy,
      maxMembers: Math.min(maxMembers, 100),
      owner: userId,
      members: [{
        user: userId,
        role: 'owner',
        joinedAt: new Date()
      }],
      settings: {
        allowMemberInvites: true,
        requireApprovalForJoin: privacy !== 'public',
        allowMemberChallenges: true,
        showMemberStats: true,
        enableGroupChat: true,
        autoKickInactive: 30,
        minLevelToJoin: 1,
        ...settings
      }
    });
    
    await group.save();
    
    // Update stats
    group.stats.totalMembers = 1;
    await group.save();
    
    // Add achievement for creating first group
    const userGroupsCount = await Group.countDocuments({
      owner: userId,
      status: 'active'
    });
    
    if (userGroupsCount === 1) {
      const achievement = new Achievement({
        user: userId,
        type: 'social',
        category: 'social',
        title: 'Group Founder',
        description: 'Created your first group',
        icon: 'group',
        rarity: 'rare',
        value: 1,
        rewards: {
          xp: 50,
          coins: 25
        }
      });
      await achievement.save();
    }
    
    // Populate group data
    await group.populate('owner', 'username displayName avatar');
    
    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      group: {
        id: group._id,
        name: group.name,
        tag: group.tag,
        description: group.description,
        type: group.type,
        privacy: group.privacy,
        owner: group.owner,
        memberCount: group.memberCount,
        maxMembers: group.maxMembers,
        stats: group.stats,
        settings: group.settings,
        createdAt: group.createdAt
      }
    });
    
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create group'
    });
  }
});

// Get group details
router.get('/:groupId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;
    
    const group = await Group.findOne({
      _id: groupId,
      status: 'active'
    })
    .populate('owner', 'username displayName avatar gameProfile.bgmiName stats.level')
    .populate('admins.user', 'username displayName avatar')
    .populate('members.user', 'username displayName avatar gameProfile.bgmiName gameProfile.tier stats.level stats.xpPoints preferences.privacy.showOnline security.lastLogin')
    .populate('joinRequests.user', 'username displayName avatar gameProfile.bgmiName stats.level')
    .populate('activities.user', 'username displayName avatar');
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    // Check if user is a member or if group is public
    const isMember = group.members.some(member => member.user._id.toString() === userId);
    const isOwner = group.owner._id.toString() === userId;
    const isAdmin = group.admins.some(admin => admin.user._id.toString() === userId);
    
    if (group.privacy === 'private' && !isMember) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to private group'
      });
    }
    
    // Format members with online status
    const formattedMembers = group.members
      .filter(member => member.status === 'active')
      .map(member => {
        const lastSeen = member.user.security?.lastLogin;
        const isOnline = lastSeen && (Date.now() - lastSeen.getTime()) < 5 * 60 * 1000;
        
        let onlineStatus = 'offline';
        if (isOnline) {
          onlineStatus = 'online';
        } else if (lastSeen && (Date.now() - lastSeen.getTime()) < 24 * 60 * 60 * 1000) {
          onlineStatus = 'recently_played';
        }
        
        return {
          user: {
            id: member.user._id,
            username: member.user.username,
            displayName: member.user.displayName,
            avatar: member.user.avatar,
            gameProfile: member.user.gameProfile,
            stats: member.user.stats,
            onlineStatus: member.user.preferences?.privacy?.showOnline ? onlineStatus : 'hidden'
          },
          role: member.role,
          joinedAt: member.joinedAt,
          contributions: member.contributions
        };
      })
      .sort((a, b) => {
        // Sort by role priority, then by contributions
        const rolePriority = { owner: 3, admin: 2, member: 1, recruit: 0 };
        if (rolePriority[a.role] !== rolePriority[b.role]) {
          return rolePriority[b.role] - rolePriority[a.role];
        }
        return b.contributions.totalKills - a.contributions.totalKills;
      });
    
    res.json({
      success: true,
      group: {
        id: group._id,
        name: group.name,
        tag: group.tag,
        description: group.description,
        avatar: group.avatar,
        banner: group.banner,
        type: group.type,
        privacy: group.privacy,
        maxMembers: group.maxMembers,
        owner: group.owner,
        admins: group.admins,
        members: formattedMembers,
        memberCount: group.memberCount,
        stats: group.stats,
        rank: group.rank,
        activities: group.activities.slice(0, 20), // Last 20 activities
        achievements: group.achievements,
        settings: isMember ? group.settings : null, // Only show settings to members
        joinRequests: (isOwner || isAdmin) ? group.joinRequests.filter(req => req.status === 'pending') : [],
        userRole: isMember ? group.members.find(m => m.user._id.toString() === userId)?.role : null,
        canManage: isOwner || isAdmin,
        createdAt: group.createdAt
      }
    });
    
  } catch (error) {
    console.error('Error fetching group details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group details'
    });
  }
});

// Join a group
router.post('/:groupId/join', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;
    const { message } = req.body;
    
    const group = await Group.findOne({
      _id: groupId,
      status: 'active'
    });
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    // Check if user is already a member
    const existingMember = group.members.find(member => member.user.toString() === userId);
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this group'
      });
    }
    
    // Check if group is full
    if (group.memberCount >= group.maxMembers) {
      return res.status(400).json({
        success: false,
        message: 'Group is full'
      });
    }
    
    // Check user level requirement
    const user = await User.findById(userId);
    if (user.stats.level < group.settings.minLevelToJoin) {
      return res.status(400).json({
        success: false,
        message: `Minimum level ${group.settings.minLevelToJoin} required to join`
      });
    }
    
    // Handle different privacy levels
    if (group.privacy === 'public') {
      // Join immediately
      await group.addMember(userId);
      
      res.json({
        success: true,
        message: 'Successfully joined the group',
        status: 'joined'
      });
      
    } else if (group.privacy === 'private' || group.settings.requireApprovalForJoin) {
      // Create join request
      const existingRequest = group.joinRequests.find(req => req.user.toString() === userId && req.status === 'pending');
      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: 'Join request already pending'
        });
      }
      
      group.joinRequests.push({
        user: userId,
        message: message?.trim() || '',
        status: 'pending'
      });
      
      await group.save();
      
      res.json({
        success: true,
        message: 'Join request sent successfully',
        status: 'pending'
      });
      
    } else {
      return res.status(400).json({
        success: false,
        message: 'Cannot join this group'
      });
    }
    
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join group'
    });
  }
});

// Leave a group
router.post('/:groupId/leave', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;
    
    const group = await Group.findOne({
      _id: groupId,
      status: 'active'
    });
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    // Check if user is a member
    const member = group.members.find(member => member.user.toString() === userId);
    if (!member) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }
    
    // Owner cannot leave (must transfer ownership first)
    if (member.role === 'owner') {
      return res.status(400).json({
        success: false,
        message: 'Owner cannot leave group. Transfer ownership first.'
      });
    }
    
    // Remove member
    await group.removeMember(userId);
    
    // Remove from admins if applicable
    group.admins = group.admins.filter(admin => admin.user.toString() !== userId);
    await group.save();
    
    res.json({
      success: true,
      message: 'Successfully left the group'
    });
    
  } catch (error) {
    console.error('Error leaving group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave group'
    });
  }
});

// Approve/reject join request
router.post('/:groupId/requests/:requestId/:action', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId, requestId, action } = req.params;
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action'
      });
    }
    
    const group = await Group.findOne({
      _id: groupId,
      status: 'active'
    }).populate('joinRequests.user', 'username displayName avatar');
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    // Check if user can manage requests (owner or admin)
    const isOwner = group.owner.toString() === userId;
    const isAdmin = group.admins.some(admin => admin.user.toString() === userId);
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Find the request
    const request = group.joinRequests.find(req => req._id.toString() === requestId && req.status === 'pending');
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Join request not found'
      });
    }
    
    if (action === 'approve') {
      // Check if group is full
      if (group.memberCount >= group.maxMembers) {
        return res.status(400).json({
          success: false,
          message: 'Group is full'
        });
      }
      
      // Add member
      await group.addMember(request.user._id, userId);
      request.status = 'approved';
      
      res.json({
        success: true,
        message: 'Join request approved',
        newMember: request.user
      });
      
    } else {
      request.status = 'rejected';
      
      res.json({
        success: true,
        message: 'Join request rejected'
      });
    }
    
    await group.save();
    
  } catch (error) {
    console.error('Error handling join request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to handle join request'
    });
  }
});

// Get groups leaderboard
router.get('/leaderboard/:type', auth, async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 10 } = req.query;
    
    if (!['xp', 'members', 'tournaments', 'kills'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid leaderboard type'
      });
    }
    
    const leaderboard = await Group.getLeaderboard(type, parseInt(limit));
    
    const formattedLeaderboard = leaderboard.map((group, index) => ({
      rank: index + 1,
      group: {
        id: group._id,
        name: group.name,
        tag: group.tag,
        avatar: group.avatar,
        type: group.type,
        owner: group.owner,
        memberCount: group.memberCount,
        stats: group.stats,
        rank: group.rank
      }
    }));
    
    res.json({
      success: true,
      leaderboard: formattedLeaderboard,
      type
    });
    
  } catch (error) {
    console.error('Error fetching groups leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard'
    });
  }
});

// Update group settings (owner/admin only)
router.put('/:groupId/settings', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { groupId } = req.params;
    const { settings } = req.body;
    
    const group = await Group.findOne({
      _id: groupId,
      status: 'active'
    });
    
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }
    
    // Check permissions
    const isOwner = group.owner.toString() === userId;
    const isAdmin = group.admins.some(admin => admin.user.toString() === userId);
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Update settings
    group.settings = { ...group.settings, ...settings };
    await group.save();
    
    res.json({
      success: true,
      message: 'Group settings updated',
      settings: group.settings
    });
    
  } catch (error) {
    console.error('Error updating group settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update group settings'
    });
  }
});

module.exports = router;