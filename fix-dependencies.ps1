# GameOn Platform - Fix Dependencies for Vercel Deployment
# Resolves React Three.js dependency conflicts

Write-Host "🔧 GameOn Platform - Fixing Dependencies" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "📋 Fixing dependency conflicts..." -ForegroundColor Yellow

# Fix Frontend Dependencies
Write-Host ""
Write-Host "🌐 Fixing Frontend Dependencies..." -ForegroundColor Cyan
Set-Location "frontend"

Write-Host "Cleaning npm cache..." -ForegroundColor Yellow
npm cache clean --force

Write-Host "Removing node_modules and package-lock.json..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
}

Write-Host "Installing dependencies with legacy peer deps..." -ForegroundColor Yellow
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend dependency installation failed" -ForegroundColor Red
    exit 1
}

Write-Host "Testing build..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build test failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend dependencies fixed" -ForegroundColor Green
Set-Location ".."

# Fix Admin Panel Dependencies
Write-Host ""
Write-Host "🔧 Fixing Admin Panel Dependencies..." -ForegroundColor Cyan
Set-Location "admin-panel"

Write-Host "Cleaning npm cache..." -ForegroundColor Yellow
npm cache clean --force

Write-Host "Removing node_modules and package-lock.json..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
}

Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Admin panel dependency installation failed" -ForegroundColor Red
    exit 1
}

Write-Host "Testing build..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Admin panel build test failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Admin panel dependencies fixed" -ForegroundColor Green
Set-Location ".."

# Summary
Write-Host ""
Write-Host "🎉 Dependencies Fixed Successfully!" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Fixed Issues:" -ForegroundColor Cyan
Write-Host "• ✅ React Three.js version conflicts resolved" -ForegroundColor Green
Write-Host "• ✅ Peer dependency warnings fixed" -ForegroundColor Green
Write-Host "• ✅ Build process verified" -ForegroundColor Green
Write-Host "• ✅ Legacy peer deps configured" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Changes Made:" -ForegroundColor Yellow
Write-Host "• Downgraded @react-three/drei to v9.88.13 (React 18 compatible)" -ForegroundColor White
Write-Host "• Downgraded @react-three/fiber to v8.15.12 (React 18 compatible)" -ForegroundColor White
Write-Host "• Downgraded three.js to v0.158.0 (compatible version)" -ForegroundColor White
Write-Host "• Added package.json overrides and resolutions" -ForegroundColor White
Write-Host "• Created .npmrc with legacy-peer-deps=true" -ForegroundColor White
Write-Host "• Updated Vercel install command" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Commit and push changes to GitHub" -ForegroundColor White
Write-Host "2. Redeploy on Vercel (should work now)" -ForegroundColor White
Write-Host "3. Or run ./deploy-vercel-free.ps1" -ForegroundColor White
Write-Host ""
Write-Host "📝 Git Commands:" -ForegroundColor Cyan
Write-Host "git add ." -ForegroundColor White
Write-Host "git commit -m 'Fix React Three.js dependency conflicts for Vercel'" -ForegroundColor White
Write-Host "git push origin master" -ForegroundColor White