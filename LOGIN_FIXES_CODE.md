# 🔧 Login Fixes - Corrected Backend Code

## ✅ FIXED CODE SECTIONS

---

## 1. CORS CONFIGURATION (backend/server.js)

**Location:** Around line 28-37 and 202-222

**Replace the allowedOrigins array and CORS configuration with:**

```javascript
// Canonical production origins (no localhost fallbacks anywhere)
const allowedOrigins = [
  'https://gameonesport.xyz',
  'https://admin.gameonesport.xyz'
];

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // allow server-to-server/health checks
  return allowedOrigins.includes(origin.replace(/\/$/, ''));
};

// ... (keep existing code) ...

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, origin);
    }
    
    // Reject origin not in allowed list
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Set-Cookie', 'Content-Type'],
  maxAge: 86400
};
```

---

## 2. JWT TOKEN GENERATION FUNCTION (backend/middleware/auth.js)

**Location:** Around line 206-209

**Replace the generateToken function with:**

```javascript
// Generate JWT Token
const generateToken = (userId, expiresIn = '7d') => {
  // CRITICAL: Validate JWT_SECRET exists
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
    throw new Error('JWT secret missing');
  }
  
  return jwt.sign({ userId }, process.env.JWT_SECRET.trim(), { expiresIn });
};
```

---

## 3. USER LOGIN CONTROLLER (backend/routes/auth.js)

**Location:** Around line 133-249 (the `/login` route)

**Replace the entire login route handler with:**

```javascript
// Simple email/password login for testing
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check if user exists in database first
    let user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User does not exist'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(401).json({
        success: false,
        message: 'Account is temporarily locked. Please try again later.'
      });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    
    if (!isValidPassword) {
      // Increment login attempts
      await user.incrementLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // CRITICAL: Check JWT_SECRET exists
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
      console.error('[USER LOGIN] ❌ CRITICAL: JWT_SECRET environment variable is NOT set');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error - authentication service unavailable'
      });
    }

    // Generate token
    let token;
    try {
      token = jwt.sign(
        { userId: user._id.toString(), email: user.email },
        process.env.JWT_SECRET.trim(),
        { expiresIn: '7d' }
      );
    } catch (tokenError) {
      console.error('[USER LOGIN] ❌ TOKEN ERROR:', tokenError);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate authentication token'
      });
    }

    // Set secure HTTP-only cookie for user token (Vercel serverless compatible)
    try {
      const cookieOptions = {
        httpOnly: true,
        secure: true, // Required for HTTPS
        sameSite: 'None', // Required for cross-site cookies
        domain: '.gameonesport.xyz', // Leading dot for all subdomains
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        path: '/' // Root path
      };
      res.cookie('gameon_user_token', token, cookieOptions);
      console.log('[USER LOGIN] Cookie set successfully with options:', cookieOptions);
    } catch (cookieError) {
      console.error('[USER LOGIN] Cookie error (non-fatal):', cookieError.message);
      // Continue - token is in response body
    }

    // Update last login time
    await User.updateOne(
      { _id: user._id },
      { $set: { 'security.lastLogin': new Date() } }
    );

    return res.json({
      success: true,
      message: 'Login successful',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        gameProfile: user.gameProfile,
        wallet: user.wallet,
        stats: user.stats,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});
```

---

## 4. ADMIN LOGIN CONTROLLER (backend/routes/admin/auth.js)

**Location:** Around line 28-302 (the `/login` route)

**Replace the entire admin login route handler with:**

```javascript
// Admin Login
router.post('/login', 
  loginLimiter, // Re-enabled with relaxed limits for development
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
  ],
  async (req, res) => {
    const startTime = Date.now();
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('Admin login validation failed:', errors.array());
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password, rememberMe = false } = req.body;
      
      console.log('[ADMIN LOGIN] Attempt started for:', email);

      // Find admin by email
      let admin;
      try {
        admin = await Admin.findOne({ 
          email: email.toLowerCase(),
          status: 'active'
        });
        console.log('[ADMIN LOGIN] Admin lookup result:', admin ? 'Found' : 'Not found');
      } catch (dbError) {
        console.error('[ADMIN LOGIN] Database error during admin lookup:', dbError.message);
        return res.status(500).json({
          success: false,
          message: 'Database error during authentication'
        });
      }

      if (!admin) {
        console.warn('[ADMIN LOGIN] Admin not found for email:', email);
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if account is locked BEFORE password comparison
      if (admin.isLocked) {
        console.warn('[ADMIN LOGIN] Account locked for:', email);
        return res.status(423).json({
          success: false,
          message: 'Account is temporarily locked due to multiple failed login attempts'
        });
      }

      // Check if email is verified (for new admins)
      if (!admin.isEmailVerified && admin.role !== 'super_admin') {
        console.warn('[ADMIN LOGIN] Email not verified for:', email);
        return res.status(403).json({
          success: false,
          message: 'Email not verified. Please contact super admin.'
        });
      }

      // Now compare password
      let passwordMatch;
      try {
        console.log('[ADMIN LOGIN] Starting password comparison...');
        passwordMatch = await admin.comparePassword(password);
        console.log('[ADMIN LOGIN] Password comparison result:', passwordMatch);

        if (!passwordMatch) {
          // Check if password is plaintext (not hashed with bcrypt)
          if (admin.password && !admin.password.startsWith('$2')) {
            console.error('[ADMIN LOGIN] ⚠️ WARNING: Password in database appears to be plaintext (not bcrypt hashed)');
            console.error('[ADMIN LOGIN] Admin:', email);
            console.error('[ADMIN LOGIN] MANUAL INTERVENTION REQUIRED: Password needs to be hashed before login can work');
            // Still fail the login
            await admin.incrementLoginAttempts();
            return res.status(401).json({
              success: false,
              message: 'Invalid credentials'
            });
          }
          
          await admin.incrementLoginAttempts();
          return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
          });
        }
      } catch (bcryptError) {
        console.error('[ADMIN LOGIN] Error during password comparison:', bcryptError.message);
        console.error('[ADMIN LOGIN] Error stack:', bcryptError.stack);
        await admin.incrementLoginAttempts();
        return res.status(500).json({
          success: false,
          message: 'Authentication service error'
        });
      }

      // Reset login attempts on successful password match
      try {
        await admin.resetLoginAttempts();
        console.log('[ADMIN LOGIN] Login attempts reset for:', email);
      } catch (resetError) {
        console.error('[ADMIN LOGIN] Error resetting login attempts:', resetError.message);
      }

      // Update last activity and track IP
      try {
        admin.lastActivity = new Date();
        
        // Track IP address
        const clientIP = req.ip || req.connection.remoteAddress;
        if (!admin.ipAddresses) {
          admin.ipAddresses = [];
        }
        if (!admin.ipAddresses.includes(clientIP)) {
          admin.ipAddresses.push(clientIP);
          if (admin.ipAddresses.length > 10) {
            admin.ipAddresses = admin.ipAddresses.slice(-10);
          }
        }
        
        await admin.save();
        console.log('[ADMIN LOGIN] Admin profile updated for:', email);
      } catch (updateError) {
        console.error('[ADMIN LOGIN] Error updating admin profile:', updateError.message);
      }

      // Generate JWT token with 7 days expiry
      const tokenExpiry = rememberMe ? '30d' : '7d';
      
      // CRITICAL: Check JWT_SECRET exists and is valid
      if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
        console.error('[ADMIN LOGIN] ❌ CRITICAL: JWT_SECRET environment variable is NOT set or is empty');
        console.error('[ADMIN LOGIN] Full error stack:', new Error().stack);
        return res.status(500).json({
          success: false,
          message: 'Server configuration error - authentication service unavailable'
        });
      }

      // CRITICAL: Ensure admin._id exists before token generation
      if (!admin || !admin._id) {
        console.error('[ADMIN LOGIN] ❌ CRITICAL: Admin or admin._id is missing');
        console.error('[ADMIN LOGIN] Admin object:', admin ? 'exists' : 'null');
        return res.status(500).json({
          success: false,
          message: 'Authentication error - invalid admin data'
        });
      }

      let accessToken;
      try {
        // Explicitly use jwt.sign with proper error handling
        accessToken = jwt.sign(
          { userId: admin._id.toString() }, // Ensure _id is string
          process.env.JWT_SECRET.trim(), // Trim whitespace
          { expiresIn: tokenExpiry }
        );
        console.log('[ADMIN LOGIN] Access token generated successfully with expiry:', tokenExpiry);
      } catch (tokenError) {
        console.error('[ADMIN LOGIN] ❌ ADMIN TOKEN ERROR:', tokenError);
        console.error('[ADMIN LOGIN] Error stack:', tokenError.stack);
        console.error('[ADMIN LOGIN] Error details:', {
          name: tokenError.name,
          message: tokenError.message,
          code: tokenError.code,
          adminId: admin?._id,
          jwtSecretLength: process.env.JWT_SECRET?.length
        });
        return res.status(500).json({
          success: false,
          message: 'Failed to generate authentication token'
        });
      }

      // Generate refresh token only if JWT_REFRESH_SECRET is available
      let refreshToken = null;
      if (process.env.JWT_REFRESH_SECRET) {
        try {
          refreshToken = jwt.sign(
            { userId: admin._id, type: 'refresh' }, 
            process.env.JWT_REFRESH_SECRET, 
            { expiresIn: '30d' }
          );
          console.log('[ADMIN LOGIN] Refresh token generated');
        } catch (refreshError) {
          console.error('[ADMIN LOGIN] Error generating refresh token:', refreshError.message);
        }
      }

      // Set secure HTTP-only cookie for main admin token (Vercel serverless compatible)
      try {
        const cookieOptions = {
          httpOnly: true,
          secure: true, // Required for HTTPS
          sameSite: 'None', // Required for cross-site cookies
          domain: '.gameonesport.xyz', // Leading dot for all subdomains
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
          path: '/' // Root path
        };

        res.cookie('gameon_admin_token', accessToken, cookieOptions);
        console.log('[ADMIN LOGIN] gameon_admin_token cookie set with options:', {
          httpOnly: cookieOptions.httpOnly,
          secure: cookieOptions.secure,
          sameSite: cookieOptions.sameSite,
          domain: cookieOptions.domain,
          maxAge: cookieOptions.maxAge,
          path: cookieOptions.path
        });
      } catch (cookieError) {
        console.error('[ADMIN LOGIN] Error setting main cookie:', cookieError.message);
        console.error('[ADMIN LOGIN] Cookie error stack:', cookieError.stack);
        // Don't fail login if cookie fails - token is still in response body
      }

      // Set secure HTTP-only cookie for refresh token (only if available)
      if (refreshToken) {
        try {
          res.cookie('adminRefreshToken', refreshToken, {
            httpOnly: true,
            secure: true, // Required for HTTPS
            sameSite: 'None',
            domain: '.gameonesport.xyz', // Leading dot for all subdomains
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            path: '/'
          });
          console.log('[ADMIN LOGIN] adminRefreshToken cookie set');
        } catch (refreshCookieError) {
          console.error('[ADMIN LOGIN] Error setting refresh token cookie:', refreshCookieError.message);
        }
      }

      console.log('[ADMIN LOGIN] ✅ Login successful for:', email, '| Duration:', Date.now() - startTime, 'ms');

      res.json({
        success: true,
        message: 'Login successful',
        token: accessToken,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
          avatar: admin.avatar,
          department: admin.department
        }
      });

    } catch (error) {
      console.error('[ADMIN LOGIN] ❌ FATAL LOGIN ERROR:', error.message);
      console.error('[ADMIN LOGIN] Error type:', error.constructor.name);
      console.error('[ADMIN LOGIN] Error stack:', error.stack);
      console.error('[ADMIN LOGIN] Request email:', req.body?.email);
      
      res.status(500).json({
        success: false,
        message: 'Login failed due to server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);
```

---

## 5. REQUIRED ENVIRONMENT VARIABLES FOR VERCEL

Add these to your Vercel project settings (Environment Variables):

```env
# JWT Configuration (REQUIRED)
JWT_SECRET=your-very-long-and-secure-random-string-here-minimum-32-characters

# Optional (for refresh tokens)
JWT_REFRESH_SECRET=another-very-long-and-secure-random-string-here

# Database (REQUIRED)
MONGODB_URI=your-mongodb-connection-string
# OR
DATABASE_URL=your-mongodb-connection-string

# Environment
NODE_ENV=production

# Serverless Detection (Vercel sets this automatically)
VERCEL=1
```

### 🔑 How to Generate JWT_SECRET:

Run this command in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and use it as your `JWT_SECRET` value.

---

## 📋 SUMMARY OF CHANGES

1. ✅ **CORS Configuration**: Updated to allow only `https://gameonesport.xyz` and `https://admin.gameonesport.xyz` with `credentials: true`

2. ✅ **Cookie Settings**: 
   - Changed domain from `gameonesport.xyz` to `.gameonesport.xyz` (with leading dot)
   - Ensured all required attributes: `SameSite: "None"`, `Secure: true`, `HttpOnly: true`, `Path: "/"`, `Max-Age: 7 days`

3. ✅ **JWT Secret Validation**: Added proper validation that throws readable errors if `JWT_SECRET` is missing

4. ✅ **User Login Controller**: Fixed cookie settings and JWT validation

5. ✅ **Admin Login Controller**: Fixed cookie settings and JWT validation

---

## 🚀 DEPLOYMENT STEPS

1. **Update the code files** with the corrected sections above
2. **Set environment variables** in Vercel dashboard
3. **Deploy to Vercel** (automatic on git push, or manual deploy)
4. **Test login** on both frontend and admin panel

---

## 🧪 TESTING CHECKLIST

- [ ] Frontend login at `https://gameonesport.xyz` sets cookie correctly
- [ ] Admin login at `https://admin.gameonesport.xyz` sets cookie correctly
- [ ] Cookies persist for 7 days
- [ ] Cookies work across subdomains (`.gameonesport.xyz`)
- [ ] JWT token generation works with valid `JWT_SECRET`
- [ ] Error messages are clear when `JWT_SECRET` is missing
- [ ] CORS allows requests from both domains

---

## ⚠️ IMPORTANT NOTES

- **Domain with leading dot**: `.gameonesport.xyz` (not `gameonesport.xyz`) - this allows cookies to work across all subdomains
- **SameSite: "None"**: Required for cross-site cookies (frontend and API on different subdomains)
- **Secure: true**: Required for HTTPS (always true in production)
- **JWT_SECRET**: Must be set in Vercel environment variables before deployment
