const express = require('express');
const router = express.Router();
const TournamentVideo = require('../../models/TournamentVideo');
const Tournament = require('../../models/Tournament');
const { authenticateAdmin } = require('../../middleware/adminAuth');

// Get all tournament videos
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const videos = await TournamentVideo.find()
      .populate('tournament', 'title game')
      .populate('createdBy', 'name')
      .sort({ displayOrder: 1, createdAt: -1 });

    res.json({
      success: true,
      data: videos
    });
  } catch (error) {
    console.error('Error fetching tournament videos:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get visible videos for frontend
router.get('/visible', async (req, res) => {
  try {
    const { game, category, tournament, limit = 20 } = req.query;
    
    const videos = await TournamentVideo.getVisibleVideos({
      game,
      category,
      tournament,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: videos
    });
  } catch (error) {
    console.error('Error fetching visible videos:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create tournament video
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      youtubeUrl,
      tournament,
      game,
      category,
      tags,
      isVisible,
      displayOrder
    } = req.body;

    // Extract YouTube ID
    const youtubeId = TournamentVideo.extractYouTubeId(youtubeUrl);
    console.log('YouTube URL:', youtubeUrl);
    console.log('Extracted YouTube ID:', youtubeId);
    
    if (!youtubeId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid YouTube URL. Please use a valid YouTube URL format like: https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID'
      });
    }

    const video = new TournamentVideo({
      title,
      description,
      youtubeUrl,
      youtubeId,
      tournament: tournament || null,
      game,
      category,
      tags: tags || [],
      isVisible: isVisible !== undefined ? isVisible : false,
      displayOrder: displayOrder || 0,
      createdBy: req.admin._id
    });
    
    console.log('Creating video with data:', {
      title,
      youtubeUrl,
      youtubeId,
      game,
      category,
      isVisible
    });

    await video.save();
    
    // Emit Socket.IO events for real-time updates
    const io = req.app.get('io');
    if (io) {
      console.log('Emitting videoAdded event:', video._id);
      // Emit to all clients with structured data
      io.emit('videoAdded', {
        type: 'videoAdded',
        data: video
      });
      // Emit specifically to admin clients
      io.emit('adminUpdate', {
        type: 'videoAdded',
        data: video
      });
    }

    // Populate the response
    await video.populate('tournament', 'title game');
    await video.populate('createdBy', 'name');

    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Error creating tournament video:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed: ' + validationErrors.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create tournament video'
    });
  }
});

// Update tournament video
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const video = await TournamentVideo.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    // If YouTube URL changed, extract new ID
    if (req.body.youtubeUrl && req.body.youtubeUrl !== video.youtubeUrl) {
      const youtubeId = TournamentVideo.extractYouTubeId(req.body.youtubeUrl);
      if (!youtubeId) {
        return res.status(400).json({
          success: false,
          error: 'Invalid YouTube URL'
        });
      }
      req.body.youtubeId = youtubeId;
    }

    Object.assign(video, req.body);
    await video.save();
    
    // Emit Socket.IO events for real-time updates
    const io = req.app.get('io');
    if (io) {
      console.log('Emitting videoUpdated event:', video._id);
      // Emit to all clients with structured data
      io.emit('videoUpdated', {
        type: 'videoUpdated',
        data: video
      });
      // Emit specifically to admin clients
      io.emit('adminUpdate', {
        type: 'videoUpdated',
        data: video
      });
    }

    // Populate the response
    await video.populate('tournament', 'title game');
    await video.populate('createdBy', 'name');

    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Error updating tournament video:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Toggle video visibility
router.patch('/:id/visibility', authenticateAdmin, async (req, res) => {
  try {
    const { isVisible } = req.body;
    
    const video = await TournamentVideo.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    video.isVisible = isVisible;
    await video.save();

    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Error updating video visibility:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete tournament video
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const video = await TournamentVideo.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    await TournamentVideo.findByIdAndDelete(req.params.id);
    
    // Emit Socket.IO events for real-time updates
    const io = req.app.get('io');
    if (io) {
      console.log('Emitting videoDeleted event:', req.params.id);
      // Emit to all clients with structured data
      io.emit('videoDeleted', {
        type: 'videoDeleted',
        data: { id: req.params.id }
      });
      // Emit specifically to admin clients
      io.emit('adminUpdate', {
        type: 'videoDeleted',
        data: { id: req.params.id }
      });
    }

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tournament video:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get video by ID
router.get('/:id', authenticateAdmin, async (req, res) => {
  try {
    const video = await TournamentVideo.findById(req.params.id)
      .populate('tournament', 'title game')
      .populate('createdBy', 'name');
    
    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Error fetching tournament video:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;