const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Media = require('../../models/Media');
const { authenticateAdmin, requirePermission, auditLog } = require('../../middleware/adminAuth');
const router = express.Router();

// Middleware to protect all admin media routes
router.use(authenticateAdmin);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/media');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|avi|mov|webm|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image, video, and document files are allowed'));
    }
  }
});

// Get all media files
router.get('/', 
  requirePermission('media_manage'),
  async (req, res) => {
    try {
      const { type, status, page = 1, limit = 10 } = req.query;
      
      const filter = {};
      if (type) filter.type = type;
      if (status) filter.status = status;
      
      const skip = (page - 1) * limit;
      
      const mediaFiles = await Media.find(filter)
        .populate('uploadedBy', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
      
      const total = await Media.countDocuments(filter);
      
      res.json({
        success: true,
        data: mediaFiles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching media files:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch media files'
      });
    }
  }
);

// Upload media file
router.post('/upload', 
  requirePermission('media_manage'),
  upload.single('file'),
  auditLog('upload_media'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const { tags, description, category } = req.body;
      
      // Determine file type
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      let fileType = 'document';
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(fileExtension)) {
        fileType = 'image';
      } else if (['.mp4', '.avi', '.mov', '.webm'].includes(fileExtension)) {
        fileType = 'video';
      }
      
      // Create media record
      const media = new Media({
        filename: req.file.filename,
        originalName: req.file.originalname,
        type: fileType,
        size: req.file.size,
        url: `/uploads/media/${req.file.filename}`,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        description,
        category,
        uploadedBy: req.admin._id,
        status: 'active'
      });
      
      await media.save();
      
      // Emit Socket.IO event for real-time updates
      req.app.get('io').emit('mediaUploaded', {
        id: media._id,
        filename: media.filename,
        type: media.type,
        url: media.url
      });
      
      res.json({
        success: true,
        message: 'Media uploaded successfully',
        data: media
      });
    } catch (error) {
      console.error('Error uploading media:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload media'
      });
    }
  }
);

// Get media file by ID
router.get('/:id', 
  requirePermission('media_manage'),
  async (req, res) => {
    try {
      const media = await Media.findById(req.params.id)
        .populate('uploadedBy', 'username email')
        .lean();
      
      if (!media) {
        return res.status(404).json({
          success: false,
          message: 'Media file not found'
        });
      }
      
      res.json({
        success: true,
        data: media
      });
    } catch (error) {
      console.error('Error fetching media file:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch media file'
      });
    }
  }
);

// Update media file
router.put('/:id', 
  requirePermission('media_manage'),
  [
    body('filename').optional().isString().withMessage('Filename must be a string'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('status').optional().isIn(['active', 'inactive', 'archived']).withMessage('Invalid status'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('category').optional().isString().withMessage('Category must be a string')
  ],
  auditLog('update_media'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { filename, tags, status, description, category } = req.body;
      const media = await Media.findById(req.params.id);
      
      if (!media) {
        return res.status(404).json({
          success: false,
          message: 'Media file not found'
        });
      }
      
      if (filename) media.filename = filename;
      if (tags) media.tags = tags;
      if (status) media.status = status;
      if (description) media.description = description;
      if (category) media.category = category;
      
      await media.save();
      
      res.json({
        success: true,
        message: 'Media file updated successfully',
        data: media
      });
    } catch (error) {
      console.error('Error updating media file:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update media file'
      });
    }
  }
);

// Delete media file
router.delete('/:id', 
  requirePermission('media_manage'),
  auditLog('delete_media'),
  async (req, res) => {
    try {
      const media = await Media.findById(req.params.id);
      
      if (!media) {
        return res.status(404).json({
          success: false,
          message: 'Media file not found'
        });
      }
      
      // Delete physical file
      const filePath = path.join(__dirname, '../../uploads/media', media.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      await Media.findByIdAndDelete(req.params.id);
      
      // Emit Socket.IO event for real-time updates
      req.app.get('io').emit('mediaDeleted', {
        id: media._id,
        filename: media.filename
      });
      
      res.json({
        success: true,
        message: 'Media file deleted successfully',
        data: { id: media._id, filename: media.filename }
      });
    } catch (error) {
      console.error('Error deleting media file:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete media file'
      });
    }
  }
);

// Bulk delete media files
router.post('/bulk-delete', 
  requirePermission('media_manage'),
  [
    body('mediaIds').isArray().withMessage('Media IDs must be an array'),
    body('mediaIds.*').isMongoId().withMessage('Invalid media ID format')
  ],
  auditLog('bulk_delete_media'),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { mediaIds } = req.body;
      
      const mediaFiles = await Media.find({ _id: { $in: mediaIds } });
      
      if (mediaFiles.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No media files found'
        });
      }
      
      const deletedFiles = [];
      const failedFiles = [];
      
      for (const media of mediaFiles) {
        try {
          // Delete physical file
          const filePath = path.join(__dirname, '../../uploads/media', media.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          
          await Media.findByIdAndDelete(media._id);
          deletedFiles.push(media._id);
          
          // Emit Socket.IO event
          req.app.get('io').emit('mediaDeleted', {
            id: media._id,
            filename: media.filename
          });
        } catch (error) {
          console.error(`Error deleting media ${media._id}:`, error);
          failedFiles.push(media._id);
        }
      }
      
      res.json({
        success: true,
        message: 'Bulk media deletion completed',
        data: {
          deleted: deletedFiles.length,
          failed: failedFiles.length,
          deletedIds: deletedFiles,
          failedIds: failedFiles
        }
      });
    } catch (error) {
      console.error('Error bulk deleting media files:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk delete media files'
      });
    }
  }
);

module.exports = router; 