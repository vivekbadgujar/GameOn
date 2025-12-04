/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  productionBrowserSourceMaps: false,
  
  images: {
    unoptimized: true,
    domains: ['gameonesport.xyz', 'api.gameonesport.xyz'],
  },
  
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.gameonesport.xyz/api',
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.gameonesport.xyz',
    NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://gameonesport.xyz',
    NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.gameonesport.xyz',
  },
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        path: false,
      };
    }
    return config;
  },
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    styledComponents: false,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600, must-revalidate',
        },
      ],
    },
  ],
  
  redirects: async () => [
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
  ],
  
  poweredByHeader: false,
  generateEtags: true,
  compress: true,
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
};

module.exports = nextConfig;