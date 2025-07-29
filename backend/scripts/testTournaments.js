const mongoose = require('mongoose');
const Tournament = require('../models/Tournament');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gameon', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testTournaments() {
  try {
    console.log('Checking all tournaments in database...');
    
    // Get all tournaments without any filters
    const allTournaments = await Tournament.find({}).lean();
    console.log(`Total tournaments in database: ${allTournaments.length}`);
    
    allTournaments.forEach((tournament, index) => {
      console.log(`Tournament ${index + 1}:`, {
        id: tournament._id,
        title: tournament.title,
        status: tournament.status,
        isVisible: tournament.isVisible,
        isPublic: tournament.isPublic,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        createdAt: tournament.createdAt
      });
    });
    
    // Test the visibility filter
    console.log('\nTesting visibility filter...');
    const visibleTournaments = await Tournament.find({
      $or: [
        { isVisible: true },
        { isVisible: { $exists: false } },
        { isVisible: null }
      ]
    }).lean();
    console.log(`Tournaments with visibility filter: ${visibleTournaments.length}`);
    
  } catch (error) {
    console.error('Error testing tournaments:', error);
  } finally {
    mongoose.connection.close();
  }
}

testTournaments(); 