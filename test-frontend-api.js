/**
 * Test script to simulate frontend API calls
 */

const axios = require('axios');

// Simulate the frontend API configuration against production API
const api = axios.create({
  baseURL: 'https://api.gameonesport.xyz/api',
  withCredentials: true,
  timeout: 30000,
});

// Add token to requests if available (simulate frontend behavior)
api.interceptors.request.use((config) => {
  // Simulate no token (user not logged in)
  const token = null; // localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add headers that frontend would send
  config.headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
  config.headers['Origin'] = 'https://gameonesport.xyz';
  config.headers['Referer'] = 'https://gameonesport.xyz/tournaments';
  
  console.log('Request headers:', config.headers);
  return config;
});

// Simulate the getTournamentById function from frontend
const getTournamentById = async (id) => {
  try {
    console.log('API: Fetching tournament by ID:', id);
    const response = await api.get(`/tournaments/${id}`);
    console.log('API: Tournament response:', response.data);
    
    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Failed to fetch tournament');
    }
    
    const tournament = response.data?.tournament;
    if (!tournament) {
      throw new Error('Tournament data not found in response');
    }
    
    console.log('API: Returning tournament:', tournament.title);
    return tournament;
  } catch (error) {
    console.error('API: Error fetching tournament by ID:', error.message);
    console.error('API: Error response:', error.response?.data);
    throw error;
  }
};

// Test the API call
const testTournamentId = '689b16d358663cb5d2a8b069';

console.log('Testing frontend API call simulation...');
console.log('Tournament ID:', testTournamentId);

getTournamentById(testTournamentId)
  .then(tournament => {
    console.log('\n✅ SUCCESS: Tournament fetched successfully');
    console.log('Tournament Details:');
    console.log('- ID:', tournament._id);
    console.log('- Title:', tournament.title);
    console.log('- Name:', tournament.name);
    console.log('- Status:', tournament.status);
    console.log('- Game:', tournament.game);
    console.log('- Entry Fee:', tournament.entryFee);
    console.log('- Prize Pool:', tournament.prizePool);
    console.log('- Max Participants:', tournament.maxParticipants);
    console.log('- Current Participants:', tournament.currentParticipants);
    console.log('- Start Date:', tournament.startDate);
    console.log('- Scheduled At:', tournament.scheduledAt);
  })
  .catch(error => {
    console.log('\n❌ ERROR: Failed to fetch tournament');
    console.log('Error message:', error.message);
    if (error.response) {
      console.log('HTTP Status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  });