/**
 * Test existing user login with detailed debugging
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testExistingUserLogin() {
  console.log('🔍 Testing existing user login with detailed debugging...\n');

  // First, let's create a user with a known password
  console.log('1️⃣ Creating a test user with known credentials...');
  const testUser = {
    username: 'knownuser',
    email: 'knownuser@example.com',
    password: 'knownpassword123',
    gameProfile: {
      bgmiName: 'KnownPlayer',
      bgmiId: '7777777777'
    },
    agreeToTerms: true
  };

  try {
    // Delete existing user first
    console.log('Cleaning up existing test user...');
    
    // Register the user
    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, testUser, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (registerResponse.data.success) {
      console.log('✅ Test user created successfully');
      console.log(`User ID: ${registerResponse.data.user._id}`);
    }
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
      console.log('ℹ️ Test user already exists, proceeding with login test...');
    } else {
      console.log('❌ Failed to create test user:', error.response?.data?.message || error.message);
      return;
    }
  }

  console.log('\n2️⃣ Testing login with the known credentials...');
  
  try {
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Login successful!');
    console.log(`Status: ${loginResponse.status}`);
    console.log(`Success: ${loginResponse.data.success}`);
    console.log(`Message: ${loginResponse.data.message}`);
    console.log(`Token provided: ${!!loginResponse.data.token}`);
    
  } catch (error) {
    console.log('❌ Login failed');
    console.log(`Status: ${error.response?.status}`);
    console.log(`Error: ${error.response?.data?.message || error.message}`);
  }

  console.log('\n3️⃣ Testing login with wrong password...');
  
  try {
    const wrongLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUser.email,
      password: 'wrongpassword'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('❌ Wrong password should have failed but succeeded');
    
  } catch (error) {
    console.log('✅ Wrong password correctly rejected');
    console.log(`Status: ${error.response?.status}`);
    console.log(`Error: ${error.response?.data?.message || error.message}`);
  }

  console.log('\n4️⃣ Testing with one of the existing users from database...');
  
  // Try with the admin user
  try {
    const adminLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'gamonoffice04@gmail.com',
      password: 'gamon@321'  // This is the hardcoded admin password
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Admin login successful!');
    console.log(`Status: ${adminLoginResponse.status}`);
    console.log(`Success: ${adminLoginResponse.data.success}`);
    
  } catch (error) {
    console.log('❌ Admin login failed');
    console.log(`Status: ${error.response?.status}`);
    console.log(`Error: ${error.response?.data?.message || error.message}`);
  }

  console.log('\n🎉 Existing user login test completed!');
}

testExistingUserLogin();