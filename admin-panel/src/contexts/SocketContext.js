import React, { createContext, useContext, useState } from 'react';
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
  const [socket] = useState(null);
  const [isConnected] = useState(false);
  const { showInfo } = useNotification();

  React.useEffect(() => {
    showInfo('Admin panel uses API polling instead of WebSocket');
  }, [showInfo]);

  const value = {
    socket,
    isConnected,
    emit: () => {
      console.log('Socket.IO disabled for admin panel');
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
