// Ultra-minimal server without MongoDB to test initialization
require('./config/loadEnv')();

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

console.log('[Debug] Starting ultra-minimal server...');

const app = express();
const server = createServer(app);

// Basic middleware
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Ultra-minimal server running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Socket.IO setup
const io = new Server(server, {
  path: '/socket.io/',
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling']
});

io.on('connection', (socket) => {
  console.log('[Debug] Socket connected:', socket.id);
});

console.log('[Debug] Ultra-minimal server created successfully');

// Export for serverless
module.exports = app;
