/**
 * Socket.IO Client Configuration - Real-time features enabled
 * This file now allows Socket.IO to work properly in serverless environment
 */

(function(window) {
  'use strict';

  console.info('[Socket.IO] Real-time features enabled for GameOn platform');
  
  // No modifications needed - let Socket.IO work naturally
  // The backend now supports serverless Socket.IO connections
  
})(typeof window !== 'undefined' ? window : global);
