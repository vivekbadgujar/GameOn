/**
 * Authentication Debug Script
 * This script will help us debug the authentication issues
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = 'mongodb+srv://vivekbadgujar:Vivek321@cluster0.squjxrk.mongodb.net/gameon?retryWrites=true&w=majority';

async function debugAuth() {
  try {
    console.log('🔍 Starting Authentication Debug...\n');
    
    // Connect to database
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Test 1: Check if users exist in database
    console.log('📊 Test 1: Checking existing users...');
    const allUsers = await User.find({}).select('email username phone gameProfile.bgmiId createdAt');
    console.log(`Found ${allUsers.length} users in database:`);
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}, Username: ${user.username}, Phone: ${user.phone}, BGMI ID: ${user.gameProfile?.bgmiId}`);
    });
    console.log('');

    // Test 2: Create a test user for debugging
    console.log('🧪 Test 2: Creating test user...');
    const testEmail = 'test@example.com';
    const testPassword = 'test123';
    
    // Remove existing test user if exists
    await User.deleteOne({ email: testEmail });
    
    const testUser = new User({
      email: testEmail,
      password: testPassword,
      username: 'testuser',
      displayName: 'Test User',
      phone: '9876543210',
      gameProfile: {
        bgmiId: '1234567890',
        bgmiName: 'TestPlayer'
      },
      isVerified: true
    });

    await testUser.save();
    console.log('✅ Test user created successfully');
    console.log(`Email: ${testUser.email}`);
    console.log(`Password (plain): ${testPassword}`);
    console.log(`Password (hashed): ${testUser.password}`);
    console.log('');

    // Test 3: Test password hashing and comparison
    console.log('🔐 Test 3: Testing password hashing...');
    const isPasswordHashed = testUser.password !== testPassword;
    console.log(`Password is hashed: ${isPasswordHashed}`);
    
    if (isPasswordHashed) {
      const isPasswordValid = await testUser.comparePassword(testPassword);
      console.log(`Password comparison result: ${isPasswordValid}`);
    } else {
      console.log('❌ ERROR: Password is not hashed!');
    }
    console.log('');

    // Test 4: Test login flow simulation
    console.log('🔄 Test 4: Simulating login flow...');
    const loginUser = await User.findOne({ email: testEmail }).select('+password');
    if (loginUser) {
      console.log('✅ User found in database');
      const passwordMatch = await loginUser.comparePassword(testPassword);
      console.log(`Password match: ${passwordMatch}`);
      
      if (passwordMatch) {
        console.log('✅ Login simulation successful');
      } else {
        console.log('❌ Login simulation failed - password mismatch');
      }
    } else {
      console.log('❌ User not found in database');
    }
    console.log('');

    // Test 5: Check for duplicate users
    console.log('🔍 Test 5: Checking for duplicate users...');
    const duplicateEmails = await User.aggregate([
      { $group: { _id: '$email', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    
    const duplicateUsernames = await User.aggregate([
      { $group: { _id: '$username', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    console.log(`Duplicate emails: ${duplicateEmails.length}`);
    console.log(`Duplicate usernames: ${duplicateUsernames.length}`);
    
    if (duplicateEmails.length > 0) {
      console.log('Duplicate emails found:', duplicateEmails);
    }
    if (duplicateUsernames.length > 0) {
      console.log('Duplicate usernames found:', duplicateUsernames);
    }
    console.log('');

    // Test 6: Check database indexes
    console.log('📋 Test 6: Checking database indexes...');
    const indexes = await User.collection.getIndexes();
    console.log('Database indexes:');
    Object.keys(indexes).forEach(indexName => {
      console.log(`- ${indexName}: ${JSON.stringify(indexes[indexName])}`);
    });
    console.log('');

    console.log('🎉 Authentication debug completed!');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the debug script
debugAuth();