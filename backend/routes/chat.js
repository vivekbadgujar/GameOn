const express = require('express');
const Chat = require('../models/Chat');
const User = require('../models/User');
const Tournament = require('../models/Tournament');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Middleware to protect chat routes
router.use(authenticateToken);

// Get chat messages for a tournament
router.get('/tournament/:tournamentId', async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Verify user is participant in the tournament
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }
    
    const isParticipant = tournament.participants.some(p => 
      p.userId.toString() === req.user._id.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You must be a tournament participant to access chat'
      });
    }
    
    // Get messages
    const messages = await Chat.getTournamentMessages(tournamentId, parseInt(page), parseInt(limit));
    const totalMessages = await Chat.countDocuments({
      tournament: tournamentId,
      chatType: 'tournament',
      status: { $ne: 'deleted' }
    });
    
    // Format messages for frontend
    const formattedMessages = messages.reverse().map(msg => ({
      id: msg._id,
      userId: msg.sender._id,
      username: msg.senderUsername,
      gamerTag: msg.senderGamerTag || msg.sender.gameProfile?.bgmiId || msg.senderUsername,
      message: msg.message,
      timestamp: msg.createdAt,
      type: msg.type
    }));
    
    res.json({
      success: true,
      message: 'Chat messages retrieved successfully',
      data: {
        tournamentId,
        messages: formattedMessages,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalMessages / limit),
          totalMessages,
          limit: parseInt(limit)
        }
      }
    });
  } catch (err) {
    console.error('Error fetching tournament messages:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve chat messages', 
      error: err.message 
    });
  }
});

// Send a message to tournament chat
router.post('/tournament/:tournamentId', async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { message, type = 'text' } = req.body;
    
    // Validate required fields
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }
    
    // Check message length
    if (message.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Message too long. Maximum 500 characters allowed.'
      });
    }
    
    // Verify tournament exists and user is participant
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }
    
    const isParticipant = tournament.participants.some(p => 
      p.userId.toString() === req.user._id.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You must be a tournament participant to send messages'
      });
    }
    
    // Check for inappropriate content (basic filter)
    const inappropriateWords = ['spam', 'cheat', 'hack']; // Basic example
    const containsInappropriate = inappropriateWords.some(word => 
      message.toLowerCase().includes(word)
    );
    
    if (containsInappropriate) {
      return res.status(400).json({
        success: false,
        message: 'Message contains inappropriate content'
      });
    }
    
    // Create new chat message
    const chatMessage = new Chat({
      message,
      type,
      sender: req.user._id,
      senderUsername: req.user.username || req.user.displayName,
      senderGamerTag: req.user.gameProfile?.bgmiId || req.user.username,
      chatType: 'tournament',
      tournament: tournamentId
    });
    
    await chatMessage.save();
    
    // Format response
    const responseMessage = {
      id: chatMessage._id,
      userId: req.user._id,
      username: chatMessage.senderUsername,
      gamerTag: chatMessage.senderGamerTag,
      message: chatMessage.message,
      timestamp: chatMessage.createdAt,
      type: chatMessage.type
    };
    
    // Emit message to connected clients via WebSocket
    if (req.app.get('io')) {
      req.app.get('io').emit('tournament_message', {
        tournamentId,
        message: responseMessage
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: responseMessage
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message', 
      error: err.message 
    });
  }
});

// Delete a chat message (moderator/admin only)
router.delete('/message/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId, userRole } = req.body; // Would get from JWT token
    
    // Check if user has permission to delete messages
    if (userRole !== 'admin' && userRole !== 'moderator') {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to delete messages'
      });
    }
    
    // Delete message from database
    // await ChatMessage.findByIdAndDelete(messageId);
    
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete message', 
      error: err.message 
    });
  }
});

// Get direct messages between two users
router.get('/direct/:userId1/:userId2', async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Mock direct messages
    const directMessages = [
      {
        id: 'dm_001',
        senderId: userId1,
        receiverId: userId2,
        message: 'Hey, good game earlier! Want to team up for the next tournament?',
        timestamp: '2024-01-20T16:30:00Z',
        read: false,
        type: 'text'
      },
      {
        id: 'dm_002',
        senderId: userId2,
        receiverId: userId1,
        message: 'Absolutely! I think we could make a great team.',
        timestamp: '2024-01-20T16:35:00Z',
        read: true,
        type: 'text'
      }
    ];
    
    res.json({
      success: true,
      message: 'Direct messages retrieved successfully',
      data: {
        conversation: { userId1, userId2 },
        messages: directMessages,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(25 / limit),
          totalMessages: 25,
          limit: parseInt(limit)
        }
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve direct messages', 
      error: err.message 
    });
  }
});

// Send direct message
router.post('/direct', async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;
    
    // Validate required fields
    if (!senderId || !receiverId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: senderId, receiverId, message'
      });
    }
    
    // Create new direct message
    const newDirectMessage = {
      id: 'dm_' + Date.now(),
      senderId,
      receiverId,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'text'
    };
    
    // Save to database and send notification
    // await DirectMessage.create(newDirectMessage);
    // await sendNotification(receiverId, 'new_message', { senderId });
    
    res.status(201).json({
      success: true,
      message: 'Direct message sent successfully',
      data: newDirectMessage
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send direct message', 
      error: err.message 
    });
  }
});

// Mark messages as read
router.put('/read/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { messageIds } = req.body;
    
    if (!messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({
        success: false,
        message: 'messageIds array is required'
      });
    }
    
    // Mark messages as read in database
    // await DirectMessage.updateMany(
    //   { _id: { $in: messageIds }, receiverId: userId },
    //   { read: true }
    // );
    
    res.json({
      success: true,
      message: 'Messages marked as read',
      data: { markedCount: messageIds.length }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark messages as read', 
      error: err.message 
    });
  }
});

// Get user's chat conversations list
router.get('/conversations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Mock conversations list
    const conversations = [
      {
        conversationId: 'conv_001',
        otherUser: {
          userId: 'user_456',
          username: 'TournamentBuddy',
          gamerTag: 'TB_Pro',
          avatar: '/avatars/user_456.jpg',
          status: 'online'
        },
        lastMessage: {
          message: 'See you in the next tournament!',
          timestamp: '2024-01-20T18:45:00Z',
          senderId: 'user_456'
        },
        unreadCount: 2
      },
      {
        conversationId: 'conv_002',
        otherUser: {
          userId: 'user_789',
          username: 'CompetitorX',
          gamerTag: 'CX_Elite',
          avatar: '/avatars/user_789.jpg',
          status: 'offline'
        },
        lastMessage: {
          message: 'Good game! That was intense.',
          timestamp: '2024-01-19T22:15:00Z',
          senderId: userId
        },
        unreadCount: 0
      }
    ];
    
    res.json({
      success: true,
      message: 'Conversations retrieved successfully',
      data: conversations
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve conversations', 
      error: err.message 
    });
  }
});

// Report a chat message
router.post('/report/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reporterId, reason, description } = req.body;
    
    if (!reporterId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: reporterId, reason'
      });
    }
    
    // Create report
    const report = {
      id: 'report_' + Date.now(),
      messageId,
      reporterId,
      reason,
      description: description || '',
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    
    // Save report to database
    // await ChatReport.create(report);
    
    res.json({
      success: true,
      message: 'Message reported successfully',
      data: { reportId: report.id }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to report message', 
      error: err.message 
    });
  }
});

module.exports = router;
