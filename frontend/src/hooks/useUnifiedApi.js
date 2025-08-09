/**
 * Unified API Hook for Web Frontend
 * React hook that provides unified API access with real-time sync
 */

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import UnifiedApiService from '../../../shared/services/unifiedApiService';
import config from '../config';

const useUnifiedApi = () => {
  const [apiService] = useState(() => new UnifiedApiService(config.API_URL, 'web'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { isConnected, syncStatus, forceSync } = useSocket();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // Clear error when connection is restored
  useEffect(() => {
    if (isConnected && error) {
      setError(null);
    }
  }, [isConnected, error]);

  // Generic API call wrapper with error handling and sync
  const apiCall = useCallback(async (apiMethod, ...args) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiMethod(...args);
      
      // Trigger sync if operation was successful
      if (result.success && isConnected) {
        forceSync('api_operation', {
          method: apiMethod.name,
          timestamp: new Date().toISOString()
        });
      }
      
      return result;
    } catch (err) {
      const errorInfo = apiService.handleApiError(err);
      setError(errorInfo);
      
      // Show user-friendly error notification
      showNotification(
        'Operation Failed',
        errorInfo.message,
        'error'
      );
      
      throw errorInfo;
    } finally {
      setLoading(false);
    }
  }, [apiService, isConnected, forceSync, showNotification]);

  // Authentication methods
  const auth = {
    sendOTP: useCallback((phoneNumber) => 
      apiCall(apiService.sendOTP.bind(apiService), phoneNumber), [apiCall, apiService]),
    
    verifyOTP: useCallback((phoneNumber, otp) => 
      apiCall(apiService.verifyOTP.bind(apiService), phoneNumber, otp), [apiCall, apiService]),
    
    refreshToken: useCallback((refreshToken) => 
      apiCall(apiService.refreshToken.bind(apiService), refreshToken), [apiCall, apiService])
  };

  // User methods
  const users = {
    getProfile: useCallback(() => 
      apiCall(apiService.getUserProfile.bind(apiService)), [apiCall, apiService]),
    
    updateProfile: useCallback((profileData) => 
      apiCall(apiService.updateUserProfile.bind(apiService), profileData), [apiCall, apiService]),
    
    uploadProfileImage: useCallback((imageData) => 
      apiCall(apiService.uploadProfileImage.bind(apiService), imageData), [apiCall, apiService]),
    
    getStats: useCallback(() => 
      apiCall(apiService.getUserStats.bind(apiService)), [apiCall, apiService])
  };

  // Tournament methods
  const tournaments = {
    getAll: useCallback((filters) => 
      apiCall(apiService.getTournaments.bind(apiService), filters), [apiCall, apiService]),
    
    getDetails: useCallback((tournamentId) => 
      apiCall(apiService.getTournamentDetails.bind(apiService), tournamentId), [apiCall, apiService]),
    
    join: useCallback((tournamentId, slotData) => 
      apiCall(apiService.joinTournament.bind(apiService), tournamentId, slotData), [apiCall, apiService]),
    
    leave: useCallback((tournamentId) => 
      apiCall(apiService.leaveTournament.bind(apiService), tournamentId), [apiCall, apiService]),
    
    updateSlot: useCallback((tournamentId, slotData) => 
      apiCall(apiService.updateTournamentSlot.bind(apiService), tournamentId, slotData), [apiCall, apiService]),
    
    getMy: useCallback(() => 
      apiCall(apiService.getMyTournaments.bind(apiService)), [apiCall, apiService]),
    
    submitResult: useCallback((tournamentId, resultData) => 
      apiCall(apiService.submitTournamentResult.bind(apiService), tournamentId, resultData), [apiCall, apiService])
  };

  // Wallet methods
  const wallet = {
    getBalance: useCallback(() => 
      apiCall(apiService.getWalletBalance.bind(apiService)), [apiCall, apiService]),
    
    getTransactions: useCallback((page, limit) => 
      apiCall(apiService.getWalletTransactions.bind(apiService), page, limit), [apiCall, apiService]),
    
    addMoney: useCallback((amount, paymentMethod) => 
      apiCall(apiService.addMoney.bind(apiService), amount, paymentMethod), [apiCall, apiService]),
    
    verifyPayment: useCallback((paymentData) => 
      apiCall(apiService.verifyPayment.bind(apiService), paymentData), [apiCall, apiService])
  };

  // Sync methods
  const sync = {
    getStatus: useCallback(() => 
      apiCall(apiService.getSyncStatus.bind(apiService)), [apiCall, apiService]),
    
    registerDevice: useCallback((token, platform) => 
      apiCall(apiService.registerDevice.bind(apiService), token, platform), [apiCall, apiService]),
    
    unregisterDevice: useCallback((token) => 
      apiCall(apiService.unregisterDevice.bind(apiService), token), [apiCall, apiService]),
    
    forceSync: useCallback((type, data) => 
      apiCall(apiService.forceSync.bind(apiService), type, data), [apiCall, apiService]),
    
    getUserSessions: useCallback(() => 
      apiCall(apiService.getUserSessions.bind(apiService)), [apiCall, apiService])
  };

  // Notification methods
  const notifications = {
    getAll: useCallback((page, limit) => 
      apiCall(apiService.getNotifications.bind(apiService), page, limit), [apiCall, apiService]),
    
    markAsRead: useCallback((notificationId) => 
      apiCall(apiService.markNotificationAsRead.bind(apiService), notificationId), [apiCall, apiService]),
    
    markAllAsRead: useCallback(() => 
      apiCall(apiService.markAllNotificationsAsRead.bind(apiService)), [apiCall, apiService])
  };

  // Media methods
  const media = {
    uploadScreenshot: useCallback((tournamentId, imageData) => 
      apiCall(apiService.uploadScreenshot.bind(apiService), tournamentId, imageData), [apiCall, apiService]),
    
    getGallery: useCallback((type, page, limit) => 
      apiCall(apiService.getMediaGallery.bind(apiService), type, page, limit), [apiCall, apiService])
  };

  // Leaderboard methods
  const leaderboard = {
    get: useCallback((type, period) => 
      apiCall(apiService.getLeaderboard.bind(apiService), type, period), [apiCall, apiService])
  };

  // Chat methods
  const chat = {
    getTournamentMessages: useCallback((tournamentId, page, limit) => 
      apiCall(apiService.getTournamentMessages.bind(apiService), tournamentId, page, limit), [apiCall, apiService]),
    
    sendTournamentMessage: useCallback((tournamentId, message) => 
      apiCall(apiService.sendTournamentMessage.bind(apiService), tournamentId, message), [apiCall, apiService])
  };

  // Room/Slot methods
  const rooms = {
    getSlots: useCallback((tournamentId) => 
      apiCall(apiService.getRoomSlots.bind(apiService), tournamentId), [apiCall, apiService]),
    
    updateSlot: useCallback((tournamentId, slotData) => 
      apiCall(apiService.updateRoomSlot.bind(apiService), tournamentId, slotData), [apiCall, apiService])
  };

  // Statistics methods
  const stats = {
    getPlatform: useCallback(() => 
      apiCall(apiService.getPlatformStats.bind(apiService)), [apiCall, apiService])
  };

  // Utility methods
  const utils = {
    healthCheck: useCallback(() => 
      apiCall(apiService.healthCheck.bind(apiService)), [apiCall, apiService]),
    
    testNotification: useCallback(() => 
      apiCall(apiService.testNotification.bind(apiService)), [apiCall, apiService]),
    
    batchSync: useCallback((operations) => 
      apiCall(apiService.batchSync.bind(apiService), operations), [apiCall, apiService])
  };

  // Connection status helpers
  const isOnline = isConnected && syncStatus === 'connected';
  const canSync = isOnline && user;

  return {
    // API methods grouped by functionality
    auth,
    users,
    tournaments,
    wallet,
    sync,
    notifications,
    media,
    leaderboard,
    chat,
    rooms,
    stats,
    utils,
    
    // State
    loading,
    error,
    isOnline,
    canSync,
    syncStatus,
    
    // Direct access to service for advanced usage
    apiService,
    
    // Helper methods
    clearError: () => setError(null),
    retry: (lastFailedCall) => lastFailedCall && lastFailedCall()
  };
};

export default useUnifiedApi;