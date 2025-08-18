/**
 * Setup MongoDB Atlas Environment
 * Interactive script to help you set up your .env file with Atlas connection
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

console.log(`${colors.blue}🔧 MongoDB Atlas Environment Setup${colors.reset}`);
console.log(`${colors.blue}===================================${colors.reset}\n`);

console.log(`${colors.cyan}This script will help you create a .env file with your MongoDB Atlas connection.${colors.reset}\n`);

const questions = [
  {
    key: 'MONGODB_URI',
    question: 'Enter your MongoDB Atlas connection string:\n(mongodb+srv://username:password@cluster.mongodb.net/database)',
    validate: (value) => {
      if (!value.startsWith('mongodb+srv://')) {
        return 'Connection string should start with mongodb+srv://';
      }
      if (!value.includes('@') || !value.includes('.mongodb.net')) {
        return 'Invalid Atlas connection string format';
      }
      return true;
    }
  },
  {
    key: 'JWT_SECRET',
    question: 'Enter a secure JWT secret (minimum 32 characters):',
    validate: (value) => {
      if (value.length < 32) {
        return 'JWT secret must be at least 32 characters long';
      }
      return true;
    },
    default: () => {
      // Generate a random JWT secret
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let result = '';
      for (let i = 0; i < 64; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
  },
  {
    key: 'NODE_ENV',
    question: 'Environment (development/production):',
    default: 'development'
  }
];

let envConfig = {};
let currentQuestion = 0;

function askQuestion() {
  if (currentQuestion >= questions.length) {
    createEnvFile();
    return;
  }

  const q = questions[currentQuestion];
  let prompt = `${colors.yellow}${q.question}${colors.reset}`;
  
  if (q.default) {
    const defaultValue = typeof q.default === 'function' ? q.default() : q.default;
    prompt += `\n${colors.cyan}(Press Enter for default: ${defaultValue.substring(0, 50)}${defaultValue.length > 50 ? '...' : ''})${colors.reset}`;
  }
  
  prompt += '\n> ';

  rl.question(prompt, (answer) => {
    let value = answer.trim();
    
    // Use default if no answer provided
    if (!value && q.default) {
      value = typeof q.default === 'function' ? q.default() : q.default;
    }
    
    // Validate answer
    if (q.validate) {
      const validation = q.validate(value);
      if (validation !== true) {
        console.log(`${colors.red}❌ ${validation}${colors.reset}\n`);
        askQuestion(); // Ask the same question again
        return;
      }
    }
    
    envConfig[q.key] = value;
    currentQuestion++;
    askQuestion();
  });
}

function createEnvFile() {
  const envPath = path.join(__dirname, 'backend', '.env');
  
  let envContent = `# MongoDB Atlas Configuration
# Generated on ${new Date().toISOString()}

# Database Connection
MONGODB_URI=${envConfig.MONGODB_URI}

# Server Configuration
NODE_ENV=${envConfig.NODE_ENV}
PORT=5000

# Security
JWT_SECRET=${envConfig.JWT_SECRET}

# CORS Origins (for development)
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
`;

  try {
    // Create backend directory if it doesn't exist
    const backendDir = path.join(__dirname, 'backend');
    if (!fs.existsSync(backendDir)) {
      fs.mkdirSync(backendDir, { recursive: true });
    }
    
    fs.writeFileSync(envPath, envContent);
    
    console.log(`\n${colors.green}✅ Environment file created successfully!${colors.reset}`);
    console.log(`${colors.green}📁 Location: ${envPath}${colors.reset}\n`);
    
    console.log(`${colors.blue}📋 Next Steps:${colors.reset}`);
    console.log(`${colors.cyan}1. Test your connection:${colors.reset}`);
    console.log(`   ${colors.yellow}node test-mongodb-atlas.js${colors.reset}`);
    console.log(`${colors.cyan}2. Start your backend locally:${colors.reset}`);
    console.log(`   ${colors.yellow}cd backend && npm start${colors.reset}`);
    console.log(`${colors.cyan}3. Add MONGODB_URI to Render environment variables${colors.reset}`);
    console.log(`${colors.cyan}4. Deploy to Render${colors.reset}\n`);
    
    console.log(`${colors.blue}🔐 For Render deployment, add these environment variables:${colors.reset}`);
    console.log(`${colors.yellow}MONGODB_URI=${envConfig.MONGODB_URI}${colors.reset}`);
    console.log(`${colors.yellow}NODE_ENV=production${colors.reset}`);
    console.log(`${colors.yellow}JWT_SECRET=${envConfig.JWT_SECRET}${colors.reset}\n`);
    
    console.log(`${colors.green}🎉 Setup complete! Your backend is ready for MongoDB Atlas.${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}❌ Error creating .env file:${colors.reset}`, error.message);
  }
  
  rl.close();
}

// Start the setup process
console.log(`${colors.cyan}Please have your MongoDB Atlas connection string ready.${colors.reset}`);
console.log(`${colors.cyan}You can get it from: Atlas Dashboard → Connect → Connect your application${colors.reset}\n`);

askQuestion();