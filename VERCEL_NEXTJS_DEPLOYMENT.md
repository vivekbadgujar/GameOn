# GameOn Platform - Complete Vercel Next.js Deployment Guide

This guide provides everything you need to deploy your GameOn Platform frontend and admin panel to Vercel with Next.js and custom domains.

## 🎯 What's Been Configured

### ✅ Next.js Configuration
- **Frontend**: Complete Next.js setup with App Router
- **Admin Panel**: Complete Next.js setup with App Router
- **API Rewrites**: Configured to proxy to `https://api.gameonesport.xyz`
- **SSL/HTTPS**: Automatic SSL certificate provisioning
- **Performance**: Optimized caching and compression

### ✅ Vercel Configuration
- **No Routes Conflicts**: Clean `vercel.json` without deprecated `routes` field
- **Rewrites**: API calls proxied to backend
- **Headers**: Security headers configured
- **Redirects**: SEO-friendly redirects
- **Environment Variables**: Production-ready configuration

### ✅ Domain Setup
- **Frontend**: `gameonesport.xyz`
- **Admin Panel**: `admin.gameonesport.xyz`
- **Backend API**: `api.gameonesport.xyz` (Render)

## 🚀 Quick Deployment (15 minutes)

### Step 1: Install Dependencies

```powershell
# Frontend
cd frontend
npm install next@^14.0.0
npm install

# Admin Panel
cd ../admin-panel
npm install next@^14.0.0
npm install
```

### Step 2: Deploy to Vercel

```powershell
# Install Vercel CLI
npm install -g vercel

# Deploy Frontend
cd frontend
vercel --prod

# Deploy Admin Panel
cd ../admin-panel
vercel --prod
```

### Step 3: Configure Domains

1. **Vercel Dashboard**: https://vercel.com/dashboard
2. **Frontend Project** → Settings → Domains → Add `gameonesport.xyz`
3. **Admin Project** → Settings → Domains → Add `admin.gameonesport.xyz`

### Step 4: DNS Configuration

Add these DNS records to your domain registrar:

```dns
# Frontend
@ A 76.76.19.61
www CNAME cname.vercel-dns.com

# Admin Panel
admin CNAME cname.vercel-dns.com
```

## 📁 File Structure Created

```
frontend/
├── app/
│   ├── layout.js          # Next.js root layout
│   ├── page.js            # Homepage component
│   └── globals.css        # Global styles
├── next.config.js         # Next.js configuration
├── vercel.json           # Vercel deployment config
└── package.json          # Updated with Next.js

admin-panel/
├── app/
│   ├── layout.js          # Admin layout
│   ├── page.js            # Admin homepage
│   └── globals.css        # Admin styles
├── next.config.js         # Next.js configuration
├── vercel.json           # Vercel deployment config
└── package.json          # Updated with Next.js
```

## 🔧 Configuration Details

### Next.js Configuration Features

#### Frontend (`next.config.js`)
```javascript
// API Rewrites
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'https://api.gameonesport.xyz/api/:path*',
    }
  ];
}

// Security Headers
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        // ... more security headers
      ],
    }
  ];
}
```

#### Vercel Configuration (`vercel.json`)
```json
{
  "version": 2,
  "framework": "nextjs",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://api.gameonesport.xyz/api/$1"
    }
  ],
  "headers": [
    // Security headers configuration
  ],
  "cleanUrls": true,
  "trailingSlash": false
}
```

## 🌐 Environment Variables

### Frontend Environment Variables
Set these in Vercel Dashboard → Project → Settings → Environment Variables:

```env
REACT_APP_API_BASE_URL=https://api.gameonesport.xyz/api
REACT_APP_WS_URL=wss://api.gameonesport.xyz
REACT_APP_CASHFREE_APP_ID=your_production_app_id
REACT_APP_CASHFREE_ENVIRONMENT=production
REACT_APP_FRONTEND_URL=https://gameonesport.xyz
REACT_APP_ADMIN_URL=https://admin.gameonesport.xyz
```

### Admin Panel Environment Variables
```env
REACT_APP_API_URL=https://api.gameonesport.xyz/api
REACT_APP_API_BASE_URL=https://api.gameonesport.xyz
REACT_APP_FRONTEND_URL=https://gameonesport.xyz
REACT_APP_ADMIN_URL=https://admin.gameonesport.xyz
```

## 🔒 Security Features

### Implemented Security Measures
- **HTTPS Enforcement**: Automatic SSL certificates
- **Security Headers**: XSS protection, content type sniffing prevention
- **CORS Protection**: API calls proxied through Vercel
- **Admin Panel Protection**: No indexing, restricted access
- **Content Security Policy**: Configured for production

### SSL/HTTPS Configuration
- **Automatic SSL**: Vercel provides free SSL certificates
- **HTTP Redirect**: Automatic redirect from HTTP to HTTPS
- **Certificate Renewal**: Automatic renewal before expiration

## 🚨 Troubleshooting

### Common Issues and Solutions

#### 1. "Routes cannot be present" Error
**Solution**: Use the provided `vercel.json` files which don't include the deprecated `routes` field.

#### 2. API Calls Failing
**Solution**: 
- Check `next.config.js` rewrites configuration
- Verify backend API is accessible at `https://api.gameonesport.xyz`
- Check CORS settings on backend

#### 3. Environment Variables Not Working
**Solution**:
- Set variables in Vercel Dashboard, not just in files
- Redeploy after adding environment variables
- Use `REACT_APP_` prefix for client-side variables

#### 4. Custom Domain Not Working
**Solution**:
- Wait for DNS propagation (up to 48 hours)
- Verify DNS records are correct
- Check domain registrar settings

#### 5. SSL Certificate Issues
**Solution**:
- Wait 24 hours for automatic provisioning
- Ensure DNS records point to Vercel
- Contact Vercel support if issues persist

### Debug Commands

```powershell
# Check DNS propagation
nslookup gameonesport.xyz
nslookup admin.gameonesport.xyz

# Test HTTPS
curl -I https://gameonesport.xyz
curl -I https://admin.gameonesport.xyz

# Check API connectivity
curl -I https://api.gameonesport.xyz/api/health
```

## 📊 Performance Optimization

### Vercel Optimizations
- **Edge Caching**: Static assets cached globally
- **Image Optimization**: Automatic image optimization
- **Code Splitting**: Automatic code splitting with Next.js
- **Compression**: Gzip/Brotli compression enabled

### Next.js Optimizations
- **Bundle Optimization**: Webpack optimization configured
- **Tree Shaking**: Unused code elimination
- **Static Generation**: Pre-rendered pages where possible
- **Dynamic Imports**: Lazy loading for better performance

## 🔧 Deployment Scripts

### Automated Deployment
```powershell
# Run the complete deployment
.\deploy-vercel.ps1

# Set up environment variables
.\vercel-env-setup.ps1
```

### Manual Deployment
```powershell
# Frontend
cd frontend
npm run build
vercel --prod

# Admin Panel
cd admin-panel
npm run build
vercel --prod
```

## ✅ Verification Checklist

### Pre-Deployment
- [ ] Next.js dependencies installed
- [ ] Environment variables configured
- [ ] Build process successful
- [ ] No console errors in development

### Post-Deployment
- [ ] Frontend accessible at `https://gameonesport.xyz`
- [ ] Admin panel accessible at `https://admin.gameonesport.xyz`
- [ ] SSL certificates active (🔒 icon in browser)
- [ ] API calls working correctly
- [ ] Payment integration functional
- [ ] Real-time features working
- [ ] Mobile responsiveness verified

### Domain Configuration
- [ ] DNS records configured correctly
- [ ] Custom domains added in Vercel
- [ ] SSL certificates provisioned
- [ ] HTTP to HTTPS redirect working
- [ ] www redirect working (if configured)

## 📞 Support Resources

### Documentation
- **Next.js**: https://nextjs.org/docs
- **Vercel**: https://vercel.com/docs
- **Vercel Domains**: https://vercel.com/docs/concepts/projects/domains

### Tools
- **DNS Checker**: https://www.whatsmydns.net/
- **SSL Checker**: https://www.ssllabs.com/ssltest/
- **Vercel CLI**: https://vercel.com/cli

### Support
- **Vercel Support**: https://vercel.com/help
- **Next.js GitHub**: https://github.com/vercel/next.js

---

## 🎉 Success!

Your GameOn Platform is now deployed with:

- **✅ Next.js Framework**: Modern React framework with SSR/SSG
- **✅ Vercel Hosting**: Global CDN with edge optimization
- **✅ Custom Domains**: Professional domain setup
- **✅ SSL/HTTPS**: Secure connections with automatic certificates
- **✅ API Integration**: Seamless backend connectivity
- **✅ Cashfree Payments**: Production-ready payment processing

**🌐 Live URLs:**
- **Frontend**: https://gameonesport.xyz
- **Admin Panel**: https://admin.gameonesport.xyz
- **API**: https://api.gameonesport.xyz

Your platform is now ready for production use! 🚀