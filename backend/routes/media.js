/**
 * Public Media Routes for GameOn Platform
 * Handles public access to media files for frontend
 */

const express = require('express');
const Media = require('../models/Media');
const router = express.Router();
const mediaBaseUrl = (process.env.BASE_URL || 'https://api.gameonesport.xyz').replace(/\/$/, '');

// Get public media files
router.get('/public', async (req, res) => {
  try {
    const { type, limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * parseInt(limit);

    // Build filter for public media
    const filter = {
      isPublic: true,
      isVisible: true,
      status: 'active'
    };

    if (type) {
      filter.type = type;
    }

    const media = await Media.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-uploadedBy -__v')
      .lean();

    const total = await Media.countDocuments(filter);

    // Transform URLs to be accessible
    const transformedMedia = media.map(item => ({
      ...item,
      url: `${mediaBaseUrl}${item.url}`,
      fullUrl: `${mediaBaseUrl}${item.url}`
    }));

    res.json({
      success: true,
      data: transformedMedia,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching public media:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch media files'
    });
  }
});

// Get media by ID (public)
router.get('/public/:id', async (req, res) => {
  try {
    const media = await Media.findOne({
      _id: req.params.id,
      isPublic: true,
      isVisible: true,
      status: 'active'
    }).select('-uploadedBy -__v');

    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }

    // Increment view count
    await media.incrementView();

    // Transform URL
    const transformedMedia = {
      ...media.toObject(),
      url: `${mediaBaseUrl}${media.url}`,
      fullUrl: `${mediaBaseUrl}${media.url}`
    };

    res.json({
      success: true,
      data: transformedMedia
    });
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch media'
    });
  }
});

// Download media file
router.get('/download/:id', async (req, res) => {
  try {
    const media = await Media.findOne({
      _id: req.params.id,
      isPublic: true,
      isVisible: true,
      status: 'active'
    });

    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }

    // Increment download count
    await media.incrementDownload();

    // Redirect to file URL or serve file directly
    const fileUrl = `${mediaBaseUrl}${media.url}`;
    res.redirect(fileUrl);
  } catch (error) {
    console.error('Error downloading media:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download media'
    });
  }
});

// Get media stats (public)
router.get('/stats', async (req, res) => {
  try {
    const stats = await Media.aggregate([
      {
        $match: {
          isPublic: true,
          isVisible: true,
          status: 'active'
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalViews: { $sum: '$viewCount' },
          totalDownloads: { $sum: '$downloadCount' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching media stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch media stats'
    });
  }
});

module.exports = router;
