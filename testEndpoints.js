const axios = require('axios');

async function testAllEndpoints() {
  try {
    console.log('=== Testing All API Endpoints ===\n');
    
    // Test 1: Public tournaments endpoint
    console.log('1. Testing Public Tournaments API...');
    try {
      const publicResponse = await axios.get('http://localhost:5000/api/tournaments');
      console.log('✅ Public API Status:', publicResponse.status);
      console.log('✅ Public API Tournaments:', publicResponse.data.tournaments?.length || 0);
      if (publicResponse.data.tournaments?.length > 0) {
        console.log('✅ Sample tournament:', {
          title: publicResponse.data.tournaments[0].title,
          status: publicResponse.data.tournaments[0].status,
          poster: publicResponse.data.tournaments[0].poster,
          posterUrl: publicResponse.data.tournaments[0].posterUrl
        });
      }
    } catch (error) {
      console.log('❌ Public API Error:', error.response?.data || error.message);
    }
    
    console.log('\n2. Testing Admin Tournaments API...');
    try {
      const adminResponse = await axios.get('http://localhost:5000/api/admin/tournaments', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('✅ Admin API Status:', adminResponse.status);
      console.log('✅ Admin API Tournaments:', adminResponse.data.tournaments?.length || 0);
    } catch (error) {
      console.log('❌ Admin API Error:', error.response?.data || error.message);
    }
    
    console.log('\n3. Testing Database Direct Query...');
    // This will be handled by the testTournaments.js script
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAllEndpoints(); 