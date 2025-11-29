const config = {
  // API Configuration - Production API endpoint
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'https://api.gameonesports.xyz/api',
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || process.env.REACT_APP_WS_URL || 'wss://api.gameonesports.xyz',

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
