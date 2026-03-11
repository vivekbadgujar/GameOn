const mongoose = require('mongoose');
const Admin = require('./backend/models/Admin');

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://vivekbadgujar:Vivek321@cluster0.squjxrk.mongodb.net/gameon?retryWrites=true&w=majority');
    
    console.log('Connected to MongoDB');
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'vivekbadgujar321@gmail.com' }) || await Admin.findOne({ email: 'admin@gameon.com' });
    
    if (existingAdmin) {
      console.log('Admin user found, updating credentials...', {
        id: existingAdmin._id,
        name: existingAdmin.name,
        email: existingAdmin.email
      });
      
      // Update credentials
      existingAdmin.email = 'vivekbadgujar321@gmail.com';
      existingAdmin.password = 'Vivek@321';
      await existingAdmin.save();
      console.log('Admin credentials updated successfully');
      
    } else {
      // Create new admin user
      const adminUser = new Admin({
        name: 'Vivek Badgujar',
        username: 'vivek',
        email: 'vivekbadgujar321@gmail.com',
        password: 'Vivek@321',
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
    console.log('Email: vivekbadgujar321@gmail.com');
    console.log('Password: Vivek@321');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

createAdminUser();