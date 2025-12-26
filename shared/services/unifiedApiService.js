/**
 * Unified API Service
 * Shared API service for both web and mobile platforms
 */

import axios from 'axios';

class UnifiedApiService {
  constructor(baseURL, platform = 'web') {
    this.platform = platform;
    this.api = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Platform': platform
      }
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.handleAuthError();
        }
        return Promise.reject(error);
      }
    );
  }

  // Platform-specific token retrieval
  getAuthToken() {
    if (this.platform === 'web') {
      return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    } else {
      // For React Native, this would be handled by AsyncStorage
      // This is a placeholder - actual implementation would use AsyncStorage
      return null;
    }
  }

  // Platform-specific auth error handling
  handleAuthError() {
    if (this.platform === 'web') {
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      window.location.href = '/login';
    } else {
      // For React Native, navigate to login screen
      // This would be handled by navigation service
    }
  }

  // Authentication APIs
  async sendOTP(phoneNumber) {
    const response = await this.api.post('/auth/send-otp', { phoneNumber });
    return response.data;
  }

  async verifyOTP(phoneNumber, otp) {
    const response = await this.api.post('/auth/verify-otp', { phoneNumber, otp });
    return response.data;
  }

  async refreshToken(refreshToken) {
    const response = await this.api.post('/auth/refresh-token', { refreshToken });
    return response.data;
  }

  // User APIs
  async getUserProfile() {
    const response = await this.api.get('/users/profile');
    return response.data;
  }

  async updateUserProfile(profileData) {
    const response = await this.api.put('/users/profile', profileData);
    return response.data;
  }

  async uploadProfileImage(imageData) {
    const formData = new FormData();
    formData.append('profileImage', imageData);
    
    const response = await this.api.post('/users/profile/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  // Tournament APIs
  async getTournaments(filters = {}) {
    const response = await this.api.get('/tournaments', { params: filters });
    return response.data;
  }

  async getTournamentDetails(tournamentId) {
    const response = await this.api.get(`/tournaments/${tournamentId}`);
    return response.data;
  }

  async joinTournament(tournamentId, slotData = {}) {
    const response = await this.api.post(`/tournaments/${tournamentId}/join`, slotData);
    return response.data;
  }

  async leaveTournament(tournamentId) {
    const response = await this.api.post(`/tournaments/${tournamentId}/leave`);
    return response.data;
  }

  async updateTournamentSlot(tournamentId, slotData) {
    const response = await this.api.put(`/tournaments/${tournamentId}/slot`, slotData);
    return response.data;
  }

  async getMyTournaments() {
    const response = await this.api.get('/tournaments/my-tournaments');
    return response.data;
  }

  async submitTournamentResult(tournamentId, resultData) {
    const response = await this.api.post(`/tournaments/${tournamentId}/result`, resultData);
    return response.data;
  }

  // Wallet APIs
  async getWalletBalance() {
    const response = await this.api.get('/wallet/balance');
    return response.data;
  }

  async getWalletTransactions(page = 1, limit = 20) {
    const response = await this.api.get('/wallet/transactions', {
      params: { page, limit }
    });
    return response.data;
  }

  async addMoney(amount, paymentMethod = 'cashfree') {
    const response = await this.api.post('/wallet/add-money', {
      amount,
      paymentMethod
    });
    return response.data;
  }

  async verifyPayment(paymentData) {
    const response = await this.api.post('/payments/verify', paymentData);
    return response.data;
  }

  // Sync APIs
  async getSyncStatus() {
    const response = await this.api.get('/sync/status');
    return response.data;
  }

  async registerDevice(token, platform) {
    const response = await this.api.post('/sync/register-device', {
      token,
      platform
    });
    return response.data;
  }

  async unregisterDevice(token) {
    const response = await this.api.delete('/sync/unregister-device', {
      data: { token }
    });
    return response.data;
  }

  async forceSync(type, data) {
    const response = await this.api.post('/sync/force-sync', {
      type,
      data
    });
    return response.data;
  }

  async getUserSessions() {
    const response = await this.api.get('/sync/user-sessions');
    return response.data;
  }

  // Notification APIs
  async getNotifications(page = 1, limit = 20) {
    const response = await this.api.get('/notifications', {
      params: { page, limit }
    });
    return response.data;
  }

  async markNotificationAsRead(notificationId) {
    const response = await this.api.put(`/notifications/${notificationId}/read`);
    return response.data;
  }

  async markAllNotificationsAsRead() {
    const response = await this.api.put('/notifications/mark-all-read');
    return response.data;
  }

  // Media APIs
  async uploadScreenshot(tournamentId, imageData) {
    const formData = new FormData();
    formData.append('screenshot', imageData);
    formData.append('tournamentId', tournamentId);
    
    const response = await this.api.post('/media/screenshot', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  async getMediaGallery(type = 'all', page = 1, limit = 20) {
    const response = await this.api.get('/media/gallery', {
      params: { type, page, limit }
    });
    return response.data;
  }

  // Leaderboard APIs
  async getLeaderboard(type = 'overall', period = 'all') {
    const response = await this.api.get('/leaderboard', {
      params: { type, period }
    });
    return response.data;
  }

  // Chat APIs
  async getTournamentMessages(tournamentId, page = 1, limit = 50) {
    const response = await this.api.get(`/chat/tournament/${tournamentId}`, {
      params: { page, limit }
    });
    return response.data;
  }

  async sendTournamentMessage(tournamentId, message) {
    const response = await this.api.post(`/chat/tournament/${tournamentId}`, {
      message
    });
    return response.data;
  }

  // Room/Slot APIs
  async getRoomSlots(tournamentId) {
    const response = await this.api.get(`/room-slots/${tournamentId}`);
    return response.data;
  }

  async updateRoomSlot(tournamentId, slotData) {
    const response = await this.api.put(`/room-slots/${tournamentId}`, slotData);
    return response.data;
  }

  // Statistics APIs
  async getUserStats() {
    const response = await this.api.get('/stats/user');
    return response.data;
  }

  async getPlatformStats() {
    const response = await this.api.get('/stats/platform');
    return response.data;
  }

  // Utility methods
  async healthCheck() {
    const response = await this.api.get('/health');
    return response.data;
  }

  async testNotification() {
    const response = await this.api.post('/sync/test-notification');
    return response.data;
  }

  // Batch operations for offline sync
  async batchSync(operations) {
    const response = await this.api.post('/sync/batch', {
      operations
    });
    return response.data;
  }

  // Error handling helper
  handleApiError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        success: false,
        message: error.response.data?.message || 'Server error occurred',
        status: error.response.status,
        data: error.response.data
      };
    } else if (error.request) {
      // Network error
      return {
        success: false,
        message: 'Network error. Please check your connection.',
        status: 0,
        data: null
      };
    } else {
      // Other error
      return {
        success: false,
        message: error.message || 'An unexpected error occurred',
        status: -1,
        data: null
      };
    }
  }
}

export default UnifiedApiService;