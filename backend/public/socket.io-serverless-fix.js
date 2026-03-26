/**
 * Socket.IO Client Configuration for Serverless Environment
 * This file helps prevent Socket.IO connection attempts in serverless deployments
 */

(function(window) {
  'use strict';

  // Detect if we're in a serverless environment
  const isServerless = window.location.hostname.includes('vercel.app') || 
                      window.location.hostname.includes('api.gameonesport.xyz') ||
                      window.location.hostname.includes('admin.gameonesport.xyz');

  // Socket.IO configuration for serverless environments
  if (isServerless) {
    // Prevent Socket.IO from attempting to connect
    const originalIO = window.io;
    
    // Create a mock Socket.IO client that gracefully handles all calls
    const mockSocket = {
      on: function() { return this; },
      off: function() { return this; },
      emit: function() { return this; },
      connect: function() { return this; },
      disconnect: function() { return this; },
      close: function() { return this; },
      open: function() { return this; },
      send: function() { return this; },
      connected: false,
      disconnected: true,
      id: null,
      readyState: 'closed'
    };
    
    window.io = function(url, options) {
      console.warn('[Socket.IO] Real-time features are disabled in serverless environment');
      
      // Immediately return a disconnected socket
      return mockSocket;
    };
    
    // Copy any properties from the original io if it exists
    if (originalIO) {
      Object.keys(originalIO).forEach(key => {
        if (typeof originalIO[key] !== 'function') {
          window.io[key] = originalIO[key];
        }
      });
    }
    
    // Override the Socket.IO Manager to prevent polling
    if (window.IO && window.IO.Manager) {
      const OriginalManager = window.IO.Manager;
      window.IO.Manager = function(url, options) {
        console.warn('[Socket.IO Manager] Real-time features are disabled in serverless environment');
        return {
          on: function() { return this; },
          off: function() { return this; },
          emit: function() { return this; },
          close: function() { return this; },
          engine: {
            on: function() { return this; },
            off: function() { return this; },
            close: function() { return this; }
          }
        };
      };
    }
    
    console.info('[Socket.IO] Serverless mode detected - real-time features disabled');
    
    // Stop any existing polling attempts
    if (window.addEventListener) {
      window.addEventListener('load', function() {
        // Clear any existing intervals that might be polling
        const maxIntervalId = setInterval(() => {}, 0);
        for (let i = 1; i < maxIntervalId; i++) {
          clearInterval(i);
        }
      });
    }
  }

})(typeof window !== 'undefined' ? window : global);
