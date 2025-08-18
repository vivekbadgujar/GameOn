#!/bin/bash

# GameOn Platform - Complete Vercel Deployment Script
# This script deploys both frontend and admin panel to Vercel

echo "🚀 GameOn Platform - Complete Deployment to Vercel"
echo "================================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
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