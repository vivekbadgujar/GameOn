/**
 * Player Authentication Routes
 * Handles mobile OTP authentication and user registration for GameOn platform
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { generateAndSendOTP, verifyOTP, resendOTP } = require('../utils/otpService');
const { processReferralBonus } = require('../utils/razorpayUtils');

const router = express.Router();

// Rate limiting for OTP requests
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 OTP requests per IP
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again later.'
  }
});

// Send OTP for Registration/Login
router.post('/send-otp', 
  otpLimiter,
  [
    body('phone')
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Please provide a valid Indian mobile number'),
    body('purpose')
      .isIn(['signup', 'login'])
      .withMessage('Purpose must be either signup or login')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { phone, purpose } = req.body;

      // For login, check if user exists
      if (purpose === 'login') {
        const existingUser = await User.findOne({ phone });
        if (!existingUser) {
          return res.status(404).json({
            success: false,
            message: 'User not found. Please sign up first.'
          });
        }
      }

      // For signup, check if user already exists
      if (purpose === 'signup') {
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: 'User already exists. Please login instead.'
          });
        }
      }

      // Send OTP
      const otpResult = await generateAndSendOTP(phone, purpose);
      
      if (!otpResult.success) {
        return res.status(500).json(otpResult);
      }

      res.json({
        success: true,
        message: `OTP sent successfully to +91${phone}`,
        data: {
          phone: `+91${phone}`,
          expiryTime: otpResult.data.expiryTime
        }
      });

    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP'
      });
    }
  }
);

// Resend OTP
router.post('/resend-otp',
  otpLimiter,
  [
    body('phone')
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Please provide a valid Indian mobile number'),
    body('purpose')
      .isIn(['signup', 'login'])
      .withMessage('Purpose must be either signup or login')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { phone, purpose } = req.body;
      
      const otpResult = await resendOTP(phone, purpose);
      
      if (!otpResult.success) {
        return res.status(400).json(otpResult);
      }

      res.json({
        success: true,
        message: 'OTP resent successfully',
        data: {
          phone: `+91${phone}`,
          expiryTime: otpResult.data.expiryTime
        }
      });

    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to resend OTP'
      });
    }
  }
);

// User Registration with OTP Verification
router.post('/register',
  [
    body('phone')
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Please provide a valid Indian mobile number'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits'),
    body('username')
      .isLength({ min: 3, max: 20 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username must be 3-20 characters and contain only letters, numbers, and underscores'),
    body('displayName')
      .isLength({ min: 2, max: 30 })
      .withMessage('Display name must be 2-30 characters'),
    body('bgmiId')
      .notEmpty()
      .withMessage('BGMI ID is required'),
    body('bgmiName')
      .notEmpty()
      .withMessage('BGMI name is required'),
    body('referralCode')
      .optional()
      .isLength({ min: 6, max: 10 })
      .withMessage('Invalid referral code')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        phone, otp, username, displayName, 
        bgmiId, bgmiName, referralCode,
        college, dateOfBirth, gender
      } = req.body;

      // Verify OTP
      const otpResult = await verifyOTP(phone, otp, 'signup');
      if (!otpResult.success) {
        return res.status(400).json(otpResult);
      }

      // Check if username or BGMI ID already exists
      const existingUser = await User.findOne({
        $or: [
          { username },
          { 'gameProfile.bgmiId': bgmiId }
        ]
      });

      if (existingUser) {
        const field = existingUser.username === username ? 'Username' : 'BGMI ID';
        return res.status(409).json({
          success: false,
          message: `${field} already exists. Please choose a different one.`
        });
      }

      // Handle referral code
      let referredBy = null;
      if (referralCode) {
        const referrer = await User.findOne({ 'referral.code': referralCode.toUpperCase() });
        if (referrer) {
          referredBy = referrer._id;
        } else {
          return res.status(400).json({
            success: false,
            message: 'Invalid referral code'
          });
        }
      }

      // Create new user
      const userData = {
        phone,
        username,
        displayName,
        gameProfile: {
          bgmiId,
          bgmiName,
          tier: 'Bronze',
          level: 1
        },
        isVerified: true,
        'referral.referredBy': referredBy
      };

      // Add optional fields
      if (college) {
        userData.college = typeof college === 'string' ? { name: college } : college;
      }
      if (dateOfBirth) userData.dateOfBirth = new Date(dateOfBirth);
      if (gender) userData.gender = gender;

      const user = new User(userData);
      await user.save();

      // Process referral bonus
      if (referredBy) {
        try {
          await processReferralBonus(referredBy, user._id);
          
          // Update referrer's referral stats
          await User.findByIdAndUpdate(referredBy, {
            $push: {
              'referral.referredUsers': {
                user: user._id,
                dateReferred: new Date(),
                rewardClaimed: true
              }
            },
            $inc: {
              'referral.totalReferrals': 1,
              'referral.referralEarnings': 20
            }
          });
        } catch (referralError) {
          console.error('Referral processing error:', referralError);
          // Don't fail registration if referral processing fails
        }
      }

      // Generate JWT token
      const token = generateToken(user._id, '30d');

      // Add welcome badge
      user.addBadge({
        name: 'Welcome Warrior',
        description: 'Joined the GameOn community',
        icon: 'welcome',
        category: 'special'
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful! Welcome to GameOn!',
        data: {
          user: {
            id: user._id,
            username: user.username,
            displayName: user.displayName,
            phone: `+91${user.phone}`,
            gameProfile: user.gameProfile,
            stats: user.stats,
            wallet: user.wallet,
            badges: user.badges,
            referralCode: user.referral.code
          },
          token,
          referralBonus: referredBy ? 20 : 0
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        const friendlyField = field === 'username' ? 'Username' : 
                             field === 'phone' ? 'Phone number' : 
                             field.includes('bgmiId') ? 'BGMI ID' : 'Field';
        return res.status(409).json({
          success: false,
          message: `${friendlyField} already exists`
        });
      }

      res.status(500).json({
        success: false,
        message: 'Registration failed due to server error'
      });
    }
  }
);

// User Login with OTP
router.post('/login',
  [
    body('phone')
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Please provide a valid Indian mobile number'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { phone, otp } = req.body;

      // Verify OTP
      const otpResult = await verifyOTP(phone, otp, 'login');
      if (!otpResult.success) {
        return res.status(400).json(otpResult);
      }

      // Find user
      const user = await User.findOne({ phone });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found. Please register first.'
        });
      }

      // Check user status
      if (user.status === 'banned') {
        return res.status(403).json({
          success: false,
          message: 'Your account has been banned. Contact support for more information.'
        });
      }

      if (user.status === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'Your account is temporarily suspended.'
        });
      }

      // Update login information
      user.security.lastLogin = new Date();
      const clientIP = req.ip || req.connection.remoteAddress;
      if (!user.security.ipAddresses.includes(clientIP)) {
        user.security.ipAddresses.push(clientIP);
        if (user.security.ipAddresses.length > 10) {
          user.security.ipAddresses = user.security.ipAddresses.slice(-10);
        }
      }
      await user.save();

      // Generate JWT token
      const token = generateToken(user._id, '30d');

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            username: user.username,
            displayName: user.displayName,
            phone: `+91${user.phone}`,
            avatar: user.avatar,
            gameProfile: user.gameProfile,
            stats: user.stats,
            wallet: user.wallet,
            badges: user.badges,
            referralCode: user.referral.code,
            subscription: user.subscription
          },
          token
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed due to server error'
      });
    }
  }
);

// Get User Profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          username: req.user.username,
          displayName: req.user.displayName,
          phone: `+91${req.user.phone}`,
          email: req.user.email,
          avatar: req.user.avatar,
          dateOfBirth: req.user.dateOfBirth,
          gender: req.user.gender,
          gameProfile: req.user.gameProfile,
          college: req.user.college,
          location: req.user.location,
          stats: req.user.stats,
          wallet: req.user.wallet,
          badges: req.user.badges,
          referral: {
            code: req.user.referral.code,
            totalReferrals: req.user.referral.totalReferrals,
            referralEarnings: req.user.referral.referralEarnings
          },
          subscription: req.user.subscription,
          preferences: req.user.preferences,
          rank: req.user.rank,
          createdAt: req.user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a more sophisticated setup, you might maintain a token blacklist
    // For now, just send success response as the frontend will remove the token
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// Verify Token
router.get('/verify-token', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        userId: req.user._id,
        username: req.user.username,
        isVerified: req.user.isVerified
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

module.exports = router;

