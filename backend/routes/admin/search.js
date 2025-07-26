const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../../models/User');
const Tournament = require('../../models/Tournament');
const Transaction = require('../../models/Transaction');
const Notification = require('../../models/Notification');
const AIFlag = require('../../models/AIFlag');
const Media = require('../../models/Media');
const { authenticateAdmin } = require('../../middleware/adminAuth');

// Search endpoint
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const { q: query, type, limit = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const searchRegex = new RegExp(query, 'i');
    let results = {};
    
    if (!type || type === 'all') {
      // Search across all types
      const [users, tournaments, transactions, notifications, aiFlags, media] = await Promise.all([
        User.find({
          $or: [
            { username: searchRegex },
            { email: searchRegex },
            { 'gameProfile.bgmiId': searchRegex },
            { 'gameProfile.ign': searchRegex }
          ]
        }).select('-password -otp -otpExpiry').limit(parseInt(limit)),
        
        Tournament.find({
          $or: [
            { title: searchRegex },
            { description: searchRegex },
            { map: searchRegex },
            { teamType: searchRegex }
          ]
        }).populate('createdBy', 'username email').limit(parseInt(limit)),
        
        Transaction.find({
          $or: [
            { type: searchRegex },
            { status: searchRegex },
            { transactionId: searchRegex }
          ]
        }).populate('userId', 'username email').limit(parseInt(limit)),
        
        Notification.find({
          $or: [
            { title: searchRegex },
            { message: searchRegex },
            { type: searchRegex }
          ]
        }).limit(parseInt(limit)),
        
        AIFlag.find({
          $or: [
            { reason: searchRegex },
            { status: searchRegex },
            { 'aiAnalysis.result': searchRegex }
          ]
        }).populate('userId', 'username email').limit(parseInt(limit)),
        
        Media.find({
          $or: [
            { originalName: searchRegex },
            { description: searchRegex },
            { tags: searchRegex },
            { category: searchRegex }
          ]
        }).populate('uploadedBy', 'username email').limit(parseInt(limit))
      ]);
      
      results = {
        users: users.map(user => ({
          id: user._id,
          username: user.username,
          email: user.email,
          status: user.status,
          joinDate: user.createdAt,
          tournaments: user.tournaments?.length || 0,
          wins: user.wins || 0,
          isVerified: user.isVerified,
          walletBalance: user.wallet?.balance || 0
        })),
        tournaments: tournaments.map(tournament => ({
          id: tournament._id,
          name: tournament.title,
          status: tournament.status,
          participants: tournament.currentParticipants || 0,
          maxParticipants: tournament.maxParticipants,
          prizePool: tournament.prizePool,
          entryFee: tournament.entryFee,
          startDate: tournament.scheduledAt,
          teamType: tournament.teamType,
          map: tournament.map,
          createdBy: tournament.createdBy?.username
        })),
        transactions: transactions.map(transaction => ({
          id: transaction._id,
          userId: transaction.userId?._id,
          username: transaction.userId?.username,
          type: transaction.type,
          amount: transaction.amount,
          status: transaction.status,
          date: transaction.createdAt,
          description: transaction.description
        })),
        notifications: notifications.map(notification => ({
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          status: notification.status,
          date: notification.createdAt
        })),
        aiFlags: aiFlags.map(flag => ({
          id: flag._id,
          userId: flag.userId?._id,
          username: flag.userId?.username,
          reason: flag.reason,
          status: flag.status,
          confidence: flag.aiAnalysis?.confidence,
          date: flag.createdAt
        })),
        media: media.map(mediaItem => ({
          id: mediaItem._id,
          filename: mediaItem.originalName,
          type: mediaItem.type,
          size: mediaItem.size,
          category: mediaItem.category,
          uploadedBy: mediaItem.uploadedBy?.username,
          date: mediaItem.createdAt
        }))
      };
    } else {
      // Search specific type
      switch (type) {
        case 'users':
          const users = await User.find({
            $or: [
              { username: searchRegex },
              { email: searchRegex },
              { 'gameProfile.bgmiId': searchRegex },
              { 'gameProfile.ign': searchRegex }
            ]
          }).select('-password -otp -otpExpiry').limit(parseInt(limit));
          
          results.users = users.map(user => ({
            id: user._id,
            username: user.username,
            email: user.email,
            status: user.status,
            joinDate: user.createdAt,
            tournaments: user.tournaments?.length || 0,
            wins: user.wins || 0,
            isVerified: user.isVerified,
            walletBalance: user.wallet?.balance || 0
          }));
          break;
          
        case 'tournaments':
          const tournaments = await Tournament.find({
            $or: [
              { title: searchRegex },
              { description: searchRegex },
              { map: searchRegex },
              { teamType: searchRegex }
            ]
          }).populate('createdBy', 'username email').limit(parseInt(limit));
          
          results.tournaments = tournaments.map(tournament => ({
            id: tournament._id,
            name: tournament.title,
            status: tournament.status,
            participants: tournament.currentParticipants || 0,
            maxParticipants: tournament.maxParticipants,
            prizePool: tournament.prizePool,
            entryFee: tournament.entryFee,
            startDate: tournament.scheduledAt,
            teamType: tournament.teamType,
            map: tournament.map,
            createdBy: tournament.createdBy?.username
          }));
          break;
          
        case 'transactions':
          const transactions = await Transaction.find({
            $or: [
              { type: searchRegex },
              { status: searchRegex },
              { transactionId: searchRegex }
            ]
          }).populate('userId', 'username email').limit(parseInt(limit));
          
          results.transactions = transactions.map(transaction => ({
            id: transaction._id,
            userId: transaction.userId?._id,
            username: transaction.userId?.username,
            type: transaction.type,
            amount: transaction.amount,
            status: transaction.status,
            date: transaction.createdAt,
            description: transaction.description
          }));
          break;
          
        case 'notifications':
          const notifications = await Notification.find({
            $or: [
              { title: searchRegex },
              { message: searchRegex },
              { type: searchRegex }
            ]
          }).limit(parseInt(limit));
          
          results.notifications = notifications.map(notification => ({
            id: notification._id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            status: notification.status,
            date: notification.createdAt
          }));
          break;
          
        case 'ai_flags':
          const aiFlags = await AIFlag.find({
            $or: [
              { reason: searchRegex },
              { status: searchRegex },
              { 'aiAnalysis.result': searchRegex }
            ]
          }).populate('userId', 'username email').limit(parseInt(limit));
          
          results.aiFlags = aiFlags.map(flag => ({
            id: flag._id,
            userId: flag.userId?._id,
            username: flag.userId?.username,
            reason: flag.reason,
            status: flag.status,
            confidence: flag.aiAnalysis?.confidence,
            date: flag.createdAt
          }));
          break;
          
        case 'media':
          const media = await Media.find({
            $or: [
              { originalName: searchRegex },
              { description: searchRegex },
              { tags: searchRegex },
              { category: searchRegex }
            ]
          }).populate('uploadedBy', 'username email').limit(parseInt(limit));
          
          results.media = media.map(mediaItem => ({
            id: mediaItem._id,
            filename: mediaItem.originalName,
            type: mediaItem.type,
            size: mediaItem.size,
            category: mediaItem.category,
            uploadedBy: mediaItem.uploadedBy?.username,
            date: mediaItem.createdAt
          }));
          break;
          
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid search type'
          });
      }
    }
    
    // Add search statistics
    const searchStats = {
      totalResults: Object.values(results).reduce((sum, arr) => sum + arr.length, 0),
      resultsByType: Object.keys(results).reduce((acc, key) => {
        acc[key] = results[key]?.length || 0;
        return acc;
      }, {})
    };
    
    res.json({
      success: true,
      data: results,
      stats: searchStats,
      query,
      type: type || 'all'
    });
  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform search',
      error: error.message
    });
  }
});

// Advanced search with filters
router.post('/advanced', authenticateAdmin, async (req, res) => {
  try {
    const { query, filters, type, page = 1, limit = 20 } = req.body;
    
    if (!query && !filters) {
      return res.status(400).json({
        success: false,
        message: 'Search query or filters are required'
      });
    }
    
    const skip = (page - 1) * limit;
    let results = {};
    let total = 0;
    
    // Build search query
    let searchQuery = {};
    if (query) {
      const searchRegex = new RegExp(query, 'i');
      searchQuery.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { username: searchRegex },
        { email: searchRegex }
      ];
    }
    
    // Apply filters
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          searchQuery[key] = filters[key];
        }
      });
    }
    
    switch (type) {
      case 'users':
        const users = await User.find(searchQuery)
          .select('-password -otp -otpExpiry')
          .skip(skip)
          .limit(parseInt(limit))
          .sort({ createdAt: -1 });
        
        total = await User.countDocuments(searchQuery);
        results.users = users;
        break;
        
      case 'tournaments':
        const tournaments = await Tournament.find(searchQuery)
          .populate('createdBy', 'username email')
          .skip(skip)
          .limit(parseInt(limit))
          .sort({ createdAt: -1 });
        
        total = await Tournament.countDocuments(searchQuery);
        results.tournaments = tournaments;
        break;
        
      case 'transactions':
        const transactions = await Transaction.find(searchQuery)
          .populate('userId', 'username email')
          .skip(skip)
          .limit(parseInt(limit))
          .sort({ createdAt: -1 });
        
        total = await Transaction.countDocuments(searchQuery);
        results.transactions = transactions;
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid search type'
        });
    }
    
    res.json({
      success: true,
      data: results,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      query,
      filters,
      type
    });
  } catch (error) {
    console.error('Error performing advanced search:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform advanced search',
      error: error.message
    });
  }
});

module.exports = router; 