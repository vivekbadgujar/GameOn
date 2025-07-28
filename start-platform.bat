@echo off
echo ========================================
echo    GameOn Platform Startup Script
echo ========================================
echo.

echo Starting MongoDB...
start "MongoDB" cmd /k "mongod --dbpath ./data/db"
timeout /t 3

echo Starting Backend Server...
cd backend
start "Backend" cmd /k "npm run dev"
cd ..
timeout /t 3

echo Starting Frontend...
cd frontend
start "Frontend" cmd /k "npm start"
cd ..
timeout /t 3

echo Starting Admin Panel...
cd admin-panel
start "Admin Panel" cmd /k "npm start"
cd ..

echo.
echo ========================================
echo All services are starting up...
echo ========================================
echo Backend API: http://localhost:5000
echo Frontend: http://localhost:3000
echo Admin Panel: http://localhost:3001
echo MongoDB: mongodb://localhost:27017/gameon
echo ========================================
echo.
echo Press any key to exit...
pause >nul
