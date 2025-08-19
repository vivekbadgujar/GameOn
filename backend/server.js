/**
 * GameOn Platform - Backend Server
 * AI-powered BGMI tournament platform for Indian college students
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import unified platform services
const SyncService = require('./services/syncService');
const PushNotificationService = require('./services/pushNotificationService');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [
          'https://gameonesport.xyz',
          'https://admin.gameonesport.xyz'
        ]
      : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Initialize unified platform services
const syncService = new SyncService(io);
const pushNotificationService = new PushNotificationService();

// Use environment PORT for deployment (Render) or default to 5000
const PORT = process.env.PORT || 5000;

// Debug environment variables
console.log('Environment check:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV);

// MongoDB URI from environment variables (DATABASE_URL for Render compatibility)
const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/gameon';

console.log('Using MongoDB URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Hide credentials in logs

// MongoDB Connection
mongoose.set('debug', false); // Disable debug mode for cleaner logs

// Connection event handlers
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});

// Connect to MongoDB with enhanced options
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4
};

// Add Atlas-specific options if using cloud database
if (MONGODB_URI.includes('mongodb+srv://')) {
  connectionOptions.retryWrites = true;
  connectionOptions.w = 'majority';
}

mongoose.connect(MONGODB_URI, connectionOptions).then(() => {
  console.log('🍃 Connected to MongoDB successfully');
  console.log('Database Name:', mongoose.connection.name);
  console.log('Host:', mongoose.connection.host);
  // Initialize admin user after successful connection
  // require('./scripts/initAdmin')(); // Commented out - script not found
}).catch((err) => {
  console.error('MongoDB connection error details:', {
    name: err.name,
    message: err.message,
    code: err.code,
    codeName: err.codeName
  });
  if (err.name === 'MongoServerSelectionError') {
    console.error('Could not connect to any MongoDB server.');
    console.log('Please check:');
    console.log('1. MongoDB Atlas connection string is correct');
    console.log('2. Network connectivity is available');
    console.log('3. IP address is whitelisted in MongoDB Atlas');
    console.log('4. Username and password are correct');
  }
});

// Kill existing connections on app shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  }
});

// Compression middleware
app.use(compression());

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow specific production domains
        const allowedOrigins = [
          'https://gameonesport.xyz',
          'https://admin.gameonesport.xyz'
        ];
        
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        return callback(new Error('Not allowed by CORS'));
      }
    : function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // Allow any localhost origin during development
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          return callback(null, true);
        }
        
        // Allow specific origins
        const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        return callback(new Error('Not allowed by CORS'));
      },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting - prevent abuse (disabled for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // increased limit for development
  message: 'Too many requests from this IP, please try again later.'
});
// app.use('/api/', limiter); // Temporarily disabled for development

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // For screenshot uploads
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined'));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Debug middleware for admin routes
app.use('/api/admin', (req, res, next) => {
  console.log(`Admin API Request: ${req.method} ${req.originalUrl}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to GameOn API',
    version: '1.0.0',
    endpoints: {
      auth: {
        sendOTP: 'POST /api/auth/send-otp',
        verifyOTP: 'POST /api/auth/verify-otp'
      },
      users: {
        profile: 'GET /api/users/profile',
        updateProfile: 'PUT /api/users/profile'
      },
      tournaments: {
        list: 'GET /api/tournaments',
        create: 'POST /api/tournaments',
        details: 'GET /api/tournaments/:id'
      },
      payments: {
        create: 'POST /api/payments/create',
        verify: 'POST /api/payments/verify'
      },
      leaderboard: 'GET /api/leaderboard',
      health: 'GET /api/health'
    }
  });
});

// Make Socket.IO and services available to routes
app.set('io', io);
app.set('syncService', syncService);
app.set('pushNotificationService', pushNotificationService);

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tournaments', require('./routes/tournaments'));
app.use('/api/users', require('./routes/users'));
app.use('/api/payments', require('./routes/payments-cashfree'));
app.use('/api', require('./routes/notifications'));
app.use('/api/media', require('./routes/media'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/anticheat', require('./routes/anticheat'));
app.use('/api/youtube', require('./routes/youtube'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/room-slots', require('./routes/roomSlots'));
app.use('/api/sync', require('./routes/sync'));

// Admin API Routes
app.use('/api/admin/auth', require('./routes/admin/auth'));
app.use('/api/admin/dashboard', require('./routes/admin/dashboard'));
app.use('/api/admin/tournaments', require('./routes/admin/tournaments'));
app.use('/api/admin/tournaments', require('./routes/admin/tournamentParticipants'));
app.use('/api/admin/notifications', require('./routes/admin/notifications'));
app.use('/api/admin/tournament-videos', require('./routes/admin/tournamentVideos'));
app.use('/api/admin/users', require('./routes/admin/users'));
app.use('/api/admin/ai-verification', require('./routes/admin/ai-verification'));
app.use('/api/admin/wallet', require('./routes/admin/wallet'));
app.use('/api/admin/analytics', require('./routes/admin/analytics'));
app.use('/api/admin/ai', require('./routes/admin/ai-suggestions'));
app.use('/api/admin/scheduling', require('./routes/admin/scheduling'));
app.use('/api/admin/broadcast', require('./routes/admin/broadcast'));
app.use('/api/admin/payouts', require('./routes/admin/payouts'));
app.use('/api/admin/media', require('./routes/admin/media'));
app.use('/api/admin/ai', require('./routes/admin/ai'));
app.use('/api/admin/search', require('./routes/admin/search'));
app.use('/api/admin/export', require('./routes/admin/export'));
app.use('/api/admin/user-monitoring', require('./routes/admin/user-monitoring'));
app.use('/api/admin/room-slots', require('./routes/admin/roomSlots'));

// Friends System Routes
app.use('/api/friends', require('./routes/friends-simple'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'GameOn API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong!' 
    : err.message;
    
  res.status(err.status || 500).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});



// Socket.IO Configuration for Unified Platform Real-time Features
io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  // User authentication and registration with data sync
  socket.on('authenticate', async (data) => {
    const { userId, platform = 'web', token } = data;
    
    // TODO: Verify JWT token here
    if (userId) {
      // Use enhanced authentication with data sync
      await syncService.handleAuthentication(socket, { userId, platform, token });
      
      // Register push notification token if provided
      if (token) {
        pushNotificationService.registerDeviceToken(userId, token, platform);
      }
    } else {
      socket.emit('auth_error', { message: 'User ID required' });
    }
  });

  // Join tournament room with sync service
  socket.on('join_tournament', (data) => {
    const { tournamentId, userId } = data;
    
    if (userId) {
      syncService.subscribeTournament(userId, tournamentId);
      socket.emit('tournament_joined', { tournamentId, timestamp: new Date().toISOString() });
    } else {
      // Fallback for legacy clients
      socket.join(`tournament_${tournamentId}`);
      console.log(`User ${socket.id} joined tournament ${tournamentId} (legacy)`);
    }
  });

  // Leave tournament room with sync service
  socket.on('leave_tournament', (data) => {
    const { tournamentId, userId } = data;
    
    if (userId) {
      syncService.unsubscribeTournament(userId, tournamentId);
      socket.emit('tournament_left', { tournamentId, timestamp: new Date().toISOString() });
    } else {
      // Fallback for legacy clients
      socket.leave(`tournament_${tournamentId}`);
      console.log(`User ${socket.id} left tournament ${tournamentId} (legacy)`);
    }
  });

  // Join admin room for admin-specific updates
  socket.on('join_admin', (adminId) => {
    socket.join(`admin_${adminId}`);
    console.log(`Admin ${adminId} joined admin room`);
  });

  // Join user room for user-specific updates
  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined user room`);
  });

  // Join tournament chat
  socket.on('join_tournament_chat', (data) => {
    const { tournamentId, userId, username, gamerTag } = data;
    socket.join(`tournament_chat_${tournamentId}`);
    
    // Notify others that user joined
    socket.to(`tournament_chat_${tournamentId}`).emit('user_joined_chat', {
      tournamentId,
      userId,
      username,
      gamerTag,
      onlineUsers: [] // Would track online users
    });
    
    console.log(`User ${username} joined tournament chat ${tournamentId}`);
  });

  // Leave tournament chat
  socket.on('leave_tournament_chat', (data) => {
    const { tournamentId } = data;
    socket.leave(`tournament_chat_${tournamentId}`);
    
    // Notify others that user left
    socket.to(`tournament_chat_${tournamentId}`).emit('user_left_chat', {
      tournamentId,
      onlineUsers: [] // Would track online users
    });
  });

  // Send tournament message
  socket.on('send_tournament_message', (data) => {
    const { tournamentId, userId, username, gamerTag, message, timestamp, type } = data;
    
    // Broadcast message to tournament chat room
    io.to(`tournament_chat_${tournamentId}`).emit('tournament_message', {
      id: Date.now(),
      userId,
      username,
      gamerTag,
      message,
      timestamp,
      type,
      tournamentId
    });
  });

  // Handle tournament updates
  socket.on('tournament_update', (data) => {
    const { tournamentId, update } = data;
    io.to(`tournament_${tournamentId}`).emit('tournament_update', update);
  });

  // Join tournament room for BGMI lobby
  socket.on('join_tournament_room', (tournamentId) => {
    socket.join(`tournament_room_${tournamentId}`);
    console.log(`User ${socket.id} joined tournament room ${tournamentId}`);
  });

  // Leave tournament room
  socket.on('leave_tournament_room', (tournamentId) => {
    socket.leave(`tournament_room_${tournamentId}`);
    console.log(`User ${socket.id} left tournament room ${tournamentId}`);
  });

  // Handle slot locking for BGMI lobby
  socket.on('lock_slot', (data) => {
    const { tournamentId, teamNumber, slotNumber, user } = data;
    socket.to(`tournament_room_${tournamentId}`).emit('slot_locked', {
      teamNumber,
      slotNumber,
      user
    });
  });

  // Handle slot unlocking
  socket.on('unlock_slot', (data) => {
    const { tournamentId, teamNumber, slotNumber } = data;
    socket.to(`tournament_room_${tournamentId}`).emit('slot_unlocked', {
      teamNumber,
      slotNumber
    });
  });

  // Handle slot updates
  socket.on('update_slot', (data) => {
    const { tournamentId, teamNumber, slotNumber, player } = data;
    io.to(`tournament_room_${tournamentId}`).emit('slot_updated', {
      teamNumber,
      slotNumber,
      player
    });
  });

  // Handle slot editing events
  socket.on('slot_edit_start', (data) => {
    const { tournamentId, userId, teamNumber, slotNumber } = data;
    // Notify others that someone is editing a slot
    socket.to(`tournament_${tournamentId}`).emit('slot_edit_start', {
      userId,
      teamNumber,
      slotNumber,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('slot_edit_end', (data) => {
    const { tournamentId, userId, teamNumber, slotNumber } = data;
    // Notify others that slot editing has ended
    socket.to(`tournament_${tournamentId}`).emit('slot_edit_end', {
      userId,
      teamNumber,
      slotNumber,
      timestamp: new Date().toISOString()
    });
  });

  // Handle real-time slot locking
  socket.on('request_slot_lock', async (data) => {
    const { tournamentId, teamNumber, slotNumber, userId } = data;
    
    try {
      const RoomSlot = require('./models/RoomSlot');
      const roomSlot = await RoomSlot.findOne({ tournament: tournamentId });
      
      if (roomSlot) {
        const team = roomSlot.teams.find(t => t.teamNumber === teamNumber);
        const slot = team?.slots.find(s => s.slotNumber === slotNumber);
        
        if (slot && !slot.player && !slot.isLocked) {
          // Temporarily lock the slot
          slot.isLocked = true;
          slot.lockedAt = new Date();
          slot.lockedBy = userId;
          
          await roomSlot.save();
          
          // Notify all users in the tournament
          io.to(`tournament_${tournamentId}`).emit('slot_locked', {
            teamNumber,
            slotNumber,
            lockedBy: userId,
            timestamp: new Date().toISOString()
          });
          
          // Auto-unlock after 5 seconds if no move is made
          setTimeout(async () => {
            try {
              const updatedRoomSlot = await RoomSlot.findOne({ tournament: tournamentId });
              const updatedTeam = updatedRoomSlot.teams.find(t => t.teamNumber === teamNumber);
              const updatedSlot = updatedTeam?.slots.find(s => s.slotNumber === slotNumber);
              
              if (updatedSlot && updatedSlot.isLocked && updatedSlot.lockedBy?.toString() === userId) {
                updatedSlot.isLocked = false;
                updatedSlot.lockedAt = null;
                updatedSlot.lockedBy = null;
                
                await updatedRoomSlot.save();
                
                io.to(`tournament_${tournamentId}`).emit('slot_unlocked', {
                  teamNumber,
                  slotNumber,
                  reason: 'timeout',
                  timestamp: new Date().toISOString()
                });
              }
            } catch (error) {
              console.error('Error auto-unlocking slot:', error);
            }
          }, 5000);
        }
      }
    } catch (error) {
      console.error('Error handling slot lock request:', error);
    }
  });

  // Handle live match updates
  socket.on('match_update', (data) => {
    const { tournamentId, matchData } = data;
    io.to(`tournament_${tournamentId}`).emit('match_update', matchData);
  });

  // Handle screenshot uploads
  socket.on('screenshot_uploaded', (data) => {
    const { tournamentId, userId, screenshotUrl } = data;
    io.to(`tournament_${tournamentId}`).emit('screenshot_uploaded', {
      userId,
      screenshotUrl,
      timestamp: new Date().toISOString()
    });
  });

  // Handle AI verification results
  socket.on('ai_verification', (data) => {
    const { tournamentId, userId, result, confidence } = data;
    io.to(`tournament_${tournamentId}`).emit('ai_verification', {
      userId,
      result,
      confidence,
      timestamp: new Date().toISOString()
    });
  });

  // Handle user status changes
  socket.on('user_status_change', (data) => {
    const { userId, status, reason } = data;
    io.to(`user_${userId}`).emit('user_status_change', {
      status,
      reason,
      timestamp: new Date().toISOString()
    });
  });

  // Handle wallet updates
  socket.on('wallet_update', (data) => {
    const { userId, balance, transaction } = data;
    io.to(`user_${userId}`).emit('wallet_update', {
      balance,
      transaction,
      timestamp: new Date().toISOString()
    });
  });

  // Handle platform stats requests
  socket.on('get_platform_stats', async () => {
    try {
      const Tournament = require('./models/Tournament');
      const User = require('./models/User');
      
      const activeTournaments = await Tournament.countDocuments({
        status: { $in: ['upcoming', 'live'] }
      });

      const activePlayersPipeline = await Tournament.aggregate([
        { $match: { status: { $in: ['upcoming', 'live'] } } },
        { $group: { _id: null, totalPlayers: { $sum: '$currentParticipants' } } }
      ]);
      const totalPlayers = activePlayersPipeline[0]?.totalPlayers || 0;

      const prizePipeline = await Tournament.aggregate([
        { $match: { status: { $in: ['upcoming', 'live'] } } },
        { $group: { _id: null, totalPrizePool: { $sum: '$prizePool' } } }
      ]);
      const totalPrizePool = prizePipeline[0]?.totalPrizePool || 0;

      const totalUsers = await User.countDocuments({ status: 'active' });
      const onlineUsers = Math.floor(totalUsers * 0.1);

      socket.emit('platform_stats', {
        activeTournaments,
        totalPlayers,
        totalPrizePool,
        onlineUsers,
        totalUsers
      });
    } catch (error) {
      console.error('Error fetching platform stats:', error);
    }
  });

  // Handle recent winners requests
  socket.on('get_recent_winners', async () => {
    try {
      const Tournament = require('./models/Tournament');
      
      const recentWinners = await Tournament.aggregate([
        {
          $match: {
            status: 'completed',
            winners: { $exists: true, $ne: [] }
          }
        },
        { $sort: { endDate: -1 } },
        { $limit: 10 },
        { $unwind: '$winners' },
        {
          $match: {
            'winners.position': 1
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'winners.user',
            foreignField: '_id',
            as: 'winnerUser'
          }
        },
        { $unwind: '$winnerUser' },
        {
          $project: {
            _id: 1,
            tournamentTitle: '$title',
            username: '$winnerUser.username',
            prize: '$winners.prize',
            wonAt: '$endDate',
            gameProfile: '$winnerUser.gameProfile'
          }
        }
      ]);

      socket.emit('recent_winners', recentWinners);
    } catch (error) {
      console.error('Error fetching recent winners:', error);
    }
  });

  // Handle leaderboard room joining
  socket.on('join_leaderboard', () => {
    socket.join('leaderboard');
    console.log(`User ${socket.id} joined leaderboard room`);
  });

  socket.on('leave_leaderboard', () => {
    socket.leave('leaderboard');
    console.log(`User ${socket.id} left leaderboard room`);
  });

  // Handle heartbeat for connection monitoring
  socket.on('heartbeat', () => {
    syncService.updateLastSeen(socket.id);
  });

  // Handle sync events
  socket.on('sync_request', (data) => {
    const { type, lastSyncId } = data;
    // Handle sync requests from clients
    socket.emit('sync_response', {
      type,
      lastSyncId,
      timestamp: new Date().toISOString()
    });
  });

  // Handle push notification token updates
  socket.on('update_push_token', (data) => {
    const { userId, token, platform } = data;
    if (userId && token) {
      pushNotificationService.registerDeviceToken(userId, token, platform);
      socket.emit('push_token_updated', { success: true });
    }
  });

  // Handle disconnection with sync service cleanup
  socket.on('disconnect', () => {
    console.log('👤 User disconnected:', socket.id);
    syncService.unregisterUser(socket.id);
  });
});

// Make socket.io instance available to routes
app.set('io', io);

// Enhanced Global Socket.IO event emitters with sync service
const emitToAll = (event, data) => {
  io.emit(event, data);
};

const emitToTournament = (tournamentId, event, data) => {
  syncService.syncTournamentUpdate(tournamentId, event, data);
};

const emitToUser = (userId, event, data) => {
  syncService.syncUserUpdate(userId, event, data);
};

const emitToAdmins = (event, data) => {
  io.emit(event, data); // All admins will receive this
};

// Export sync and notification services for use in routes
app.set('emitToTournament', emitToTournament);
app.set('emitToUser', emitToUser);
app.set('emitToAll', emitToAll);
app.set('emitToAdmins', emitToAdmins);



// Start server
server.listen(PORT, () => {
  console.log(`🚀 GameOn API server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📱 CORS enabled for: ${process.env.NODE_ENV === 'production' ? 'production domains' : 'localhost:3000, localhost:3001'}`);
  console.log(`⚡ Socket.IO enabled for real-time features`);
  console.log(`🔄 Unified Platform Sync Service initialized`);
  console.log(`📱 Push Notification Service initialized`);
});

// Cleanup interval for sync service
setInterval(() => {
  syncService.cleanup();
}, 5 * 60 * 1000); // Every 5 minutes

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  if (server) {
    server.close(() => {
      console.log('Server closed');
      mongoose.connection.close();
    });
  }
});

module.exports = { app, io };