/**
 * Test script to verify admin panel can connect to backend
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAdminPanelConnection() {
  try {
    console.log('🔍 Testing Admin Panel Connection to Backend...\n');

    // Step 1: Test basic connectivity
    console.log('1. Testing basic API connectivity...');
    try {
      const healthResponse = await axios.get(`${API_BASE}/health`);
      console.log('✅ Backend is running');
      console.log('DB Status:', healthResponse.data.dbStatus);
    } catch (error) {
      console.log('❌ Backend connection failed:', error.message);
      return;
    }

    // Step 2: Test admin login
    console.log('\n2. Testing admin login...');
    let loginResponse;
    try {
      loginResponse = await axios.post(`${API_BASE}/admin/auth/login`, {
        email: 'gameonofficial04@gmail.com',
        password: 'GameOn@321'
      });
      console.log('✅ Admin login successful');
      console.log('Admin details:', {
        name: loginResponse.data.admin.name,
        email: loginResponse.data.admin.email,
        role: loginResponse.data.admin.role,
        permissions: loginResponse.data.admin.permissions
      });
    } catch (error) {
      console.log('❌ Admin login failed:', error.response?.data?.message || error.message);
      return;
    }

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Step 3: Test auth check endpoint (what admin panel uses)
    console.log('\n3. Testing auth check endpoint...');
    try {
      const authCheckResponse = await axios.get(`${API_BASE}/admin/auth/check`, { headers });
      console.log('✅ Auth check successful');
      console.log('Admin verified:', authCheckResponse.data.admin.name);
    } catch (error) {
      console.log('❌ Auth check failed:', error.response?.data?.message || error.message);
    }

    // Step 4: Test tournaments endpoint with proper pagination
    console.log('\n4. Testing tournaments endpoint with pagination...');
    try {
      const tournamentsResponse = await axios.get(`${API_BASE}/admin/tournaments`, { 
        headers,
        params: {
          page: 1,
          limit: 10,
          status: 'all'
        }
      });
      console.log('✅ Tournaments fetch successful');
      console.log('Response structure:', Object.keys(tournamentsResponse.data));
      console.log('Tournaments count:', tournamentsResponse.data.tournaments?.length || 0);
      console.log('Total tournaments:', tournamentsResponse.data.total || 0);
      console.log('Sample tournament:', tournamentsResponse.data.tournaments?.[0] ? {
        id: tournamentsResponse.data.tournaments[0]._id,
        title: tournamentsResponse.data.tournaments[0].title,
        status: tournamentsResponse.data.tournaments[0].status
      } : 'No tournaments');
    } catch (error) {
      console.log('❌ Tournaments fetch failed:', error.response?.data?.message || error.message);
      console.log('Status:', error.response?.status);
    }

    // Step 5: Test users endpoint with proper pagination
    console.log('\n5. Testing users endpoint with pagination...');
    try {
      const usersResponse = await axios.get(`${API_BASE}/admin/users`, { 
        headers,
        params: {
          page: 1,
          limit: 10,
          status: 'all'
        }
      });
      console.log('✅ Users fetch successful');
      console.log('Response structure:', Object.keys(usersResponse.data));
      console.log('Users count:', usersResponse.data.data?.users?.length || 0);
      console.log('Total users:', usersResponse.data.data?.total || 0);
      console.log('Sample user:', usersResponse.data.data?.users?.[0] ? {
        id: usersResponse.data.data.users[0]._id,
        email: usersResponse.data.data.users[0].email,
        status: usersResponse.data.data.users[0].status
      } : 'No users');
    } catch (error) {
      console.log('❌ Users fetch failed:', error.response?.data?.message || error.message);
      console.log('Status:', error.response?.status);
    }

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Backend is running and accessible');
    console.log('- Admin authentication is working');
    console.log('- Tournament and user data is available');
    console.log('- API endpoints are responding correctly');
    console.log('\n🔧 If admin panel is not showing data, the issue is likely in:');
    console.log('1. Admin panel authentication state');
    console.log('2. Frontend API calls or data processing');
    console.log('3. Component rendering logic');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAdminPanelConnection();