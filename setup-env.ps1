# Setup environment variables for GameOn Platform

# Backend environment variables
$backendEnv = @"
# Server Configuration
NODE_ENV=development
PORT=5000
BASE_URL=http://localhost:5000

# Database
MONGODB_URI=mongodb+srv://gameon:Gameon321@cluster0.g2bfczw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# JWT Secret
JWT_SECRET=123456

# Security
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
"@

# Frontend environment variables
$frontendEnv = @"
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:5000/api
REACT_APP_WS_URL=ws://localhost:5000

# App Configuration
REACT_APP_APP_NAME=GameOn
REACT_APP_APP_VERSION=1.0.0
REACT_APP_LOGO_URL=http://localhost:3000/logo.png
"@

# Create backend .env file
Set-Content -Path "backend\.env" -Value $backendEnv -Force

# Create frontend .env file
Set-Content -Path "frontend\.env" -Value $frontendEnv -Force

Write-Host "Environment files created successfully!" -ForegroundColor Green
Write-Host "Backend .env file created at: backend\.env" -ForegroundColor Yellow
Write-Host "Frontend .env file created at: frontend\.env" -ForegroundColor Yellow 