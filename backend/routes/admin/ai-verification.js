/**
 * Admin AI Verification Routes
 * Handles AI-based screenshot verification and flagging
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AIFlag = require('../../models/AIFlag');
const Screenshot = require('../../models/Screenshot');
const { authenticateAdmin, requirePermission } = require('../../middleware/adminAuth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/screenshots');
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'screenshot-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Middleware to protect all admin AI verification routes
router.use(authenticateAdmin);

// Get all AI flags with pagination and filtering
router.get('/flags', requirePermission('ai_verification_manage'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Build filter based on query parameters
    const filter = {};
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.tournamentId) {
      filter.tournamentId = req.query.tournamentId;
    }
    
    if (req.query.userId) {
      filter.userId = req.query.userId;
    }
    
    // Execute query with pagination
    const flags = await AIFlag.find(filter)
      .populate('userId', 'name gameID email')
      .populate('tournamentId', 'title')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get total count for pagination
    const total = await AIFlag.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        flags,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching AI flags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI flags',
      error: error.message
    });
  }
});

// Get a specific AI flag by ID
router.get('/flags/:id', requirePermission('ai_verification_manage'), async (req, res) => {
  try {
    const flag = await AIFlag.findById(req.params.id)
      .populate('userId', 'name gameID email')
      .populate('tournamentId', 'title')
      .populate('reviewedBy', 'name');
    
    if (!flag) {
      return res.status(404).json({
        success: false,
        message: 'AI flag not found'
      });
    }
    
    // Get related screenshots
    const screenshots = await Screenshot.find({ flagId: flag._id });
    
    res.json({
      success: true,
      data: {
        flag,
        screenshots
      }
    });
  } catch (error) {
    console.error('Error fetching AI flag details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI flag details',
      error: error.message
    });
  }
});

// Review and update an AI flag
router.put('/flags/:id', 
  requirePermission('ai_verification_manage'),
  [
    body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Status must be pending, approved, or rejected'),
    body('adminNotes').optional().isString().withMessage('Admin notes must be a string')
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      const flagId = req.params.id;
      const { status, adminNotes } = req.body;
      
      const flag = await AIFlag.findById(flagId);
      
      if (!flag) {
        return res.status(404).json({
          success: false,
          message: 'AI flag not found'
        });
      }
      
      // Update flag status
      flag.status = status;
      flag.adminNotes = adminNotes || flag.adminNotes;
      flag.reviewedBy = req.admin._id;
      flag.reviewedAt = new Date();
      
      await flag.save();
      
      // If flag is rejected, we might need to take additional actions
      // such as disqualifying the user from the tournament
      if (status === 'rejected' && req.body.disqualifyUser && flag.tournamentId) {
        // This would call the disqualify user endpoint
        // For now, we'll just log it
        console.log(`User ${flag.userId} should be disqualified from tournament ${flag.tournamentId}`);
      }
      
      res.json({
        success: true,
        message: `AI flag marked as ${status}`,
        data: flag
      });
    } catch (error) {
      console.error('Error updating AI flag:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update AI flag',
        error: error.message
      });
    }
  }
);

// Upload and analyze a screenshot
router.post('/analyze-screenshot', 
  requirePermission('ai_verification_manage'),
  upload.single('screenshot'),
  [
    body('tournamentId').optional().isMongoId().withMessage('Invalid tournament ID'),
    body('userId').optional().isMongoId().withMessage('Invalid user ID'),
    body('matchId').optional().isString().withMessage('Match ID must be a string')
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No screenshot uploaded'
        });
      }
      
      const { tournamentId, userId, matchId, description } = req.body;
      
      // Save screenshot information
      const screenshot = new Screenshot({
        path: req.file.path,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        tournamentId,
        userId,
        matchId,
        uploadedBy: req.admin._id,
        description
      });
      
      await screenshot.save();
      
      // Here we would call the AI service to analyze the screenshot
      // For now, we'll simulate an AI analysis result
      const aiAnalysisResult = simulateAIAnalysis(req.file.path);
      
      // If AI detects potential issues, create a flag
      if (aiAnalysisResult.potentialIssues) {
        const flag = new AIFlag({
          userId,
          tournamentId,
          matchId,
          reason: aiAnalysisResult.reason,
          confidence: aiAnalysisResult.confidence,
          detectedIssues: aiAnalysisResult.detectedIssues,
          status: 'pending',
          createdBy: 'ai-system'
        });
        
        await flag.save();
        
        // Link the screenshot to the flag
        screenshot.flagId = flag._id;
        await screenshot.save();
        
        return res.status(201).json({
          success: true,
          message: 'Screenshot analyzed and flagged for review',
          data: {
            screenshot,
            aiAnalysis: aiAnalysisResult,
            flag
          }
        });
      }
      
      res.status(201).json({
        success: true,
        message: 'Screenshot analyzed successfully',
        data: {
          screenshot,
          aiAnalysis: aiAnalysisResult
        }
      });
    } catch (error) {
      console.error('Error analyzing screenshot:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze screenshot',
        error: error.message
      });
    }
  }
);

// Helper function to simulate AI analysis
// In a real implementation, this would call an AI service or ML model
function simulateAIAnalysis(imagePath) {
  // This is just a placeholder for demonstration
  // In a real implementation, this would use computer vision APIs or ML models
  
  // Randomly determine if there are issues (for demo purposes)
  const hasIssues = Math.random() > 0.7;
  
  if (hasIssues) {
    return {
      potentialIssues: true,
      confidence: Math.random() * 0.5 + 0.5, // 0.5 to 1.0
      reason: 'Potential rule violation detected',
      detectedIssues: [
        {
          type: 'unauthorized_software',
          confidence: Math.random() * 0.5 + 0.5,
          description: 'Detected potential unauthorized software in the game screen'
        }
      ],
      processingTime: Math.random() * 1000 + 500 // 500-1500ms
    };
  }
  
  return {
    potentialIssues: false,
    confidence: Math.random() * 0.3 + 0.7, // 0.7 to 1.0
    reason: 'No issues detected',
    detectedIssues: [],
    processingTime: Math.random() * 1000 + 500 // 500-1500ms
  };
}

module.exports = router;