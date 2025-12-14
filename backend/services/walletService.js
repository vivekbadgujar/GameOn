/**
 * Wallet Service
 * Handles all wallet operations with proper Transaction model integration
 * Ensures wallet balance and Transaction records are always in sync
 */

const User = require('../models/User');
const Transaction = require('../models/Transaction');

class WalletService {
  /**
   * Get wallet balance for a user
   */
  static async getBalance(userId) {
    try {
      const user = await User.findById(userId).select('wallet');
      if (!user) {
        throw new Error('User not found');
      }
      return user.wallet?.balance || 0;
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      throw error;
    }
  }

  /**
   * Add amount to wallet (for deposits, winnings, etc.)
   * Creates Transaction record and updates wallet balance
   */
  static async addToWallet(userId, amount, type, options = {}) {
    try {
      const {
        description,
        tournamentId,
        razorpayOrderId,
        razorpayPaymentId,
        referenceId,
        metadata = {}
      } = options;

      if (!amount || amount <= 0) {
        throw new Error('Invalid amount');
      }

      // Get user and lock for update
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Initialize wallet if needed
      if (!user.wallet) {
        user.wallet = {
          balance: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          pendingAmount: 0
        };
      }

      const balanceBefore = user.wallet.balance || 0;
      const balanceAfter = balanceBefore + amount;

      // Create transaction record
      const transaction = new Transaction({
        user: userId,
        transactionId: Transaction.generateTransactionId(),
        type: type,
        amount: amount,
        status: 'completed',
        currency: 'INR',
        description: description || `Wallet credit: ${type}`,
        tournament: tournamentId || null,
        razorpayOrderId: razorpayOrderId || null,
        razorpayPaymentId: razorpayPaymentId || null,
        walletBalance: {
          before: balanceBefore,
          after: balanceAfter
        },
        paymentGateway: razorpayOrderId ? {
          provider: 'razorpay',
          gatewayOrderId: razorpayOrderId,
          gatewayTransactionId: razorpayPaymentId || null
        } : undefined,
        metadata: {
          ...metadata,
          referenceId: referenceId || null
        }
      });

      // Update wallet balance
      user.wallet.balance = balanceAfter;
      
      // Update deposit totals for deposit types
      if (type === 'deposit' || type === 'wallet_topup') {
        user.wallet.totalDeposits = (user.wallet.totalDeposits || 0) + amount;
      }

      // Update stats for tournament winnings
      if (type === 'tournament_win' || type === 'tournament_prize') {
        user.stats.totalEarnings = (user.stats.totalEarnings || 0) + amount;
      }

      // Save transaction and user in parallel
      await Promise.all([
        transaction.save(),
        user.save()
      ]);

      return {
        transaction,
        newBalance: balanceAfter,
        user
      };
    } catch (error) {
      console.error('Error adding to wallet:', error);
      throw error;
    }
  }

  /**
   * Deduct amount from wallet (for tournament entry, withdrawals, etc.)
   * Creates Transaction record and updates wallet balance
   */
  static async deductFromWallet(userId, amount, type, options = {}) {
    try {
      const {
        description,
        tournamentId,
        referenceId,
        metadata = {}
      } = options;

      if (!amount || amount <= 0) {
        throw new Error('Invalid amount');
      }

      // Get user and lock for update
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Initialize wallet if needed
      if (!user.wallet) {
        user.wallet = {
          balance: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          pendingAmount: 0
        };
      }

      const balanceBefore = user.wallet.balance || 0;

      // Check sufficient balance
      if (balanceBefore < amount) {
        throw new Error(`Insufficient wallet balance. Required: ₹${amount}, Available: ₹${balanceBefore}`);
      }

      const balanceAfter = balanceBefore - amount;

      // Create transaction record
      const transaction = new Transaction({
        user: userId,
        transactionId: Transaction.generateTransactionId(),
        type: type,
        amount: amount,
        status: 'completed',
        currency: 'INR',
        description: description || `Wallet debit: ${type}`,
        tournament: tournamentId || null,
        walletBalance: {
          before: balanceBefore,
          after: balanceAfter
        },
        paymentGateway: {
          provider: 'wallet'
        },
        metadata: {
          ...metadata,
          referenceId: referenceId || null
        }
      });

      // Update wallet balance
      user.wallet.balance = balanceAfter;

      // Update withdrawal totals for withdrawal types
      if (type === 'withdrawal') {
        user.wallet.totalWithdrawals = (user.wallet.totalWithdrawals || 0) + amount;
        user.wallet.pendingAmount = (user.wallet.pendingAmount || 0) + amount;
      }

      // Save transaction and user in parallel
      await Promise.all([
        transaction.save(),
        user.save()
      ]);

      return {
        transaction,
        newBalance: balanceAfter,
        user
      };
    } catch (error) {
      console.error('Error deducting from wallet:', error);
      throw error;
    }
  }

  /**
   * Get wallet transactions for a user
   */
  static async getTransactions(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        type = null,
        status = null
      } = options;

      return await Transaction.getUserTransactionHistory(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        type,
        status
      });
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw error;
    }
  }

  /**
   * Check if user has sufficient balance
   */
  static async hasSufficientBalance(userId, amount) {
    try {
      const balance = await this.getBalance(userId);
      return balance >= amount;
    } catch (error) {
      console.error('Error checking balance:', error);
      return false;
    }
  }

  /**
   * Calculate amount needed to top up wallet for a specific purchase
   */
  static async calculateTopUpNeeded(userId, requiredAmount) {
    try {
      const balance = await this.getBalance(userId);
      const needed = Math.max(0, requiredAmount - balance);
      return {
        currentBalance: balance,
        requiredAmount: requiredAmount,
        needed: needed,
        hasSufficient: balance >= requiredAmount
      };
    } catch (error) {
      console.error('Error calculating top-up needed:', error);
      throw error;
    }
  }
}

module.exports = WalletService;
