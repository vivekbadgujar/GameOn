/**
 * Push Notification Service
 * Handles cross-platform push notifications (Web + Mobile)
 */

class PushNotificationService {
  constructor() {
    this.isInitialized = false;
    this.deviceTokens = new Map(); // userId -> { web: [tokens], mobile: [tokens] }
    this.admin = null;
    this.init();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  init() {
    try {
      let admin;
      try {
        admin = require('firebase-admin');
        this.admin = admin;
      } catch (requireError) {
        console.warn('⚠️  firebase-admin not available - push notifications disabled');
        this.isInitialized = false;
        return;
      }

      // Initialize Firebase Admin SDK if not already initialized
      if (!admin.apps.length) {
        // For now, we'll use a placeholder - you'll need to add your Firebase config
        console.log('🔥 Firebase Admin SDK initialization placeholder');
        console.log('📝 Add your Firebase service account key to enable push notifications');
        
        // Uncomment and configure when you have Firebase setup:
        /*
        const serviceAccount = require('../config/firebase-service-account.json');
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: 'your-project-id'
        });
        */
      }
      
      this.isInitialized = true;
      console.log('✅ Push Notification Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Push Notification Service:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Register device token for user
   */
  registerDeviceToken(userId, token, platform = 'web') {
    if (!this.deviceTokens.has(userId)) {
      this.deviceTokens.set(userId, { web: [], mobile: [] });
    }

    const userTokens = this.deviceTokens.get(userId);
    
    // Add token if not already exists
    if (!userTokens[platform].includes(token)) {
      userTokens[platform].push(token);
      console.log(`📱 Registered ${platform} token for user ${userId}`);
    }

    // Clean up old tokens (keep only last 5 per platform)
    if (userTokens[platform].length > 5) {
      userTokens[platform] = userTokens[platform].slice(-5);
    }
  }

  /**
   * Unregister device token
   */
  unregisterDeviceToken(userId, token) {
    if (!this.deviceTokens.has(userId)) return;

    const userTokens = this.deviceTokens.get(userId);
    
    // Remove from both platforms
    userTokens.web = userTokens.web.filter(t => t !== token);
    userTokens.mobile = userTokens.mobile.filter(t => t !== token);

    console.log(`📱 Unregistered token for user ${userId}`);
  }

  /**
   * Send notification to specific user
   */
  async sendToUser(userId, notification, data = {}) {
    if (!this.isInitialized) {
      console.log('📝 Push notification would be sent to user:', userId, notification);
      return { success: false, reason: 'Service not initialized' };
    }

    const userTokens = this.deviceTokens.get(userId);
    if (!userTokens) {
      console.log(`📱 No tokens found for user ${userId}`);
      return { success: false, reason: 'No tokens found' };
    }

    const allTokens = [...userTokens.web, ...userTokens.mobile];
    if (allTokens.length === 0) {
      console.log(`📱 No active tokens for user ${userId}`);
      return { success: false, reason: 'No active tokens' };
    }

    try {
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
          icon: notification.icon || '/logo192.png'
        },
        data: {
          ...data,
          userId: userId.toString(),
          timestamp: new Date().toISOString()
        },
        tokens: allTokens
      };

      // For now, just log the notification
      console.log('📤 Would send notification:', message);
      
      // Uncomment when Firebase is configured:
      /*
      const response = await admin.messaging().sendMulticast(message);
      
      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(allTokens[idx]);
          }
        });
        
        // Remove failed tokens
        this.removeFailedTokens(userId, failedTokens);
      }
      
      console.log(`📤 Sent notification to user ${userId}: ${response.successCount}/${allTokens.length} successful`);
      return { success: true, successCount: response.successCount, failureCount: response.failureCount };
      */

      return { success: true, successCount: allTokens.length, failureCount: 0 };
    } catch (error) {
      console.error(`❌ Failed to send notification to user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendToUsers(userIds, notification, data = {}) {
    const results = await Promise.all(
      userIds.map(userId => this.sendToUser(userId, notification, data))
    );

    const successCount = results.filter(r => r.success).length;
    console.log(`📤 Bulk notification sent: ${successCount}/${userIds.length} successful`);
    
    return {
      success: successCount > 0,
      successCount,
      failureCount: userIds.length - successCount,
      results
    };
  }

  /**
   * Send tournament notification
   */
  async sendTournamentNotification(tournamentId, userIds, type, data = {}) {
    const notifications = {
      'tournament_started': {
        title: '🎮 Tournament Started!',
        body: `${data.tournamentTitle} has begun. Join now!`,
        icon: '/tournament-icon.png'
      },
      'tournament_ending_soon': {
        title: '⏰ Tournament Ending Soon',
        body: `${data.tournamentTitle} ends in ${data.timeLeft}`,
        icon: '/warning-icon.png'
      },
      'slot_available': {
        title: '🎯 Slot Available',
        body: `A slot opened in ${data.tournamentTitle}`,
        icon: '/slot-icon.png'
      },
      'tournament_result': {
        title: '🏆 Tournament Results',
        body: `Results for ${data.tournamentTitle} are out!`,
        icon: '/trophy-icon.png'
      },
      'payment_received': {
        title: '💰 Payment Received',
        body: `You received ₹${data.amount} for ${data.tournamentTitle}`,
        icon: '/money-icon.png'
      }
    };

    const notification = notifications[type] || {
      title: '🎮 GameOn Update',
      body: 'You have a new update',
      icon: '/logo192.png'
    };

    return await this.sendToUsers(userIds, notification, {
      type,
      tournamentId,
      ...data
    });
  }

  /**
   * Send wallet notification
   */
  async sendWalletNotification(userId, type, data = {}) {
    const notifications = {
      'wallet_credited': {
        title: '💰 Wallet Credited',
        body: `₹${data.amount} added to your wallet`,
        icon: '/wallet-icon.png'
      },
      'wallet_debited': {
        title: '💸 Wallet Debited',
        body: `₹${data.amount} deducted from your wallet`,
        icon: '/wallet-icon.png'
      },
      'low_balance': {
        title: '⚠️ Low Wallet Balance',
        body: `Your wallet balance is ₹${data.balance}. Recharge now!`,
        icon: '/warning-icon.png'
      },
      'payment_failed': {
        title: '❌ Payment Failed',
        body: 'Your payment could not be processed. Please try again.',
        icon: '/error-icon.png'
      }
    };

    const notification = notifications[type] || {
      title: '💰 Wallet Update',
      body: 'Your wallet has been updated',
      icon: '/wallet-icon.png'
    };

    return await this.sendToUser(userId, notification, {
      type,
      ...data
    });
  }

  /**
   * Send system notification
   */
  async sendSystemNotification(userIds, message, data = {}) {
    const notification = {
      title: '🎮 GameOn System',
      body: message,
      icon: '/logo192.png'
    };

    return await this.sendToUsers(userIds, notification, {
      type: 'system',
      ...data
    });
  }

  /**
   * Remove failed tokens
   */
  removeFailedTokens(userId, failedTokens) {
    if (!this.deviceTokens.has(userId)) return;

    const userTokens = this.deviceTokens.get(userId);
    
    failedTokens.forEach(token => {
      userTokens.web = userTokens.web.filter(t => t !== token);
      userTokens.mobile = userTokens.mobile.filter(t => t !== token);
    });

    console.log(`🧹 Removed ${failedTokens.length} failed tokens for user ${userId}`);
  }

  /**
   * Get user's registered tokens
   */
  getUserTokens(userId) {
    return this.deviceTokens.get(userId) || { web: [], mobile: [] };
  }

  /**
   * Get service statistics
   */
  getStats() {
    let totalWebTokens = 0;
    let totalMobileTokens = 0;
    let totalUsers = this.deviceTokens.size;

    this.deviceTokens.forEach(tokens => {
      totalWebTokens += tokens.web.length;
      totalMobileTokens += tokens.mobile.length;
    });

    return {
      totalUsers,
      totalWebTokens,
      totalMobileTokens,
      totalTokens: totalWebTokens + totalMobileTokens,
      isInitialized: this.isInitialized,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Test notification (for development)
   */
  async testNotification(userId) {
    return await this.sendToUser(userId, {
      title: '🧪 Test Notification',
      body: 'This is a test notification from GameOn!',
      icon: '/logo192.png'
    }, {
      type: 'test',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = PushNotificationService;