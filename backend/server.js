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
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5001;

// MongoDB Connection with retry logic
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
      retryWrites: true,
      w: 'majority'
    });
    console.log('🍃 Connected to MongoDB successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    // Don't exit process, just retry connection after delay
    setTimeout(connectDB, 5000);
  }
};

// Initial database connection
connectDB();

// Handle connection errors
mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
  setTimeout(connectDB, 5000);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
  setTimeout(connectDB, 5000);
});

// Mongoose configuration
mongoose.set('strictQuery', false);

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
    : ['http://localhost:3000', 'http://localhost:3001'],
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

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tournaments', require('./routes/tournaments'));
app.use('/api/users', require('./routes/users'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/anticheat', require('./routes/anticheat'));
app.use('/api/youtube', require('./routes/youtube'));

// Admin API Routes
app.use('/api/admin/auth', require('./routes/admin/auth'));
app.use('/api/admin/tournaments', require('./routes/admin/tournaments'));
app.use('/api/admin/users', require('./routes/admin/users'));
app.use('/api/admin/notifications', require('./routes/admin/notifications'));
app.use('/api/admin/ai-verification', require('./routes/admin/ai-verification'));
app.use('/api/admin/wallet', require('./routes/admin/wallet'));

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

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('👤 User disconnected:', socket.id);
  });
});

// Make io available globally
app.set('io', io);

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