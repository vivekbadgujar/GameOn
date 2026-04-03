/**
 * Server-Sent Events (SSE) for Real-time Updates
 * Works perfectly in serverless environments
 */

class SSEManager {
  constructor() {
    this.clients = new Map(); // Map of room -> Set of clients
  }

  // Add client to a room
  addClient(room, res) {
    if (!this.clients.has(room)) {
      this.clients.set(room, new Set());
    }
    this.clients.get(room).add(res);

    // Send initial connection event
    this.sendToClient(res, {
      type: 'connected',
      timestamp: new Date().toISOString(),
      room
    });

    // Clean up on disconnect
    res.on('close', () => {
      this.removeClient(room, res);
    });

    return res;
  }

  // Remove client from room
  removeClient(room, res) {
    if (this.clients.has(room)) {
      this.clients.get(room).delete(res);
      if (this.clients.get(room).size === 0) {
        this.clients.delete(room);
      }
    }
  }

  // Send event to specific client
  sendToClient(res, data) {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
      console.error('SSE send error:', err);
      this.removeClient('all', res); // Remove broken client
    }
  }

  // Broadcast to all clients in a room
  broadcast(room, event) {
    if (this.clients.has(room)) {
      this.clients.get(room).forEach(client => {
        this.sendToClient(client, {
          ...event,
          room,
          timestamp: new Date().toISOString()
        });
      });
    }
  }

  // Broadcast to all clients
  broadcastAll(event) {
    this.clients.forEach((clients, room) => {
      clients.forEach(client => {
        this.sendToClient(client, {
          ...event,
          room,
          timestamp: new Date().toISOString()
        });
      });
    });
  }
}

module.exports = SSEManager;
