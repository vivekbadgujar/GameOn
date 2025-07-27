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
    // Return mock data if API fails
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      return JSON.parse(storedUser);
    }
    throw error;
  }
};

export const updateUserProfile = async (data) => {
  try {
    const response = await api.put('/users/profile', data);
    return response;
  } catch (error) {
    // Mock successful update
    return { data: { ...data, _id: '1', updatedAt: new Date().toISOString() } };
  }
};

export const getUserStats = async () => {
  try {
    const response = await api.get('/users/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      tournamentsJoined: 0,
      tournamentsWon: 0,
      totalEarnings: 0,
      currentRank: 'N/A',
      recentActivity: []
    };
  }
};

// Tournament endpoints
export const getTournaments = async () => {
  const response = await api.get('/tournaments');
  return response.data?.tournaments || [];
};

export const getTournamentById = async (id) => {
  const response = await api.get(`/tournaments/${id}`);
  return response.data?.tournament;
};

export const joinTournament = (id) => api.post(`/tournaments/${id}/join`);
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
    return { balance: 2500 }; // Mock balance
  }
};

export const getTransactionHistory = async () => {
  try {
    const response = await api.get('/wallet/transactions');
    return response.data;
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    // Mock transaction history
    return {
      transactions: [
        {
          _id: '1',
          type: 'credit',
          amount: 1000,
          description: 'Tournament Win - BGMI Championship',
          date: new Date(Date.now() - 86400000).toISOString(),
          status: 'completed'
        },
        {
          _id: '2',
          type: 'debit',
          amount: 50,
          description: 'Tournament Entry - VALORANT Pro League',
          date: new Date(Date.now() - 172800000).toISOString(),
          status: 'completed'
        },
        {
          _id: '3',
          type: 'credit',
          amount: 500,
          description: 'Added Funds via UPI',
          date: new Date(Date.now() - 259200000).toISOString(),
          status: 'completed'
        }
      ]
    };
  }
};

export const addFunds = async (data) => {
  try {
    const response = await api.post('/wallet/add-funds', data);
    return response.data;
  } catch (error) {
    // Mock successful fund addition
    return {
      success: true,
      message: 'Funds added successfully',
      newBalance: 2500 + data.amount,
      transaction: {
        _id: Date.now().toString(),
        type: 'credit',
        amount: data.amount,
        description: `Added Funds via ${data.method}`,
        date: new Date().toISOString(),
        status: 'completed'
      }
    };
  }
};

export const withdrawFunds = async (data) => {
  try {
    const response = await api.post('/wallet/withdraw', data);
    return response.data;
  } catch (error) {
    // Mock successful withdrawal
    return {
      success: true,
      message: 'Withdrawal request submitted successfully',
      newBalance: 2500 - data.amount,
      transaction: {
        _id: Date.now().toString(),
        type: 'debit',
        amount: data.amount,
        description: `Withdrawal to ${data.method}`,
        date: new Date().toISOString(),
        status: 'pending'
      }
    };
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
  const response = await api.get(`/youtube/videos${searchTerm ? `?search=${searchTerm}` : ''}`);
  return response.data;
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

// Tournament API object for easier imports
export const tournamentAPI = {
  getTournaments,
  getTournamentById,
  joinTournament,
  submitResult
};

export default api;