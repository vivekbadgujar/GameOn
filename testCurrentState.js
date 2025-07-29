const axios = require('axios');

async function testCurrentState() {
  try {
    console.log('=== Testing Current State ===\n');
    
    // Test public API
    console.log('1. Testing Public Tournaments API...');
    const publicResponse = await axios.get('http://localhost:5000/api/tournaments');
    console.log('✅ Public API Status:', publicResponse.status);
    console.log('✅ Tournaments found:', publicResponse.data.tournaments?.length || 0);
    
    if (publicResponse.data.tournaments?.length > 0) {
      console.log('✅ First tournament:', {
        title: publicResponse.data.tournaments[0].title,
        status: publicResponse.data.tournaments[0].status,
        poster: publicResponse.data.tournaments[0].poster,
        posterUrl: publicResponse.data.tournaments[0].posterUrl,
        isVisible: publicResponse.data.tournaments[0].isVisible
      });
    }
    
    console.log('\n2. Testing Admin API (without auth)...');
    try {
      const adminResponse = await axios.get('http://localhost:5000/api/admin/tournaments');
      console.log('✅ Admin API Status:', adminResponse.status);
      console.log('✅ Admin tournaments:', adminResponse.data.tournaments?.length || 0);
    } catch (error) {
      console.log('❌ Admin API Error (expected):', error.response?.status, error.response?.data?.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testCurrentState(); 