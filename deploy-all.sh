#!/bin/bash

<<<<<<< HEAD
# GameOn Platform - Complete Vercel Deployment Script
# This script deploys both frontend and admin panel to Vercel

echo "🚀 GameOn Platform - Complete Deployment to Vercel"
=======
# GameOn Platform - Complete Deployment Script
# This script deploys all three applications to Vercel

set -e

echo "🚀 GameOn Platform - Complete Deployment Script"
>>>>>>> bc135b18b315320c036c874aea47e8bbb6dffc63
echo "================================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
<<<<<<< HEAD
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
else
    echo "✅ Vercel CLI is installed"
fi

# Deploy Frontend
echo ""
echo "🌐 Deploying Frontend..."
cd frontend
echo "📦 Building frontend..."
if npm run build; then
    echo "🚀 Deploying to Vercel..."
    if vercel --prod --yes; then
        echo "✅ Frontend deployed successfully!"
    else
        echo "❌ Frontend deployment failed!"
        exit 1
    fi
else
    echo "❌ Frontend build failed!"
    exit 1
fi

# Deploy Admin Panel
echo ""
echo "🔐 Deploying Admin Panel..."
cd ../admin-panel
echo "📦 Building admin panel..."
if npm run build; then
    echo "🚀 Deploying to Vercel..."
    if vercel --prod --yes; then
        echo "✅ Admin Panel deployed successfully!"
    else
        echo "❌ Admin Panel deployment failed!"
        exit 1
    fi
else
    echo "❌ Admin Panel build failed!"
    exit 1
fi

cd ..

echo ""
echo "🎉 Deployment Complete!"
echo "================================================="
echo "✅ Frontend: Check Vercel dashboard for URL"
echo "✅ Admin Panel: Check Vercel dashboard for URL"
echo "✅ Backend: https://gameon-backend.onrender.com"
echo "📱 Mobile app will automatically use production API"
echo ""
echo "Next steps:"
echo "1. Update CORS in backend with your actual Vercel URLs"
echo "2. Test all functionality"
echo "3. Create admin users if needed"
=======
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
>>>>>>> bc135b18b315320c036c874aea47e8bbb6dffc63
