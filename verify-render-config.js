/**
 * Verify Render Configuration
 * This script helps verify that all required environment variables are set correctly
 */

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

console.log(`${colors.blue}🔍 Verifying Render Configuration...${colors.reset}\n`);

// Required environment variables for Render deployment
const requiredVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NODE_ENV'
];

// Optional environment variables
const optionalVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY', 
  'CLOUDINARY_API_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET'
];

let allGood = true;

console.log(`${colors.blue}📋 Required Environment Variables:${colors.reset}`);
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`${colors.green}✅ ${varName}: Set${colors.reset}`);
    
    // Special validation for specific variables
    if (varName === 'DATABASE_URL' && !value.includes('mongodb')) {
      console.log(`${colors.yellow}⚠️  Warning: DATABASE_URL doesn't appear to be a MongoDB connection string${colors.reset}`);
    }
    
    if (varName === 'JWT_SECRET' && value.length < 32) {
      console.log(`${colors.yellow}⚠️  Warning: JWT_SECRET should be at least 32 characters long${colors.reset}`);
    }
    
    if (varName === 'NODE_ENV' && value !== 'production') {
      console.log(`${colors.yellow}⚠️  Warning: NODE_ENV should be 'production' for Render deployment${colors.reset}`);
    }
  } else {
    console.log(`${colors.red}❌ ${varName}: Not set${colors.reset}`);
    allGood = false;
  }
});

console.log(`\n${colors.blue}📋 Optional Environment Variables:${colors.reset}`);
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`${colors.green}✅ ${varName}: Set${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚪ ${varName}: Not set (optional)${colors.reset}`);
  }
});

console.log(`\n${colors.blue}🔗 Connection String Analysis:${colors.reset}`);
const dbUrl = process.env.DATABASE_URL || process.env.MONGODB_URI;
if (dbUrl) {
  const maskedUrl = dbUrl.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
  console.log(`${colors.green}✅ Database URL: ${maskedUrl}${colors.reset}`);
  
  if (dbUrl.includes('mongodb+srv://')) {
    console.log(`${colors.green}✅ Using MongoDB Atlas (SRV connection)${colors.reset}`);
  } else if (dbUrl.includes('mongodb://')) {
    console.log(`${colors.yellow}⚠️  Using standard MongoDB connection${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Invalid MongoDB connection string format${colors.reset}`);
    allGood = false;
  }
  
  if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
    console.log(`${colors.red}❌ Connection string points to localhost - this won't work on Render!${colors.reset}`);
    allGood = false;
  }
} else {
  console.log(`${colors.red}❌ No database connection string found${colors.reset}`);
  allGood = false;
}

console.log(`\n${colors.blue}📊 Summary:${colors.reset}`);
if (allGood) {
  console.log(`${colors.green}🎉 Configuration looks good! Ready for Render deployment.${colors.reset}`);
} else {
  console.log(`${colors.red}❌ Configuration issues found. Please fix the above errors before deploying.${colors.reset}`);
  
  console.log(`\n${colors.yellow}💡 Next Steps:${colors.reset}`);
  console.log(`${colors.yellow}1. Go to your Render dashboard${colors.reset}`);
  console.log(`${colors.yellow}2. Select your GameOn backend service${colors.reset}`);
  console.log(`${colors.yellow}3. Go to Environment tab${colors.reset}`);
  console.log(`${colors.yellow}4. Add the missing environment variables${colors.reset}`);
  console.log(`${colors.yellow}5. Redeploy your service${colors.reset}`);
}

console.log(`\n${colors.blue}🔧 Environment Variables to Set in Render:${colors.reset}`);
console.log(`${colors.blue}DATABASE_URL=${colors.reset} mongodb+srv://vivekbadgujar:Vivek321@cluster0.squjxrk.mongodb.net/gameon?retryWrites=true&w=majority&appName=Cluster0`);
console.log(`${colors.blue}JWT_SECRET=${colors.reset} your-super-secure-jwt-secret-key-minimum-32-characters-change-this`);
console.log(`${colors.blue}NODE_ENV=${colors.reset} production`);