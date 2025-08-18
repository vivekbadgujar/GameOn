/**
 * Test CORS Fix for Admin Panel
 * This script tests if the CORS configuration will work after NODE_ENV=production
 */

const https = require('https');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const BACKEND_URL = 'https://gameon-ezuu.onrender.com';
const ADMIN_PANEL_ORIGIN = 'https://game-on-topaz.vercel.app';

console.log(`${colors.blue}🧪 Testing CORS Fix for Admin Panel...${colors.reset}\n`);

// Test current backend status
function testBackendHealth() {
  return new Promise((resolve, reject) => {
    console.log(`${colors.blue}1. Testing backend health...${colors.reset}`);
    
    const req = https.get(`${BACKEND_URL}/api/health`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          console.log(`${colors.green}✅ Backend is running${colors.reset}`);
          console.log(`${colors.blue}   Environment: ${response.environment}${colors.reset}`);
          console.log(`${colors.blue}   DB Status: ${response.dbStatus}${colors.reset}`);
          
          if (response.environment === 'development') {
            console.log(`${colors.yellow}⚠️  NODE_ENV is 'development' - CORS will block admin panel${colors.reset}`);
            console.log(`${colors.yellow}   Fix: Set NODE_ENV=production in Render dashboard${colors.reset}`);
          } else if (response.environment === 'production') {
            console.log(`${colors.green}✅ NODE_ENV is 'production' - CORS should allow admin panel${colors.reset}`);
          }
          
          resolve(response);
        } catch (error) {
          console.log(`${colors.red}❌ Invalid response: ${data}${colors.reset}`);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`${colors.red}❌ Backend health check failed: ${error.message}${colors.reset}`);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      console.log(`${colors.red}❌ Backend health check timeout${colors.reset}`);
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Test CORS preflight request
function testCORSPreflight() {
  return new Promise((resolve, reject) => {
    console.log(`\n${colors.blue}2. Testing CORS preflight request...${colors.reset}`);
    
    const options = {
      hostname: 'gameon-ezuu.onrender.com',
      port: 443,
      path: '/api/admin/auth/login',
      method: 'OPTIONS',
      headers: {
        'Origin': ADMIN_PANEL_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    };
    
    const req = https.request(options, (res) => {
      const corsHeaders = {
        'access-control-allow-origin': res.headers['access-control-allow-origin'],
        'access-control-allow-methods': res.headers['access-control-allow-methods'],
        'access-control-allow-headers': res.headers['access-control-allow-headers'],
        'access-control-allow-credentials': res.headers['access-control-allow-credentials']
      };
      
      console.log(`${colors.blue}   Status Code: ${res.statusCode}${colors.reset}`);
      console.log(`${colors.blue}   CORS Headers:${colors.reset}`);
      
      let corsWorking = true;
      
      if (corsHeaders['access-control-allow-origin']) {
        if (corsHeaders['access-control-allow-origin'] === ADMIN_PANEL_ORIGIN || corsHeaders['access-control-allow-origin'] === '*') {
          console.log(`${colors.green}   ✅ Access-Control-Allow-Origin: ${corsHeaders['access-control-allow-origin']}${colors.reset}`);
        } else {
          console.log(`${colors.red}   ❌ Access-Control-Allow-Origin: ${corsHeaders['access-control-allow-origin']} (should be ${ADMIN_PANEL_ORIGIN})${colors.reset}`);
          corsWorking = false;
        }
      } else {
        console.log(`${colors.red}   ❌ Access-Control-Allow-Origin: Not set${colors.reset}`);
        corsWorking = false;
      }
      
      if (corsHeaders['access-control-allow-methods']) {
        console.log(`${colors.green}   ✅ Access-Control-Allow-Methods: ${corsHeaders['access-control-allow-methods']}${colors.reset}`);
      } else {
        console.log(`${colors.yellow}   ⚠️  Access-Control-Allow-Methods: Not set${colors.reset}`);
      }
      
      if (corsHeaders['access-control-allow-headers']) {
        console.log(`${colors.green}   ✅ Access-Control-Allow-Headers: ${corsHeaders['access-control-allow-headers']}${colors.reset}`);
      } else {
        console.log(`${colors.yellow}   ⚠️  Access-Control-Allow-Headers: Not set${colors.reset}`);
      }
      
      if (corsHeaders['access-control-allow-credentials']) {
        console.log(`${colors.green}   ✅ Access-Control-Allow-Credentials: ${corsHeaders['access-control-allow-credentials']}${colors.reset}`);
      } else {
        console.log(`${colors.yellow}   ⚠️  Access-Control-Allow-Credentials: Not set${colors.reset}`);
      }
      
      if (corsWorking) {
        console.log(`${colors.green}✅ CORS is configured correctly${colors.reset}`);
        resolve(corsHeaders);
      } else {
        console.log(`${colors.red}❌ CORS is not configured correctly${colors.reset}`);
        reject(new Error('CORS not working'));
      }
    });
    
    req.on('error', (error) => {
      console.log(`${colors.red}❌ CORS test failed: ${error.message}${colors.reset}`);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      console.log(`${colors.red}❌ CORS test timeout${colors.reset}`);
      req.destroy();
      reject(new Error('CORS test timeout'));
    });
    
    req.end();
  });
}

// Test admin login endpoint accessibility
function testAdminLoginEndpoint() {
  return new Promise((resolve, reject) => {
    console.log(`\n${colors.blue}3. Testing admin login endpoint...${colors.reset}`);
    
    const postData = JSON.stringify({
      email: 'test@example.com',
      password: 'testpassword'
    });
    
    const options = {
      hostname: 'gameon-ezuu.onrender.com',
      port: 443,
      path: '/api/admin/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Origin': ADMIN_PANEL_ORIGIN
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`${colors.blue}   Status Code: ${res.statusCode}${colors.reset}`);
        
        if (res.statusCode === 400 || res.statusCode === 401) {
          console.log(`${colors.green}✅ Endpoint accessible (expected auth failure with test credentials)${colors.reset}`);
          resolve({ accessible: true, statusCode: res.statusCode });
        } else if (res.statusCode === 404) {
          console.log(`${colors.red}❌ Endpoint not found (404)${colors.reset}`);
          reject(new Error('Endpoint not found'));
        } else {
          console.log(`${colors.yellow}⚠️  Unexpected status code: ${res.statusCode}${colors.reset}`);
          console.log(`${colors.yellow}   Response: ${data}${colors.reset}`);
          resolve({ accessible: true, statusCode: res.statusCode });
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`${colors.red}❌ Admin login test failed: ${error.message}${colors.reset}`);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      console.log(`${colors.red}❌ Admin login test timeout${colors.reset}`);
      req.destroy();
      reject(new Error('Admin login test timeout'));
    });
    
    req.write(postData);
    req.end();
  });
}

// Run all tests
async function runTests() {
  console.log(`${colors.blue}Backend URL: ${BACKEND_URL}${colors.reset}`);
  console.log(`${colors.blue}Admin Panel Origin: ${ADMIN_PANEL_ORIGIN}${colors.reset}\n`);
  
  let allPassed = true;
  
  try {
    const healthResponse = await testBackendHealth();
    
    if (healthResponse.environment === 'development') {
      console.log(`\n${colors.yellow}🔧 ACTION REQUIRED:${colors.reset}`);
      console.log(`${colors.yellow}1. Go to Render dashboard${colors.reset}`);
      console.log(`${colors.yellow}2. Set NODE_ENV=production${colors.reset}`);
      console.log(`${colors.yellow}3. Redeploy the service${colors.reset}`);
      console.log(`${colors.yellow}4. Run this test again${colors.reset}`);
      return;
    }
    
  } catch (error) {
    console.log(`${colors.red}Backend health check failed${colors.reset}`);
    allPassed = false;
  }
  
  try {
    await testCORSPreflight();
  } catch (error) {
    console.log(`${colors.red}CORS test failed${colors.reset}`);
    allPassed = false;
  }
  
  try {
    await testAdminLoginEndpoint();
  } catch (error) {
    console.log(`${colors.red}Admin login test failed${colors.reset}`);
    allPassed = false;
  }
  
  console.log(`\n${colors.blue}📊 Test Summary:${colors.reset}`);
  if (allPassed) {
    console.log(`${colors.green}🎉 All tests passed! Admin panel should work correctly.${colors.reset}`);
    console.log(`${colors.green}You can now try logging into the admin panel.${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Some tests failed. Check the errors above.${colors.reset}`);
  }
}

// Start tests
runTests().catch(console.error);