/**
 * Test Backend Deployment
 * This script tests if your Render backend is working correctly
 */

const https = require('https');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const BACKEND_URL = 'https://gameon-backend.onrender.com';

console.log(`${colors.blue}🧪 Testing Backend Deployment...${colors.reset}\n`);

// Test health endpoint
function testHealthEndpoint() {
  return new Promise((resolve, reject) => {
    console.log(`${colors.blue}Testing: ${BACKEND_URL}/api/health${colors.reset}`);
    
    const req = https.get(`${BACKEND_URL}/api/health`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200 && response.success) {
            console.log(`${colors.green}✅ Health check passed${colors.reset}`);
            console.log(`${colors.green}   Status: ${response.message}${colors.reset}`);
            console.log(`${colors.green}   Environment: ${response.environment}${colors.reset}`);
            console.log(`${colors.green}   DB Status: ${response.dbStatus}${colors.reset}`);
            
            if (response.dbStatus === 'connected') {
              console.log(`${colors.green}✅ Database connection working${colors.reset}`);
            } else {
              console.log(`${colors.red}❌ Database not connected${colors.reset}`);
            }
            
            resolve(response);
          } else {
            console.log(`${colors.red}❌ Health check failed${colors.reset}`);
            console.log(`${colors.red}   Status Code: ${res.statusCode}${colors.reset}`);
            console.log(`${colors.red}   Response: ${data}${colors.reset}`);
            reject(new Error('Health check failed'));
          }
        } catch (error) {
          console.log(`${colors.red}❌ Invalid JSON response${colors.reset}`);
          console.log(`${colors.red}   Raw response: ${data}${colors.reset}`);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`${colors.red}❌ Request failed: ${error.message}${colors.reset}`);
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      console.log(`${colors.red}❌ Request timeout${colors.reset}`);
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Test CORS headers
function testCORSHeaders() {
  return new Promise((resolve, reject) => {
    console.log(`\n${colors.blue}Testing CORS headers...${colors.reset}`);
    
    const options = {
      hostname: 'gameon-backend.onrender.com',
      port: 443,
      path: '/api/health',
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://game-on-topaz.vercel.app',
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
      
      console.log(`${colors.blue}CORS Headers:${colors.reset}`);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        if (value) {
          console.log(`${colors.green}✅ ${key}: ${value}${colors.reset}`);
        } else {
          console.log(`${colors.yellow}⚪ ${key}: Not set${colors.reset}`);
        }
      });
      
      if (corsHeaders['access-control-allow-origin']) {
        console.log(`${colors.green}✅ CORS configured correctly${colors.reset}`);
        resolve(corsHeaders);
      } else {
        console.log(`${colors.red}❌ CORS not configured${colors.reset}`);
        reject(new Error('CORS not configured'));
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

// Test admin login endpoint
function testAdminLoginEndpoint() {
  return new Promise((resolve, reject) => {
    console.log(`\n${colors.blue}Testing admin login endpoint...${colors.reset}`);
    
    const postData = JSON.stringify({
      username: 'test',
      password: 'test'
    });
    
    const options = {
      hostname: 'gameon-backend.onrender.com',
      port: 443,
      path: '/api/admin/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Origin': 'https://game-on-topaz.vercel.app'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`${colors.blue}Admin login endpoint response:${colors.reset}`);
        console.log(`${colors.blue}Status Code: ${res.statusCode}${colors.reset}`);
        
        if (res.statusCode === 400 || res.statusCode === 401) {
          console.log(`${colors.green}✅ Endpoint accessible (expected auth failure)${colors.reset}`);
          resolve({ accessible: true, statusCode: res.statusCode });
        } else if (res.statusCode === 200) {
          console.log(`${colors.yellow}⚠️  Unexpected success (check credentials)${colors.reset}`);
          resolve({ accessible: true, statusCode: res.statusCode });
        } else {
          console.log(`${colors.red}❌ Unexpected status code: ${res.statusCode}${colors.reset}`);
          console.log(`${colors.red}Response: ${data}${colors.reset}`);
          reject(new Error(`Unexpected status: ${res.statusCode}`));
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
  let allPassed = true;
  
  try {
    await testHealthEndpoint();
  } catch (error) {
    allPassed = false;
  }
  
  try {
    await testCORSHeaders();
  } catch (error) {
    allPassed = false;
  }
  
  try {
    await testAdminLoginEndpoint();
  } catch (error) {
    allPassed = false;
  }
  
  console.log(`\n${colors.blue}📊 Test Summary:${colors.reset}`);
  if (allPassed) {
    console.log(`${colors.green}🎉 All tests passed! Backend is working correctly.${colors.reset}`);
    console.log(`${colors.green}Your admin panel should now work without CORS errors.${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Some tests failed. Check the errors above.${colors.reset}`);
    console.log(`\n${colors.yellow}💡 Common fixes:${colors.reset}`);
    console.log(`${colors.yellow}1. Ensure environment variables are set in Render${colors.reset}`);
    console.log(`${colors.yellow}2. Redeploy the service after setting variables${colors.reset}`);
    console.log(`${colors.yellow}3. Check Render logs for deployment errors${colors.reset}`);
  }
}

// Start tests
runTests().catch(console.error);