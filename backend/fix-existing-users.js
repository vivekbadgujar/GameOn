/**
 * Fix existing users by setting known passwords
 */

const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = 'mongodb+srv://vivekbadgujar:Vivek321@cluster0.squjxrk.mongodb.net/gameon?retryWrites=true&w=majority';

async function fixExistingUsers() {
  try {
    console.log('🔧 Fixing existing users with known passwords...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Set a default password for all existing users (except admin)
    const defaultPassword = 'test123';
    
    // Get all users except admin
    const usersToFix = await User.find({
      email: { $ne: 'gamonoffice04@gmail.com' } // Exclude admin
    });

    console.log(`Found ${usersToFix.length} users to fix\n`);

    let fixedCount = 0;
    
    for (const user of usersToFix) {
      try {
        console.log(`Fixing user: ${user.email}`);
        
        // Set the password (it will be hashed by the pre-save middleware)
        user.password = defaultPassword;
        await user.save();
        
        console.log(`✅ Fixed password for ${user.email}`);
        fixedCount++;
        
      } catch (error) {
        console.log(`❌ Failed to fix ${user.email}: ${error.message}`);
      }
    }

    console.log(`\n🎉 Fixed passwords for ${fixedCount} users`);
    console.log(`Default password for all users (except admin): "${defaultPassword}"`);
    console.log(`Admin password remains: "gamon@321"`);

    // Test one of the fixed users
    console.log('\n🧪 Testing fixed user login...');
    const testUser = usersToFix[0];
    if (testUser) {
      const updatedUser = await User.findById(testUser._id).select('+password');
      const isPasswordValid = await updatedUser.comparePassword(defaultPassword);
      console.log(`Password test for ${testUser.email}: ${isPasswordValid ? '✅ PASS' : '❌ FAIL'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

fixExistingUsers();