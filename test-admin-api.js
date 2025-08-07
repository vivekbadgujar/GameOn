/**
 * Test script to check admin API functionality
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAdminAPI() {
  try {
    console.log('🔍 Testing Admin API...\n');

    // Step 1: Try to login as admin
    console.log('1. Testing admin login...');
    let loginResponse;
    try {
      loginResponse = await axios.post(`${API_BASE}/admin/auth/login`, {
        email: 'gameonofficial04@gmail.com',
        password: 'GameOn@321'
      });
      console.log('✅ Admin login successful');
      console.log('Token received:', loginResponse.data.token ? 'Yes' : 'No');
    } catch (error) {
      console.log('❌ Admin login failed:', error.response?.data?.message || error.message);
      
      // Try to create admin if login fails
      console.log('\n2. Trying to create admin account...');
      try {
        const createResponse = await axios.post(`${API_BASE}/admin/auth/register`, {
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'admin123',
          role: 'super_admin'
        });
        console.log('✅ Admin account created');
        
        // Try login again
        loginResponse = await axios.post(`${API_BASE}/admin/auth/login`, {
          email: 'gameonofficial04@gmail.com',
          password: 'GameOn@321'
        });
        console.log('✅ Admin login successful after creation');
      } catch (createError) {
        console.log('❌ Admin creation failed:', createError.response?.data?.message || createError.message);
        return;
      }
    }

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Step 2: Test tournaments endpoint
    console.log('\n3. Testing tournaments endpoint...');
    try {
      const tournamentsResponse = await axios.get(`${API_BASE}/admin/tournaments`, { headers });
      console.log('✅ Tournaments fetch successful');
      console.log('Tournaments count:', tournamentsResponse.data.tournaments?.length || tournamentsResponse.data.data?.length || 0);
      console.log('Response structure:', Object.keys(tournamentsResponse.data));
    } catch (error) {
      console.log('❌ Tournaments fetch failed:', error.response?.data?.message || error.message);
      console.log('Status:', error.response?.status);
    }

    // Step 3: Test users endpoint
    console.log('\n4. Testing users endpoint...');
    try {
      const usersResponse = await axios.get(`${API_BASE}/admin/users`, { headers });
      console.log('✅ Users fetch successful');
      console.log('Users count:', usersResponse.data.data?.users?.length || 0);
      console.log('Response structure:', Object.keys(usersResponse.data));
    } catch (error) {
      console.log('❌ Users fetch failed:', error.response?.data?.message || error.message);
      console.log('Status:', error.response?.status);
    }

    // Step 4: Test debug endpoints (no auth required)
    console.log('\n5. Testing debug endpoints...');
    try {
      const debugTournaments = await axios.get(`${API_BASE}/admin/tournaments/debug`);
      console.log('✅ Debug tournaments successful');
      console.log('Debug tournaments count:', debugTournaments.data.total);
    } catch (error) {
      console.log('❌ Debug tournaments failed:', error.response?.data?.message || error.message);
    }

    try {
      const debugUsers = await axios.get(`${API_BASE}/admin/users/debug`);
      console.log('✅ Debug users successful');
      console.log('Debug users count:', debugUsers.data.count);
    } catch (error) {
      console.log('❌ Debug users failed:', error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAdminAPI();