import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import config, { isSocketFeatureEnabled, disableSocketFeatureForSession } from '../config';
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

  const { user, token, updateUser } = useAuth();
  const { showInfo } = useNotification();
  const heartbeatRef = useRef(null);
  const socketRef = useRef(null);
  const initializingRef = useRef(false);
  const [connectionRetries, setConnectionRetries] = useState(0);

  useEffect(() => {
    if (user && token) {
      initializeSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, token]);

  const initializeSocket = async () => {
    if (typeof window === 'undefined') return;
    if (initializingRef.current) return;

    if (!isSocketFeatureEnabled()) {
      setSyncStatus('disconnected');
      return;
    }

    initializingRef.current = true;

    // Health check to verify WebSocket support
    try {
      const healthUrl = `${config.API_BASE_URL.replace(/\/$/, '')}/health`;
      const healthRes = await fetch(healthUrl, { cache: 'no-store' });
      const health = await healthRes.json();

      if (health?.serverless === true || health?.websocketSupported !== true) {
        console.info('[Socket] WebSocket not supported by backend');
        disableSocketFeatureForSession();
        setSyncStatus('disconnected');
        setIsConnected(false);
        initializingRef.current = false;
        return;
      }
    } catch (error) {
      console.warn('[Socket] Health check failed:', error?.message);
      // Don't disable socket on health check failure - try to connect anyway
      // Some environments block health check but allow socket
    }

    setSyncStatus('connecting');

    const newSocket = io(config.WS_URL, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 30000,
      autoConnect: true,
      forceNew: true,
      timeout: 10000,
      withCredentials: true,
    });

    socketRef.current = newSocket;

    const connectionTimeout = setTimeout(() => {
      if (!newSocket.connected) {
        console.warn('[Socket] Connection timeout');
        setSyncStatus('disconnected');
        initializingRef.current = false;
      }
    }, 12000);

    newSocket.on('connect', () => {
      clearTimeout(connectionTimeout);
      console.log('[Socket] Connected:', newSocket.id);
      setIsConnected(true);
      setSyncStatus('connected');
      setConnectionRetries(0);
      initializingRef.current = false;

      if (user && token) {
        newSocket.emit('authenticate', {
          userId: user.id,
          platform: 'web',
        });
      }

      startHeartbeat(newSocket);
    });

    newSocket.on('authenticated', (data) => {
      console.log('[Socket] Authenticated:', data);
      setLastSyncTime(new Date().toISOString());
    });

    newSocket.on('disconnect', (reason) => {
      clearTimeout(connectionTimeout);
      console.log('[Socket] Disconnected:', reason);
      setIsConnected(false);
      setSyncStatus('disconnected');
      stopHeartbeat();
      initializingRef.current = false;
    });

    newSocket.on('connect_error', (error) => {
      clearTimeout(connectionTimeout);
      console.warn('[Socket] Connection error:', error?.message);
      setIsConnected(false);
      setSyncStatus('disconnected');
      initializingRef.current = false;
      // Don't disable socket globally on connect error - allow retry
    });

    newSocket.on('reconnect', (attempt) => {
      console.log('[Socket] Reconnected after', attempt, 'attempts');
      setIsConnected(true);
      setSyncStatus('connected');
    });

    // ── Slot events (forwarded globally so any component can listen) ──────
    newSocket.on('slotChanged', (data) => {
      setLastMessage({ type: 'slotChanged', data });
      window.dispatchEvent(new CustomEvent('slotChanged', { detail: data }));
    });

    newSocket.on('playerAssigned', (data) => {
      setLastMessage({ type: 'playerAssigned', data });
      window.dispatchEvent(new CustomEvent('playerAssigned', { detail: data }));
    });

    newSocket.on('slotsLocked', (data) => {
      setLastMessage({ type: 'slotsLocked', data });
      window.dispatchEvent(new CustomEvent('slotsLocked', { detail: data }));
    });

    newSocket.on('slotsUnlocked', (data) => {
      setLastMessage({ type: 'slotsUnlocked', data });
      window.dispatchEvent(new CustomEvent('slotsUnlocked', { detail: data }));
    });

    newSocket.on('roomSlotUpdated', (data) => {
      setLastMessage({ type: 'roomSlotUpdated', data });
      window.dispatchEvent(new CustomEvent('roomSlotUpdated', { detail: data }));
    });

    newSocket.on('adminSlotChanged', (data) => {
      setLastMessage({ type: 'adminSlotChanged', data });
      window.dispatchEvent(new CustomEvent('adminSlotChanged', { detail: data }));
    });

    // ── Sync events ───────────────────────────────────────────────────────
    newSocket.on('tournament_sync', (event) => {
      setLastMessage({ type: 'tournament_sync', data: event });
      setLastSyncTime(event.timestamp);
      switch (event.type) {
        case 'tournament_joined':
          showInfo?.(`You joined ${event.data?.title}`);
          break;
        case 'tournament_started':
          showInfo?.(`${event.data?.title} has begun!`);
          break;
        default:
          break;
      }
    });

    newSocket.on('wallet_sync', (event) => {
      setLastMessage({ type: 'wallet_sync', data: event });
      setLastSyncTime(event.timestamp);
      switch (event.type) {
        case 'wallet_credited':
          showInfo?.(`Rs ${event.data?.transaction?.amount} added to your wallet`);
          break;
        case 'wallet_debited':
          showInfo?.(`Rs ${event.data?.transaction?.amount} deducted from your wallet`);
          break;
        default:
          break;
      }
    });

    newSocket.on('slot_sync', (event) => {
      setLastMessage({ type: 'slot_sync', data: event });
      setLastSyncTime(event.timestamp);
    });

    newSocket.on('player_updated', (data) => {
      setLastMessage({ type: 'player_updated', data });
      if (user && data.playerId === user._id && data.user) {
        updateUser(data.user);
      }
    });

    // ── Tournament broadcast events ───────────────────────────────────────
    const broadcastEvents = [
      'tournamentAdded', 'tournamentUpdated', 'tournamentDeleted',
      'tournamentStatusUpdated', 'tournamentJoined', 'tournament_message',
      'tournament_update', 'match_update', 'broadcastSent', 'broadcastScheduled',
      'payoutProcessed', 'payoutStatusUpdated', 'userFlagged', 'aiFlagUpdated',
      'mediaUploaded', 'mediaDeleted', 'user_status_change', 'wallet_update',
      'screenshot_uploaded', 'ai_verification', 'videoAdded', 'videoUpdated',
      'videoDeleted', 'notificationAdded', 'notificationUpdated', 'notificationSent',
      'notificationDeleted', 'newNotification', 'roomCredentialsReleased'
    ];

    broadcastEvents.forEach(eventName => {
      newSocket.on(eventName, (data) => {
        setLastMessage({ type: eventName, data });
      });
    });

    setSocket(newSocket);
  };

  const disconnectSocket = () => {
    stopHeartbeat();

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setSocket(null);
    setIsConnected(false);
    setSyncStatus('disconnected');
    initializingRef.current = false;
  };

  const startHeartbeat = (socketInstance) => {
    stopHeartbeat();
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

  const joinTournament = useCallback((tournamentId) => {
    const s = socketRef.current;
    if (s && s.connected && user) {
      s.emit('join_tournament', { tournamentId, userId: user.id });
    }
  }, [user]);

  const leaveTournament = useCallback((tournamentId) => {
    const s = socketRef.current;
    if (s && s.connected && user) {
      s.emit('leave_tournament', { tournamentId, userId: user.id });
    }
  }, [user]);

  const joinUser = useCallback((userId) => {
    const s = socketRef.current;
    if (s && s.connected) {
      s.emit('join_user', userId);
    }
  }, []);

  const sendTournamentMessage = useCallback((tournamentId, message, userId, username) => {
    const s = socketRef.current;
    if (s && s.connected) {
      s.emit('tournament_message', { tournamentId, message, userId, username });
    }
  }, []);

  const updateSlot = useCallback((tournamentId, slotData) => {
    const s = socketRef.current;
    if (s && s.connected && user) {
      s.emit('update_slot', { tournamentId, userId: user.id, ...slotData });
    }
  }, [user]);

  const forceSync = useCallback((type = 'user_data', data = {}) => {
    const s = socketRef.current;
    if (s && s.connected && user) {
      const syncId = `sync_${Date.now()}`;
      s.emit('sync_request', { type: `force_${type}`, syncId, data });
      return syncId;
    }
    return null;
  }, [user]);

  const getSyncStatus = useCallback(() => ({
    isConnected,
    syncStatus,
    lastSyncTime,
    activeSessions,
    platforms,
    connectionRetries
  }), [isConnected, syncStatus, lastSyncTime, activeSessions, platforms, connectionRetries]);

  const contextValue = {
    socket,
    isConnected,
    lastMessage,
    joinTournament,
    leaveTournament,
    joinUser,
    sendTournamentMessage,
    updateSlot,
    forceSync,
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
