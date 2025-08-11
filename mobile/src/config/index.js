/**
 * App Configuration
 * Central configuration for the mobile app
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: __DEV__ ? 'http://10.217.86.8:5000' : 'https://your-production-api.com',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

// App Configuration
export const APP_CONFIG = {
  NAME: 'GameOn',
  VERSION: '1.0.0',
  BUILD_NUMBER: 1,
  BUNDLE_ID: 'com.gameon.mobile',
};

// Feature Flags
export const FEATURES = {
  PUSH_NOTIFICATIONS: true,
  REAL_TIME_SYNC: true,
  OFFLINE_MODE: true,
  ANALYTICS: true,
  CRASH_REPORTING: true,
};

// Game Configuration
export const GAMES = {
  BGMI: {
    name: 'BGMI',
    displayName: 'Battlegrounds Mobile India',
    icon: 'gamepad-variant',
    color: '#FF6B35',
  },
  FREEFIRE: {
    name: 'FREEFIRE',
    displayName: 'Free Fire',
    icon: 'fire',
    color: '#FF9800',
  },
  COD: {
    name: 'COD',
    displayName: 'Call of Duty Mobile',
    icon: 'pistol',
    color: '#4CAF50',
  },
};

// Tournament Configuration
export const TOURNAMENT_CONFIG = {
  MAX_PARTICIPANTS: 100,
  MIN_PARTICIPANTS: 4,
  DEFAULT_ENTRY_FEE: 50,
  MAX_ENTRY_FEE: 5000,
  REGISTRATION_DEADLINE_MINUTES: 30,
};

// Wallet Configuration
export const WALLET_CONFIG = {
  MIN_ADD_AMOUNT: 10,
  MAX_ADD_AMOUNT: 50000,
  MIN_WITHDRAW_AMOUNT: 100,
  MAX_WITHDRAW_AMOUNT: 25000,
  TRANSACTION_FEE_PERCENTAGE: 2.5,
};

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  TOURNAMENT_REMINDERS: true,
  PAYMENT_UPDATES: true,
  PROMOTIONAL_OFFERS: true,
  SYSTEM_UPDATES: true,
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  SETTINGS: 'userSettings',
  CACHE_TIMESTAMP: 'cacheTimestamp',
  FCM_TOKEN: 'fcmToken',
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  REFRESH_TOKEN: '/api/auth/refresh',
  
  // Tournaments
  TOURNAMENTS: '/api/tournaments',
  TOURNAMENT_DETAILS: '/api/tournaments/:id',
  JOIN_TOURNAMENT: '/api/tournaments/:id/join',
  MY_TOURNAMENTS: '/api/tournaments/my-tournaments',
  
  // Wallet
  WALLET_BALANCE: '/api/wallet/balance',
  WALLET_TRANSACTIONS: '/api/wallet/transactions',
  ADD_MONEY: '/api/wallet/add-money',
  WITHDRAW_MONEY: '/api/wallet/withdraw',
  
  // Notifications
  NOTIFICATIONS: '/api/notifications',
  MARK_READ: '/api/notifications/:id/read',
  MARK_ALL_READ: '/api/notifications/mark-all-read',
  
  // User
  PROFILE: '/api/user/profile',
  UPDATE_PROFILE: '/api/user/profile',
  UPLOAD_AVATAR: '/api/user/avatar',
  
  // Leaderboard
  LEADERBOARD: '/api/leaderboard',
  
  // Stats
  PLATFORM_STATS: '/api/stats/platform',
  USER_STATS: '/api/stats/user',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'Session expired. Please login again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  INSUFFICIENT_BALANCE: 'Insufficient wallet balance.',
  TOURNAMENT_FULL: 'Tournament is full.',
  TOURNAMENT_STARTED: 'Tournament has already started.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTRATION_SUCCESS: 'Registration successful!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  TOURNAMENT_JOINED: 'Tournament joined successfully!',
  MONEY_ADDED: 'Money added to wallet successfully!',
  WITHDRAWAL_REQUESTED: 'Withdrawal request submitted successfully!',
};

export default {
  API_CONFIG,
  APP_CONFIG,
  FEATURES,
  GAMES,
  TOURNAMENT_CONFIG,
  WALLET_CONFIG,
  NOTIFICATION_CONFIG,
  STORAGE_KEYS,
  API_ENDPOINTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};