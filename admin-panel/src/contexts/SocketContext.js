import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useNotification } from './NotificationContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { showSuccess, showInfo } = useNotification();

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('🔌 Socket.IO connected:', newSocket.id);
      setIsConnected(true);
      showInfo('Live sync connected');
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Socket.IO disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔌 Socket.IO connection error:', error);
      setIsConnected(false);
    });

    // Tournament-related events
    newSocket.on('tournamentStatusUpdated', (data) => {
      console.log('🏆 Tournament status updated:', data);
      showSuccess(`Tournament status updated to ${data.status}`);
      // Trigger page refresh or specific component updates
      window.dispatchEvent(new CustomEvent('tournamentUpdated', { detail: data }));
    });

    newSocket.on('participantConfirmed', (data) => {
      console.log('✅ Participant confirmed:', data);
      showSuccess('Player confirmed by another admin');
      window.dispatchEvent(new CustomEvent('participantUpdated', { detail: data }));
    });

    newSocket.on('participantsBulkConfirmed', (data) => {
      console.log('📦 Participants bulk confirmed:', data);
      showSuccess(`${data.confirmedCount} players confirmed by another admin`);
      window.dispatchEvent(new CustomEvent('participantsUpdated', { detail: data }));
    });

    newSocket.on('slotsSwapped', (data) => {
      console.log('🔄 Slots swapped:', data);
      showInfo(`Slots ${data.sourceSlot} and ${data.destSlot} swapped by another admin`);
      window.dispatchEvent(new CustomEvent('slotsUpdated', { detail: data }));
    });

    newSocket.on('participantKicked', (data) => {
      console.log('👢 Participant kicked:', data);
      showInfo('Player kicked by another admin');
      window.dispatchEvent(new CustomEvent('participantUpdated', { detail: data }));
    });

    newSocket.on('squadJoined', (data) => {
      console.log('👥 Squad joined:', data);
      showSuccess(`Squad joined tournament (${data.squadMembers.length} players)`);
      window.dispatchEvent(new CustomEvent('squadUpdated', { detail: data }));
    });

    newSocket.on('roomSlotUpdated', (data) => {
      console.log('🎮 Room slot updated:', data);
      if (data.action === 'assigned') {
        showInfo(`Player assigned to Team ${data.teamNumber}, Slot ${data.slotNumber}`);
      } else {
        showInfo(`Player moved from Team ${data.fromTeam} to Team ${data.toTeam}`);
      }
      window.dispatchEvent(new CustomEvent('roomSlotUpdated', { detail: data }));
    });

    newSocket.on('tournamentUpdated', (data) => {
      console.log('🏆 Tournament updated:', data);
      window.dispatchEvent(new CustomEvent('tournamentUpdated', { detail: data }));
    });

    newSocket.on('adminUpdate', (data) => {
      console.log('👨‍💼 Admin update:', data);
      window.dispatchEvent(new CustomEvent('adminUpdate', { detail: data }));
    });

    // User-related events
    newSocket.on('userRegistered', (data) => {
      console.log('👤 New user registered:', data);
      showSuccess(`New user registered: ${data.username}`);
      window.dispatchEvent(new CustomEvent('userRegistered', { detail: data }));
    });

    newSocket.on('userUpdated', (data) => {
      console.log('👤 User updated:', data);
      window.dispatchEvent(new CustomEvent('userUpdated', { detail: data }));
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, [showSuccess, showInfo]);

  const value = {
    socket,
    isConnected,
    emit: (event, data) => {
      if (socket && isConnected) {
        socket.emit(event, data);
      }
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;