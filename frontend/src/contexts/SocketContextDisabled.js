// Mock socket context when socket is disabled
const mockSocket = {
  socket: null,
  isConnected: false,
  lastMessage: null,
  joinTournament: () => {},
  leaveTournament: () => {},
  joinUser: () => {},
  sendTournamentMessage: () => {},
  sendScreenshotUpload: () => {},
  updateSlot: () => {},
  forceSync: () => {},
  registerPushToken: () => {},
  getSyncStatus: () => ({
    isConnected: false,
    syncStatus: 'disconnected',
    lastSyncTime: null,
    activeSessions: 0,
    platforms: [],
    connectionRetries: 0
  }),
  syncStatus: 'disconnected',
  lastSyncTime: null,
  activeSessions: 0,
  platforms: [],
  connectionRetries: 0
};

export const useSocket = () => mockSocket;
