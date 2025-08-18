/**
 * Test Your Specific MongoDB Atlas Connection
 * This will test your exact connection string
 */

const mongoose = require('mongoose');

// Your MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://vivekbadgujar:Vivek321@cluster0.squjxrk.mongodb.net/gameon?retryWrites=true&w=majority&appName=Cluster0';

console.log('🧪 Testing Your MongoDB Atlas Connection...\n');

// Connection options
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4,
  retryWrites: true,
  w: 'majority'
};

async function testConnection() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    console.log('Cluster: cluster0.squjxrk.mongodb.net');
    console.log('Database: gameon');
    console.log('User: vivekbadgujar\n');
    
    await mongoose.connect(MONGODB_URI, connectionOptions);
    
    console.log('✅ Connection successful!');
    console.log('Database Name:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    console.log('Ready State:', mongoose.connection.readyState);
    
    // Test database operations
    console.log('\n🧪 Testing database operations...');
    
    // Create a test collection
    const TestSchema = new mongoose.Schema({
      message: String,
      timestamp: { type: Date, default: Date.now },
      platform: { type: String, default: 'GameOn' }
    });
    
    const TestModel = mongoose.model('ConnectionTest', TestSchema);
    
    // Insert test document
    const testDoc = new TestModel({ 
      message: 'GameOn Platform - Atlas connection successful!',
      platform: 'GameOn'
    });
    await testDoc.save();
    console.log('✅ Write operation successful');
    
    // Read test document
    const foundDoc = await TestModel.findById(testDoc._id);
    console.log('✅ Read operation successful');
    console.log('Test message:', foundDoc.message);
    
    // Clean up
    await TestModel.findByIdAndDelete(testDoc._id);
    console.log('✅ Delete operation successful');
    
    console.log('\n🎉 All tests passed! Your MongoDB Atlas is ready for GameOn Platform!');
    
    console.log('\n📋 Next Steps:');
    console.log('1. Add this connection string to Render environment variables');
    console.log('2. Set MONGODB_URI in Render dashboard');
    console.log('3. Redeploy your backend');
    console.log('4. Test your deployed API');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    
    if (error.name === 'MongoServerSelectionError') {
      console.log('\n💡 Troubleshooting:');
      console.log('1. Check if your Atlas cluster is running');
      console.log('2. Verify network access allows all IPs (0.0.0.0/0)');
      console.log('3. Confirm username/password is correct');
      console.log('4. Ensure user has read/write permissions');
    }
    
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
    process.exit(0);
  }
}

testConnection();