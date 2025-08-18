/**
 * Generate Secure JWT Secret
 * Run this to generate a secure JWT secret for production
 */

const crypto = require('crypto');

console.log('🔐 Generating Secure JWT Secrets...\n');

// Generate main JWT secret
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_SECRET (for main authentication):');
console.log(jwtSecret);

// Generate refresh token secret
const refreshSecret = crypto.randomBytes(64).toString('hex');
console.log('\nJWT_REFRESH_SECRET (for refresh tokens):');
console.log(refreshSecret);

console.log('\n📋 Add these to your Render environment variables:');
console.log('================================');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`JWT_REFRESH_SECRET=${refreshSecret}`);

console.log('\n🔒 Keep these secrets secure and never share them!');
console.log('💡 Use different secrets for development and production');

// Also create a .env template with these secrets
const envContent = `# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://vivekbadgujar:Vivek321@cluster0.squjxrk.mongodb.net/gameon?retryWrites=true&w=majority&appName=Cluster0

# Server Configuration
NODE_ENV=development
PORT=5000

# Security - Generated JWT Secrets
JWT_SECRET=${jwtSecret}
JWT_REFRESH_SECRET=${refreshSecret}

# CORS Origins
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
`;

require('fs').writeFileSync('backend/.env', envContent);
console.log('\n✅ Updated backend/.env with secure secrets');
console.log('🔧 You can now test locally with: cd backend && npm start');