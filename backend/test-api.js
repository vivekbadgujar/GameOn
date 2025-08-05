/**
 * API Endpoint Testing Script
 * Tests the actual authentication API endpoints
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testAuthAPI() {
  console.log('🧪 Testing Authentication API Endpoints...\n');

  try {
    // Test 1: Test server health
    console.log('📡 Test 1: Testing server health...');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/health`);
      console.log('✅ Server is running');
      console.log(`Status: ${healthResponse.status}`);
      console.log(`DB Status: ${healthResponse.data.dbStatus}`);
    } catch (error) {
      console.log('❌ Server is not running or not accessible');
      console.log('Error:', error.message);
      return;
    }
    console.log('');

    // Test 2: Test user registration
    console.log('🔐 Test 2: Testing user registration...');
    const testUser = {
      username: 'apitestuser',
      email: 'apitest@example.com',
      password: 'apitest123',
      gameProfile: {
        bgmiName: 'APITestPlayer',
        bgmiId: '8888888888'
      },
      agreeToTerms: true
    };

    try {
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Registration successful');
      console.log(`Status: ${registerResponse.status}`);
      console.log(`Success: ${registerResponse.data.success}`);
      console.log(`Message: ${registerResponse.data.message}`);
      console.log(`User ID: ${registerResponse.data.user?._id}`);
      console.log(`Token provided: ${!!registerResponse.data.token}`);
      
      if (registerResponse.data.token) {
        console.log(`Token length: ${registerResponse.data.token.length}`);
      }
    } catch (error) {
      console.log('❌ Registration failed');
      console.log(`Status: ${error.response?.status}`);
      console.log(`Error: ${error.response?.data?.message || error.message}`);
    }
    console.log('');

    // Test 3: Test user login
    console.log('🔑 Test 3: Testing user login...');
    const loginData = {
      email: testUser.email,
      password: testUser.password
    };

    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, loginData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Login successful');
      console.log(`Status: ${loginResponse.status}`);
      console.log(`Success: ${loginResponse.data.success}`);
      console.log(`Message: ${loginResponse.data.message}`);
      console.log(`User ID: ${loginResponse.data.user?._id}`);
      console.log(`Token provided: ${!!loginResponse.data.token}`);
      
      if (loginResponse.data.token) {
        console.log(`Token length: ${loginResponse.data.token.length}`);
        console.log(`Token starts with: ${loginResponse.data.token.substring(0, 20)}...`);
      }
    } catch (error) {
      console.log('❌ Login failed');
      console.log(`Status: ${error.response?.status}`);
      console.log(`Error: ${error.response?.data?.message || error.message}`);
      
      if (error.response?.data) {
        console.log('Full error response:', JSON.stringify(error.response.data, null, 2));
      }
    }
    console.log('');

    // Test 4: Test login with existing user
    console.log('🔄 Test 4: Testing login with existing user...');
    const existingUserLogin = {
      email: 'test2@example.com', // From our debug output
      password: 'test123' // Assuming this is the password
    };

    try {
      const existingLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, existingUserLogin, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Existing user login successful');
      console.log(`Status: ${existingLoginResponse.status}`);
      console.log(`Success: ${existingLoginResponse.data.success}`);
      console.log(`Message: ${existingLoginResponse.data.message}`);
    } catch (error) {
      console.log('❌ Existing user login failed');
      console.log(`Status: ${error.response?.status}`);
      console.log(`Error: ${error.response?.data?.message || error.message}`);
    }
    console.log('');

    // Test 5: Test with wrong credentials
    console.log('🚫 Test 5: Testing with wrong credentials...');
    const wrongCredentials = {
      email: 'test2@example.com',
      password: 'wrongpassword'
    };

    try {
      const wrongLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, wrongCredentials, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('❌ Wrong credentials should have failed but succeeded');
    } catch (error) {
      console.log('✅ Wrong credentials correctly rejected');
      console.log(`Status: ${error.response?.status}`);
      console.log(`Error: ${error.response?.data?.message || error.message}`);
    }
    console.log('');

    console.log('🎉 API testing completed!');

  } catch (error) {
    console.error('❌ Unexpected error during API testing:', error.message);
  }
}

// Run the API test
testAuthAPI();