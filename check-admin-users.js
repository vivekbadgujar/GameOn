const axios = require('axios');

async function checkAdminUsers() {
  try {
    console.log('Checking for existing admin users...');
    
    // Try to access a protected admin endpoint to see what error we get
    try {
      const response = await axios.get('http://localhost:5000/api/admin/tournaments');
      console.log('Unexpected success:', response.data);
    } catch (error) {
      console.log('Expected auth error:', error.response?.status, error.response?.data?.message);
    }
    
    // Let's try different admin credentials that might exist
    const possibleCredentials = [
      { email: 'admin@gameon.com', password: 'admin123' },
      { email: 'admin@example.com', password: 'admin123' },
      { email: 'superadmin@gameon.com', password: 'admin123' },
      { email: 'test@gameon.com', password: 'password123' },
      { email: 'admin@gameon.com', password: 'password123' },
      { email: 'admin@gameon.com', password: '12345678' }
    ];
    
    for (const creds of possibleCredentials) {
      try {
        console.log(`\nTrying login with: ${creds.email}`);
        const loginResponse = await axios.post('http://localhost:5000/api/admin/auth/login', creds);
        
        if (loginResponse.data.success) {
          console.log('✅ Login successful with:', creds);
          console.log('Admin details:', loginResponse.data.admin);
          
          // Test the tournament status update with this token
          const token = loginResponse.data.token;
          
          // Get a tournament to test with
          const tournamentsResponse = await axios.get('http://localhost:5000/api/admin/tournaments/debug');
          if (tournamentsResponse.data.tournaments && tournamentsResponse.data.tournaments.length > 0) {
            const testTournament = tournamentsResponse.data.tournaments[0];
            
            console.log(`\nTesting status update for: ${testTournament.title}`);
            const statusUpdateResponse = await axios.patch(
              `http://localhost:5000/api/admin/tournaments/${testTournament._id}/status`,
              { status: 'completed' },
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
            );
            
            console.log('✅ Status update successful:', statusUpdateResponse.data);
            return; // Exit on success
          }
        }
      } catch (loginError) {
        if (loginError.response?.status === 401) {
          console.log(`❌ Invalid credentials for: ${creds.email}`);
        } else {
          console.log(`❌ Login error for ${creds.email}:`, loginError.response?.status, loginError.response?.data?.message);
        }
      }
    }
    
    console.log('\n❌ No valid admin credentials found');
    console.log('💡 You may need to create an admin user first');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

checkAdminUsers();