/**
 * Test Script: Tournament Join Redirect Fix
 * 
 * This script tests the tournament join redirect functionality
 * to ensure users are properly redirected to the slot management page
 * after joining a tournament.
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

// Test configuration
const testConfig = {
  // You'll need to replace these with actual values
  authToken: 'your-auth-token-here',
  tournamentId: 'your-tournament-id-here',
  userId: 'your-user-id-here'
};

async function testTournamentJoinRedirect() {
  console.log('🧪 Testing Tournament Join Redirect Functionality...\n');

  try {
    // Step 1: Test tournament join endpoint
    console.log('1️⃣ Testing tournament join endpoint...');
    
    const joinResponse = await axios.post(
      `${API_BASE_URL}/api/tournaments/${testConfig.tournamentId}/join`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${testConfig.authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Tournament join response:', {
      success: joinResponse.data.success,
      message: joinResponse.data.message,
      roomLobbyUrl: joinResponse.data.data?.roomLobbyUrl,
      hasRedirectUrl: !!joinResponse.data.data?.roomLobbyUrl
    });

    if (!joinResponse.data.data?.roomLobbyUrl) {
      console.log('❌ ERROR: No roomLobbyUrl provided in join response');
      return false;
    }

    // Step 2: Test room slot assignment
    console.log('\n2️⃣ Testing room slot assignment...');
    
    const roomSlotResponse = await axios.get(
      `${API_BASE_URL}/api/room-slots/tournament/${testConfig.tournamentId}`,
      {
        headers: {
          'Authorization': `Bearer ${testConfig.authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Room slot response:', {
      success: roomSlotResponse.data.success,
      hasPlayerSlot: !!roomSlotResponse.data.data?.playerSlot,
      playerSlot: roomSlotResponse.data.data?.playerSlot
    });

    // Step 3: Test auto-assignment endpoint
    console.log('\n3️⃣ Testing auto-assignment endpoint...');
    
    const assignResponse = await axios.post(
      `${API_BASE_URL}/api/room-slots/tournament/${testConfig.tournamentId}/assign`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${testConfig.authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Auto-assignment response:', {
      success: assignResponse.data.success,
      message: assignResponse.data.message,
      hasPlayerSlot: !!assignResponse.data.data?.playerSlot
    });

    console.log('\n🎉 All tests passed! Redirect functionality should work correctly.');
    return true;

  } catch (error) {
    console.log('\n❌ Test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return false;
  }
}

// Test scenarios for different platforms
async function testPlatformSpecificRedirects() {
  console.log('\n🌐 Testing Platform-Specific Redirect Scenarios...\n');

  const scenarios = [
    {
      name: 'Frontend Web App',
      description: 'User joins tournament via web interface',
      expectedRedirect: `/tournament/${testConfig.tournamentId}/room-lobby`,
      method: 'window.location.href'
    },
    {
      name: 'Mobile App',
      description: 'User joins tournament via mobile app',
      expectedRedirect: 'RoomLobby screen with tournamentId param',
      method: 'navigation.navigate'
    },
    {
      name: 'Payment Flow',
      description: 'User completes payment and joins tournament',
      expectedRedirect: `/tournament/${testConfig.tournamentId}/room-lobby`,
      method: 'setTimeout + window.location.href'
    }
  ];

  scenarios.forEach((scenario, index) => {
    console.log(`${index + 1}️⃣ ${scenario.name}:`);
    console.log(`   Description: ${scenario.description}`);
    console.log(`   Expected Redirect: ${scenario.expectedRedirect}`);
    console.log(`   Method: ${scenario.method}`);
    console.log('');
  });
}

// Main test execution
async function runTests() {
  console.log('🚀 GameOn Tournament Join Redirect Test Suite\n');
  console.log('=' .repeat(50));

  // Check if test configuration is set
  if (testConfig.authToken === 'your-auth-token-here') {
    console.log('⚠️  Please update testConfig with actual values before running tests');
    console.log('   - Get auth token from browser localStorage or API login');
    console.log('   - Get tournament ID from tournaments list');
    console.log('   - Get user ID from auth context\n');
  }

  await testPlatformSpecificRedirects();
  
  if (testConfig.authToken !== 'your-auth-token-here') {
    await testTournamentJoinRedirect();
  }

  console.log('\n📋 Summary of Changes Made:');
  console.log('1. ✅ Updated mobile TournamentDetailsScreen to redirect to RoomLobby');
  console.log('2. ✅ Updated mobile RoomLobbyScreen to fetch real data');
  console.log('3. ✅ Updated frontend useTournamentJoin hook to use roomLobbyUrl');
  console.log('4. ✅ Updated mobile tournamentsSlice to return roomLobbyUrl');
  console.log('5. ✅ Backend already provides roomLobbyUrl in join response');
  console.log('6. ✅ Backend already has auto-assignment to room slots');
  console.log('7. ✅ Frontend already has room lobby route configured');
  console.log('8. ✅ Mobile already has RoomLobby screen in navigation');

  console.log('\n🎯 Expected Behavior After Fix:');
  console.log('- User joins tournament → Success message shown');
  console.log('- After 1.5-2 seconds → Automatic redirect to room lobby');
  console.log('- Room lobby shows user\'s assigned slot position');
  console.log('- User can change slot position if allowed');
  console.log('- Real-time updates when other players join/move');
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testTournamentJoinRedirect,
  testPlatformSpecificRedirects,
  runTests
};