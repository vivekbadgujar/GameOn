/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,
  
  // Disable server-side features to avoid serverless functions on free plan
  output: 'export',
  trailingSlash: true,
  
  // Image optimization disabled for static export
  images: {
    unoptimized: true,
  },

  // Disable API routes to prevent serverless functions
  experimental: {
    appDir: false, // Use pages directory instead of app directory
  },

  // Environment variables for client-side
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.gameonesport.xyz/api',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'wss://api.gameonesport.xyz',
    NEXT_PUBLIC_CASHFREE_APP_ID: process.env.NEXT_PUBLIC_CASHFREE_APP_ID,
    NEXT_PUBLIC_CASHFREE_ENVIRONMENT: process.env.NEXT_PUBLIC_CASHFREE_ENVIRONMENT || 'production',
    NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://gameonesport.xyz',
    NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.gameonesport.xyz',
  },

  // Webpack configuration for client-side only
  webpack: (config, { isServer }) => {
    // Ensure we're only building for client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  // Disable server-side rendering features
  experimental: {
    esmExternals: false,
  },

  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Static export configuration
  exportPathMap: async function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    return {
      '/': { page: '/' },
      '/login': { page: '/login' },
      '/register': { page: '/register' },
      '/tournaments': { page: '/tournaments' },
      '/profile': { page: '/profile' },
      '/leaderboard': { page: '/leaderboard' },
      '/terms': { page: '/terms' },
      '/privacy': { page: '/privacy' },
      '/refund': { page: '/refund' },
      '/fairplay': { page: '/fairplay' },
    };
  },

  // Disable features that require server-side rendering
  poweredByHeader: false,
  generateEtags: false,
  compress: false, // Let Vercel handle compression
};

module.exports = nextConfig;