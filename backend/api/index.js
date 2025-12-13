console.log('[Vercel Handler] Starting serverless handler initialization');
console.log('[Vercel Handler] NODE_ENV:', process.env.NODE_ENV);
console.log('[Vercel Handler] VERCEL:', !!process.env.VERCEL);
console.log('[Vercel Handler] MONGODB_URI configured:', !!process.env.MONGODB_URI);
console.log('[Vercel Handler] DATABASE_URL configured:', !!process.env.DATABASE_URL);
console.log('[Vercel Handler] JWT_SECRET configured:', !!process.env.JWT_SECRET);
console.log('[Vercel Handler] JWT_SECRET type:', typeof process.env.JWT_SECRET);
console.log('[Vercel Handler] JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);

// CRITICAL: Validate JWT_SECRET at startup
if (!process.env.JWT_SECRET || typeof process.env.JWT_SECRET !== 'string' || process.env.JWT_SECRET.trim() === '') {
  console.error('[Vercel Handler] ❌ CRITICAL ERROR: JWT_SECRET is not properly configured!');
  console.error('[Vercel Handler] JWT_SECRET value:', process.env.JWT_SECRET || 'UNDEFINED');
  console.error('[Vercel Handler] Authentication will fail until JWT_SECRET is set in Vercel environment variables');
}

let app;
try {
  // Set VERCEL environment variable to ensure serverless mode detection
  if (!process.env.VERCEL) {
    process.env.VERCEL = '1';
  }
  
  app = require('../server');
  console.log('[Vercel Handler] Express app loaded successfully');
} catch (err) {
  console.error('[Vercel Handler] Failed to load Express app:', err.message);
  console.error('[Vercel Handler] Error stack:', err.stack);
  // Don't throw - return error handler instead
  app = (req, res) => {
    res.status(500).json({
      success: false,
      message: 'Server initialization failed',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message
    });
  };
}

console.log('[Vercel Handler] Serverless handler ready');
module.exports = app;
