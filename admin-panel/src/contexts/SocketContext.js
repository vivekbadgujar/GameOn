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
 * SocketProvider connects to Socket.IO only when the backend explicitly
 * reports that realtime WebSocket support is available. On serverless/Vercel
 * deployments, the admin panel falls back to polling-based refresh behavior.
 */
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [syncMode, setSyncMode] = useState('checking');
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

        const healthRes = await fetch(`${apiBase}/health`, { cache: 'no-store' });
        const health = await healthRes.json();

        const socketEnabled = health?.socketEnabled !== false;
        const websocketSupported = health?.websocketSupported === true;
        const isServerless = health?.serverless === true;

        if (!socketEnabled) {
          console.warn('[Socket] Socket.IO disabled by backend');
          setSyncMode('disabled');
          setIsConnected(false);
          setSocket(null);
          return;
        }

        if (isServerless || !websocketSupported) {
          console.info('[Admin Socket] Realtime socket unavailable, using polling fallback');
          setSyncMode('polling');
          setIsConnected(false);
          setSocket(null);

          // Polling fallback: broadcast a generic refresh event every 30s so
          // components that rely on window.addEventListener stay current.
          const pollingInterval = setInterval(() => {
            if (cancelled) {
              clearInterval(pollingInterval);
              return;
            }
            window.dispatchEvent(new CustomEvent('tournamentUpdated', { detail: { source: 'poll' } }));
          }, 30000);

          return () => { clearInterval(pollingInterval); };
        }

        if (cancelled) return;

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
          forceNew: true,
          upgrade: true,
          rememberUpgrade: true,
        });

        newSocket.on('connect', () => {
          console.log('[Admin Socket] Connected:', newSocket.id);
          setIsConnected(true);
          setSyncMode('socket');

          const adminToken = localStorage.getItem('adminToken');
          if (adminToken) {
            newSocket.emit('authenticate', { token: adminToken, role: 'admin' });
            newSocket.emit('join_room', 'admin_room');
          }
        });

        newSocket.on('disconnect', (reason) => {
          console.log('[Admin Socket] Disconnected:', reason);
          setIsConnected(false);
          setSyncMode('polling');
        });

        newSocket.on('connect_error', (err) => {
          console.warn('[Admin Socket] Connection error:', err.message);
          setIsConnected(false);
          setSyncMode('polling');
        });

        const tournamentEvents = [
          'tournamentAdded',
          'tournamentUpdated',
          'tournamentDeleted',
          'tournamentStatusUpdated',
          'roomCredentialsReleased',
        ];

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

        const participantEvents = [
          'participantUpdated',
          'participantsUpdated',
          'tournamentJoined',
        ];

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

        allEvents.forEach((name) => {
          newSocket.on(name, (data) => {
            window.dispatchEvent(new CustomEvent(name, { detail: data }));
          });
        });

        newSocket.on('slot_sync', (event) => {
          if (event?.data) {
            window.dispatchEvent(new CustomEvent('roomSlotUpdated', { detail: event.data }));
          }
        });

        socketRef.current = newSocket;
        setSocket(newSocket);
      } catch (err) {
        console.warn('[Admin Socket] Backend health check failed, socket disabled.', err.message);
        setSyncMode('disabled');
        setIsConnected(false);
        setSocket(null);
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
    syncMode,
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
