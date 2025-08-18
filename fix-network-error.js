/**
 * Fix Network Error - Comprehensive Backend Connectivity Test
 * This script diagnoses and fixes network connectivity issues
 */

const axios = require('axios');

// Configuration
const BACKEND_URL = 'https://gameon-backend.onrender.com';
const ADMIN_EMAIL = 'admin@gameon.com';
const ADMIN_PASSWORD = 'GameOn@2024!';

console.log('🔍 Diagnosing Network Error Issues...\n');

async function testBackendConnectivity() {
  console.log('1. Testing Backend Connectivity...');
  console.log('Backend URL:', BACKEND_URL);
  
  // Test 1: Basic server connectivity
  try {
    console.log('\n📡 Testing basic server response...');
    const response = await axios.get(BACKEND_URL, { timeout: 15000 });
    console.log('✅ Backend server is responding');
    console.log('Status:', response.status);
    console.log('Response:', response.data?.message || 'OK');
  } catch (error) {
    console.log('❌ Backend server is not responding');
    console.log('Error:', error.code || error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 DNS resolution failed - check if the domain exists');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('💡 Connection refused - server might be down');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('💡 Connection timeout - server is slow or unreachable');
    }
    
    return false;
  }
  
  // Test 2: Health endpoint
  try {
    console.log('\n🏥 Testing health endpoint...');
    const healthResponse = await axios.get(`${BACKEND_URL}/api/health`, { timeout: 10000 });
    console.log('✅ Health endpoint is working');
    console.log('DB Status:', healthResponse.data.dbStatus);
    console.log('Environment:', healthResponse.data.environment);
  } catch (error) {
    console.log('❌ Health endpoint failed');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data?.message || error.message);
  }
  
  // Test 3: Admin auth endpoint
  try {
    console.log('\n🔐 Testing admin auth endpoint...');
    const authResponse = await axios.post(`${BACKEND_URL}/api/admin/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000
    });
    
    console.log('✅ Admin auth endpoint is working');
    console.log('Login successful:', authResponse.data.success);
    console.log('Admin:', authResponse.data.admin?.name);
    
    return true;
  } catch (error) {
    console.log('❌ Admin auth endpoint failed');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Authentication failed - admin user might not exist');
    } else if (error.response?.status === 404) {
      console.log('💡 Endpoint not found - check backend deployment');
    } else if (error.response?.status >= 500) {
      console.log('💡 Server error - check backend logs');
    }
    
    return false;
  }
}

async function testCORSConfiguration() {
  console.log('\n2. Testing CORS Configuration...');
  
  // Common Vercel domains to test
  const testDomains = [
    'https://gameon-admin-panel.vercel.app',
    'https://gameon-admin.vercel.app',
    'https://your-admin-panel.vercel.app'
  ];
  
  for (const domain of testDomains) {
    try {
      console.log(`\n🌐 Testing CORS for: ${domain}`);
      
      const response = await axios.options(`${BACKEND_URL}/api/admin/auth/login`, {
        headers: {
          'Origin': domain,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        },
        timeout: 10000
      });
      
      console.log('✅ CORS preflight successful');
    } catch (error) {
      console.log('❌ CORS preflight failed');
      console.log('Error:', error.message);
    }
  }
}

async function checkRenderDeployment() {
  console.log('\n3. Checking Render Deployment Status...');
  
  try {
    // Try to get any response from the server
    const response = await axios.get(BACKEND_URL, { 
      timeout: 20000,
      validateStatus: () => true // Accept any status code
    });
    
    console.log('✅ Render service is responding');
    console.log('Status Code:', response.status);
    
    if (response.status === 503) {
      console.log('⚠️  Service Unavailable - Render might be starting up');
      console.log('💡 Wait a few minutes and try again');
    }
    
  } catch (error) {
    console.log('❌ Render service is not responding');
    console.log('Error:', error.code || error.message);
    
    console.log('\n💡 Possible Render Issues:');
    console.log('   - Service is sleeping (free tier)');
    console.log('   - Deployment failed');
    console.log('   - Environment variables missing');
    console.log('   - Build errors');
    console.log('\n🔧 Solutions:');
    console.log('   1. Check Render dashboard for deployment status');
    console.log('   2. Check Render logs for errors');
    console.log('   3. Redeploy the service');
    console.log('   4. Verify environment variables');
  }
}

async function testAlternativeEndpoints() {
  console.log('\n4. Testing Alternative Endpoints...');
  
  const endpoints = [
    '/api',
    '/api/tournaments',
    '/api/users',
    '/health',
    '/status'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${BACKEND_URL}${endpoint}`, { 
        timeout: 5000,
        validateStatus: () => true 
      });
      
      console.log(`✅ ${endpoint} - Status: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.code || error.message}`);
    }
  }
}

async function generateSolutions() {
  console.log('\n📋 Network Error Solutions:');
  console.log('================================');
  
  console.log('\n🔧 Immediate Actions:');
  console.log('1. Check Render Dashboard:');
  console.log('   - Go to https://dashboard.render.com');
  console.log('   - Check if your backend service is running');
  console.log('   - Look for deployment errors');
  
  console.log('\n2. Check Render Logs:');
  console.log('   - Go to your service → Logs tab');
  console.log('   - Look for startup errors');
  console.log('   - Check for MongoDB connection issues');
  
  console.log('\n3. Verify Environment Variables:');
  console.log('   - MONGODB_URI or DATABASE_URL');
  console.log('   - JWT_SECRET');
  console.log('   - NODE_ENV=production');
  
  console.log('\n4. Test Local Backend:');
  console.log('   - cd backend && npm start');
  console.log('   - Test if it works locally');
  
  console.log('\n5. Redeploy Backend:');
  console.log('   - Push changes to your repository');
  console.log('   - Trigger manual deploy on Render');
  
  console.log('\n🔍 Admin Panel Fixes:');
  console.log('1. Check Vercel Environment Variables:');
  console.log('   - REACT_APP_API_URL should be: https://gameon-backend.onrender.com/api');
  
  console.log('\n2. Update CORS in Backend:');
  console.log('   - Add your actual Vercel admin panel URL to CORS');
  
  console.log('\n3. Redeploy Admin Panel:');
  console.log('   - cd admin-panel && vercel --prod --force');
  
  console.log('\n⚠️  Common Issues:');
  console.log('- Render free tier: Services sleep after 15 minutes of inactivity');
  console.log('- Cold starts: First request might take 30+ seconds');
  console.log('- Environment variables: Missing or incorrect values');
  console.log('- CORS: Frontend domain not allowed by backend');
}

async function runDiagnostics() {
  const backendWorking = await testBackendConnectivity();
  
  if (backendWorking) {
    await testCORSConfiguration();
  } else {
    await checkRenderDeployment();
    await testAlternativeEndpoints();
  }
  
  await generateSolutions();
  
  console.log('\n🎯 Next Steps:');
  if (!backendWorking) {
    console.log('1. ⚠️  PRIORITY: Fix backend deployment on Render');
    console.log('2. Check Render dashboard and logs');
    console.log('3. Verify environment variables');
    console.log('4. Redeploy if necessary');
  } else {
    console.log('1. ✅ Backend is working');
    console.log('2. Check admin panel environment variables');
    console.log('3. Update CORS if needed');
    console.log('4. Redeploy admin panel');
  }
}

// Run the diagnostics
runDiagnostics().catch(console.error);