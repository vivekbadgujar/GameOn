const axios = require('axios');

// Test tournament status update
async function testTournamentStatusUpdate() {
  try {
    console.log('Testing tournament status update...');
    
    // First, get admin token (you'll need to replace with actual admin credentials)
    const loginResponse = await axios.post('http://localhost:5000/api/admin/auth/login', {
      email: 'admin@gameon.com', // Replace with actual admin email
      password: 'admin123' // Replace with actual admin password
    });
    
    const token = loginResponse.data.token;
    console.log('Admin login successful, token received');
    
    // Get tournaments to find one to test with
    const tournamentsResponse = await axios.get('http://localhost:5000/api/admin/tournaments', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Tournaments fetched:', tournamentsResponse.data.tournaments?.length || 0);
    
    if (tournamentsResponse.data.tournaments && tournamentsResponse.data.tournaments.length > 0) {
      const tournament = tournamentsResponse.data.tournaments[0];
      console.log('Testing with tournament:', tournament.title, 'Current status:', tournament.status);
      
      // Test status update
      const newStatus = tournament.status === 'upcoming' ? 'completed' : 'upcoming';
      console.log('Updating status to:', newStatus);
      
      const updateResponse = await axios.patch(
        `http://localhost:5000/api/admin/tournaments/${tournament._id}/status`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Status update response:', updateResponse.data);
      console.log('Status update successful!');
      
    } else {
      console.log('No tournaments found to test with');
    }
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
    console.error('Headers:', error.response?.headers);
  }
}

testTournamentStatusUpdate();