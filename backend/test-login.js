const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://vivekbadgujar:Vivek321@cluster0.squjxrk.mongodb.net/gameon?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Test admin credentials
    const email = 'gameonofficial04@gmail.com';
    const password = 'GameOn@321';

    // Find admin
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    
    if (!admin) {
      console.log('❌ Admin not found');
      return;
    }

    console.log('✅ Admin found:', admin.email);
    console.log('Role:', admin.role);
    console.log('Status:', admin.status);
    console.log('Is Email Verified:', admin.isEmailVerified);

    // Test password comparison
    const isPasswordValid = await admin.comparePassword(password);
    console.log('Password valid:', isPasswordValid);

    // Check if account is locked
    console.log('Is locked:', admin.isLocked);

    if (isPasswordValid && !admin.isLocked && admin.status === 'active') {
      console.log('✅ Login should work!');
    } else {
      console.log('❌ Login will fail');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the test
testLogin(); 