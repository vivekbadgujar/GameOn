/**
 * Test tournament creation and visibility
 */

const mongoose = require('mongoose');
const Tournament = require('./models/Tournament');
require('dotenv').config();

async function testTournamentCreation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create a test tournament with all required fields
    const testTournament = new Tournament({
      title: 'Test Tournament - Visibility Check',
      description: 'A test tournament to check visibility and data mapping',
      game: 'BGMI',
      map: 'Erangel',
      tournamentType: 'squad',
      entryFee: 100,
      prizePool: 5000,
      maxParticipants: 16,
      currentParticipants: 0,
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endDate: new Date(Date.now() + 26 * 60 * 60 * 1000), // Day after tomorrow
      status: 'upcoming',
      isVisible: true,
      isPublic: true,
      rules: [
        'No cheating allowed',
        'Follow fair play guidelines',
        'Respect other players'
      ],
      roomDetails: {
        roomId: 'TEST123',
        password: 'PASS123'
      },
      participants: [],
      winners: []
    });

    const savedTournament = await testTournament.save();
    console.log('✅ Test tournament created successfully!');
    console.log('Tournament ID:', savedTournament._id);
    console.log('Tournament details:', {
      title: savedTournament.title,
      status: savedTournament.status,
      isVisible: savedTournament.isVisible,
      isPublic: savedTournament.isPublic,
      game: savedTournament.game,
      maxParticipants: savedTournament.maxParticipants,
      entryFee: savedTournament.entryFee,
      prizePool: savedTournament.prizePool
    });

    // Test fetching tournaments (admin view - should show all)
    console.log('\n--- Testing Admin Tournament Fetch ---');
    const allTournaments = await Tournament.find({}).sort({ createdAt: -1 }).limit(5);
    console.log(`Found ${allTournaments.length} tournaments in admin view:`);
    allTournaments.forEach(t => {
      console.log(`- ${t.title} (${t.status}, visible: ${t.isVisible}, public: ${t.isPublic})`);
    });

    // Test fetching tournaments (frontend view - only visible and public)
    console.log('\n--- Testing Frontend Tournament Fetch ---');
    const publicTournaments = await Tournament.find({ 
      isVisible: true, 
      isPublic: true 
    }).sort({ createdAt: -1 }).limit(5);
    console.log(`Found ${publicTournaments.length} tournaments in frontend view:`);
    publicTournaments.forEach(t => {
      console.log(`- ${t.title} (${t.status})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error in tournament creation test:', error);
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', Object.values(error.errors).map(err => err.message));
    }
    process.exit(1);
  }
}

testTournamentCreation();