# 🚨 Network Error Fix Guide

## Problem: Admin Panel Shows "Network Error" on Login

The "Network Error" means your admin panel can't connect to the backend API. Here's how to fix it:

---

## 🔍 Step 1: Test Your Backend

Run this command to check if your backend is working:

```powershell
# Windows
.\test-backend.ps1

# Or use Node.js
node fix-network-error.js
```

---

## 🔧 Step 2: Most Common Fixes

### Fix 1: Render Service is Sleeping (Most Common)

**Problem:** Render free tier services sleep after 15 minutes of inactivity.

**Solution:**
1. Go to https://dashboard.render.com
2. Find your backend service
3. Click on it to wake it up
4. Wait 30-60 seconds for it to start
5. Try logging in again

### Fix 2: Backend Deployment Failed

**Problem:** Your backend didn't deploy correctly.

**Solution:**
1. Go to https://dashboard.render.com
2. Check your backend service status
3. Look at the "Logs" tab for errors
4. If there are errors, fix them and redeploy

### Fix 3: Environment Variables Missing

**Problem:** Backend is missing required environment variables.

**Solution:**
1. Go to Render Dashboard → Your Service → Environment
2. Ensure these variables exist:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   NODE_ENV=production
   ```
3. Redeploy after adding variables

### Fix 4: Wrong API URL in Admin Panel

**Problem:** Admin panel is trying to connect to wrong URL.

**Solution:**
1. Go to Vercel Dashboard → Your Admin Panel Project → Settings → Environment Variables
2. Ensure `REACT_APP_API_URL` is set to: `https://gameon-backend.onrender.com/api`
3. Redeploy admin panel: `cd admin-panel && vercel --prod`

---

## 🚀 Quick Fix Commands

```bash
# 1. Test backend connectivity
.\test-backend.ps1

# 2. Create admin user (if needed)
node fix-admin-login.js

# 3. Check Vercel environment variables
cd admin-panel
vercel env ls

# 4. Set correct API URL (if missing)
vercel env add REACT_APP_API_URL

# 5. Redeploy admin panel
vercel --prod --force
```

---

## 🔍 Step 3: Detailed Diagnosis

### Check Backend Status
1. Open: https://gameon-backend.onrender.com
2. Should show: "Welcome to GameOn API"
3. If you see "Not Found" or timeout, backend is down

### Check Health Endpoint
1. Open: https://gameon-backend.onrender.com/api/health
2. Should show: `{"success": true, "message": "GameOn API is running!"}`
3. If 404 error, backend routes aren't working

### Test Admin Login API
```bash
curl -X POST https://gameon-backend.onrender.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gameon.com","password":"GameOn@2024!"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJ...",
  "admin": {...}
}
```

---

## 🔧 Step 4: Fix Based on Test Results

### If Backend is Down (Most Common)
```bash
# Backend shows "Not Found" or times out
```
**Solutions:**
1. **Render Free Tier Sleep:** Wait 60 seconds, try again
2. **Deployment Failed:** Check Render logs, fix errors, redeploy
3. **Environment Variables:** Add missing variables in Render dashboard

### If Backend Works but Admin Panel Fails
```bash
# Backend responds but admin panel shows network error
```
**Solutions:**
1. **Wrong API URL:** Check Vercel environment variables
2. **CORS Error:** Add your Vercel domain to backend CORS
3. **Cache Issue:** Redeploy admin panel with `--force`

### If Admin Login API Fails
```bash
# Backend works but login returns 401/404/500
```
**Solutions:**
1. **401 Error:** Run `node fix-admin-login.js`
2. **404 Error:** Admin routes not configured
3. **500 Error:** Database connection issue

---

## 🎯 Step-by-Step Fix Process

### 1. Wake Up Backend (If Sleeping)
```bash
# Just visit the URL to wake it up
curl https://gameon-backend.onrender.com
# Wait 30-60 seconds
```

### 2. Verify Backend is Working
```bash
# Should return API welcome message
curl https://gameon-backend.onrender.com

# Should return health status
curl https://gameon-backend.onrender.com/api/health
```

### 3. Test Admin Login
```bash
# Should return success with token
curl -X POST https://gameon-backend.onrender.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gameon.com","password":"GameOn@2024!"}'
```

### 4. Fix Admin Panel Environment
```bash
cd admin-panel

# Check current environment variables
vercel env ls

# Add/update API URL if needed
vercel env add REACT_APP_API_URL
# Enter: https://gameon-backend.onrender.com/api

# Redeploy
vercel --prod --force
```

### 5. Test Admin Panel Login
1. Open your deployed admin panel
2. Open browser console (F12)
3. Try to login
4. Check console for errors

---

## 🚨 Emergency Fixes

### If Nothing Works
1. **Redeploy Everything:**
   ```bash
   # Redeploy backend on Render (push to git)
   git add .
   git commit -m "fix deployment"
   git push
   
   # Redeploy admin panel
   cd admin-panel
   vercel --prod --force
   ```

2. **Reset Admin User:**
   ```bash
   node fix-admin-login.js
   ```

3. **Check All Environment Variables:**
   - Render: MONGODB_URI, JWT_SECRET, NODE_ENV
   - Vercel: REACT_APP_API_URL

---

## 📋 Checklist

- [ ] Backend responds at https://gameon-backend.onrender.com
- [ ] Health endpoint works: /api/health
- [ ] Admin login API works: /api/admin/auth/login
- [ ] Admin user exists in database
- [ ] Vercel has correct REACT_APP_API_URL
- [ ] Admin panel deployed with latest changes
- [ ] Browser console shows no CORS errors

---

## 🆘 Still Not Working?

### Check These:
1. **Render Dashboard:** Service status and logs
2. **Vercel Dashboard:** Environment variables and deployment logs
3. **Browser Console:** Network errors and failed requests
4. **MongoDB:** Database connection and admin user existence

### Get More Help:
1. Run: `.\test-backend.ps1` for detailed diagnosis
2. Check Render service logs for backend errors
3. Check browser network tab for failed requests
4. Verify all environment variables are correct

---

## ✅ Success Indicators

When everything is working:
- ✅ https://gameon-backend.onrender.com shows welcome message
- ✅ /api/health returns success
- ✅ Admin login API returns token
- ✅ Admin panel connects without network error
- ✅ Login works with admin@gameon.com / GameOn@2024!

The most common cause is Render free tier sleeping - just wait 60 seconds and try again! 🚀