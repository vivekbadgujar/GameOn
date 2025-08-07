/**
 * Test script to simulate admin panel authentication and data fetching flow
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAdminPanelFlow() {
  try {
    console.log('🔍 Testing Admin Panel Complete Flow...\n');

    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${API_BASE}/admin/auth/login`, {
      email: 'gameonofficial04@gmail.com',
      password: 'GameOn@321'
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }

    console.log('✅ Login successful');
    console.log('Admin:', loginResponse.data.admin.name);
    console.log('Role:', loginResponse.data.admin.role);

    const token = loginResponse.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // Step 2: Test tournaments endpoint (what TournamentList component calls)
    console.log('\n2. Testing tournaments endpoint (TournamentList component)...');
    const tournamentsResponse = await axios.get(`${API_BASE}/admin/tournaments`, { 
      headers,
      params: {
        page: 1,
        limit: 100,
        status: 'all'
      }
    });

    console.log('✅ Tournaments API successful');
    console.log('Response structure:', Object.keys(tournamentsResponse.data));
    console.log('Tournaments array path 1 (tournaments):', tournamentsResponse.data.tournaments?.length || 'Not found');
    console.log('Tournaments array path 2 (data.tournaments):', tournamentsResponse.data.data?.tournaments?.length || 'Not found');
    console.log('Tournaments array path 3 (data):', Array.isArray(tournamentsResponse.data.data) ? tournamentsResponse.data.data.length : 'Not array');
    
    if (tournamentsResponse.data.tournaments?.length > 0) {
      console.log('Sample tournament:', {
        id: tournamentsResponse.data.tournaments[0]._id,
        title: tournamentsResponse.data.tournaments[0].title,
        status: tournamentsResponse.data.tournaments[0].status
      });
    }

    // Step 3: Test users endpoint (what UserManagement component calls)
    console.log('\n3. Testing users endpoint (UserManagement component)...');
    const usersResponse = await axios.get(`${API_BASE}/admin/users`, { 
      headers,
      params: {
        page: 1,
        limit: 20,
        status: 'all'
      }
    });

    console.log('✅ Users API successful');
    console.log('Response structure:', Object.keys(usersResponse.data));
    console.log('Users array path 1 (data.users):', usersResponse.data.data?.users?.length || 'Not found');
    console.log('Users array path 2 (users):', usersResponse.data.users?.length || 'Not found');
    console.log('Total users:', usersResponse.data.data?.total || 'Not found');
    
    if (usersResponse.data.data?.users?.length > 0) {
      console.log('Sample user:', {
        id: usersResponse.data.data.users[0]._id,
        email: usersResponse.data.data.users[0].email,
        status: usersResponse.data.data.users[0].status
      });
    }

    // Step 4: Test auth check (what AuthContext calls)
    console.log('\n4. Testing auth check endpoint (AuthContext)...');
    const authCheckResponse = await axios.get(`${API_BASE}/admin/auth/check`, { headers });
    
    console.log('✅ Auth check successful');
    console.log('Admin verified:', authCheckResponse.data.admin.name);

    console.log('\n🎉 All admin panel flow tests passed!');
    console.log('\n📋 Summary for frontend debugging:');
    console.log('- Backend API is working correctly');
    console.log('- Authentication is working');
    console.log('- Tournament data is available at: response.data.tournaments');
    console.log('- User data is available at: response.data.data.users');
    console.log('- If admin panel still shows no data, check:');
    console.log('  1. Browser console for JavaScript errors');
    console.log('  2. Network tab for failed API calls');
    console.log('  3. Component state and data processing');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.status) {
      console.error('Status:', error.response.status);
    }
  }
}

// Run the test
testAdminPanelFlow();