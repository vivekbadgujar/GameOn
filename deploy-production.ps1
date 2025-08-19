# GameOn Platform - Production Deployment Script
# Run this script to deploy all components to production

Write-Host "🚀 GameOn Platform - Production Deployment" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Check if required tools are installed
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found." -ForegroundColor Red
    exit 1
}

# Check Vercel CLI
try {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI: $vercelVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
}

Write-Host ""
Write-Host "🔧 Starting deployment process..." -ForegroundColor Cyan

# Backend preparation
Write-Host "📦 Preparing backend..." -ForegroundColor Yellow
Set-Location "backend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend npm install failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
Set-Location ".."

# Frontend preparation and deployment
Write-Host "🌐 Deploying frontend..." -ForegroundColor Yellow
Set-Location "frontend"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend npm install failed" -ForegroundColor Red
    exit 1
}

# Build frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}

# Deploy to Vercel
Write-Host "🚀 Deploying frontend to Vercel..." -ForegroundColor Cyan
vercel --prod --yes
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend deployment failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend deployed successfully" -ForegroundColor Green
Set-Location ".."

# Admin panel preparation and deployment
Write-Host "🔧 Deploying admin panel..." -ForegroundColor Yellow
Set-Location "admin-panel"
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Admin panel npm install failed" -ForegroundColor Red
    exit 1
}

# Build admin panel
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Admin panel build failed" -ForegroundColor Red
    exit 1
}

# Deploy to Vercel
Write-Host "🚀 Deploying admin panel to Vercel..." -ForegroundColor Cyan
vercel --prod --yes
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Admin panel deployment failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Admin panel deployed successfully" -ForegroundColor Green
Set-Location ".."

Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Configure custom domains in Vercel dashboard" -ForegroundColor White
Write-Host "2. Deploy backend to Render manually" -ForegroundColor White
Write-Host "3. Set up DNS records for your domains" -ForegroundColor White
Write-Host "4. Configure Cashfree production credentials" -ForegroundColor White
Write-Host "5. Test all functionality" -ForegroundColor White
Write-Host ""
Write-Host "📖 See PRODUCTION_DEPLOYMENT_GUIDE.md for detailed instructions" -ForegroundColor Yellow