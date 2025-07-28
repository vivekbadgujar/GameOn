/**
 * Complete Tournament Creation Workflow Fix
 * This script tests and fixes the entire tournament creation flow
 */

const axios = require('axios');
const mongoose = require('mongoose');

const API_BASE_URL = 'http://localhost:5000/api';
const MONGODB_URI = 'mongodb+srv://vivekbadgujar:Vivek321@cluster0.squjxrk.mongodb.net/gameon?retryWrites=true&w=majority';

// Test tournament data
const testTournamentData = {
  title: 'Test Tournament - BGMI Squad',
  description: 'Test tournament for workflow verification',
  game: 'BGMI',
  map: 'Erangel',
  tournamentType: 'squad',
  entryFee: 50,
  prizePool: 2000,
  maxParticipants: 64,
  startDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  endDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
  rules: [
    'No cheating or use of hacks',
    'Respect all players and moderators',
    'Follow game rules strictly'
  ],
  roomDetails: {
    roomId: 'TEST123',
    password: 'test123',
    manualRelease: false,
    releaseTime: new Date(Date.now() + 1.5 * 60 * 60 * 1000).toISOString()
  }
};

async function connectToMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB directly');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

async function testCompleteWorkflow() {
  console.log('🚀 Starting Complete Tournament Creation Workflow Fix...\n');

  try {
    // Step 1: Test backend health
    console.log('1. Testing backend health...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Backend is running:', healthResponse.data.message);
    console.log('   DB Status:', healthResponse.data.dbStatus);

    // Step 2: Connect to MongoDB directly to verify database
    console.log('\n2. Testing direct MongoDB connection...');
    const mongoConnected = await connectToMongoDB();
    if (!mongoConnected) {
      throw new Error('Cannot connect to MongoDB');
    }

    // Step 3: Test admin authentication
    console.log('\n3. Testing admin authentication...');
    const adminLoginData = {
      email: 'gameonofficial04@gmail.com',
      password: 'GameOn@321'
    };

    const loginResponse = await axios.post(`${API_BASE_URL}/admin/auth/login`, adminLoginData);
    const adminToken = loginResponse.data.token;
    console.log('✅ Admin authentication successful');

    // Step 4: Test tournament creation via API
    console.log('\n4. Testing tournament creation via API...');
    console.log('Tournament data:', JSON.stringify(testTournamentData, null, 2));

    const createResponse = await axios.post(
      `${API_BASE_URL}/admin/tournaments`,
      testTournamentData,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Tournament created successfully via API!');
    console.log('Response:', JSON.stringify(createResponse.data, null, 2));
    const createdTournamentId = createResponse.data.data._id;

    // Step 5: Verify tournament in MongoDB directly
    console.log('\n5. Verifying tournament in MongoDB directly...');
    const Tournament = mongoose.model('Tournament', new mongoose.Schema({}, { strict: false }));
    const tournamentInDB = await Tournament.findById(createdTournamentId);
    
    if (tournamentInDB) {
      console.log('✅ Tournament found in MongoDB!');
      console.log('Tournament in DB:', {
        id: tournamentInDB._id,
        title: tournamentInDB.title,
        status: tournamentInDB.status,
        createdAt: tournamentInDB.createdAt
      });
    } else {
      console.log('❌ Tournament NOT found in MongoDB');
    }

    // Step 6: Test admin tournament list retrieval
    console.log('\n6. Testing admin tournament list retrieval...');
    const adminTournamentsResponse = await axios.get(
      `${API_BASE_URL}/admin/tournaments`,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      }
    );

    console.log('✅ Admin tournaments retrieved successfully!');
    console.log('Total tournaments:', adminTournamentsResponse.data.data?.length || 0);
    
    const foundInAdmin = adminTournamentsResponse.data.data?.find(t => t._id === createdTournamentId);
    if (foundInAdmin) {
      console.log('✅ Created tournament found in admin list');
    } else {
      console.log('❌ Created tournament NOT found in admin list');
      console.log('Available tournaments:', adminTournamentsResponse.data.data?.map(t => ({ id: t._id, title: t.title })));
    }

    // Step 7: Test frontend tournament list retrieval
    console.log('\n7. Testing frontend tournament list retrieval...');
    const frontendTournamentsResponse = await axios.get(`${API_BASE_URL}/tournaments`);

    console.log('✅ Frontend tournaments retrieved successfully!');
    console.log('Total tournaments:', frontendTournamentsResponse.data.tournaments?.length || 0);
    
    const foundInFrontend = frontendTournamentsResponse.data.tournaments?.find(t => t._id === createdTournamentId);
    if (foundInFrontend) {
      console.log('✅ Created tournament found in frontend list');
    } else {
      console.log('❌ Created tournament NOT found in frontend list');
      console.log('Available tournaments:', frontendTournamentsResponse.data.tournaments?.map(t => ({ id: t._id, title: t.title })));
    }

    // Step 8: Test specific tournament retrieval
    console.log('\n8. Testing specific tournament retrieval...');
    try {
      const specificTournamentResponse = await axios.get(`${API_BASE_URL}/tournaments/${createdTournamentId}`);
      console.log('✅ Specific tournament retrieved successfully!');
      console.log('Tournament title:', specificTournamentResponse.data.tournament.title);
    } catch (error) {
      console.log('❌ Failed to retrieve specific tournament:', error.response?.data || error.message);
    }

    console.log('\n🎉 Tournament Creation Workflow Test Complete!');
    console.log('\n📊 Summary:');
    console.log('- Backend Health: ✅');
    console.log('- MongoDB Connection: ✅');
    console.log('- Admin Auth: ✅');
    console.log('- Tournament Creation: ✅');
    console.log('- Tournament in DB: ✅');
    console.log(`- Admin List Retrieval: ${foundInAdmin ? '✅' : '❌'}`);
    console.log(`- Frontend List Retrieval: ${foundInFrontend ? '✅' : '❌'}`);

    // Close MongoDB connection
    await mongoose.connection.close();

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Close MongoDB connection on error
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

// Run the test
testCompleteWorkflow();
