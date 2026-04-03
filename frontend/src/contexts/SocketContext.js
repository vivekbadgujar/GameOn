import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import config, { isSocketFeatureEnabled } from '../config';
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
  const [syncStatus, setSyncStatus] = useState('disconnected');
  const [activeSessions, setActiveSessions] = useState(0);
  const [platforms, setPlatforms] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  
  const { user, token } = useAuth();
  const { showNotification } = useNotification();
  const heartbeatRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [connectionRetries, setConnectionRetries] = useState(0);
  const maxRetries = 15; // Allow up to 15 reconnect attempts with exponential back-off

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
    if (typeof window === 'undefined') {
      console.log('[Socket] Skipping socket initialization (server-side)');
      return;
    }

    if (!isSocketFeatureEnabled()) {
      console.log('[Socket] Skipping socket initialization (feature disabled)');
      setSyncStatus('disconnected');
      return;
    }

    setSyncStatus('connecting');
    
    const newSocket = io(config.WS_URL, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      // Socket.IO built-in reconnection — let it handle transient drops automatically
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 30000,
      autoConnect: true,
      forceNew: true,
      timeout: 10000,
      withCredentials: true,
    });

    // Add connection timeout
    const connectionTimeout = setTimeout(() => {
      if (!newSocket.connected) {
        console.warn('[Socket] Connection timeout - disabling WebSocket');
        newSocket.disconnect();
        setSyncStatus('disconnected');
      }
    }, 10000);

    newSocket.on('connect', () => {
      clearTimeout(connectionTimeout);
      console.log('🔗 Socket connected:', newSocket.id);
      setIsConnected(true);
      setSyncStatus('connected');
      setConnectionRetries(0);
      
      if (user && token) {
        newSocket.emit('authenticate', {
          userId: user.id,
          platform: 'web',
          token: getWebPushToken()
        });
      }
      
      startHeartbeat(newSocket);
    });

    newSocket.on('authenticated', (data) => {
      console.log('✅ Authenticated with sync service:', data);
      setLastSyncTime(new Date().toISOString());
      
      newSocket.emit('sync_request', {
        type: 'initial_sync',
        lastSyncId: null
      });
    });

    newSocket.on('disconnect', (reason) => {
      clearTimeout(connectionTimeout);
      console.log('🔌 Socket disconnected:', reason);
      setIsConnected(false);
      setSyncStatus('disconnected');
      stopHeartbeat();
      
      if (reason !== 'io client disconnect') {
        scheduleReconnect();
      }
    });

    newSocket.on('connect_error', (error) => {
      clearTimeout(connectionTimeout);
      console.warn('[Socket] Connection error (will retry):', error?.message || error);
      setIsConnected(false);
      setSyncStatus('disconnected');
      // NOTE: do NOT call disableSocketFeatureForSession() here — that permanently
      // kills the socket for the whole browser session. Instead let scheduleReconnect
      // handle the retry with exponential back-off.
    });

    // Unified Platform Sync Events
    newSocket.on('tournament_sync', (event) => {
      setLastMessage({ type: 'tournament_sync', data: event });
      setLastSyncTime(event.timestamp);
      
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
      setLastMessage({ type: 'user_sync', data: event });
      setLastSyncTime(event.timestamp);
      
      if (event.type === 'user_session_connected') {
        showNotification('New Session', `Logged in from ${event.data.platform}`, 'info');
      }
    });

    newSocket.on('wallet_sync', (event) => {
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
      setLastMessage({ type: 'slot_sync', data: event });
      setLastSyncTime(event.timestamp);
      
      if (event.type === 'slot_taken') {
        showNotification('Slot Update', 'A slot was taken in your tournament', 'info');
      }
    });

    newSocket.on('sync_response', (data) => {
      setLastSyncTime(data.timestamp);
    });

    // Legacy tournament events
    newSocket.on('tournamentAdded', (tournament) => {
      setLastMessage({ type: 'tournamentAdded', data: tournament });
    });

    newSocket.on('tournamentUpdated', (tournament) => {
      setLastMessage({ type: 'tournamentUpdated', data: tournament });
    });

    newSocket.on('tournamentDeleted', (tournamentId) => {
      setLastMessage({ type: 'tournamentDeleted', data: tournamentId });
    });

    newSocket.on('tournamentStatusUpdated', (statusUpdate) => {
      setLastMessage({ type: 'tournamentStatusUpdated', data: statusUpdate });
    });

    newSocket.on('tournamentJoined', (joinData) => {
      setLastMessage({ type: 'tournamentJoined', data: joinData });
    });

    newSocket.on('tournament_message', (message) => {
      setLastMessage({ type: 'tournament_message', data: message });
    });

    newSocket.on('tournament_update', (update) => {
      setLastMessage({ type: 'tournament_update', data: update });
    });

    newSocket.on('match_update', (matchData) => {
      setLastMessage({ type: 'match_update', data: matchData });
    });

    newSocket.on('broadcastSent', (broadcast) => {
      setLastMessage({ type: 'broadcastSent', data: broadcast });
    });

    newSocket.on('broadcastScheduled', (broadcast) => {
      setLastMessage({ type: 'broadcastScheduled', data: broadcast });
    });

    newSocket.on('payoutProcessed', (payout) => {
      setLastMessage({ type: 'payoutProcessed', data: payout });
    });

    newSocket.on('payoutStatusUpdated', (payout) => {
      setLastMessage({ type: 'payoutStatusUpdated', data: payout });
    });

    newSocket.on('userFlagged', (flag) => {
      setLastMessage({ type: 'userFlagged', data: flag });
    });

    newSocket.on('aiFlagUpdated', (flag) => {
      setLastMessage({ type: 'aiFlagUpdated', data: flag });
    });

    newSocket.on('mediaUploaded', (media) => {
      setLastMessage({ type: 'mediaUploaded', data: media });
    });

    newSocket.on('mediaDeleted', (media) => {
      setLastMessage({ type: 'mediaDeleted', data: media });
    });

    newSocket.on('user_status_change', (statusChange) => {
      setLastMessage({ type: 'user_status_change', data: statusChange });
    });

    newSocket.on('wallet_update', (walletUpdate) => {
      setLastMessage({ type: 'wallet_update', data: walletUpdate });
    });

    newSocket.on('screenshot_uploaded', (screenshot) => {
      setLastMessage({ type: 'screenshot_uploaded', data: screenshot });
    });

    newSocket.on('ai_verification', (verification) => {
      setLastMessage({ type: 'ai_verification', data: verification });
    });

    newSocket.on('videoAdded', (video) => {
      setLastMessage({ type: 'videoAdded', data: video });
    });
    newSocket.on('videoUpdated', (video) => {
      setLastMessage({ type: 'videoUpdated', data: video });
    });
    newSocket.on('videoDeleted', (videoId) => {
      setLastMessage({ type: 'videoDeleted', data: videoId });
    });
    
    newSocket.on('notificationAdded', (notification) => {
      setLastMessage({ type: 'notificationAdded', data: notification });
    });
    newSocket.on('notificationUpdated', (notification) => {
      setLastMessage({ type: 'notificationUpdated', data: notification });
    });
    newSocket.on('notificationSent', (notification) => {
      setLastMessage({ type: 'notificationSent', data: notification });
    });
    newSocket.on('notificationDeleted', (notificationId) => {
      setLastMessage({ type: 'notificationDeleted', data: notificationId });
    });
    
    newSocket.on('newNotification', (notification) => {
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
    }, 30000);
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

    const delay = Math.min(1000 * Math.pow(2, connectionRetries), 30000);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      setConnectionRetries(prev => prev + 1);
      initializeSocket();
    }, delay);
  };

  const getWebPushToken = () => {
    return null;
  };

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
    socket,
    isConnected,
    lastMessage,
    joinTournament,
    leaveTournament,
    joinUser,
    sendTournamentMessage,
    sendScreenshotUpload,
    updateSlot,
    forceSync,
    registerPushToken,
    getSyncStatus,
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
