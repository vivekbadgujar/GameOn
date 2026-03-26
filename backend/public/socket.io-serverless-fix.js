/**
 * Socket.IO Client Configuration for Serverless Environment
 * This file helps prevent Socket.IO connection attempts in serverless deployments
 */

(function(window) {
  'use strict';

  // Detect if we're in a serverless environment
  const isServerless = window.location.hostname.includes('vercel.app') || 
                      window.location.hostname.includes('api.gameonesport.xyz');

  // Socket.IO configuration for serverless environments
  if (isServerless) {
    // Prevent Socket.IO from attempting to connect
    const originalIO = window.io;
    
    window.io = function(url, options) {
      console.warn('[Socket.IO] Real-time features are disabled in serverless environment');
      
      // Return a mock Socket.IO client that gracefully handles all calls
      return {
        on: function() { return this; },
        off: function() { return this; },
        emit: function() { return this; },
        connect: function() { return this; },
        disconnect: function() { return this; },
        close: function() { return this; },
        open: function() { return this; },
        send: function() { return this; },
        connected: false,
        disconnected: true
      };
    };
    
    // Copy any properties from the original io if it exists
    if (originalIO) {
      Object.keys(originalIO).forEach(key => {
        if (typeof originalIO[key] !== 'function') {
          window.io[key] = originalIO[key];
        }
      });
    }
    
    console.info('[Socket.IO] Serverless mode detected - real-time features disabled');
  }

})(typeof window !== 'undefined' ? window : global);
