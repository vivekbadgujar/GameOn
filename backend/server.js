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

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://gameon-platform.vercel.app']
      : function(origin, callback) {
          // Allow requests with no origin
          if (!origin) return callback(null, true);
          
          // Allow any localhost origin during development
          if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
            return callback(null, true);
          }
          
          return callback(new Error('Not allowed by CORS'));
        },
    credentials: true
  }
});

// Force port 5000 for consistency
const PORT = 5000;

// Debug environment variables
console.log('Environment check:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV);

// Temporary hardcoded MongoDB URI for testing
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vivekbadgujar:Vivek321@cluster0.squjxrk.mongodb.net/gameon?retryWrites=true&w=majority';

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
mongoose.connect('mongodb+srv://vivekbadgujar:Vivek321@cluster0.squjxrk.mongodb.net/gameon?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4,
  retryWrites: true,
  w: 'majority'
}).then(() => {
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
    ? ['https://gameon-platform.vercel.app'] 
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting - prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // For screenshot uploads
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined'));

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



// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tournaments', require('./routes/tournaments'));
app.use('/api/users', require('./routes/users'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api', require('./routes/notifications'));
app.use('/api/media', require('./routes/media'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/anticheat', require('./routes/anticheat'));
app.use('/api/youtube', require('./routes/youtube'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/notifications', require('./routes/notifications'));

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



// Socket.IO Configuration for Real-time Features
io.on('connection', (socket) => {
  console.log('👤 User connected:', socket.id);

  // Join tournament room
  socket.on('join_tournament', (tournamentId) => {
    socket.join(`tournament_${tournamentId}`);
    console.log(`User ${socket.id} joined tournament ${tournamentId}`);
  });

  // Leave tournament room
  socket.on('leave_tournament', (tournamentId) => {
    socket.leave(`tournament_${tournamentId}`);
    console.log(`User ${socket.id} left tournament ${tournamentId}`);
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

  // Handle chat messages
  socket.on('tournament_message', (data) => {
    const { tournamentId, message, userId, username } = data;
    
    // Broadcast message to tournament room
    io.to(`tournament_${tournamentId}`).emit('tournament_message', {
      id: Date.now(),
      userId,
      username,
      message,
      timestamp: new Date().toISOString()
    });
  });

  // Handle tournament updates
  socket.on('tournament_update', (data) => {
    const { tournamentId, update } = data;
    io.to(`tournament_${tournamentId}`).emit('tournament_update', update);
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

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('👤 User disconnected:', socket.id);
  });
});

// Make socket.io instance available to routes
app.set('io', io);

// Global Socket.IO event emitters for admin actions
const emitToAll = (event, data) => {
  io.emit(event, data);
};

const emitToTournament = (tournamentId, event, data) => {
  io.to(`tournament_${tournamentId}`).emit(event, data);
};

const emitToUser = (userId, event, data) => {
  io.to(`user_${userId}`).emit(event, data);
};

const emitToAdmins = (event, data) => {
  io.emit(event, data); // All admins will receive this
};



// Start server
server.listen(PORT, () => {
  console.log(`🚀 GameOn API server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📱 CORS enabled for: ${process.env.NODE_ENV === 'production' ? 'production domains' : 'localhost:3000, localhost:3001'}`);
  console.log(`⚡ Socket.IO enabled for real-time features`);
});

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