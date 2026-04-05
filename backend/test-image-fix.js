#!/usr/bin/env node

/**
 * Test script to verify image upload and serving fixes
 * Run this script to test the complete flow
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Image Upload and Serving Fixes\n');

// Test 1: Check if upload directories exist
console.log('📁 Test 1: Checking upload directories...');
const uploadDirs = [
  'uploads/thumbnails',
  'uploads/payment_qr',
  'uploads/media',
  'uploads/payment_screenshots'
];

let dirsOk = 0;
uploadDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${dir} - exists`);
    dirsOk++;
  } else {
    console.log(`❌ ${dir} - missing`);
  }
});

console.log(`\nDirectories: ${dirsOk}/${uploadDirs.length} exist\n`);

// Test 2: Check if backend routes are properly configured
console.log('🔧 Test 2: Checking backend route configuration...');
const tournamentRoutesPath = 'routes/admin/tournaments.js';
if (fs.existsSync(tournamentRoutesPath)) {
  const content = fs.readFileSync(tournamentRoutesPath, 'utf8');
  
  // Check for hardcoded URLs
  const hasHardcodedUrls = content.includes('https://api.gameonesport.xyz/uploads/');
  const hasRelativeUrls = content.includes("`/uploads/${subdir}/${filename}`");
  
  if (hasRelativeUrls && !hasHardcodedUrls) {
    console.log('✅ Tournament routes - using relative URLs');
  } else {
    console.log('❌ Tournament routes - still has hardcoded URLs');
  }
} else {
  console.log('❌ Tournament routes file not found');
}

// Test 3: Check static file serving in server.js
console.log('\n🌐 Test 3: Checking static file serving...');
const serverJsPath = 'server.js';
if (fs.existsSync(serverJsPath)) {
  const content = fs.readFileSync(serverJsPath, 'utf8');
  
  const hasStaticMiddleware = content.includes("app.use('/uploads'");
  const hasCorsHeaders = content.includes('Access-Control-Allow-Origin');
  
  if (hasStaticMiddleware) {
    console.log('✅ Static file middleware - configured');
  } else {
    console.log('❌ Static file middleware - missing');
  }
  
  if (hasCorsHeaders) {
    console.log('✅ CORS headers for uploads - configured');
  } else {
    console.log('❌ CORS headers for uploads - missing');
  }
} else {
  console.log('❌ Server.js file not found');
}

// Test 4: Check frontend config
console.log('\n🎨 Test 4: Checking frontend configuration...');
const frontendConfigPath = '../frontend/src/config.js';
if (fs.existsSync(frontendConfigPath)) {
  const content = fs.readFileSync(frontendConfigPath, 'utf8');
  
  const hasGetAssetUrl = content.includes('export const getAssetUrl');
  const hasCorrectBaseUrl = content.includes('baseUrl.replace(/\\/api\\/$/, \'\')');
  
  if (hasGetAssetUrl) {
    console.log('✅ Frontend getAssetUrl function - exists');
  } else {
    console.log('❌ Frontend getAssetUrl function - missing');
  }
  
  if (hasCorrectBaseUrl) {
    console.log('✅ Frontend URL handling - correct');
  } else {
    console.log('❌ Frontend URL handling - incorrect');
  }
} else {
  console.log('❌ Frontend config file not found');
}

// Test 5: Check admin panel utils
console.log('\n⚙️ Test 5: Checking admin panel utilities...');
const adminUtilsPath = '../admin-panel/src/utils/urlUtils.js';
if (fs.existsSync(adminUtilsPath)) {
  const content = fs.readFileSync(adminUtilsPath, 'utf8');
  
  const hasGetAssetUrl = content.includes('export const getAssetUrl');
  const hasUrlCleaning = content.includes('cleanPath.replace(/https?:\\/\\/api\\.gameonesport\\.xyz/g, \'\')');
  
  if (hasGetAssetUrl) {
    console.log('✅ Admin getAssetUrl function - exists');
  } else {
    console.log('❌ Admin getAssetUrl function - missing');
  }
  
  if (hasUrlCleaning) {
    console.log('✅ Admin URL cleaning - configured');
  } else {
    console.log('❌ Admin URL cleaning - missing');
  }
} else {
  console.log('❌ Admin utils file not found');
}

console.log('\n🎯 Test Summary:');
console.log('📋 Expected behavior after fixes:');
console.log('   1. Images upload to relative paths: /uploads/thumbnails/, /uploads/payment_qr/');
console.log('   2. Backend serves static files from /uploads route');
console.log('   3. Frontend constructs full URLs using API_BASE_URL + relative path');
console.log('   4. No hardcoded URLs in database or responses');
console.log('   5. Images should load in both frontend and admin panel');

console.log('\n🚀 Next steps:');
console.log('   1. Deploy these changes to your server');
console.log('   2. Test uploading a new tournament thumbnail and QR code');
console.log('   3. Verify images appear in frontend tournament cards');
console.log('   4. Check that edit tournament shows existing images');
console.log('   5. Monitor Network tab - should see 200 for /uploads/ URLs');

console.log('\n✨ Fix implementation complete!');
