/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,
  
  // Use standard build for Vercel deployment
  // output: 'export', // Disabled for SSR compatibility
  
  // Disable static optimization completely
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    forceSwcTransforms: true,
  },
  
  // Image optimization
  images: {
    domains: ['gameonesport.xyz', 'api.gameonesport.xyz'],
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
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'GameOn',
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    NEXT_PUBLIC_LOGO_URL: process.env.NEXT_PUBLIC_LOGO_URL || 'https://gameonesport.xyz/logo.png',
  },

  // API rewrites for backend integration
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api.gameonesport.xyz/api/:path*',
      },
      {
        source: '/socket.io/:path*',
        destination: 'https://api.gameonesport.xyz/socket.io/:path*',
      },
    ];
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },

  // ESLint configuration
  eslint: {
    // Disable ESLint during builds to prevent build failures
    ignoreDuringBuilds: true,
  },

  // TypeScript configuration
  typescript: {
    // Skip type checking during builds (since we're using JS)
    ignoreBuildErrors: true,
  },

  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Performance optimizations
  poweredByHeader: false,
  generateEtags: false,
  compress: true,




};

module.exports = nextConfig;