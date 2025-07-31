/**
 * Test Analytics Endpoints
 * Tests the enhanced analytics endpoints for real-time data
 */

const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

async function testAnalyticsEndpoints() {
  try {
    console.log('🧪 Testing Analytics Endpoints...\n');

    // Test dashboard analytics
    console.log('📊 Testing Dashboard Analytics...');
    const dashboardResponse = await axios.get(`${API_BASE_URL}/admin/analytics/dashboard`, {
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'test-token'}`
      }
    });

    if (dashboardResponse.data.success) {
      console.log('✅ Dashboard analytics endpoint working');
      console.log('📈 Dashboard data structure:');
      const data = dashboardResponse.data.data;
      console.log(`   - Total Tournaments: ${data.totalTournaments}`);
      console.log(`   - Active Tournaments: ${data.activeTournaments}`);
      console.log(`   - Total Users: ${data.totalUsers}`);
      console.log(`   - Active Users Today: ${data.activeUsersToday}`);
      console.log(`   - Total Revenue: ₹${data.totalRevenue?.toLocaleString()}`);
      console.log(`   - Player Registrations: ${data.playerRegistrations}`);
      console.log(`   - Game Distribution: ${data.gameDistribution?.length} games`);
      
      if (data.gameDistribution && data.gameDistribution.length > 0) {
        console.log('🎮 Game Distribution:');
        data.gameDistribution.forEach(game => {
          console.log(`   - ${game.name}: ${game.value}% (${game.count} tournaments)`);
        });
      }
    } else {
      console.log('❌ Dashboard analytics endpoint failed');
    }

    console.log('\n📊 Testing Tournament Statistics...');
    const tournamentStatsResponse = await axios.get(`${API_BASE_URL}/admin/analytics/tournaments`, {
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'test-token'}`
      }
    });

    if (tournamentStatsResponse.data.success) {
      console.log('✅ Tournament statistics endpoint working');
      const data = tournamentStatsResponse.data.data;
      console.log('📈 Tournament stats structure:');
      console.log(`   - Overview: ${JSON.stringify(data.overview, null, 2)}`);
      console.log(`   - Top Tournaments: ${data.topTournaments?.length} tournaments`);
    } else {
      console.log('❌ Tournament statistics endpoint failed');
    }

    console.log('\n📊 Testing User Statistics...');
    const userStatsResponse = await axios.get(`${API_BASE_URL}/admin/analytics/users`, {
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'test-token'}`
      }
    });

    if (userStatsResponse.data.success) {
      console.log('✅ User statistics endpoint working');
      const data = userStatsResponse.data.data;
      console.log('👥 User stats:');
      console.log(`   - Total: ${data.total}`);
      console.log(`   - Active: ${data.active}`);
      console.log(`   - New This Month: ${data.newThisMonth}`);
      console.log(`   - Verified: ${data.verified}`);
      console.log(`   - Banned: ${data.banned}`);
    } else {
      console.log('❌ User statistics endpoint failed');
    }

    console.log('\n📊 Testing Revenue Statistics...');
    const revenueStatsResponse = await axios.get(`${API_BASE_URL}/admin/analytics/revenue`, {
      headers: {
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'test-token'}`
      }
    });

    if (revenueStatsResponse.data.success) {
      console.log('✅ Revenue statistics endpoint working');
      const data = revenueStatsResponse.data.data;
      console.log('💰 Revenue stats:');
      console.log(`   - Total Revenue: ₹${data.totalRevenue?.toLocaleString()}`);
      console.log(`   - Monthly Revenue: ${data.monthlyRevenue?.length} months`);
      console.log(`   - Net Revenue: ₹${data.revenueBreakdown?.netRevenue?.toLocaleString()}`);
    } else {
      console.log('❌ Revenue statistics endpoint failed');
    }

    console.log('\n✅ Analytics endpoints test completed!');

  } catch (error) {
    console.error('❌ Error testing analytics endpoints:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testAnalyticsEndpoints();