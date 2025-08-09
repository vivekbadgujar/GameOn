const axios = require('axios');

async function testTournamentStatusUpdate() {
  try {
    console.log('Testing tournament status update endpoint...');
    
    // First, let's check if the server is running
    console.log('\n1. Checking server health...');
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Server is running:', healthResponse.data);
    
    // Check if we can get tournaments (without auth first)
    console.log('\n2. Checking tournaments debug endpoint...');
    const debugResponse = await axios.get('http://localhost:5000/api/admin/tournaments/debug');
    console.log('✅ Debug tournaments response:', {
      success: debugResponse.data.success,
      total: debugResponse.data.total,
      sampleTournament: debugResponse.data.tournaments?.[0] ? {
        id: debugResponse.data.tournaments[0]._id,
        title: debugResponse.data.tournaments[0].title,
        status: debugResponse.data.tournaments[0].status
      } : 'No tournaments found'
    });
    
    if (!debugResponse.data.tournaments || debugResponse.data.tournaments.length === 0) {
      console.log('❌ No tournaments found to test with');
      return;
    }
    
    const testTournament = debugResponse.data.tournaments[0];
    console.log(`\n3. Testing status update for tournament: ${testTournament.title} (${testTournament._id})`);
    
    // Try to update status without authentication (should fail)
    console.log('\n4. Testing without authentication (should fail)...');
    try {
      await axios.patch(`http://localhost:5000/api/admin/tournaments/${testTournament._id}/status`, {
        status: 'completed'
      });
      console.log('❌ Request succeeded without auth - this is wrong!');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected request without authentication');
      } else {
        console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
      }
    }
    
    // Now let's try to login as admin first
    console.log('\n5. Attempting admin login...');
    try {
      const loginResponse = await axios.post('http://localhost:5000/api/admin/auth/login', {
        email: 'admin@gameon.com',
        password: 'admin123'
      });
      
      if (loginResponse.data.success) {
        console.log('✅ Admin login successful');
        const token = loginResponse.data.token;
        
        // Now try the status update with authentication
        console.log('\n6. Testing status update with authentication...');
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
        
        // Verify the status was actually updated
        console.log('\n7. Verifying status update...');
        const verifyResponse = await axios.get('http://localhost:5000/api/admin/tournaments/debug');
        const updatedTournament = verifyResponse.data.tournaments.find(t => t._id === testTournament._id);
        
        if (updatedTournament && updatedTournament.status === 'completed') {
          console.log('✅ Status update verified - tournament is now completed');
        } else {
          console.log('❌ Status update failed - tournament status is still:', updatedTournament?.status);
        }
        
      } else {
        console.log('❌ Admin login failed:', loginResponse.data);
      }
    } catch (loginError) {
      console.log('❌ Admin login error:', loginError.response?.status, loginError.response?.data);
      console.log('This might be because no admin user exists. Let\'s check...');
      
      // Try to create an admin user
      console.log('\n6. Attempting to create admin user...');
      try {
        const createAdminResponse = await axios.post('http://localhost:5000/api/admin/auth/register', {
          name: 'Test Admin',
          username: 'admin',
          email: 'admin@gameon.com',
          password: 'admin123',
          role: 'super_admin'
        });
        console.log('✅ Admin user created:', createAdminResponse.data);
      } catch (createError) {
        console.log('❌ Could not create admin user:', createError.response?.status, createError.response?.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 The backend server is not running. Please start it with: npm run dev');
    }
  }
}

// Run the test
testTournamentStatusUpdate();