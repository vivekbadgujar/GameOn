import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
  getAll: (params = {}) => api.get('/admin/tournaments', { params }),
  getById: (id) => api.get(`/admin/tournaments/${id}`),
  create: (data) => {
    console.log('API: Creating tournament with data:', data);
    return api.post('/admin/tournaments', data);
  },
  update: (id, data) => {
    console.log('API: Updating tournament with data:', data);
    return api.put(`/admin/tournaments/${id}`, data);
  },
  delete: (id) => api.delete(`/admin/tournaments/${id}`),
  updateStatus: (id, status) => api.patch(`/admin/tournaments/${id}/status`, { status }),
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

// Broadcast APIs
export const broadcastAPI = {
  sendMessage: (data) => api.post('/admin/broadcast/send', data),
  getHistory: (params = {}) => api.get('/admin/broadcast/history', { params }),
  scheduleMessage: (data) => api.post('/admin/broadcast/schedule', data),
};

// Payout APIs
export const payoutAPI = {
  getAll: (params = {}) => api.get('/admin/payouts', { params }),
  getById: (id) => api.get(`/admin/payouts/${id}`),
  updateStatus: (id, status) => api.patch(`/admin/payouts/${id}/status`, { status }),
  processPayout: (id) => api.post(`/admin/payouts/${id}/process`),
  getPending: () => api.get('/admin/payouts/pending'),
};

// Media APIs
export const mediaAPI = {
  upload: (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return api.post('/admin/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getAll: (params = {}) => api.get('/admin/media', { params }),
  delete: (id) => api.delete(`/admin/media/${id}`),
  update: (id, data) => api.put(`/admin/media/${id}`, data),
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

export default api; 