/**
 * Frontend Tournament Visibility Test
 * Tests the difference between dashboard and tournaments page data fetching
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testFrontendTournaments() {
  console.log('🔍 Testing Frontend Tournament Data Fetching\n');

  try {
    // Test 1: Public tournaments endpoint (used by tournaments page)
    console.log('1. 🌐 Testing Public Tournaments Endpoint (/api/tournaments)...');
    const publicResponse = await axios.get(`${API_BASE_URL}/tournaments`);
    
    console.log('   Response status:', publicResponse.status);
    console.log('   Response structure:', Object.keys(publicResponse.data));
    console.log('   Success:', publicResponse.data.success);
    console.log('   Tournament count:', publicResponse.data.tournaments?.length || 0);
    
    if (publicResponse.data.tournaments && publicResponse.data.tournaments.length > 0) {
      console.log('   ✅ Public tournaments found!');
      console.log('   Sample tournament:', {
        id: publicResponse.data.tournaments[0]._id,
        title: publicResponse.data.tournaments[0].title,
        name: publicResponse.data.tournaments[0].name,
        status: publicResponse.data.tournaments[0].status,
        game: publicResponse.data.tournaments[0].game
      });
    } else {
      console.log('   ❌ No tournaments found in public endpoint');
    }

    // Test 2: Dashboard tournaments endpoint (with parameters)
    console.log('\n2. 📊 Testing Dashboard Tournaments Endpoint (with parameters)...');
    const dashboardResponse = await axios.get(`${API_BASE_URL}/tournaments`, {
      params: { limit: 6, status: 'upcoming' }
    });
    
    console.log('   Response status:', dashboardResponse.status);
    console.log('   Tournament count:', dashboardResponse.data.tournaments?.length || 0);
    
    if (dashboardResponse.data.tournaments && dashboardResponse.data.tournaments.length > 0) {
      console.log('   ✅ Dashboard tournaments found!');
      console.log('   Sample tournament:', {
        id: dashboardResponse.data.tournaments[0]._id,
        title: dashboardResponse.data.tournaments[0].title,
        status: dashboardResponse.data.tournaments[0].status
      });
    } else {
      console.log('   ❌ No tournaments found in dashboard endpoint');
    }

    // Test 3: Check for differences
    console.log('\n3. 🔍 Comparing Results...');
    const publicCount = publicResponse.data.tournaments?.length || 0;
    const dashboardCount = dashboardResponse.data.tournaments?.length || 0;
    
    console.log(`   Public endpoint tournaments: ${publicCount}`);
    console.log(`   Dashboard endpoint tournaments: ${dashboardCount}`);
    
    if (publicCount === 0 && dashboardCount > 0) {
      console.log('   ⚠️  ISSUE FOUND: Dashboard has tournaments but public endpoint doesn\'t!');
      console.log('   This explains why tournaments show in dashboard but not in /tournaments page');
    } else if (publicCount > 0 && dashboardCount > 0) {
      console.log('   ✅ Both endpoints have tournaments');
    } else if (publicCount === 0 && dashboardCount === 0) {
      console.log('   ❌ No tournaments found in either endpoint');
    }

    // Test 4: Check tournament status distribution
    if (publicCount > 0) {
      console.log('\n4. 📈 Tournament Status Distribution (Public Endpoint):');
      const statusCounts = {};
      publicResponse.data.tournaments.forEach(t => {
        statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
      });
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count} tournaments`);
      });
    }

    // Test 5: Direct database check via admin endpoint
    console.log('\n5. 🔐 Testing Admin Endpoint (requires authentication)...');
    try {
      // First authenticate
      const loginResponse = await axios.post(`${API_BASE_URL}/admin/auth/login`, {
        email: 'gameonofficial04@gmail.com',
        password: 'GameOn@321'
      });
      const adminToken = loginResponse.data.token;
      
      // Get admin tournaments
      const adminResponse = await axios.get(`${API_BASE_URL}/admin/tournaments`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      console.log('   Admin tournament count:', adminResponse.data.data?.length || adminResponse.data.tournaments?.length || 0);
      
      if (adminResponse.data.data?.length > 0 || adminResponse.data.tournaments?.length > 0) {
        const adminTournaments = adminResponse.data.data || adminResponse.data.tournaments || [];
        console.log('   ✅ Admin can see tournaments!');
        console.log('   Sample admin tournament:', {
          id: adminTournaments[0]._id,
          title: adminTournaments[0].title,
          status: adminTournaments[0].status,
          isVisible: adminTournaments[0].isVisible,
          isPublic: adminTournaments[0].isPublic
        });
      }
    } catch (adminError) {
      console.log('   ❌ Admin endpoint test failed:', adminError.message);
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`✅ Public Endpoint Working: ${publicCount > 0 ? 'YES' : 'NO'}`);
    console.log(`✅ Dashboard Endpoint Working: ${dashboardCount > 0 ? 'YES' : 'NO'}`);
    console.log(`✅ Data Consistency: ${publicCount === dashboardCount ? 'YES' : 'NO'}`);
    
    if (publicCount === 0 && dashboardCount > 0) {
      console.log('\n🔧 RECOMMENDED FIXES:');
      console.log('1. Check tournament visibility settings (isVisible, isPublic)');
      console.log('2. Verify public tournament route filtering logic');
      console.log('3. Ensure newly created tournaments have proper visibility defaults');
    }

  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testFrontendTournaments();
