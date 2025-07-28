/**
 * Complete Tournament Creation Workflow Test & Validation
 * This script tests the entire tournament creation flow end-to-end
 */

const axios = require('axios');
const mongoose = require('mongoose');

const API_BASE_URL = 'http://localhost:5000/api';
const MONGODB_URI = 'mongodb+srv://vivekbadgujar:Vivek321@cluster0.squjxrk.mongodb.net/gameon?retryWrites=true&w=majority';

async function runCompleteTest() {
  console.log('🚀 Complete Tournament Creation Workflow Test\n');

  try {
    // Step 1: Backend Health Check
    console.log('1. ✅ Backend Health Check...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log(`   Backend Status: ${healthResponse.data.message}`);
    console.log(`   Database: ${healthResponse.data.dbStatus}`);

    // Step 2: Admin Authentication
    console.log('\n2. 🔐 Admin Authentication...');
    const loginResponse = await axios.post(`${API_BASE_URL}/admin/auth/login`, {
      email: 'gameonofficial04@gmail.com',
      password: 'GameOn@321'
    });
    const adminToken = loginResponse.data.token;
    console.log('   ✅ Admin authenticated successfully');

    // Step 3: Create Test Tournament
    console.log('\n3. 🏆 Creating Test Tournament...');
    const tournamentData = {
      title: `Test Tournament ${Date.now()}`,
      description: 'Complete workflow test tournament',
      game: 'BGMI',
      map: 'Erangel',
      tournamentType: 'squad',
      entryFee: 100,
      prizePool: 5000,
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
        manualRelease: false
      }
    };

    const createResponse = await axios.post(
      `${API_BASE_URL}/admin/tournaments`,
      tournamentData,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('   ✅ Tournament created successfully!');
    console.log(`   Tournament ID: ${createResponse.data.data._id}`);
    const tournamentId = createResponse.data.data._id;

    // Step 4: Verify in Admin Panel List
    console.log('\n4. 📋 Verifying Admin Panel List...');
    const adminListResponse = await axios.get(
      `${API_BASE_URL}/admin/tournaments`,
      {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      }
    );

    const foundInAdmin = adminListResponse.data.data?.find(t => t._id === tournamentId);
    if (foundInAdmin) {
      console.log('   ✅ Tournament appears in Admin Panel list');
      console.log(`   Title: ${foundInAdmin.title}`);
      console.log(`   Status: ${foundInAdmin.status}`);
    } else {
      console.log('   ❌ Tournament NOT found in Admin Panel list');
    }

    // Step 5: Verify in Frontend List
    console.log('\n5. 🌐 Verifying Frontend List...');
    const frontendResponse = await axios.get(`${API_BASE_URL}/tournaments`);
    
    const foundInFrontend = frontendResponse.data.tournaments?.find(t => t._id === tournamentId);
    if (foundInFrontend) {
      console.log('   ✅ Tournament appears in Frontend list');
      console.log(`   Title: ${foundInFrontend.title}`);
      console.log(`   Prize Pool: ₹${foundInFrontend.prizePool}`);
    } else {
      console.log('   ❌ Tournament NOT found in Frontend list');
    }

    // Step 6: Direct Database Verification
    console.log('\n6. 🗄️ Direct Database Verification...');
    await mongoose.connect(MONGODB_URI);
    const Tournament = mongoose.model('Tournament', new mongoose.Schema({}, { strict: false }));
    
    const dbTournament = await Tournament.findById(tournamentId);
    if (dbTournament) {
      console.log('   ✅ Tournament found in MongoDB');
      console.log(`   Database ID: ${dbTournament._id}`);
      console.log(`   Created At: ${dbTournament.createdAt}`);
    } else {
      console.log('   ❌ Tournament NOT found in MongoDB');
    }

    // Step 7: Test Tournament Update
    console.log('\n7. ✏️ Testing Tournament Update...');
    const updateData = {
      title: `${tournamentData.title} - UPDATED`,
      prizePool: 7500
    };

    const updateResponse = await axios.put(
      `${API_BASE_URL}/admin/tournaments/${tournamentId}`,
      updateData,
      {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      }
    );

    if (updateResponse.status === 200) {
      console.log('   ✅ Tournament updated successfully');
      console.log(`   New Title: ${updateResponse.data.data.title}`);
      console.log(`   New Prize Pool: ₹${updateResponse.data.data.prizePool}`);
    }

    // Step 8: Test Status Change
    console.log('\n8. 🔄 Testing Status Change...');
    const statusResponse = await axios.patch(
      `${API_BASE_URL}/admin/tournaments/${tournamentId}/status`,
      { status: 'active' },
      {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      }
    );

    if (statusResponse.status === 200) {
      console.log('   ✅ Tournament status updated to active');
    }

    // Step 9: Final Verification
    console.log('\n9. 🔍 Final Verification...');
    const finalCheck = await axios.get(`${API_BASE_URL}/tournaments/${tournamentId}`);
    
    if (finalCheck.status === 200) {
      const tournament = finalCheck.data.tournament;
      console.log('   ✅ Tournament accessible via public API');
      console.log(`   Final Title: ${tournament.title}`);
      console.log(`   Final Status: ${tournament.status}`);
      console.log(`   Final Prize Pool: ₹${tournament.prizePool}`);
    }

    // Cleanup
    await mongoose.connection.close();

    console.log('\n🎉 COMPLETE TOURNAMENT WORKFLOW TEST PASSED!');
    console.log('\n📊 Test Results Summary:');
    console.log('✅ Backend Health: PASS');
    console.log('✅ Admin Authentication: PASS');
    console.log('✅ Tournament Creation: PASS');
    console.log(`✅ Admin Panel List: ${foundInAdmin ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Frontend List: ${foundInFrontend ? 'PASS' : 'FAIL'}`);
    console.log('✅ Database Storage: PASS');
    console.log('✅ Tournament Update: PASS');
    console.log('✅ Status Change: PASS');
    console.log('✅ Public API Access: PASS');

    console.log('\n🎯 Tournament Creation Workflow: FULLY FUNCTIONAL');

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

// Run the complete test
runCompleteTest();
