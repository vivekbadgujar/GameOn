#!/usr/bin/env node

/**
 * Test Cloudinary Configuration
 * Tests if your Cloudinary credentials are working properly
 */

// First, set environment variables BEFORE importing cloudinary config
process.env.CLOUDINARY_CLOUD_NAME = 'dapxrn7g3';
process.env.CLOUDINARY_API_KEY = '653297432828262';
process.env.CLOUDINARY_API_SECRET = 'L0An1xcIe9PaPfM7jhjlpSHz_m0';

console.log('🧪 Testing Cloudinary Configuration');
console.log('📛 Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('🔑 API Key:', process.env.CLOUDINARY_API_KEY.substring(0, 10) + '...');
console.log('🔐 Secret Set:', !!process.env.CLOUDINARY_API_SECRET);

// Now import and test
const { uploadImage } = require('./config/cloudinary');

// Create a test image buffer (1x1 red pixel)
const testImage = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');

const mockFile = {
  buffer: testImage,
  originalname: 'test.png',
  mimetype: 'image/png',
  size: testImage.length
};

console.log('\n📸 Testing image upload...');

uploadImage(mockFile, 'gameon/test')
  .then(result => {
    console.log('\n✅ SUCCESS! Cloudinary is working perfectly!');
    console.log('🔗 Image URL:', result.url);
    console.log('🆔 Public ID:', result.publicId);
    console.log('📏 Dimensions:', result.width + 'x' + result.height);
    console.log('📊 Size:', result.bytes + ' bytes');
    console.log('📁 Format:', result.format);
    
    console.log('\n🎯 Your Cloudinary setup is READY!');
    console.log('🚀 You can now deploy and test image uploads in the admin panel.');
  })
  .catch(error => {
    console.error('\n❌ FAILED! Cloudinary upload error:');
    console.error('Message:', error.message);
    
    if (error.message.includes('Cloud name') || error.message.includes('cloud_name')) {
      console.log('\n💡 Possible Issue: Cloud name might be incorrect');
      console.log('   Check: dapxrn7g3');
    }
    
    if (error.message.includes('key') || error.message.includes('api_key')) {
      console.log('\n💡 Possible Issue: API key might be incorrect');
      console.log('   Check: 653297432828262');
    }
    
    if (error.message.includes('secret') || error.message.includes('api_secret')) {
      console.log('\n💡 Possible Issue: API secret might be incorrect');
      console.log('   Check: L0An1xcIe9PaPfM7jhjlpSHz_m0');
    }
    
    if (error.message.includes('upload preset')) {
      console.log('\n💡 Possible Issue: Upload presets might need to be configured in Cloudinary dashboard');
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Verify Cloudinary dashboard is accessible');
    console.log('   2. Check account is active and not suspended');
    console.log('   3. Verify API permissions allow uploads');
    console.log('   4. Check if upload limits are exceeded');
  });
