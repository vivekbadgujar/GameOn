const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

// Middleware to check if API key is set
const checkApiKey = (req, res, next) => {
  if (!process.env.YOUTUBE_API_KEY) {
    return res.status(503).json({ error: 'YouTube API not configured' });
  }
  next();
};

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