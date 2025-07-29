import axios from 'axios';
import config from '../config';

const api = axios.create({
  baseURL: config.API_BASE_URL,
  withCredentials: true,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const sendOTP = (phone) => api.post('/auth/send-otp', { phone });
export const verifyOTP = (phone, otp) => api.post('/auth/verify-otp', { phone, otp });
export const logout = () => api.post('/auth/logout');

// User endpoints
export const getUserProfile = async () => {
  try {
    const response = await api.get('/users/profile');
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (data) => {
  try {
    const response = await api.put('/users/profile', data);
    return response;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const getUserStats = async () => {
  try {
    const response = await api.get('/users/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
};

// Tournament endpoints
export const getTournaments = async (params = {}) => {
  try {
    // Handle different parameter formats
    let queryParams = {};
    
    // If params is a string (status), convert to object
    if (typeof params === 'string') {
      queryParams.status = params;
    } else if (typeof params === 'object' && params !== null) {
      queryParams = { ...params };
    }
    
    console.log('API: Fetching tournaments with params:', queryParams);
    
    const response = await api.get('/tournaments', { params: queryParams });
    console.log('API: Full tournament response:', response.data);
    console.log('API: Response structure:', {
      success: response.data?.success,
      tournaments: response.data?.tournaments?.length || 0,
      message: response.data?.message
    });
    
    // Return standardized response structure
    const tournaments = response.data?.tournaments || [];
    console.log('API: Returning tournaments:', tournaments.length);
    console.log('API: Tournament titles:', tournaments.map(t => t.title));
    
    return {
      success: response.data?.success || true,
      tournaments: tournaments,
      message: response.data?.message || 'Tournaments fetched successfully'
    };
  } catch (error) {
    console.error('API: Error fetching tournaments:', error);
    console.error('API: Error details:', error.response?.data);
    return {
      success: false,
      tournaments: [],
      message: 'Failed to fetch tournaments'
    };
  }
};

export const getTournamentById = async (id) => {
  const response = await api.get(`/tournaments/${id}`);
  return response.data?.tournament;
};

export const joinTournament = (id, paymentData = null) => api.post(`/tournaments/${id}/join`, { paymentData });
export const submitResult = (id, data) => api.post(`/tournaments/${id}/submit-result`, data);

// Wallet endpoints
export const getWalletHistory = async () => {
  const response = await api.get('/wallet/history');
  return response.data;
};

export const getWalletBalance = async () => {
  try {
    const response = await api.get('/wallet/balance');
    return response.data;
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    throw error;
  }
};

export const getTransactionHistory = async () => {
  try {
    const response = await api.get('/wallet/transactions');
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    throw error;
  }
};

export const addFunds = async (data) => {
  try {
    const response = await api.post('/wallet/add-funds', data);
    return response.data;
  } catch (error) {
    console.error('Error adding funds:', error);
    throw error;
  }
};

export const withdrawFunds = async (data) => {
  try {
    const response = await api.post('/wallet/withdraw', data);
    return response.data;
  } catch (error) {
    console.error('Error withdrawing funds:', error);
    throw error;
  }
};

export const addMoneyToWallet = async (data) => {
  const response = await api.post('/wallet/add', data);
  return response.data;
};

// Payment endpoints
export const createPaymentOrder = (amount) => api.post('/payments/create-order', { amount });

// YouTube API
export const getYouTubeVideos = async (searchTerm = '') => {
  try {
    const response = await api.get(`/youtube/videos${searchTerm ? `?search=${searchTerm}` : ''}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return { success: false, videos: [], error: error.message };
  }
};

// Tournament Videos API
export const getTournamentVideos = async (params = {}) => {
  try {
    console.log('API: Fetching tournament videos with params:', params);
    const response = await api.get('/admin/tournament-videos/visible', { params });
    console.log('API: Tournament videos response:', response.data);
    
    return {
      success: response.data?.success || true,
      videos: response.data?.data || [],
      message: response.data?.message || 'Videos fetched successfully'
    };
  } catch (error) {
    console.error('API: Error fetching tournament videos:', error);
    return {
      success: false,
      videos: [],
      message: 'Failed to fetch videos'
    };
  }
};

// Stats API
export const getPlatformStats = async () => {
  const response = await api.get('/stats/platform');
  return response.data;
};

export const getRecentWinners = async () => {
  const response = await api.get('/stats/recent-winners');
  return response.data;
};

export const getLeaderboard = async (type = 'overall', timeFilter = 'all', limit = 50) => {
  const response = await api.get('/stats/leaderboard', {
    params: { type, timeFilter, limit }
  });
  return response.data;
};

// Notifications API
export const getNotifications = async () => {
  try {
    const response = await api.get('/notifications');
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Tournament API object for easier imports
export const tournamentAPI = {
  getTournaments,
  getTournamentById,
  joinTournament,
  submitResult
};

export default api;