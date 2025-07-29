/**
 * Public Media Routes
 * Handles public access to media files for frontend display
 */

const express = require('express');
const Media = require('../models/Media');
const router = express.Router();

// Get public media files
router.get('/public', async (req, res) => {
  try {
    const { type, category, limit = 20, page = 1 } = req.query;
    
    const filter = { status: 'active' };
    if (type) filter.type = type;
    if (category) filter.category = category;
    
    const skip = (page - 1) * limit;
    
    const media = await Media.find(filter)
      .select('title description type url category tags metadata createdAt')
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
    console.error('Error fetching public media:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch media files'
    });
  }
});

// Get featured media (for homepage/gallery)
router.get('/featured', async (req, res) => {
  try {
    const featuredMedia = await Media.find({
      status: 'active',
      category: { $in: ['promotional', 'branding', 'tournament'] }
    })
      .select('title description type url category tags metadata createdAt')
      .sort({ createdAt: -1 })
      .limit(12);
    
    res.json({
      success: true,
      data: featuredMedia,
      total: featuredMedia.length
    });
  } catch (error) {
    console.error('Error fetching featured media:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured media'
    });
  }
});

// Get media by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20, page = 1 } = req.query;
    
    const skip = (page - 1) * limit;
    
    const media = await Media.find({
      status: 'active',
      category: category
    })
      .select('title description type url category tags metadata createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Media.countDocuments({
      status: 'active',
      category: category
    });
    
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
    console.error('Error fetching media by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch media by category'
    });
  }
});

module.exports = router;