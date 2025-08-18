#!/usr/bin/env node

/**
 * Vercel Deployment Script for GameOn Frontend
 * This script prepares and deploys the frontend to Vercel
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting GameOn Frontend deployment to Vercel...\n');

// Check if vercel CLI is installed
try {
  execSync('vercel --version', { stdio: 'ignore' });
} catch (error) {
  console.log('Installing Vercel CLI...');
  execSync('npm install -g vercel', { stdio: 'inherit' });
}

// Build the project
console.log('📦 Building the project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully!\n');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Deploy to Vercel
console.log('🌐 Deploying to Vercel...');
try {
  execSync('vercel --prod', { stdio: 'inherit' });
  console.log('\n✅ Deployment completed successfully!');
  console.log('🎉 Your GameOn Frontend is now live on Vercel!');
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}