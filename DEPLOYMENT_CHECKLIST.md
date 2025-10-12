# GameOn Vercel Deployment Checklist

## ✅ Pre-Deployment Checklist

### Frontend Setup
- [x] Frontend builds successfully without errors
- [x] `vercel.json` configuration file created
- [x] `.env.production` file with production environment variables
- [x] `.vercelignore` file to exclude unnecessary files
- [x] Updated root `package.json` with deployment scripts

### Environment Configuration
- [ ] Update `REACT_APP_API_BASE_URL` with actual backend URL
- [ ] Update `REACT_APP_WS_URL` with actual WebSocket URL  
- [ ] Set production Razorpay key in `REACT_APP_RAZORPAY_KEY_ID`
- [ ] Verify all environment variables are properly set

### Backend Preparation (Deploy Separately)
- [ ] Deploy backend to Vercel/Railway/Render
- [ ] Set up production MongoDB database
- [ ] Configure production environment variables for backend
- [ ] Update CORS settings to allow frontend domain

## 🚀 Deployment Steps

### 1. Initial Deployment
```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Navigate to project root
cd /Users/naishailesh/GameOn

# Deploy to Vercel
vercel
```

### 2. Configure Environment Variables in Vercel Dashboard
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add all variables from `.env.production`
4. Make sure to set them for "Production" environment

### 3. Update Environment Variables
After backend deployment, update these in Vercel dashboard:
- `REACT_APP_API_BASE_URL`
- `REACT_APP_WS_URL`

### 4. Redeploy with Updated Variables
```bash
vercel --prod
```

## 🧪 Post-Deployment Testing

### Functionality Tests
- [ ] Frontend loads without errors
- [ ] User registration/login works
- [ ] API calls to backend succeed
- [ ] WebSocket connection established
- [ ] Payment integration functions
- [ ] Image/media uploads work
- [ ] Tournament features operational

### Performance Tests
- [ ] Page load times < 3 seconds
- [ ] Images optimized and loading properly
- [ ] No console errors in browser
- [ ] Mobile responsiveness working

### Security Tests
- [ ] HTTPS enabled
- [ ] API endpoints secured
- [ ] Authentication working properly
- [ ] No sensitive data exposed in client

## 📋 Environment Variables Reference

### Frontend (.env.production)
```
REACT_APP_API_BASE_URL=https://your-backend-domain.vercel.app/api
REACT_APP_WS_URL=wss://your-backend-domain.vercel.app
REACT_APP_APP_NAME=GameOn
REACT_APP_APP_VERSION=1.0.0
REACT_APP_LOGO_URL=/logo.png
REACT_APP_RAZORPAY_KEY_ID=rzp_live_your_production_key
```

### Backend (Deploy Separately)
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://your-cloud-db-url
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
ADMIN_EMAIL=your-admin-email
ADMIN_PASSWORD=your-admin-password
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

## 🔧 Common Issues & Solutions

### Build Fails
- Check for unused imports (warnings are OK)
- Verify all dependencies are in package.json
- Ensure Node.js version compatibility

### API Connection Issues  
- Verify backend URL is correct
- Check CORS configuration
- Ensure backend is deployed and accessible

### WebSocket Issues
- Use `wss://` for production WebSocket URLs
- Verify WebSocket server is running
- Check for connection timeouts

### Environment Variables Not Working
- Ensure variables start with `REACT_APP_`
- Verify they're set in Vercel dashboard
- Clear browser cache and redeploy

## 📞 Next Steps After Deployment

1. **Set up monitoring**: Configure error tracking (Sentry, LogRocket)
2. **Performance optimization**: Implement caching strategies
3. **Analytics**: Set up usage tracking
4. **Backup strategy**: Regular database backups
5. **CI/CD**: Set up automated deployments

## 🎯 Success Criteria

Your deployment is successful when:
- ✅ Frontend loads at your Vercel URL
- ✅ Users can register and login
- ✅ All major features work as expected
- ✅ No critical errors in console
- ✅ Mobile experience is functional
- ✅ Payment system is operational

---

**Deployment Date**: ___________  
**Frontend URL**: ___________  
**Backend URL**: ___________  
**Status**: ⏳ In Progress / ✅ Complete