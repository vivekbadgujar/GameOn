const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.production') });

const uri = process.env.MONGODB_URI;

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    
    const email = process.env.ADMIN_EMAIL || 'admin@gameonesport.xyz';
    const password = process.env.ADMIN_PASSWORD || 'SecureAdminPassword123!';
    
    console.log('Creating admin user:', email);
    
    const adminData = {
      name: 'Super Admin',
      email: email,
      password: password,
      role: 'super_admin',
      status: 'active',
      isEmailVerified: true,
      permissions: [
        'tournaments_manage', 'users_manage', 'payments_view', 
        'payments_manage', 'payouts_manage', 'analytics_view', 'notifications_send', 'notifications_manage',
        'ai_moderation', 'system_settings'
      ]
    };
    
    // Check if exists again just in case
    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.log('Admin already exists. Updating password...');
      existing.password = password;
      await existing.save();
      console.log('✅ Admin password updated.');
    } else {
      const newAdmin = new Admin(adminData);
      await newAdmin.save();
      console.log('✅ Admin user created successfully.');
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();