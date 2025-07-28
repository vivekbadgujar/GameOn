/**
 * Test script to create a sample tournament
 * Run with: node test-tournament.js
 */

const mongoose = require('mongoose');
const Tournament = require('./models/Tournament');
require('dotenv').config();

async function createTestTournament() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create a test tournament
    const testTournament = new Tournament({
      title: 'Test BGMI Tournament',
      description: 'A test tournament for debugging purposes',
      game: 'BGMI',
      map: 'Erangel',
      tournamentType: 'squad',
      maxParticipants: 100,
      currentParticipants: 0,
      entryFee: 50,
      prizePool: 5000,
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      endDate: new Date(Date.now() + 25 * 60 * 60 * 1000), // Day after tomorrow
      status: 'upcoming',
      rules: [
        'No cheating allowed',
        'Follow fair play guidelines',
        'Respect other players'
      ],
      roomDetails: {
        roomId: 'TEST123',
        password: 'PASS123'
      }
    });

    const savedTournament = await testTournament.save();
    console.log('Test tournament created:', savedTournament._id);
    console.log('Tournament details:', {
      title: savedTournament.title,
      status: savedTournament.status,
      maxParticipants: savedTournament.maxParticipants,
      entryFee: savedTournament.entryFee
    });

    process.exit(0);
  } catch (error) {
    console.error('Error creating test tournament:', error);
    process.exit(1);
  }
}

createTestTournament();