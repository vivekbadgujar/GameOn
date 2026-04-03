/**
 * Serverless Socket.IO Adapter
 * Enables Socket.IO functionality in serverless environments using HTTP polling
 */

const { randomBytes } = require('crypto');

class ServerlessSocketAdapter {
  constructor() {
    this.connections = new Map();
    this.rooms = new Map();
  }

  // Generate unique socket ID
  generateId() {
    return randomBytes(16).toString('hex');
  }

  // Handle socket connection via HTTP
  handleConnection(req, res) {
    const socketId = this.generateId();
    const socket = {
      id: socketId,
      connected: true,
      disconnected: false,
      rooms: new Set(),
      
      // Socket methods
      on: (event, callback) => {
        if (!this.connections.has(socketId)) {
          this.connections.set(socketId, { callbacks: new Map(), rooms: new Set() });
        }
        const connection = this.connections.get(socketId);
        if (!connection.callbacks.has(event)) {
          connection.callbacks.set(event, []);
        }
        connection.callbacks.get(event).push(callback);
      },
      
      emit: (event, data) => {
        const connection = this.connections.get(socketId);
        if (connection && connection.callbacks.has(event)) {
          connection.callbacks.get(event).forEach(callback => {
            try {
              callback(data);
            } catch (err) {
              console.error('Socket callback error:', err);
            }
          });
        }
      },
      
      join: (room) => {
        const connection = this.connections.get(socketId);
        if (connection) {
          connection.rooms.add(room);
          if (!this.rooms.has(room)) {
            this.rooms.set(room, new Set());
          }
          this.rooms.get(room).add(socketId);
        }
      },
      
      leave: (room) => {
        const connection = this.connections.get(socketId);
        if (connection) {
          connection.rooms.delete(room);
          if (this.rooms.has(room)) {
            this.rooms.get(room).delete(socketId);
          }
        }
      },
      
      disconnect: () => {
        this.connections.delete(socketId);
        // Remove from all rooms
        this.rooms.forEach((members, room) => {
          members.delete(socketId);
        });
      }
    };

    this.connections.set(socketId, {
      callbacks: new Map(),
      rooms: new Set()
    });

    // Send initial connection response
    res.json({
      success: true,
      socketId,
      connected: true,
      message: 'Socket connected successfully'
    });

    return socket;
  }

  // Broadcast to all connected sockets
  broadcast(event, data) {
    this.connections.forEach((connection, socketId) => {
      if (connection.callbacks.has(event)) {
        connection.callbacks.get(event).forEach(callback => {
          try {
            callback(data);
          } catch (err) {
            console.error('Broadcast callback error:', err);
          }
        });
      }
    });
  }

  // Broadcast to specific room
  to(room) {
    return {
      emit: (event, data) => {
        if (this.rooms.has(room)) {
          this.rooms.get(room).forEach(socketId => {
            const connection = this.connections.get(socketId);
            if (connection && connection.callbacks.has(event)) {
              connection.callbacks.get(event).forEach(callback => {
                try {
                  callback(data);
                } catch (err) {
                  console.error('Room broadcast error:', err);
                }
              });
            }
          });
        }
      }
    };
  }
}

module.exports = ServerlessSocketAdapter;
