# 🚀 GameOn Platform - Deployment Guide

This guide will help you deploy the GameOn BGMI tournament platform to production.

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB database (Atlas free tier)
- Razorpay account for payments
- Firebase (free tier) for authentication and storage
- Render.com (free tier) for backend hosting
- Vercel (free tier) for frontend hosting
- Domain name (optional)

## 🛠️ Environment Setup

### 1. Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
NODE_ENV=production
PORT=5000
BASE_URL=https://your-domain.com

# Database
MONGODB_URI=mongodb+srv://gameon:Gameon321@cluster0.g2bfczw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# JWT Secret
JWT_SECRET=123456

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Firebase Configuration (for OTP and Storage)
FIREBASE_PROJECT_ID=game-on-9234b
FIREBASE_PRIVATE_KEY_ID=c733bcdda3d7df5e6bc2f426c303f4117834c9b2
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC0iUVHPXJPjC4R\nYwtnLuyCpROQ16cF9clOE3/J627giGwyN+qfumhaaW9KJuAimIrwH+ReNg5U5Vh/\nXus65qKRJWd+2w73NPppGXvVV05X+jV0sBxh07EFgsNEv54xkJELrvWWat6SQ8R8\nOXJHjloQ+lVAR7B04wPH5CxpPxRAlshPOoKamjdoDzy0ap4hNmTvIcWINzc30TqU\nfIFXPZHOT4s3d/JG242NNmmcxbxhYL6EZB072G6dcWe5CvBbU+iUK3IFq5NtLlL3\nlniIZckOGPZufJW8KDLeeoQzc4sKof04O0q64m4uxANnpMp4YvwYiSReIDnhw7U6\niixGy7pHAgMBAAECggEADhwUYAb7YiAwkYdOIthV/7frGYzhLuQQwZtgh2VxGvdO\njXY1ThqBgV9wJTl4lvuZED9N19cds6DhE8NVWxsfZXyo5A820jc/wusM9JWIN/QE\nLYR+E186HJYlsL/RG0qTK3iXFRRxJLlLJ/JNbi4/98e41fdEYT5E02CP4AHgEVQV\n5GIJdH4JV/hYCGm1XmyZP1vAFUpL4FSkX8yUkxFq636l6SlrB393SrBR98rs8k13\nEnpoXIECHDlRMa+JeHYRuy28kAGKE9YktUCHAmc9TOFcF5FvyBXsxEmeWhoCK5w5\n+mAy3C3F/EECQR4BBiitoDy/ijhB3j/5rtbfa0XJAQKBgQDZohI24yzRqg/LlCCE\nYoGJJgmVo/MR6GPDCzUPNtbrlQgnjc8JGcVyKumasW/HMy0bk1miXAFhETqLtI3Z\ntXI0h2wpGprXhiNzthiYnLSmTyiNLBr7ITANKZl/H8cEtBVg1uGUcikulfNxbNSm\nnhlZZcE6Q/9E2Ax+DmlK5ORwwQKBgQDUXP4FN7PgyzVSGbR4TScHxT7/9VcuE1M9\n78qTbl7z8qDIu5Ybz3+Gu/wByzQiTStFYYXjya4jYKjxqLAcWIjtqjZZ7Kje0fCO\nHiTL4ciKmWu24fFHwvfnnsSy7EVzkIG8VnIkBbfXPIBGs+2FgaMcgUgTVmpS+dRo\nT/yU57DlBwKBgQCD5BGPy+ssgRijcnimYiBIopGqazpyvtg+qrsUJlLnYGEZv3oZ\n9NFQ2CrMQf4QxbXvgUQP/hwj3FITum9A4hJ9PRjSbDospTE0/cU4L7fXFh/oNjN/\nv+QkBfLtNK/i7NQL5Q2+bdUBU4S+V4skEqogIGeSzQSVjy0687bh2YeLwQKBgQC4\nWbG6XcytTDqRdvcPqApF2JkEIbr4qJYOomc87QdIxkuFdjKtGcge8nmmJPyw+kSi\nCjLst1uQIo0Gm+Wl9cWIa8aa8bL3G1C0Tr6qruokR2MWc7W9Eieazlz65di0pbG6\nCWE0nDInisHgnrmGuC8cw64J+255cZ9OnoEp0qfhaQKBgAM8n/P3EYrqGsmY49jh\nubIi17bktLQ8qCb42D7xoDgy6ASdj0lxPrTB7xD6wxKELTVqRdDHyS7TyC+Y1TN2\nnKxu1455pWkEqABoCtDVAtnxcUToUr+m7xRjOKsPRcNVyGUCFn/BHzhsRQCT27md\nka+ZPzGo6YUcOn4At6ljGCsK\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@game-on-9234b.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-116914143194734299488
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40game-on-9234b.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=game-on-9234b.appspot.com

# Security
CORS_ORIGIN=https://your-frontend-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```env
# API Configuration
REACT_APP_API_BASE_URL=https://your-backend-domain.com/api
REACT_APP_WS_URL=wss://your-backend-domain.com

# Razorpay
REACT_APP_RAZORPAY_KEY_ID=rzp_test_your_key_id

# Firebase Config
REACT_APP_FIREBASE_API_KEY=AIzaSyAafbChDBUSgu_CEwPXnrUsegOScgH1D5I
REACT_APP_FIREBASE_AUTH_DOMAIN=game-on-9234b.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=game-on-9234b
REACT_APP_FIREBASE_STORAGE_BUCKET=game-on-9234b.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=496424773632
REACT_APP_FIREBASE_APP_ID=1:496424773632:web:a222be347f0fb636fbd0e5

# App Configuration
REACT_APP_APP_NAME=GameOn
REACT_APP_APP_VERSION=1.0.0
REACT_APP_LOGO_URL=https://your-domain.com/logo.png
```

## 🗄️ Database Setup

### MongoDB Atlas Free Tier Setup

1. Create a MongoDB Atlas account
2. Create a new M0 (free) cluster
3. Create a database user with read/write permissions
4. Get your connection string
5. Add your IP to the whitelist
6. Enable connection from anywhere (0.0.0.0/0) for production

### Database Collections

The following collections will be created automatically:
- `users` - User profiles and gaming data
- `tournaments` - Tournament information
- `participants` - Tournament participation records
- `transactions` - Payment and wallet transactions
- `screenshots` - Match result screenshots
- `notifications` - User notifications
- `adminusers` - Admin accounts
- `aiflags` - AI verification flags

## 💳 Payment Setup (Razorpay)

### 1. Razorpay Account Setup

1. Create a Razorpay account
2. Complete KYC verification
3. Get your API keys from the dashboard
4. Set up webhook endpoints

### 2. Webhook Configuration

Add these webhook endpoints in Razorpay dashboard:
```
https://your-backend-domain.com/api/payments/webhook
```

Events to listen for:
- `payment.captured`
- `payment.failed`
- `refund.processed`

## 🔥 Firebase Setup (Free Tier)

### 1. Firebase Project Setup

1. Create a Firebase project
2. Enable Authentication with Phone provider
3. Create a service account and download JSON
4. Enable Cloud Storage for screenshots
5. Set up Firebase Storage rules for security

### 2. Storage Rules

```javascript
// Storage rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /screenshots/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.resource.size < 5 * 1024 * 1024;
    }
  }
}
```

## 🚀 Deployment Steps

### 1. Backend Deployment (Render.com Free Tier)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure build settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Set environment variables in Render dashboard
5. Enable auto-deploy on push to main

### 2. Frontend Deployment (Vercel)

1. Connect your GitHub repository to Vercel
2. Set build settings:
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`
3. Set environment variables in Vercel dashboard
4. Deploy

### 3. Domain Configuration

1. Add custom domain in Vercel
2. Update CORS settings in backend
3. Update environment variables with new domain

## 🔧 Production Optimizations

### 1. Performance

- Enable gzip compression
- Use Firebase Storage for static assets
- Implement browser caching
- Optimize database queries with proper indexing
- Use connection pooling for MongoDB

### 2. Security

- Enable HTTPS everywhere
- Set up rate limiting
- Implement input validation
- Use secure headers
- Regular security audits
- Keep dependencies updated

### 3. Monitoring (Free Options)

- Use Render.com's built-in logs
- MongoDB Atlas monitoring
- Firebase Analytics
- Basic uptime monitoring with UptimeRobot (free tier)

## 📈 Cost Optimization

### 1. MongoDB Atlas (Free Tier)
- 512MB storage
- Shared RAM
- Basic monitoring
- Automatic backups

### 2. Firebase (Free Tier)
- 50K phone authentications/month
- 5GB Cloud Storage
- 1GB/day data transfer
- Real-time listeners

### 3. Render.com (Free Tier)
- 750 hours/month runtime
- Automatic HTTPS
- Basic DDoS protection
- Auto-deploy from Git

### 4. Vercel (Free Tier)
- Unlimited personal projects
- Automatic HTTPS
- Global CDN
- Continuous deployment

## 🔄 CI/CD Pipeline

### GitHub Actions (Free for Public Repos)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        env:
          RENDER_TOKEN: ${{ secrets.RENDER_TOKEN }}
          SERVICE_ID: ${{ secrets.RENDER_SERVICE_ID }}
        run: |
          curl -X POST "https://api.render.com/v1/services/$SERVICE_ID/deploys" \
          -H "Authorization: Bearer $RENDER_TOKEN"

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection**: Check network access and IP whitelist
2. **Firebase Auth**: Verify phone number format and region settings
3. **Storage Issues**: Check Firebase Storage rules and quota
4. **Payment Failures**: Verify Razorpay test mode settings

### Support Resources

1. MongoDB Atlas: https://docs.atlas.mongodb.com/
2. Firebase: https://firebase.google.com/support
3. Render: https://render.com/docs
4. Vercel: https://vercel.com/docs

## 📈 Scaling Tips

1. **Database**:
   - Use proper indexes
   - Implement caching
   - Regular cleanup of old data

2. **Storage**:
   - Compress images before upload
   - Set up file retention policies
   - Use Firebase Storage efficiently

3. **API**:
   - Implement rate limiting
   - Use compression
   - Cache static responses

4. **Monitoring**:
   - Set up alerts for quota limits
   - Monitor API response times
   - Track error rates

Remember to monitor your usage and upgrade plans only when necessary based on actual needs and growth. 