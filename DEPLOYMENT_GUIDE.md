# GameOn Platform - Vercel Deployment Guide

## 📦 Project Structure

This is a full-stack gaming platform with:
- **Frontend**: React application in `/frontend` folder
- **Backend**: Node.js/Express API in `/backend` folder
- **Admin Panel**: React admin dashboard in `/admin-panel` folder

## 🚀 Frontend Deployment to Vercel

### Prerequisites
1. [Vercel CLI](https://vercel.com/cli) installed
2. Vercel account
3. Git repository

### Step 1: Deploy Frontend
```bash
# Navigate to project root
cd GameOn

# Deploy to Vercel
vercel
```

### Step 2: Environment Variables
After deployment, set up environment variables in Vercel dashboard:

1. Go to your project in Vercel Dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:

#### Production Variables:
```
REACT_APP_API_BASE_URL=https://your-backend-domain.vercel.app/api
REACT_APP_WS_URL=wss://your-backend-domain.vercel.app
REACT_APP_APP_NAME=GameOn
REACT_APP_APP_VERSION=1.0.0
REACT_APP_LOGO_URL=/logo.png
REACT_APP_RAZORPAY_KEY_ID=rzp_live_your_production_key
```

### Step 3: Backend Deployment (Separate Project)

The backend needs to be deployed separately as a serverless function or on a platform like Railway, Render, or another Vercel project:

```bash
# Create separate Vercel project for backend
cd backend
vercel
```

**Backend Environment Variables:**
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://your-cloud-db-url
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
ADMIN_EMAIL=your-admin-email
ADMIN_PASSWORD=your-admin-password
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

### Step 4: Update Frontend Environment
Once backend is deployed, update the frontend environment variables with the actual backend URL.

## 📁 File Changes Made for Deployment

### 1. vercel.json
```json
{
  "version": 2,
  "buildCommand": "cd frontend && npm ci && npm run build",
  "outputDirectory": "frontend/build",
  "installCommand": "npm install --prefix frontend",
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 2. .env.production (Frontend)
Created production environment configuration with placeholder values.

### 3. Updated package.json
Added deployment scripts and proper project metadata.

## 🔧 Build Commands

- **Install**: `npm install --prefix frontend`
- **Build**: `cd frontend && npm run build`
- **Output Directory**: `frontend/build`

## 🌐 Domain Configuration

1. Frontend: `https://your-frontend-domain.vercel.app`
2. Backend: `https://your-backend-domain.vercel.app` 
3. Admin Panel: Deploy separately if needed

## 🔒 Security Checklist

- [ ] Update JWT secrets for production
- [ ] Set up production MongoDB Atlas database
- [ ] Configure production Razorpay keys
- [ ] Set proper CORS origins
- [ ] Enable environment variable encryption in Vercel

## 🚨 Important Notes

1. **Backend Deployment**: The backend requires a separate deployment due to MongoDB and persistent connections.
2. **Environment Variables**: Replace all placeholder values with actual production values.
3. **Database**: Set up MongoDB Atlas or another cloud database for production.
4. **Payment Gateway**: Update Razorpay keys for production transactions.
5. **WebSocket**: Ensure WebSocket URLs are properly configured for real-time features.

## 📞 Support

If you encounter issues during deployment, check:
1. Build logs in Vercel dashboard
2. Environment variable configuration
3. Network requests in browser dev tools
4. Backend API connectivity

---

**Next Steps**: After successful deployment, test all features including authentication, tournaments, payments, and real-time updates.