import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('Admin Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Admin Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Admin Socket connection error:', error);
      setIsConnected(false);
    });

    // Admin-specific real-time events
    newSocket.on('tournamentAdded', (tournament) => {
      console.log('New tournament added (admin):', tournament);
      setLastMessage({ type: 'tournamentAdded', data: tournament });
    });

    newSocket.on('tournamentUpdated', (tournament) => {
      console.log('Tournament updated (admin):', tournament);
      setLastMessage({ type: 'tournamentUpdated', data: tournament });
    });

    newSocket.on('tournamentDeleted', (tournamentId) => {
      console.log('Tournament deleted (admin):', tournamentId);
      setLastMessage({ type: 'tournamentDeleted', data: tournamentId });
    });

    newSocket.on('broadcastSent', (broadcast) => {
      console.log('Broadcast sent (admin):', broadcast);
      setLastMessage({ type: 'broadcastSent', data: broadcast });
    });

    newSocket.on('broadcastScheduled', (broadcast) => {
      console.log('Broadcast scheduled (admin):', broadcast);
      setLastMessage({ type: 'broadcastScheduled', data: broadcast });
    });

    newSocket.on('payoutProcessed', (payout) => {
      console.log('Payout processed (admin):', payout);
      setLastMessage({ type: 'payoutProcessed', data: payout });
    });

    newSocket.on('payoutStatusUpdated', (payout) => {
      console.log('Payout status updated (admin):', payout);
      setLastMessage({ type: 'payoutStatusUpdated', data: payout });
    });

    newSocket.on('userFlagged', (flag) => {
      console.log('User flagged (admin):', flag);
      setLastMessage({ type: 'userFlagged', data: flag });
    });

    newSocket.on('aiFlagUpdated', (flag) => {
      console.log('AI flag updated (admin):', flag);
      setLastMessage({ type: 'aiFlagUpdated', data: flag });
    });

    newSocket.on('mediaUploaded', (media) => {
      console.log('Media uploaded (admin):', media);
      setLastMessage({ type: 'mediaUploaded', data: media });
    });

    newSocket.on('mediaDeleted', (media) => {
      console.log('Media deleted (admin):', media);
      setLastMessage({ type: 'mediaDeleted', data: media });
    });

    newSocket.on('user_status_change', (statusChange) => {
      console.log('User status changed (admin):', statusChange);
      setLastMessage({ type: 'user_status_change', data: statusChange });
    });

    newSocket.on('wallet_update', (walletUpdate) => {
      console.log('Wallet updated (admin):', walletUpdate);
      setLastMessage({ type: 'wallet_update', data: walletUpdate });
    });

    newSocket.on('screenshot_uploaded', (screenshot) => {
      console.log('Screenshot uploaded (admin):', screenshot);
      setLastMessage({ type: 'screenshot_uploaded', data: screenshot });
    });

    newSocket.on('ai_verification', (verification) => {
      console.log('AI verification (admin):', verification);
      setLastMessage({ type: 'ai_verification', data: verification });
    });

    // Video and notification events for admin panel
    newSocket.on('videoAdded', (video) => {
      console.log('Video added (admin):', video);
      setLastMessage({ type: 'videoAdded', data: video });
    });

    newSocket.on('videoUpdated', (video) => {
      console.log('Video updated (admin):', video);
      setLastMessage({ type: 'videoUpdated', data: video });
    });

    newSocket.on('videoDeleted', (videoId) => {
      console.log('Video deleted (admin):', videoId);
      setLastMessage({ type: 'videoDeleted', data: videoId });
    });

    newSocket.on('notificationAdded', (notification) => {
      console.log('Notification added (admin):', notification);
      setLastMessage({ type: 'notificationAdded', data: notification });
    });

    newSocket.on('notificationUpdated', (notification) => {
      console.log('Notification updated (admin):', notification);
      setLastMessage({ type: 'notificationUpdated', data: notification });
    });

    newSocket.on('notificationSent', (notification) => {
      console.log('Notification sent (admin):', notification);
      setLastMessage({ type: 'notificationSent', data: notification });
    });

    newSocket.on('notificationDeleted', (notificationId) => {
      console.log('Notification deleted (admin):', notificationId);
      setLastMessage({ type: 'notificationDeleted', data: notificationId });
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []);

  // Helper functions for admin socket operations
  const joinAdmin = (adminId) => {
    if (socket && isConnected) {
      socket.emit('join_admin', adminId);
    }
  };

  const joinTournament = (tournamentId) => {
    if (socket && isConnected) {
      socket.emit('join_tournament', tournamentId);
    }
  };

  const leaveTournament = (tournamentId) => {
    if (socket && isConnected) {
      socket.emit('leave_tournament', tournamentId);
    }
  };

  const sendTournamentUpdate = (tournamentId, update) => {
    if (socket && isConnected) {
      socket.emit('tournament_update', {
        tournamentId,
        update
      });
    }
  };

  const sendMatchUpdate = (tournamentId, matchData) => {
    if (socket && isConnected) {
      socket.emit('match_update', {
        tournamentId,
        matchData
      });
    }
  };

  const contextValue = {
    socket,
    isConnected,
    lastMessage,
    joinAdmin,
    joinTournament,
    leaveTournament,
    sendTournamentUpdate,
    sendMatchUpdate
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}; 