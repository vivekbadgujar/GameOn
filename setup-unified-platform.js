#!/usr/bin/env node

/**
 * GameOn Unified Platform Setup Script
 * Initializes the unified platform with all necessary configurations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎯 GameOn Unified Platform Setup');
console.log('=====================================\n');

// Configuration
const config = {
  backend: {
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGODB_URI || 'mongodb+srv://vivekbadgujar:Vivek321@cluster0.squjxrk.mongodb.net/gameon?retryWrites=true&w=majority',
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  frontend: {
    port: 3000,
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    wsUrl: process.env.REACT_APP_WS_URL || 'http://localhost:5000'
  },
  mobile: {
    apiUrl: process.env.API_BASE_URL || 'http://localhost:5000',
    bundleId: 'com.gameon.mobile',
    appName: 'GameOn'
  }
};

// Helper functions
const runCommand = (command, cwd = process.cwd()) => {
  try {
    console.log(`📦 Running: ${command}`);
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`❌ Failed to run: ${command}`);
    console.error(error.message);
    return false;
  }
};

const createFile = (filePath, content) => {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content);
    console.log(`✅ Created: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to create: ${filePath}`);
    console.error(error.message);
    return false;
  }
};

const updatePackageJson = (packagePath, updates) => {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const updatedPackage = { ...packageJson, ...updates };
    fs.writeFileSync(packagePath, JSON.stringify(updatedPackage, null, 2));
    console.log(`✅ Updated: ${packagePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to update: ${packagePath}`);
    console.error(error.message);
    return false;
  }
};

// Setup steps
const setupSteps = [
  {
    name: 'Backend Dependencies',
    run: () => {
      console.log('🔧 Installing backend dependencies...');
      return runCommand('npm install', './backend');
    }
  },
  
  {
    name: 'Frontend Dependencies',
    run: () => {
      console.log('🔧 Installing frontend dependencies...');
      const success = runCommand('npm install', './frontend');
      
      if (success) {
        // Add unified platform dependencies
        const additionalDeps = [
          'socket.io-client@^4.8.1',
          'axios@^1.6.2',
          '@reduxjs/toolkit@^2.0.1',
          'react-redux@^9.0.4'
        ];
        
        return runCommand(`npm install ${additionalDeps.join(' ')}`, './frontend');
      }
      
      return false;
    }
  },
  
  {
    name: 'Mobile App Setup',
    run: () => {
      console.log('📱 Setting up mobile app...');
      
      // Create mobile directory if it doesn't exist
      if (!fs.existsSync('./mobile')) {
        fs.mkdirSync('./mobile', { recursive: true });
      }
      
      // Install React Native dependencies
      return runCommand('npm install', './mobile');
    }
  },
  
  {
    name: 'Environment Configuration',
    run: () => {
      console.log('⚙️ Setting up environment configuration...');
      
      // Backend .env
      const backendEnv = `
# GameOn Unified Platform - Backend Configuration
NODE_ENV=${config.backend.nodeEnv}
PORT=${config.backend.port}
MONGODB_URI=${config.backend.mongoUri}
JWT_SECRET=${config.backend.jwtSecret}

# Unified Platform Features
ENABLE_SYNC_SERVICE=true
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_REAL_TIME_UPDATES=true

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Firebase Configuration (for push notifications)
# FIREBASE_PROJECT_ID=your-project-id
# FIREBASE_PRIVATE_KEY=your-private-key
# FIREBASE_CLIENT_EMAIL=your-client-email

# API Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
`.trim();
      
      createFile('./backend/.env', backendEnv);
      
      // Frontend .env
      const frontendEnv = `
# GameOn Unified Platform - Frontend Configuration
REACT_APP_API_URL=${config.frontend.apiUrl}
REACT_APP_WS_URL=${config.frontend.wsUrl}
REACT_APP_ENABLE_SYNC=true
REACT_APP_ENABLE_PUSH_NOTIFICATIONS=true

# Firebase Configuration (for web push notifications)
# REACT_APP_FIREBASE_API_KEY=your-api-key
# REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
# REACT_APP_FIREBASE_PROJECT_ID=your-project-id
# REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
# REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
# REACT_APP_FIREBASE_APP_ID=your-app-id
`.trim();
      
      createFile('./frontend/.env', frontendEnv);
      
      // Mobile .env
      const mobileEnv = `
# GameOn Unified Platform - Mobile Configuration
API_BASE_URL=${config.mobile.apiUrl}
ENABLE_SYNC=true
ENABLE_PUSH_NOTIFICATIONS=true

# Firebase Configuration (for mobile push notifications)
# FIREBASE_PROJECT_ID=your-project-id
# FIREBASE_APP_ID=your-app-id
# FIREBASE_API_KEY=your-api-key

# App Configuration
APP_NAME=${config.mobile.appName}
BUNDLE_ID=${config.mobile.bundleId}
`.trim();
      
      createFile('./mobile/.env', mobileEnv);
      
      return true;
    }
  },
  
  {
    name: 'Configuration Files',
    run: () => {
      console.log('📝 Creating configuration files...');
      
      // Mobile config
      const mobileConfig = `
export const API_BASE_URL = '${config.mobile.apiUrl}';
export const WS_URL = '${config.mobile.apiUrl}';
export const APP_NAME = '${config.mobile.appName}';
export const BUNDLE_ID = '${config.mobile.bundleId}';

export const FEATURES = {
  SYNC: true,
  PUSH_NOTIFICATIONS: true,
  OFFLINE_MODE: true,
  REAL_TIME_UPDATES: true
};

export const SYNC_CONFIG = {
  HEARTBEAT_INTERVAL: 30000, // 30 seconds
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_DELAY: 1000, // 1 second
  MAX_RECONNECT_DELAY: 30000 // 30 seconds
};
`;
      
      createFile('./mobile/src/config/index.js', mobileConfig);
      
      // Shared constants
      const sharedConstants = `
// Shared constants for unified platform
export const PLATFORMS = {
  WEB: 'web',
  MOBILE: 'mobile'
};

export const SYNC_EVENTS = {
  TOURNAMENT_SYNC: 'tournament_sync',
  USER_SYNC: 'user_sync',
  WALLET_SYNC: 'wallet_sync',
  SLOT_SYNC: 'slot_sync'
};

export const NOTIFICATION_TYPES = {
  TOURNAMENT_JOINED: 'tournament_joined',
  TOURNAMENT_STARTED: 'tournament_started',
  WALLET_CREDITED: 'wallet_credited',
  WALLET_DEBITED: 'wallet_debited',
  SLOT_AVAILABLE: 'slot_available'
};

export const API_ENDPOINTS = {
  AUTH: '/api/auth',
  TOURNAMENTS: '/api/tournaments',
  WALLET: '/api/wallet',
  SYNC: '/api/sync',
  NOTIFICATIONS: '/api/notifications'
};
`;
      
      createFile('./shared/constants/index.js', sharedConstants);
      
      return true;
    }
  },
  
  {
    name: 'Database Initialization',
    run: () => {
      console.log('🗄️ Initializing database...');
      
      // Create database initialization script
      const dbInit = `
const mongoose = require('mongoose');
const User = require('./backend/models/User');
const Tournament = require('./backend/models/Tournament');
require('dotenv').config({ path: './backend/.env' });

async function initializeDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Add indexes for better performance
    console.log('📊 Creating database indexes...');
    
    // User indexes
    await User.collection.createIndex({ phoneNumber: 1 }, { unique: true });
    await User.collection.createIndex({ username: 1 }, { unique: true });
    await User.collection.createIndex({ 'wallet.balance': 1 });
    
    // Tournament indexes
    await Tournament.collection.createIndex({ status: 1 });
    await Tournament.collection.createIndex({ startDate: 1 });
    await Tournament.collection.createIndex({ game: 1 });
    await Tournament.collection.createIndex({ 'participants.user': 1 });
    
    console.log('✅ Database indexes created');
    
    // Create sample data if needed
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('📝 Creating sample data...');
      // Add sample data creation logic here
    }
    
    console.log('🎉 Database initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();
`;
      
      createFile('./init-database.js', dbInit);
      
      return true;
    }
  },
  
  {
    name: 'Development Scripts',
    run: () => {
      console.log('📜 Creating development scripts...');
      
      // Main package.json for unified development
      const mainPackageJson = {
        name: 'gameon-unified-platform',
        version: '1.0.0',
        description: 'GameOn Unified Platform - Web + Mobile',
        scripts: {
          'dev': 'concurrently "npm run dev:backend" "npm run dev:frontend"',
          'dev:backend': 'cd backend && npm run dev',
          'dev:frontend': 'cd frontend && npm start',
          'dev:mobile': 'cd mobile && npm start',
          'build': 'npm run build:frontend && npm run build:mobile',
          'build:frontend': 'cd frontend && npm run build',
          'build:mobile': 'cd mobile && npm run build:android',
          'test': 'npm run test:backend && npm run test:frontend',
          'test:backend': 'cd backend && npm test',
          'test:frontend': 'cd frontend && npm test',
          'init-db': 'node init-database.js',
          'setup': 'node setup-unified-platform.js',
          'start:all': 'concurrently "npm run start:backend" "npm run start:frontend"',
          'start:backend': 'cd backend && npm start',
          'start:frontend': 'cd frontend && npm start'
        },
        devDependencies: {
          'concurrently': '^8.2.2'
        }
      };
      
      createFile('./package.json', JSON.stringify(mainPackageJson, null, 2));
      
      // Install concurrently for running multiple processes
      return runCommand('npm install');
    }
  }
];

// Run setup
async function runSetup() {
  console.log('🚀 Starting GameOn Unified Platform Setup...\n');
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const step of setupSteps) {
    console.log(`\n📋 ${step.name}`);
    console.log('─'.repeat(50));
    
    const success = await step.run();
    
    if (success) {
      console.log(`✅ ${step.name} completed successfully`);
      successCount++;
    } else {
      console.log(`❌ ${step.name} failed`);
      failureCount++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🎯 GameOn Unified Platform Setup Complete!');
  console.log('='.repeat(50));
  console.log(`✅ Successful steps: ${successCount}`);
  console.log(`❌ Failed steps: ${failureCount}`);
  
  if (failureCount === 0) {
    console.log('\n🎉 All setup steps completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Configure your environment variables in .env files');
    console.log('2. Set up Firebase for push notifications (optional)');
    console.log('3. Run: npm run init-db (to initialize database)');
    console.log('4. Run: npm run dev (to start development servers)');
    console.log('\n🚀 Your unified platform is ready!');
  } else {
    console.log('\n⚠️ Some setup steps failed. Please check the errors above.');
    console.log('You may need to run the setup again or fix the issues manually.');
  }
  
  console.log('\n📚 Documentation:');
  console.log('- Backend API: http://localhost:5000/api');
  console.log('- Frontend: http://localhost:3000');
  console.log('- Mobile: React Native development server');
  console.log('\n💡 For support, check the README.md file or contact the development team.');
}

// Run the setup
runSetup().catch(error => {
  console.error('❌ Setup failed with error:', error);
  process.exit(1);
});