# GameOn Platform - Complete Vercel Deployment Script
# This script deploys both frontend and admin panel to Vercel

Write-Host "🚀 GameOn Platform - Complete Deployment to Vercel" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Check if Vercel CLI is installed
try {
    vercel --version | Out-Null
    Write-Host "✅ Vercel CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "📦 Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

# Deploy Frontend
Write-Host "`n🌐 Deploying Frontend..." -ForegroundColor Cyan
Set-Location "frontend"
try {
    Write-Host "📦 Building frontend..." -ForegroundColor Yellow
    npm run build
    Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
    vercel --prod --yes
    Write-Host "✅ Frontend deployed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend deployment failed!" -ForegroundColor Red
    exit 1
}

# Deploy Admin Panel
Write-Host "`n🔐 Deploying Admin Panel..." -ForegroundColor Cyan
Set-Location "../admin-panel"
try {
    Write-Host "📦 Building admin panel..." -ForegroundColor Yellow
    npm run build
    Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
    vercel --prod --yes
    Write-Host "✅ Admin Panel deployed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Admin Panel deployment failed!" -ForegroundColor Red
    exit 1
}

Set-Location ".."

Write-Host "`n🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host "✅ Frontend: Check Vercel dashboard for URL" -ForegroundColor Green
Write-Host "✅ Admin Panel: Check Vercel dashboard for URL" -ForegroundColor Green
Write-Host "✅ Backend: https://gameon-backend.onrender.com" -ForegroundColor Green
Write-Host "📱 Mobile app will automatically use production API" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Update CORS in backend with your actual Vercel URLs" -ForegroundColor Yellow
Write-Host "2. Test all functionality" -ForegroundColor Yellow
Write-Host "3. Create admin users if needed" -ForegroundColor Yellow