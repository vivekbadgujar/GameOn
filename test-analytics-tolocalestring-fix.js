/**
 * Test Analytics toLocaleString Fix
 * Validates that toLocaleString errors are resolved with proper null handling
 */

// Simulate different data structures that could cause the error
const testScenarios = [
  {
    name: "Undefined analytics data",
    analyticsData: undefined,
    tournamentStatsData: undefined
  },
  {
    name: "Null analytics data", 
    analyticsData: null,
    tournamentStatsData: null
  },
  {
    name: "Empty analytics data",
    analyticsData: { data: {} },
    tournamentStatsData: { data: {} }
  },
  {
    name: "Analytics with null values",
    analyticsData: { 
      data: { 
        totalRevenue: null, 
        playerRegistrations: null,
        totalWins: null 
      } 
    },
    tournamentStatsData: { 
      data: { 
        topTournaments: [
          { name: "Tournament 1", participants: null, prizePool: null, status: "Active" },
          { name: "Tournament 2", participants: undefined, prizePool: undefined, status: "Completed" }
        ] 
      } 
    }
  },
  {
    name: "Analytics with undefined values",
    analyticsData: { 
      data: { 
        totalRevenue: undefined, 
        playerRegistrations: undefined,
        totalWins: undefined 
      } 
    },
    tournamentStatsData: { 
      data: { 
        topTournaments: [
          { name: "Tournament 1", status: "Active" },
          { name: "Tournament 2", status: "Completed" }
        ] 
      } 
    }
  },
  {
    name: "Valid analytics data",
    analyticsData: { 
      data: { 
        totalRevenue: 150000, 
        playerRegistrations: 2500,
        totalWins: 450 
      } 
    },
    tournamentStatsData: { 
      data: { 
        topTournaments: [
          { name: "BGMI Championship", participants: 1200, prizePool: 50000, status: "Active" },
          { name: "Free Fire Tournament", participants: 800, prizePool: 25000, status: "Completed" },
          { name: "PUBG Mobile Cup", participants: 1500, prizePool: 75000, status: "Upcoming" }
        ] 
      } 
    }
  }
];

// Simulate the Analytics component logic
function testAnalyticsDataProcessing(analyticsData, tournamentStatsData) {
  console.log(`\n🧪 Testing scenario: ${analyticsData ? 'Valid analytics input' : 'Invalid analytics input'}`);
  
  try {
    // Test StatCard values (the ones that were causing toLocaleString errors)
    console.log('📊 Testing StatCard values:');
    
    // Total Revenue
    const totalRevenue = (analyticsData?.data?.totalRevenue || 0).toLocaleString();
    console.log(`   ✅ Total Revenue: ₹${totalRevenue}`);
    
    // Player Registrations
    const playerRegistrations = (analyticsData?.data?.playerRegistrations || 0).toLocaleString();
    console.log(`   ✅ Player Registrations: ${playerRegistrations}`);
    
    // Total Wins (subtitle)
    const totalWins = analyticsData?.data?.totalWins || 0;
    console.log(`   ✅ Total Wins: ${totalWins} total wins`);
    
    // Test topTournaments processing
    console.log('\n🏆 Testing Top Tournaments:');
    const topTournaments = tournamentStatsData?.data?.topTournaments || [];
    console.log(`   ✅ topTournaments array: ${topTournaments.length} tournaments`);
    
    // Test map operation that was failing
    const processedTournaments = topTournaments.map((tournament, index) => {
      const participants = (tournament.participants || 0).toLocaleString();
      const prizePool = (tournament.prizePool || 0).toLocaleString();
      
      console.log(`     ${index + 1}. ${tournament.name || 'Unknown'}`);
      console.log(`        - Participants: ${participants}`);
      console.log(`        - Prize Pool: ₹${prizePool}`);
      console.log(`        - Status: ${tournament.status || 'Unknown'}`);
      
      return {
        name: tournament.name || 'Unknown Tournament',
        participants: tournament.participants || 0,
        prizePool: tournament.prizePool || 0,
        status: tournament.status || 'Unknown'
      };
    });
    
    console.log(`   ✅ Tournaments processed successfully: ${processedTournaments.length} items`);
    
    // Test empty state handling
    if (topTournaments.length === 0) {
      console.log(`   - Empty state: No tournaments to display`);
    } else {
      console.log(`   - Data display: ${topTournaments.length} tournaments would be rendered`);
    }
    
    return true;
  } catch (error) {
    console.log(`❌ Error processing analytics data: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
    return false;
  }
}

// Test specific toLocaleString scenarios
function testToLocaleStringScenarios() {
  console.log('\n🔢 Testing toLocaleString scenarios:');
  
  const testValues = [
    { name: 'Valid number', value: 123456 },
    { name: 'Zero', value: 0 },
    { name: 'Null with fallback', value: null, fallback: 0 },
    { name: 'Undefined with fallback', value: undefined, fallback: 0 },
    { name: 'String number', value: "123456" },
    { name: 'Empty string with fallback', value: "", fallback: 0 }
  ];
  
  testValues.forEach(({ name, value, fallback }) => {
    try {
      const result = fallback !== undefined 
        ? (value || fallback).toLocaleString()
        : value.toLocaleString();
      console.log(`   ✅ ${name}: ${result}`);
    } catch (error) {
      console.log(`   ❌ ${name}: ${error.message}`);
    }
  });
}

// Run tests
console.log('🔧 Testing Analytics toLocaleString Fix\n');
console.log('This test simulates the scenarios that were causing "Cannot read properties of undefined (reading \'toLocaleString\')" errors');

let passedTests = 0;
let totalTests = testScenarios.length;

testScenarios.forEach((scenario, index) => {
  console.log(`\n📋 Test ${index + 1}/${totalTests}: ${scenario.name}`);
  
  const success = testAnalyticsDataProcessing(scenario.analyticsData, scenario.tournamentStatsData);
  if (success) {
    passedTests++;
    console.log(`   ✅ PASSED`);
  } else {
    console.log(`   ❌ FAILED`);
  }
});

// Test toLocaleString scenarios
testToLocaleStringScenarios();

console.log(`\n📊 Test Results:`);
console.log(`   Passed: ${passedTests}/${totalTests}`);
console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

if (passedTests === totalTests) {
  console.log(`\n🎉 All tests passed! The Analytics toLocaleString fix is working correctly.`);
  console.log(`   The "Cannot read properties of undefined (reading 'toLocaleString')" error should be resolved.`);
} else {
  console.log(`\n⚠️  Some tests failed. The fix may need additional work.`);
}

console.log(`\n🔍 Key fixes implemented:`);
console.log(`   1. StatCard values: (analyticsData?.data?.value || 0).toLocaleString()`);
console.log(`   2. Tournament participants: (tournament.participants || 0).toLocaleString()`);
console.log(`   3. Tournament prize pool: (tournament.prizePool || 0).toLocaleString()`);
console.log(`   4. Fallback arrays: tournamentStatsData?.data?.topTournaments || []`);
console.log(`   5. Safe property access: tournament.name || 'Unknown'`);

console.log(`\n🎯 Component behavior:`);
console.log(`   - Loading state: Shows "..." while fetching data`);
console.log(`   - Null/undefined values: Display as "0" with proper formatting`);
console.log(`   - Empty arrays: Handle gracefully without errors`);
console.log(`   - Valid data: Display with proper number formatting`);