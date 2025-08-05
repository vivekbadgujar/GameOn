/**
 * Quick Test Script for Critical Fixes
 * Tests tournament join and admin user management
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const ADMIN_API_BASE = 'http://localhost:5000/api/admin';

// Test 1: Check if users are in database (no auth required)
const testUsersInDatabase = async () => {
  console.log('\n🔍 Testing Users in Database...');
  
  try {
    const response = await axios.get(`${ADMIN_API_BASE}/users/debug`);
    
    console.log('✅ Database connection successful');
    console.log('📊 Total users in database:', response.data.count);
    console.log('📊 Recent users (24h):', response.data.recentCount);
    
    if (response.data.sampleUser) {
      console.log('👤 Sample user:', {
        id: response.data.sampleUser._id,
        username: response.data.sampleUser.username,
        email: response.data.sampleUser.email,
        status: response.data.sampleUser.status,
        createdAt: response.data.sampleUser.createdAt
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error.response?.data || error.message);
    return false;
  }
};

// Test 2: Check tournament join with better error handling
const testTournamentJoinError = async () => {
  console.log('\n🏆 Testing Tournament Join Error Handling...');
  
  try {
    // Try to join a non-existent tournament to see error handling
    const response = await axios.post(`${API_BASE}/tournaments/nonexistent/join`, {}, {
      headers: {
        'Authorization': 'Bearer invalid_token'
      }
    });
    
    console.log('❌ Should have failed with authentication error');
    return false;
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.response?.data?.error;
    
    console.log('✅ Tournament join properly returns error');
    console.log('📊 Status:', status);
    console.log('📝 Message:', message);
    
    // Check if it's an authentication error (expected)
    if (status === 401) {
      console.log('✅ Authentication error as expected');
      return true;
    } else {
      console.log('⚠️  Unexpected error status');
      return false;
    }
  }
};

// Test 3: Check if backend is running
const testBackendHealth = async () => {
  console.log('\n🔧 Testing Backend Health...');
  
  try {
    const response = await axios.get(`${API_BASE}/health`);
    
    console.log('✅ Backend is running');
    console.log('📊 Status:', response.data.message);
    console.log('📊 DB Status:', response.data.dbStatus);
    console.log('📊 Environment:', response.data.environment);
    
    return response.data.dbStatus === 'connected';
  } catch (error) {
    console.error('❌ Backend health check failed:', error.message);
    return false;
  }
};

// Test 4: Check tournaments endpoint
const testTournamentsEndpoint = async () => {
  console.log('\n🎮 Testing Tournaments Endpoint...');
  
  try {
    const response = await axios.get(`${API_BASE}/tournaments`);
    
    console.log('✅ Tournaments endpoint working');
    console.log('📊 Total tournaments:', response.data.tournaments?.length || 0);
    
    if (response.data.tournaments?.length > 0) {
      const sample = response.data.tournaments[0];
      console.log('🏆 Sample tournament:', {
        id: sample._id,
        title: sample.title,
        status: sample.status,
        participants: sample.participants?.length || 0,
        maxParticipants: sample.maxParticipants
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Tournaments endpoint failed:', error.response?.data || error.message);
    return false;
  }
};

// Main test runner
const runQuickTests = async () => {
  console.log('🚀 Running Quick Tests for Critical Fixes...');
  console.log('=' * 60);
  
  const results = {
    backendHealth: false,
    usersInDatabase: false,
    tournamentsEndpoint: false,
    tournamentJoinError: false
  };
  
  // Run tests
  results.backendHealth = await testBackendHealth();
  results.usersInDatabase = await testUsersInDatabase();
  results.tournamentsEndpoint = await testTournamentsEndpoint();
  results.tournamentJoinError = await testTournamentJoinError();
  
  // Print results
  console.log('\n' + '=' * 60);
  console.log('📊 QUICK TEST RESULTS:');
  console.log('=' * 60);
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
  });
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n📈 Summary: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All quick tests passed! Backend is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
  }
  
  // Recommendations
  console.log('\n💡 Next Steps:');
  if (results.backendHealth && results.usersInDatabase) {
    console.log('✅ Backend and database are working');
    console.log('🔧 Try signing up a new user and check admin panel');
  }
  
  if (results.tournamentsEndpoint) {
    console.log('✅ Tournaments endpoint is working');
    console.log('🔧 Try joining a tournament with proper authentication');
  }
  
  if (!results.backendHealth) {
    console.log('❌ Start the backend server first: npm run dev');
  }
};

// Run the tests
runQuickTests().catch(console.error);