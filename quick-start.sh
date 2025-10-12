#!/bin/bash

echo "🚀 Starting GameOn Platform..."

# Function to start backend
start_backend() {
    echo "Starting backend on port 5000..."
    cd /Users/naishailesh/GameOn/backend
    npm start &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
}

# Function to start admin panel
start_admin() {
    echo "Starting admin panel on port 3001..."
    cd /Users/naishailesh/GameOn/admin-panel
    DANGEROUSLY_DISABLE_HOST_CHECK=true npm start &
    ADMIN_PID=$!
    echo "Admin Panel PID: $ADMIN_PID"
}

# Kill any existing processes
echo "Cleaning up existing processes..."
pkill -f "node server.js" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true

# Kill processes on port 5000 (this might not work for system processes)
lsof -ti:5000 | xargs kill -9 2>/dev/null || true

echo "Waiting 2 seconds..."
sleep 2

# Start backend
start_backend

# Wait a bit for backend to start
sleep 3

# Start admin panel
start_admin

echo ""
echo "🎮 GameOn Platform Starting..."
echo "📊 Admin Panel: http://localhost:3001"
echo "🔧 Backend API: http://localhost:5000"
echo ""
echo "If backend fails to start on port 5000, please:"
echo "1. Open System Preferences > Sharing"
echo "2. Disable 'AirPlay Receiver'"
echo "3. Run this script again"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
wait