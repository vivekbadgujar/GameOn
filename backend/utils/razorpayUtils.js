const Razorpay = require('razorpay');
require('dotenv').config();

// Initialize Razorpay only if keys are provided
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
} else {
  console.log('⚠️  Razorpay keys not provided - payment features will be disabled');
}

const createOrder = async (amount, currency = 'INR') => {
  try {
    if (!razorpay) {
      throw new Error('Razorpay is not configured');
    }
    
    const options = {
      amount: amount * 100, // Convert to paise
      currency,
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1
    };
    
    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    throw error;
  }
};

const verifyPayment = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  try {
    const crypto = require('crypto');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return expectedSignature === razorpaySignature;
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
};

module.exports = {
  razorpay,
  createOrder,
  verifyPayment
};