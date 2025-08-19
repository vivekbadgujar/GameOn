# GameOn Platform - Vercel Free Plan Quick Start

Deploy your GameOn Platform to Vercel free plan with custom domains in under 15 minutes.

## 🚀 Quick Deployment Steps

### Step 1: Prepare Projects (2 minutes)

```powershell
# Install Next.js dependencies
cd frontend
npm install next@^14.0.0
npm install

cd ../admin-panel
npm install next@^14.0.0
npm install
```

### Step 2: Configure Environment (1 minute)

```powershell
# Run environment setup
.\vercel-free-env-setup.ps1

# Enter your Cashfree App ID when prompted
```

### Step 3: Deploy to Vercel (5 minutes)

```powershell
# Install Vercel CLI and deploy
npm install -g vercel
.\deploy-vercel-free.ps1
```

### Step 4: Add Custom Domains (2 minutes)

1. Go to **Vercel Dashboard**: https://vercel.com/dashboard
2. **Frontend Project** → Settings → Domains → Add `gameonesport.xyz`
3. **Admin Project** → Settings → Domains → Add `admin.gameonesport.xyz`

### Step 5: Configure DNS (2 minutes)

Add these records to your domain registrar:

```dns
@ A 76.76.19.61
www CNAME cname.vercel-dns.com
admin CNAME cname.vercel-dns.com
```

### Step 6: Set Environment Variables (3 minutes)

In Vercel Dashboard for each project, add:

**Frontend:**
```env
NEXT_PUBLIC_API_BASE_URL=https://api.gameonesport.xyz/api
NEXT_PUBLIC_CASHFREE_APP_ID=your_app_id
NEXT_PUBLIC_CASHFREE_ENVIRONMENT=production
```

**Admin Panel:**
```env
NEXT_PUBLIC_API_URL=https://api.gameonesport.xyz/api
NEXT_PUBLIC_API_BASE_URL=https://api.gameonesport.xyz
```

## ✅ Verification (2 minutes)

Wait 15-30 minutes for DNS propagation, then test:

- **Frontend**: https://gameonesport.xyz
- **Admin**: https://admin.gameonesport.xyz
- **API**: https://api.gameonesport.xyz/api/health

## 🎯 Free Plan Benefits

- **$0 Monthly Cost**: Completely free hosting
- **Custom Domains**: Professional domains with SSL
- **Global CDN**: Fast worldwide delivery
- **100GB Bandwidth**: More than enough for most apps
- **No Function Costs**: Static export avoids all function fees

## 🔧 What's Optimized

- **Static Export**: No serverless functions
- **Direct API Calls**: Straight to Render backend
- **Single Region**: Avoids multi-region costs
- **Client-Side Variables**: No server-side processing

## 📞 Need Help?

- **Full Guide**: `VERCEL_FREE_PLAN_GUIDE.md`
- **DNS Setup**: `DNS_FREE_PLAN_SETUP.md`
- **Troubleshooting**: Check the guides above

---

## 🎉 Done!

Your GameOn Platform is now live on Vercel's free plan with custom domains and SSL certificates!

**Total Time**: ~15 minutes + DNS propagation  
**Monthly Cost**: $0 (Free Plan)  
**Features**: Full production setup with custom domains