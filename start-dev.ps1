# GameOn Platform Development Startup Script
# This script starts both backend and frontend with proper configurations

Write-Host "🚀 Starting GameOn Platform Development Environment..." -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Yellow

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

Write-Host "`n📁 Current directory: $PWD" -ForegroundColor Cyan

# Function to start backend
function Start-Backend {
    Write-Host "`n🔧 Starting Backend Server..." -ForegroundColor Yellow
    
    Set-Location "backend"
    
    # Check if node_modules exists
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installing backend dependencies..." -ForegroundColor Cyan
        npm install
    }
    
    # Start backend server
    Write-Host "🚀 Starting backend on port 5000..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal
    
    Set-Location ".."
}

# Function to start frontend
function Start-Frontend {
    Write-Host "`n🎨 Starting Frontend Application..." -ForegroundColor Yellow
    
    Set-Location "frontend"
    
    # Check if node_modules exists
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Cyan
        npm install
    }
    
    # Start frontend server
    Write-Host "🚀 Starting frontend on port 3000..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Normal
    
    Set-Location ".."
}

# Function to start admin panel
function Start-AdminPanel {
    Write-Host "`n👨‍💼 Starting Admin Panel..." -ForegroundColor Yellow
    
    Set-Location "admin-panel"
    
    # Check if node_modules exists
    if (-not (Test-Path "node_modules")) {
        Write-Host "📦 Installing admin panel dependencies..." -ForegroundColor Cyan
        npm install
    }
    
    # Start admin panel
    Write-Host "🚀 Starting admin panel on port 3001..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Normal
    
    Set-Location ".."
}

# Start all services
Start-Backend
Start-Sleep -Seconds 3

Start-Frontend
Start-Sleep -Seconds 2

Start-AdminPanel

Write-Host "`n🎉 All services are starting up!" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Yellow
Write-Host "📱 Frontend:    http://localhost:3000" -ForegroundColor Cyan
Write-Host "👨‍💼 Admin Panel: http://localhost:3001" -ForegroundColor Cyan
Write-Host "🔧 Backend API: http://localhost:5000" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Yellow

Write-Host "`n⏳ Waiting 10 seconds for services to fully start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "`n🧪 Running data sync tests..." -ForegroundColor Magenta
node test-data-sync.js

Write-Host "`n✨ Development environment is ready!" -ForegroundColor Green
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")