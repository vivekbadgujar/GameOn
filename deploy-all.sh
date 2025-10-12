#!/bin/bash

# GameOn Platform - Complete Deployment Script
# This script deploys all three applications to Vercel

set -e

echo "🚀 GameOn Platform - Complete Deployment Script"
echo "================================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm i -g vercel
fi

echo "✅ Vercel CLI found"
echo ""

# Function to deploy with error handling
deploy_app() {
    local app_name=$1
    local app_path=$2
    
    echo "🔄 Deploying $app_name..."
    echo "   Path: $app_path"
    
    cd "$app_path"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        echo "❌ package.json not found in $app_path"
        return 1
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies for $app_name..."
        npm install
    fi
    
    # Run build test
    echo "🔨 Testing build for $app_name..."
    npm run build
    
    # Deploy to Vercel
    echo "☁️  Deploying $app_name to Vercel..."
    vercel --prod --yes
    
    echo "✅ $app_name deployed successfully!"
    echo ""
    
    cd - > /dev/null
}

# Deploy in order: Backend -> Frontend -> Admin Panel
echo "Starting deployment process..."
echo ""

# 1. Deploy Backend
echo "1️⃣  Backend Deployment"
echo "====================="
deploy_app "Backend" "/Users/naishailesh/GameOn/backend"

# 2. Deploy Frontend
echo "2️⃣  Frontend Deployment"
echo "======================"
deploy_app "Frontend" "/Users/naishailesh/GameOn/frontend"

# 3. Deploy Admin Panel
echo "3️⃣  Admin Panel Deployment"
echo "========================="
deploy_app "Admin Panel" "/Users/naishailesh/GameOn/admin-panel"

echo "🎉 All applications deployed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Update environment variables in each Vercel dashboard"
echo "2. Update API URLs in frontend and admin panel environments"
echo "3. Set up MongoDB Atlas connection string"
echo "4. Configure Cloudinary for file uploads"
echo "5. Test all functionality"
echo ""
echo "📖 See COMPLETE_DEPLOYMENT_GUIDE.md for detailed instructions"