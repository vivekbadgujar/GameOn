# GameOn Platform - Production Environment Setup Script
# This script helps you configure production environment variables

Write-Host "🔧 GameOn Platform - Production Environment Setup" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Function to prompt for input with default value
function Get-InputWithDefault {
    param(
        [string]$Prompt,
        [string]$Default = ""
    )
    
    if ($Default) {
        $input = Read-Host "$Prompt [$Default]"
        if ([string]::IsNullOrWhiteSpace($input)) {
            return $Default
        }
        return $input
    } else {
        return Read-Host $Prompt
    }
}

# Function to generate secure random string
function New-SecureString {
    param([int]$Length = 32)
    
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    $random = 1..$Length | ForEach-Object { Get-Random -Maximum $chars.length }
    return -join ($chars[$random])
}

Write-Host ""
Write-Host "📋 Collecting production configuration..." -ForegroundColor Yellow
Write-Host ""

# MongoDB Configuration
Write-Host "🍃 MongoDB Atlas Configuration:" -ForegroundColor Cyan
$mongoUri = Get-InputWithDefault "MongoDB Atlas URI" "mongodb+srv://vivekbadgujar:Vivek321@cluster0.squjxrk.mongodb.net/gameon?retryWrites=true&w=majority&appName=Cluster0"

# JWT Secrets
Write-Host ""
Write-Host "🔐 JWT Configuration:" -ForegroundColor Cyan
$jwtSecret = Get-InputWithDefault "JWT Secret (leave blank to generate)" ""
if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
    $jwtSecret = New-SecureString -Length 64
    Write-Host "Generated JWT Secret: $jwtSecret" -ForegroundColor Green
}

$jwtRefreshSecret = Get-InputWithDefault "JWT Refresh Secret (leave blank to generate)" ""
if ([string]::IsNullOrWhiteSpace($jwtRefreshSecret)) {
    $jwtRefreshSecret = New-SecureString -Length 64
    Write-Host "Generated JWT Refresh Secret: $jwtRefreshSecret" -ForegroundColor Green
}

# Cashfree Configuration
Write-Host ""
Write-Host "💳 Cashfree Configuration:" -ForegroundColor Cyan
$cashfreeAppId = Get-InputWithDefault "Cashfree App ID" "your_production_cashfree_app_id_here"
$cashfreeSecretKey = Get-InputWithDefault "Cashfree Secret Key" "your_production_cashfree_secret_key_here"

# Domain Configuration
Write-Host ""
Write-Host "🌐 Domain Configuration:" -ForegroundColor Cyan
$frontendDomain = Get-InputWithDefault "Frontend Domain" "https://gameonesport.xyz"
$adminDomain = Get-InputWithDefault "Admin Domain" "https://admin.gameonesport.xyz"
$apiDomain = Get-InputWithDefault "API Domain" "https://api.gameonesport.xyz"

Write-Host ""
Write-Host "📝 Generating environment files..." -ForegroundColor Yellow

# Backend .env
$backendEnv = @"
# MongoDB Atlas Configuration
MONGODB_URI=$mongoUri

# Server Configuration
NODE_ENV=production
PORT=5000

# Security - JWT Secrets
JWT_SECRET=$jwtSecret
JWT_REFRESH_SECRET=$jwtRefreshSecret

# CORS Origins (for production)
CORS_ORIGIN=$frontendDomain,$adminDomain

# Cashfree Payment Gateway Configuration
CASHFREE_APP_ID=$cashfreeAppId
CASHFREE_SECRET_KEY=$cashfreeSecretKey
CASHFREE_ENVIRONMENT=production
"@

# Frontend .env.production
# Note: we set BOTH REACT_APP_* and NEXT_PUBLIC_* so that
# legacy React-style code and Next.js code stay in sync.
$frontendEnv = @"
# API Configuration (Production)
REACT_APP_API_BASE_URL=$apiDomain/api
REACT_APP_WS_URL=$($apiDomain -replace 'https://', 'wss://')

# App Configuration
REACT_APP_APP_NAME=GameOn
REACT_APP_APP_VERSION=1.0.0
REACT_APP_LOGO_URL=$frontendDomain/logo.png

# Cashfree Configuration (Production)
REACT_APP_CASHFREE_APP_ID=$cashfreeAppId
REACT_APP_CASHFREE_ENVIRONMENT=production

# Frontend URL
REACT_APP_FRONTEND_URL=$frontendDomain
REACT_APP_ADMIN_URL=$adminDomain

# Next.js public equivalents
NEXT_PUBLIC_API_BASE_URL=$apiDomain/api
NEXT_PUBLIC_WS_URL=$($apiDomain -replace 'https://', 'wss://')
NEXT_PUBLIC_APP_NAME=GameOn
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_LOGO_URL=$frontendDomain/logo.png
NEXT_PUBLIC_FRONTEND_URL=$frontendDomain
NEXT_PUBLIC_ADMIN_URL=$adminDomain
"@

# Admin Panel .env.production
# Admin panel also receives BOTH REACT_APP_* and NEXT_PUBLIC_* variants
# so that Next.js client code can safely read NEXT_PUBLIC_*.
$adminEnv = @"
# API Configuration (Production)
REACT_APP_API_URL=$apiDomain/api
REACT_APP_API_BASE_URL=$apiDomain

# App Configuration
REACT_APP_APP_NAME=GameOn Admin
REACT_APP_APP_VERSION=1.0.0

# URLs
REACT_APP_FRONTEND_URL=$frontendDomain
REACT_APP_ADMIN_URL=$adminDomain

# Next.js public equivalents
NEXT_PUBLIC_API_URL=$apiDomain/api
NEXT_PUBLIC_API_BASE_URL=$apiDomain
NEXT_PUBLIC_FRONTEND_URL=$frontendDomain
NEXT_PUBLIC_ADMIN_URL=$adminDomain
NEXT_PUBLIC_APP_NAME=GameOn Admin
NEXT_PUBLIC_APP_VERSION=1.0.0
"@

# Write environment files
try {
    $backendEnv | Out-File -FilePath "backend\.env" -Encoding UTF8
    Write-Host "✅ Created backend/.env" -ForegroundColor Green
    
    $frontendEnv | Out-File -FilePath "frontend\.env.production" -Encoding UTF8
    Write-Host "✅ Created frontend/.env.production" -ForegroundColor Green
    
    $adminEnv | Out-File -FilePath "admin-panel\.env.production" -Encoding UTF8
    Write-Host "✅ Created admin-panel/.env.production" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error creating environment files: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Environment configuration completed!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "• Backend environment: backend/.env" -ForegroundColor White
Write-Host "• Frontend environment: frontend/.env.production" -ForegroundColor White
Write-Host "• Admin environment: admin-panel/.env.production" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Important Notes:" -ForegroundColor Yellow
Write-Host "• Keep your JWT secrets secure and never commit them to version control" -ForegroundColor White
Write-Host "• Update Cashfree credentials with actual production values" -ForegroundColor White
Write-Host "• Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0 for Render" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next: Run deploy-production.ps1 to deploy your application" -ForegroundColor Cyan