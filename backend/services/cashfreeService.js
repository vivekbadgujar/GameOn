/**
 * Cashfree Payment Gateway Service
 * Handles payment processing for GameOn Platform
 */

const { Cashfree } = require('cashfree-pg');
const crypto = require('crypto');

class CashfreeService {
  constructor() {
    // Initialize Cashfree with environment variables
    if (process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY) {
      Cashfree.XClientId = process.env.CASHFREE_APP_ID;
      Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
      Cashfree.XEnvironment = process.env.CASHFREE_ENVIRONMENT === 'production' 
        ? Cashfree.Environment.PRODUCTION 
        : Cashfree.Environment.SANDBOX;
      
      this.isConfigured = true;
      console.log('✅ Cashfree Payment Gateway initialized');
    } else {
      this.isConfigured = false;
      console.log('⚠️  Cashfree not configured - missing credentials');
    }
  }

  /**
   * Create a payment order
   * @param {Object} orderData - Order details
   * @returns {Promise<Object>} - Cashfree order response
   */
  async createOrder(orderData) {
    if (!this.isConfigured) {
      throw new Error('Cashfree payment gateway is not configured');
    }

    try {
      const {
        orderId,
        amount,
        currency = 'INR',
        customerDetails,
        orderMeta = {},
        orderNote = ''
      } = orderData;

      const request = {
        order_id: orderId,
        order_amount: amount,
        order_currency: currency,
        customer_details: {
          customer_id: customerDetails.customerId,
          customer_name: customerDetails.customerName,
          customer_email: customerDetails.customerEmail,
          customer_phone: customerDetails.customerPhone
        },
        order_meta: orderMeta,
        order_note: orderNote
      };

      const response = await Cashfree.PGCreateOrder("2023-08-01", request);
      
      if (response.data) {
        return {
          success: true,
          data: response.data
        };
      } else {
        throw new Error('Failed to create Cashfree order');
      }
    } catch (error) {
      console.error('Cashfree create order error:', error);
      throw new Error(`Failed to create payment order: ${error.message}`);
    }
  }

  /**
   * Verify payment signature
   * @param {Object} paymentData - Payment verification data
   * @returns {boolean} - Verification result
   */
  verifyPayment(paymentData) {
    try {
      const {
        orderId,
        orderAmount,
        referenceId,
        txStatus,
        paymentMode,
        txMsg,
        txTime,
        signature
      } = paymentData;

      // Create signature string as per Cashfree documentation
      const signatureData = `${orderId}${orderAmount}${referenceId}${txStatus}${paymentMode}${txMsg}${txTime}`;
      
      // Generate signature using secret key
      const expectedSignature = crypto
        .createHmac('sha256', process.env.CASHFREE_SECRET_KEY)
        .update(signatureData)
        .digest('base64');

      return signature === expectedSignature;
    } catch (error) {
      console.error('Cashfree signature verification error:', error);
      return false;
    }
  }

  /**
   * Get payment details
   * @param {string} orderId - Cashfree order ID
   * @returns {Promise<Object>} - Payment details
   */
  async getPaymentDetails(orderId) {
    if (!this.isConfigured) {
      throw new Error('Cashfree payment gateway is not configured');
    }

    try {
      const response = await Cashfree.PGOrderFetchPayments("2023-08-01", orderId);
      
      if (response.data) {
        return {
          success: true,
          data: response.data
        };
      } else {
        throw new Error('Failed to fetch payment details');
      }
    } catch (error) {
      console.error('Cashfree get payment details error:', error);
      throw new Error(`Failed to get payment details: ${error.message}`);
    }
  }

  /**
   * Get order status
   * @param {string} orderId - Cashfree order ID
   * @returns {Promise<Object>} - Order status
   */
  async getOrderStatus(orderId) {
    if (!this.isConfigured) {
      throw new Error('Cashfree payment gateway is not configured');
    }

    try {
      const response = await Cashfree.PGFetchOrder("2023-08-01", orderId);
      
      if (response.data) {
        return {
          success: true,
          data: response.data
        };
      } else {
        throw new Error('Failed to fetch order status');
      }
    } catch (error) {
      console.error('Cashfree get order status error:', error);
      throw new Error(`Failed to get order status: ${error.message}`);
    }
  }

  /**
   * Process refund
   * @param {Object} refundData - Refund details
   * @returns {Promise<Object>} - Refund response
   */
  async processRefund(refundData) {
    if (!this.isConfigured) {
      throw new Error('Cashfree payment gateway is not configured');
    }

    try {
      const {
        orderId,
        refundId,
        refundAmount,
        refundNote = 'Tournament refund'
      } = refundData;

      const request = {
        refund_id: refundId,
        refund_amount: refundAmount,
        refund_note: refundNote
      };

      const response = await Cashfree.PGOrderCreateRefund("2023-08-01", orderId, request);
      
      if (response.data) {
        return {
          success: true,
          data: response.data
        };
      } else {
        throw new Error('Failed to process refund');
      }
    } catch (error) {
      console.error('Cashfree refund error:', error);
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }

  /**
   * Generate payment session for frontend
   * @param {Object} sessionData - Session data
   * @returns {Promise<Object>} - Payment session
   */
  async createPaymentSession(sessionData) {
    if (!this.isConfigured) {
      throw new Error('Cashfree payment gateway is not configured');
    }

    try {
      const {
        orderId,
        returnUrl = `${process.env.FRONTEND_URL}/payment/success`,
        notifyUrl = `${process.env.API_BASE_URL}/api/payments/webhook`
      } = sessionData;

      const request = {
        payment_session_id: orderId,
        order_id: orderId
      };

      const response = await Cashfree.PGPaymentSessionDetails("2023-08-01", request);
      
      if (response.data) {
        return {
          success: true,
          data: {
            ...response.data,
            payment_session_id: response.data.payment_session_id,
            order_id: orderId
          }
        };
      } else {
        throw new Error('Failed to create payment session');
      }
    } catch (error) {
      console.error('Cashfree payment session error:', error);
      throw new Error(`Failed to create payment session: ${error.message}`);
    }
  }
}

module.exports = new CashfreeService();