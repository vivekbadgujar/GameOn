const express = require('express');
const router = express.Router();

// Get chat messages for a tournament
router.get('/tournament/:tournamentId', async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Mock chat messages - would query from database
    const messages = [
      {
        id: 'msg_001',
        userId: 'user_123',
        username: 'ProGamer',
        gamerTag: 'PG_Elite',
        message: 'Good luck everyone! May the best player win 🎮',
        timestamp: '2024-01-20T14:30:00Z',
        type: 'text',
        avatar: '/avatars/user_123.jpg'
      },
      {
        id: 'msg_002',
        userId: 'user_456',
        username: 'CompetitiveAce',
        gamerTag: 'CA_Master',
        message: 'Ready for action! See you on the battlefield 💪',
        timestamp: '2024-01-20T14:32:15Z',
        type: 'text',
        avatar: '/avatars/user_456.jpg'
      },
      {
        id: 'msg_003',
        userId: 'system',
        username: 'GameOn System',
        gamerTag: 'System',
        message: 'Tournament starting in 15 minutes. Please ensure you have the game ready!',
        timestamp: '2024-01-20T14:45:00Z',
        type: 'system',
        avatar: '/avatars/system.jpg'
      }
    ];
    
    res.json({
      success: true,
      message: 'Chat messages retrieved successfully',
      data: {
        tournamentId,
        messages,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(150 / limit), // Assuming 150 total messages
          totalMessages: 150,
          limit: parseInt(limit)
        }
      }
    });
  } catch (err) {
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
    const { userId, message, type = 'text' } = req.body;
    
    // Validate required fields
    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, message'
      });
    }
    
    // Check message length
    if (message.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Message too long. Maximum 500 characters allowed.'
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
    
    // Create new message
    const newMessage = {
      id: 'msg_' + Date.now(),
      userId,
      username: 'CurrentUser', // Would fetch from user data
      gamerTag: 'CU_Tag', // Would fetch from user data
      message,
      timestamp: new Date().toISOString(),
      type,
      tournamentId,
      avatar: '/avatars/default.jpg'
    };
    
    // Save message to database
    // await ChatMessage.create(newMessage);
    
    // Emit message to connected clients via WebSocket
    // socketEmit('tournament_message', { tournamentId, message: newMessage });
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage
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
