import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import config from '../config';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [syncStatus, setSyncStatus] = useState('disconnected'); // disconnected, connecting, connected, error
  const [activeSessions, setActiveSessions] = useState(0);
  const [platforms, setPlatforms] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  
  const { user, token } = useAuth();
  const { showNotification } = useNotification();
  const heartbeatRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [connectionRetries, setConnectionRetries] = useState(0);
  const maxRetries = 5;

  useEffect(() => {
    if (user && token) {
      initializeSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [user, token]);

  const initializeSocket = () => {
    setSyncStatus('connecting');
    
    const newSocket = io(config.WS_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 0, // We'll handle reconnection manually
      autoConnect: true,
      forceNew: true,
    });

    // Enhanced connection handling for unified platform
    newSocket.on('connect', () => {
      console.log('🔗 Socket connected:', newSocket.id);
      setIsConnected(true);
      setSyncStatus('connected');
      setConnectionRetries(0);
      
      // Authenticate with backend for unified platform sync
      if (user && token) {
        newSocket.emit('authenticate', {
          userId: user.id,
          platform: 'web',
          token: getWebPushToken() // Get web push token if available
        });
      }
      
      startHeartbeat(newSocket);
    });

    newSocket.on('authenticated', (data) => {
      console.log('✅ Authenticated with sync service:', data);
      setLastSyncTime(new Date().toISOString());
      
      // Request sync status
      newSocket.emit('sync_request', {
        type: 'initial_sync',
        lastSyncId: null
      });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
      setSyncStatus('disconnected');
      stopHeartbeat();
      
      if (reason !== 'io client disconnect') {
        scheduleReconnect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setIsConnected(false);
      setSyncStatus('error');
      scheduleReconnect();
    });

    // Unified Platform Sync Events
    newSocket.on('tournament_sync', (event) => {
      console.log('🎮 Tournament sync:', event.type);
      setLastMessage({ type: 'tournament_sync', data: event });
      setLastSyncTime(event.timestamp);
      
      // Show notifications for important tournament events
      switch (event.type) {
        case 'tournament_joined':
          showNotification('Tournament Joined', `You joined ${event.data.title}`, 'success');
          break;
        case 'tournament_started':
          showNotification('Tournament Started', `${event.data.title} has begun!`, 'info');
          break;
        case 'tournament_ending_soon':
          showNotification('Tournament Ending Soon', `${event.data.title} ends in ${event.data.timeLeft}`, 'warning');
          break;
      }
    });

    newSocket.on('user_sync', (event) => {
      console.log('👤 User sync:', event.type);
      setLastMessage({ type: 'user_sync', data: event });
      setLastSyncTime(event.timestamp);
      
      if (event.type === 'user_session_connected') {
        showNotification('New Session', `Logged in from ${event.data.platform}`, 'info');
      }
    });

    newSocket.on('wallet_sync', (event) => {
      console.log('💰 Wallet sync:', event.type);
      setLastMessage({ type: 'wallet_sync', data: event });
      setLastSyncTime(event.timestamp);
      
      switch (event.type) {
        case 'wallet_credited':
          showNotification('Wallet Credited', `₹${event.data.transaction.amount} added to your wallet`, 'success');
          break;
        case 'wallet_debited':
          showNotification('Wallet Debited', `₹${event.data.transaction.amount} deducted from your wallet`, 'info');
          break;
        case 'low_balance':
          showNotification('Low Balance', `Your wallet balance is ₹${event.data.balance}. Recharge now!`, 'warning');
          break;
      }
    });

    newSocket.on('slot_sync', (event) => {
      console.log('🎯 Slot sync:', event.type);
      setLastMessage({ type: 'slot_sync', data: event });
      setLastSyncTime(event.timestamp);
      
      if (event.type === 'slot_taken') {
        showNotification('Slot Update', 'A slot was taken in your tournament', 'info');
      }
    });

    newSocket.on('sync_response', (data) => {
      console.log('🔄 Sync response:', data.type);
      setLastSyncTime(data.timestamp);
    });

    // Legacy tournament events (keeping for backward compatibility)
    newSocket.on('tournamentAdded', (tournament) => {
      console.log('New tournament added:', tournament);
      setLastMessage({ type: 'tournamentAdded', data: tournament });
    });

    newSocket.on('tournamentUpdated', (tournament) => {
      console.log('Tournament updated:', tournament);
      setLastMessage({ type: 'tournamentUpdated', data: tournament });
    });

    newSocket.on('tournamentDeleted', (tournamentId) => {
      console.log('Tournament deleted:', tournamentId);
      setLastMessage({ type: 'tournamentDeleted', data: tournamentId });
    });

    newSocket.on('tournamentStatusUpdated', (statusUpdate) => {
      console.log('Tournament status updated:', statusUpdate);
      setLastMessage({ type: 'tournamentStatusUpdated', data: statusUpdate });
    });

    newSocket.on('tournamentJoined', (joinData) => {
      console.log('Tournament joined:', joinData);
      setLastMessage({ type: 'tournamentJoined', data: joinData });
    });

    newSocket.on('tournament_message', (message) => {
      console.log('Tournament message:', message);
      setLastMessage({ type: 'tournament_message', data: message });
    });

    newSocket.on('tournament_update', (update) => {
      console.log('Tournament update:', update);
      setLastMessage({ type: 'tournament_update', data: update });
    });

    newSocket.on('match_update', (matchData) => {
      console.log('Match update:', matchData);
      setLastMessage({ type: 'match_update', data: matchData });
    });

    // Broadcast real-time events
    newSocket.on('broadcastSent', (broadcast) => {
      console.log('Broadcast sent:', broadcast);
      setLastMessage({ type: 'broadcastSent', data: broadcast });
    });

    newSocket.on('broadcastScheduled', (broadcast) => {
      console.log('Broadcast scheduled:', broadcast);
      setLastMessage({ type: 'broadcastScheduled', data: broadcast });
    });

    // Payout real-time events
    newSocket.on('payoutProcessed', (payout) => {
      console.log('Payout processed:', payout);
      setLastMessage({ type: 'payoutProcessed', data: payout });
    });

    newSocket.on('payoutStatusUpdated', (payout) => {
      console.log('Payout status updated:', payout);
      setLastMessage({ type: 'payoutStatusUpdated', data: payout });
    });

    // AI monitoring real-time events
    newSocket.on('userFlagged', (flag) => {
      console.log('User flagged:', flag);
      setLastMessage({ type: 'userFlagged', data: flag });
    });

    newSocket.on('aiFlagUpdated', (flag) => {
      console.log('AI flag updated:', flag);
      setLastMessage({ type: 'aiFlagUpdated', data: flag });
    });

    // Media real-time events
    newSocket.on('mediaUploaded', (media) => {
      console.log('Media uploaded:', media);
      setLastMessage({ type: 'mediaUploaded', data: media });
    });

    newSocket.on('mediaDeleted', (media) => {
      console.log('Media deleted:', media);
      setLastMessage({ type: 'mediaDeleted', data: media });
    });

    // User-specific real-time events
    newSocket.on('user_status_change', (statusChange) => {
      console.log('User status changed:', statusChange);
      setLastMessage({ type: 'user_status_change', data: statusChange });
    });

    newSocket.on('wallet_update', (walletUpdate) => {
      console.log('Wallet updated:', walletUpdate);
      setLastMessage({ type: 'wallet_update', data: walletUpdate });
    });

    // Screenshot and AI verification events
    newSocket.on('screenshot_uploaded', (screenshot) => {
      console.log('Screenshot uploaded:', screenshot);
      setLastMessage({ type: 'screenshot_uploaded', data: screenshot });
    });

    newSocket.on('ai_verification', (verification) => {
      console.log('AI verification:', verification);
      setLastMessage({ type: 'ai_verification', data: verification });
    });

    // Video real-time events
    newSocket.on('videoAdded', (video) => {
      console.log('Video added:', video);
      setLastMessage({ type: 'videoAdded', data: video });
    });
    newSocket.on('videoUpdated', (video) => {
      console.log('Video updated:', video);
      setLastMessage({ type: 'videoUpdated', data: video });
    });
    newSocket.on('videoDeleted', (videoId) => {
      console.log('Video deleted:', videoId);
      setLastMessage({ type: 'videoDeleted', data: videoId });
    });
    
    // Notification real-time events
    newSocket.on('notificationAdded', (notification) => {
      console.log('Notification added:', notification);
      setLastMessage({ type: 'notificationAdded', data: notification });
    });
    newSocket.on('notificationUpdated', (notification) => {
      console.log('Notification updated:', notification);
      setLastMessage({ type: 'notificationUpdated', data: notification });
    });
    newSocket.on('notificationSent', (notification) => {
      console.log('Notification sent:', notification);
      setLastMessage({ type: 'notificationSent', data: notification });
    });
    newSocket.on('notificationDeleted', (notificationId) => {
      console.log('Notification deleted:', notificationId);
      setLastMessage({ type: 'notificationDeleted', data: notificationId });
    });
    
    // New notification for users (when admin sends notification)
    newSocket.on('newNotification', (notification) => {
      console.log('New notification received:', notification);
      setLastMessage({ type: 'newNotification', data: notification });
    });

    setSocket(newSocket);
  };

  const disconnectSocket = () => {
    stopHeartbeat();
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    
    setIsConnected(false);
    setSyncStatus('disconnected');
  };

  const startHeartbeat = (socketInstance) => {
    heartbeatRef.current = setInterval(() => {
      if (socketInstance?.connected) {
        socketInstance.emit('heartbeat');
      }
    }, 30000); // Every 30 seconds
  };

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  };

  const scheduleReconnect = () => {
    if (connectionRetries >= maxRetries) {
      console.log('❌ Max reconnection attempts reached');
      setSyncStatus('error');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, connectionRetries), 30000); // Exponential backoff, max 30s
    
    console.log(`🔄 Scheduling reconnect in ${delay}ms (attempt ${connectionRetries + 1})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      setConnectionRetries(prev => prev + 1);
      initializeSocket();
    }, delay);
  };

  const getWebPushToken = () => {
    // Placeholder for web push token
    // In a real implementation, you'd get this from service worker registration
    return null;
  };

  // Enhanced helper functions for unified platform sync
  const joinTournament = (tournamentId) => {
    if (socket && isConnected && user) {
      socket.emit('join_tournament', {
        tournamentId,
        userId: user.id
      });
    }
  };

  const leaveTournament = (tournamentId) => {
    if (socket && isConnected && user) {
      socket.emit('leave_tournament', {
        tournamentId,
        userId: user.id
      });
    }
  };

  const joinUser = (userId) => {
    if (socket && isConnected) {
      socket.emit('join_user', userId);
    }
  };

  const sendTournamentMessage = (tournamentId, message, userId, username) => {
    if (socket && isConnected) {
      socket.emit('tournament_message', {
        tournamentId,
        message,
        userId,
        username
      });
    }
  };

  const sendScreenshotUpload = (tournamentId, userId, screenshotUrl) => {
    if (socket && isConnected) {
      socket.emit('screenshot_uploaded', {
        tournamentId,
        userId,
        screenshotUrl
      });
    }
  };

  // New unified platform sync functions
  const updateSlot = (tournamentId, slotData) => {
    if (socket && isConnected && user) {
      socket.emit('update_slot', {
        tournamentId,
        userId: user.id,
        ...slotData
      });
    }
  };

  const forceSync = (type = 'user_data', data = {}) => {
    if (socket && isConnected && user) {
      const syncId = `sync_${Date.now()}`;
      
      socket.emit('sync_request', {
        type: `force_${type}`,
        syncId,
        data
      });
      
      return syncId;
    }
    return null;
  };

  const registerPushToken = (token) => {
    if (socket && isConnected && user) {
      socket.emit('update_push_token', {
        userId: user.id,
        token,
        platform: 'web'
      });
    }
  };

  const getSyncStatus = () => {
    return {
      isConnected,
      syncStatus,
      lastSyncTime,
      activeSessions,
      platforms,
      connectionRetries
    };
  };

  const contextValue = {
    // Original socket functions
    socket,
    isConnected,
    lastMessage,
    joinTournament,
    leaveTournament,
    joinUser,
    sendTournamentMessage,
    sendScreenshotUpload,
    
    // New unified platform sync functions
    updateSlot,
    forceSync,
    registerPushToken,
    getSyncStatus,
    
    // Sync state
    syncStatus,
    lastSyncTime,
    activeSessions,
    platforms,
    connectionRetries
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

