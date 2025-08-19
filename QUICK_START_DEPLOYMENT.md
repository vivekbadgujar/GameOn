# GameOn Platform - Quick Start Deployment Guide

This is a condensed guide to get your GameOn Platform live in production as quickly as possible.

## 🚀 Quick Deployment Steps

### Step 1: Prepare Environment (5 minutes)

1. **Run the environment setup script**:
   ```powershell
   .\setup-production-env.ps1
   ```
   
2. **Update Cashfree credentials** in the generated files:
   - `backend/.env` → Update `CASHFREE_APP_ID` and `CASHFREE_SECRET_KEY`
   - `frontend/.env.production` → Update `REACT_APP_CASHFREE_APP_ID`

### Step 2: Deploy Backend to Render (10 minutes)

1. **Go to [Render Dashboard](https://dashboard.render.com)**
2. **Create New Web Service**:
   - Connect your GitHub repository
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node

3. **Add Environment Variables** (copy from `backend/.env`):
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://vivekbadgujar:Vivek321@cluster0.squjxrk.mongodb.net/gameon?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=[your-generated-secret]
   JWT_REFRESH_SECRET=[your-generated-secret]
   CASHFREE_APP_ID=[your-cashfree-app-id]
   CASHFREE_SECRET_KEY=[your-cashfree-secret-key]
   CASHFREE_ENVIRONMENT=production
   CORS_ORIGIN=https://gameonesport.xyz,https://admin.gameonesport.xyz
   ```

4. **Deploy** and wait for completion

5. **Add Custom Domain**:
   - Go to Settings → Custom Domains
   - Add: `api.gameonesport.xyz`
   - Note the CNAME target

### Step 3: Deploy Frontend to Vercel (5 minutes)

1. **Install Vercel CLI**:
   ```powershell
   npm install -g vercel
   ```

2. **Deploy Frontend**:
   ```powershell
   cd frontend
   vercel --prod
   ```

3. **Add Custom Domain** in Vercel Dashboard:
   - Add domain: `gameonesport.xyz`

### Step 4: Deploy Admin Panel to Vercel (5 minutes)

1. **Deploy Admin Panel**:
   ```powershell
   cd admin-panel
   vercel --prod
   ```

2. **Add Custom Domain** in Vercel Dashboard:
   - Add domain: `admin.gameonesport.xyz`

### Step 5: Configure DNS (2 minutes)

Add these DNS records in your domain registrar:

```dns
Type: A
Name: @
Value: 76.76.19.61
TTL: 300

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 300

Type: CNAME
Name: admin
Value: cname.vercel-dns.com
TTL: 300

Type: CNAME
Name: api
Value: [your-render-cname-target]
TTL: 300
```

### Step 6: Test Everything (5 minutes)

1. **Wait for DNS propagation** (5-30 minutes)

2. **Test URLs**:
   - Frontend: `https://gameonesport.xyz`
   - Admin: `https://admin.gameonesport.xyz`
   - API: `https://api.gameonesport.xyz/api/health`

3. **Test Payment** with a small amount

## 🔧 If Something Goes Wrong

### Backend Issues
- Check Render logs for errors
- Verify environment variables
- Ensure MongoDB Atlas allows connections from 0.0.0.0/0

### Frontend Issues
- Check Vercel deployment logs
- Verify environment variables in Vercel dashboard
- Clear browser cache

### DNS Issues
- Wait longer (up to 48 hours for full propagation)
- Use `nslookup` to check DNS resolution
- Verify DNS records are correct

### Payment Issues
- Verify Cashfree credentials
- Check webhook URL configuration
- Test with Cashfree sandbox first

## 📞 Quick Support

- **Render**: [render.com/docs](https://render.com/docs)
- **Vercel**: [vercel.com/help](https://vercel.com/help)
- **Cashfree**: [docs.cashfree.com](https://docs.cashfree.com)

---

**🎯 Total Time: ~30 minutes + DNS propagation**

**🎉 Your GameOn Platform will be live at:**
- **Frontend**: https://gameonesport.xyz
- **Admin**: https://admin.gameonesport.xyz
- **API**: https://api.gameonesport.xyz