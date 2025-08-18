# 🔧 Admin Login Troubleshooting Guide

## 🚨 Problem: Admin Panel Login Failing

If your admin panel login is failing after Vercel deployment, follow this step-by-step troubleshooting guide.

---

## 🔍 Step 1: Run Diagnostic Scripts

### 1.1 Test Backend Connection
```bash
# Run the debug script
node debug-admin-login.js
```

### 1.2 Create/Fix Admin User
```bash
# Create or update admin user
node fix-admin-login.js
```

---

## 🔍 Step 2: Check Environment Variables

### 2.1 Verify Vercel Environment Variables
Go to your Vercel admin panel project → Settings → Environment Variables and ensure:

```env
REACT_APP_API_URL=https://gameon-backend.onrender.com/api
REACT_APP_WS_URL=wss://gameon-backend.onrender.com
REACT_APP_ENV=production
```

### 2.2 Check if Variables are Loading
1. Open your deployed admin panel
2. Open browser console (F12)
3. Type: `console.log(process.env.REACT_APP_API_URL)`
4. Should show: `https://gameon-backend.onrender.com/api`

---

## 🔍 Step 3: Test Backend API Directly

### 3.1 Test Login Endpoint
```bash
curl -X POST https://gameon-backend.onrender.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gameon.com",
    "password": "GameOn@2024!"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJ...",
  "admin": {
    "id": "...",
    "name": "GameOn Administrator",
    "email": "admin@gameon.com",
    "role": "super_admin"
  }
}
```

### 3.2 Common API Responses and Solutions

#### ❌ 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```
**Solution:** Admin user doesn't exist or password is wrong. Run `node fix-admin-login.js`

#### ❌ 404 Not Found
```json
{
  "message": "Cannot POST /api/admin/auth/login"
}
```
**Solution:** Backend route not configured. Check backend deployment.

#### ❌ 500 Server Error
```json
{
  "success": false,
  "message": "Login failed due to server error"
}
```
**Solution:** Database connection issue. Check MongoDB connection.

---

## 🔍 Step 4: Check CORS Configuration

### 4.1 Verify CORS in Backend
Your backend should allow your Vercel domain. Check `backend/server.js`:

```javascript
const allowedOrigins = [
  'https://your-actual-admin-domain.vercel.app', // Add your real domain
  'https://gameon-admin-panel.vercel.app',
];
```

### 4.2 Test CORS
```bash
curl -X OPTIONS https://gameon-backend.onrender.com/api/admin/auth/login \
  -H "Origin: https://your-admin-panel.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"
```

---

## 🔍 Step 5: Browser Console Debugging

### 5.1 Check Browser Console
1. Open your admin panel in browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Try to login and watch for errors

### 5.2 Common Console Errors and Solutions

#### ❌ CORS Error
```
Access to XMLHttpRequest at 'https://gameon-backend.onrender.com/api/admin/auth/login' 
from origin 'https://your-admin.vercel.app' has been blocked by CORS policy
```
**Solution:** Add your Vercel domain to backend CORS configuration.

#### ❌ Network Error
```
Network Error
```
**Solution:** Backend is down or unreachable. Check Render deployment.

#### ❌ 404 Error
```
POST https://gameon-backend.onrender.com/api/admin/auth/login 404 (Not Found)
```
**Solution:** Backend route doesn't exist. Check backend deployment.

---

## 🔍 Step 6: Check Backend Logs

### 6.1 Check Render Logs
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your backend service
3. Go to "Logs" tab
4. Look for errors during login attempts

### 6.2 Common Backend Log Errors

#### ❌ Database Connection Error
```
MongoDB connection error: MongoServerSelectionError
```
**Solution:** Check MongoDB connection string in Render environment variables.

#### ❌ JWT Secret Missing
```
Error: JWT_SECRET is required
```
**Solution:** Add JWT_SECRET environment variable in Render.

---

## 🔧 Quick Fixes

### Fix 1: Redeploy Admin Panel
```bash
cd admin-panel
vercel --prod --force
```

### Fix 2: Update Backend CORS
1. Get your actual Vercel admin panel URL
2. Update backend CORS configuration
3. Redeploy backend on Render

### Fix 3: Reset Admin User
```bash
# Connect to your MongoDB and run:
db.admins.deleteMany({})
# Then run:
node fix-admin-login.js
```

### Fix 4: Check Environment Variables
```bash
# In your admin panel project
vercel env ls
# Add missing variables:
vercel env add REACT_APP_API_URL
```

---

## 🎯 Default Admin Credentials

After running `fix-admin-login.js`, use these credentials:

- **Email:** `admin@gameon.com`
- **Password:** `GameOn@2024!`

---

## 🔍 Step-by-Step Debugging Process

### 1. **Backend Health Check**
```bash
curl https://gameon-backend.onrender.com/api/health
```

### 2. **Create Admin User**
```bash
node fix-admin-login.js
```

### 3. **Test API Login**
```bash
curl -X POST https://gameon-backend.onrender.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gameon.com","password":"GameOn@2024!"}'
```

### 4. **Check Frontend Environment**
- Open admin panel
- Check browser console
- Verify API URL is correct

### 5. **Update CORS if Needed**
- Get your Vercel admin panel URL
- Add it to backend CORS
- Redeploy backend

### 6. **Redeploy Admin Panel**
```bash
cd admin-panel
vercel --prod
```

---

## 🆘 Still Not Working?

### Check These Common Issues:

1. **Wrong API URL**: Ensure `REACT_APP_API_URL` points to your backend
2. **CORS Issues**: Backend must allow your Vercel domain
3. **No Admin User**: Run `fix-admin-login.js` to create admin
4. **Backend Down**: Check Render deployment status
5. **Environment Variables**: Verify all variables are set in Vercel
6. **Database Issues**: Check MongoDB connection in backend

### Get Help:
1. Check browser console for detailed errors
2. Check Render backend logs
3. Run diagnostic scripts
4. Verify all environment variables
5. Test API endpoints directly

---

## ✅ Success Checklist

- [ ] Backend is accessible at `https://gameon-backend.onrender.com`
- [ ] Admin user exists in database
- [ ] API login endpoint returns success
- [ ] CORS allows your Vercel domain
- [ ] Environment variables are set correctly
- [ ] Admin panel can connect to backend
- [ ] Login works in browser

Once all items are checked, your admin login should work! 🎉