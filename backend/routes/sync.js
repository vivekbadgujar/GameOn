/**
 * Sync API Routes
 * Handles cross-platform synchronization
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

/**
 * GET /api/sync/status
 * Get sync service status and user's active sessions
 */
router.get('/status', auth, async (req, res) => {
  try {
    const syncService = req.app.get('syncService');
    const userId = req.user.id;

    const userSessions = syncService.getUserSockets(userId);
    const platforms = syncService.getUserPlatforms(userId);
    const isOnline = syncService.isUserOnline(userId);

    res.json({
      success: true,
      data: {
        userId,
        isOnline,
        activeSessions: userSessions.length,
        platforms,
        lastSync: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Sync status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sync status'
    });
  }
});

/**
 * GET /api/sync/stats
 * Get platform-wide sync statistics (admin only)
 */
router.get('/stats', auth, async (req, res) => {
  try {
    // TODO: Add admin check
    const syncService = req.app.get('syncService');
    const pushService = req.app.get('pushNotificationService');

    const syncStats = syncService.getStats();
    const pushStats = pushService.getStats();

    res.json({
      success: true,
      data: {
        sync: syncStats,
        pushNotifications: pushStats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Sync stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sync stats'
    });
  }
});

/**
 * POST /api/sync/register-device
 * Register device for push notifications
 */
router.post('/register-device', auth, async (req, res) => {
  try {
    const { token, platform = 'web' } = req.body;
    const userId = req.user.id;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Device token is required'
      });
    }

    const pushService = req.app.get('pushNotificationService');
    pushService.registerDeviceToken(userId, token, platform);

    res.json({
      success: true,
      message: 'Device registered successfully',
      data: {
        userId,
        platform,
        registered: true
      }
    });
  } catch (error) {
    console.error('Device registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register device'
    });
  }
});

/**
 * DELETE /api/sync/unregister-device
 * Unregister device from push notifications
 */
router.delete('/unregister-device', auth, async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Device token is required'
      });
    }

    const pushService = req.app.get('pushNotificationService');
    pushService.unregisterDeviceToken(userId, token);

    res.json({
      success: true,
      message: 'Device unregistered successfully',
      data: {
        userId,
        unregistered: true
      }
    });
  } catch (error) {
    console.error('Device unregistration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unregister device'
    });
  }
});

/**
 * POST /api/sync/test-notification
 * Send test notification (development only)
 */
router.post('/test-notification', auth, async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Test notifications not available in production'
      });
    }

    const userId = req.user.id;
    const pushService = req.app.get('pushNotificationService');

    const result = await pushService.testNotification(userId);

    res.json({
      success: true,
      message: 'Test notification sent',
      data: result
    });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification'
    });
  }
});

/**
 * GET /api/sync/user-sessions
 * Get user's active sessions across platforms
 */
router.get('/user-sessions', auth, async (req, res) => {
  try {
    const syncService = req.app.get('syncService');
    const userId = req.user.id;

    const sessions = syncService.getUserSockets(userId);
    const platforms = syncService.getUserPlatforms(userId);
    
    const sessionDetails = sessions.map(socketId => {
      const userInfo = syncService.getUserInfo(socketId);
      return {
        socketId,
        platform: userInfo?.platform,
        connectedAt: userInfo?.connectedAt,
        lastSeen: userInfo?.lastSeen
      };
    });

    res.json({
      success: true,
      data: {
        userId,
        totalSessions: sessions.length,
        platforms,
        sessions: sessionDetails
      }
    });
  } catch (error) {
    console.error('User sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user sessions'
    });
  }
});

/**
 * POST /api/sync/force-sync
 * Force sync user data across all sessions
 */
router.post('/force-sync', auth, async (req, res) => {
  try {
    const { type = 'user_data', data = {} } = req.body;
    const userId = req.user.id;
    const syncService = req.app.get('syncService');

    const syncId = syncService.syncUserUpdate(userId, `force_${type}`, {
      ...data,
      forced: true,
      requestedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Force sync initiated',
      data: {
        syncId,
        type,
        userId
      }
    });
  } catch (error) {
    console.error('Force sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate force sync'
    });
  }
});

module.exports = router;