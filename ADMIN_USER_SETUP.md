# 🔐 Admin User Setup Guide

## 📋 Overview

This guide explains how to create and manage admin users for your GameOn Platform admin panel.

---

## 🚀 Quick Admin User Creation

### Method 1: Using Existing Script (Recommended)

You already have a script to create admin users. Use it:

```bash
# Navigate to your project root
cd "c:\Users\Vivek Badgujar\GameOn-Platform"

# Run the admin user creation script
node create-admin-user.js
```

### Method 2: Direct Database Creation

If you need to create an admin user directly:

```javascript
// create-admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to your database
const MONGODB_URI = 'your_mongodb_connection_string';
mongoose.connect(MONGODB_URI);

// Admin schema (adjust based on your actual schema)
const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, default: 'admin' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', adminSchema);

async function createAdmin() {
  try {
    const adminData = {
      email: 'admin@gameon.com',
      password: await bcrypt.hash('your_secure_password', 12),
      name: 'GameOn Administrator',
      role: 'admin',
      isActive: true
    };

    const admin = new Admin(adminData);
    await admin.save();
    
    console.log('✅ Admin user created successfully!');
    console.log('Email:', adminData.email);
    console.log('Password: your_secure_password');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
```

---

## 🔑 Admin Credentials

### Default Admin (Create this first):
- **Email**: `admin@gameon.com`
- **Password**: `GameOn@2024!` (Change immediately after first login)
- **Role**: Super Admin

### Security Recommendations:
1. **Strong Password**: Use at least 12 characters with mixed case, numbers, and symbols
2. **Unique Email**: Use a dedicated admin email address
3. **Regular Updates**: Change passwords regularly
4. **Two-Factor**: Consider implementing 2FA (future enhancement)

---

## 🛡️ Admin Panel Security Features

### ✅ Already Implemented:

1. **JWT Authentication**
   - Secure token-based authentication
   - Automatic token expiry
   - Refresh token mechanism

2. **Route Protection**
   - All admin routes require authentication
   - Automatic redirect to login for unauthenticated users
   - Protected API endpoints

3. **Session Management**
   - Secure token storage
   - Automatic logout on token expiry
   - Session validation on each request

4. **Password Security**
   - Bcrypt hashing with salt rounds
   - No plain text password storage
   - Secure password validation

---

## 🔧 Admin Management API Endpoints

Your backend should have these endpoints (verify they exist):

### Authentication:
- `POST /api/admin/auth/login` - Admin login
- `POST /api/admin/auth/logout` - Admin logout
- `GET /api/admin/auth/check` - Verify admin token

### Admin Management:
- `GET /api/admin/users` - List all admins
- `POST /api/admin/users` - Create new admin
- `PUT /api/admin/users/:id` - Update admin
- `DELETE /api/admin/users/:id` - Delete admin

---

## 🧪 Testing Admin Authentication

### 1. Test Login Endpoint:
```bash
curl -X POST https://gameon-backend.onrender.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gameon.com",
    "password": "your_password"
  }'
```

### 2. Test Protected Route:
```bash
curl -X GET https://gameon-backend.onrender.com/api/admin/auth/check \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Frontend Login Test:
1. Go to your admin panel URL
2. Try logging in with admin credentials
3. Verify you're redirected to dashboard
4. Check browser console for any errors

---

## 🔄 Admin User Management

### Creating Additional Admins:

```javascript
// Through your admin panel or API
const newAdmin = {
  email: 'manager@gameon.com',
  password: 'SecurePassword123!',
  name: 'Tournament Manager',
  role: 'manager', // or 'admin'
  permissions: ['tournaments', 'users'] // if you have role-based permissions
};
```

### Admin Roles (if implemented):
- **Super Admin**: Full access to everything
- **Admin**: Access to most features
- **Manager**: Limited access to specific features
- **Moderator**: Read-only access with some moderation tools

---

## 🚨 Security Best Practices

### Password Requirements:
- Minimum 8 characters (recommend 12+)
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Account Security:
- Regular password changes
- Monitor login attempts
- Log admin activities
- Implement account lockout after failed attempts

### Environment Security:
- Use strong JWT secrets
- Set appropriate token expiry times
- Use HTTPS in production
- Implement rate limiting

---

## 🔧 Troubleshooting Admin Access

### Common Issues:

1. **Can't Login**:
   - Verify admin user exists in database
   - Check password is correct
   - Ensure backend is running
   - Check network connectivity

2. **Token Issues**:
   - Verify JWT secret matches between frontend and backend
   - Check token expiry settings
   - Clear browser localStorage and try again

3. **API Connection**:
   - Verify API URLs in environment variables
   - Check CORS settings allow admin panel domain
   - Test API endpoints directly

4. **Database Connection**:
   - Verify MongoDB connection string
   - Check database permissions
   - Ensure admin collection exists

---

## 🔍 Admin Panel Access URLs

After deployment, access your admin panel at:

### Development:
- Local: `http://localhost:3001/login`

### Production:
- Vercel: `https://your-admin-panel.vercel.app/login`
- Custom Domain: `https://admin.yourdomain.com/login`

---

## 📋 Admin Setup Checklist

### Initial Setup:
- [ ] Create first admin user
- [ ] Test login functionality
- [ ] Verify all admin routes work
- [ ] Check API connections
- [ ] Test logout functionality

### Security Verification:
- [ ] Strong password set
- [ ] JWT tokens working
- [ ] Protected routes redirect properly
- [ ] Unauthorized access blocked
- [ ] Session management working

### Production Readiness:
- [ ] Admin panel deployed to Vercel
- [ ] Environment variables configured
- [ ] CORS allows admin panel domain
- [ ] SSL/HTTPS enabled
- [ ] Admin credentials documented securely

---

## 🆘 Emergency Admin Access

If you lose admin access:

1. **Database Direct Access**:
   - Connect directly to MongoDB
   - Reset admin password manually
   - Create new admin user

2. **Backend Script**:
   - Run admin creation script
   - Use database seeding scripts
   - Create temporary admin access

3. **Recovery Process**:
   ```bash
   # Reset admin password
   node reset-admin-password.js admin@gameon.com new_password
   
   # Create emergency admin
   node create-emergency-admin.js
   ```

---

## 🎯 Quick Commands

```bash
# Create admin user
node create-admin-user.js

# Test admin login
curl -X POST https://gameon-backend.onrender.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gameon.com","password":"your_password"}'

# Check admin users
node check-admin-users.js

# Deploy admin panel
cd admin-panel && vercel --prod
```

Your admin panel is now secure and ready for production use! 🔐