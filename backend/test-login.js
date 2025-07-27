const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

const testLogin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://vivekbadgujar:Vivek321@cluster0.squjxrk.mongodb.net/gameon?retryWrites=true&w=majority');
    console.log('Connected to MongoDB');

    // Find admin by email
    const admin = await Admin.findOne({ email: 'admin@gameon.com' });
    
    if (!admin) {
      console.log('❌ Admin not found');
      return;
    }

    console.log('✅ Admin found:', {
      email: admin.email,
      role: admin.role,
      status: admin.status,
      isEmailVerified: admin.isEmailVerified
    });

    // Test password comparison
    const testPassword = 'admin123456';
    const isPasswordValid = await admin.comparePassword(testPassword);
    
    console.log('🔑 Password test:', isPasswordValid ? '✅ Valid' : '❌ Invalid');

    // Test login flow
    if (isPasswordValid && admin.status === 'active' && admin.isEmailVerified) {
      console.log('✅ Login would be successful');
    } else {
      console.log('❌ Login would fail');
      if (!isPasswordValid) console.log('  - Invalid password');
      if (admin.status !== 'active') console.log('  - Account not active');
      if (!admin.isEmailVerified) console.log('  - Email not verified');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

testLogin(); 