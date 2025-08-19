import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`API Error: ${error.response?.status || 'Network Error'} ${error.config?.url}`);
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/admin/auth/login', credentials),
  logout: () => api.post('/admin/auth/logout'),
  checkAuth: () => api.get('/admin/auth/check'),
};

// Tournament APIs
export const tournamentAPI = {
  getAll: (params = {}) => {
    console.log('API: Fetching tournaments with params:', params);
    return api.get('/admin/tournaments', { params }).then(response => {
      console.log('API: Tournament fetch response:', response.data);
      
      // Handle different response structures
      let tournaments = [];
      if (response.data && Array.isArray(response.data.tournaments)) {
        tournaments = response.data.tournaments;
      } else if (response.data && Array.isArray(response.data.data)) {
        tournaments = response.data.data;
      } else if (Array.isArray(response.data)) {
        tournaments = response.data;
      }
      
      console.log('API: Processed tournaments count:', tournaments.length);
      console.log('API: Tournament titles:', tournaments.map(t => t.title));
      
      return {
        ...response,
        data: {
          ...response.data,
          tournaments: tournaments,
          data: tournaments
        }
      };
    }).catch(error => {
      console.error('API: Error fetching tournaments:', error);
      console.error('API: Error response:', error.response?.data);
      throw error;
    });
  },
  getById: (id) => api.get(`/admin/tournaments/${id}`),
  create: (data) => {
    console.log('API: Creating tournament with data:', data);
    return api.post('/admin/tournaments', data).then(response => {
      console.log('API: Tournament creation response:', response.data);
      return response;
    });
  },
  update: (id, data) => {
    console.log('API: Updating tournament with data:', data);
    return api.put(`/admin/tournaments/${id}`, data);
  },
  delete: (id) => api.delete(`/admin/tournaments/${id}`),
  updateStatus: (id, status) => {
    console.log('API: Updating tournament status:', { id, status });
    return api.patch(`/admin/tournaments/${id}/status`, { status }).then(response => {
      console.log('API: Status update response:', response.data);
      return response;
    }).catch(error => {
      console.error('API: Status update error:', error);
      console.error('API: Error response:', error.response?.data);
      console.error('API: Error status:', error.response?.status);
      throw error;
    });
  },
  postResult: (id, result) => api.post(`/admin/tournaments/${id}/results`, result),
  getParticipants: (id) => api.get(`/admin/tournaments/${id}/participants`),
  releaseCredentials: (id) => api.post(`/admin/tournaments/${id}/release-credentials`),
};

// User APIs
export const userAPI = {
  getAll: (params = {}) => api.get('/admin/users', { params }),
  getById: (id) => api.get(`/admin/users/${id}`),
  update: (id, data) => api.put(`/admin/users/${id}`, data),
  ban: (id, reason) => api.post(`/admin/users/${id}/ban`, { reason }),
  unban: (id) => api.post(`/admin/users/${id}/unban`),
  disqualify: (userId, tournamentId, reason) => 
    api.post(`/admin/users/${userId}/disqualify/${tournamentId}`, { reason }),
  getReports: (params = {}) => api.get('/admin/users/reports', { params }),
  handleReport: (reportId, action) => api.post(`/admin/users/reports/${reportId}/handle`, action),
};

// Analytics APIs
export const analyticsAPI = {
  getDashboard: () => api.get('/admin/analytics/dashboard'),
  getTournamentStats: async (params = {}) => {
    try {
      const response = await api.get('/admin/analytics/tournaments', { params });
      return response.data;
    } catch (error) {
      console.error('Analytics API error:', error);
      // Return a fallback structure to prevent frontend crashes
      return {
        success: false,
        data: null,
        error: error.message || 'Failed to fetch analytics data'
      };
    }
  },
  getUserStats: (params = {}) => api.get('/admin/analytics/users', { params }),
  getRevenueStats: (params = {}) => api.get('/admin/analytics/revenue', { params }),
  getParticipationStats: (params = {}) => api.get('/admin/analytics/participation', { params }),
};

// Payout APIs
export const payoutAPI = {
  getAll: (params = {}) => api.get('/admin/payouts', { params }),
  getById: (id) => api.get(`/admin/payouts/${id}`),
  updateStatus: (id, data) => api.patch(`/admin/payouts/${id}/status`, data),
  processPayout: (id) => api.post(`/admin/payouts/${id}/process`),
  getPending: () => api.get('/admin/payouts/pending'),
  markAsPaid: (id, transactionDetails) => api.patch(`/admin/payouts/${id}/mark-paid`, transactionDetails),
  addTransactionDetails: (id, details) => api.patch(`/admin/payouts/${id}/transaction`, details),
};

// Media APIs
export const mediaAPI = {
  getAll: (params = {}) => api.get('/admin/media', { params }),
  getById: (id) => api.get(`/admin/media/${id}`),
  upload: (file, metadata = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    Object.keys(metadata).forEach(key => {
      formData.append(key, metadata[key]);
    });
    
    return api.post('/admin/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  update: (id, data) => api.put(`/admin/media/${id}`, data),
  delete: (id) => api.delete(`/admin/media/${id}`),
  toggleVisibility: (id, isVisible) => api.patch(`/admin/media/${id}/visibility`, { isVisible }),
};

// Tournament Video APIs
export const videoAPI = {
  getAll: () => api.get('/admin/tournament-videos'),
  getById: (id) => api.get(`/admin/tournament-videos/${id}`),
  create: (data) => {
    console.log('API: Creating video with data:', data);
    return api.post('/admin/tournament-videos', data);
  },
  update: (id, data) => {
    console.log('API: Updating video with data:', data);
    return api.put(`/admin/tournament-videos/${id}`, data);
  },
  delete: (id) => api.delete(`/admin/tournament-videos/${id}`),
  toggleVisibility: (id, isVisible) => api.patch(`/admin/tournament-videos/${id}/visibility`, { isVisible }),
  // Add video to specific tournament
  addToTournament: (tournamentId, data) => {
    console.log('API: Adding video to tournament:', tournamentId, data);
    return api.post(`/admin/tournaments/${tournamentId}/video`, data);
  }
};

// Scheduling APIs
export const schedulingAPI = {
  getScheduled: (params = {}) => api.get('/admin/scheduling', { params }),
  createSchedule: (data) => api.post('/admin/scheduling', data),
  updateSchedule: (id, data) => api.put(`/admin/scheduling/${id}`, data),
  deleteSchedule: (id) => api.delete(`/admin/scheduling/${id}`),
  autoSchedule: (rules) => api.post('/admin/scheduling/auto', rules),
};

// AI Reports APIs
export const aiReportsAPI = {
  getSuspiciousActivity: (params = {}) => api.get('/admin/ai/suspicious', { params }),
  getHackerDetection: (params = {}) => api.get('/admin/ai/hackers', { params }),
  getViolations: (params = {}) => api.get('/admin/ai/violations', { params }),
  flagUser: (userId, reason) => api.post('/admin/ai/flag-user', { userId, reason }),
  getSuggestions: () => api.get('/admin/ai/suggestions'),
};

// Search and Export APIs
export const searchExportAPI = {
  search: (query, type) => api.get('/admin/search', { params: { q: query, type } }),
  exportData: (type, format, filters = {}) => 
    api.post('/admin/export', { type, format, ...filters }),
  getExportHistory: () => api.get('/admin/export/history'),
  getExportStats: () => api.get('/admin/export/stats'),
  getDataPreview: (type, params = {}) => api.get(`/admin/export/preview/${type}`, { params }),
  downloadExport: (filename) => api.get(`/admin/export/download/${filename}`, { responseType: 'blob' }),
};

// Tournament Videos APIs
export const tournamentVideoAPI = {
  getAll: (params = {}) => api.get('/admin/tournament-videos', { params }),
  getById: (id) => api.get(`/admin/tournament-videos/${id}`),
  create: (data) => {
    console.log('API: Creating tournament video with data:', data);
    return api.post('/admin/tournament-videos', data);
  },
  update: (id, data) => {
    console.log('API: Updating tournament video with data:', data);
    return api.put(`/admin/tournament-videos/${id}`, data);
  },
  delete: (id) => api.delete(`/admin/tournament-videos/${id}`),
  toggleVisibility: (id, isVisible) => api.patch(`/admin/tournament-videos/${id}/visibility`, { isVisible }),
  getVisible: (params = {}) => api.get('/admin/tournament-videos/visible', { params }),
};

// Broadcast APIs
export const broadcastAPI = {
  getHistory: (params = {}) => api.get('/admin/broadcast/history', { params }),
  sendMessage: (data) => {
    console.log('API: Sending broadcast with data:', data);
    return api.post('/admin/broadcast/send', {
      title: data.title,
      message: data.content,
      type: data.type === 'announcement' ? 'general_update' : data.type,
      priority: data.priority,
      targetAudience: data.targetAudience === 'all' ? 'all_users' : data.targetAudience
    });
  },
  scheduleMessage: (data) => {
    console.log('API: Scheduling broadcast with data:', data);
    return api.post('/admin/broadcast/schedule', {
      title: data.title,
      message: data.content,
      type: data.type === 'announcement' ? 'general_update' : data.type,
      priority: data.priority,
      targetAudience: data.targetAudience === 'all' ? 'all_users' : data.targetAudience,
      scheduledAt: data.scheduledFor
    });
  },
  cancelScheduled: (id) => api.delete(`/admin/broadcast/${id}`),
};

// Notifications APIs
export const notificationAPI = {
  getAll: (params = {}) => api.get('/admin/notifications', { params }),
  getById: (id) => api.get(`/admin/notifications/${id}`),
  create: (data) => {
    console.log('API: Creating notification with data:', data);
    return api.post('/admin/notifications', data);
  },
  update: (id, data) => {
    console.log('API: Updating notification with data:', data);
    return api.put(`/admin/notifications/${id}`, data);
  },
  delete: (id) => api.delete(`/admin/notifications/${id}`),
  send: (id) => api.post(`/admin/notifications/${id}/send`),
};

export default api; 