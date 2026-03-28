/**
 * Serverless Environment Configuration for GameOn Platform
 * Optimizes performance and compatibility across Vercel, AWS Lambda, and other serverless platforms
 */

const path = require('path');
const os = require('os');

// Detect serverless environment
const isServerless = !!process.env.VERCEL || 
                    !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
                    !!process.env.FUNCTIONS_WORKFLOW_RUNTIME ||
                    !!process.env.FUNCTION_TARGET;

// Serverless configuration
const serverlessConfig = {
  isServerless,
  
  // File system configuration
  getUploadDir: (subdir = '') => {
    const baseDir = process.env.MANUAL_PAYMENT_UPLOAD_DIR || 
                   path.join(os.tmpdir(), 'gameon-uploads');
    return subdir ? path.join(baseDir, subdir) : baseDir;
  },
  
  // Ensure directory exists
  ensureDir: (dirPath) => {
    const fs = require('fs');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    return dirPath;
  },
  
  // Memory and performance optimization
  optimizeForServerless: () => {
    if (isServerless) {
      // Set Node.js optimization flags
      process.env.NODE_OPTIONS = '--max-old-space-size=1024';
      
      // Configure MongoDB connection pooling for serverless
      process.env.MONGODB_POOL_SIZE = '5';
      process.env.MONGODB_MAX_IDLE_TIME = '30000';
      
      // Optimize garbage collection
      if (global.gc) {
        global.gc();
      }
      
      console.log('[SERVERLESS] Environment optimizations applied');
    }
  },
  
  // Health check for serverless
  healthCheck: async () => {
    const mongoose = require('mongoose');
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: isServerless ? 'serverless' : 'traditional',
      platform: process.env.VERCEL ? 'vercel' : 
                process.env.AWS_LAMBDA_FUNCTION_NAME ? 'aws-lambda' : 'unknown',
      memory: {
        used: process.memoryUsage(),
        free: os.freemem(),
        total: os.totalmem()
      },
      database: {
        connected: mongoose.connection.readyState === 1,
        state: mongoose.connection.readyState
      }
    };
    
    return health;
  },
  
  // Cleanup function for serverless
  cleanup: async () => {
    if (isServerless) {
      // Close MongoDB connections
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }
      
      // Clear any temporary files
      const fs = require('fs');
      const tempDir = path.join(os.tmpdir(), 'gameon-uploads');
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
      
      console.log('[SERVERLESS] Cleanup completed');
    }
  },
  
  // Error handling for serverless
  handleError: (error, context = {}) => {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      environment: isServerless ? 'serverless' : 'traditional',
      context: {
        functionName: process.env.FUNCTION_NAME,
        functionVersion: process.env.FUNCTION_VERSION,
        requestId: context.requestId,
        ...context
      }
    };
    
    console.error('[SERVERLESS] Error:', JSON.stringify(errorInfo, null, 2));
    
    // Return user-friendly error
    return {
      success: false,
      message: isServerless ? 'Service temporarily unavailable' : error.message,
      error: isServerless ? 'SERVICE_UNAVAILABLE' : error.name,
      timestamp: errorInfo.timestamp
    };
  }
};

// Apply optimizations immediately if in serverless environment
if (serverlessConfig.isServerless) {
  serverlessConfig.optimizeForServerless();
}

// Handle cleanup on process exit
process.on('SIGTERM', async () => {
  console.log('[SERVERLESS] SIGTERM received');
  await serverlessConfig.cleanup();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[SERVERLESS] SIGINT received');
  await serverlessConfig.cleanup();
  process.exit(0);
});

module.exports = serverlessConfig;
