/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Optimize images
  images: {
    domains: [
      'gameonesport.xyz',
      'admin.gameonesport.xyz',
      'api.gameonesport.xyz',
      'res.cloudinary.com', // If using Cloudinary for images
      'images.unsplash.com', // If using Unsplash images
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Environment variables that should be available on the client side
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Base path for admin panel (optional, if you want to serve from /admin)
  // basePath: '/admin',

  // Webpack configuration for better performance
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle size
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    };

    return config;
  },

  // Experimental features for better performance
  experimental: {
    // Enable modern JavaScript features
    esmExternals: true,
    // Optimize CSS
    optimizeCss: true,
  },

  // Compiler options
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
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
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow', // Prevent admin panel from being indexed
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects for admin panel
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/',
        permanent: false,
      },
      {
        source: '/admin',
        destination: '/',
        permanent: false,
      },
    ];
  },

  // Rewrites for API calls
  async rewrites() {
    return [
      // API rewrites to backend
      {
        source: '/api/:path*',
        destination: 'https://api.gameonesport.xyz/api/:path*',
      },
      // WebSocket proxy for development (production uses direct connection)
      ...(process.env.NODE_ENV === 'development' ? [
        {
          source: '/socket.io/:path*',
          destination: 'https://api.gameonesport.xyz/socket.io/:path*',
        },
      ] : []),
    ];
  },

  // Clean URLs
  trailingSlash: false,

  // Output configuration for static export if needed
  output: 'standalone',

  // PoweredByHeader
  poweredByHeader: false,

  // Compression
  compress: true,

  // Generate ETags for better caching
  generateEtags: true,
};

module.exports = nextConfig;