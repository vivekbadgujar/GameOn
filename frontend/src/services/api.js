import axios from 'axios';
import config from '../config';

// Log API configuration for debugging (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('API Configuration:', {
    API_BASE_URL: config.API_BASE_URL,
    WS_URL: config.WS_URL
  });
}

const api = axios.create({
  baseURL: config.API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

const shouldLogApiError = (error) => {
  const status = error?.response?.status;
  const url = error?.config?.url || '';
  // Don't log 404 on payment status checks (expected when user hasn't paid)
  if (status === 404 && url.includes('/payments/manual/status/')) return false;
  return true;
};

// Add token to requests if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      console.error('❌ Network Error - Backend not reachable:', {
        baseURL: error.config?.baseURL,
        url: error.config?.url,
        message: error.message,
        code: error.code
      });
    } else if (error.response) {
      if (shouldLogApiError(error)) {
        console.error('❌ API Error Response:', {
          status: error.response.status,
          url: error.config?.url,
          data: error.response.data
        });
      }
    }

    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.message;
      if (errorMessage && (
        errorMessage.includes('Token has expired') ||
        errorMessage.includes('Invalid token') ||
        errorMessage.includes('Invalid or expired token') ||
        errorMessage.includes('Access token required')
      )) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete api.defaults.headers.common['Authorization'];
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
            window.dispatchEvent(new CustomEvent('tokenExpired', {
              detail: { message: 'Your session has expired. Please login again.' }
            }));
            setTimeout(() => { window.location.href = '/login'; }, 1500);
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────

export const login = async (email, password) => {
  try {
    if (!email || !password) throw new Error('Email and password are required');
    const response = await api.post('/auth/login', {
      email: email.trim(),
      password: password
    });
    const data = response.data;
    if (!data?.success) throw new Error(data?.message || 'Login failed');
    if (!data.token || !data.user) throw new Error('Invalid response format');
    return { success: true, user: data.user, token: data.token, message: data.message || 'Login successful' };
  } catch (error) {
    if (error.code === 'ECONNABORTED') throw new Error('Request timeout. Please check your connection and try again.');
    if (error.response?.status === 401) throw new Error('Invalid email or password');
    if (error.response?.status === 404) throw new Error('User does not exist');
    if (error.response?.status === 429) throw new Error('Too many login attempts. Please try again later.');
    throw new Error(error.response?.data?.message || error.message || 'Login failed. Please try again.');
  }
};

export const register = async (userData = {}) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const sendOTP = (phone) => api.post('/auth/send-otp', { phone });
export const verifyOTP = (phone, otp) => api.post('/auth/verify-otp', { phone, otp });
export const logout = () => api.post('/auth/logout');
export const acceptPolicies = (userId, version = '1.0') => api.post('/auth/accept-policies', { userId, version });
export const validateBgmiId = async (bgmiId) => {
  const response = await api.post('/auth/validate-bgmi-id', { bgmiId });
  return response.data;
};

// ─── User ────────────────────────────────────────────────────────────────────

export const getUserProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

export const updateUserProfile = async (data) => {
  const response = await api.put('/users/profile', data);
  return response;
};

export const getUserStats = async () => {
  const response = await api.get('/users/stats');
  return response.data;
};

// ─── Tournaments ─────────────────────────────────────────────────────────────

export const getTournaments = async (params = {}) => {
  try {
    if (typeof window === 'undefined') {
      return { success: true, tournaments: [], message: 'Build time - no tournaments loaded' };
    }

    let queryParams = {};
    if (typeof params === 'string') {
      queryParams.status = params;
    } else if (typeof params === 'object' && params !== null) {
      queryParams = { ...params };
    }

    const response = await api.get('/tournaments', { params: queryParams });
    if (response.status === 204 || !response.data) {
      return { success: true, tournaments: [], message: 'No tournaments available' };
    }

    const tournaments = response.data?.tournaments || [];
    return {
      success: response.data?.success !== false,
      tournaments,
      message: response.data?.message || 'Tournaments fetched successfully',
      error: null
    };
  } catch (error) {
    console.error('API: Error fetching tournaments:', error);
    return {
      success: false,
      tournaments: [],
      error,
      message: error.response?.status === 404
        ? 'Tournaments endpoint not found'
        : error.response?.status === 500
        ? 'Server error'
        : 'Failed to fetch tournaments'
    };
  }
};

export const getTournamentById = async (id) => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    const error = new Error('Invalid tournament ID provided');
    error.response = { status: 400, data: { error: 'Invalid tournament ID' } };
    throw error;
  }
  const response = await api.get(`/tournaments/${id}`);
  if (!response.data?.success) throw new Error(response.data?.error || 'Failed to fetch tournament');
  const tournament = response.data?.tournament;
  if (!tournament || !tournament._id) throw new Error('Tournament data not found in response');
  return tournament;
};

export const getTournamentParticipationStatus = async (id) => {
  const response = await api.get(`/tournaments/${id}/participation-status`);
  return response.data;
};

export const joinTournament = (id, paymentData = null) => api.post(`/tournaments/${id}/join`, { paymentData });
export const submitResult = (id, data) => api.post(`/tournaments/${id}/submit-result`, data);

// ─── Wallet ──────────────────────────────────────────────────────────────────

export const getWalletHistory = async () => {
  const response = await api.get('/wallet/history');
  return response.data;
};

export const getWalletBalance = async () => {
  const response = await api.get('/wallet/balance');
  return response.data;
};

export const getTransactionHistory = async () => {
  const response = await api.get('/wallet/transactions');
  return response.data;
};

export const addFunds = async (data) => {
  const response = await api.post('/wallet/add-funds', data);
  return response.data;
};

export const withdrawFunds = async (data) => {
  const response = await api.post('/wallet/withdraw', data);
  return response.data;
};

export const addMoneyToWallet = async (data) => {
  const response = await api.post('/wallet/add', data);
  return response.data;
};

// ─── Payments ────────────────────────────────────────────────────────────────

export const createPaymentOrder = (amount) => api.post('/payments/create-order', { amount });

export const getManualPaymentStatus = async (tournamentId) => {
  const response = await api.get(`/payments/manual/status/${tournamentId}`);
  return response.data;
};

export const submitManualPayment = async (formData) => {
  try {
    const response = await api.post('/payments/manual/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting manual payment:', error);
    throw error;
  }
};

// ─── YouTube ─────────────────────────────────────────────────────────────────

export const getYouTubeVideos = async (searchTerm = '') => {
  try {
    if (typeof window === 'undefined') {
      return { success: true, videos: [], message: 'Build time - no videos loaded' };
    }
    const response = await api.get(`/youtube/videos${searchTerm ? `?search=${searchTerm}` : ''}`);
    if (response.status === 204 || !response.data) {
      return { success: true, videos: [], message: 'No videos available' };
    }
    return {
      success: response.data?.success !== false,
      videos: response.data?.videos || [],
      message: response.data?.message || 'Videos fetched successfully',
      error: null
    };
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return { success: false, videos: [], error, message: error.message };
  }
};

// ─── Tournament Videos (public) ──────────────────────────────────────────────

// Helper function to extract YouTube ID from URL
const extractYouTubeIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*[&?]v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1] && match[1].length === 11) return match[1];
  }
  return null;
};

export const getTournamentVideos = async (params = {}) => {
  try {
    // Uses public route /api/tournament-videos/visible — no admin auth required
    const response = await api.get('/tournament-videos/visible', { params });
    const videos = (response.data?.data || []).map(video => {
      let youtubeId = video.youtubeId;
      if (!youtubeId && video.youtubeUrl) youtubeId = extractYouTubeIdFromUrl(video.youtubeUrl);
      return {
        ...video,
        youtubeId,
        embedUrl: youtubeId ? `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1` : null,
        thumbnail: video.thumbnail || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : null)
      };
    });
    return { success: response.data?.success || true, videos, message: response.data?.message || 'Videos fetched successfully' };
  } catch (error) {
    console.error('API: Error fetching tournament videos:', error);
    return { success: false, videos: [], message: 'Failed to fetch videos' };
  }
};

// ─── Stats ───────────────────────────────────────────────────────────────────

export const getPlatformStats = async () => {
  const response = await api.get('/stats/platform');
  return response.data;
};

export const getRecentWinners = async () => {
  const response = await api.get('/stats/recent-winners');
  return response.data;
};

export const getLeaderboard = async (type = 'overall', timeFilter = 'all', limit = 50) => {
  try {
    if (typeof window === 'undefined') {
      return { success: true, players: [], message: 'Build time - no leaderboard loaded' };
    }
    // Route is /api/leaderboard (mounted directly, not under /stats)
    const response = await api.get('/leaderboard', { params: { type, timeFilter, limit } });
    if (response.status === 204 || !response.data) {
      return { success: true, players: [], message: 'No leaderboard data available' };
    }
    let players = [];
    if (response.data?.players) players = Array.isArray(response.data.players) ? response.data.players : [];
    else if (response.data?.data?.leaderboard) players = Array.isArray(response.data.data.leaderboard) ? response.data.data.leaderboard : [];
    else if (Array.isArray(response.data)) players = response.data;
    return { success: response.data?.success !== false, players, message: response.data?.message || 'Leaderboard fetched successfully', error: null };
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return { success: false, players: [], error, message: error.message };
  }
};

// ─── Notifications ───────────────────────────────────────────────────────────

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
    // Backend route: PATCH /api/notifications/:id/read
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const getUserNotifications = async () => {
  try {
    const response = await api.get('/notifications');
    return {
      success: response.data?.success || true,
      notifications: response.data?.notifications || [],
      unreadCount: response.data?.unreadCount || 0
    };
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    return { success: false, notifications: [], unreadCount: 0 };
  }
};

// ─── Media ───────────────────────────────────────────────────────────────────

export const getPublicMedia = async (params = {}) => {
  try {
    const response = await api.get('/media/public', { params });
    return { success: response.data?.success || true, media: response.data?.data || [], total: response.data?.total || 0 };
  } catch (error) {
    console.error('Error fetching public media:', error);
    return { success: false, media: [], total: 0 };
  }
};

// ─── Auth (password reset) ───────────────────────────────────────────────────

export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, newPassword) => {
  const response = await api.post('/auth/reset-password', { token, newPassword });
  return response.data;
};

export const verifyResetToken = async (token) => {
  const response = await api.post('/auth/verify-reset-token', { token });
  return response.data;
};

// ─── Chat ────────────────────────────────────────────────────────────────────

export const getTournamentMessages = async (tournamentId, page = 1, limit = 50) => {
  const response = await api.get(`/chat/tournament/${tournamentId}`, { params: { page, limit } });
  return response.data;
};

export const sendTournamentMessage = async (tournamentId, messageData) => {
  const response = await api.post(`/chat/tournament/${tournamentId}`, messageData);
  return response.data;
};

export const getDirectMessages = async (userId1, userId2, page = 1, limit = 50) => {
  const response = await api.get(`/chat/direct/${userId1}/${userId2}`, { params: { page, limit } });
  return response.data;
};

export const sendDirectMessage = async (messageData) => {
  const response = await api.post('/chat/direct', messageData);
  return response.data;
};

export const markMessagesAsRead = async (userId, messageIds) => {
  const response = await api.put(`/chat/read/${userId}`, { messageIds });
  return response.data;
};

export const getUserConversations = async (userId) => {
  const response = await api.get(`/chat/conversations/${userId}`);
  return response.data;
};

export const reportMessage = async (messageId, reportData) => {
  const response = await api.post(`/chat/report/${messageId}`, reportData);
  return response.data;
};

// ─── Friends ─────────────────────────────────────────────────────────────────

export const getFriendsList = async (status = 'accepted', page = 1, limit = 20) => {
  const response = await api.get(`/friends/list?status=${status}&page=${page}&limit=${limit}`);
  return response.data;
};

export const searchUsers = async (query, page = 1, limit = 10) => {
  const response = await api.get(`/friends/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
  return response.data;
};

export const sendFriendRequest = async (recipientId) => {
  const response = await api.post('/friends/request', { recipientId });
  return response.data;
};

export const getFriendRequests = async (type = 'received', page = 1, limit = 20) => {
  const response = await api.get(`/friends/requests/${type}?page=${page}&limit=${limit}`);
  return response.data;
};

export const acceptFriendRequest = async (requestId) => {
  const response = await api.post(`/friends/requests/${requestId}/accept`);
  return response.data;
};

export const declineFriendRequest = async (requestId) => {
  const response = await api.post(`/friends/requests/${requestId}/decline`);
  return response.data;
};

export const removeFriend = async (friendId) => {
  const response = await api.delete(`/friends/${friendId}`);
  return response.data;
};

export const getReferralInfo = async () => {
  const response = await api.get('/friends/referral');
  return response.data;
};

export const getFriendsLeaderboard = async (type = 'xp', timeframe = 'week') => {
  const response = await api.get(`/friends/leaderboard?type=${type}&timeframe=${timeframe}`);
  return response.data;
};

// ─── Challenges ──────────────────────────────────────────────────────────────

export const getChallenges = async (status, type, page = 1, limit = 20) => {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (type) params.append('type', type);
  params.append('page', page);
  params.append('limit', limit);
  const response = await api.get(`/challenges?${params}`);
  return response.data;
};

export const createChallenge = async (challengeData) => {
  const response = await api.post('/challenges/create', challengeData);
  return response.data;
};

export const acceptChallenge = async (challengeId) => {
  const response = await api.post(`/challenges/${challengeId}/accept`);
  return response.data;
};

export const declineChallenge = async (challengeId) => {
  const response = await api.post(`/challenges/${challengeId}/decline`);
  return response.data;
};

export const getChallengeDetails = async (challengeId) => {
  const response = await api.get(`/challenges/${challengeId}`);
  return response.data;
};

// ─── Achievements ────────────────────────────────────────────────────────────

export const getUserAchievements = async (category, type, rarity, page = 1, limit = 20) => {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (type) params.append('type', type);
  if (rarity) params.append('rarity', rarity);
  params.append('page', page);
  params.append('limit', limit);
  const response = await api.get(`/achievements?${params}`);
  return response.data;
};

export const getAchievementsFeed = async (page = 1, limit = 20) => {
  const response = await api.get(`/achievements/feed?page=${page}&limit=${limit}`);
  return response.data;
};

export const likeAchievement = async (achievementId) => {
  const response = await api.post(`/achievements/${achievementId}/like`);
  return response.data;
};

export const unlikeAchievement = async (achievementId) => {
  const response = await api.delete(`/achievements/${achievementId}/like`);
  return response.data;
};

export const commentOnAchievement = async (achievementId, comment) => {
  const response = await api.post(`/achievements/${achievementId}/comments`, { comment });
  return response.data;
};

export const shareAchievement = async (achievementId, platform) => {
  const response = await api.post(`/achievements/${achievementId}/share`, { platform });
  return response.data;
};

// ─── Groups ──────────────────────────────────────────────────────────────────

export const getUserGroups = async () => {
  const response = await api.get('/groups/my-groups');
  return response.data;
};

export const getPublicGroups = async (type, page = 1, limit = 20) => {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  params.append('page', page);
  params.append('limit', limit);
  const response = await api.get(`/groups/public?${params}`);
  return response.data;
};

export const searchGroups = async (query, privacy, type, page = 1, limit = 10) => {
  const params = new URLSearchParams();
  params.append('q', query);
  if (privacy) params.append('privacy', privacy);
  if (type) params.append('type', type);
  params.append('page', page);
  params.append('limit', limit);
  const response = await api.get(`/groups/search?${params}`);
  return response.data;
};

export const createGroup = async (groupData) => {
  const response = await api.post('/groups/create', groupData);
  return response.data;
};

export const joinGroup = async (groupId, message) => {
  const response = await api.post(`/groups/${groupId}/join`, { message });
  return response.data;
};

export const getGroupDetails = async (groupId) => {
  const response = await api.get(`/groups/${groupId}`);
  return response.data;
};

// ─── API Object Exports ──────────────────────────────────────────────────────

export const tournamentAPI = {
  getTournaments,
  getTournamentById,
  getTournamentParticipationStatus,
  joinTournament,
  submitResult
};

export const chatAPI = {
  getTournamentMessages,
  sendTournamentMessage,
  getDirectMessages,
  sendDirectMessage,
  markMessagesAsRead,
  getUserConversations,
  reportMessage
};

export const friendsAPI = {
  getFriendsList,
  searchUsers,
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  getReferralInfo,
  getFriendsLeaderboard
};

export const challengesAPI = {
  getChallenges,
  createChallenge,
  acceptChallenge,
  declineChallenge,
  getChallengeDetails
};

export const achievementsAPI = {
  getUserAchievements,
  getAchievementsFeed,
  likeAchievement,
  unlikeAchievement,
  commentOnAchievement,
  shareAchievement
};

export const groupsAPI = {
  getUserGroups,
  getPublicGroups,
  searchGroups,
  createGroup,
  joinGroup,
  getGroupDetails
};

export default api;
