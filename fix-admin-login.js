/**
 * Fix Admin Login Issues
 * This script creates an admin user and tests the login flow
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Use your MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/gameon';

console.log('🔧 Fixing Admin Login Issues...\n');

// Admin Schema (matching your backend)
const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'manager', 'moderator'],
    default: 'admin'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  permissions: [{
    type: String
  }],
  department: {
    type: String,
    default: 'Administration'
  },
  avatar: {
    type: String,
    default: null
  },
  isEmailVerified: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  ipAddresses: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Password comparison method
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Pre-save middleware to hash password
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Login attempts methods
adminSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: {
        loginAttempts: 1
      },
      $unset: {
        lockUntil: 1
      }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // If we have hit max attempts and it's not locked yet, lock the account
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

adminSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1
    }
  });
};

adminSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

const Admin = mongoose.model('Admin', adminSchema);

async function createAdminUser() {
  try {
    console.log('1. Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    console.log('\n2. Checking for existing admin users...');
    const existingAdmins = await Admin.find({});
    console.log(`Found ${existingAdmins.length} existing admin(s)`);
    
    if (existingAdmins.length > 0) {
      console.log('Existing admins:');
      existingAdmins.forEach(admin => {
        console.log(`  - ${admin.email} (${admin.role}) - Status: ${admin.status}`);
      });
    }

    console.log('\n3. Creating/Updating admin user...');
    
    const adminData = {
      name: 'GameOn Administrator',
      email: 'admin@gameon.com',
      password: 'GameOn@2024!', // This will be hashed automatically
      role: 'super_admin',
      status: 'active',
      isEmailVerified: true,
      permissions: [
        'tournaments.create',
        'tournaments.read',
        'tournaments.update',
        'tournaments.delete',
        'users.read',
        'users.update',
        'users.delete',
        'analytics.read',
        'settings.update'
      ],
      department: 'Administration'
    };

    // Try to find and update existing admin, or create new one
    const admin = await Admin.findOneAndUpdate(
      { email: adminData.email },
      adminData,
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );

    console.log('✅ Admin user created/updated successfully!');
    console.log('Admin details:');
    console.log(`  - ID: ${admin._id}`);
    console.log(`  - Name: ${admin.name}`);
    console.log(`  - Email: ${admin.email}`);
    console.log(`  - Role: ${admin.role}`);
    console.log(`  - Status: ${admin.status}`);
    console.log(`  - Password: GameOn@2024!`);

    console.log('\n4. Testing password verification...');
    const isPasswordValid = await admin.comparePassword('GameOn@2024!');
    console.log('Password verification:', isPasswordValid ? '✅ Valid' : '❌ Invalid');

    console.log('\n✅ Admin user setup complete!');
    console.log('\n📋 Login Credentials:');
    console.log('  Email: admin@gameon.com');
    console.log('  Password: GameOn@2024!');
    console.log('\n🔗 You can now login to your admin panel');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    
    if (error.code === 11000) {
      console.log('💡 Admin user already exists. Trying to update password...');
      try {
        const admin = await Admin.findOne({ email: 'admin@gameon.com' });
        if (admin) {
          admin.password = 'GameOn@2024!';
          admin.status = 'active';
          admin.loginAttempts = 0;
          admin.lockUntil = undefined;
          await admin.save();
          console.log('✅ Admin password updated successfully!');
        }
      } catch (updateError) {
        console.error('❌ Failed to update admin password:', updateError);
      }
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Test the admin login API
async function testAdminLogin() {
  const axios = require('axios');
  const BACKEND_URL = 'https://gameon-backend.onrender.com';
  
  console.log('\n5. Testing admin login API...');
  
  try {
    const response = await axios.post(`${BACKEND_URL}/api/admin/auth/login`, {
      email: 'admin@gameon.com',
      password: 'GameOn@2024!'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    console.log('✅ API Login test successful!');
    console.log('Response:', {
      success: response.data.success,
      message: response.data.message,
      hasToken: !!response.data.token,
      adminName: response.data.admin?.name
    });

  } catch (error) {
    console.log('❌ API Login test failed:', error.response?.data?.message || error.message);
    console.log('Status:', error.response?.status);
    
    if (error.response?.status === 401) {
      console.log('💡 This might be a password issue. Try running this script again.');
    }
  }
}

async function main() {
  await createAdminUser();
  
  // Wait a moment for the database to sync
  setTimeout(async () => {
    await testAdminLogin();
  }, 2000);
}

main();