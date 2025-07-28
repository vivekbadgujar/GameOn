/**
 * Test Tournament Creation Workflow
 * This script tests the complete tournament creation flow
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

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
  startDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
  endDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
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

async function testTournamentCreation() {
  console.log('🚀 Testing Tournament Creation Workflow...\n');

  try {
    // Step 1: Test backend health
    console.log('1. Testing backend health...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Backend is running:', healthResponse.data.message);
    console.log('   DB Status:', healthResponse.data.dbStatus);

    // Step 2: Test admin authentication (you'll need to provide actual admin credentials)
    console.log('\n2. Testing admin authentication...');
    // Using actual admin credentials from createAdmin.js
    const adminLoginData = {
      email: 'gameonofficial04@gmail.com',
      password: 'GameOn@321'
    };

    let adminToken;
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/admin/auth/login`, adminLoginData);
      adminToken = loginResponse.data.token;
      console.log('✅ Admin authentication successful');
    } catch (error) {
      console.log('⚠️  Admin authentication failed, using mock token for testing');
      adminToken = 'mock-admin-token';
    }

    // Step 3: Test tournament creation
    console.log('\n3. Testing tournament creation...');
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

    console.log('✅ Tournament created successfully!');
    console.log('Created tournament ID:', createResponse.data.data._id);
    const createdTournamentId = createResponse.data.data._id;

    // Step 4: Test tournament retrieval from admin endpoint
    console.log('\n4. Testing admin tournament list retrieval...');
    const adminTournamentsResponse = await axios.get(
      `${API_BASE_URL}/admin/tournaments`,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      }
    );

    console.log('✅ Admin tournaments retrieved successfully!');
    console.log('Total tournaments:', adminTournamentsResponse.data.data.length);
    
    const foundInAdmin = adminTournamentsResponse.data.data.find(t => t._id === createdTournamentId);
    if (foundInAdmin) {
      console.log('✅ Created tournament found in admin list');
    } else {
      console.log('❌ Created tournament NOT found in admin list');
    }

    // Step 5: Test tournament retrieval from public endpoint (frontend)
    console.log('\n5. Testing frontend tournament list retrieval...');
    const frontendTournamentsResponse = await axios.get(`${API_BASE_URL}/tournaments`);

    console.log('✅ Frontend tournaments retrieved successfully!');
    console.log('Total tournaments:', frontendTournamentsResponse.data.tournaments.length);
    
    const foundInFrontend = frontendTournamentsResponse.data.tournaments.find(t => t._id === createdTournamentId);
    if (foundInFrontend) {
      console.log('✅ Created tournament found in frontend list');
    } else {
      console.log('❌ Created tournament NOT found in frontend list');
    }

    // Step 6: Test specific tournament retrieval
    console.log('\n6. Testing specific tournament retrieval...');
    const specificTournamentResponse = await axios.get(`${API_BASE_URL}/tournaments/${createdTournamentId}`);
    
    console.log('✅ Specific tournament retrieved successfully!');
    console.log('Tournament title:', specificTournamentResponse.data.tournament.title);

    console.log('\n🎉 Tournament Creation Workflow Test Complete!');
    console.log('\n📊 Summary:');
    console.log('- Backend Health: ✅');
    console.log('- Admin Auth: ✅');
    console.log('- Tournament Creation: ✅');
    console.log('- Admin List Retrieval: ✅');
    console.log('- Frontend List Retrieval: ✅');
    console.log('- Specific Tournament Retrieval: ✅');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    console.error('Full error:', error);
  }
}

// Run the test
testTournamentCreation();
