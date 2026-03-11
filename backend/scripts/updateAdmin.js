const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
require('dotenv').config();

const ADMIN_EMAIL = 'vivekbadgujar321@gmail.com';
const ADMIN_PASSWORD = 'Vivek@321';
const ADMIN_PERMISSIONS = [
  'tournaments_manage',
  'users_manage',
  'payments_view',
  'payments_manage',
  'payouts_manage',
  'analytics_view',
  'notifications_send',
  'notifications_manage',
  'ai_moderation',
  'system_settings'
];

const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI ||
      'mongodb+srv://vivekbadgujar:Vivek321@cluster0.squjxrk.mongodb.net/gameon?retryWrites=true&w=majority';
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

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    let admin = await Admin.findOne({ email: ADMIN_EMAIL });

    if (!admin) {
      console.log('Admin not found, creating new admin...');
      admin = await Admin.create({
        name: 'Vivek Badgujar',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'super_admin',
        status: 'active',
        isEmailVerified: true,
        permissions: ADMIN_PERMISSIONS
      });
      console.log('Admin created successfully!');
    } else {
      console.log('Admin found, updating credentials...');
      await Admin.updateOne(
        { _id: admin._id },
        {
          $set: {
            name: 'Vivek Badgujar',
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: 'super_admin',
            status: 'active',
            isEmailVerified: true,
            permissions: ADMIN_PERMISSIONS,
            loginAttempts: 0,
            lastActivity: new Date()
          },
          $unset: {
            lockUntil: 1
          }
        }
      );
      admin = await Admin.findById(admin._id);
      console.log('Admin credentials updated successfully!');
    }

    console.log(`\nEmail: ${admin.email}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Status: ${admin.status}`);
    console.log(`Email Verified: ${admin.isEmailVerified}`);

    process.exit(0);
  } catch (error) {
    console.error('Error updating admin:', error);
    process.exit(1);
  }
};

updateAdmin();
