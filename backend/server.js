/**
 * GameOn Platform - Backend Server
 * AI-powered BGMI tournament platform for Indian college students
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const os = require('os');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Check if we're in a serverless environment (Vercel)
const isServerless = (!!process.env.VERCEL && !process.env.RENDER) || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

if (isServerless) {
  console.log('[Server] Running in serverless mode (Socket.IO disabled)');
}

// Create Express app first
const app = express();

// Canonical production origins (no localhost fallbacks anywhere)
const allowedOrigins = [
  'https://gameonesport.xyz',
  'https://admin.gameonesport.xyz'
];

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // allow server-to-server/health checks
  return allowedOrigins.includes(origin.replace(/\/$/, ''));
};

// Import unified platform services
let syncService, pushNotificationService;

// Import SSE Manager for serverless real-time updates
const SSEManager = require('./services/sseManager');
const sseManager = new SSEManager();

// Always create HTTP Server + Socket.IO unconditionally
// isServerless only prevents listen() — Socket.IO must always be mounted
const { createServer } = require('http');
const { Server } = require('socket.io');
const server = createServer(app);

const io = new Server(server, {
  path: '/socket.io/',
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['polling'], // Use polling for serverless compatibility
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  // Serverless-specific options
  upgrade: false, // Disable WebSocket upgrades for serverless
  rememberUpgrade: false,
  forceJSONP: false
});

try {
  const SyncServiceClass = require('./services/syncService');
  const PushNotificationServiceClass = require('./services/pushNotificationService');
  syncService = new SyncServiceClass(io);
  pushNotificationService = new PushNotificationServiceClass();
  console.log('[Server] Platform services initialized');
} catch (svcErr) {
  console.warn('[Server] Platform services unavailable:', svcErr.message);
  syncService = { syncTournamentUpdate: () => {}, syncUserUpdate: () => {}, unregisterUser: () => {}, updateLastSeen: () => {}, cleanup: () => {} };
  pushNotificationService = { sendPushNotification: () => {} };
}

// Use environment PORT for deployment (Render/Vercel) or default to 5000
const PORT = process.env.PORT || 5000;

// Debug environment variables
console.log('Environment check:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? `Set (length: ${process.env.JWT_SECRET.length})` : 'NOT SET');
console.log('JWT_SECRET type:', typeof process.env.JWT_SECRET);

// CRITICAL: Validate JWT_SECRET at startup
if (!process.env.JWT_SECRET || typeof process.env.JWT_SECRET !== 'string' || process.env.JWT_SECRET.trim() === '') {
  console.error('❌ CRITICAL ERROR: JWT_SECRET is not properly configured!');
  console.error('JWT_SECRET value:', process.env.JWT_SECRET || 'UNDEFINED');
  console.error('Authentication will fail until JWT_SECRET is set in environment variables');
}

// MongoDB URI from environment variables (DATABASE_URL for Render/Vercel compatibility)
// IMPORTANT: MONGODB_URI must be set in environment variables - no localhost fallback in production
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

// Validate environment variables at startup (warn but don't crash)
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(key => {
  if (key === 'MONGODB_URI' && process.env.DATABASE_URL) return false; // DATABASE_URL is alternative
  const value = process.env[key];
  return !value || (typeof value === 'string' && value.trim() === '');
});
if (missingEnvVars.length > 0) {
  console.error('❌ CRITICAL: Missing or empty environment variables:', missingEnvVars);
  console.error('Server will respond with 500 errors to authentication requests until variables are configured.');
  console.error('Please set these in Vercel project settings > Environment Variables');
}

// MongoDB Connection - lazy initialization for serverless
mongoose.set('debug', false);

let mongoConnectPromise = null;
let isConnecting = false;

// Connection event handlers
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  mongoConnectPromise = null;
});

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connected successfully');
});

// Lazy MongoDB connection - triggered on first request
async function ensureMongoConnected() {
  // Already connected
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  // Connection in progress
  if (isConnecting && mongoConnectPromise) {
    try {
      await mongoConnectPromise;
      return true;
    } catch (err) {
      console.error('Failed to connect to MongoDB:', err.message);
      return false;
    }
  }

  // No MongoDB URI configured
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not configured');
    return false;
  }

  // Start connection attempt
  isConnecting = true;
  mongoConnectPromise = (async () => {
    try {
      const connectionOptions = {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 30000,
        family: 4,
        connectTimeoutMS: 5000
      };

      if (MONGODB_URI.includes('mongodb+srv://')) {
        connectionOptions.retryWrites = true;
        connectionOptions.w = 'majority';
      }

      await mongoose.connect(MONGODB_URI, connectionOptions);
      console.log('🍃 Connected to MongoDB successfully');
      isConnecting = false;
      return true;
    } catch (err) {
      console.error('MongoDB connection error:', {
        name: err.name,
        message: err.message,
        code: err.code
      });
      isConnecting = false;
      mongoConnectPromise = null;
      return false;
    }
  })();

  try {
    await mongoConnectPromise;
    return true;
  } catch (err) {
    return false;
  }
}

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

// CORS Configuration - Enhanced for all platforms
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, origin);
    }
    
    // Allow localhost for development
    if (origin && (
      origin.includes('localhost') || 
      origin.includes('127.0.0.1') ||
      origin.includes('192.168.') ||
      origin.includes('10.0.') ||
      origin.includes('::1')
    )) {
      return callback(null, origin);
    }
    
    // Log rejected origins for debugging
    console.log(`CORS blocked origin: ${origin}`);
    
    // Reject origin not in allowed list
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Cookie', 
    'X-Requested-With', 
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'X-Auth-Token',
    'X-Admin-Token'
  ],
  exposedHeaders: ['Set-Cookie', 'Content-Type', 'X-Total-Count'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Cookie parser middleware (must be before routes)
app.use(cookieParser());

// Body parsing middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Logging middleware
app.use(morgan('combined'));

// Serve static files from uploads directory
// static hosting for uploaded files; default directory is backend/uploads
const defaultUploadDir = process.env.MANUAL_PAYMENT_UPLOAD_DIR
  || (isServerless ? path.join(os.tmpdir(), 'gameon-uploads') : path.join(__dirname, 'uploads'));

// Ensure all upload subdirectories exist at startup (critical for first Render deploy)
const fs = require('fs');
[
  path.join(defaultUploadDir, 'thumbnails'),
  path.join(defaultUploadDir, 'payment_qr'),
  path.join(defaultUploadDir, 'media'),
  path.join(defaultUploadDir, 'payment_screenshots')
].forEach(dir => {
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log('[Server] Created upload directory:', dir);
    }
  } catch (e) {
    console.warn('[Server] Could not create upload directory:', dir, e.message);
  }
});

// Enhanced static file serving with comprehensive CORS headers
app.use('/uploads', (req, res, next) => {
  // Set comprehensive CORS headers for static files
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://gameonesport.xyz',
    'https://admin.gameonesport.xyz',
    'https://api.gameonesport.xyz'
  ];
  
  // Allow any origin for static files (images, documents)
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Access-Control-Max-Age', '86400');
  
  // Cache control for static assets
  if (req.url.includes('.jpg') || req.url.includes('.jpeg') || req.url.includes('.png') || req.url.includes('.webp')) {
    res.header('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (req.url.includes('.pdf') || req.url.includes('.doc') || req.url.includes('.docx')) {
    res.header('Cache-Control', 'public, max-age=86400');
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
}, express.static(defaultUploadDir, {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  setHeaders: (res, path, stat) => {
    // Set content type based on file extension
    if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.set('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.png')) {
      res.set('Content-Type', 'image/png');
    } else if (path.endsWith('.webp')) {
      res.set('Content-Type', 'image/webp');
    } else if (path.endsWith('.pdf')) {
      res.set('Content-Type', 'application/pdf');
    } else if (path.endsWith('.mp4')) {
      res.set('Content-Type', 'video/mp4');
    }
  }
}));

// if manual payment upload dir is overridden, serve that too so screenshots
// remain accessible in the admin panel
if (process.env.MANUAL_PAYMENT_UPLOAD_DIR) {
  const customDir = process.env.MANUAL_PAYMENT_UPLOAD_DIR;
  if (customDir !== defaultUploadDir) {
    app.use('/uploads', (req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      next();
    }, express.static(customDir));
    console.log('Serving manual payment files from custom directory:', customDir);
  }
}

// Ensure MongoDB connection middleware (skip for health check)
app.use('/api', async (req, res, next) => {
  if (req.path === '/health') {
    return next();
  }
  
  try {
    const connected = await ensureMongoConnected();
    if (!connected) {
      return res.status(503).json({
        success: false,
        message: 'Database service unavailable',
        error: 'Cannot connect to MongoDB'
      });
    }
    next();
  } catch (err) {
    console.error('Connection middleware error:', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
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
        verify: 'POST /api/payments/verify',
        manualStatus: 'GET /api/payments/manual/status/:tournamentId'
      },
      leaderboard: 'GET /api/leaderboard',
      health: 'GET /api/health'
    }
  });
});

// Favicon route to prevent 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Serve Socket.IO serverless fix scripts
app.get('/socket.io-serverless-fix.js', (req, res) => {
  res.set('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'public', 'socket.io-serverless-fix.js'));
});

app.get('/universal-socket-fix.js', (req, res) => {
  res.set('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'public', 'universal-socket-fix.js'));
});


io.on('connection', (socket) => {
  console.log('🔗 Socket connected:', socket.id);

  // Handle authentication from both frontend and admin panel
  socket.on('authenticate', async (data) => {
    try {
      if (data.role === 'admin' && data.token) {
        // Verify admin token
        const jwt = require('jsonwebtoken');
        const Admin = require('./models/Admin');
        const decoded = jwt.verify(data.token, process.env.JWT_SECRET.trim());
        const admin = await Admin.findById(decoded.userId).select('-password');
        
        if (admin && admin.status === 'active') {
          socket.adminId = admin._id;
          socket.adminRole = admin.role;
          socket.emit('authenticated', { success: true, admin: { id: admin._id, name: admin.name, role: admin.role } });
          console.log('✅ Admin authenticated:', socket.id, admin.name);
        } else {
          socket.emit('authentication_error', { message: 'Invalid admin credentials' });
        }
      } else if (data.userId) {
        socket.join(`user_${data.userId}`);
        console.log(`✅ User authenticated: ${data.userId} (${socket.id})`);
        socket.emit('authenticated', { 
          status: 'ok', 
          userId: data.userId,
          socketId: socket.id 
        });
        
        // Update sync service if available
        if (syncService && syncService.registerUser) {
          syncService.registerUser(data.userId, socket);
        }
      }
    } catch (err) {
      console.error('Socket authentication error:', err.message);
    }
  });

  // Room management
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log('📌 Socket joined room:', room, 'Socket:', socket.id);
  });

  socket.on('leave_room', (room) => {
    socket.leave(room);
  });

  // Tournament room management
  socket.on('join_tournament', (data) => {
    const tournamentId = data?.tournamentId || data;
    socket.join(`tournament_${tournamentId}`);
    console.log(`Socket ${socket.id} joined tournament: ${tournamentId}`);
  });

  socket.on('leave_tournament', (data) => {
    const tournamentId = data?.tournamentId || data;
    socket.leave(`tournament_${tournamentId}`);
  });

  // User-specific room
  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
  });

  // Heartbeat
  socket.on('heartbeat', () => {
    socket.emit('heartbeat_ack');
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
  });
});

// Make Socket.IO and services available to routes
app.set('io', io);
app.set('syncService', syncService);
app.set('pushNotificationService', pushNotificationService);
app.set('sseManager', sseManager);

// SSE endpoint for real-time updates (serverless compatible)
app.get('/api/events', (req, res) => {
  const { room = 'global' } = req.query;
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': allowedOrigins,
    'Access-Control-Allow-Headers': 'Cache-Control',
    'Access-Control-Allow-Credentials': 'true'
  });

  // Add client to room
  sseManager.addClient(room, res);
  
  console.log(`📡 SSE client connected to room: ${room}`);
});

// Helper function for routes to broadcast events
app.set('broadcastEvent', (room, event) => {
  sseManager.broadcast(room, event);
});

app.set('broadcastAll', (event) => {
  sseManager.broadcastAll(event);
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tournaments', require('./routes/tournaments'));
app.use('/api/users', require('./routes/users'));
// manualPayments replaces the old gateway-based code. it includes the
// tournament manual payment submission and status endpoints, along with
// a small admin verification API.  any wallet / other payment routes are
// now moved to their own modules (if needed) or can be added separately.
app.use('/api/payments', require('./routes/manualPayments'));
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
// IMPORTANT: tournamentParticipants MUST be mounted BEFORE tournaments.
// The tournaments router has a /:id wildcard that would otherwise intercept
// paths like /:id/participants, returning "Tournament not found" instead of
// delegating to the participants router.
app.use('/api/admin/tournaments', require('./routes/admin/tournamentParticipants'));
app.use('/api/admin/tournaments', require('./routes/admin/tournaments'));
app.use('/api/admin/notifications', require('./routes/admin/notifications'));
app.use('/api/admin/tournament-videos', require('./routes/admin/tournamentVideos'));
app.use('/api/admin/users', require('./routes/admin/users'));
app.use('/api/admin/ai-verification', require('./routes/admin/ai-verification'));
app.use('/api/admin/wallet', require('./routes/admin/wallet'));
app.use('/api/admin/analytics', require('./routes/admin/analytics'));
app.use('/api/admin/ai', require('./routes/admin/ai'));
app.use('/api/admin/ai-suggestions', require('./routes/admin/ai-suggestions'));
app.use('/api/admin/scheduling', require('./routes/admin/scheduling'));
app.use('/api/admin/broadcast', require('./routes/admin/broadcast'));
app.use('/api/admin/payouts', require('./routes/admin/payouts'));
app.use('/api/admin/media', require('./routes/admin/media'));
app.use('/api/admin/search', require('./routes/admin/search'));
app.use('/api/admin/export', require('./routes/admin/export'));
app.use('/api/admin/user-monitoring', require('./routes/admin/user-monitoring'));
app.use('/api/admin/room-slots', require('./routes/admin/roomSlots'));

// Friends System Routes
app.use('/api/friends', require('./routes/friends-simple'));

// Health check endpoint - NEVER crashes, always returns JSON
app.get('/api/health', async (req, res) => {
  try {
    // Safely check MongoDB connection state
    let dbConnected = false;
    let mongoReady = 0;
    try {
      mongoReady = mongoose.connection.readyState || 0;
      dbConnected = mongoReady === 1;
    } catch (mongoErr) {
      console.warn('MongoDB state check failed:', mongoErr.message);
      dbConnected = false;
      mongoReady = 0;
    }

    // also verify that the payments collection exists (useful during deploys)
    let paymentsExists = false;
    if (dbConnected) {
      try {
        const cols = await mongoose.connection.db.listCollections({ name: 'payments' }).toArray();
        paymentsExists = cols.length > 0;
      } catch (colErr) {
        console.warn('Health check unable to list payments collection:', colErr.message);
      }
    }
    
    // Always respond 200 to keep uptime checks/frontends alive; expose db state in payload
    const statusCode = 200;
    
    res.status(statusCode).json({
      success: true,
      message: dbConnected ? 'GameOn API is running!' : 'Database connection unavailable',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime ? process.uptime() : 0,
      dbStatus: dbConnected ? 'connected' : 'disconnected',
      mongoReady: mongoReady,
      paymentsCollection: paymentsExists ? 'present' : 'absent',
      serverless: isServerless,
      socketEnabled: !isServerless // Socket.IO limited in serverless mode
    });
  } catch (err) {
    // Ultimate fallback - never let health check crash
    console.error('Health check error:', err.message || err);
    try {
      res.status(200).json({
        success: true,
        message: 'Health check failed',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal error'
      });
    } catch (finalErr) {
      // If even JSON response fails, send minimal response
      res.status(200).end('Service Degraded');
    }
  }
});

// 404 handler — skip socket.io paths (handled by Socket.IO engine)
app.use('*', (req, res) => {
  // Don't intercept Socket.IO traffic — it's handled by the HTTP server directly
  if (req.originalUrl && req.originalUrl.startsWith('/socket.io')) {
    return res.status(404).end();
  }
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  const statusCode = err.status || err.statusCode || 500;
  // always send the original message; clients can decide how to display it
  const message = err.message || 'Internal server error';
    
  res.status(statusCode).json({
    success: false,
    message,
    // only expose stack trace when not in production
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Uncaught exception handler
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});



// Enhanced Global Socket.IO event emitters with sync service
const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

const emitToTournament = (tournamentId, event, data) => {
  if (syncService && syncService.syncTournamentUpdate) {
    syncService.syncTournamentUpdate(tournamentId, event, data);
  }
};

const emitToUser = (userId, event, data) => {
  if (syncService && syncService.syncUserUpdate) {
    syncService.syncUserUpdate(userId, event, data);
  }
};

const emitToAdmins = (event, data) => {
  if (io) {
    io.emit(event, data); // All admins will receive this
  }
};

// Export sync and notification services for use in routes
app.set('emitToTournament', emitToTournament);
app.set('emitToUser', emitToUser);
app.set('emitToAll', emitToAll);
app.set('emitToAdmins', emitToAdmins);



// Start HTTP server — always on Render/EC2; skipped on Vercel (serverless)
if (!isServerless && server) {
  server.listen(PORT, () => {
    console.log(`🚀 GameOn API server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('📱 CORS enabled for: https://gameonesport.xyz, https://admin.gameonesport.xyz');
    console.log(`⚡ Socket.IO enabled for real-time features`);
    console.log(`🔄 Unified Platform Sync Service initialized`);
    console.log(`📱 Push Notification Service initialized`);
  });

  // Cleanup interval for sync service (only in local development)
  if (syncService && syncService.cleanup) {
    setInterval(() => {
      syncService.cleanup();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

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
}

// Export app for serverless deployment (Vercel)
// Export server for persistent deployment (Render) where Socket.IO works
module.exports = app;
module.exports.server = server;
