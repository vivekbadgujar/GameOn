const axios = require('axios');

async function testAdminAccess() {
  try {
    console.log('=== Testing Admin Access ===\n');
    
    // Test 1: Debug route (no auth)
    console.log('1. Testing Debug Route (no auth)...');
    try {
      const debugResponse = await axios.get('http://localhost:5000/api/admin/tournaments/debug');
      console.log('✅ Debug Route Status:', debugResponse.status);
      console.log('✅ Debug Tournaments:', debugResponse.data.tournaments?.length || 0);
      if (debugResponse.data.tournaments?.length > 0) {
        console.log('✅ First debug tournament:', {
          title: debugResponse.data.tournaments[0].title,
          status: debugResponse.data.tournaments[0].status
        });
      }
    } catch (error) {
      console.log('❌ Debug Route Error:', error.response?.status, error.response?.data?.message);
    }
    
    // Test 2: Regular admin route (with auth)
    console.log('\n2. Testing Regular Admin Route (with auth)...');
    try {
      const adminResponse = await axios.get('http://localhost:5000/api/admin/tournaments', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('✅ Admin Route Status:', adminResponse.status);
      console.log('✅ Admin Tournaments:', adminResponse.data.tournaments?.length || 0);
    } catch (error) {
      console.log('❌ Admin Route Error (expected):', error.response?.status, error.response?.data?.message);
    }
    
    // Test 3: Public route
    console.log('\n3. Testing Public Route...');
    try {
      const publicResponse = await axios.get('http://localhost:5000/api/tournaments');
      console.log('✅ Public Route Status:', publicResponse.status);
      console.log('✅ Public Tournaments:', publicResponse.data.tournaments?.length || 0);
    } catch (error) {
      console.log('❌ Public Route Error:', error.response?.status, error.response?.data?.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAdminAccess(); 