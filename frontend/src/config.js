const config = {
  // API Configuration
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
  WS_URL: process.env.REACT_APP_WS_URL || 'http://localhost:5000',

  // Razorpay Configuration
  RAZORPAY_KEY_ID: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_your_key_id',

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
