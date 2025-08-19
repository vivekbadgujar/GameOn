/**
 * Cashfree Payment Service for Frontend
 * Handles Cashfree Checkout integration
 */

import config from '../config';

class CashfreeService {
  constructor() {
    this.appId = config.CASHFREE_APP_ID;
    this.environment = config.CASHFREE_ENVIRONMENT;
    this.isProduction = this.environment === 'production';
    
    // Load Cashfree SDK
    this.loadCashfreeSDK();
  }

  /**
   * Load Cashfree SDK dynamically
   */
  loadCashfreeSDK() {
    return new Promise((resolve, reject) => {
      // Check if SDK is already loaded
      if (window.Cashfree) {
        resolve(window.Cashfree);
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = this.isProduction 
        ? 'https://sdk.cashfree.com/js/v3/cashfree.js'
        : 'https://sdk.cashfree.com/js/v3/cashfree.sandbox.js';
      
      script.onload = () => {
        if (window.Cashfree) {
          resolve(window.Cashfree);
        } else {
          reject(new Error('Cashfree SDK failed to load'));
        }
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Cashfree SDK'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Initialize Cashfree checkout
   * @param {Object} paymentData - Payment configuration
   * @returns {Promise} - Cashfree checkout instance
   */
  async initializeCheckout(paymentData) {
    try {
      await this.loadCashfreeSDK();
      
      const {
        paymentSessionId,
        orderId,
        returnUrl = `${window.location.origin}/payment/success`,
        notifyUrl
      } = paymentData;

      const checkoutOptions = {
        paymentSessionId: paymentSessionId,
        returnUrl: returnUrl,
        ...(notifyUrl && { notifyUrl })
      };

      return window.Cashfree.checkout(checkoutOptions);
    } catch (error) {
      console.error('Cashfree checkout initialization error:', error);
      throw new Error('Failed to initialize payment checkout');
    }
  }

  /**
   * Process wallet top-up payment
   * @param {number} amount - Amount to top-up
   * @param {Function} onSuccess - Success callback
   * @param {Function} onFailure - Failure callback
   */
  async processWalletTopup(amount, onSuccess, onFailure) {
    try {
      // Create order via API
      const response = await fetch(`${config.API_BASE_URL}/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'INR'
        })
      });

      const orderData = await response.json();

      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create payment order');
      }

      // Initialize checkout
      const checkout = await this.initializeCheckout({
        paymentSessionId: orderData.data.paymentSessionId,
        orderId: orderData.data.orderId,
        returnUrl: `${window.location.origin}/wallet?payment=success`
      });

      // Handle payment result
      checkout.then((result) => {
        if (result.error) {
          console.error('Payment failed:', result.error);
          if (onFailure) onFailure(result.error);
        } else {
          console.log('Payment successful:', result);
          if (onSuccess) onSuccess(result);
        }
      });

    } catch (error) {
      console.error('Wallet topup error:', error);
      if (onFailure) onFailure(error);
    }
  }

  /**
   * Process tournament entry payment
   * @param {Object} tournamentData - Tournament payment data
   * @param {Function} onSuccess - Success callback
   * @param {Function} onFailure - Failure callback
   */
  async processTournamentPayment(tournamentData, onSuccess, onFailure) {
    try {
      const {
        tournamentId,
        joinType,
        squadMembers,
        gameProfile
      } = tournamentData;

      // Create tournament order via API
      const response = await fetch(`${config.API_BASE_URL}/payments/create-tournament-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          tournamentId,
          joinType,
          squadMembers
        })
      });

      const orderData = await response.json();

      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create tournament payment order');
      }

      // Initialize checkout
      const checkout = await this.initializeCheckout({
        paymentSessionId: orderData.data.paymentSessionId,
        orderId: orderData.data.orderId,
        returnUrl: `${window.location.origin}/tournaments/${tournamentId}?payment=success`
      });

      // Handle payment result
      checkout.then(async (result) => {
        if (result.error) {
          console.error('Tournament payment failed:', result.error);
          if (onFailure) onFailure(result.error);
        } else {
          console.log('Tournament payment successful:', result);
          
          // Verify payment on backend
          try {
            const verifyResponse = await fetch(`${config.API_BASE_URL}/payments/verify-tournament`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                ...result.paymentDetails,
                tournamentId,
                joinType,
                squadMembers,
                gameProfile
              })
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
              if (onSuccess) onSuccess(verifyData);
            } else {
              throw new Error(verifyData.message || 'Payment verification failed');
            }
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError);
            if (onFailure) onFailure(verifyError);
          }
        }
      });

    } catch (error) {
      console.error('Tournament payment error:', error);
      if (onFailure) onFailure(error);
    }
  }

  /**
   * Verify payment status
   * @param {string} orderId - Order ID to verify
   * @returns {Promise<Object>} - Payment verification result
   */
  async verifyPayment(orderId) {
    try {
      const response = await fetch(`${config.API_BASE_URL}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ orderId })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  }

  /**
   * Get payment methods available
   * @returns {Array} - Available payment methods
   */
  getAvailablePaymentMethods() {
    return [
      { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
      { id: 'netbanking', name: 'Net Banking', icon: '🏦' },
      { id: 'upi', name: 'UPI', icon: '📱' },
      { id: 'wallet', name: 'Wallet', icon: '👛' }
    ];
  }

  /**
   * Format amount for display
   * @param {number} amount - Amount in rupees
   * @returns {string} - Formatted amount
   */
  formatAmount(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }
}

export default new CashfreeService();