# Setup environment variables for GameOn Platform

# Backend environment variables
$backendEnv = @"
# Server Configuration
NODE_ENV=development
PORT=5000
BASE_URL=http://api.gameonesport.xyz

# Database
MONGODB_URI=mongodb+srv://gameon:Gameon321@cluster0.g2bfczw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# JWT Secret
JWT_SECRET=123456

# Security
CORS_ORIGIN=http://gameonesport.xyz
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
"@

# Frontend environment variables
# Note: We set BOTH legacy REACT_APP_* and Next.js-friendly NEXT_PUBLIC_* variables
# so that all parts of the codebase receive consistent values.
$frontendEnv = @"
# API Configuration
REACT_APP_API_BASE_URL=http://api.gameonesport.xyz/api
REACT_APP_WS_URL=ws://api.gameonesport.xyz

# App Configuration
REACT_APP_APP_NAME=GameOn
REACT_APP_APP_VERSION=1.0.0
REACT_APP_LOGO_URL=http://localhost:3000/logo.png

# Next.js public variables (preferred for new code)
NEXT_PUBLIC_API_BASE_URL=http://api.gameonesport.xyz/api
NEXT_PUBLIC_WS_URL=ws://api.gameonesport.xyz
NEXT_PUBLIC_APP_NAME=GameOn
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_LOGO_URL=http://localhost:3000/logo.png
"@

# Create backend .env file
Set-Content -Path "backend\.env" -Value $backendEnv -Force

# Create frontend .env file
Set-Content -Path "frontend\.env" -Value $frontendEnv -Force

Write-Host "Environment files created successfully!" -ForegroundColor Green
Write-Host "Backend .env file created at: backend\.env" -ForegroundColor Yellow
Write-Host "Frontend .env file created at: frontend\.env" -ForegroundColor Yellow 