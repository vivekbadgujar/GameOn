/**
 * Admin Media Management Routes
 * Handles image and video uploads, management, and optimization
 */

const express = require('express');
const multer = require('multer');
const { uploadImage, deleteImage, uploadVideo, getOptimizedImageUrl } = require('../../config/cloudinary');
const { authenticateAdmin, requirePermission, auditLog } = require('../../middleware/adminAuth');
const Media = require('../../models/Media');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.fieldname === 'image') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed for image uploads'), false);
      }
    } else if (file.fieldname === 'video') {
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed for video uploads'), false);
      }
    } else {
      cb(new Error('Invalid field name'), false);
    }
  }
});

// Middleware to protect all admin media routes
router.use(authenticateAdmin);

// Get all media files
router.get('/', 
  requirePermission('media_manage'),
  async (req, res) => {
    try {
      const { type, category, status, page = 1, limit = 20 } = req.query;
      
      const filter = {};
      if (type) filter.type = type;
      if (category) filter.category = category;
      if (status) filter.status = status;
      
      const skip = (page - 1) * limit;
      
      const media = await Media.find(filter)
        .populate('uploadedBy', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      const total = await Media.countDocuments(filter);
      
      res.json({
        success: true,
        data: media,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch media files'
      });
    }
  }
);

// Upload general media file
router.post('/upload', 
  requirePermission('media_manage'),
  upload.single('file'),
  auditLog('upload_media'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided'
        });
      }

      const { title, description, category = 'other', tags } = req.body;
      
      let result;
      const base64File = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      
      // Upload to Cloudinary based on file type
      if (req.file.mimetype.startsWith('image/')) {
        result = await uploadImage({ buffer: base64File }, 'gameon/media');
      } else if (req.file.mimetype.startsWith('video/')) {
        result = await uploadVideo({ buffer: base64File }, 'gameon/media');
      } else {
        return res.status(400).json({
          success: false,
          message: 'Unsupported file type'
        });
      }

      // Save media record to database
      const media = new Media({
        filename: result.publicId,
        originalName: req.file.originalname,
        type: req.file.mimetype.startsWith('image/') ? 'image' : 'video',
        size: req.file.size,
        url: result.url,
        title: title || req.file.originalname,
        description: description || '',
        category,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        uploadedBy: req.admin._id,
        metadata: {
          width: result.width,
          height: result.height,
          format: result.format,
          publicId: result.publicId
        }
      });

      await media.save();

      // Emit Socket.IO event
      const io = req.app.get('io');
      if (io) {
        io.emit('mediaUploaded', {
          type: 'general_media',
          media: media,
          uploadedBy: req.admin._id
        });
      }

      res.json({
        success: true,
        message: 'Media uploaded successfully',
        data: media
      });
    } catch (error) {
      console.error('Media upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload media',
        error: error.message
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
          message: 'Media not found'
        });
      }

      // Delete from Cloudinary
      if (media.metadata && media.metadata.publicId) {
        await deleteImage(media.metadata.publicId);
      }

      // Delete from database
      await Media.findByIdAndDelete(req.params.id);

      // Emit Socket.IO event
      const io = req.app.get('io');
      if (io) {
        io.emit('mediaDeleted', {
          mediaId: req.params.id,
          deletedBy: req.admin._id
        });
      }

      res.json({
        success: true,
        message: 'Media deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting media:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete media'
      });
    }
  }
);

// Update media details
router.patch('/:id', 
  requirePermission('media_manage'),
  auditLog('update_media'),
  async (req, res) => {
    try {
      const { title, description, category, tags, status } = req.body;
      
      const media = await Media.findById(req.params.id);
      
      if (!media) {
        return res.status(404).json({
          success: false,
          message: 'Media not found'
        });
      }

      // Update fields
      if (title) media.title = title;
      if (description !== undefined) media.description = description;
      if (category) media.category = category;
      if (tags) media.tags = tags.split(',').map(tag => tag.trim());
      if (status) media.status = status;

      await media.save();

      res.json({
        success: true,
        message: 'Media updated successfully',
        data: media
      });
    } catch (error) {
      console.error('Error updating media:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update media'
      });
    }
  }
);

// Upload tournament banner/poster
router.post('/upload/tournament-banner', 
  requirePermission('media_manage'),
  upload.single('image'),
  auditLog('upload_tournament_banner'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      // Convert buffer to base64 for Cloudinary
      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      
      const result = await uploadImage({ buffer: base64Image }, 'gameon/tournaments');

      // Emit Socket.IO event
      req.app.get('io').emit('mediaUploaded', {
        type: 'tournament_banner',
        url: result.url,
        publicId: result.publicId,
        uploadedBy: req.admin._id
      });

      res.json({
        success: true,
        message: 'Tournament banner uploaded successfully',
        data: result
      });
    } catch (error) {
      console.error('Tournament banner upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload tournament banner',
        error: error.message
      });
    }
  }
);

// Upload user avatar/profile picture
router.post('/upload/avatar', 
  requirePermission('media_manage'),
  upload.single('image'),
  auditLog('upload_avatar'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      
      const result = await uploadImage({ buffer: base64Image }, 'gameon/avatars');

      // Emit Socket.IO event
      req.app.get('io').emit('mediaUploaded', {
        type: 'avatar',
        url: result.url,
        publicId: result.publicId,
        uploadedBy: req.admin._id
      });

      res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: result
      });
    } catch (error) {
      console.error('Avatar upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload avatar',
        error: error.message
      });
    }
  }
);

// Upload promotional content
router.post('/upload/promotional', 
  requirePermission('media_manage'),
  upload.single('image'),
  auditLog('upload_promotional'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      
      const result = await uploadImage({ buffer: base64Image }, 'gameon/promotional');

      // Emit Socket.IO event
      req.app.get('io').emit('mediaUploaded', {
        type: 'promotional',
        url: result.url,
        publicId: result.publicId,
        uploadedBy: req.admin._id
      });

      res.json({
        success: true,
        message: 'Promotional content uploaded successfully',
        data: result
      });
    } catch (error) {
      console.error('Promotional upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload promotional content',
        error: error.message
      });
    }
  }
);

// Upload video content
router.post('/upload/video', 
  requirePermission('media_manage'),
  upload.single('video'),
  auditLog('upload_video'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No video file provided'
        });
      }

      const base64Video = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      
      const result = await uploadVideo({ buffer: base64Video });

      // Emit Socket.IO event
      req.app.get('io').emit('mediaUploaded', {
        type: 'video',
        url: result.url,
        publicId: result.publicId,
        duration: result.duration,
        uploadedBy: req.admin._id
      });

      res.json({
        success: true,
        message: 'Video uploaded successfully',
        data: result
      });
    } catch (error) {
      console.error('Video upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload video',
        error: error.message
      });
    }
  }
);

// Delete media
router.delete('/:publicId', 
  requirePermission('media_manage'),
  auditLog('delete_media'),
  async (req, res) => {
    try {
      const { publicId } = req.params;
      
      // Decode the public ID (it might be URL encoded)
      const decodedPublicId = decodeURIComponent(publicId);
      
      const result = await deleteImage(decodedPublicId);

      // Emit Socket.IO event
      req.app.get('io').emit('mediaDeleted', {
        publicId: decodedPublicId,
        deletedBy: req.admin._id
      });

      res.json({
        success: true,
        message: 'Media deleted successfully',
        data: result
      });
    } catch (error) {
      console.error('Media delete error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete media',
        error: error.message
      });
    }
  }
);

// Get optimized image URL
router.post('/optimize', 
  requirePermission('media_manage'),
  async (req, res) => {
    try {
      const { publicId, width, height, crop, quality, format } = req.body;
      
      if (!publicId) {
        return res.status(400).json({
          success: false,
          message: 'Public ID is required'
        });
      }

      const optimizedUrl = getOptimizedImageUrl(publicId, {
        width,
        height,
        crop,
        quality,
        format
      });

      res.json({
        success: true,
        data: {
          originalPublicId: publicId,
          optimizedUrl
        }
      });
    } catch (error) {
      console.error('Image optimization error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to optimize image',
        error: error.message
      });
    }
  }
);

// Get media upload statistics
router.get('/stats', 
  requirePermission('media_manage'),
  async (req, res) => {
    try {
      // This would typically query your database for media statistics
      // For now, we'll return basic stats
      const stats = {
        totalUploads: 0,
        totalSize: 0,
        imageUploads: 0,
        videoUploads: 0,
        storageUsed: '0 MB',
        recentUploads: []
      };

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Media stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch media statistics',
        error: error.message
      });
    }
  }
);

module.exports = router;