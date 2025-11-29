/**
 * Test MongoDB connection with production URI
 */
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI or DATABASE_URL environment variable is not set!');
  process.exit(1);
}

console.log('Testing MongoDB connection...');
console.log('URI (masked):', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

const connectionOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4
};

if (MONGODB_URI.includes('mongodb+srv://')) {
  connectionOptions.retryWrites = true;
  connectionOptions.w = 'majority';
}

mongoose.connect(MONGODB_URI, connectionOptions)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    console.log('Ready State:', mongoose.connection.readyState);
    mongoose.connection.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:');
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
    console.error('Error code:', err.code);
    process.exit(1);
  });
