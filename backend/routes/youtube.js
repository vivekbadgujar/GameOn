const express = require('express');
const router = express.Router();
const axios = require('axios');
const TournamentVideo = require('../models/TournamentVideo');
require('dotenv').config();

// Middleware to check if API key is set
const checkApiKey = (req, res, next) => {
  if (!process.env.YOUTUBE_API_KEY) {
    return res.status(503).json({ error: 'YouTube API not configured' });
  }
  next();
};

// Get tournament videos from database (for frontend)
router.get('/videos', async (req, res) => {
  try {
    const { game, category, tournament, limit = 20 } = req.query;
    
    const filter = { isVisible: true };
    if (game) filter.game = game;
    if (category) filter.category = category;
    if (tournament) filter.tournament = tournament;

    const videos = await TournamentVideo.find(filter)
      .populate('tournament', 'title game')
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    // Transform for frontend compatibility
    const transformedVideos = videos.map(video => ({
      id: video._id,
      videoId: video.youtubeId, // Frontend expects videoId
      youtubeId: video.youtubeId, // Keep for backward compatibility
      title: video.title,
      description: video.description,
      thumbnail: `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`,
      url: video.youtubeUrl,
      youtubeUrl: video.youtubeUrl, // Frontend might look for this
      game: video.game,
      category: video.category,
      type: video.category, // Frontend expects type
      tournament: video.tournament,
      createdAt: video.createdAt,
      publishedAt: video.createdAt, // Frontend expects publishedAt
      views: video.views || 0,
      duration: video.duration || '0:00'
    }));

    res.json({
      success: true,
      videos: transformedVideos,
      total: transformedVideos.length
    });
  } catch (error) {
    console.error('Error fetching tournament videos:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch videos'
    });
  }
});

router.get('/search', checkApiKey, async (req, res) => {
  const { q } = req.query;
  const maxResults = 20;

  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: q || 'BGMI tournament',
        type: 'video',
        maxResults,
        key: process.env.YOUTUBE_API_KEY,
        videoEmbeddable: 'true',
        order: 'relevance'
      }
    });

    const videos = response.data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      channel: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      thumbnails: item.snippet.thumbnails
    }));

    res.json(videos);
  } catch (error) {
    console.error('YouTube API error:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

module.exports = router;