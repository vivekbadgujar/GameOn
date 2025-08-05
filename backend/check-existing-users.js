/**
 * Check Existing Users Password Hashing
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const MONGODB_URI = 'mongodb+srv://vivekbadgujar:Vivek321@cluster0.squjxrk.mongodb.net/gameon?retryWrites=true&w=majority';

async function checkExistingUsers() {
  try {
    console.log('🔍 Checking existing users password hashing...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get a few existing users with their passwords
    const existingUsers = await User.find({
      email: { $in: ['test2@example.com', 'test3@example.com', 'vivekbadgujar1@gmail.com'] }
    }).select('+password');

    console.log(`Found ${existingUsers.length} existing users to check:\n`);

    for (const user of existingUsers) {
      console.log(`👤 User: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Password hash: ${user.password}`);
      console.log(`   Hash length: ${user.password ? user.password.length : 'N/A'}`);
      console.log(`   Looks like bcrypt: ${user.password ? user.password.startsWith('$2') : false}`);
      
      // Test common passwords
      const commonPasswords = ['test123', 'password', '123456', 'admin', user.username];
      
      for (const testPassword of commonPasswords) {
        try {
          if (user.password) {
            const isMatch = await user.comparePassword(testPassword);
            if (isMatch) {
              console.log(`   ✅ Password found: "${testPassword}"`);
              break;
            }
          }
        } catch (error) {
          console.log(`   ❌ Error testing password "${testPassword}": ${error.message}`);
        }
      }
      console.log('');
    }

    // Check if there are users with unhashed passwords
    console.log('🔍 Checking for users with potentially unhashed passwords...');
    const allUsers = await User.find({}).select('+password');
    let unhashedCount = 0;
    let hashedCount = 0;
    let noPasswordCount = 0;

    for (const user of allUsers) {
      if (!user.password) {
        noPasswordCount++;
      } else if (user.password.startsWith('$2')) {
        hashedCount++;
      } else {
        unhashedCount++;
        console.log(`❌ Potentially unhashed password for ${user.email}: ${user.password}`);
      }
    }

    console.log(`\n📊 Password Status Summary:`);
    console.log(`   Properly hashed passwords: ${hashedCount}`);
    console.log(`   Potentially unhashed passwords: ${unhashedCount}`);
    console.log(`   No password set: ${noPasswordCount}`);
    console.log(`   Total users: ${allUsers.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

checkExistingUsers();