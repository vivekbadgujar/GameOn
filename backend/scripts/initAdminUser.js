#!/usr/bin/env node

/**
 * Initialize Admin User for GameOn Platform
 * Creates a super admin user with credentials from environment variables
 * Usage: node scripts/initAdminUser.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Admin = require('../models/Admin');

const initAdminUser = async () => {
  let mongooseConnection = null;
  
  try {
    console.log('\n========================================');
    console.log('GameOn Platform - Admin User Setup');
    console.log('========================================\n');

    // Validate environment variables
    const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (!MONGODB_URI) {
      console.error('❌ Error: MONGODB_URI or DATABASE_URL not set');
      process.exit(1);
    }

    if (!ADMIN_EMAIL) {
      console.error('❌ Error: ADMIN_EMAIL not set in environment variables');
      process.exit(1);
    }

    if (!ADMIN_PASSWORD) {
      console.error('❌ Error: ADMIN_PASSWORD not set in environment variables');
      process.exit(1);
    }

    console.log('📋 Configuration:');
    console.log(`   Admin Email: ${ADMIN_EMAIL}`);
    console.log(`   Database: ${MONGODB_URI.replace(/mongodb\+srv:\/\/[^:]+:[^@]+@/, 'mongodb+srv://***:***@')}`);
    console.log();

    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    mongooseConnection = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    });
    console.log('✅ Connected to MongoDB\n');

    // Check if admin already exists
    console.log('🔍 Checking for existing admin...');
    const existingAdmin = await Admin.findOne({ email: ADMIN_EMAIL.toLowerCase() });

    if (existingAdmin) {
      console.log('✅ Admin user already exists!\n');
      console.log('📋 Admin Details:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Name: ${existingAdmin.name}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Status: ${existingAdmin.status}`);
      console.log(`   Email Verified: ${existingAdmin.isEmailVerified}`);
      console.log(`   Created: ${existingAdmin.createdAt}`);
      console.log(`   Updated: ${existingAdmin.updatedAt}`);
      
      if (!existingAdmin.isEmailVerified) {
        console.log('\n⚠️  Email is not verified. Marking as verified...');
        existingAdmin.isEmailVerified = true;
        await existingAdmin.save();
        console.log('✅ Email marked as verified\n');
      }

      process.exit(0);
    }

    // Create new admin user
    console.log('Creating new admin user...\n');
    
    const newAdmin = new Admin({
      name: 'GameOn Admin',
      email: ADMIN_EMAIL.toLowerCase(),
      password: ADMIN_PASSWORD,
      role: 'super_admin',
      status: 'active',
      isEmailVerified: true,
      ipAddresses: []
    });

    await newAdmin.save();

    console.log('✅ Admin user created successfully!\n');
    console.log('📋 Admin Details:');
    console.log(`   Email: ${newAdmin.email}`);
    console.log(`   Name: ${newAdmin.name}`);
    console.log(`   Role: ${newAdmin.role}`);
    console.log(`   Status: ${newAdmin.status}`);
    console.log(`   Email Verified: ${newAdmin.isEmailVerified}`);
    console.log(`   Permissions: ${newAdmin.permissions.join(', ')}`);
    console.log(`   Created: ${newAdmin.createdAt}`);

    console.log('\n========================================');
    console.log('✅ Setup Complete!');
    console.log('========================================\n');
    console.log('You can now login with:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log();

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during admin setup:', error.message);
    
    if (error.name === 'MongoServerError' && error.code === 11000) {
      console.error('   Admin with this email already exists');
    } else if (error.name === 'ValidationError') {
      console.error('   Validation error:');
      Object.keys(error.errors).forEach(field => {
        console.error(`   - ${field}: ${error.errors[field].message}`);
      });
    }

    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    if (mongooseConnection) {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
};

// Run the setup
initAdminUser();
