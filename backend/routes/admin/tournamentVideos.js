const express = require('express');
const router = express.Router();
const TournamentVideo = require('../../models/TournamentVideo');
const Tournament = require('../../models/Tournament');
const adminAuth = require('../../middleware/adminAuth');

// Get all tournament videos
router.get('/', adminAuth, async (req, res) => {
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
router.post('/', adminAuth, async (req, res) => {
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
    if (!youtubeId) {
      return res.status(400).json({
        success: false,
        error: 'Invalid YouTube URL'
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
      isVisible: isVisible || false,
      displayOrder: displayOrder || 0,
      createdBy: req.admin._id
    });

    await video.save();

    // Populate the response
    await video.populate('tournament', 'title game');
    await video.populate('createdBy', 'name');

    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Error creating tournament video:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update tournament video
router.put('/:id', adminAuth, async (req, res) => {
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
router.patch('/:id/visibility', adminAuth, async (req, res) => {
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
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const video = await TournamentVideo.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found'
      });
    }

    await TournamentVideo.findByIdAndDelete(req.params.id);

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
router.get('/:id', adminAuth, async (req, res) => {
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