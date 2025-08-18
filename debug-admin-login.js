/**
 * Debug Admin Login Issues
 * This script helps diagnose admin login problems
 */

const axios = require('axios');

// Configuration
const BACKEND_URL = 'https://gameon-backend.onrender.com'; // Your deployed backend URL
const ADMIN_EMAIL = 'admin@gameon.com';
const ADMIN_PASSWORD = 'GameOn@2024!'; // Default password

console.log('🔍 Debugging Admin Login Issues...\n');

async function debugAdminLogin() {
  try {
    console.log('1. Testing Backend Connection...');
    
    // Test basic backend connectivity
    try {
      const healthCheck = await axios.get(`${BACKEND_URL}/api/health`);
      console.log('✅ Backend is accessible');
    } catch (error) {
      console.log('❌ Backend health check failed:', error.message);
      
      // Try basic connection
      try {
        const basicCheck = await axios.get(BACKEND_URL);
        console.log('✅ Backend server is running');
      } catch (basicError) {
        console.log('❌ Backend server is not accessible:', basicError.message);
        return;
      }
    }

    console.log('\n2. Testing Admin Login Endpoint...');
    
    // Test admin login
    try {
      const loginResponse = await axios.post(`${BACKEND_URL}/api/admin/auth/login`, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('✅ Admin login successful!');
      console.log('Response:', {
        success: loginResponse.data.success,
        message: loginResponse.data.message,
        hasToken: !!loginResponse.data.token,
        adminName: loginResponse.data.admin?.name,
        adminEmail: loginResponse.data.admin?.email,
        adminRole: loginResponse.data.admin?.role
      });

      // Test token validation
      if (loginResponse.data.token) {
        console.log('\n3. Testing Token Validation...');
        try {
          const checkResponse = await axios.get(`${BACKEND_URL}/api/admin/auth/check`, {
            headers: {
              'Authorization': `Bearer ${loginResponse.data.token}`
            }
          });
          console.log('✅ Token validation successful');
          console.log('Admin details:', checkResponse.data.admin?.name);
        } catch (tokenError) {
          console.log('❌ Token validation failed:', tokenError.response?.data?.message || tokenError.message);
        }
      }

    } catch (loginError) {
      console.log('❌ Admin login failed');
      console.log('Status:', loginError.response?.status);
      console.log('Error:', loginError.response?.data?.message || loginError.message);
      
      if (loginError.response?.status === 401) {
        console.log('\n🔍 This suggests either:');
        console.log('   - Admin user does not exist');
        console.log('   - Password is incorrect');
        console.log('   - Admin account is inactive');
        
        console.log('\n4. Checking if admin user exists...');
        // We can't directly check the database, but we can try different scenarios
        
        // Try with different common passwords
        const commonPasswords = ['admin123', 'password', '123456', 'admin', 'GameOn123'];
        for (const pwd of commonPasswords) {
          try {
            await axios.post(`${BACKEND_URL}/api/admin/auth/login`, {
              email: ADMIN_EMAIL,
              password: pwd
            });
            console.log(`✅ Login successful with password: ${pwd}`);
            return;
          } catch (e) {
            // Continue trying
          }
        }
        
        console.log('❌ None of the common passwords worked');
        console.log('\n💡 Solutions:');
        console.log('   1. Create an admin user using the backend script');
        console.log('   2. Check if admin user exists in database');
        console.log('   3. Reset admin password');
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Test CORS
async function testCORS() {
  console.log('\n5. Testing CORS Configuration...');
  
  try {
    const response = await axios.options(`${BACKEND_URL}/api/admin/auth/login`, {
      headers: {
        'Origin': 'https://your-admin-panel.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    console.log('✅ CORS preflight successful');
  } catch (corsError) {
    console.log('❌ CORS preflight failed:', corsError.message);
    console.log('💡 Make sure your Vercel domain is added to backend CORS configuration');
  }
}

// Run diagnostics
async function runDiagnostics() {
  await debugAdminLogin();
  await testCORS();
  
  console.log('\n📋 Summary:');
  console.log('If login is failing, try these steps:');
  console.log('1. Create admin user: node create-admin-user.js');
  console.log('2. Check backend logs on Render');
  console.log('3. Verify environment variables in Vercel');
  console.log('4. Check browser console for detailed errors');
  console.log('5. Ensure CORS allows your Vercel domain');
}

runDiagnostics();