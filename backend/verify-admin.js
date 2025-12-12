const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.production') });

const uri = process.env.MONGODB_URI;

async function checkAdmin() {
  try {
    console.log('Connecting to MongoDB...', uri.replace(/:([^:@]+)@/, ':****@'));
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    
    const email = process.env.ADMIN_EMAIL || 'admin@gameonesport.xyz';
    console.log('Checking for admin email:', email);
    
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    
    if (admin) {
      console.log('✅ Admin user found:', admin.email);
      console.log('Role:', admin.role);
      console.log('Status:', admin.status);
      
      // Verify password
      const password = process.env.ADMIN_PASSWORD || 'SecureAdminPassword123!';
      const isMatch = await admin.comparePassword(password);
      console.log('Password match with env password:', isMatch);
    } else {
      console.log('❌ Admin user NOT found:', email);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

checkAdmin();