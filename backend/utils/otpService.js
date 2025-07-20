/**
 * OTP Service for GameOn Platform
 * Handles SMS-based OTP verification for user authentication
 */

// Simple OTP storage (replace with Redis in production)
const otpStore = new Map();

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP (mock implementation)
const sendOTP = async (phone) => {
  try {
    const otp = generateOTP();
    const session_id = Date.now().toString();
    
    // Store OTP with 5-minute expiry
    otpStore.set(phone, {
      otp,
      session_id,
      expires: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    // Log OTP for testing (remove in production)
    console.log(`[TEST MODE] OTP for ${phone}: ${otp}`);

    return {
      success: true,
      session_id
    };
  } catch (error) {
    console.error('Send OTP Error:', error);
    throw new Error('Failed to send OTP');
  }
};

// Verify OTP
const verifyOTP = async (phone, otp) => {
  try {
    const storedData = otpStore.get(phone);
    
    if (!storedData) {
      throw new Error('No OTP found for this number');
    }

    if (Date.now() > storedData.expires) {
      otpStore.delete(phone);
      throw new Error('OTP has expired');
    }

    if (storedData.otp !== otp) {
      throw new Error('Invalid OTP');
    }

    // Clear used OTP
    otpStore.delete(phone);

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
