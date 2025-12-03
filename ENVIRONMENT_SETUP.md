# 🔧 Environment Variables Setup Guide

## 📋 Overview

This guide explains how to set up environment variables for each part of your GameOn Platform deployment.

---

## 🌐 Frontend Environment Variables

### Local Development (.env)
```env
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_WS_URL=ws://localhost:5000
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
NEXT_PUBLIC_WS_URL=ws://localhost:5000

# App Configuration
REACT_APP_APP_NAME=GameOn
REACT_APP_APP_VERSION=1.0.0
REACT_APP_LOGO_URL=http://localhost:3000/logo.png
NEXT_PUBLIC_APP_NAME=GameOn
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_LOGO_URL=http://localhost:3000/logo.png
```

### Production (.env.production)
```env
# API Configuration
REACT_APP_API_BASE_URL=https://api.gameonesport.xyz/api
REACT_APP_WS_URL=wss://api.gameonesport.xyz
NEXT_PUBLIC_API_BASE_URL=https://api.gameonesport.xyz/api
NEXT_PUBLIC_WS_URL=wss://api.gameonesport.xyz

# App Configuration
REACT_APP_APP_NAME=GameOn
REACT_APP_APP_VERSION=1.0.0
REACT_APP_LOGO_URL=/logo.png
NEXT_PUBLIC_APP_NAME=GameOn
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_LOGO_URL=/logo.png

# Environment
REACT_APP_ENV=production
```

### Vercel Dashboard Settings
Go to your Vercel project → Settings → Environment Variables and add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `REACT_APP_API_BASE_URL` | `https://api.gameonesport.xyz/api` | Production |
| `REACT_APP_WS_URL` | `wss://api.gameonesport.xyz` | Production |
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.gameonesport.xyz/api` | Production |
| `NEXT_PUBLIC_WS_URL` | `wss://api.gameonesport.xyz` | Production |
| `REACT_APP_APP_NAME` | `GameOn` | All |
| `REACT_APP_APP_VERSION` | `1.0.0` | All |
| `REACT_APP_LOGO_URL` | `/logo.png` | Production |
| `NEXT_PUBLIC_APP_NAME` | `GameOn` | All |
| `NEXT_PUBLIC_APP_VERSION` | `1.0.0` | All |
| `NEXT_PUBLIC_LOGO_URL` | `/logo.png` | Production |
| `REACT_APP_ENV` | `production` | Production |

---

## 🔐 Admin Panel Environment Variables

### Local Development (.env)
```env
PORT=3001
REACT_APP_API_URL=http://localhost:5000/api
MONGO_URI=mongodb://localhost:27017/
```

### Production (.env.production)
```env
# API Configuration
REACT_APP_API_URL=https://api.gameonesport.xyz/api
REACT_APP_WS_URL=wss://api.gameonesport.xyz
NEXT_PUBLIC_API_URL=https://api.gameonesport.xyz/api
NEXT_PUBLIC_API_BASE_URL=https://api.gameonesport.xyz

# Admin Panel Configuration
REACT_APP_APP_NAME=GameOn Admin
REACT_APP_APP_VERSION=1.0.0
REACT_APP_LOGO_URL=/logo.png
NEXT_PUBLIC_APP_NAME=GameOn Admin
NEXT_PUBLIC_APP_VERSION=1.0.0

# Environment
REACT_APP_ENV=production

# Security
REACT_APP_ADMIN_PANEL=true
```

### Vercel Dashboard Settings
Go to your admin panel Vercel project → Settings → Environment Variables and add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `REACT_APP_API_URL` | `https://api.gameonesport.xyz/api` | Production |
| `REACT_APP_WS_URL` | `wss://api.gameonesport.xyz` | Production |
| `NEXT_PUBLIC_API_URL` | `https://api.gameonesport.xyz/api` | Production |
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.gameonesport.xyz` | Production |
| `REACT_APP_APP_NAME` | `GameOn Admin` | All |
| `REACT_APP_APP_VERSION` | `1.0.0` | All |
| `REACT_APP_LOGO_URL` | `/logo.png` | Production |
| `REACT_APP_ENV` | `production` | Production |
| `REACT_APP_ADMIN_PANEL` | `true` | All |

---

## 🖥️ Backend Environment Variables (Render)

Your backend is already deployed on Render. Ensure these variables are set:

### Production (Render Dashboard)
```env
# Server Configuration
NODE_ENV=production
PORT=5000
BASE_URL=https://api.gameonesport.xyz

# Database
MONGODB_URI=your_mongodb_connection_string

# JWT Secret
JWT_SECRET=your_secure_jwt_secret

# Security
CORS_ORIGIN=https://your-frontend-domain.vercel.app,https://your-admin-domain.vercel.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Important**: Update `CORS_ORIGIN` with your actual Vercel deployment URLs after deployment.

---

## 📱 Mobile App Environment Variables

### Development
The mobile app automatically detects development mode and uses localhost.

### Production
The mobile app automatically uses the production API when built for release.

### Configuration File: `mobile/src/config/index.js`
```javascript
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://10.217.86.8:5000' 
    : 'https://gameon-backend.onrender.com',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};
```

---

## 🔧 Setting Environment Variables in Vercel

### Method 1: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable with appropriate environment (Production, Preview, Development)

### Method 2: Vercel CLI
```bash
# Set production environment variable
vercel env add REACT_APP_API_BASE_URL production

# Set for all environments
vercel env add REACT_APP_APP_NAME
```

### Method 3: vercel.json (Already configured)
Environment variables are pre-configured in the `vercel.json` files.

---

## 🔄 Environment Variable Priority

Vercel uses this priority order:
1. Environment Variables set in Vercel Dashboard (highest priority)
2. Environment Variables in `vercel.json`
3. Local `.env` files (lowest priority)

---

## 🚨 Security Best Practices

### ✅ Do:
- Use `REACT_APP_` prefix for React environment variables
- Set sensitive variables only in Vercel Dashboard
- Use different values for development and production
- Regularly rotate JWT secrets

### ❌ Don't:
- Commit `.env` files with sensitive data
- Use the same JWT secret for development and production
- Expose database credentials in frontend variables
- Use weak or predictable secrets

---

## 🧪 Testing Environment Variables

### Frontend Testing:
```javascript
// In your React component
console.log('API URL:', process.env.REACT_APP_API_BASE_URL);
console.log('Environment:', process.env.REACT_APP_ENV);
```

### Build-time Testing:
```bash
# Check if variables are available during build
npm run build

# Look for environment variables in build output
```

---

## 🔧 Troubleshooting

### Variables Not Working:
1. **Check Spelling**: Ensure exact variable names
2. **Redeploy**: Redeploy after adding variables
3. **Prefix**: React variables must start with `REACT_APP_`
4. **Environment**: Ensure variables are set for correct environment

### API Connection Issues:
1. **CORS**: Verify backend CORS allows your domain
2. **URLs**: Check API URLs are correct and accessible
3. **HTTPS**: Ensure production uses HTTPS URLs
4. **Network**: Test API endpoints directly

### Common Fixes:
```bash
# Clear Vercel cache and redeploy
vercel --prod --force

# Check environment variables
vercel env ls

# Remove and re-add problematic variables
vercel env rm VARIABLE_NAME
vercel env add VARIABLE_NAME
```

---

## 📋 Environment Checklist

### Before Deployment:
- [ ] All required variables are defined
- [ ] Production URLs are correct
- [ ] JWT secrets are secure
- [ ] CORS origins include Vercel domains
- [ ] Database connections are configured

### After Deployment:
- [ ] Frontend connects to backend API
- [ ] Admin panel authentication works
- [ ] WebSocket connections are successful
- [ ] Mobile app uses production API
- [ ] All features work as expected

---

## 🎯 Quick Reference

### Frontend Variables:
- `REACT_APP_API_BASE_URL` - Backend API URL
- `REACT_APP_WS_URL` - WebSocket URL
- `REACT_APP_APP_NAME` - App display name

### Admin Panel Variables:
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_ADMIN_PANEL` - Admin panel flag

### Backend Variables:
- `NODE_ENV` - Environment mode
- `MONGODB_URI` - Database connection
- `JWT_SECRET` - Authentication secret
- `CORS_ORIGIN` - Allowed origins

Your environment is now properly configured for production deployment! 🚀