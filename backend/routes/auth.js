/**
 * Player Authentication Routes
 * Handles mobile OTP authentication and user registration for GameOn platform
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendOTP, verifyOTP } = require('../utils/otpService');

// Simple email/password login for testing
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists in database first
    let user = await User.findOne({ email });
    
    if (user && await user.comparePassword(password)) {
      // User exists and password matches
    } else if (email === 'gamonoffice04@gmail.com' && password === 'gamon@321') {
      // Fallback to hardcoded admin credentials
      // Create or find user
      let user = await User.findOne({ email });
      
      if (!user) {
        // Check if phone number already exists
        const existingPhoneUser = await User.findOne({ phone: '9876543210' });
        if (existingPhoneUser) {
          // Update existing user with admin email
          user = existingPhoneUser;
          user.email = 'gamonoffice04@gmail.com';
          user.username = 'GameOnAdmin';
          user.displayName = 'GameOn Admin';
          await user.save();
        } else {
          user = new User({
            username: 'GameOnAdmin',
            displayName: 'GameOn Admin',
            email: 'gamonoffice04@gmail.com',
            phone: '9876543210',
            password: 'gamon@321', // This will be hashed by the pre-save middleware
            isVerified: true,
            gameProfile: {
              bgmiId: 'ADMIN123456',
              bgmiName: 'GameOnAdmin'
            }
          });
          await user.save();
        }
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      res.json({
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
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    console.error('Login Error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Simple email/password registration for testing
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, gameProfile, agreeToTerms } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    if (!gameProfile || !gameProfile.bgmiName || !gameProfile.bgmiId) {
      return res.status(400).json({
        success: false,
        message: 'BGMI In-Game Name and Player ID are required'
      });
    }

    // Validate BGMI Player ID format
    if (!/^\d{9,10}$/.test(gameProfile.bgmiId)) {
      return res.status(400).json({
        success: false,
        message: 'BGMI Player ID must be 9-10 digits'
      });
    }

    if (!agreeToTerms) {
      return res.status(400).json({
        success: false,
        message: 'You must agree to the Terms & Conditions and Policies to register'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email },
        { username },
        { 'gameProfile.bgmiId': gameProfile.bgmiId }
      ]
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
      if (existingUser.username === username) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken'
        });
      }
      if (existingUser.gameProfile.bgmiId === gameProfile.bgmiId) {
        return res.status(400).json({
          success: false,
          message: 'BGMI Player ID is already registered'
        });
      }
    }

    // Create new user
    const user = new User({
      username,
      displayName: username,
      email,
      password,
      phone: '9' + Math.floor(Math.random() * 900000000 + 100000000).toString(), // Random valid Indian phone
      isVerified: true,
      gameProfile: {
        bgmiId: gameProfile.bgmiId,
        bgmiName: gameProfile.bgmiName
      }
    });

    // Accept all policies if user agreed to terms
    if (agreeToTerms) {
      await user.acceptPolicies('1.0');
    }
    
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Registration successful',
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
    console.error('Registration Error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || phone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number'
      });
    }

    // Send OTP
    const otpResponse = await sendOTP(phone);
    
    res.json({
      success: true,
      message: 'OTP sent successfully',
      session_id: otpResponse.session_id
    });
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP'
    });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone and OTP are required'
      });
    }

    // Verify OTP
    const isValid = await verifyOTP(phone, otp);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Find or create user
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({
        phone,
        username: `user_${Math.random().toString(36).substring(7)}`,
        walletBalance: 0,
        gameProfile: {
          level: 1,
          xp: 0,
          badges: []
        }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || '123456',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'OTP verified successfully',
      token,
      user: {
        _id: user._id,
        phone: user.phone,
        username: user.username,
        walletBalance: user.walletBalance,
        gameProfile: user.gameProfile
      }
    });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify OTP'
    });
  }
});

// Update policy acceptance
router.post('/accept-policies', async (req, res) => {
  try {
    const { userId, version = '1.0' } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.acceptPolicies(version);

    res.json({
      success: true,
      message: 'Policy acceptance updated successfully',
      policyAcceptance: user.policyAcceptance
    });
  } catch (error) {
    console.error('Policy acceptance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update policy acceptance'
    });
  }
});

module.exports = router;

