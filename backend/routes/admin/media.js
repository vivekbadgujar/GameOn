const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const Media = require('../../models/Media');
const { authenticateAdmin, requirePermission, auditLog } = require('../../middleware/adminAuth');
const { uploadImage, uploadVideo } = require('../../config/cloudinary');
const router = express.Router();

// Middleware to protect all admin media routes
router.use(authenticateAdmin);

// Cloudinary storage uses a guaranteed fallback config
const hasCloudinaryConfig = () => true;

// Memory storage for multer - files go directly to Cloudinary
const memoryStorage = multer.memoryStorage();

const upload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|webm|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, JPG, PNG, WebP, GIF, videos, and documents are allowed.'));
    }
  }
});

// Upload file directly to Cloudinary
const uploadToCloudinary = async (file, title) => {
  if (!hasCloudinaryConfig()) {
    throw new Error('Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables.');
  }

  try {
    console.log(`Uploading media to Cloudinary: ${title}`);
    console.log('File details:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    let result;
    if (file.mimetype.startsWith('video/')) {
      result = await uploadVideo(file, 'gameon/media');
    } else {
      result = await uploadImage(file, 'gameon/media');
    }

    console.log('Cloudinary media upload successful:', result.url);
    return result;
  } catch (error) {
    console.error('Cloudinary media upload failed:', error);
    throw new Error(`Failed to upload media to Cloudinary: ${error.message}`);
  }
};

// Get all media files
router.get('/', 
  requirePermission('media_manage'),
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;
      const { type, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      // Build filter
      const filter = {};
      if (type) filter.type = type;
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      // Build sort
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const media = await Media.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('uploadedBy', 'username email')
        .lean();

      const total = await Media.countDocuments(filter);

      res.json({
        success: true,
        data: media,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit
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

// Upload media file
router.post('/upload',
  requirePermission('media_manage'),
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            message: 'File size exceeds 10MB limit. Please upload a smaller image.'
          });
        }
        return res.status(400).json({
          success: false,
          message: 'File upload error: ' + err.message
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed'
        });
      }
      next();
    });
  },
  [
    body('title').optional().trim(),
    body('description').optional().trim(),
    body('type').optional().isIn(['poster', 'banner', 'logo', 'document', 'video', 'image']),
    body('tags').optional().trim()
  ],
  auditLog('upload_media'),
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

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const { title, description, type, tags } = req.body;

      // Determine file type
      const fileType = req.file.mimetype.startsWith('image/') ? 'image' :
                      req.file.mimetype.startsWith('video/') ? 'video' :
                      req.file.mimetype.startsWith('application/') ? 'document' : 'other';

      // Upload to Cloudinary
      const cloudinaryResult = await uploadToCloudinary(req.file, title || req.file.originalname);

      // Create media record
      const media = new Media({
        title: title || req.file.originalname,
        description: description || '',
        type: type || fileType,
        filename: req.file.originalname,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: cloudinaryResult.url,
        publicId: cloudinaryResult.publicId,
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        format: cloudinaryResult.format,
        duration: cloudinaryResult.duration,
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        uploadedBy: req.admin._id,
        isVisible: true
      });

      await media.save();

      res.json({
        success: true,
        message: 'File uploaded successfully to Cloudinary',
        data: media
      });
    } catch (error) {
      console.error('Error uploading media:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload file'
      });
    }
  }
);

// Get media by ID
router.get('/:id',
  requirePermission('media_view'),
  async (req, res) => {
    try {
      const media = await Media.findById(req.params.id)
        .populate('uploadedBy', 'username email');

      if (!media) {
        return res.status(404).json({
          success: false,
          message: 'Media not found'
        });
      }

      res.json({
        success: true,
        data: media
      });
    } catch (error) {
      console.error('Error fetching media:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch media'
      });
    }
  }
);

// Update media
router.put('/:id',
  requirePermission('media_manage'),
  [
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('type').optional().isIn(['poster', 'banner', 'logo', 'document', 'video', 'image']),
    body('tags').optional().trim()
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

      const { title, description, type, tags } = req.body;
      
      const updateData = {};
      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (type) updateData.type = type;
      if (tags !== undefined) {
        updateData.tags = tags ? tags.split(',').map(tag => tag.trim()) : [];
      }

      const media = await Media.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).populate('uploadedBy', 'username email');

      if (!media) {
        return res.status(404).json({
          success: false,
          message: 'Media not found'
        });
      }

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

// Toggle media visibility
router.patch('/:id/visibility',
  requirePermission('media_manage'),
  [
    body('isVisible').isBoolean().withMessage('isVisible must be a boolean')
  ],
  auditLog('toggle_media_visibility'),
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

      const { isVisible } = req.body;

      const media = await Media.findByIdAndUpdate(
        req.params.id,
        { isVisible },
        { new: true }
      );

      if (!media) {
        return res.status(404).json({
          success: false,
          message: 'Media not found'
        });
      }

      res.json({
        success: true,
        message: `Media ${isVisible ? 'shown' : 'hidden'} successfully`,
        data: media
      });
    } catch (error) {
      console.error('Error toggling media visibility:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to toggle media visibility'
      });
    }
  }
);

// Delete media
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

      // Delete file from filesystem
      const filePath = path.join(__dirname, '../../uploads/media', media.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await Media.findByIdAndDelete(req.params.id);

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

module.exports = router;