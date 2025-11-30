console.log('[Vercel Handler] Starting serverless handler initialization');
console.log('[Vercel Handler] NODE_ENV:', process.env.NODE_ENV);
console.log('[Vercel Handler] MONGODB_URI configured:', !!process.env.MONGODB_URI);
console.log('[Vercel Handler] DATABASE_URL configured:', !!process.env.DATABASE_URL);

let app;
try {
  app = require('../server');
  console.log('[Vercel Handler] Express app loaded successfully');
} catch (err) {
  console.error('[Vercel Handler] Failed to load Express app:', err.message);
  console.error('[Vercel Handler] Error stack:', err.stack);
  throw err;
}

console.log('[Vercel Handler] Serverless handler ready');
module.exports = app;
