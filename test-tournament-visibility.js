/**
 * Tournament Visibility Fix Test
 * Tests that tournaments created in admin panel appear correctly in frontend
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testTournamentVisibility() {
  console.log('🔍 Testing Tournament Visibility Fix\n');

  try {
    // Step 1: Admin Authentication
    console.log('1. 🔐 Admin Authentication...');
    const loginResponse = await axios.post(`${API_BASE_URL}/admin/auth/login`, {
      email: 'gameonofficial04@gmail.com',
      password: 'GameOn@321'
    });
    const adminToken = loginResponse.data.token;
    console.log('   ✅ Admin authenticated successfully');

    // Step 2: Create Test Tournament with Proper Fields
    console.log('\n2. 🏆 Creating Test Tournament with Visibility...');
    const tournamentData = {
      title: `Visibility Test Tournament ${Date.now()}`,
      description: 'Testing tournament visibility and proper field mapping',
      game: 'BGMI',
      map: 'Erangel',
      tournamentType: 'squad',
      entryFee: 50,
      prizePool: 2500,
      maxParticipants: 32,
      startDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      rules: [
        'No cheating or use of hacks',
        'Respect all players and moderators',
        'Follow game rules strictly'
      ],
      status: 'upcoming',
      isVisible: true,
      isPublic: true,
      roomDetails: {
        roomId: 'VIS123',
        password: 'vis123',
        manualRelease: false
      }
    };

    console.log('   Tournament data to create:', JSON.stringify({
      title: tournamentData.title,
      game: tournamentData.game,
      status: tournamentData.status,
      isVisible: tournamentData.isVisible,
      isPublic: tournamentData.isPublic
    }, null, 2));

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
    console.log(`   Tournament Title: ${createResponse.data.data.title}`);
    console.log(`   Tournament Status: ${createResponse.data.data.status}`);
    console.log(`   Is Visible: ${createResponse.data.data.isVisible}`);
    console.log(`   Is Public: ${createResponse.data.data.isPublic}`);
    
    const tournamentId = createResponse.data.data._id;

    // Step 3: Wait a moment for real-time updates
    console.log('\n3. ⏳ Waiting for real-time updates...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 4: Check Frontend Tournament List
    console.log('\n4. 🌐 Checking Frontend Tournament List...');
    const frontendResponse = await axios.get(`${API_BASE_URL}/tournaments`);
    
    console.log(`   Total tournaments in frontend: ${frontendResponse.data.tournaments?.length || 0}`);
    
    const foundInFrontend = frontendResponse.data.tournaments?.find(t => t._id === tournamentId);
    if (foundInFrontend) {
      console.log('   ✅ Tournament found in Frontend list!');
      console.log(`   Frontend Title: ${foundInFrontend.title || foundInFrontend.name || 'NO TITLE'}`);
      console.log(`   Frontend Status: ${foundInFrontend.status}`);
      console.log(`   Frontend Game: ${foundInFrontend.game}`);
      console.log(`   Frontend Prize Pool: ₹${foundInFrontend.prizePool}`);
      console.log(`   Frontend Max Participants: ${foundInFrontend.maxParticipants}`);
      
      // Check if title appears as "anonymous"
      if (!foundInFrontend.title && !foundInFrontend.name) {
        console.log('   ❌ WARNING: Tournament has no title/name (appears as anonymous)');
      } else if (foundInFrontend.title === 'Untitled Tournament' || foundInFrontend.name === 'Untitled Tournament') {
        console.log('   ⚠️  WARNING: Tournament has default title');
      } else {
        console.log('   ✅ Tournament has proper title');
      }
    } else {
      console.log('   ❌ Tournament NOT found in Frontend list');
      console.log('   Available tournaments:');
      frontendResponse.data.tournaments?.forEach((t, index) => {
        console.log(`     ${index + 1}. ${t.title || t.name || 'NO TITLE'} (${t.status}) - ID: ${t._id}`);
      });
    }

    // Step 5: Check Admin Panel List
    console.log('\n5. 📋 Checking Admin Panel List...');
    const adminListResponse = await axios.get(
      `${API_BASE_URL}/admin/tournaments`,
      {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      }
    );

    const foundInAdmin = adminListResponse.data.data?.find(t => t._id === tournamentId);
    if (foundInAdmin) {
      console.log('   ✅ Tournament found in Admin Panel list!');
      console.log(`   Admin Title: ${foundInAdmin.title}`);
      console.log(`   Admin Status: ${foundInAdmin.status}`);
      console.log(`   Admin Visibility: ${foundInAdmin.isVisible}`);
      console.log(`   Admin Public: ${foundInAdmin.isPublic}`);
    } else {
      console.log('   ❌ Tournament NOT found in Admin Panel list');
    }

    // Step 6: Test Tournament Detail Access
    console.log('\n6. 🔍 Testing Tournament Detail Access...');
    try {
      const detailResponse = await axios.get(`${API_BASE_URL}/tournaments/${tournamentId}`);
      console.log('   ✅ Tournament accessible via detail endpoint');
      console.log(`   Detail Title: ${detailResponse.data.tournament.title}`);
      console.log(`   Detail Status: ${detailResponse.data.tournament.status}`);
    } catch (error) {
      console.log('   ❌ Tournament NOT accessible via detail endpoint');
      console.log(`   Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }

    // Summary
    console.log('\n📊 VISIBILITY TEST RESULTS:');
    console.log(`✅ Tournament Creation: PASS`);
    console.log(`${foundInAdmin ? '✅' : '❌'} Admin Panel Visibility: ${foundInAdmin ? 'PASS' : 'FAIL'}`);
    console.log(`${foundInFrontend ? '✅' : '❌'} Frontend Visibility: ${foundInFrontend ? 'PASS' : 'FAIL'}`);
    
    if (foundInFrontend) {
      const hasProperTitle = foundInFrontend.title && foundInFrontend.title !== 'Untitled Tournament';
      console.log(`${hasProperTitle ? '✅' : '❌'} Proper Title Display: ${hasProperTitle ? 'PASS' : 'FAIL'}`);
    }

    if (foundInFrontend && foundInAdmin) {
      console.log('\n🎉 TOURNAMENT VISIBILITY FIX: SUCCESS!');
    } else {
      console.log('\n❌ TOURNAMENT VISIBILITY FIX: NEEDS MORE WORK');
    }

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the visibility test
testTournamentVisibility();
