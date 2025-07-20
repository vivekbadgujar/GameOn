Write-Host "🚀 Starting GameOn Platform..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "📱 Starting Backend Server..." -ForegroundColor Cyan
Set-Location "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "node server.js" -WindowStyle Normal

Write-Host ""
Write-Host "🎮 Starting Frontend Server..." -ForegroundColor Cyan
Set-Location "../frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Both servers are starting..." -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "🔧 Backend: http://localhost:5000" -ForegroundColor Yellow
Write-Host "🏥 Health Check: http://localhost:5000/api/health" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Enter to close this window..." -ForegroundColor Gray
Read-Host 