import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

/**
 * SocketProvider — connects to the Socket.IO server after confirming it is
 * reachable via the /api/health endpoint.  Forwards all relevant server
 * events as window CustomEvents so components can subscribe via
 * addEventListener without coupling to the socket instance.
 */
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const tryConnect = async () => {
      try {
        const apiBase = (
          process.env.REACT_APP_API_URL ||
          process.env.NEXT_PUBLIC_API_URL ||
          'https://api.gameonesport.xyz/api'
        ).replace(/\/$/, '');

        // Health check — is socket available?
        const healthRes = await fetch(`${apiBase}/health`, { cache: 'no-store' });
        const health = await healthRes.json();

        const socketEnabled = health?.socketEnabled !== false;
        if (!socketEnabled || cancelled) return;

        const wsUrl = apiBase.replace(/\/api$/, '');

        const { io } = await import('socket.io-client');
        if (cancelled) return;

        const newSocket = io(wsUrl, {
          path: '/socket.io/',
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 3000,
          reconnectionDelayMax: 15000,
          autoConnect: true,
          withCredentials: true,
          timeout: 10000,
        });

        newSocket.on('connect', () => {
          console.log('🔗 Admin Panel Socket connected:', newSocket.id);
          setIsConnected(true);
          const adminToken = localStorage.getItem('adminToken');
          if (adminToken) {
            newSocket.emit('authenticate', { token: adminToken, role: 'admin' });
            newSocket.emit('join_room', 'admin_room');
          }
        });

        newSocket.on('disconnect', (reason) => {
          console.log('🔌 Admin Panel Socket disconnected:', reason);
          setIsConnected(false);
        });

        newSocket.on('connect_error', (err) => {
          console.warn('[Admin Socket] Connection error:', err.message);
          // Don't give up — let the built-in reconnection handle it
          setIsConnected(false);
        });

        // ---- Forward ALL relevant events as window CustomEvents ----
        // Tournament lifecycle events
        const tournamentEvents = [
          'tournamentAdded',
          'tournamentUpdated',
          'tournamentDeleted',
          'tournamentStatusUpdated',
          'roomCredentialsReleased',
        ];

        // Slot & room events
        const slotEvents = [
          'slotsUpdated',
          'squadUpdated',
          'roomSlotUpdated',
          'slotsSwapped',
          'adminSlotChanged',
          'slotLockChanged',
          'slotsLocked',
          'roomSettingsChanged',
          'playerRemoved',
        ];

        // Participant events
        const participantEvents = [
          'participantUpdated',
          'participantsUpdated',
          'tournamentJoined',
        ];

        // Admin-specific events
        const adminEvents = [
          'adminUpdate',
          'userRegistered',
          'broadcastSent',
          'payoutProcessed',
          'payoutStatusUpdated',
        ];

        const allEvents = [
          ...tournamentEvents,
          ...slotEvents,
          ...participantEvents,
          ...adminEvents,
        ];

        allEvents.forEach(name => {
          newSocket.on(name, data => {
            window.dispatchEvent(new CustomEvent(name, { detail: data }));
          });
        });

        // Also map slot_sync to roomSlotUpdated for compatibility
        newSocket.on('slot_sync', event => {
          if (event?.data) {
            window.dispatchEvent(new CustomEvent('roomSlotUpdated', { detail: event.data }));
          }
        });

        socketRef.current = newSocket;
        setSocket(newSocket);
      } catch (err) {
        console.warn('[Admin Socket] Backend health check failed — socket disabled.', err.message);
      }
    };

    tryConnect();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const value = {
    socket,
    isConnected,
    emit: (event, data) => {
      if (socket && isConnected) socket.emit(event, data);
    },
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
