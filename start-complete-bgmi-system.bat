@echo off
echo 🎮 Starting Complete BGMI Tournament Management System...
echo.

echo 🚀 Starting Backend Server...
start "Backend Server" cmd /k "cd /d c:\Users\Vivek Badgujar\GameOn-Platform\backend && npm start"

timeout /t 5 /nobreak >nul

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
echo    ✅ Complete Tournament Status Management
echo    ✅ Modern Participation Table with Team Layout
echo    ✅ Real-time Live Sync Across All Platforms
echo    ✅ BGMI-Style Waiting Room with Drag & Drop
echo    ✅ Automated Payment Integration
echo    ✅ Room Credentials Management
echo    ✅ Slot Locking System
echo    ✅ Squad Management
echo    ✅ Mobile-Responsive Design
echo.
echo 🔧 Admin Panel Features:
echo    🏆 Tournament Status: Complete/Reactivate/Delete
echo    📊 Modern Participation Table
echo    👥 Player Management: Edit/Kick/Confirm
echo    🔄 Slot Management with Drag & Drop
echo    📦 Bulk Operations
echo    🎮 Room Credentials Setup
echo    ⚡ Real-time Updates
echo.
echo 🌐 Frontend Features:
echo    💳 Payment Gateway Integration
echo    🎯 BGMI Waiting Room
echo    🔄 Slot Position Changes
echo    🔒 Automatic Slot Locking
echo    🎮 Room Credentials Display
echo    📱 Mobile-Responsive Design
echo.
echo 🎮 Login Credentials:
echo    Admin: admin@gameon.com / admin123
echo    Test User: user@example.com / password123
echo.
echo Press any key to exit...
pause >nul