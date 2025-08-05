/**
 * Data Sync Test Script
 * Tests the complete flow: Signup → Admin Panel → Join Tournament → My Tournaments → Tournament Details
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const ADMIN_API_BASE = 'http://localhost:5000/api/admin';

// Test configuration
const testUser = {
  username: `testuser_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
  password: 'Test123!',
  gameProfile: {
    bgmiName: `TestPlayer_${Date.now()}`,
    bgmiId: `${Math.floor(Math.random() * 900000000) + 100000000}`
  }
};

const adminCredentials = {
  email: 'admin@gameon.com',
  password: 'admin123'
};

let userToken = '';
let adminToken = '';
let createdTournamentId = '';

// Helper function to make API requests
const apiRequest = async (method, url, data = null, token = null) => {
  try {
    const config = {
      method,
      url,
      headers: {}
    };
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`API Error (${method} ${url}):`, error.response?.data || error.message);
    throw error;
  }
};

// Test functions
const testUserSignup = async () => {
  console.log('\n🔥 Testing User Signup...');
  
  try {
    const response = await apiRequest('POST', `${API_BASE}/auth/signup`, testUser);
    userToken = response.token;
    
    console.log('✅ User signup successful');
    console.log('📧 Email:', testUser.email);
    console.log('👤 Username:', testUser.username);
    console.log('🎮 BGMI ID:', testUser.gameProfile.bgmiId);
    
    return true;
  } catch (error) {
    console.error('❌ User signup failed:', error.message);
    return false;
  }
};

const testAdminLogin = async () => {
  console.log('\n🔐 Testing Admin Login...');
  
  try {
    const response = await apiRequest('POST', `${ADMIN_API_BASE}/auth/login`, adminCredentials);
    adminToken = response.token;
    
    console.log('✅ Admin login successful');
    return true;
  } catch (error) {
    console.error('❌ Admin login failed:', error.message);
    return false;
  }
};

const testAdminUsersList = async () => {
  console.log('\n👥 Testing Admin Users List...');
  
  try {
    const response = await apiRequest('GET', `${ADMIN_API_BASE}/users`, null, adminToken);
    const users = response.data?.users || [];
    
    // Check if our test user appears in the list
    const testUserFound = users.find(u => u.email === testUser.email);
    
    if (testUserFound) {
      console.log('✅ Test user found in admin panel');
      console.log('📊 User data:', {
        id: testUserFound._id,
        username: testUserFound.username,
        email: testUserFound.email,
        status: testUserFound.status,
        bgmiId: testUserFound.gameProfile?.bgmiId
      });
      return true;
    } else {
      console.log('❌ Test user NOT found in admin panel');
      console.log('📊 Total users in admin panel:', users.length);
      console.log('📧 Looking for email:', testUser.email);
      return false;
    }
  } catch (error) {
    console.error('❌ Admin users list failed:', error.message);
    return false;
  }
};

const testCreateTournament = async () => {
  console.log('\n🏆 Testing Tournament Creation...');
  
  const tournamentData = {
    title: `Test Tournament ${Date.now()}`,
    description: 'Test tournament for data sync verification',
    game: 'bgmi',
    tournamentType: 'solo',
    maxParticipants: 10,
    entryFee: 50,
    prizePool: 400,
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    endDate: new Date(Date.now() + 25 * 60 * 60 * 1000),
    rules: ['No cheating', 'Follow fair play', 'Respect other players'],
    isVisible: true,
    isPublic: true
  };
  
  try {
    const response = await apiRequest('POST', `${ADMIN_API_BASE}/tournaments`, tournamentData, adminToken);
    createdTournamentId = response.data?.tournament?._id || response.data?._id;
    
    console.log('✅ Tournament created successfully');
    console.log('🆔 Tournament ID:', createdTournamentId);
    console.log('📝 Title:', tournamentData.title);
    
    return true;
  } catch (error) {
    console.error('❌ Tournament creation failed:', error.message);
    return false;
  }
};

const testTournamentsList = async () => {
  console.log('\n📋 Testing Tournaments List...');
  
  try {
    const response = await apiRequest('GET', `${API_BASE}/tournaments`);
    const tournaments = response.tournaments || [];
    
    console.log('✅ Tournaments list fetched');
    console.log('📊 Total tournaments:', tournaments.length);
    
    // Check if our created tournament appears
    const testTournament = tournaments.find(t => t._id === createdTournamentId);
    if (testTournament) {
      console.log('✅ Test tournament found in public list');
      console.log('📝 Tournament:', testTournament.title);
    } else {
      console.log('❌ Test tournament NOT found in public list');
    }
    
    return tournaments.length > 0;
  } catch (error) {
    console.error('❌ Tournaments list failed:', error.message);
    return false;
  }
};

const testJoinTournament = async () => {
  console.log('\n🎯 Testing Tournament Join...');
  
  if (!createdTournamentId) {
    console.log('❌ No tournament ID available for joining');
    return false;
  }
  
  try {
    const response = await apiRequest('POST', `${API_BASE}/tournaments/${createdTournamentId}/join`, {}, userToken);
    
    console.log('✅ Tournament join successful');
    console.log('🎫 Slot number:', response.data?.slotNumber);
    console.log('👥 Participant count:', response.data?.participantCount);
    
    return true;
  } catch (error) {
    console.error('❌ Tournament join failed:', error.message);
    return false;
  }
};

const testMyTournaments = async () => {
  console.log('\n🎮 Testing My Tournaments...');
  
  try {
    const response = await apiRequest('GET', `${API_BASE}/tournaments`, null, userToken);
    const tournaments = response.tournaments || [];
    
    // Filter tournaments where user is a participant
    const myTournaments = tournaments.filter(tournament => 
      tournament.participants?.some(p => {
        const participantUserId = p.user?._id || p.user || p.userId || p._id;
        return participantUserId?.toString() === testUser._id?.toString();
      })
    );
    
    console.log('✅ My tournaments fetched');
    console.log('📊 Total tournaments:', tournaments.length);
    console.log('🎯 My tournaments:', myTournaments.length);
    
    // Check if our joined tournament appears
    const joinedTournament = tournaments.find(t => t._id === createdTournamentId);
    if (joinedTournament) {
      console.log('✅ Joined tournament found in list');
      console.log('📝 Tournament:', joinedTournament.title);
      console.log('👥 Participants:', joinedTournament.participants?.length || 0);
    } else {
      console.log('❌ Joined tournament NOT found in list');
    }
    
    return myTournaments.length > 0;
  } catch (error) {
    console.error('❌ My tournaments failed:', error.message);
    return false;
  }
};

const testTournamentDetails = async () => {
  console.log('\n📄 Testing Tournament Details...');
  
  if (!createdTournamentId) {
    console.log('❌ No tournament ID available for details');
    return false;
  }
  
  try {
    const response = await apiRequest('GET', `${API_BASE}/tournaments/${createdTournamentId}`, null, userToken);
    const tournament = response.tournament;
    
    if (tournament) {
      console.log('✅ Tournament details fetched');
      console.log('📝 Title:', tournament.title);
      console.log('📊 Status:', tournament.status);
      console.log('👥 Participants:', tournament.participants?.length || 0);
      console.log('💰 Prize Pool:', tournament.prizePool);
      console.log('🎮 Game:', tournament.game);
      
      return true;
    } else {
      console.log('❌ Tournament details not found');
      return false;
    }
  } catch (error) {
    console.error('❌ Tournament details failed:', error.message);
    return false;
  }
};

// Main test runner
const runTests = async () => {
  console.log('🚀 Starting Data Sync Tests...');
  console.log('=' * 50);
  
  const results = {
    userSignup: false,
    adminLogin: false,
    adminUsersList: false,
    createTournament: false,
    tournamentsList: false,
    joinTournament: false,
    myTournaments: false,
    tournamentDetails: false
  };
  
  // Run tests in sequence
  results.userSignup = await testUserSignup();
  
  if (results.userSignup) {
    results.adminLogin = await testAdminLogin();
    
    if (results.adminLogin) {
      // Wait a bit for real-time sync
      console.log('\n⏳ Waiting 3 seconds for real-time sync...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      results.adminUsersList = await testAdminUsersList();
      results.createTournament = await testCreateTournament();
      
      if (results.createTournament) {
        // Wait a bit for tournament to be available
        console.log('\n⏳ Waiting 2 seconds for tournament sync...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        results.tournamentsList = await testTournamentsList();
        results.joinTournament = await testJoinTournament();
        
        if (results.joinTournament) {
          // Wait a bit for join to sync
          console.log('\n⏳ Waiting 2 seconds for join sync...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          results.myTournaments = await testMyTournaments();
          results.tournamentDetails = await testTournamentDetails();
        }
      }
    }
  }
  
  // Print final results
  console.log('\n' + '=' * 50);
  console.log('📊 FINAL TEST RESULTS:');
  console.log('=' * 50);
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log('\n📈 Summary:');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Data sync is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
  }
};

// Run the tests
runTests().catch(console.error);