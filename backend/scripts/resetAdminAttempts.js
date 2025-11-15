const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function resetAdminAttempts() {
  try {
    // Connect to MongoDB using environment variable
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gameon';
    await mongoose.connect(MONGODB_URI);

    console.log('Connected to MongoDB');

    // Find the admin user
    const admin = await Admin.findOne({ email: 'gameonofficial04@gmail.com' });
    
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('Current admin status:');
    console.log('- Email:', admin.email);
    console.log('- Login attempts:', admin.loginAttempts);
    console.log('- Lock until:', admin.lockUntil);
    console.log('- Is locked:', admin.isLocked);
    console.log('- Status:', admin.status);

    // Reset login attempts and unlock account
    await Admin.updateOne(
      { email: 'gameonofficial04@gmail.com' },
      {
        $unset: { 
          loginAttempts: 1, 
          lockUntil: 1 
        },
        $set: {
          status: 'active',
          lastActivity: new Date()
        }
      }
    );

    console.log('✅ Admin login attempts reset successfully');
    console.log('✅ Account unlocked');
    
    // Verify the reset
    const updatedAdmin = await Admin.findOne({ email: 'gameonofficial04@gmail.com' });
    console.log('\nUpdated admin status:');
    console.log('- Login attempts:', updatedAdmin.loginAttempts);
    console.log('- Lock until:', updatedAdmin.lockUntil);
    console.log('- Is locked:', updatedAdmin.isLocked);
    console.log('- Status:', updatedAdmin.status);

  } catch (error) {
    console.error('❌ Error resetting admin attempts:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the script
resetAdminAttempts();