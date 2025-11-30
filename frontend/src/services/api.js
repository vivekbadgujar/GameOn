import axios from 'axios';
import config from '../config';

const api = axios.create({
  baseURL: config.API_BASE_URL,
  withCredentials: true,
  timeout: 30000, // 30 second timeout
  // Add default headers for build time
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  // Check if we're in browser environment
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle token expiration and authentication errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check if error is due to token expiration
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.message;
      
      // Handle token expiration
      if (errorMessage === 'Token has expired' || errorMessage === 'Invalid token') {
        console.log('Token expired, clearing auth data');
        
        // Clear auth data (only in browser)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Clear axios headers
          delete api.defaults.headers.common['Authorization'];
          
          // Only redirect to login if not already on login/register pages
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
            // Show a user-friendly message
            const event = new CustomEvent('tokenExpired', {
              detail: { message: 'Your session has expired. Please login again.' }
            });
            window.dispatchEvent(event);
            
            // Redirect to login after a short delay
            setTimeout(() => {
              window.location.href = '/login';
            }, 1000);
          }
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth endpoints
export const login = async (email, password) => {
  try {
    console.log('API: Attempting login for:', email);
    
    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Make the request
    const response = await api.post(config.ENDPOINTS.AUTH.LOGIN, { 
      email: email.trim(),
      password: password
    });

    // Validate response
    const data = response.data;
    if (!data) {
      throw new Error('Invalid response from server');
    }

    if (!data.success) {
      throw new Error(data.message || 'Login failed');
    }

    if (!data.token || !data.user) {
      throw new Error('Invalid response format');
    }

    console.log('API: Login successful');
    return {
      success: true,
      user: data.user,
      token: data.token,
      message: data.message || 'Login successful'
    };

  } catch (error) {
    console.error('Login API Error:', error);
    
    // Handle different types of errors
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection and try again.');
    } else if (error.response) {
      // Server responded with error status
      if (error.response.status === 401) {
        throw new Error('Invalid email or password');
      } else if (error.response.status === 404) {
        throw new Error('User does not exist');
      } else if (error.response.status === 429) {
        throw new Error('Too many login attempts. Please try again later.');
      } else if (error.response.status === 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(error.response.data?.message || 'Login failed. Please try again.');
      }
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      throw new Error(error.message || 'An unexpected error occurred. Please try again.');
    }
  }
};

export const register = async (userData = {}) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Registration API error:', error.response || error.message);
    throw error;
  }
};

export const sendOTP = (phone) => api.post('/auth/send-otp', { phone });
export const verifyOTP = (phone, otp) => api.post('/auth/verify-otp', { phone, otp });
export const logout = () => api.post('/auth/logout');
export const acceptPolicies = (userId, version = '1.0') => api.post('/auth/accept-policies', { userId, version });
export const validateBgmiId = async (bgmiId) => {
  try {
    const response = await api.post('/auth/validate-bgmi-id', { bgmiId });
    return response.data;
  } catch (error) {
    console.error('BGMI ID validation error:', error);
    throw error;
  }
};

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
    // Skip API calls during build time
    if (typeof window === 'undefined') {
      return {
        success: true,
        tournaments: [],
        message: 'Build time - no tournaments loaded'
      };
    }

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
    console.error('API: Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
      baseURL: error.config?.baseURL
    });
    
    // Return empty array instead of throwing to prevent page crashes
    return {
      success: false,
      tournaments: [],
      message: error.response?.status === 404 
        ? 'Tournaments endpoint not found' 
        : error.response?.status === 500
        ? 'Server error'
        : 'Failed to fetch tournaments'
    };
  }
};

export const getTournamentById = async (id) => {
  try {
    console.log('API: Fetching tournament by ID:', id);
    const response = await api.get(`/tournaments/${id}`);
    console.log('API: Tournament response:', response.data);
    
    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Failed to fetch tournament');
    }
    
    const tournament = response.data?.tournament;
    if (!tournament) {
      throw new Error('Tournament data not found in response');
    }
    
    console.log('API: Returning tournament:', tournament.title);
    return tournament;
  } catch (error) {
    console.error('API: Error fetching tournament by ID:', error);
    console.error('API: Error response:', error.response?.data);
    throw error;
  }
};

export const getTournamentParticipationStatus = async (id) => {
  try {
    const response = await api.get(`/tournaments/${id}/participation-status`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tournament participation status:', error);
    throw error;
  }
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
    // Skip API calls during build time
    if (typeof window === 'undefined') {
      return { success: true, videos: [], message: 'Build time - no videos loaded' };
    }

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
    
    // Ensure proper YouTube ID extraction and embed URL format
    const videos = (response.data?.data || []).map(video => {
      // Extract YouTube ID if not present
      let youtubeId = video.youtubeId;
      if (!youtubeId && video.youtubeUrl) {
        youtubeId = extractYouTubeIdFromUrl(video.youtubeUrl);
      }
      
      return {
        ...video,
        youtubeId,
        embedUrl: youtubeId ? `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1` : null,
        thumbnail: video.thumbnail || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : null)
      };
    });
    
    return {
      success: response.data?.success || true,
      videos: videos,
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
    if (match && match[1] && match[1].length === 11) {
      return match[1];
    }
  }
  
  return null;
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
  try {
    // Skip API calls during build time
    if (typeof window === 'undefined') {
      return { success: true, players: [], message: 'Build time - no leaderboard loaded' };
    }

    const response = await api.get('/stats/leaderboard', {
      params: { type, timeFilter, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return { success: false, players: [], error: error.message };
  }
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

export const getUserNotifications = async () => {
  try {
    const response = await api.get('/user/notifications');
    return {
      success: response.data?.success || true,
      notifications: response.data?.notifications || [],
      unreadCount: response.data?.unreadCount || 0
    };
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    return {
      success: false,
      notifications: [],
      unreadCount: 0
    };
  }
};

// Media API for frontend
export const getPublicMedia = async (params = {}) => {
  try {
    const response = await api.get('/media/public', { params });
    return {
      success: response.data?.success || true,
      media: response.data?.data || [],
      total: response.data?.total || 0
    };
  } catch (error) {
    console.error('Error fetching public media:', error);
    return {
      success: false,
      media: [],
      total: 0
    };
  }
};

// Password Reset API functions
export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    console.error('Error sending password reset request:', error);
    throw error;
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

export const verifyResetToken = async (token) => {
  try {
    const response = await api.post('/auth/verify-reset-token', { token });
    return response.data;
  } catch (error) {
    console.error('Error verifying reset token:', error);
    throw error;
  }
};

// Chat API functions
export const getTournamentMessages = async (tournamentId, page = 1, limit = 50) => {
  try {
    const response = await api.get(`/chat/tournament/${tournamentId}`, {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching tournament messages:', error);
    throw error;
  }
};

export const sendTournamentMessage = async (tournamentId, messageData) => {
  try {
    const response = await api.post(`/chat/tournament/${tournamentId}`, messageData);
    return response.data;
  } catch (error) {
    console.error('Error sending tournament message:', error);
    throw error;
  }
};

export const getDirectMessages = async (userId1, userId2, page = 1, limit = 50) => {
  try {
    const response = await api.get(`/chat/direct/${userId1}/${userId2}`, {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching direct messages:', error);
    throw error;
  }
};

export const sendDirectMessage = async (messageData) => {
  try {
    const response = await api.post('/chat/direct', messageData);
    return response.data;
  } catch (error) {
    console.error('Error sending direct message:', error);
    throw error;
  }
};

export const markMessagesAsRead = async (userId, messageIds) => {
  try {
    const response = await api.put(`/chat/read/${userId}`, { messageIds });
    return response.data;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

export const getUserConversations = async (userId) => {
  try {
    const response = await api.get(`/chat/conversations/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user conversations:', error);
    throw error;
  }
};

export const reportMessage = async (messageId, reportData) => {
  try {
    const response = await api.post(`/chat/report/${messageId}`, reportData);
    return response.data;
  } catch (error) {
    console.error('Error reporting message:', error);
    throw error;
  }
};

// Tournament API object for easier imports
export const tournamentAPI = {
  getTournaments,
  getTournamentById,
  getTournamentParticipationStatus,
  joinTournament,
  submitResult
};

// Chat API object for easier imports
export const chatAPI = {
  getTournamentMessages,
  sendTournamentMessage,
  getDirectMessages,
  sendDirectMessage,
  markMessagesAsRead,
  getUserConversations,
  reportMessage
};

// Friends API
export const getFriendsList = async (status = 'accepted', page = 1, limit = 20) => {
  try {
    const response = await api.get(`/friends/list?status=${status}&page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching friends list:', error);
    throw error;
  }
};

export const searchUsers = async (query, page = 1, limit = 10) => {
  try {
    const response = await api.get(`/friends/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

export const sendFriendRequest = async (recipientId) => {
  try {
    const response = await api.post('/friends/request', { recipientId });
    return response.data;
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw error;
  }
};

export const getFriendRequests = async (type = 'received', page = 1, limit = 20) => {
  try {
    const response = await api.get(`/friends/requests/${type}?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    throw error;
  }
};

export const acceptFriendRequest = async (requestId) => {
  try {
    const response = await api.post(`/friends/requests/${requestId}/accept`);
    return response.data;
  } catch (error) {
    console.error('Error accepting friend request:', error);
    throw error;
  }
};

export const declineFriendRequest = async (requestId) => {
  try {
    const response = await api.post(`/friends/requests/${requestId}/decline`);
    return response.data;
  } catch (error) {
    console.error('Error declining friend request:', error);
    throw error;
  }
};

export const removeFriend = async (friendId) => {
  try {
    const response = await api.delete(`/friends/${friendId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing friend:', error);
    throw error;
  }
};

export const getReferralInfo = async () => {
  try {
    const response = await api.get('/friends/referral');
    return response.data;
  } catch (error) {
    console.error('Error fetching referral info:', error);
    throw error;
  }
};

export const getFriendsLeaderboard = async (type = 'xp', timeframe = 'week') => {
  try {
    const response = await api.get(`/friends/leaderboard?type=${type}&timeframe=${timeframe}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching friends leaderboard:', error);
    throw error;
  }
};

// Challenges API
export const getChallenges = async (status, type, page = 1, limit = 20) => {
  try {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (type) params.append('type', type);
    params.append('page', page);
    params.append('limit', limit);
    
    const response = await api.get(`/challenges?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching challenges:', error);
    throw error;
  }
};

export const createChallenge = async (challengeData) => {
  try {
    const response = await api.post('/challenges/create', challengeData);
    return response.data;
  } catch (error) {
    console.error('Error creating challenge:', error);
    throw error;
  }
};

export const acceptChallenge = async (challengeId) => {
  try {
    const response = await api.post(`/challenges/${challengeId}/accept`);
    return response.data;
  } catch (error) {
    console.error('Error accepting challenge:', error);
    throw error;
  }
};

export const declineChallenge = async (challengeId) => {
  try {
    const response = await api.post(`/challenges/${challengeId}/decline`);
    return response.data;
  } catch (error) {
    console.error('Error declining challenge:', error);
    throw error;
  }
};

export const getChallengeDetails = async (challengeId) => {
  try {
    const response = await api.get(`/challenges/${challengeId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching challenge details:', error);
    throw error;
  }
};

// Achievements API
export const getUserAchievements = async (category, type, rarity, page = 1, limit = 20) => {
  try {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (type) params.append('type', type);
    if (rarity) params.append('rarity', rarity);
    params.append('page', page);
    params.append('limit', limit);
    
    const response = await api.get(`/achievements?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    throw error;
  }
};

export const getAchievementsFeed = async (page = 1, limit = 20) => {
  try {
    const response = await api.get(`/achievements/feed?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching achievements feed:', error);
    throw error;
  }
};

export const likeAchievement = async (achievementId) => {
  try {
    const response = await api.post(`/achievements/${achievementId}/like`);
    return response.data;
  } catch (error) {
    console.error('Error liking achievement:', error);
    throw error;
  }
};

export const unlikeAchievement = async (achievementId) => {
  try {
    const response = await api.delete(`/achievements/${achievementId}/like`);
    return response.data;
  } catch (error) {
    console.error('Error unliking achievement:', error);
    throw error;
  }
};

export const commentOnAchievement = async (achievementId, comment) => {
  try {
    const response = await api.post(`/achievements/${achievementId}/comments`, { comment });
    return response.data;
  } catch (error) {
    console.error('Error commenting on achievement:', error);
    throw error;
  }
};

export const shareAchievement = async (achievementId, platform) => {
  try {
    const response = await api.post(`/achievements/${achievementId}/share`, { platform });
    return response.data;
  } catch (error) {
    console.error('Error sharing achievement:', error);
    throw error;
  }
};

// Groups API
export const getUserGroups = async () => {
  try {
    const response = await api.get('/groups/my-groups');
    return response.data;
  } catch (error) {
    console.error('Error fetching user groups:', error);
    throw error;
  }
};

export const getPublicGroups = async (type, page = 1, limit = 20) => {
  try {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    params.append('page', page);
    params.append('limit', limit);
    
    const response = await api.get(`/groups/public?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching public groups:', error);
    throw error;
  }
};

export const searchGroups = async (query, privacy, type, page = 1, limit = 10) => {
  try {
    const params = new URLSearchParams();
    params.append('q', query);
    if (privacy) params.append('privacy', privacy);
    if (type) params.append('type', type);
    params.append('page', page);
    params.append('limit', limit);
    
    const response = await api.get(`/groups/search?${params}`);
    return response.data;
  } catch (error) {
    console.error('Error searching groups:', error);
    throw error;
  }
};

export const createGroup = async (groupData) => {
  try {
    const response = await api.post('/groups/create', groupData);
    return response.data;
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

export const joinGroup = async (groupId, message) => {
  try {
    const response = await api.post(`/groups/${groupId}/join`, { message });
    return response.data;
  } catch (error) {
    console.error('Error joining group:', error);
    throw error;
  }
};

export const getGroupDetails = async (groupId) => {
  try {
    const response = await api.get(`/groups/${groupId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching group details:', error);
    throw error;
  }
};

// Friends API object for easier imports
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

// Challenges API object for easier imports
export const challengesAPI = {
  getChallenges,
  createChallenge,
  acceptChallenge,
  declineChallenge,
  getChallengeDetails
};

// Achievements API object for easier imports
export const achievementsAPI = {
  getUserAchievements,
  getAchievementsFeed,
  likeAchievement,
  unlikeAchievement,
  commentOnAchievement,
  shareAchievement
};

// Groups API object for easier imports
export const groupsAPI = {
  getUserGroups,
  getPublicGroups,
  searchGroups,
  createGroup,
  joinGroup,
  getGroupDetails
};

export default api;