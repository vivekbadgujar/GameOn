/**
 * Cashfree Payment Utilities
 * Simplified wrapper functions for Cashfree integration with SSR safety
 */

import cashfreeService from '../services/cashfreeService';

/**
 * Load Cashfree SDK script with SSR safety
 * @returns {Promise<boolean>} - True if loaded successfully
 */
export const loadScript = async (src) => {
  try {
    // SSR safety check
    if (typeof window === 'undefined') {
      console.warn('Cannot load Cashfree SDK during SSR');
      return false;
    }

    await cashfreeService.initializeSDK();
    return true;
  } catch (error) {
    console.error('Failed to load Cashfree SDK:', error);
    return false;
  }
};

/**
 * Initiate Cashfree payment for tournament with SSR safety
 * @param {Object} paymentData - Payment configuration
 * @returns {Promise<Object>} - Payment result
 */
export const initiateCashfreePayment = async (paymentData) => {
  return new Promise((resolve, reject) => {
    // SSR safety check
    if (typeof window === 'undefined') {
      reject(new Error('Payment can only be initiated on client side'));
      return;
    }

    cashfreeService.processTournamentPayment(
      paymentData,
      (result) => resolve(result),
      (error) => reject(error)
    );
  });
};

/**
 * Verify payment status
 * @param {string} orderId - Order ID to verify
 * @returns {Promise<Object>} - Verification result
 */
export const verifyPayment = async (orderId) => {
  return cashfreeService.verifyPayment(orderId);
};

/**
 * Format amount for display
 * @param {number} amount - Amount in rupees
 * @returns {string} - Formatted amount
 */
export const formatAmount = (amount) => {
  return cashfreeService.formatAmount(amount);
};

/**
 * Get available payment methods
 * @returns {Array} - Available payment methods
 */
export const getPaymentMethods = () => {
  return cashfreeService.getAvailablePaymentMethods();
};

export default {
  loadScript,
  initiateCashfreePayment,
  verifyPayment,
  formatAmount,
  getPaymentMethods
};