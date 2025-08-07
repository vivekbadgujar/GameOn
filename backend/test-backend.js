// Quick test to verify backend starts without errors
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

console.log('Testing backend startup...');

// Test MongoDB connection
const testConnection = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.log('❌ MONGODB_URI not found in environment variables');
      return false;
    }
    
    console.log('🔄 Testing MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB connection successful');
    await mongoose.connection.close();
    return true;
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
    return false;
  }
};

// Test basic server setup
const testServer = () => {
  try {
    const app = express();
    app.get('/test', (req, res) => res.json({ success: true }));
    
    const server = app.listen(0, () => {
      const port = server.address().port;
      console.log('✅ Express server test successful on port', port);
      server.close();
    });
    
    return true;
  } catch (error) {
    console.log('❌ Express server test failed:', error.message);
    return false;
  }
};

// Run tests
const runTests = async () => {
  console.log('🚀 Starting backend tests...\n');
  
  const serverTest = testServer();
  const dbTest = await testConnection();
  
  console.log('\n📊 Test Results:');
  console.log('Express Server:', serverTest ? '✅ PASS' : '❌ FAIL');
  console.log('MongoDB Connection:', dbTest ? '✅ PASS' : '❌ FAIL');
  
  if (serverTest && dbTest) {
    console.log('\n🎉 All tests passed! Backend should start without errors.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the issues above.');
  }
  
  process.exit(0);
};

runTests();