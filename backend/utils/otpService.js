/**
 * OTP Service for GameOn Platform
 * Handles SMS-based OTP verification for user authentication
 */

const crypto = require('crypto');

// OTP configuration
const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY: 5 * 60 * 1000, // 5 minutes
  MAX_ATTEMPTS: 3,
  COOLDOWN: 60 * 1000 // 1 minute
};

// Store for rate limiting and OTP attempts (replace with Redis in production)
const otpStore = new Map();
const rateLimitStore = new Map();

// Generate a cryptographically secure OTP
const generateOTP = () => {
  const buffer = crypto.randomBytes(3); // 3 bytes = 6 digits
  const otp = parseInt(buffer.toString('hex'), 16).toString().slice(0, OTP_CONFIG.LENGTH);
  return otp.padStart(OTP_CONFIG.LENGTH, '0');
};

// Check rate limiting
const checkRateLimit = (phone) => {
  const now = Date.now();
  const lastAttempt = rateLimitStore.get(phone);
  
  if (lastAttempt && (now - lastAttempt) < OTP_CONFIG.COOLDOWN) {
    throw new Error(`Please wait ${Math.ceil((OTP_CONFIG.COOLDOWN - (now - lastAttempt)) / 1000)} seconds before requesting another OTP`);
  }
  
  rateLimitStore.set(phone, now);
};

// Send OTP
const sendOTP = async (phone) => {
  try {
    // Validate phone number
    if (!phone.match(/^[6-9]\d{9}$/)) {
      throw new Error('Invalid phone number format');
    }

    // Check rate limiting
    checkRateLimit(phone);

    const otp = generateOTP();
    const session_id = crypto.randomBytes(16).toString('hex');
    
    // Store OTP with expiry and attempts
    otpStore.set(phone, {
      otp,
      session_id,
      expires: Date.now() + OTP_CONFIG.EXPIRY,
      attempts: 0
    });

    // Log OTP for development (remove in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV MODE] OTP for ${phone}: ${otp}`);
    }

    // TODO: Integrate with actual SMS service
    // await sendSMS(phone, `Your GameOn verification code is: ${otp}. Valid for 5 minutes.`);

    return {
      success: true,
      session_id,
      expiresIn: OTP_CONFIG.EXPIRY / 1000
    };
  } catch (error) {
    console.error('Send OTP Error:', error);
    throw error;
  }
};

// Verify OTP
const verifyOTP = async (phone, otp) => {
  try {
    const storedData = otpStore.get(phone);
    
    if (!storedData) {
      throw new Error('No active OTP found for this number. Please request a new one.');
    }

    // Check expiry
    if (Date.now() > storedData.expires) {
      otpStore.delete(phone);
      throw new Error('OTP has expired. Please request a new one.');
    }

    // Check attempts
    if (storedData.attempts >= OTP_CONFIG.MAX_ATTEMPTS) {
      otpStore.delete(phone);
      throw new Error('Too many invalid attempts. Please request a new OTP.');
    }

    // Increment attempts
    storedData.attempts++;
    otpStore.set(phone, storedData);

    // Verify OTP
    if (storedData.otp !== otp) {
      const remainingAttempts = OTP_CONFIG.MAX_ATTEMPTS - storedData.attempts;
      throw new Error(`Invalid OTP. ${remainingAttempts} attempts remaining.`);
    }

    // Clear used OTP
    otpStore.delete(phone);
    rateLimitStore.delete(phone);

    return true;
  } catch (error) {
    console.error('Verify OTP Error:', error);
    throw error;
  }
};

module.exports = {
  sendOTP,
  verifyOTP
};
