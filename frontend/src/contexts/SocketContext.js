import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import config from '../config';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    const newSocket = io(config.WS_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Tournament real-time events
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

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []);

  // Helper functions for socket operations
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

  const contextValue = {
    socket,
    isConnected,
    lastMessage,
    joinTournament,
    leaveTournament,
    joinUser,
    sendTournamentMessage,
    sendScreenshotUpload
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

