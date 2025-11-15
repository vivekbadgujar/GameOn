#!/bin/bash

echo "Attempting to start backend on port 5000..."

# Kill any process using port 5000
echo "Killing processes on port 5000..."
lsof -ti:5000 | xargs kill -9 2>/dev/null || true

# Wait a moment
sleep 1

# Try to start the backend
cd /Users/naishailesh/GameOn/backend

# Keep trying until successful
for i in {1..5}; do
    echo "Attempt $i to start backend..."
    
    # Kill port 5000 processes again
    lsof -ti:5000 | xargs kill -9 2>/dev/null || true
    sleep 0.5
    
    # Try to start the server
    npm start &
    SERVER_PID=$!
    
    # Wait a bit to see if it starts successfully
    sleep 3
    
    # Check if the server is running
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        echo "✅ Backend started successfully on port 5000!"
        echo "Server PID: $SERVER_PID"
        wait $SERVER_PID
        exit 0
    else
        echo "❌ Failed to start backend on attempt $i"
        kill $SERVER_PID 2>/dev/null || true
    fi
done

echo "❌ Failed to start backend after 5 attempts"
exit 1