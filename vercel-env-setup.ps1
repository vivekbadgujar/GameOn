# GameOn Platform - Vercel Environment Variables Setup
# This script helps configure environment variables for Vercel deployment

Write-Host "🔧 GameOn Platform - Vercel Environment Setup" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Environment Variables Configuration" -ForegroundColor Yellow
Write-Host ""

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

# Collect configuration
Write-Host "🌐 Domain Configuration:" -ForegroundColor Cyan
$frontendDomain = Get-InputWithDefault "Frontend Domain" "https://gameonesport.xyz"
$adminDomain = Get-InputWithDefault "Admin Domain" "https://admin.gameonesport.xyz"
$apiDomain = Get-InputWithDefault "API Domain" "https://api.gameonesport.xyz"

Write-Host ""
Write-Host "💳 Cashfree Configuration:" -ForegroundColor Cyan
$cashfreeAppId = Get-InputWithDefault "Cashfree App ID" "your_production_cashfree_app_id_here"

Write-Host ""
Write-Host "📝 Generating Vercel environment configurations..." -ForegroundColor Yellow

# Frontend Environment Variables for Vercel
$frontendEnvContent = @"
# Frontend Environment Variables for Vercel
# Add these in your Vercel project settings under Environment Variables

REACT_APP_API_BASE_URL=$apiDomain/api
REACT_APP_WS_URL=$($apiDomain -replace 'https://', 'wss://')
REACT_APP_CASHFREE_APP_ID=$cashfreeAppId
REACT_APP_CASHFREE_ENVIRONMENT=production
REACT_APP_FRONTEND_URL=$frontendDomain
REACT_APP_ADMIN_URL=$adminDomain
REACT_APP_APP_NAME=GameOn
REACT_APP_APP_VERSION=1.0.0
REACT_APP_LOGO_URL=$frontendDomain/logo.png
"@

# Admin Panel Environment Variables for Vercel
$adminEnvContent = @"
# Admin Panel Environment Variables for Vercel
# Add these in your Vercel project settings under Environment Variables

REACT_APP_API_URL=$apiDomain/api
REACT_APP_API_BASE_URL=$apiDomain
REACT_APP_FRONTEND_URL=$frontendDomain
REACT_APP_ADMIN_URL=$adminDomain
REACT_APP_APP_NAME=GameOn Admin
REACT_APP_APP_VERSION=1.0.0
"@

# Vercel CLI Commands
$vercelCommands = @"
# Vercel CLI Commands to Set Environment Variables

# Frontend Environment Variables
vercel env add REACT_APP_API_BASE_URL production
# Enter: $apiDomain/api

vercel env add REACT_APP_WS_URL production
# Enter: $($apiDomain -replace 'https://', 'wss://')

vercel env add REACT_APP_CASHFREE_APP_ID production
# Enter: $cashfreeAppId

vercel env add REACT_APP_CASHFREE_ENVIRONMENT production
# Enter: production

vercel env add REACT_APP_FRONTEND_URL production
# Enter: $frontendDomain

vercel env add REACT_APP_ADMIN_URL production
# Enter: $adminDomain

# Admin Panel Environment Variables (run in admin-panel directory)
vercel env add REACT_APP_API_URL production
# Enter: $apiDomain/api

vercel env add REACT_APP_API_BASE_URL production
# Enter: $apiDomain

vercel env add REACT_APP_FRONTEND_URL production
# Enter: $frontendDomain

vercel env add REACT_APP_ADMIN_URL production
# Enter: $adminDomain
"@

# Write configuration files
try {
    $frontendEnvContent | Out-File -FilePath "frontend-vercel-env.txt" -Encoding UTF8
    Write-Host "✅ Created frontend-vercel-env.txt" -ForegroundColor Green
    
    $adminEnvContent | Out-File -FilePath "admin-vercel-env.txt" -Encoding UTF8
    Write-Host "✅ Created admin-vercel-env.txt" -ForegroundColor Green
    
    $vercelCommands | Out-File -FilePath "vercel-cli-commands.txt" -Encoding UTF8
    Write-Host "✅ Created vercel-cli-commands.txt" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error creating configuration files: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Vercel Environment Configuration Completed!" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Generated Files:" -ForegroundColor Cyan
Write-Host "• frontend-vercel-env.txt - Frontend environment variables" -ForegroundColor White
Write-Host "• admin-vercel-env.txt - Admin panel environment variables" -ForegroundColor White
Write-Host "• vercel-cli-commands.txt - CLI commands to set variables" -ForegroundColor White
Write-Host ""
Write-Host "🔧 How to Use:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1 - Vercel Dashboard:" -ForegroundColor Cyan
Write-Host "1. Go to https://vercel.com/dashboard" -ForegroundColor White
Write-Host "2. Select your project" -ForegroundColor White
Write-Host "3. Go to Settings → Environment Variables" -ForegroundColor White
Write-Host "4. Add variables from the generated .txt files" -ForegroundColor White
Write-Host ""
Write-Host "Option 2 - Vercel CLI:" -ForegroundColor Cyan
Write-Host "1. Run commands from vercel-cli-commands.txt" -ForegroundColor White
Write-Host "2. Enter the values when prompted" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Set environment variables in Vercel" -ForegroundColor White
Write-Host "2. Run ./deploy-vercel.ps1 to deploy" -ForegroundColor White
Write-Host "3. Configure custom domains" -ForegroundColor White
Write-Host "4. Set up DNS records" -ForegroundColor White