const axios = require('axios');

async function debugStatusUpdate() {
  try {
    console.log('🔍 Debugging tournament status update...');
    
    // Step 1: Login as admin
    console.log('\n1. Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/admin/auth/login', {
      email: 'admin@gameon.com',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data);
      return;
    }
    
    console.log('✅ Login successful');
    const token = loginResponse.data.token;
    const admin = loginResponse.data.admin;
    
    console.log('Admin details:', {
      id: admin.id,
      name: admin.name,
      role: admin.role,
      permissions: admin.permissions
    });
    
    // Step 2: Get tournaments
    console.log('\n2. Getting tournaments...');
    const tournamentsResponse = await axios.get('http://localhost:5000/api/admin/tournaments/debug');
    
    if (!tournamentsResponse.data.tournaments || tournamentsResponse.data.tournaments.length === 0) {
      console.log('❌ No tournaments found');
      return;
    }
    
    const testTournament = tournamentsResponse.data.tournaments[0];
    console.log('✅ Found tournament to test:', {
      id: testTournament._id,
      title: testTournament.title,
      status: testTournament.status
    });
    
    // Step 3: Test authenticated request to tournaments endpoint
    console.log('\n3. Testing authenticated tournaments endpoint...');
    try {
      const authTournamentsResponse = await axios.get('http://localhost:5000/api/admin/tournaments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Authenticated tournaments request successful:', {
        success: authTournamentsResponse.data.success,
        total: authTournamentsResponse.data.total
      });
    } catch (authError) {
      console.log('❌ Authenticated tournaments request failed:', {
        status: authError.response?.status,
        message: authError.response?.data?.message,
        error: authError.response?.data?.error
      });
    }
    
    // Step 4: Test status update with detailed error logging
    console.log('\n4. Testing status update...');
    try {
      const statusUpdateResponse = await axios.patch(
        `http://localhost:5000/api/admin/tournaments/${testTournament._id}/status`,
        { status: 'completed' },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Status update successful:', statusUpdateResponse.data);
      
    } catch (statusError) {
      console.log('❌ Status update failed:');
      console.log('Status:', statusError.response?.status);
      console.log('Status Text:', statusError.response?.statusText);
      console.log('Response Data:', statusError.response?.data);
      console.log('Request URL:', statusError.config?.url);
      console.log('Request Method:', statusError.config?.method);
      console.log('Request Headers:', statusError.config?.headers);
      console.log('Request Data:', statusError.config?.data);
      
      // If it's a 500 error, the issue is on the server side
      if (statusError.response?.status === 500) {
        console.log('\n💡 This is a server-side error. Check the backend logs for more details.');
        console.log('The error might be in:');
        console.log('- Tournament model validation');
        console.log('- Database connection');
        console.log('- Socket.IO emission');
        console.log('- Admin permission checking');
      }
    }
    
    // Step 5: Test with different status values
    console.log('\n5. Testing with different status values...');
    const statusesToTest = ['upcoming', 'live', 'cancelled'];
    
    for (const status of statusesToTest) {
      try {
        console.log(`\nTesting status: ${status}`);
        const response = await axios.patch(
          `http://localhost:5000/api/admin/tournaments/${testTournament._id}/status`,
          { status },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log(`✅ ${status} update successful`);
      } catch (error) {
        console.log(`❌ ${status} update failed:`, error.response?.status, error.response?.data?.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Backend server is not running. Please start it with: npm run dev');
    }
  }
}

debugStatusUpdate();