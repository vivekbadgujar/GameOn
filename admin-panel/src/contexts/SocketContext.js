import React, { createContext, useContext, useState, useEffect } from 'react';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

/**
 * SocketProvider — connects to the Socket.IO server only when it is
 * confirmed reachable.  We first probe the /api/health endpoint; if that
 * succeeds AND the server is NOT running in serverless mode (indicated by
 * the health payload's `socketEnabled` flag), we attempt the WebSocket
 * connection.  This prevents the endless 404 polling loop that appears when
 * the backend is deployed in serverless mode (Vercel/Lambda via Render).
 */
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let newSocket = null;
    let cancelled = false;

    const tryConnect = async () => {
      try {
        // Resolve backend origin from env or default
        const apiBase = (
          process.env.REACT_APP_API_URL ||
          process.env.NEXT_PUBLIC_API_URL ||
          'https://api.gameonesport.xyz/api'
        ).replace(/\/$/, '');

        // Quick health check to see if socket is available
        const healthRes = await fetch(`${apiBase}/health`, { cache: 'no-store' });
        const health = await healthRes.json();

        // Only connect if the server explicitly signals socket support
        // (or if the flag is absent, assume it's supported — truthy by default)
        const socketEnabled = health?.socketEnabled !== false;
        if (!socketEnabled || cancelled) return;

        const wsUrl = apiBase.replace(/\/api$/, '');

        // Dynamic import so we don't pay the bundle cost when not needed
        const { io } = await import('socket.io-client');
        if (cancelled) return;

        newSocket = io(wsUrl, {
          transports: ['polling', 'websocket'],
          reconnectionAttempts: 2,
          reconnectionDelay: 10000,
          autoConnect: true,
          withCredentials: true,
        });

        newSocket.on('connect', () => {
          console.log('🔗 Admin Panel Socket connected:', newSocket.id);
          setIsConnected(true);
          const adminToken = localStorage.getItem('adminToken');
          if (adminToken) {
            newSocket.emit('authenticate', { token: adminToken, role: 'admin' });
          }
        });

        newSocket.on('disconnect', () => {
          console.log('🔌 Admin Panel Socket disconnected');
          setIsConnected(false);
        });

        // Give up immediately on any connection error — don't spam retry logs
        newSocket.on('connect_error', () => {
          console.warn('[Admin Socket] Connection unavailable — disabling socket.');
          newSocket.io.opts.reconnectionAttempts = 0;
          newSocket.disconnect();
          setIsConnected(false);
        });

        // Forward server events to window so components can listen
        const events = [
          'tournamentUpdated', 'slotsUpdated', 'squadUpdated',
          'roomSlotUpdated', 'participantUpdated', 'participantsUpdated', 'slotsSwapped',
        ];
        events.forEach(name => {
          newSocket.on(name, data =>
            window.dispatchEvent(new CustomEvent(name, { detail: data }))
          );
        });
        newSocket.on('slot_sync', event => {
          if (event?.data)
            window.dispatchEvent(new CustomEvent('roomSlotUpdated', { detail: event.data }));
        });

        setSocket(newSocket);
      } catch {
        // Health check failed — backend unreachable, skip socket entirely
        console.warn('[Admin Socket] Backend health check failed — socket disabled.');
      }
    };

    tryConnect();

    return () => {
      cancelled = true;
      if (newSocket) newSocket.disconnect();
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
