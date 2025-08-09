const mongoose = require('mongoose');
const Admin = require('./backend/models/Admin');
require('dotenv').config({ path: './backend/.env' });

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://vivekbadgujar:Vivek321@cluster0.squjxrk.mongodb.net/gameon?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@gameon.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists:', {
        id: existingAdmin._id,
        name: existingAdmin.name,
        email: existingAdmin.email,
        role: existingAdmin.role,
        status: existingAdmin.status
      });
      
      // Update password if needed
      existingAdmin.password = 'admin123';
      await existingAdmin.save();
      console.log('Admin password updated to: admin123');
      
    } else {
      // Create new admin user
      const adminUser = new Admin({
        name: 'Super Admin',
        username: 'admin',
        email: 'admin@gameon.com',
        password: 'admin123',
        role: 'super_admin',
        status: 'active',
        isEmailVerified: true,
        permissions: [
          'tournaments_manage',
          'users_manage',
          'analytics_view',
          'payouts_manage',
          'media_manage',
          'notifications_manage',
          'system_admin'
        ],
        department: 'IT',
        ipAddresses: [],
        loginAttempts: 0,
        isLocked: false
      });
      
      await adminUser.save();
      console.log('✅ Admin user created successfully:', {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        status: adminUser.status
      });
    }
    
    console.log('\n🔑 Admin Login Credentials:');
    console.log('Email: admin@gameon.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

createAdminUser();