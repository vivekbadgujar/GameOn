/**
 * Test MongoDB Atlas Connection
 * Use this script to test your Atlas connection before deploying
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

console.log(`${colors.blue}🧪 Testing MongoDB Atlas Connection...${colors.reset}\n`);

// Get MongoDB URI from environment or prompt for it
let MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  console.log(`${colors.yellow}⚠️  No MONGODB_URI found in environment variables${colors.reset}`);
  console.log(`${colors.yellow}Please set MONGODB_URI in your .env file or as environment variable${colors.reset}`);
  console.log(`${colors.yellow}Example: mongodb+srv://username:password@cluster.mongodb.net/database${colors.reset}\n`);
  process.exit(1);
}

// Hide credentials in logs
const maskedURI = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
console.log(`${colors.blue}Using MongoDB URI: ${maskedURI}${colors.reset}`);

// Connection options (same as your backend)
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4
};

// Add Atlas-specific options if using cloud database
if (MONGODB_URI.includes('mongodb+srv://')) {
  connectionOptions.retryWrites = true;
  connectionOptions.w = 'majority';
  console.log(`${colors.blue}✅ Detected MongoDB Atlas connection string${colors.reset}`);
}

// Connection event handlers
mongoose.connection.on('error', (err) => {
  console.error(`${colors.red}❌ MongoDB connection error:${colors.reset}`, err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log(`${colors.yellow}⚠️  MongoDB disconnected${colors.reset}`);
});

mongoose.connection.on('connected', () => {
  console.log(`${colors.green}✅ MongoDB connected successfully!${colors.reset}`);
});

// Test connection
async function testConnection() {
  try {
    console.log(`${colors.blue}🔌 Attempting to connect...${colors.reset}`);
    
    await mongoose.connect(MONGODB_URI, connectionOptions);
    
    console.log(`${colors.green}🎉 Connection successful!${colors.reset}`);
    console.log(`${colors.green}Database Name: ${mongoose.connection.name}${colors.reset}`);
    console.log(`${colors.green}Host: ${mongoose.connection.host}${colors.reset}`);
    console.log(`${colors.green}Ready State: ${mongoose.connection.readyState}${colors.reset}`);
    
    // Test basic database operation
    console.log(`\n${colors.blue}🧪 Testing database operations...${colors.reset}`);
    
    // Create a simple test schema
    const TestSchema = new mongoose.Schema({
      message: String,
      timestamp: { type: Date, default: Date.now }
    });
    
    const TestModel = mongoose.model('ConnectionTest', TestSchema);
    
    // Insert test document
    const testDoc = new TestModel({ message: 'Connection test successful!' });
    await testDoc.save();
    console.log(`${colors.green}✅ Write operation successful${colors.reset}`);
    
    // Read test document
    const foundDoc = await TestModel.findById(testDoc._id);
    console.log(`${colors.green}✅ Read operation successful${colors.reset}`);
    console.log(`${colors.green}Test message: ${foundDoc.message}${colors.reset}`);
    
    // Clean up test document
    await TestModel.findByIdAndDelete(testDoc._id);
    console.log(`${colors.green}✅ Delete operation successful${colors.reset}`);
    
    console.log(`\n${colors.green}🎉 All tests passed! Your MongoDB Atlas connection is working perfectly.${colors.reset}`);
    
  } catch (error) {
    console.error(`\n${colors.red}❌ Connection failed:${colors.reset}`);
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    
    // Provide specific error guidance
    if (error.name === 'MongoServerSelectionError') {
      console.log(`\n${colors.yellow}💡 Troubleshooting tips:${colors.reset}`);
      console.log(`${colors.yellow}1. Check if your MongoDB Atlas cluster is running${colors.reset}`);
      console.log(`${colors.yellow}2. Verify network access allows your IP (0.0.0.0/0 for all)${colors.reset}`);
      console.log(`${colors.yellow}3. Check if username/password in connection string is correct${colors.reset}`);
      console.log(`${colors.yellow}4. Ensure database user has read/write permissions${colors.reset}`);
    } else if (error.name === 'MongoParseError') {
      console.log(`\n${colors.yellow}💡 Connection string format error:${colors.reset}`);
      console.log(`${colors.yellow}Correct format: mongodb+srv://username:password@cluster.mongodb.net/database${colors.reset}`);
    } else if (error.message.includes('authentication failed')) {
      console.log(`\n${colors.yellow}💡 Authentication error:${colors.reset}`);
      console.log(`${colors.yellow}1. Check username and password in connection string${colors.reset}`);
      console.log(`${colors.yellow}2. Verify database user exists in Atlas${colors.reset}`);
      console.log(`${colors.yellow}3. Check user permissions (should be read/write)${colors.reset}`);
    }
    
    process.exit(1);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log(`\n${colors.blue}🔌 Connection closed${colors.reset}`);
    process.exit(0);
  }
}

// Run the test
testConnection();