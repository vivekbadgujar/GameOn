const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const createAdmin = async () => {
  try {
    await connectDB();
    
    // Delete existing admin
    await Admin.deleteMany({});
    
    // Create new admin with proper settings
    const admin = await Admin.create({
      name: 'System Admin',
      email: 'admin@gameon.com',
      password: 'admin123456', // 8+ characters
      role: 'super_admin',
      status: 'active',
      isEmailVerified: true
    });
    
    console.log('✅ Admin created successfully!');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Password: admin123456`);
    console.log(`👤 Role: ${admin.role}`);
    console.log(`✅ Email Verified: ${admin.isEmailVerified}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();