# Vercel Custom Domain Setup Guide

This guide walks you through setting up custom domains for your GameOn Platform on Vercel.

## 🎯 Domain Structure

- **Frontend**: `gameonesport.xyz` → Vercel Project 1
- **Admin Panel**: `admin.gameonesport.xyz` → Vercel Project 2
- **Backend API**: `api.gameonesport.xyz` → Render (already configured)

## 🚀 Step 1: Deploy to Vercel

### 1.1 Deploy Frontend

```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Deploy to Vercel
vercel --prod
```

### 1.2 Deploy Admin Panel

```powershell
# Navigate to admin panel directory
cd admin-panel

# Install dependencies
npm install

# Deploy to Vercel
vercel --prod
```

## 🌐 Step 2: Configure Custom Domains in Vercel

### 2.1 Frontend Domain Setup

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your frontend project**
3. **Go to Settings → Domains**
4. **Add Custom Domain**:
   - Domain: `gameonesport.xyz`
   - Click "Add"
5. **Add www subdomain**:
   - Domain: `www.gameonesport.xyz`
   - Redirect to: `gameonesport.xyz`
   - Click "Add"

### 2.2 Admin Panel Domain Setup

1. **Select your admin panel project** in Vercel Dashboard
2. **Go to Settings → Domains**
3. **Add Custom Domain**:
   - Domain: `admin.gameonesport.xyz`
   - Click "Add"

## 🔧 Step 3: DNS Configuration

### 3.1 DNS Records for Domain Registrar

Add these DNS records in your domain registrar (GoDaddy, Namecheap, etc.):

```dns
# Main domain (Frontend)
Type: A
Name: @
Value: 76.76.19.61
TTL: 300

# www subdomain (Frontend)
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 300

# Admin subdomain (Admin Panel)
Type: CNAME
Name: admin
Value: cname.vercel-dns.com
TTL: 300

# API subdomain (Backend - already configured)
Type: CNAME
Name: api
Value: [your-render-service].onrender.com
TTL: 300
```

### 3.2 Provider-Specific Instructions

#### Namecheap
1. Login to Namecheap
2. Go to Domain List → Manage
3. Advanced DNS tab
4. Add/Edit records as shown above

#### GoDaddy
1. Login to GoDaddy
2. My Products → DNS
3. Manage Zones
4. Add/Edit records as shown above

#### Cloudflare
1. Login to Cloudflare
2. Select your domain
3. DNS → Records
4. Add records (set proxy status to "DNS only" initially)

## ⏱️ Step 4: Wait for Propagation

- **DNS Propagation**: 15 minutes to 48 hours
- **SSL Certificate**: Automatic (5-10 minutes after DNS propagation)
- **Check Status**: Use online DNS checkers or `nslookup`

## 🧪 Step 5: Verification

### 5.1 DNS Verification Commands

```powershell
# Check main domain
nslookup gameonesport.xyz

# Check admin subdomain
nslookup admin.gameonesport.xyz

# Check API subdomain
nslookup api.gameonesport.xyz
```

### 5.2 HTTPS Verification

```powershell
# Test frontend
curl -I https://gameonesport.xyz

# Test admin panel
curl -I https://admin.gameonesport.xyz

# Test API
curl -I https://api.gameonesport.xyz/api/health
```

### 5.3 Browser Testing

1. **Frontend**: Visit `https://gameonesport.xyz`
   - Should load your GameOn frontend
   - Check for SSL certificate (🔒 icon)
   - Test user registration/login

2. **Admin Panel**: Visit `https://admin.gameonesport.xyz`
   - Should load your admin dashboard
   - Check for SSL certificate (🔒 icon)
   - Test admin login

3. **API**: Visit `https://api.gameonesport.xyz/api/health`
   - Should return API health status
   - Check for SSL certificate (🔒 icon)

## 🔒 Step 6: SSL/HTTPS Configuration

### 6.1 Automatic SSL (Vercel)

Vercel automatically provisions SSL certificates for custom domains:

- **Let's Encrypt**: Free SSL certificates
- **Automatic Renewal**: Certificates renew automatically
- **HTTPS Redirect**: Automatic HTTP to HTTPS redirect

### 6.2 SSL Verification

1. **Check Certificate**: Look for 🔒 in browser address bar
2. **Certificate Details**: Click on 🔒 to view certificate info
3. **Expiration**: Verify certificate is valid and not expired

## 🚨 Troubleshooting

### Common Issues

#### 1. DNS Not Propagating
```powershell
# Clear DNS cache
ipconfig /flushdns

# Use different DNS servers
nslookup gameonesport.xyz 8.8.8.8
```

#### 2. SSL Certificate Issues
- Wait 24 hours for automatic provisioning
- Check DNS records are correct
- Contact Vercel support if issues persist

#### 3. Domain Not Working
- Verify DNS records are correct
- Check domain registrar settings
- Ensure domain is not expired

#### 4. API Calls Failing
- Check `vercel.json` rewrites configuration
- Verify backend API is accessible
- Check CORS settings on backend

### Error Messages

#### "Domain is not configured"
- DNS records not set correctly
- Wait for DNS propagation
- Check domain registrar settings

#### "SSL Certificate Error"
- Certificate still provisioning
- DNS records incorrect
- Contact Vercel support

## 📊 Step 7: Performance Optimization

### 7.1 Vercel Analytics

1. **Enable Analytics** in Vercel Dashboard
2. **Monitor Performance**: Page load times, Core Web Vitals
3. **Track Usage**: Visitor analytics, geographic distribution

### 7.2 Caching Configuration

Vercel automatically optimizes caching:

- **Static Assets**: Cached at edge locations
- **API Routes**: Configurable caching headers
- **Dynamic Content**: Smart caching based on content

## 🔧 Step 8: Environment Variables

### 8.1 Production Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

#### Frontend Project
```env
REACT_APP_API_BASE_URL=https://api.gameonesport.xyz/api
REACT_APP_WS_URL=wss://api.gameonesport.xyz
REACT_APP_CASHFREE_APP_ID=your_production_app_id
REACT_APP_CASHFREE_ENVIRONMENT=production
REACT_APP_FRONTEND_URL=https://gameonesport.xyz
REACT_APP_ADMIN_URL=https://admin.gameonesport.xyz
```

#### Admin Panel Project
```env
REACT_APP_API_URL=https://api.gameonesport.xyz/api
REACT_APP_API_BASE_URL=https://api.gameonesport.xyz
REACT_APP_FRONTEND_URL=https://gameonesport.xyz
REACT_APP_ADMIN_URL=https://admin.gameonesport.xyz
```

## ✅ Final Checklist

- [ ] Frontend deployed to Vercel
- [ ] Admin panel deployed to Vercel
- [ ] Custom domains added in Vercel Dashboard
- [ ] DNS records configured correctly
- [ ] SSL certificates active
- [ ] Environment variables set
- [ ] All domains accessible via HTTPS
- [ ] API calls working correctly
- [ ] Payment integration functional
- [ ] Real-time features working

## 📞 Support Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Vercel Support**: https://vercel.com/help
- **DNS Checker**: https://www.whatsmydns.net/
- **SSL Checker**: https://www.ssllabs.com/ssltest/

---

## 🎉 Success!

Once all steps are completed, your GameOn Platform will be live at:

- **🌐 Frontend**: https://gameonesport.xyz
- **🔧 Admin Panel**: https://admin.gameonesport.xyz
- **🔗 API**: https://api.gameonesport.xyz

Your platform is now ready for production use with custom domains and SSL certificates!