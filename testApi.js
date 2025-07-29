const axios = require('axios');

async function testTournamentsAPI() {
  try {
    console.log('Testing tournaments API...');
    
    const response = await axios.get('http://localhost:5000/api/tournaments', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.tournaments) {
      console.log('Tournaments count:', response.data.tournaments.length);
      response.data.tournaments.forEach((tournament, index) => {
        console.log(`Tournament ${index + 1}:`, {
          id: tournament._id,
          title: tournament.title,
          status: tournament.status,
          isVisible: tournament.isVisible
        });
      });
    }
    
  } catch (error) {
    console.error('Error testing API:', error.response?.data || error.message);
  }
}

testTournamentsAPI(); 