# GameOn Platform - Vercel Free Plan Deployment Script
# Optimized for Vercel free plan with static export and direct Render backend calls

Write-Host "🚀 GameOn Platform - Vercel Free Plan Deployment" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

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

Write-Host ""
Write-Host "🔧 Free Plan Configuration:" -ForegroundColor Cyan
Write-Host "• Static export enabled (no serverless functions)" -ForegroundColor White
Write-Host "• Direct API calls to Render backend" -ForegroundColor White
Write-Host "• Single region deployment (iad1)" -ForegroundColor White
Write-Host "• No edge functions or middleware" -ForegroundColor White

# Deploy Frontend
Write-Host ""
Write-Host "🌐 Deploying Frontend to Vercel (Free Plan)..." -ForegroundColor Cyan
Set-Location "frontend"

Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend dependency installation failed" -ForegroundColor Red
    exit 1
}

Write-Host "Building frontend for static export..." -ForegroundColor Yellow
$env:NEXT_PUBLIC_API_BASE_URL = "https://api.gameonesport.xyz/api"
$env:NEXT_PUBLIC_WS_URL = "wss://api.gameonesport.xyz"
$env:NEXT_PUBLIC_CASHFREE_ENVIRONMENT = "production"
$env:NEXT_PUBLIC_FRONTEND_URL = "https://gameonesport.xyz"
$env:NEXT_PUBLIC_ADMIN_URL = "https://admin.gameonesport.xyz"

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
Write-Host "🔧 Deploying Admin Panel to Vercel (Free Plan)..." -ForegroundColor Cyan
Set-Location "admin-panel"

Write-Host "Installing admin panel dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Admin panel dependency installation failed" -ForegroundColor Red
    exit 1
}

Write-Host "Building admin panel for static export..." -ForegroundColor Yellow
$env:NEXT_PUBLIC_API_URL = "https://api.gameonesport.xyz/api"
$env:NEXT_PUBLIC_API_BASE_URL = "https://api.gameonesport.xyz"
$env:NEXT_PUBLIC_FRONTEND_URL = "https://gameonesport.xyz"
$env:NEXT_PUBLIC_ADMIN_URL = "https://admin.gameonesport.xyz"

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
Write-Host "🎉 Vercel Free Plan Deployment Completed!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Deployed Applications:" -ForegroundColor Cyan
Write-Host "• Frontend: Static export deployed to Vercel" -ForegroundColor White
Write-Host "• Admin Panel: Static export deployed to Vercel" -ForegroundColor White
Write-Host "• Backend: Running on Render (no changes needed)" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Free Plan Optimizations Applied:" -ForegroundColor Yellow
Write-Host "• ✅ No serverless functions (static export)" -ForegroundColor Green
Write-Host "• ✅ Direct API calls to Render backend" -ForegroundColor Green
Write-Host "• ✅ Single region deployment (iad1)" -ForegroundColor Green
Write-Host "• ✅ No edge functions or middleware" -ForegroundColor Green
Write-Host "• ✅ Optimized for free plan limits" -ForegroundColor Green
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
Write-Host "• Free Plan Limits: https://vercel.com/pricing" -ForegroundColor White
Write-Host "• DNS Configuration Guide: ./VERCEL_FREE_PLAN_GUIDE.md" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Free Plan Notes:" -ForegroundColor Yellow
Write-Host "• 100GB bandwidth per month" -ForegroundColor White
Write-Host "• 1000 serverless function invocations (not used)" -ForegroundColor White
Write-Host "• 100 deployments per day" -ForegroundColor White
Write-Host "• Custom domains included" -ForegroundColor White