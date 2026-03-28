/**
 * Universal Socket.IO Configuration for GameOn Platform
 * Handles serverless environment gracefully across frontend, admin panel, and API
 */

(function(window, document) {
  'use strict';

  // Detect platform and environment
  const isServerless = window.location.hostname.includes('vercel.app') || 
                      window.location.hostname.includes('api.gameonesport.xyz') ||
                      window.location.hostname.includes('admin.gameonesport.xyz') ||
                      window.location.hostname.includes('gameonesport.xyz');

  const isAdminPanel = window.location.hostname.includes('admin.gameonesport.xyz');
  const isFrontend = window.location.hostname.includes('gameonesport.xyz') && !isAdminPanel;
  const isAPI = window.location.hostname.includes('api.gameonesport.xyz');

  // Socket.IO configuration for serverless environments
  if (isServerless) {
    console.info(`[Socket.IO] Serverless environment detected (${isAdminPanel ? 'Admin Panel' : isFrontend ? 'Frontend' : 'API'})`);
    
    // Store original Socket.IO if it exists
    const originalIO = window.io;
    const originalManager = window.IO && window.IO.Manager;
    
    // Create comprehensive mock socket
    const createMockSocket = function() {
      const socket = {
        // Core properties
        id: null,
        connected: false,
        disconnected: true,
        readyState: 'closed',
        
        // Event methods
        on: function(event, callback) { 
          if (event === 'connect' || event === 'disconnect') {
            setTimeout(() => callback && callback(), 10);
          }
          return this; 
        },
        off: function() { return this; },
        emit: function() { return this; },
        once: function() { return this; },
        
        // Connection methods
        connect: function() { 
          console.warn('[Socket.IO] Connection disabled in serverless environment');
          return this; 
        },
        disconnect: function() { return this; },
        close: function() { return this; },
        open: function() { return this; },
        
        // Room methods
        join: function() { return this; },
        leave: function() { return this; },
        
        // Other methods
        send: function() { return this; },
        compress: function() { return this; },
        timeout: function() { return this; }
      };
      
      return socket;
    };
    
    // Override Socket.IO constructor
    window.io = function(url, options) {
      console.warn('[Socket.IO] Real-time features disabled in serverless environment');
      return createMockSocket();
    };
    
    // Override Socket.IO Manager
    if (originalManager) {
      window.IO.Manager = function(url, options) {
        console.warn('[Socket.IO Manager] Real-time features disabled in serverless environment');
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
    
    // Copy static properties
    if (originalIO) {
      Object.keys(originalIO).forEach(key => {
        if (typeof originalIO[key] !== 'function') {
          window.io[key] = originalIO[key];
        }
      });
    }
    
    // Prevent polling attempts
    let pollingStopped = false;
    const stopPolling = function() {
      if (pollingStopped) return;
      pollingStopped = true;
      
      // Clear all intervals
      const maxIntervalId = setInterval(function() { clearInterval(maxIntervalId); }, 0);
      for (let i = 1; i < maxIntervalId; i++) {
        clearInterval(i);
      }
      
      // Clear all timeouts
      const maxTimeoutId = setTimeout(function() { clearTimeout(maxTimeoutId); }, 0);
      for (let i = 1; i < maxTimeoutId; i++) {
        clearTimeout(i);
      }
      
      console.info('[Socket.IO] Polling attempts stopped');
    };
    
    // Stop polling immediately and on load
    stopPolling();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', stopPolling);
    } else {
      stopPolling();
    }
    
    // Also stop on window load
    window.addEventListener('load', stopPolling);
    
    // Override XMLHttpRequest to prevent Socket.IO polling
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
      if (url && url.includes('/socket.io/')) {
        console.warn('[Socket.IO] Prevented polling request to:', url);
        // Don't actually send the request
        return;
      }
      return originalXHROpen.call(this, method, url, async, user, password);
    };
    
    console.info('[Socket.IO] Serverless mode activated - real-time features disabled');
  } else {
    console.info('[Socket.IO] Standard environment detected - Socket.IO enabled');
  }

})(typeof window !== 'undefined' ? window : global, typeof document !== 'undefined' ? document : {});
