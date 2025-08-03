@echo off
echo 🎮 Starting BGMI Tournament Platform...
echo.

echo 🚀 Starting Backend Server...
start "Backend Server" cmd /k "cd /d c:\Users\Vivek Badgujar\GameOn-Platform\backend && npm start"

timeout /t 3 /nobreak >nul

echo 🎨 Starting Admin Panel...
start "Admin Panel" cmd /k "cd /d c:\Users\Vivek Badgujar\GameOn-Platform\admin-panel && npm start"

timeout /t 3 /nobreak >nul

echo 🌐 Starting Frontend Website...
start "Frontend Website" cmd /k "cd /d c:\Users\Vivek Badgujar\GameOn-Platform\frontend && npm start"

echo.
echo ✅ All servers starting...
echo.
echo 📱 Access Points:
echo    Backend API: http://localhost:5000
echo    Admin Panel: http://localhost:3001
echo    Frontend: http://localhost:3000
echo.
echo 🎯 BGMI Features Ready:
echo    ✅ Room Layout with Squad Management
echo    ✅ Drag & Drop Player Arrangement
echo    ✅ Real-time Live Sync
echo    ✅ Payment Auto-confirmation
echo    ✅ Tournament Status Management
echo    ✅ Mobile-Responsive Design
echo.
echo Press any key to exit...
pause >nul