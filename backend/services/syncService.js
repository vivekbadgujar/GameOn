/**
 * Real-time Sync Service
 * Handles cross-platform data synchronization
 */

class SyncService {
  constructor(io) {
    this.io = io;
    this.activeUsers = new Map(); // userId -> { socketId, platform, lastSeen }
    this.tournamentSubscriptions = new Map(); // tournamentId -> Set of userIds
    this.userSessions = new Map(); // userId -> Set of socketIds (multi-device support)
  }

  /**
   * Handle user authentication for sync
   */
  async handleAuthentication(socket, data) {
    const { userId, platform, token } = data;
    
    if (!userId) {
      socket.emit('auth_error', { message: 'User ID required' });
      return;
    }

    try {
      // Register user connection
      this.registerUser(socket.id, userId, platform);
      
      // Join user to their personal room
      socket.join(`user_${userId}`);
      socket.userId = userId;
      socket.platform = platform;

      console.log(`✅ User ${userId} authenticated on ${platform}`);
      
      // Get current user data for initial sync
      const currentData = await this.getCurrentUserData(userId);
      
      socket.emit('authenticated', {
        userId,
        platform,
        sessionId: socket.id,
        connectedSessions: this.getUserSessions(userId),
        currentData // Include current user data
      });

      // Notify other sessions about new connection
      this.syncUserUpdate(userId, 'session_connected', {
        platform,
        sessionId: socket.id,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit('auth_error', { message: 'Authentication failed' });
    }
  }

  /**
   * Get current user data for initial sync
   */
  async getCurrentUserData(userId) {
    try {
      const User = require('../models/User');
      const Tournament = require('../models/Tournament');
      
      // Get user with wallet data
      const user = await User.findById(userId).select('wallet username displayName gameProfile');
      
      // Get user's active tournaments
      const userTournaments = await Tournament.find({
        'participants.user': userId,
        status: { $in: ['upcoming', 'live'] }
      }).populate('participants.user', 'username displayName');
      
      return {
        wallet: {
          balance: user?.wallet?.balance || 0,
          transactions: user?.wallet?.transactions?.slice(-10) || [] // Last 10 transactions
        },
        tournaments: userTournaments,
        profile: {
          username: user?.username,
          displayName: user?.displayName,
          gameProfile: user?.gameProfile
        },
        syncTimestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error getting current user data:', error);
      return {
        wallet: { balance: 0, transactions: [] },
        tournaments: [],
        profile: {},
        syncTimestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Register user connection
   */
  registerUser(socketId, userId, platform = 'web') {
    // Support multiple sessions per user
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }
    this.userSessions.get(userId).add(socketId);

    // Update active users
    this.activeUsers.set(socketId, {
      userId,
      platform,
      lastSeen: new Date(),
      connectedAt: new Date()
    });

    console.log(`🔗 User ${userId} connected on ${platform} (Socket: ${socketId})`);
    
    // Notify other sessions of the same user
    this.notifyUserSessions(userId, 'user_session_connected', {
      platform,
      socketId,
      timestamp: new Date().toISOString()
    }, socketId);
  }

  /**
   * Unregister user connection
   */
  unregisterUser(socketId) {
    const userInfo = this.activeUsers.get(socketId);
    if (!userInfo) return;

    const { userId, platform } = userInfo;
    
    // Remove from user sessions
    if (this.userSessions.has(userId)) {
      this.userSessions.get(userId).delete(socketId);
      if (this.userSessions.get(userId).size === 0) {
        this.userSessions.delete(userId);
      }
    }

    // Remove from active users
    this.activeUsers.delete(socketId);

    console.log(`🔌 User ${userId} disconnected from ${platform} (Socket: ${socketId})`);
    
    // Notify other sessions of the same user
    this.notifyUserSessions(userId, 'user_session_disconnected', {
      platform,
      socketId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Subscribe user to tournament updates
   */
  subscribeTournament(userId, tournamentId) {
    if (!this.tournamentSubscriptions.has(tournamentId)) {
      this.tournamentSubscriptions.set(tournamentId, new Set());
    }
    this.tournamentSubscriptions.get(tournamentId).add(userId);

    // Join all user's sockets to tournament room
    const userSockets = this.getUserSockets(userId);
    userSockets.forEach(socketId => {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.join(`tournament_${tournamentId}`);
      }
    });

    console.log(`📺 User ${userId} subscribed to tournament ${tournamentId}`);
  }

  /**
   * Unsubscribe user from tournament updates
   */
  unsubscribeTournament(userId, tournamentId) {
    if (this.tournamentSubscriptions.has(tournamentId)) {
      this.tournamentSubscriptions.get(tournamentId).delete(userId);
      if (this.tournamentSubscriptions.get(tournamentId).size === 0) {
        this.tournamentSubscriptions.delete(tournamentId);
      }
    }

    // Leave tournament room for all user's sockets
    const userSockets = this.getUserSockets(userId);
    userSockets.forEach(socketId => {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.leave(`tournament_${tournamentId}`);
      }
    });

    console.log(`📺 User ${userId} unsubscribed from tournament ${tournamentId}`);
  }

  /**
   * Sync tournament update across all platforms
   */
  syncTournamentUpdate(tournamentId, updateType, data) {
    const event = {
      type: updateType,
      tournamentId,
      data,
      timestamp: new Date().toISOString(),
      syncId: this.generateSyncId()
    };

    // Emit to tournament room (all subscribed users across all platforms)
    this.io.to(`tournament_${tournamentId}`).emit('tournament_sync', event);

    console.log(`🔄 Tournament ${tournamentId} sync: ${updateType}`);
    return event.syncId;
  }

  /**
   * Sync user data update across all user's sessions
   */
  syncUserUpdate(userId, updateType, data) {
    const event = {
      type: updateType,
      userId,
      data,
      timestamp: new Date().toISOString(),
      syncId: this.generateSyncId()
    };

    this.notifyUserSessions(userId, 'user_sync', event);
    console.log(`🔄 User ${userId} sync: ${updateType}`);
    return event.syncId;
  }

  /**
   * Sync wallet update across all platforms
   */
  syncWalletUpdate(userId, updateType, data) {
    const event = {
      type: updateType,
      userId,
      data: {
        ...data,
        balance: data.newBalance || data.balance,
        transaction: data.transaction
      },
      timestamp: new Date().toISOString(),
      syncId: this.generateSyncId()
    };

    this.notifyUserSessions(userId, 'wallet_sync', event);
    console.log(`💰 Wallet sync for user ${userId}: ${updateType}`);
    return event.syncId;
  }

  /**
   * Sync slot update in tournament
   */
  syncSlotUpdate(tournamentId, updateType, data) {
    const event = {
      type: updateType,
      tournamentId,
      data,
      timestamp: new Date().toISOString(),
      syncId: this.generateSyncId()
    };

    this.io.to(`tournament_${tournamentId}`).emit('slot_sync', event);
    console.log(`🎯 Slot sync for tournament ${tournamentId}: ${updateType}`);
    return event.syncId;
  }

  /**
   * Get all socket IDs for a user
   */
  getUserSockets(userId) {
    return Array.from(this.userSessions.get(userId) || []);
  }

  /**
   * Get user info by socket ID
   */
  getUserInfo(socketId) {
    return this.activeUsers.get(socketId);
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId) {
    return this.userSessions.has(userId) && this.userSessions.get(userId).size > 0;
  }

  /**
   * Get user's active platforms
   */
  getUserPlatforms(userId) {
    const sockets = this.getUserSockets(userId);
    const platforms = new Set();
    
    sockets.forEach(socketId => {
      const userInfo = this.activeUsers.get(socketId);
      if (userInfo) {
        platforms.add(userInfo.platform);
      }
    });

    return Array.from(platforms);
  }

  /**
   * Notify all sessions of a user
   */
  notifyUserSessions(userId, event, data, excludeSocketId = null) {
    const userSockets = this.getUserSockets(userId);
    
    userSockets.forEach(socketId => {
      if (socketId !== excludeSocketId) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit(event, data);
        }
      }
    });
  }

  /**
   * Generate unique sync ID
   */
  generateSyncId() {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get sync statistics
   */
  getStats() {
    const totalUsers = this.userSessions.size;
    const totalConnections = this.activeUsers.size;
    const totalTournaments = this.tournamentSubscriptions.size;
    
    const platformStats = {};
    this.activeUsers.forEach(userInfo => {
      platformStats[userInfo.platform] = (platformStats[userInfo.platform] || 0) + 1;
    });

    return {
      totalUsers,
      totalConnections,
      totalTournaments,
      platformStats,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cleanup inactive connections
   */
  cleanup() {
    const now = new Date();
    const timeout = 5 * 60 * 1000; // 5 minutes

    this.activeUsers.forEach((userInfo, socketId) => {
      if (now - userInfo.lastSeen > timeout) {
        console.log(`🧹 Cleaning up inactive connection: ${socketId}`);
        this.unregisterUser(socketId);
      }
    });
  }

  /**
   * Update user's last seen timestamp
   */
  updateLastSeen(socketId) {
    const userInfo = this.activeUsers.get(socketId);
    if (userInfo) {
      userInfo.lastSeen = new Date();
    }
  }
}

module.exports = SyncService;