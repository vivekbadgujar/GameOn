/**
 * Test login for fixed users
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testFixedUsers() {
  console.log('🧪 Testing login for fixed users...\n');

  // List of users that were successfully fixed
  const fixedUsers = [
    'test2@example.com',
    'test3@example.com', 
    'test4@example.com',
    'test5@example.com',
    'vivekbadgujar321@gmail.com',
    'vivekbadgujar31@gmail.com',
    'vivekbadgujar1@gmail.com'
  ];

  const defaultPassword = 'test123';

  for (const email of fixedUsers) {
    console.log(`🔑 Testing login for: ${email}`);
    
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: email,
        password: defaultPassword
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log(`✅ Login successful for ${email}`);
      console.log(`   Status: ${loginResponse.status}`);
      console.log(`   User ID: ${loginResponse.data.user._id}`);
      console.log(`   Token provided: ${!!loginResponse.data.token}`);
      
    } catch (error) {
      console.log(`❌ Login failed for ${email}`);
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
    }
    console.log('');
  }

  console.log('🎉 Fixed user login test completed!');
}

testFixedUsers();