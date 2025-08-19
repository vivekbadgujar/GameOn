# GameOn Platform - Vercel Free Plan Environment Setup
# Configures environment variables for free plan deployment

Write-Host "🔧 GameOn Platform - Vercel Free Plan Environment Setup" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Environment Variables Configuration for Free Plan" -ForegroundColor Yellow
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
$apiDomain = Get-InputWithDefault "API Domain (Render)" "https://api.gameonesport.xyz"

Write-Host ""
Write-Host "💳 Cashfree Configuration:" -ForegroundColor Cyan
$cashfreeAppId = Get-InputWithDefault "Cashfree App ID" "your_production_cashfree_app_id_here"

Write-Host ""
Write-Host "📝 Generating Vercel Free Plan environment configurations..." -ForegroundColor Yellow

# Frontend Environment Variables for Vercel (Free Plan)
$frontendEnvContent = @"
# Frontend Environment Variables for Vercel Free Plan
# Add these in your Vercel project settings under Environment Variables
# Note: Use NEXT_PUBLIC_ prefix for client-side variables in static export

NEXT_PUBLIC_API_BASE_URL=$apiDomain/api
NEXT_PUBLIC_WS_URL=$($apiDomain -replace 'https://', 'wss://')
NEXT_PUBLIC_CASHFREE_APP_ID=$cashfreeAppId
NEXT_PUBLIC_CASHFREE_ENVIRONMENT=production
NEXT_PUBLIC_FRONTEND_URL=$frontendDomain
NEXT_PUBLIC_ADMIN_URL=$adminDomain
NEXT_PUBLIC_APP_NAME=GameOn
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_LOGO_URL=$frontendDomain/logo.png

# Legacy React App variables (for compatibility)
REACT_APP_API_BASE_URL=$apiDomain/api
REACT_APP_WS_URL=$($apiDomain -replace 'https://', 'wss://')
REACT_APP_CASHFREE_APP_ID=$cashfreeAppId
REACT_APP_CASHFREE_ENVIRONMENT=production
REACT_APP_FRONTEND_URL=$frontendDomain
REACT_APP_ADMIN_URL=$adminDomain
"@

# Admin Panel Environment Variables for Vercel (Free Plan)
$adminEnvContent = @"
# Admin Panel Environment Variables for Vercel Free Plan
# Add these in your Vercel project settings under Environment Variables
# Note: Use NEXT_PUBLIC_ prefix for client-side variables in static export

NEXT_PUBLIC_API_URL=$apiDomain/api
NEXT_PUBLIC_API_BASE_URL=$apiDomain
NEXT_PUBLIC_FRONTEND_URL=$frontendDomain
NEXT_PUBLIC_ADMIN_URL=$adminDomain
NEXT_PUBLIC_APP_NAME=GameOn Admin
NEXT_PUBLIC_APP_VERSION=1.0.0

# Legacy React App variables (for compatibility)
REACT_APP_API_URL=$apiDomain/api
REACT_APP_API_BASE_URL=$apiDomain
REACT_APP_FRONTEND_URL=$frontendDomain
REACT_APP_ADMIN_URL=$adminDomain
"@

# Vercel CLI Commands for Free Plan
$vercelCommands = @"
# Vercel CLI Commands to Set Environment Variables (Free Plan)

# Frontend Environment Variables (run in frontend directory)
cd frontend

vercel env add NEXT_PUBLIC_API_BASE_URL production
# Enter: $apiDomain/api

vercel env add NEXT_PUBLIC_WS_URL production
# Enter: $($apiDomain -replace 'https://', 'wss://')

vercel env add NEXT_PUBLIC_CASHFREE_APP_ID production
# Enter: $cashfreeAppId

vercel env add NEXT_PUBLIC_CASHFREE_ENVIRONMENT production
# Enter: production

vercel env add NEXT_PUBLIC_FRONTEND_URL production
# Enter: $frontendDomain

vercel env add NEXT_PUBLIC_ADMIN_URL production
# Enter: $adminDomain

# Admin Panel Environment Variables (run in admin-panel directory)
cd ../admin-panel

vercel env add NEXT_PUBLIC_API_URL production
# Enter: $apiDomain/api

vercel env add NEXT_PUBLIC_API_BASE_URL production
# Enter: $apiDomain

vercel env add NEXT_PUBLIC_FRONTEND_URL production
# Enter: $frontendDomain

vercel env add NEXT_PUBLIC_ADMIN_URL production
# Enter: $adminDomain
"@

# Free Plan Configuration Notes
$freePlanNotes = @"
# Vercel Free Plan Configuration Notes

## Free Plan Limits:
- 100GB bandwidth per month
- 1000 serverless function invocations per month (not used in this setup)
- 100 deployments per day
- Custom domains included
- SSL certificates included
- Global CDN included

## Optimizations Applied:
- Static export enabled (output: 'export')
- No serverless functions used
- Direct API calls to Render backend
- Single region deployment (iad1)
- No edge functions or middleware
- Client-side only environment variables

## Architecture:
Frontend (Vercel Static) → Render Backend API
Admin Panel (Vercel Static) → Render Backend API

## Benefits:
- No serverless function costs
- No region restrictions
- Fast global CDN delivery
- Automatic SSL certificates
- Custom domain support
- No cold start delays
"@

# Write configuration files
try {
    $frontendEnvContent | Out-File -FilePath "frontend-vercel-free-env.txt" -Encoding UTF8
    Write-Host "✅ Created frontend-vercel-free-env.txt" -ForegroundColor Green
    
    $adminEnvContent | Out-File -FilePath "admin-vercel-free-env.txt" -Encoding UTF8
    Write-Host "✅ Created admin-vercel-free-env.txt" -ForegroundColor Green
    
    $vercelCommands | Out-File -FilePath "vercel-free-cli-commands.txt" -Encoding UTF8
    Write-Host "✅ Created vercel-free-cli-commands.txt" -ForegroundColor Green
    
    $freePlanNotes | Out-File -FilePath "vercel-free-plan-notes.txt" -Encoding UTF8
    Write-Host "✅ Created vercel-free-plan-notes.txt" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error creating configuration files: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Vercel Free Plan Environment Configuration Completed!" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Generated Files:" -ForegroundColor Cyan
Write-Host "• frontend-vercel-free-env.txt - Frontend environment variables" -ForegroundColor White
Write-Host "• admin-vercel-free-env.txt - Admin panel environment variables" -ForegroundColor White
Write-Host "• vercel-free-cli-commands.txt - CLI commands to set variables" -ForegroundColor White
Write-Host "• vercel-free-plan-notes.txt - Free plan configuration notes" -ForegroundColor White
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
Write-Host "1. Run commands from vercel-free-cli-commands.txt" -ForegroundColor White
Write-Host "2. Enter the values when prompted" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Set environment variables in Vercel" -ForegroundColor White
Write-Host "2. Run ./deploy-vercel-free.ps1 to deploy" -ForegroundColor White
Write-Host "3. Configure custom domains" -ForegroundColor White
Write-Host "4. Set up DNS records" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Important Notes:" -ForegroundColor Yellow
Write-Host "• Use NEXT_PUBLIC_ prefix for client-side variables" -ForegroundColor White
Write-Host "• Static export means no server-side rendering" -ForegroundColor White
Write-Host "• All API calls go directly to Render backend" -ForegroundColor White
Write-Host "• No serverless functions = no function costs" -ForegroundColor White