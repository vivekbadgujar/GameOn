const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer for file uploads (screenshots, videos)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  }
});

// Submit cheat report
router.post('/report', upload.array('evidence', 5), async (req, res) => {
  try {
    const { 
      reporterId, 
      accusedUserId, 
      tournamentId, 
      cheatType, 
      description, 
      timestamp 
    } = req.body;
    
    // Validate required fields
    if (!reporterId || !accusedUserId || !cheatType || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: reporterId, accusedUserId, cheatType, description'
      });
    }
    
    // Process uploaded evidence files
    const evidenceFiles = req.files ? req.files.map(file => ({
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      uploadTime: new Date().toISOString()
      // In production, upload to cloud storage and store URLs
    })) : [];
    
    // Create cheat report
    const cheatReport = {
      id: 'report_' + Date.now(),
      reporterId,
      accusedUserId,
      tournamentId: tournamentId || null,
      cheatType,
      description,
      timestamp: timestamp || new Date().toISOString(),
      evidence: evidenceFiles,
      status: 'pending',
      priority: cheatType === 'aimbotting' ? 'high' : 'medium',
      createdAt: new Date().toISOString(),
      reviewedBy: null,
      reviewedAt: null,
      verdict: null,
      action: null
    };
    
    // Save to database
    // await CheatReport.create(cheatReport);
    
    // Notify moderators
    // await notifyModerators('new_cheat_report', cheatReport);
    
    res.status(201).json({
      success: true,
      message: 'Cheat report submitted successfully',
      data: {
        reportId: cheatReport.id,
        status: cheatReport.status,
        estimatedReviewTime: '24-48 hours'
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit cheat report', 
      error: err.message 
    });
  }
});

// Get cheat reports (admin/moderator only)
router.get('/reports', async (req, res) => {
  try {
    const { 
      status = 'all', 
      priority = 'all', 
      cheatType = 'all',
      page = 1, 
      limit = 20 
    } = req.query;
    
    // Mock cheat reports data
    const reports = [
      {
        id: 'report_1234567890',
        reporterId: 'user_001',
        reporterUsername: 'WatchfulPlayer',
        accusedUserId: 'user_002',
        accusedUsername: 'SuspiciousPlayer',
        tournamentId: 'tournament_123',
        tournamentName: 'Valorant Championship',
        cheatType: 'aimbotting',
        description: 'Player was hitting impossible shots through walls consistently',
        status: 'under_review',
        priority: 'high',
        createdAt: '2024-01-20T10:30:00Z',
        evidenceCount: 3,
        reviewedBy: 'moderator_001'
      },
      {
        id: 'report_1234567891',
        reporterId: 'user_003',
        reporterUsername: 'FairPlayAdvocate',
        accusedUserId: 'user_004',
        accusedUsername: 'QuestionableGamer',
        tournamentId: 'tournament_124',
        tournamentName: 'CS:GO Masters',
        cheatType: 'wallhack',
        description: 'Always knew where enemies were, suspicious pre-aiming',
        status: 'pending',
        priority: 'medium',
        createdAt: '2024-01-20T14:15:00Z',
        evidenceCount: 2,
        reviewedBy: null
      }
    ];
    
    res.json({
      success: true,
      message: 'Cheat reports retrieved successfully',
      data: {
        reports,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(45 / limit),
          totalReports: 45,
          limit: parseInt(limit)
        },
        summary: {
          pending: 12,
          under_review: 8,
          resolved: 25,
          high_priority: 5
        }
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve cheat reports', 
      error: err.message 
    });
  }
});

// Get specific cheat report details
router.get('/report/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    
    // Mock detailed report data
    const report = {
      id: reportId,
      reporterId: 'user_001',
      reporterProfile: {
        username: 'WatchfulPlayer',
        gamerTag: 'WP_Observer',
        reputation: 4.2,
        reportsSubmitted: 8,
        accurateReports: 6
      },
      accusedUserId: 'user_002',
      accusedProfile: {
        username: 'SuspiciousPlayer',
        gamerTag: 'SP_Question',
        accountAge: '3 months',
        previousReports: 2,
        tournamentsPlayed: 15,
        suspiciousStats: {
          unusualAccuracy: 95.5,
          impossibleReactionTimes: 12,
          wallbangPercentage: 78.3
        }
      },
      tournamentId: 'tournament_123',
      tournamentDetails: {
        name: 'Valorant Championship',
        date: '2024-01-20',
        prizePool: 5000,
        game: 'Valorant'
      },
      cheatType: 'aimbotting',
      description: 'Player was hitting impossible shots through walls consistently. Multiple instances of tracking players through walls and perfect headshot accuracy.',
      timestamp: '2024-01-20T15:30:00Z',
      evidence: [
        {
          type: 'screenshot',
          filename: 'suspicious_shot_1.png',
          uploadTime: '2024-01-20T15:32:00Z',
          url: '/evidence/report_1234567890/suspicious_shot_1.png'
        },
        {
          type: 'video',
          filename: 'aimbot_evidence.mp4',
          uploadTime: '2024-01-20T15:35:00Z',
          url: '/evidence/report_1234567890/aimbot_evidence.mp4'
        }
      ],
      status: 'under_review',
      priority: 'high',
      createdAt: '2024-01-20T10:30:00Z',
      reviewedBy: 'moderator_001',
      reviewedAt: '2024-01-20T16:00:00Z',
      moderatorNotes: 'Evidence is compelling. Requesting additional game logs for verification.',
      systemAnalysis: {
        suspiciousPatterns: ['unusually_high_accuracy', 'impossible_reaction_times'],
        confidence: 0.85,
        recommendedAction: 'temporary_ban'
      }
    };
    
    res.json({
      success: true,
      message: 'Cheat report details retrieved successfully',
      data: report
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve cheat report details', 
      error: err.message 
    });
  }
});

// Update cheat report status (moderator/admin only)
router.put('/report/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { 
      status, 
      verdict, 
      action, 
      moderatorNotes, 
      reviewedBy 
    } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'under_review', 'resolved', 'dismissed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: ' + validStatuses.join(', ')
      });
    }
    
    // Update report
    const updatedReport = {
      id: reportId,
      status: status || 'under_review',
      verdict: verdict || null,
      action: action || null,
      moderatorNotes: moderatorNotes || '',
      reviewedBy: reviewedBy || 'current_moderator',
      reviewedAt: new Date().toISOString()
    };
    
    // Save to database
    // await CheatReport.findByIdAndUpdate(reportId, updatedReport);
    
    // If action is taken, apply it to the user
    if (action) {
      // await applyUserAction(accusedUserId, action, reportId);
    }
    
    res.json({
      success: true,
      message: 'Cheat report updated successfully',
      data: updatedReport
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update cheat report', 
      error: err.message 
    });
  }
});

// Get user's cheat report history
router.get('/user/:userId/reports', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type = 'both' } = req.query; // 'reported', 'accused', or 'both'
    
    // Mock user report history
    const userReports = {
      submitted: [
        {
          id: 'report_001',
          accusedUsername: 'CheatPlayer1',
          cheatType: 'wallhack',
          status: 'resolved',
          verdict: 'guilty',
          submittedAt: '2024-01-15T10:00:00Z'
        }
      ],
      accused: [
        {
          id: 'report_002',
          reporterUsername: 'ReporterPlayer',
          cheatType: 'aimbotting',
          status: 'dismissed',
          verdict: 'not_guilty',
          reportedAt: '2024-01-10T14:30:00Z'
        }
      ],
      reputation: {
        reportAccuracy: 85.7, // Percentage of accurate reports
        falseReports: 1,
        verifiedReports: 6,
        timesReported: 3,
        cleanRecord: false
      }
    };
    
    res.json({
      success: true,
      message: 'User cheat report history retrieved successfully',
      data: userReports
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve user cheat report history', 
      error: err.message 
    });
  }
});

// Get anti-cheat statistics
router.get('/stats', async (req, res) => {
  try {
    // Mock anti-cheat statistics
    const stats = {
      totalReports: 1247,
      resolvedReports: 1032,
      pendingReports: 89,
      underReview: 126,
      accuracyRate: 76.8, // Percentage of reports that were accurate
      commonCheatTypes: [
        { type: 'aimbotting', count: 524, percentage: 42.1 },
        { type: 'wallhack', count: 312, percentage: 25.0 },
        { type: 'speed_hack', count: 198, percentage: 15.9 },
        { type: 'other', count: 213, percentage: 17.0 }
      ],
      actionstaken: {
        warnings: 156,
        temporary_bans: 298,
        permanent_bans: 87,
        account_suspensions: 42
      },
      averageReviewTime: '26.5 hours',
      falsReportRate: 23.2,
      topReporters: [
        { username: 'FairPlayGuardian', accurateReports: 45, accuracy: 94.2 },
        { username: 'CheatHunter', accurateReports: 38, accuracy: 89.5 }
      ]
    };
    
    res.json({
      success: true,
      message: 'Anti-cheat statistics retrieved successfully',
      data: stats
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to retrieve anti-cheat statistics', 
      error: err.message 
    });
  }
});

// System-generated suspicious activity detection
router.post('/detect', async (req, res) => {
  try {
    const { 
      userId, 
      tournamentId, 
      gameData, 
      performanceMetrics 
    } = req.body;
    
    if (!userId || !gameData) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, gameData'
      });
    }
    
    // Mock AI-based cheat detection analysis
    const analysis = {
      suspicionLevel: 0.73, // 0-1 scale
      detectedPatterns: [
        'unusual_accuracy_spike',
        'impossible_reaction_times',
        'suspicious_movement_patterns'
      ],
      confidence: 0.82,
      recommendedAction: 'flag_for_review',
      riskFactors: {
        accuracyAboveHuman: true,
        reactionTimeBelowHuman: true,
        perfectTracking: false,
        wallbangAccuracy: true
      },
      comparison: {
        playerAverage: 45.2,
        globalAverage: 38.7,
        humanLimit: 85.0,
        detectedValue: 94.8
      }
    };
    
    // If suspicion is high, create automatic report
    if (analysis.suspicionLevel > 0.7) {
      const autoReport = {
        id: 'auto_report_' + Date.now(),
        reporterId: 'system',
        accusedUserId: userId,
        tournamentId,
        cheatType: 'system_detected',
        description: 'Automatically flagged by anti-cheat system for suspicious gameplay patterns',
        status: 'pending',
        priority: analysis.confidence > 0.8 ? 'high' : 'medium',
        systemGenerated: true,
        analysisData: analysis
      };
      
      // Save auto-generated report
      // await CheatReport.create(autoReport);
    }
    
    res.json({
      success: true,
      message: 'Cheat detection analysis completed',
      data: {
        analysis,
        actionTaken: analysis.suspicionLevel > 0.7 ? 'auto_report_generated' : 'monitoring'
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to run cheat detection', 
      error: err.message 
    });
  }
});

module.exports = router;
