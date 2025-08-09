/**
 * Sync Provider
 * Manages real-time synchronization between mobile app and backend
 */

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from 'react-native';
import io from 'socket.io-client';
import messaging from '@react-native-firebase/messaging';
import NetInfo from '@react-native-community/netinfo';

import {
  setConnectionStatus,
  updateSyncTime,
  setSessions,
  addPendingSync,
  removePendingSync,
  incrementRetries,
  resetRetries,
  setError,
} from '../store/slices/syncSlice';
import { updateTournament, setTournaments } from '../store/slices/tournamentsSlice';
import { updateWallet } from '../store/slices/walletSlice';
import { addNotification } from '../store/slices/notificationsSlice';
import { API_BASE_URL } from '../config';

const SyncContext = createContext();

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};

const SyncProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user, token } = useSelector(state => state.auth);
  const { connectionRetries, maxRetries } = useSelector(state => state.sync);
  
  const socketRef = useRef(null);
  const heartbeatRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    if (user && token) {
      initializeSync();
    } else {
      disconnectSync();
    }

    return () => {
      disconnectSync();
    };
  }, [user, token]);

  useEffect(() => {
    // Handle app state changes
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active' && user && token) {
        // App came to foreground, reconnect if needed
        if (!socketRef.current?.connected) {
          initializeSync();
        }
      } else if (nextAppState === 'background') {
        // App went to background, keep connection but reduce activity
        stopHeartbeat();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [user, token]);

  useEffect(() => {
    // Handle network connectivity changes
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && user && token && !socketRef.current?.connected) {
        // Network reconnected, try to sync
        initializeSync();
      } else if (!state.isConnected) {
        // Network disconnected
        dispatch(setConnectionStatus({
          isConnected: false,
          status: 'disconnected'
        }));
      }
    });

    return unsubscribe;
  }, [user, token]);

  const initializeSync = async () => {
    try {
      dispatch(setConnectionStatus({
        isConnected: false,
        status: 'connecting'
      }));

      // Get FCM token for push notifications
      const fcmToken = await messaging().getToken();

      // Initialize socket connection
      socketRef.current = io(API_BASE_URL, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
      });

      setupSocketListeners(fcmToken);
      
    } catch (error) {
      console.error('Sync initialization error:', error);
      dispatch(setError(error.message));
      scheduleReconnect();
    }
  };

  const setupSocketListeners = (fcmToken) => {
    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('🔗 Connected to sync service');
      
      // Authenticate with backend
      socket.emit('authenticate', {
        userId: user.id,
        platform: 'mobile',
        token: fcmToken
      });

      dispatch(setConnectionStatus({
        isConnected: true,
        status: 'connected'
      }));
      dispatch(resetRetries());
      dispatch(updateSyncTime());
      
      startHeartbeat();
    });

    socket.on('authenticated', (data) => {
      console.log('✅ Authenticated with sync service', data);
      
      // Request current sync status
      socket.emit('sync_request', {
        type: 'initial_sync',
        lastSyncId: null
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from sync service:', reason);
      
      dispatch(setConnectionStatus({
        isConnected: false,
        status: 'disconnected'
      }));
      
      stopHeartbeat();
      
      if (reason !== 'io client disconnect') {
        scheduleReconnect();
      }
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Sync connection error:', error);
      dispatch(setError(error.message));
      scheduleReconnect();
    });

    // Tournament sync events
    socket.on('tournament_sync', (event) => {
      console.log('🎮 Tournament sync:', event.type);
      
      switch (event.type) {
        case 'tournament_updated':
          dispatch(updateTournament(event.data));
          break;
        case 'tournament_joined':
          dispatch(updateTournament(event.data));
          showNotification('Tournament Joined', `You joined ${event.data.title}`);
          break;
        case 'tournament_started':
          dispatch(updateTournament(event.data));
          showNotification('Tournament Started', `${event.data.title} has begun!`);
          break;
        default:
          dispatch(updateTournament(event.data));
      }
      
      dispatch(updateSyncTime());
    });

    // User sync events
    socket.on('user_sync', (event) => {
      console.log('👤 User sync:', event.type);
      
      switch (event.type) {
        case 'profile_updated':
          // Handle profile updates
          break;
        case 'session_connected':
          showNotification('New Session', `Logged in from ${event.data.platform}`);
          break;
        default:
          console.log('Unhandled user sync:', event.type);
      }
      
      dispatch(updateSyncTime());
    });

    // Wallet sync events
    socket.on('wallet_sync', (event) => {
      console.log('💰 Wallet sync:', event.type);
      
      dispatch(updateWallet({
        balance: event.data.balance,
        transaction: event.data.transaction
      }));
      
      switch (event.type) {
        case 'wallet_credited':
          showNotification('Wallet Credited', `₹${event.data.transaction.amount} added`);
          break;
        case 'wallet_debited':
          showNotification('Wallet Debited', `₹${event.data.transaction.amount} deducted`);
          break;
      }
      
      dispatch(updateSyncTime());
    });

    // Slot sync events
    socket.on('slot_sync', (event) => {
      console.log('🎯 Slot sync:', event.type);
      
      // Update tournament with new slot data
      dispatch(updateTournament({
        id: event.tournamentId,
        slots: event.data.slots
      }));
      
      if (event.type === 'slot_taken') {
        showNotification('Slot Update', 'A slot was taken in your tournament');
      }
      
      dispatch(updateSyncTime());
    });

    // Push notification token update
    socket.on('push_token_updated', (data) => {
      console.log('📱 Push token updated:', data);
    });

    // Sync response
    socket.on('sync_response', (data) => {
      console.log('🔄 Sync response:', data.type);
      dispatch(updateSyncTime());
    });
  };

  const startHeartbeat = () => {
    heartbeatRef.current = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('heartbeat');
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
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, connectionRetries), 30000); // Exponential backoff, max 30s
    
    console.log(`🔄 Scheduling reconnect in ${delay}ms (attempt ${connectionRetries + 1})`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      dispatch(incrementRetries());
      initializeSync();
    }, delay);
  };

  const disconnectSync = () => {
    stopHeartbeat();
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    dispatch(setConnectionStatus({
      isConnected: false,
      status: 'disconnected'
    }));
  };

  const showNotification = (title, body) => {
    dispatch(addNotification({
      id: Date.now(),
      title,
      body,
      timestamp: new Date().toISOString(),
      read: false
    }));
  };

  // Sync API methods
  const joinTournament = (tournamentId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_tournament', {
        tournamentId,
        userId: user.id
      });
    }
  };

  const leaveTournament = (tournamentId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_tournament', {
        tournamentId,
        userId: user.id
      });
    }
  };

  const updateSlot = (tournamentId, slotData) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('update_slot', {
        tournamentId,
        userId: user.id,
        ...slotData
      });
    }
  };

  const forceSync = (type = 'user_data', data = {}) => {
    if (socketRef.current?.connected) {
      const syncId = `sync_${Date.now()}`;
      
      dispatch(addPendingSync({
        id: syncId,
        type,
        data
      }));
      
      socketRef.current.emit('sync_request', {
        type: `force_${type}`,
        syncId,
        data
      });
      
      return syncId;
    }
    return null;
  };

  const contextValue = {
    joinTournament,
    leaveTournament,
    updateSlot,
    forceSync,
    isConnected: socketRef.current?.connected || false,
  };

  return (
    <SyncContext.Provider value={contextValue}>
      {children}
    </SyncContext.Provider>
  );
};

export default SyncProvider;