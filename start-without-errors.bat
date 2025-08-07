@echo off
echo ========================================
echo GameOn Platform - Error-Free Startup
echo ========================================

echo.
echo [1/4] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo ✓ Node.js is installed

echo.
echo [2/4] Installing/Updating Backend Dependencies...
cd /d "%~dp0backend"
call npm install --ignore-scripts --silent
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✓ Backend dependencies ready

echo.
echo [3/4] Installing/Updating Frontend Dependencies...
cd /d "%~dp0frontend"
call npm install --silent
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✓ Frontend dependencies ready

echo.
echo [4/4] Installing/Updating Admin Panel Dependencies...
cd /d "%~dp0admin-panel"
call npm install --silent
if %errorlevel% neq 0 (
    echo ERROR: Failed to install admin panel dependencies
    pause
    exit /b 1
)
echo ✓ Admin panel dependencies ready

echo.
echo ========================================
echo All dependencies installed successfully!
echo ========================================
echo.
echo Starting services...
echo.

echo Starting Backend Server...
cd /d "%~dp0backend"
start "GameOn Backend" cmd /k "echo GameOn Backend Server && npm start"

timeout /t 3 /nobreak >nul

echo Starting Frontend...
cd /d "%~dp0frontend"
start "GameOn Frontend" cmd /k "echo GameOn Frontend && npm start"

timeout /t 2 /nobreak >nul

echo Starting Admin Panel...
cd /d "%~dp0admin-panel"
start "GameOn Admin Panel" cmd /k "echo GameOn Admin Panel && npm start"

echo.
echo ========================================
echo All services started!
echo ========================================
echo.
echo Backend:     http://localhost:5000
echo Frontend:    http://localhost:3000
echo Admin Panel: http://localhost:3001
echo.
echo Press any key to exit this window...
pause >nul