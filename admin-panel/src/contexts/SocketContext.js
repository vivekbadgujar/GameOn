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
  const eventSourceRef = useRef(null);

  // SSE Connection Function
  const connectSSE = (apiBase) => {
    try {
      const eventSource = new EventSource(`${apiBase}/events?room=admin_room`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('📡 SSE Connection opened');
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📡 SSE Event received:', data);

          // Forward SSE events as window CustomEvents
          window.dispatchEvent(new CustomEvent(data.type, { detail: data }));
        } catch (err) {
          console.error('Error parsing SSE event:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('SSE Connection error:', err);
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
            connectSSE(apiBase);
          }
        }, 3000);
      };

      return eventSource;
    } catch (err) {
      console.error('Failed to create SSE connection:', err);
      setIsConnected(false);
    }
  };

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
        const realTimeEnabled = health?.realTimeEnabled === true;
        const realTimeMethod = health?.realTimeMethod || 'Socket.IO';
        
        if (!socketEnabled && !realTimeEnabled) {
          console.warn('[Socket] Real-time features disabled');
          return;
        }

        // Always use Socket.IO (polling works in serverless)
        if (!socketEnabled || cancelled) return;

        const wsUrl = apiBase.replace(/\/api$/, '');

        const { io } = await import('socket.io-client');
        if (cancelled) return;

        const newSocket = io(wsUrl, {
          path: '/socket.io/',
          // Prioritize polling for serverless compatibility
          transports: realTimeMethod === 'Socket.IO-Polling' ? ['polling'] : ['websocket', 'polling'],
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
      
      // Cleanup Socket.IO connection
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      
      // Cleanup SSE connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
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
