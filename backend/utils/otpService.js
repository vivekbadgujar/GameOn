/**
 * OTP Service for GameOn Platform
 * Handles SMS-based OTP verification for user authentication
 */

const crypto = require('crypto');

// In-memory OTP storage (In production, use Redis or database)
const otpStore = new Map();

// Mock SMS service (replace with actual service like Twilio, MSG91, etc.)
const sendSMS = async (phone, message) => {
  try {
    // In development, just log the OTP
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 SMS to ${phone}: ${message}`);
      return { success: true, messageId: 'dev_' + Date.now() };
    }

    // In production, integrate with actual SMS service
    // Example with Twilio:
    /*
    const twilio = require('twilio');
    const client = twilio(process.env.SMS_API_KEY, process.env.SMS_API_SECRET);
    
    const result = await client.messages.create({
      body: message,
      from: process.env.SMS_FROM_NUMBER,
      to: phone
    });
    
    return { success: true, messageId: result.sid };
    */

    return { success: true, messageId: 'mock_' + Date.now() };
  } catch (error) {
    console.error('SMS sending error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate and send OTP
 * @param {string} phone - Mobile number
 * @param {string} purpose - OTP purpose (login, signup, etc.)
 * @returns {Object} Result object
 */
const generateAndSendOTP = async (phone, purpose = 'login') => {
  try {
    // Validate phone number
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      throw new Error('Invalid Indian mobile number');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiry time (5 minutes)
    const expiryTime = Date.now() + 5 * 60 * 1000;
    
    // Store OTP with metadata
    const otpData = {
      otp,
      phone,
      purpose,
      expiryTime,
      attempts: 0,
      createdAt: new Date()
    };
    
    otpStore.set(phone, otpData);
    
    // Prepare SMS message
    let message;
    switch (purpose) {
      case 'signup':
        message = `Welcome to GameOn! Your verification code is: ${otp}. Valid for 5 minutes. Don't share this code.`;
        break;
      case 'login':
        message = `Your GameOn login code is: ${otp}. Valid for 5 minutes. Don't share this code.`;
        break;
      case 'password_reset':
        message = `Your GameOn password reset code is: ${otp}. Valid for 5 minutes. Don't share this code.`;
        break;
      default:
        message = `Your GameOn verification code is: ${otp}. Valid for 5 minutes.`;
    }
    
    // Send SMS
    const smsResult = await sendSMS(phone, message);
    
    if (!smsResult.success) {
      throw new Error('Failed to send OTP');
    }
    
    return {
      success: true,
      message: 'OTP sent successfully',
      data: {
        phone,
        expiryTime,
        messageId: smsResult.messageId
      }
    };
    
  } catch (error) {
    console.error('Generate OTP error:', error);
    return {
      success: false,
      message: error.message || 'Failed to generate OTP'
    };
  }
};

/**
 * Verify OTP
 * @param {string} phone - Mobile number
 * @param {string} otp - OTP code to verify
 * @param {string} purpose - OTP purpose
 * @returns {Object} Verification result
 */
const verifyOTP = async (phone, otp, purpose = 'login') => {
  try {
    const storedOTP = otpStore.get(phone);
    
    if (!storedOTP) {
      return {
        success: false,
        message: 'OTP not found or expired'
      };
    }
    
    // Check if OTP is expired
    if (Date.now() > storedOTP.expiryTime) {
      otpStore.delete(phone);
      return {
        success: false,
        message: 'OTP has expired. Please request a new one.'
      };
    }
    
    // Check purpose match
    if (storedOTP.purpose !== purpose) {
      return {
        success: false,
        message: 'Invalid OTP purpose'
      };
    }
    
    // Increment attempt count
    storedOTP.attempts += 1;
    
    // Check max attempts (3 attempts allowed)
    if (storedOTP.attempts > 3) {
      otpStore.delete(phone);
      return {
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.'
      };
    }
    
    // Verify OTP
    if (storedOTP.otp !== otp) {
      otpStore.set(phone, storedOTP); // Update attempts count
      return {
        success: false,
        message: `Invalid OTP. ${4 - storedOTP.attempts} attempts remaining.`
      };
    }
    
    // OTP verified successfully
    otpStore.delete(phone);
    
    return {
      success: true,
      message: 'OTP verified successfully',
      data: {
        phone,
        verifiedAt: new Date()
      }
    };
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    return {
      success: false,
      message: 'OTP verification failed'
    };
  }
};

/**
 * Resend OTP with rate limiting
 * @param {string} phone - Mobile number
 * @param {string} purpose - OTP purpose
 * @returns {Object} Result object
 */
const resendOTP = async (phone, purpose = 'login') => {
  try {
    const storedOTP = otpStore.get(phone);
    
    // Rate limiting: Allow resend only after 1 minute
    if (storedOTP && (Date.now() - new Date(storedOTP.createdAt).getTime()) < 60000) {
      const waitTime = Math.ceil((60000 - (Date.now() - new Date(storedOTP.createdAt).getTime())) / 1000);
      return {
        success: false,
        message: `Please wait ${waitTime} seconds before requesting a new OTP`
      };
    }
    
    // Generate and send new OTP
    return await generateAndSendOTP(phone, purpose);
    
  } catch (error) {
    console.error('Resend OTP error:', error);
    return {
      success: false,
      message: 'Failed to resend OTP'
    };
  }
};

/**
 * Clean expired OTPs (run periodically)
 */
const cleanExpiredOTPs = () => {
  const now = Date.now();
  for (const [phone, otpData] of otpStore.entries()) {
    if (now > otpData.expiryTime) {
      otpStore.delete(phone);
    }
  }
};

// Clean expired OTPs every 5 minutes
setInterval(cleanExpiredOTPs, 5 * 60 * 1000);

module.exports = {
  generateAndSendOTP,
  verifyOTP,
  resendOTP,
  cleanExpiredOTPs
};
