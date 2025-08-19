# GameOn Platform - Vercel Deployment Script
# Deploys both frontend and admin panel to Vercel with custom domains

Write-Host "🚀 GameOn Platform - Vercel Deployment" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

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

# Check/Install Vercel CLI
if (-not (Test-Command "vercel")) {
    Write-Host "⚠️  Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Vercel CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Vercel CLI installed" -ForegroundColor Green
} else {
    $vercelVersion = vercel --version
    Write-Host "✅ Vercel CLI: $vercelVersion" -ForegroundColor Green
}

$nodeVersion = node --version
$npmVersion = npm --version
Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
Write-Host "✅ npm: $npmVersion" -ForegroundColor Green

# Deploy Frontend
Write-Host ""
Write-Host "🌐 Deploying Frontend to Vercel..." -ForegroundColor Cyan
Set-Location "frontend"

Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend dependency installation failed" -ForegroundColor Red
    exit 1
}

Write-Host "Building frontend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    exit 1
}

Write-Host "Deploying frontend to Vercel..." -ForegroundColor Yellow
vercel --prod --yes
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend deployed successfully" -ForegroundColor Green
Set-Location ".."

# Deploy Admin Panel
Write-Host ""
Write-Host "🔧 Deploying Admin Panel to Vercel..." -ForegroundColor Cyan
Set-Location "admin-panel"

Write-Host "Installing admin panel dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Admin panel dependency installation failed" -ForegroundColor Red
    exit 1
}

Write-Host "Building admin panel..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Admin panel build failed" -ForegroundColor Red
    exit 1
}

Write-Host "Deploying admin panel to Vercel..." -ForegroundColor Yellow
vercel --prod --yes
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Admin panel deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Admin panel deployed successfully" -ForegroundColor Green
Set-Location ".."

# Summary
Write-Host ""
Write-Host "🎉 Vercel Deployment Completed Successfully!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Deployed Applications:" -ForegroundColor Cyan
Write-Host "• Frontend: Deployed to Vercel" -ForegroundColor White
Write-Host "• Admin Panel: Deployed to Vercel" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure custom domains in Vercel dashboard:" -ForegroundColor White
Write-Host "   - Frontend: gameonesport.xyz" -ForegroundColor White
Write-Host "   - Admin Panel: admin.gameonesport.xyz" -ForegroundColor White
Write-Host "2. Set up DNS records for your domains" -ForegroundColor White
Write-Host "3. Wait for SSL certificates to be provisioned" -ForegroundColor White
Write-Host "4. Test all functionality" -ForegroundColor White
Write-Host ""
Write-Host "📖 Domain Configuration:" -ForegroundColor Cyan
Write-Host "Add these DNS records to your domain registrar:" -ForegroundColor White
Write-Host ""
Write-Host "Type: A" -ForegroundColor Yellow
Write-Host "Name: @" -ForegroundColor Yellow
Write-Host "Value: 76.76.19.61" -ForegroundColor Yellow
Write-Host "TTL: 300" -ForegroundColor Yellow
Write-Host ""
Write-Host "Type: CNAME" -ForegroundColor Yellow
Write-Host "Name: www" -ForegroundColor Yellow
Write-Host "Value: cname.vercel-dns.com" -ForegroundColor Yellow
Write-Host "TTL: 300" -ForegroundColor Yellow
Write-Host ""
Write-Host "Type: CNAME" -ForegroundColor Yellow
Write-Host "Name: admin" -ForegroundColor Yellow
Write-Host "Value: cname.vercel-dns.com" -ForegroundColor Yellow
Write-Host "TTL: 300" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔗 Useful Links:" -ForegroundColor Cyan
Write-Host "• Vercel Dashboard: https://vercel.com/dashboard" -ForegroundColor White
Write-Host "• DNS Configuration Guide: ./DNS_CONFIGURATION_GUIDE.md" -ForegroundColor White