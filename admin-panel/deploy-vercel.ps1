#!/usr/bin/env pwsh
# Vercel Deployment Script for Admin Panel

Write-Host "🚀 Admin Panel Vercel Deployment Script`n" -ForegroundColor Cyan

# Check Node and npm
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
$nodeVersion = & node --version
$npmVersion = & npm --version

Write-Host "  ✅ Node: $nodeVersion" -ForegroundColor Green
Write-Host "  ✅ npm: $npmVersion" -ForegroundColor Green

# Run verification
Write-Host "`n🔍 Running build verification..." -ForegroundColor Yellow
& node verify-build.js

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Verification failed. Fix the issues and try again.`n" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow
& npm install --legacy-peer-deps

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ npm install failed.`n" -ForegroundColor Red
    exit 1
}

# Run build
Write-Host "`n🔨 Building application..." -ForegroundColor Yellow
& npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Build failed.`n" -ForegroundColor Red
    exit 1
}

# Check if .next exists
if (!(Test-Path ".next")) {
    Write-Host "`n❌ Build output directory '.next' not found!`n" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Build successful!" -ForegroundColor Green
Write-Host "`n📊 Build output details:" -ForegroundColor Yellow
Get-Item ".next" | Format-List

# Deployment instructions
Write-Host "`n📝 Deployment Instructions:" -ForegroundColor Cyan
Write-Host "  1. Commit changes: git add . && git commit -m 'Fix: Vercel build configuration'" -ForegroundColor White
Write-Host "  2. Push to main: git push origin main" -ForegroundColor White
Write-Host "  3. Vercel will automatically build and deploy" -ForegroundColor White
Write-Host "`n  View deployment: https://vercel.com/dashboard" -ForegroundColor Gray

Write-Host "`n🎉 Deployment script complete!`n" -ForegroundColor Green
