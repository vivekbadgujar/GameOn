console.log('[Vercel Handler] Starting serverless handler initialization');
console.log('[Vercel Handler] NODE_ENV:', process.env.NODE_ENV);
console.log('[Vercel Handler] VERCEL:', !!process.env.VERCEL);
console.log('[Vercel Handler] MONGODB_URI configured:', !!process.env.MONGODB_URI);
console.log('[Vercel Handler] DATABASE_URL configured:', !!process.env.DATABASE_URL);
console.log('[Vercel Handler] JWT_SECRET configured:', !!process.env.JWT_SECRET);

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
