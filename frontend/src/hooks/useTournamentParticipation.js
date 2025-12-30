import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import io from 'socket.io-client';
import { getTournamentParticipationStatus } from '../services/api';
import config from '../config';

/**
 * Hook for managing tournament participation status
 * Handles duplicate participation prevention and real-time updates
 */
export const useTournamentParticipation = (tournamentId) => {
  const { user, token } = useAuth();
  const [participationStatus, setParticipationStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch participation status
  const fetchParticipationStatus = useCallback(async () => {
    if (!tournamentId || !token) return;

    try {
      setLoading(true);
      setError(null);

      const response = await getTournamentParticipationStatus(tournamentId);
      setParticipationStatus(response.data);
    } catch (err) {
      console.error('Error fetching participation status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tournamentId, token]);

  // Check if user can join tournament
  const canJoin = useCallback(() => {
    if (!participationStatus) return false;
    
    return participationStatus.canJoin && 
           !participationStatus.hasJoined && 
           !participationStatus.payments?.some(p => p.status === 'pending');
  }, [participationStatus]);

  // Check if user has already joined
  const hasJoined = useCallback(() => {
    return participationStatus?.hasJoined || false;
  }, [participationStatus]);

  // Get participation details
  const getParticipationDetails = useCallback(() => {
    return participationStatus?.participation || null;
  }, [participationStatus]);

  // Get payment status
  const getPaymentStatus = useCallback(() => {
    // First check if the API response includes paymentStatus directly
    if (participationStatus?.paymentStatus) {
      return participationStatus.paymentStatus;
    }
    
    // Fallback to checking payments array
    if (!participationStatus?.payments?.length) return 'none';
    
    const latestPayment = participationStatus.payments[0]; // Already sorted by createdAt desc
    return latestPayment.status;
  }, [participationStatus]);

  // Get latest payment details
  const getLatestPayment = useCallback(() => {
    if (!participationStatus?.payments?.length) return null;
    return participationStatus.payments[0];
  }, [participationStatus]);

  // Check if user has pending payment
  const hasPendingPayment = useCallback(() => {
    return participationStatus?.payments?.some(p => p.status === 'pending') || false;
  }, [participationStatus]);

  // Get join button state
  const getJoinButtonState = useCallback(() => {
    if (loading) return { state: 'loading', text: 'Loading...', disabled: true };
    
    if (hasJoined()) {
      const paymentStatus = getPaymentStatus();
      if (paymentStatus === 'completed') {
        return { state: 'joined', text: 'Already Registered', disabled: true, color: 'success' };
      } else {
        return { state: 'payment-pending', text: 'Payment Pending', disabled: true, color: 'warning' };
      }
    }
    
    if (hasPendingPayment()) {
      return { state: 'payment-pending', text: 'Payment Pending', disabled: true, color: 'warning' };
    }
    
    if (canJoin()) {
      return { state: 'can-join', text: 'Join Tournament', disabled: false, color: 'primary' };
    }
    
    return { state: 'cannot-join', text: 'Cannot Join', disabled: true, color: 'default' };
  }, [loading, hasJoined, getPaymentStatus, hasPendingPayment, canJoin]);

  // Refresh participation status
  const refresh = useCallback(() => {
    fetchParticipationStatus();
  }, [fetchParticipationStatus]);

  // Initial fetch
  useEffect(() => {
    fetchParticipationStatus();
  }, [fetchParticipationStatus]);

  return {
    participationStatus,
    loading,
    error,
    canJoin: canJoin(),
    hasJoined: hasJoined(),
    participationDetails: getParticipationDetails(),
    paymentStatus: getPaymentStatus(),
    latestPayment: getLatestPayment(),
    hasPendingPayment: hasPendingPayment(),
    joinButtonState: getJoinButtonState(),
    refresh,
    // Helper methods
    methods: {
      canJoin,
      hasJoined,
      getParticipationDetails,
      getPaymentStatus,
      getLatestPayment,
      hasPendingPayment,
      getJoinButtonState
    }
  };
};

/**
 * Hook for managing real-time slot editing
 */
export const useSlotEditing = (tournamentId, user) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lockedSlots, setLockedSlots] = useState(new Set());
  const [editingUsers, setEditingUsers] = useState(new Map());
  const { token } = useAuth();

  useEffect(() => {
    if (!tournamentId || !user) return;

    const newSocket = io(config.WS_URL, {
      transports: ['polling', 'websocket'],
      auth: {
        token: token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
      }
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join_tournament', tournamentId);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Handle slot locking events
    newSocket.on('slot_locked', (data) => {
      const slotKey = `${data.teamNumber}-${data.slotNumber}`;
      setLockedSlots(prev => new Set([...prev, slotKey]));
    });

    newSocket.on('slot_unlocked', (data) => {
      const slotKey = `${data.teamNumber}-${data.slotNumber}`;
      setLockedSlots(prev => {
        const newSet = new Set(prev);
        newSet.delete(slotKey);
        return newSet;
      });
    });

    // Handle editing status
    newSocket.on('slot_edit_start', (data) => {
      const slotKey = `${data.teamNumber}-${data.slotNumber}`;
      setEditingUsers(prev => new Map(prev.set(slotKey, data.userId)));
    });

    newSocket.on('slot_edit_end', (data) => {
      const slotKey = `${data.teamNumber}-${data.slotNumber}`;
      setEditingUsers(prev => {
        const newMap = new Map(prev);
        newMap.delete(slotKey);
        return newMap;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave_tournament', tournamentId);
      newSocket.close();
    };
  }, [tournamentId, user, token]);

  // Request slot lock before moving
  const requestSlotLock = useCallback((teamNumber, slotNumber) => {
    if (socket && isConnected) {
      socket.emit('request_slot_lock', {
        tournamentId,
        teamNumber,
        slotNumber,
        userId: user._id
      });
    }
  }, [socket, isConnected, tournamentId, user]);

  // Notify start of slot editing
  const notifyEditStart = useCallback((teamNumber, slotNumber) => {
    if (socket && isConnected) {
      socket.emit('slot_edit_start', {
        tournamentId,
        teamNumber,
        slotNumber,
        userId: user._id
      });
    }
  }, [socket, isConnected, tournamentId, user]);

  // Notify end of slot editing
  const notifyEditEnd = useCallback((teamNumber, slotNumber) => {
    if (socket && isConnected) {
      socket.emit('slot_edit_end', {
        tournamentId,
        teamNumber,
        slotNumber,
        userId: user._id
      });
    }
  }, [socket, isConnected, tournamentId, user]);

  // Check if slot is locked
  const isSlotLocked = useCallback((teamNumber, slotNumber) => {
    const slotKey = `${teamNumber}-${slotNumber}`;
    return lockedSlots.has(slotKey);
  }, [lockedSlots]);

  // Check if slot is being edited
  const isSlotBeingEdited = useCallback((teamNumber, slotNumber) => {
    const slotKey = `${teamNumber}-${slotNumber}`;
    return editingUsers.has(slotKey);
  }, [editingUsers]);

  // Get user editing a slot
  const getSlotEditor = useCallback((teamNumber, slotNumber) => {
    const slotKey = `${teamNumber}-${slotNumber}`;
    return editingUsers.get(slotKey);
  }, [editingUsers]);

  return {
    socket,
    isConnected,
    lockedSlots,
    editingUsers,
    requestSlotLock,
    notifyEditStart,
    notifyEditEnd,
    isSlotLocked,
    isSlotBeingEdited,
    getSlotEditor
  };
};

export default useTournamentParticipation;