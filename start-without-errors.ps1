# GameOn Platform - Error-Free Startup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GameOn Platform - Error-Free Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$rootPath = $PSScriptRoot

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Function to install dependencies safely
function Install-Dependencies($path, $name) {
    Write-Host "`n[$name] Installing dependencies..." -ForegroundColor Yellow
    Set-Location $path
    
    try {
        if ($name -eq "Backend") {
            npm install --ignore-scripts --silent
        } else {
            npm install --silent
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ $name dependencies installed successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "✗ Failed to install $name dependencies" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "✗ Error installing $name dependencies: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Check Node.js
Write-Host "`n[1/4] Checking Node.js installation..." -ForegroundColor Yellow
if (-not (Test-Command "node")) {
    Write-Host "✗ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

$nodeVersion = node --version
Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green

# Install dependencies
$backendSuccess = Install-Dependencies "$rootPath\backend" "Backend"
$frontendSuccess = Install-Dependencies "$rootPath\frontend" "Frontend"  
$adminSuccess = Install-Dependencies "$rootPath\admin-panel" "Admin Panel"

if (-not ($backendSuccess -and $frontendSuccess -and $adminSuccess)) {
    Write-Host "`n✗ Some dependencies failed to install. Please check the errors above." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "All dependencies installed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nStarting services..." -ForegroundColor Yellow

# Start Backend
Write-Host "`nStarting Backend Server..." -ForegroundColor Yellow
Set-Location "$rootPath\backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'GameOn Backend Server' -ForegroundColor Green; npm start"

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend..." -ForegroundColor Yellow
Set-Location "$rootPath\frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'GameOn Frontend' -ForegroundColor Blue; npm start"

Start-Sleep -Seconds 2

# Start Admin Panel
Write-Host "Starting Admin Panel..." -ForegroundColor Yellow
Set-Location "$rootPath\admin-panel"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host 'GameOn Admin Panel' -ForegroundColor Magenta; npm start"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "All services started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nService URLs:" -ForegroundColor White
Write-Host "Backend:     http://localhost:5000" -ForegroundColor Yellow
Write-Host "Frontend:    http://localhost:3000" -ForegroundColor Blue
Write-Host "Admin Panel: http://localhost:3001" -ForegroundColor Magenta

Write-Host "`nNote: If MongoDB is not running locally, some features may not work." -ForegroundColor Yellow
Write-Host "The application will still start and run without database connection." -ForegroundColor Yellow

Write-Host "`nPress any key to exit this window..." -ForegroundColor Gray
Read-Host