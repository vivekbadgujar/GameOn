# GameOn Platform - Production Build Script
# This script builds all components for production deployment

Write-Host "🏗️  GameOn Platform - Production Build" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

$ErrorActionPreference = "Stop"

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check prerequisites
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-Host "❌ npm not found. Please install npm first." -ForegroundColor Red
    exit 1
}

$nodeVersion = node --version
$npmVersion = npm --version
Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
Write-Host "✅ npm: $npmVersion" -ForegroundColor Green

# Build Backend
Write-Host ""
Write-Host "🔧 Building Backend..." -ForegroundColor Cyan
Set-Location "backend"

Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend dependency installation failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
Set-Location ".."

# Build Frontend
Write-Host ""
Write-Host "🌐 Building Frontend..." -ForegroundColor Cyan
Set-Location "frontend"

Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend dependency installation failed" -ForegroundColor Red
    exit 1
}

Write-Host "Building frontend for production..." -ForegroundColor Yellow
$env:REACT_APP_API_BASE_URL = "https://api.gameonesport.xyz/api"
$env:REACT_APP_WS_URL = "wss://api.gameonesport.xyz"
$env:REACT_APP_CASHFREE_ENVIRONMENT = "production"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend built successfully" -ForegroundColor Green
Set-Location ".."

# Build Admin Panel
Write-Host ""
Write-Host "🔧 Building Admin Panel..." -ForegroundColor Cyan
Set-Location "admin-panel"

Write-Host "Installing admin panel dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Admin panel dependency installation failed" -ForegroundColor Red
    exit 1
}

Write-Host "Building admin panel for production..." -ForegroundColor Yellow
$env:REACT_APP_API_URL = "https://api.gameonesport.xyz/api"
$env:REACT_APP_API_BASE_URL = "https://api.gameonesport.xyz"
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Admin panel build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Admin panel built successfully" -ForegroundColor Green
Set-Location ".."

# Summary
Write-Host ""
Write-Host "🎉 Production Build Completed Successfully!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Build Artifacts:" -ForegroundColor Cyan
Write-Host "• Backend: Ready for Render deployment" -ForegroundColor White
Write-Host "• Frontend: build/ folder ready for Vercel" -ForegroundColor White
Write-Host "• Admin Panel: build/ folder ready for Vercel" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Deploy backend to Render" -ForegroundColor White
Write-Host "2. Deploy frontend to Vercel" -ForegroundColor White
Write-Host "3. Deploy admin panel to Vercel" -ForegroundColor White
Write-Host "4. Configure custom domains" -ForegroundColor White
Write-Host "5. Set up DNS records" -ForegroundColor White
Write-Host ""
Write-Host "📖 See PRODUCTION_DEPLOYMENT_GUIDE.md for detailed instructions" -ForegroundColor Cyan