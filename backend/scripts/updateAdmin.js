const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://vivekbadgujar:Vivek321@cluster0.squjxrk.mongodb.net/gameon?retryWrites=true&w=majority';
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const updateAdmin = async () => {
  try {
    await connectDB();
    
    const email = 'gameonofficial04@gmail.com';
    const password = 'GameOn@321';
    
    let admin = await Admin.findOne({ email });
    
    if (!admin) {
      console.log('Admin not found, creating new admin...');
      admin = await Admin.create({
        name: 'GameOn Official Admin',
        email: email,
        password: password,
        role: 'super_admin',
        status: 'active',
        isEmailVerified: true
      });
      console.log('✅ Admin created successfully!');
    } else {
      console.log('Admin found, updating credentials...');
      admin.password = password;
      admin.status = 'active';
      admin.isEmailVerified = true;
      await admin.save();
      console.log('✅ Admin credentials updated successfully!');
    }
    
    console.log(`\n📧 Email: ${admin.email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 Role: ${admin.role}`);
    console.log(`✅ Status: ${admin.status}`);
    console.log(`✅ Email Verified: ${admin.isEmailVerified}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating admin:', error);
    process.exit(1);
  }
};

updateAdmin();
