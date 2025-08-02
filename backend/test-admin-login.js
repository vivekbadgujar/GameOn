/**
 * Test admin login directly
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const MONGODB_URI = 'mongodb+srv://vivekbadgujar:Vivek321@cluster0.squjxrk.mongodb.net/gameon?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Admin = require('./models/Admin');

async function testAdminLogin() {
  try {
    console.log('🧪 Testing Admin Login...\n');
    
    const email = 'admin@gameon.com';
    const password = 'admin123';
    
    // Find admin
    const admin = await Admin.findOne({ 
      email: email.toLowerCase(),
      status: 'active'
    });
    
    if (!admin) {
      console.log('❌ Admin not found');
      return;
    }
    
    console.log('✅ Admin found:', {
      id: admin._id,
      email: admin.email,
      status: admin.status,
      role: admin.role
    });
    
    // Test password comparison
    console.log('🔐 Testing password...');
    const passwordMatch = await admin.comparePassword(password);
    console.log('Password match:', passwordMatch);
    
    if (passwordMatch) {
      console.log('✅ Password is correct!');
    } else {
      console.log('❌ Password is incorrect');
      
      // Let's check the stored password hash
      console.log('Stored password hash length:', admin.password.length);
      console.log('Hash starts with:', admin.password.substring(0, 10));
      
      // Try manual bcrypt comparison
      const manualMatch = await bcrypt.compare(password, admin.password);
      console.log('Manual bcrypt compare:', manualMatch);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

testAdminLogin();