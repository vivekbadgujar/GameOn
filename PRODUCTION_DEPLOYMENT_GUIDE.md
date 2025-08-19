# GameOn Platform - Production Deployment Guide

This guide covers the complete deployment of GameOn Platform with custom domains and Cashfree payment integration.

## 🏗️ Architecture Overview

- **Backend**: Node.js/Express + MongoDB Atlas + Socket.IO → Render → `api.gameonesport.xyz`
- **Frontend**: React → Vercel → `gameonesport.xyz`
- **Admin Panel**: React → Vercel → `admin.gameonesport.xyz`
- **Payment Gateway**: Cashfree Payments (Production)

## 📋 Prerequisites

1. **Domain**: `gameonesport.xyz` (purchased and accessible)
2. **Accounts**:
   - Render account (for backend)
   - Vercel account (for frontend & admin)
   - MongoDB Atlas account
   - Cashfree merchant account
3. **Credentials**:
   - MongoDB Atlas connection string
   - Cashfree App ID and Secret Key
   - JWT secrets

## 🚀 Step 1: Backend Deployment on Render

### 1.1 Prepare Backend for Production

1. **Install Cashfree dependency**:
   ```bash
   cd backend
   npm install cashfree-pg@^4.3.0
   ```

2. **Environment Variables** (already configured in `.env`):
   ```env
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://vivekbadgujar:Vivek321@cluster0.squjxrk.mongodb.net/gameon?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters-change-this
   JWT_REFRESH_SECRET=your-refresh-token-secret-key-different-from-jwt-secret
   CORS_ORIGIN=https://gameonesport.xyz,https://admin.gameonesport.xyz
   CASHFREE_APP_ID=your_production_cashfree_app_id_here
   CASHFREE_SECRET_KEY=your_production_cashfree_secret_key_here
   CASHFREE_ENVIRONMENT=production
   ```

### 1.2 Deploy to Render

1. **Connect Repository**:
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the `backend` folder as root directory

2. **Configure Service**:
   - **Name**: `gameon-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Choose appropriate plan (Starter for testing)

3. **Set Environment Variables** in Render Dashboard:
   ```
   NODE_ENV=production
   MONGODB_URI=[Your MongoDB Atlas URI]
   JWT_SECRET=[Generate a secure 32+ character string]
   JWT_REFRESH_SECRET=[Generate another secure string]
   CASHFREE_APP_ID=[Your Cashfree App ID]
   CASHFREE_SECRET_KEY=[Your Cashfree Secret Key]
   CASHFREE_ENVIRONMENT=production
   CORS_ORIGIN=https://gameonesport.xyz,https://admin.gameonesport.xyz
   ```

4. **Deploy**: Click "Create Web Service"

### 1.3 Configure Custom Domain

1. **In Render Dashboard**:
   - Go to your service → Settings → Custom Domains
   - Add custom domain: `api.gameonesport.xyz`
   - Note the CNAME target provided by Render

2. **DNS Configuration** (in your domain registrar):
   ```
   Type: CNAME
   Name: api
   Value: [Render CNAME target]
   TTL: 300
   ```

## 🌐 Step 2: Frontend Deployment on Vercel

### 2.1 Prepare Frontend

1. **Update Cashfree credentials** in production environment:
   ```bash
   # Edit frontend/.env.production
   REACT_APP_CASHFREE_APP_ID=your_production_cashfree_app_id_here
   ```

2. **Build test locally**:
   ```bash
   cd frontend
   npm install
   npm run build
   ```

### 2.2 Deploy to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy Frontend**:
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Or use Vercel Dashboard**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import project from GitHub
   - Select `frontend` folder
   - Configure build settings:
     - **Build Command**: `npm run build`
     - **Output Directory**: `build`
     - **Install Command**: `npm install`

### 2.3 Configure Custom Domain

1. **In Vercel Dashboard**:
   - Go to project → Settings → Domains
   - Add domain: `gameonesport.xyz`
   - Follow Vercel's DNS configuration instructions

2. **DNS Configuration**:
   ```
   Type: A
   Name: @
   Value: 76.76.19.61
   TTL: 300

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   TTL: 300
   ```

## 🔧 Step 3: Admin Panel Deployment on Vercel

### 3.1 Deploy Admin Panel

1. **Deploy to Vercel**:
   ```bash
   cd admin-panel
   vercel --prod
   ```

2. **Or use Vercel Dashboard**:
   - Import project from GitHub
   - Select `admin-panel` folder
   - Same build settings as frontend

### 3.2 Configure Custom Domain

1. **In Vercel Dashboard**:
   - Add domain: `admin.gameonesport.xyz`

2. **DNS Configuration**:
   ```
   Type: CNAME
   Name: admin
   Value: cname.vercel-dns.com
   TTL: 300
   ```

## 💳 Step 4: Cashfree Integration Setup

### 4.1 Cashfree Account Configuration

1. **Login to Cashfree Dashboard**
2. **Get Production Credentials**:
   - App ID
   - Secret Key
3. **Configure Webhooks**:
   - Webhook URL: `https://api.gameonesport.xyz/api/payments/webhook`
   - Events: Payment success, Payment failed

### 4.2 Update Environment Variables

Update all environment variables with actual Cashfree production credentials:

**Backend (Render)**:
```env
CASHFREE_APP_ID=your_actual_production_app_id
CASHFREE_SECRET_KEY=your_actual_production_secret_key
```

**Frontend (Vercel)**:
```env
REACT_APP_CASHFREE_APP_ID=your_actual_production_app_id
```

## 🔒 Step 5: Security & SSL Configuration

### 5.1 SSL Certificates

- **Render**: Automatically provides SSL for custom domains
- **Vercel**: Automatically provides SSL for custom domains
- Verify all domains show 🔒 in browser

### 5.2 Security Headers

All applications are configured with security headers:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

## 🧪 Step 6: Testing & Verification

### 6.1 Backend API Testing

```bash
# Health check
curl https://api.gameonesport.xyz/api/health

# Expected response:
{
  "success": true,
  "message": "GameOn API is running!",
  "environment": "production",
  "dbStatus": "connected"
}
```

### 6.2 Frontend Testing

1. **Visit**: `https://gameonesport.xyz`
2. **Test**:
   - User registration/login
   - Tournament listing
   - Payment flow (with test amounts)

### 6.3 Admin Panel Testing

1. **Visit**: `https://admin.gameonesport.xyz`
2. **Test**:
   - Admin login
   - Dashboard access
   - Tournament management

### 6.4 Payment Testing

1. **Use Cashfree test credentials** initially
2. **Test payment flows**:
   - Wallet top-up
   - Tournament entry
3. **Switch to production** after testing

## 🔄 Step 7: DNS Propagation & Final Checks

### 7.1 DNS Verification

```bash
# Check DNS propagation
nslookup api.gameonesport.xyz
nslookup gameonesport.xyz
nslookup admin.gameonesport.xyz
```

### 7.2 Complete System Test

1. **Frontend** → **Backend** → **Database** → **Payment Gateway**
2. **Real payment test** with small amount
3. **Socket.IO real-time features**
4. **Admin panel functionality**

## 📊 Step 8: Monitoring & Maintenance

### 8.1 Set Up Monitoring

1. **Render**: Monitor backend performance and logs
2. **Vercel**: Monitor frontend deployments and analytics
3. **MongoDB Atlas**: Monitor database performance
4. **Cashfree**: Monitor payment transactions

### 8.2 Backup Strategy

1. **Database**: MongoDB Atlas automatic backups
2. **Code**: GitHub repository
3. **Environment Variables**: Secure backup of all credentials

## 🚨 Troubleshooting

### Common Issues:

1. **CORS Errors**:
   - Verify CORS_ORIGIN environment variable
   - Check domain spelling

2. **Payment Failures**:
   - Verify Cashfree credentials
   - Check webhook URL configuration

3. **Database Connection**:
   - Verify MongoDB Atlas IP whitelist
   - Check connection string

4. **SSL Issues**:
   - Wait for DNS propagation (up to 48 hours)
   - Verify domain configuration

## 📞 Support Contacts

- **Render Support**: [Render Help](https://render.com/docs)
- **Vercel Support**: [Vercel Help](https://vercel.com/help)
- **Cashfree Support**: [Cashfree Docs](https://docs.cashfree.com)
- **MongoDB Atlas**: [Atlas Support](https://docs.atlas.mongodb.com)

---

## ✅ Deployment Checklist

- [ ] Backend deployed on Render with custom domain
- [ ] Frontend deployed on Vercel with custom domain  
- [ ] Admin panel deployed on Vercel with custom domain
- [ ] All SSL certificates active
- [ ] Cashfree integration configured
- [ ] Environment variables set correctly
- [ ] DNS propagation complete
- [ ] Payment testing successful
- [ ] Real-time features working
- [ ] Admin panel accessible
- [ ] Monitoring set up

**🎉 Your GameOn Platform is now live in production!**