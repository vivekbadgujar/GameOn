const PROD_API_BASE_URL = 'https://api.gameonesport.xyz/api';
const PROD_SOCKET_URL = 'https://api.gameonesport.xyz';

const normalizeUrl = (value, fallback) => {
  if (!value || typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  // Guard against misconfiguration like "/api" in production.
  if (trimmed.startsWith('/')) return fallback;
  // Guard against values without a scheme (e.g. "api.gameonesport.xyz")
  if (!trimmed.includes('://')) return fallback;
  // Socket.IO base URL should be http(s). Convert ws(s) to http(s) for Engine.IO polling compatibility.
  const normalizedScheme = trimmed
    .replace(/^wss:\/\//i, 'https://')
    .replace(/^ws:\/\//i, 'http://');
  return normalizedScheme.replace(/\/$/, '');
};

const config = {
  // API Configuration - Production API endpoint
  // Use NEXT_PUBLIC_* env vars for Next.js (automatically available in browser)
  // Ensure no trailing slash and correct path
  // Production fallback: https://api.gameonesport.xyz/api (NO localhost fallback)
  API_BASE_URL: normalizeUrl(process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL, PROD_API_BASE_URL),
  // Socket.IO should use an http(s) URL (Engine.IO polling uses HTTP), not wss://
  WS_URL: normalizeUrl(process.env.NEXT_PUBLIC_WS_URL, PROD_SOCKET_URL),
  
  // Frontend and Admin URLs for production
  FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://gameonesport.xyz',
  ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.gameonesport.xyz',

  // Cashfree Configuration
  CASHFREE_APP_ID: process.env.NEXT_PUBLIC_CASHFREE_APP_ID || process.env.REACT_APP_CASHFREE_APP_ID || 'your_cashfree_app_id_here',
  CASHFREE_ENVIRONMENT: process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT || process.env.REACT_APP_CASHFREE_ENVIRONMENT || 'production',

  // App Configuration
  APP_NAME: 'GameOn',
  APP_VERSION: '1.0.0',
  APP_LOGO: '/logo.png',

  // Theme Configuration
  THEME: {
    colors: {
      primary: '#8b5cf6',
      secondary: '#2563eb',
      accent: '#7c3aed',
      background: '#0f172a',
      text: '#f3f4f6',
    },
    fonts: {
      heading: 'Orbitron',
      body: 'Rajdhani',
      mono: 'Inter',
    },
  },

  // API Endpoints
  ENDPOINTS: {
    // Auth
    AUTH: {
      SEND_OTP: '/auth/send-otp',
      VERIFY_OTP: '/auth/verify-otp',
      LOGIN: '/auth/login',
      SIGNUP: '/auth/signup',
      ADMIN_LOGIN: '/admin/auth/login',
    },
    // User
    USER: {
      PROFILE: '/users/profile',
      UPDATE_PROFILE: '/users/profile',
      LEADERBOARD: '/users/leaderboard',
    },
    // Tournament
    TOURNAMENT: {
      LIST: '/tournaments',
      DETAILS: (id) => `/tournaments/${id}`,
      JOIN: (id) => `/tournaments/${id}/join`,
      SUBMIT_SCREENSHOT: (id) => `/tournaments/${id}/screenshot`,
    },
    // Wallet
    WALLET: {
      BALANCE: '/users/wallet',
      TRANSACTIONS: '/users/wallet/transactions',
      CREATE_ORDER: '/payments/create-order',
    },
    // YouTube
    YOUTUBE: {
      VIDEOS: '/youtube/videos',
    },
  },

  // Socket Events
  SOCKET_EVENTS: {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    JOIN_TOURNAMENT: 'join_tournament',
    LEAVE_TOURNAMENT: 'leave_tournament',
    TOURNAMENT_UPDATE: 'tournament_update',
    TOURNAMENT_MESSAGE: 'tournament_message',
    MATCH_UPDATE: 'match_update',
  },

  // Local Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'auth_token',
    USER_DATA: 'user_data',
    THEME: 'theme',
  },
};

export default config;
