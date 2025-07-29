const mongoose = require('mongoose');
const Tournament = require('../models/Tournament');
const TournamentVideo = require('../models/TournamentVideo');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gameon', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function clearDummyData() {
  try {
    console.log('Starting cleanup of dummy data...');
    
    // Remove tournaments with dummy titles or created by populateData script
    const dummyTournaments = await Tournament.deleteMany({
      $or: [
        { title: { $regex: /test|dummy|sample|placeholder/i } },
        { title: { $regex: /Tournament \d+/ } },
        { description: { $regex: /test|dummy|sample/i } },
        { game: { $regex: /test|dummy/i } }
      ]
    });
    console.log(`Removed ${dummyTournaments.deletedCount} dummy tournaments`);
    
    // Remove videos with dummy titles
    const dummyVideos = await TournamentVideo.deleteMany({
      $or: [
        { title: { $regex: /test|dummy|sample|placeholder/i } },
        { title: { $regex: /Video \d+/ } },
        { description: { $regex: /test|dummy|sample/i } }
      ]
    });
    console.log(`Removed ${dummyVideos.deletedCount} dummy videos`);
    
    console.log('Cleanup completed successfully!');
    console.log('Only real data created via Admin Panel remains.');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    mongoose.connection.close();
  }
}

clearDummyData(); 