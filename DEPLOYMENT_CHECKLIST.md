# GameOn Platform - Production Deployment Checklist

Use this checklist to ensure all components are properly deployed and configured for production.

## 🔧 Pre-Deployment Setup

### Environment Configuration
- [ ] Backend `.env` file updated with production values
- [ ] Frontend `.env.production` file created
- [ ] Admin panel `.env.production` file created
- [ ] MongoDB Atlas connection string configured
- [ ] Cashfree production credentials obtained
- [ ] JWT secrets generated (32+ characters)

### Code Updates
- [ ] Razorpay integration replaced with Cashfree
- [ ] CORS origins updated for production domains
- [ ] API URLs updated to production endpoints
- [ ] Payment components updated to use Cashfree
- [ ] Transaction model updated for Cashfree fields

## 🚀 Backend Deployment (Render)

### Render Service Setup
- [ ] GitHub repository connected to Render
- [ ] Web service created with correct settings:
  - [ ] Environment: Node
  - [ ] Build Command: `npm install`
  - [ ] Start Command: `npm start`
  - [ ] Root Directory: `backend` (if using monorepo)

### Environment Variables in Render
- [ ] `NODE_ENV=production`
- [ ] `MONGODB_URI=[Your MongoDB Atlas URI]`
- [ ] `JWT_SECRET=[Generated secure string]`
- [ ] `JWT_REFRESH_SECRET=[Generated secure string]`
- [ ] `CASHFREE_APP_ID=[Production App ID]`
- [ ] `CASHFREE_SECRET_KEY=[Production Secret Key]`
- [ ] `CASHFREE_ENVIRONMENT=production`
- [ ] `CORS_ORIGIN=https://gameonesport.xyz,https://admin.gameonesport.xyz`

### Custom Domain Configuration
- [ ] Custom domain `api.gameonesport.xyz` added in Render
- [ ] CNAME record created in DNS: `api` → `[render-cname-target]`
- [ ] SSL certificate provisioned and active
- [ ] API health endpoint accessible: `https://api.gameonesport.xyz/api/health`

## 🌐 Frontend Deployment (Vercel)

### Vercel Project Setup
- [ ] GitHub repository connected to Vercel
- [ ] Project imported with correct settings:
  - [ ] Framework Preset: Create React App
  - [ ] Root Directory: `frontend` (if using monorepo)
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `build`

### Environment Variables in Vercel
- [ ] `REACT_APP_API_BASE_URL=https://api.gameonesport.xyz/api`
- [ ] `REACT_APP_WS_URL=wss://api.gameonesport.xyz`
- [ ] `REACT_APP_CASHFREE_APP_ID=[Production App ID]`
- [ ] `REACT_APP_CASHFREE_ENVIRONMENT=production`
- [ ] `REACT_APP_FRONTEND_URL=https://gameonesport.xyz`
- [ ] `REACT_APP_ADMIN_URL=https://admin.gameonesport.xyz`

### Custom Domain Configuration
- [ ] Custom domain `gameonesport.xyz` added in Vercel
- [ ] DNS records configured:
  - [ ] A record: `@` → `76.76.19.61`
  - [ ] CNAME record: `www` → `cname.vercel-dns.com`
- [ ] SSL certificate provisioned and active
- [ ] Frontend accessible: `https://gameonesport.xyz`

## 🔧 Admin Panel Deployment (Vercel)

### Vercel Project Setup
- [ ] Separate Vercel project created for admin panel
- [ ] GitHub repository connected
- [ ] Project imported with correct settings:
  - [ ] Framework Preset: Create React App
  - [ ] Root Directory: `admin-panel` (if using monorepo)
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `build`

### Environment Variables in Vercel
- [ ] `REACT_APP_API_URL=https://api.gameonesport.xyz/api`
- [ ] `REACT_APP_API_BASE_URL=https://api.gameonesport.xyz`
- [ ] `REACT_APP_FRONTEND_URL=https://gameonesport.xyz`
- [ ] `REACT_APP_ADMIN_URL=https://admin.gameonesport.xyz`

### Custom Domain Configuration
- [ ] Custom domain `admin.gameonesport.xyz` added in Vercel
- [ ] CNAME record created: `admin` → `cname.vercel-dns.com`
- [ ] SSL certificate provisioned and active
- [ ] Admin panel accessible: `https://admin.gameonesport.xyz`

## 💳 Payment Gateway Setup (Cashfree)

### Cashfree Dashboard Configuration
- [ ] Production account activated
- [ ] App ID and Secret Key obtained
- [ ] Webhook URL configured: `https://api.gameonesport.xyz/api/payments/webhook`
- [ ] Webhook events enabled:
  - [ ] Payment Success
  - [ ] Payment Failed
  - [ ] Payment Cancelled

### Payment Testing
- [ ] Test payment flow with small amount
- [ ] Verify webhook delivery
- [ ] Check transaction recording in database
- [ ] Test refund functionality (if implemented)

## 🌐 DNS Configuration

### Domain Registrar Settings
- [ ] A record: `@` → `76.76.19.61` (Vercel)
- [ ] CNAME record: `www` → `cname.vercel-dns.com`
- [ ] CNAME record: `admin` → `cname.vercel-dns.com`
- [ ] CNAME record: `api` → `[render-cname-target]`
- [ ] TTL set to 300 seconds for faster propagation

### DNS Propagation
- [ ] DNS propagation completed (check with `nslookup`)
- [ ] All domains resolve correctly
- [ ] SSL certificates active on all domains

## 🧪 Testing & Verification

### Backend API Testing
- [ ] Health endpoint: `GET https://api.gameonesport.xyz/api/health`
- [ ] Authentication endpoints working
- [ ] Tournament endpoints working
- [ ] Payment endpoints working
- [ ] WebSocket connections working

### Frontend Testing
- [ ] Homepage loads correctly
- [ ] User registration/login working
- [ ] Tournament listing working
- [ ] Payment flow working
- [ ] Real-time features working

### Admin Panel Testing
- [ ] Admin login working
- [ ] Dashboard accessible
- [ ] Tournament management working
- [ ] User management working
- [ ] Analytics working

### Cross-Platform Testing
- [ ] Desktop browsers (Chrome, Firefox, Safari, Edge)
- [ ] Mobile browsers (iOS Safari, Android Chrome)
- [ ] Different screen sizes and resolutions

## 🔒 Security Verification

### SSL/HTTPS
- [ ] All domains use HTTPS
- [ ] SSL certificates valid and trusted
- [ ] No mixed content warnings
- [ ] Security headers properly configured

### CORS Configuration
- [ ] CORS restricted to production domains only
- [ ] No wildcard origins in production
- [ ] Preflight requests handled correctly

### Environment Security
- [ ] No sensitive data in client-side code
- [ ] Environment variables properly secured
- [ ] Database access restricted
- [ ] API rate limiting configured

## 📊 Monitoring & Analytics

### Application Monitoring
- [ ] Render service monitoring enabled
- [ ] Vercel analytics enabled
- [ ] Error tracking configured (if using Sentry, etc.)
- [ ] Performance monitoring set up

### Database Monitoring
- [ ] MongoDB Atlas monitoring enabled
- [ ] Connection limits configured
- [ ] Backup strategy verified
- [ ] Performance alerts set up

## 🚨 Troubleshooting

### Common Issues Checklist
- [ ] DNS propagation completed (up to 48 hours)
- [ ] Environment variables correctly set
- [ ] Build processes successful
- [ ] CORS configuration correct
- [ ] Payment gateway credentials valid
- [ ] Database connections working

### Support Resources
- [ ] Render support documentation bookmarked
- [ ] Vercel support documentation bookmarked
- [ ] Cashfree support documentation bookmarked
- [ ] MongoDB Atlas support documentation bookmarked

## 📞 Emergency Contacts

### Platform Support
- [ ] Render support contact information saved
- [ ] Vercel support contact information saved
- [ ] Cashfree support contact information saved
- [ ] Domain registrar support contact saved

### Internal Team
- [ ] Development team contact information
- [ ] DevOps team contact information
- [ ] Business stakeholder contacts

---

## ✅ Final Verification

Once all items above are checked:

- [ ] **Frontend**: `https://gameonesport.xyz` fully functional
- [ ] **Admin Panel**: `https://admin.gameonesport.xyz` fully functional
- [ ] **Backend API**: `https://api.gameonesport.xyz` fully functional
- [ ] **Payment System**: Cashfree integration working
- [ ] **Real-time Features**: WebSocket connections working
- [ ] **Security**: All HTTPS, proper CORS, secure headers
- [ ] **Performance**: All services responding quickly
- [ ] **Monitoring**: All monitoring systems active

**🎉 GameOn Platform is now live in production!**

---

**Deployment Date**: ___________  
**Deployed By**: ___________  
**Version**: ___________  
**Notes**: ___________