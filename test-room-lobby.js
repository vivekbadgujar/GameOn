/**
 * Test script for Room Lobby System
 * Run this with: node test-room-lobby.js
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5000/api';
let authToken = '';
let tournamentId = '';

// Test configuration
const testUser = {
  email: 'test@example.com',
  password: 'password123'
};

async function testLogin() {
  console.log('🔐 Testing user login...');
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    const data = await response.json();
    
    if (data.success) {
      authToken = data.token;
      console.log('✅ Login successful');
      return true;
    } else {
      console.log('❌ Login failed:', data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return false;
  }
}

async function testGetTournaments() {
  console.log('🏆 Testing get tournaments...');
  
  try {
    const response = await fetch(`${API_BASE}/tournaments`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    
    if (data.success && data.tournaments.length > 0) {
      tournamentId = data.tournaments[0]._id;
      console.log('✅ Found tournaments:', data.tournaments.length);
      console.log('📝 Using tournament:', data.tournaments[0].title);
      return true;
    } else {
      console.log('❌ No tournaments found');
      return false;
    }
  } catch (error) {
    console.log('❌ Get tournaments error:', error.message);
    return false;
  }
}

async function testMyTournaments() {
  console.log('📋 Testing my tournaments endpoint...');
  
  try {
    const response = await fetch(`${API_BASE}/tournaments/my-tournaments`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ My tournaments endpoint working');
      console.log('📊 User tournaments:', data.data.length);
      return true;
    } else {
      console.log('❌ My tournaments failed:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ My tournaments error:', error.message);
    return false;
  }
}

async function testRoomSlots() {
  console.log('🎮 Testing room slots endpoint...');
  
  if (!tournamentId) {
    console.log('❌ No tournament ID available');
    return false;
  }
  
  try {
    const response = await fetch(`${API_BASE}/room-slots/tournament/${tournamentId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Room slots endpoint working');
      console.log('🏢 Teams:', data.data.roomSlot.teams.length);
      console.log('👥 Total players:', data.data.roomSlot.totalPlayers);
      
      if (data.data.playerSlot) {
        console.log('🎯 Player slot:', `Team ${data.data.playerSlot.teamNumber}, Slot ${data.data.playerSlot.slotNumber}`);
      } else {
        console.log('⚠️ Player not assigned to any slot');
      }
      
      return true;
    } else {
      console.log('❌ Room slots failed:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Room slots error:', error.message);
    return false;
  }
}

async function testSlotMove() {
  console.log('🔄 Testing slot move...');
  
  if (!tournamentId) {
    console.log('❌ No tournament ID available');
    return false;
  }
  
  try {
    const response = await fetch(`${API_BASE}/room-slots/tournament/${tournamentId}/move`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        toTeam: 1,
        toSlot: 2
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Slot move successful');
      console.log('🎯 New position:', `Team ${data.data.playerSlot.teamNumber}, Slot ${data.data.playerSlot.slotNumber}`);
      return true;
    } else {
      console.log('⚠️ Slot move result:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Slot move error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Room Lobby System Tests\n');
  
  const tests = [
    { name: 'User Login', fn: testLogin },
    { name: 'Get Tournaments', fn: testGetTournaments },
    { name: 'My Tournaments', fn: testMyTournaments },
    { name: 'Room Slots', fn: testRoomSlots },
    { name: 'Slot Move', fn: testSlotMove }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    const result = await test.fn();
    if (result) passed++;
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Room Lobby System is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please check the implementation.');
  }
}

// Run the tests
runTests().catch(console.error);