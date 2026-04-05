#!/usr/bin/env node

/**
 * Cloudinary Migration Test Script
 * Verifies that the image upload system has been properly migrated to Cloudinary
 */

const fs = require('fs');
const path = require('path');

console.log('☁️  Testing Cloudinary Migration\n');

// Test 1: Check Cloudinary configuration
console.log('🔧 Test 1: Checking Cloudinary configuration...');
try {
  const cloudinaryConfig = require('./config/cloudinary.js');
  const hasCloudinary = !!process.env.CLOUDINARY_CLOUD_NAME && 
                        !!process.env.CLOUDINARY_API_KEY && 
                        !!process.env.CLOUDINARY_API_SECRET &&
                        process.env.CLOUDINARY_CLOUD_NAME !== 'your-cloud-name';
  
  if (hasCloudinary) {
    console.log('✅ Cloudinary environment variables configured');
  } else {
    console.log('❌ Cloudinary environment variables missing');
    console.log('   Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  }
} catch (error) {
  console.log('❌ Cloudinary config error:', error.message);
}

// Test 2: Check tournament routes use Cloudinary
console.log('\n📁 Test 2: Checking tournament upload routes...');
try {
  const tournamentRoutes = fs.readFileSync('./routes/admin/tournaments.js', 'utf8');
  
  const hasMemoryStorage = tournamentRoutes.includes('memoryStorage');
  const hasCloudinaryUpload = tournamentRoutes.includes('uploadToCloudinary');
  const hasNoLocalStorage = !tournamentRoutes.includes('diskStorage');
  
  if (hasMemoryStorage && hasCloudinaryUpload && hasNoLocalStorage) {
    console.log('✅ Tournament routes - using Cloudinary memory storage');
  } else {
    console.log('❌ Tournament routes - still using local storage');
    console.log(`   Memory storage: ${hasMemoryStorage}`);
    console.log(`   Cloudinary upload: ${hasCloudinaryUpload}`);
    console.log(`   No disk storage: ${hasNoLocalStorage}`);
  }
} catch (error) {
  console.log('❌ Tournament routes check error:', error.message);
}

// Test 3: Check manual payments use Cloudinary
console.log('\n💳 Test 3: Checking manual payment upload routes...');
try {
  const paymentRoutes = fs.readFileSync('./routes/manualPayments.js', 'utf8');
  
  const hasMemoryStorage = paymentRoutes.includes('memoryStorage');
  const hasCloudinaryUpload = paymentRoutes.includes('uploadScreenshotToCloudinary');
  const hasNoLocalStorage = !paymentRoutes.includes('diskStorage');
  
  if (hasMemoryStorage && hasCloudinaryUpload && hasNoLocalStorage) {
    console.log('✅ Payment routes - using Cloudinary memory storage');
  } else {
    console.log('❌ Payment routes - still using local storage');
  }
} catch (error) {
  console.log('❌ Payment routes check error:', error.message);
}

// Test 4: Check admin media uses Cloudinary
console.log('\n🎬 Test 4: Checking admin media upload routes...');
try {
  const mediaRoutes = fs.readFileSync('./routes/admin/media.js', 'utf8');
  
  const hasMemoryStorage = mediaRoutes.includes('memoryStorage');
  const hasCloudinaryUpload = mediaRoutes.includes('uploadToCloudinary');
  const hasNoLocalStorage = !mediaRoutes.includes('diskStorage');
  
  if (hasMemoryStorage && hasCloudinaryUpload && hasNoLocalStorage) {
    console.log('✅ Media routes - using Cloudinary memory storage');
  } else {
    console.log('❌ Media routes - still using local storage');
  }
} catch (error) {
  console.log('❌ Media routes check error:', error.message);
}

// Test 5: Check server.js has no static file serving
console.log('\n🌐 Test 5: Checking static file serving removal...');
try {
  const serverJs = fs.readFileSync('./server.js', 'utf8');
  
  const hasNoStaticUploads = !serverJs.includes("app.use('/uploads'") &&
                              !serverJs.includes('express.static') &&
                              serverJs.includes('No more local file serving');
  
  if (hasNoStaticUploads) {
    console.log('✅ Server - local file serving removed');
  } else {
    console.log('❌ Server - still serving local files');
  }
} catch (error) {
  console.log('❌ Server check error:', error.message);
}

// Test 6: Check frontend URL handling
console.log('\n🎨 Test 6: Checking frontend URL handling...');
try {
  const frontendConfig = fs.readFileSync('../frontend/src/config.js', 'utf8');
  const adminUtils = fs.readFileSync('../admin-panel/src/utils/urlUtils.js', 'utf8');
  
  const frontendHandlesCloudinary = frontendConfig.includes("If it's already a full Cloudinary URL");
  const adminHandlesCloudinary = adminUtils.includes("If it's already a full Cloudinary");
  
  if (frontendHandlesCloudinary && adminHandlesCloudinary) {
    console.log('✅ Frontend & Admin - handle Cloudinary URLs directly');
  } else {
    console.log('❌ Frontend & Admin - URL handling needs update');
  }
} catch (error) {
  console.log('❌ Frontend check error:', error.message);
}

// Test 7: Check Media model has Cloudinary fields
console.log('\n📊 Test 7: Checking Media model Cloudinary fields...');
try {
  const mediaModel = fs.readFileSync('./models/Media.js', 'utf8');
  
  const hasPublicId = mediaModel.includes('publicId:');
  const hasCloudinaryFields = mediaModel.includes('Cloudinary-specific fields');
  const hasOptimizedVirtual = mediaModel.includes('optimizedUrl');
  
  if (hasPublicId && hasCloudinaryFields && hasOptimizedVirtual) {
    console.log('✅ Media model - Cloudinary fields added');
  } else {
    console.log('❌ Media model - missing Cloudinary fields');
  }
} catch (error) {
  console.log('❌ Media model check error:', error.message);
}

// Test 8: Check if uploads directory can be safely removed
console.log('\n🗂️  Test 8: Checking uploads directory dependencies...');
const uploadsDir = './uploads';
if (fs.existsSync(uploadsDir)) {
  try {
    const files = fs.readdirSync(uploadsDir);
    if (files.length === 0) {
      console.log('✅ Uploads directory exists but empty - can be safely removed');
    } else {
      console.log('⚠️  Uploads directory has files - backup before removing');
      console.log('   Files:', files.join(', '));
    }
  } catch (error) {
    console.log('❌ Cannot check uploads directory:', error.message);
  }
} else {
  console.log('✅ Uploads directory does not exist');
}

console.log('\n🎯 Migration Summary:');
console.log('📋 Expected behavior after migration:');
console.log('   1. All uploads go directly to Cloudinary (memory buffer → Cloudinary)');
console.log('   2. No local files stored in /uploads directory');
console.log('   3. Database stores Cloudinary URLs (https://res.cloudinary.com/...)');
console.log('   4. Frontend displays Cloudinary URLs directly');
console.log('   5. Images survive server redeploys and scale across instances');
console.log('   6. No more 404 errors for uploaded images');

console.log('\n🚀 Next steps:');
console.log('   1. Set Cloudinary environment variables in production');
console.log('   2. Deploy these changes to your server');
console.log('   3. Test uploading tournament thumbnails and QR codes');
console.log('   4. Verify images appear instantly in frontend');
console.log('   5. Remove /uploads directory if empty (backup first!)');

console.log('\n☁️  Cloudinary migration test complete!');
