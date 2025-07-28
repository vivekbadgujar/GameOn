const { io } = require('socket.io-client');

const socket = io('http://localhost:5000', {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  autoConnect: true,
});

socket.on('connect', () => {
  console.log('Socket connected:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('Socket disconnected:', reason);
});

['tournamentAdded', 'tournamentUpdated', 'tournamentDeleted'].forEach(event => {
  socket.on(event, (data) => {
    console.log(`[SOCKET EVENT] ${event}:`, data);
  });
});

// Keep the process alive
setInterval(() => {}, 10000); 