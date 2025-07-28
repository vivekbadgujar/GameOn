/**
 * Test tournament video creation
 */

const mongoose = require('mongoose');
const TournamentVideo = require('./models/TournamentVideo');
require('dotenv').config();

async function testVideoCreation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Test video data
    const testVideo = {
      title: 'Test BGMI Highlights',
      description: 'Test video for debugging',
      youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      game: 'BGMI',
      category: 'highlights',
      isVisible: true,
      createdBy: new mongoose.Types.ObjectId() // Mock admin ID
    };

    console.log('Creating test video with data:', testVideo);

    const video = new TournamentVideo(testVideo);
    const savedVideo = await video.save();

    console.log('Test video created successfully:', savedVideo._id);
    console.log('Video details:', {
      title: savedVideo.title,
      youtubeUrl: savedVideo.youtubeUrl,
      youtubeId: savedVideo.youtubeId,
      thumbnail: savedVideo.thumbnail
    });

    process.exit(0);
  } catch (error) {
    console.error('Error creating test video:', error);
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', Object.values(error.errors).map(err => err.message));
    }
    process.exit(1);
  }
}

testVideoCreation();