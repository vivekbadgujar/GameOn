/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,
  
  // Static export for Vercel deployment
  output: 'export',
  trailingSlash: true,
  
  // Image optimization disabled for static export
  images: {
    unoptimized: true,
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

  // Webpack configuration
  webpack: (config, { isServer }) => {
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

  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Disable features that require server-side rendering
  poweredByHeader: false,
  generateEtags: false,
};

module.exports = nextConfig;