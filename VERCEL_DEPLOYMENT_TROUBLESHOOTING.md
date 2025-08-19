# Vercel Deployment Troubleshooting Guide

This guide helps resolve common Vercel deployment issues for the GameOn Platform.

## 🚨 Common Deployment Errors

### 1. Dependency Resolution Errors (ERESOLVE)

#### Error Message:
```
npm error ERESOLVE could not resolve
npm error peer react@"^19" from @react-three/drei@10.7.2
```

#### Solution:
```powershell
# Run the dependency fix script
.\fix-dependencies.ps1

# Or manually fix:
cd frontend
npm install --legacy-peer-deps
npm run build
```

#### What Was Fixed:
- Downgraded `@react-three/drei` to v9.88.13 (React 18 compatible)
- Downgraded `@react-three/fiber` to v8.15.12 (React 18 compatible)
- Downgraded `three.js` to v0.158.0 (compatible version)
- Added `.npmrc` with `legacy-peer-deps=true`
- Updated Vercel install command to use `--legacy-peer-deps`

### 2. Build Command Failures

#### Error Message:
```
Error: Command "npm run build" exited with 1
```

#### Solution:
```powershell
# Test build locally first
cd frontend
npm run build

# Check for specific errors and fix them
# Common issues:
# - Missing environment variables
# - Import/export errors
# - TypeScript errors
```

### 3. Static Export Issues

#### Error Message:
```
Error: Image Optimization using Next.js' default loader is not compatible with `output: 'export'`
```

#### Solution:
Already fixed in `next.config.js`:
```javascript
images: {
  unoptimized: true, // Disables image optimization for static export
}
```

### 4. Environment Variable Issues

#### Error Message:
```
ReferenceError: process is not defined
```

#### Solution:
Use `NEXT_PUBLIC_` prefix for client-side variables:
```env
# ✅ Correct (client-side)
NEXT_PUBLIC_API_BASE_URL=https://api.gameonesport.xyz/api

# ❌ Wrong (server-side only)
API_BASE_URL=https://api.gameonesport.xyz/api
```

### 5. Import/Export Errors

#### Error Message:
```
Module not found: Can't resolve './component'
```

#### Solution:
Check file paths and extensions:
```javascript
// ✅ Correct
import Component from './Component'
import Component from './Component.js'

// ❌ Wrong
import Component from './component' // Case sensitivity
```

## 🔧 Step-by-Step Fix Process

### Step 1: Fix Dependencies Locally

```powershell
# Run the comprehensive fix script
.\fix-dependencies.ps1

# This will:
# - Clean npm cache
# - Remove node_modules
# - Install with legacy peer deps
# - Test build process
```

### Step 2: Test Build Locally

```powershell
# Frontend
cd frontend
npm run build
# Should create 'out' directory

# Admin Panel
cd ../admin-panel
npm run build
# Should create 'out' directory
```

### Step 3: Commit and Push Changes

```powershell
git add .
git commit -m "Fix React Three.js dependency conflicts for Vercel"
git push origin master
```

### Step 4: Redeploy on Vercel

1. Go to **Vercel Dashboard**
2. Select your project
3. Go to **Deployments**
4. Click **Redeploy** on the latest deployment

## 🌐 Vercel Configuration Files

### Frontend `vercel.json`
```json
{
  "version": 2,
  "framework": "nextjs",
  "installCommand": "npm install --legacy-peer-deps",
  "buildCommand": "npm run build",
  "outputDirectory": "out",
  "regions": ["iad1"]
}
```

### Frontend `.npmrc`
```
legacy-peer-deps=true
auto-install-peers=true
fund=false
audit=false
```

### Frontend `next.config.js`
```javascript
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  experimental: { appDir: false }
};
```

## 📊 Vercel Build Process

### Build Steps:
1. **Clone Repository**: Downloads your code
2. **Install Dependencies**: Runs `npm install --legacy-peer-deps`
3. **Build Application**: Runs `npm run build`
4. **Static Export**: Creates `out` directory
5. **Deploy**: Uploads static files to CDN

### Build Environment:
- **Node.js**: Latest LTS version
- **npm**: Latest version
- **Build Machine**: 2 cores, 8 GB RAM
- **Region**: iad1 (Washington, D.C.)

## 🚨 Emergency Fixes

### If Build Still Fails:

#### Option 1: Force Install
Update `vercel.json`:
```json
{
  "installCommand": "npm install --legacy-peer-deps --force"
}
```

#### Option 2: Remove Problematic Dependencies
If Three.js is not essential, remove it:
```powershell
cd frontend
npm uninstall @react-three/drei @react-three/fiber three
```

#### Option 3: Use Yarn Instead
Update `vercel.json`:
```json
{
  "installCommand": "yarn install"
}
```

Create `yarn.lock`:
```powershell
cd frontend
yarn install
```

## 📝 Environment Variables Checklist

### Frontend Variables (Vercel Dashboard):
```env
✅ NEXT_PUBLIC_API_BASE_URL=https://api.gameonesport.xyz/api
✅ NEXT_PUBLIC_WS_URL=wss://api.gameonesport.xyz
✅ NEXT_PUBLIC_CASHFREE_APP_ID=your_app_id
✅ NEXT_PUBLIC_CASHFREE_ENVIRONMENT=production
✅ NEXT_PUBLIC_FRONTEND_URL=https://gameonesport.xyz
✅ NEXT_PUBLIC_ADMIN_URL=https://admin.gameonesport.xyz
```

### Admin Panel Variables (Vercel Dashboard):
```env
✅ NEXT_PUBLIC_API_URL=https://api.gameonesport.xyz/api
✅ NEXT_PUBLIC_API_BASE_URL=https://api.gameonesport.xyz
✅ NEXT_PUBLIC_FRONTEND_URL=https://gameonesport.xyz
✅ NEXT_PUBLIC_ADMIN_URL=https://admin.gameonesport.xyz
```

## 🔍 Debug Commands

### Local Testing:
```powershell
# Check Node.js version
node --version

# Check npm version
npm --version

# Test install
npm install --legacy-peer-deps

# Test build
npm run build

# Check output
ls out/
```

### Vercel CLI Testing:
```powershell
# Install Vercel CLI
npm install -g vercel

# Test deployment locally
vercel dev

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## 📞 Getting Help

### Vercel Support:
- **Documentation**: https://vercel.com/docs
- **Support**: https://vercel.com/help
- **Community**: https://github.com/vercel/vercel/discussions

### Build Logs:
1. Go to **Vercel Dashboard**
2. Select your project
3. Click on failed deployment
4. View **Build Logs** for detailed error messages

## ✅ Success Indicators

### Successful Build:
```
✅ Build completed successfully
✅ Static export created in 'out' directory
✅ Deployment uploaded to CDN
✅ Custom domain configured
✅ SSL certificate active
```

### Successful Deployment:
- Frontend loads at `https://gameonesport.xyz`
- Admin panel loads at `https://admin.gameonesport.xyz`
- API calls work correctly
- No console errors
- SSL certificates active

---

## 🎉 Fixed!

After running the fix script and following this guide, your Vercel deployment should work perfectly with:

- **✅ Resolved Dependencies**: Compatible React Three.js versions
- **✅ Static Export**: Working Next.js static export
- **✅ Environment Variables**: Properly configured
- **✅ Build Process**: Successful builds
- **✅ Custom Domains**: Working with SSL

Your GameOn Platform is now ready for successful Vercel deployment! 🚀