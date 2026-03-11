const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://vivekbadgujar:Vivek321@cluster0.squjxrk.mongodb.net/gameon?retryWrites=true&w=majority');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const createAdmin = async () => {
  try {
    await connectDB();
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'vivekbadgujar321@gmail.com' });
    
    if (existingAdmin) {
      console.log('✅ Admin already exists!');
      console.log(`📧 Email: ${existingAdmin.email}`);
      console.log(`👤 Role: ${existingAdmin.role}`);
      console.log(`✅ Status: ${existingAdmin.status}`);
      console.log(`✅ Email Verified: ${existingAdmin.isEmailVerified}`);
      process.exit(0);
    }
    
    // Create new admin with real credentials
    const admin = await Admin.create({
      name: 'GameOn Official Admin',
      email: 'vivekbadgujar321@gmail.com',
      password: 'Vivek@321',
      role: 'super_admin',
      status: 'active',
      isEmailVerified: true
    });
    
    console.log('✅ Admin created successfully!');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Password: Vivek@321`);
    console.log(`👤 Role: ${admin.role}`);
    console.log(`✅ Email Verified: ${admin.isEmailVerified}`);
    console.log(`✅ Status: ${admin.status}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
