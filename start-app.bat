@echo off
echo 🚀 Starting GameOn Platform...
echo.

echo 📱 Starting Backend Server...
cd backend
start "GameOn Backend" cmd /k "node server.js"

echo.
echo 🎮 Starting Frontend Server...
cd ../frontend
start "GameOn Frontend" cmd /k "npm start"

echo.
echo ✅ Both servers are starting...
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:5000
echo.
echo Press any key to close this window...
pause > nul 