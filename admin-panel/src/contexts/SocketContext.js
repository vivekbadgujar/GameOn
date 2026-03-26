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
  const { showInfo, showSuccess, showError } = useNotification();

  useEffect(() => {
    // Determine API URL for socket server
    const API_BASE_URL = (process.env.REACT_APP_API_URL ||
                         process.env.NEXT_PUBLIC_API_URL || 
                         process.env.NEXT_PUBLIC_API_BASE_URL || 
                         'https://api.gameonesport.xyz/api').replace(/\/$/, '');
    const WS_URL = API_BASE_URL.replace('/api', '');
    
    const newSocket = io(WS_URL, {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 10,
      autoConnect: true,
      withCredentials: true
    });

    newSocket.on('connect', () => {
      console.log('🔗 Admin Panel Socket connected:', newSocket.id);
      setIsConnected(true);
      // Authenticate admin
      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        newSocket.emit('authenticate', { token: adminToken, role: 'admin' });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Admin Panel Socket disconnected');
      setIsConnected(false);
    });

    // Map important server events to window events so Admin components (like BGMIRoomLayout) can listen
    const events = [
      'tournamentUpdated',
      'slotsUpdated',
      'squadUpdated',
      'roomSlotUpdated',
      'participantUpdated',
      'participantsUpdated',
      'slotsSwapped'
    ];

    events.forEach(eventName => {
      newSocket.on(eventName, (data) => {
        window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
      });
    });

    // Handle generalized slot_sync if backend sends that
    newSocket.on('slot_sync', (event) => {
      if (event && event.data) {
        window.dispatchEvent(new CustomEvent('roomSlotUpdated', { detail: event.data }));
      }
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

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
