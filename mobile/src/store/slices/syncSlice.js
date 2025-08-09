/**
 * Sync Slice
 * Manages real-time synchronization state
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isConnected: false,
  lastSyncTime: null,
  syncStatus: 'disconnected', // disconnected, connecting, connected, error
  activeSessions: 0,
  platforms: [],
  pendingSyncs: [],
  connectionRetries: 0,
  maxRetries: 5,
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setConnectionStatus: (state, action) => {
      state.isConnected = action.payload.isConnected;
      state.syncStatus = action.payload.status;
      if (action.payload.isConnected) {
        state.connectionRetries = 0;
      }
    },
    
    updateSyncTime: (state) => {
      state.lastSyncTime = new Date().toISOString();
    },
    
    setSessions: (state, action) => {
      state.activeSessions = action.payload.activeSessions;
      state.platforms = action.payload.platforms;
    },
    
    addPendingSync: (state, action) => {
      state.pendingSyncs.push({
        id: action.payload.id,
        type: action.payload.type,
        data: action.payload.data,
        timestamp: new Date().toISOString(),
      });
    },
    
    removePendingSync: (state, action) => {
      state.pendingSyncs = state.pendingSyncs.filter(
        sync => sync.id !== action.payload
      );
    },
    
    clearPendingSyncs: (state) => {
      state.pendingSyncs = [];
    },
    
    incrementRetries: (state) => {
      state.connectionRetries += 1;
    },
    
    resetRetries: (state) => {
      state.connectionRetries = 0;
    },
    
    setError: (state, action) => {
      state.syncStatus = 'error';
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
      if (state.syncStatus === 'error') {
        state.syncStatus = 'disconnected';
      }
    },
  },
});

export const {
  setConnectionStatus,
  updateSyncTime,
  setSessions,
  addPendingSync,
  removePendingSync,
  clearPendingSyncs,
  incrementRetries,
  resetRetries,
  setError,
  clearError,
} = syncSlice.actions;

export default syncSlice.reducer;