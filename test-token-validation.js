const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Admin = require('./backend/models/Admin');
require('dotenv').config({ path: './backend/.env' });

async function testTokenValidation() {
  try {
    console.log('🔍 Testing JWT token validation...');
    
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://vivekbadgujar:Vivek321@cluster0.squjxrk.mongodb.net/gameon?retryWrites=true&w=majority');
    console.log('✅ Connected to MongoDB');
    
    // Find admin user
    const admin = await Admin.findOne({ email: 'admin@gameon.com' });
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Admin user found:', {
      id: admin._id,
      name: admin.name,
      role: admin.role,
      permissions: admin.permissions,
      status: admin.status,
      isLocked: admin.isLocked
    });
    
    // Test JWT secret
    console.log('\n🔑 Testing JWT token generation...');
    const JWT_SECRET = process.env.JWT_SECRET;
    console.log('JWT_SECRET:', JWT_SECRET ? 'Set' : 'Not set');
    
    if (!JWT_SECRET) {
      console.log('❌ JWT_SECRET is not set in environment variables');
      return;
    }
    
    // Generate a token
    const token = jwt.sign({ userId: admin._id }, JWT_SECRET, { expiresIn: '8h' });
    console.log('✅ Token generated successfully');
    console.log('Token (first 50 chars):', token.substring(0, 50) + '...');
    
    // Verify the token
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('✅ Token verification successful:', {
        userId: decoded.userId,
        iat: new Date(decoded.iat * 1000),
        exp: new Date(decoded.exp * 1000)
      });
    } catch (tokenError) {
      console.log('❌ Token verification failed:', tokenError.message);
      return;
    }
    
    // Test admin permissions
    console.log('\n🔐 Testing admin permissions...');
    const hasPermission = admin.hasPermission('tournaments_manage');
    console.log('Has tournaments_manage permission:', hasPermission);
    
    if (!hasPermission) {
      console.log('❌ Admin does not have tournaments_manage permission');
      console.log('Admin permissions:', admin.permissions);
      console.log('Admin role:', admin.role);
      
      // Add the permission if missing
      if (!admin.permissions.includes('tournaments_manage')) {
        admin.permissions.push('tournaments_manage');
        await admin.save();
        console.log('✅ Added tournaments_manage permission to admin');
      }
    }
    
    // Test tournament model access
    console.log('\n🏆 Testing tournament model access...');
    const Tournament = require('./backend/models/Tournament');
    const tournaments = await Tournament.find().limit(1);
    
    if (tournaments.length > 0) {
      const testTournament = tournaments[0];
      console.log('✅ Found tournament for testing:', {
        id: testTournament._id,
        title: testTournament.title,
        status: testTournament.status
      });
      
      // Test status update directly on the model
      console.log('\n📝 Testing direct status update...');
      const oldStatus = testTournament.status;
      testTournament.status = 'completed';
      testTournament.endDate = new Date();
      
      await testTournament.save();
      console.log('✅ Direct status update successful');
      
      // Revert the change
      testTournament.status = oldStatus;
      testTournament.endDate = null;
      await testTournament.save();
      console.log('✅ Status reverted to original');
      
    } else {
      console.log('❌ No tournaments found for testing');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

testTokenValidation();