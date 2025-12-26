/**
 * Cashfree Payment Gateway Service
 * Handles payment processing for GameOn Platform
 */

const crypto = require('crypto');

class CashfreeService {
  constructor() {
    this._lastConfigStatus = null;
  }

  _getConfig() {
    const appId = process.env.CASHFREE_APP_ID;
    const secret = process.env.CASHFREE_SECRET || process.env.CASHFREE_SECRET_KEY;
    const environment = process.env.CASHFREE_ENVIRONMENT;

    if (!appId || typeof appId !== 'string' || appId.trim() === '') {
      return { ok: false, code: 'CASHFREE_NOT_CONFIGURED', message: 'Cashfree is not configured (CASHFREE_APP_ID missing)' };
    }
    if (!secret || typeof secret !== 'string' || secret.trim() === '') {
      return { ok: false, code: 'CASHFREE_NOT_CONFIGURED', message: 'Cashfree is not configured (CASHFREE_SECRET missing)' };
    }
    if (environment !== 'sandbox' && environment !== 'production') {
      return { ok: false, code: 'CASHFREE_NOT_CONFIGURED', message: 'Cashfree is not configured (CASHFREE_ENVIRONMENT must be sandbox | production)' };
    }

    return {
      ok: true,
      appId: appId.trim(),
      secret: secret.trim(),
      environment
    };
  }

  _getSdk() {
    try {
      return { ok: true, sdk: require('cashfree-pg') };
    } catch (error) {
      return {
        ok: false,
        code: 'CASHFREE_SDK_UNAVAILABLE',
        message: 'Cashfree SDK unavailable',
        error
      };
    }
  }

  _configureCashfree(Cashfree) {
    const cfg = this._getConfig();
    if (!cfg.ok) return cfg;

    try {
      Cashfree.XClientId = cfg.appId;
      Cashfree.XClientSecret = cfg.secret;
      Cashfree.XEnvironment = cfg.environment === 'production'
        ? Cashfree.Environment.PRODUCTION
        : Cashfree.Environment.SANDBOX;
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        code: 'CASHFREE_CONFIG_ERROR',
        message: 'Failed to configure Cashfree SDK',
        error
      };
    }
  }

  /**
   * Create a payment order
   * @param {Object} orderData - Order details
   * @returns {Promise<Object>} - Cashfree order response
   */
  async createOrder(orderData) {
    try {
      const sdkResult = this._getSdk();
      if (!sdkResult.ok) {
        return { success: false, code: sdkResult.code, message: sdkResult.message };
      }
      const { Cashfree } = sdkResult.sdk;

      const cfgResult = this._configureCashfree(Cashfree);
      if (!cfgResult.ok) {
        return { success: false, code: cfgResult.code, message: cfgResult.message };
      }

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
        return {
          success: false,
          code: 'CASHFREE_API_ERROR',
          message: 'Failed to create Cashfree order'
        };
      }
    } catch (error) {
      console.error('Cashfree create order error:', error);
      return {
        success: false,
        code: 'CASHFREE_API_ERROR',
        message: `Failed to create payment order: ${error.message}`
      };
    }
  }

  /**
   * Verify payment signature
   * @param {Object} paymentData - Payment verification data
   * @returns {boolean} - Verification result
   */
  verifyPayment(paymentData) {
    try {
      const cfg = this._getConfig();
      if (!cfg.ok) {
        return { success: false, code: cfg.code, message: cfg.message };
      }

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
        .createHmac('sha256', cfg.secret)
        .update(signatureData)
        .digest('base64');

      return { success: signature === expectedSignature };
    } catch (error) {
      console.error('Cashfree signature verification error:', error);
      return { success: false, code: 'CASHFREE_SIGNATURE_ERROR', message: 'Cashfree signature verification failed' };
    }
  }

  /**
   * Get payment details
   * @param {string} orderId - Cashfree order ID
   * @returns {Promise<Object>} - Payment details
   */
  async getPaymentDetails(orderId) {
    try {
      const sdkResult = this._getSdk();
      if (!sdkResult.ok) {
        return { success: false, code: sdkResult.code, message: sdkResult.message };
      }
      const { Cashfree } = sdkResult.sdk;

      const cfgResult = this._configureCashfree(Cashfree);
      if (!cfgResult.ok) {
        return { success: false, code: cfgResult.code, message: cfgResult.message };
      }

      const response = await Cashfree.PGOrderFetchPayments("2023-08-01", orderId);
      
      if (response.data) {
        return {
          success: true,
          data: response.data
        };
      } else {
        return { success: false, code: 'CASHFREE_API_ERROR', message: 'Failed to fetch payment details' };
      }
    } catch (error) {
      console.error('Cashfree get payment details error:', error);
      return {
        success: false,
        code: 'CASHFREE_API_ERROR',
        message: `Failed to get payment details: ${error.message}`
      };
    }
  }

  /**
   * Get order status
   * @param {string} orderId - Cashfree order ID
   * @returns {Promise<Object>} - Order status
   */
  async getOrderStatus(orderId) {
    try {
      const sdkResult = this._getSdk();
      if (!sdkResult.ok) {
        return { success: false, code: sdkResult.code, message: sdkResult.message };
      }
      const { Cashfree } = sdkResult.sdk;

      const cfgResult = this._configureCashfree(Cashfree);
      if (!cfgResult.ok) {
        return { success: false, code: cfgResult.code, message: cfgResult.message };
      }

      const response = await Cashfree.PGFetchOrder("2023-08-01", orderId);
      
      if (response.data) {
        return {
          success: true,
          data: response.data
        };
      } else {
        return { success: false, code: 'CASHFREE_API_ERROR', message: 'Failed to fetch order status' };
      }
    } catch (error) {
      console.error('Cashfree get order status error:', error);
      return {
        success: false,
        code: 'CASHFREE_API_ERROR',
        message: `Failed to get order status: ${error.message}`
      };
    }
  }

  /**
   * Process refund
   * @param {Object} refundData - Refund details
   * @returns {Promise<Object>} - Refund response
   */
  async processRefund(refundData) {
    try {
      const sdkResult = this._getSdk();
      if (!sdkResult.ok) {
        return { success: false, code: sdkResult.code, message: sdkResult.message };
      }
      const { Cashfree } = sdkResult.sdk;

      const cfgResult = this._configureCashfree(Cashfree);
      if (!cfgResult.ok) {
        return { success: false, code: cfgResult.code, message: cfgResult.message };
      }

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
        return { success: false, code: 'CASHFREE_API_ERROR', message: 'Failed to process refund' };
      }
    } catch (error) {
      console.error('Cashfree refund error:', error);
      return {
        success: false,
        code: 'CASHFREE_API_ERROR',
        message: `Failed to process refund: ${error.message}`
      };
    }
  }

  /**
   * Generate payment session for frontend
   * @param {Object} sessionData - Session data
   * @returns {Promise<Object>} - Payment session
   */
  async createPaymentSession(sessionData) {
    try {
      const sdkResult = this._getSdk();
      if (!sdkResult.ok) {
        return { success: false, code: sdkResult.code, message: sdkResult.message };
      }
      const { Cashfree } = sdkResult.sdk;

      const cfgResult = this._configureCashfree(Cashfree);
      if (!cfgResult.ok) {
        return { success: false, code: cfgResult.code, message: cfgResult.message };
      }

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
        return { success: false, code: 'CASHFREE_API_ERROR', message: 'Failed to create payment session' };
      }
    } catch (error) {
      console.error('Cashfree payment session error:', error);
      return {
        success: false,
        code: 'CASHFREE_API_ERROR',
        message: `Failed to create payment session: ${error.message}`
      };
    }
  }
}

module.exports = new CashfreeService();