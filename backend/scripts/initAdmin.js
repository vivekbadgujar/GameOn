const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function initAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://vivekbadgujar:Vivek321@cluster0.squjxrk.mongodb.net/gameon?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: process.env.ADMIN_EMAIL });
    
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      console.log('Permissions:', existingAdmin.permissions);
      return;
    }

    // Create new admin user with minimal data
    const admin = new Admin({
      name: 'GameOn Admin',
      email: process.env.ADMIN_EMAIL || 'gameonofficial04@gmail.com',
      password: process.env.ADMIN_PASSWORD || 'GameOn@321',
      role: 'super_admin',
      status: 'active',
      isEmailVerified: true
    });

    await admin.save();

    console.log('✅ Admin user created successfully:', admin.email);
    console.log('Email:', admin.email);
    console.log('Password:', process.env.ADMIN_PASSWORD || 'GameOn@321');
    console.log('Role:', admin.role);
    console.log('Permissions:', admin.permissions);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', Object.keys(error.errors).map(key => `${key}: ${error.errors[key].message}`));
    }
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
initAdmin(); 