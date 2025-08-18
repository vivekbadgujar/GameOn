# Quick Fix for Admin Login Issues
# Run this script to diagnose and fix common admin login problems

Write-Host "🔧 Quick Fix for Admin Login Issues" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

# Step 1: Test backend connectivity
Write-Host "`n1. Testing backend connectivity..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "https://gameon-backend.onrender.com" -Method GET -TimeoutSec 10
    Write-Host "✅ Backend is accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend is not accessible: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Check if your backend is deployed and running on Render" -ForegroundColor Yellow
    exit 1
}

# Step 2: Test admin login API
Write-Host "`n2. Testing admin login API..." -ForegroundColor Cyan
$loginData = @{
    email = "admin@gameon.com"
    password = "GameOn@2024!"
} | ConvertTo-Json

try {
    $headers = @{
        "Content-Type" = "application/json"
    }
    $loginResponse = Invoke-RestMethod -Uri "https://gameon-backend.onrender.com/api/admin/auth/login" -Method POST -Body $loginData -Headers $headers -TimeoutSec 15
    
    if ($loginResponse.success) {
        Write-Host "✅ Admin login API is working!" -ForegroundColor Green
        Write-Host "Admin: $($loginResponse.admin.name) ($($loginResponse.admin.email))" -ForegroundColor Green
    } else {
        Write-Host "❌ Login failed: $($loginResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Admin login API failed: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "💡 This means admin user doesn't exist or password is wrong" -ForegroundColor Yellow
        Write-Host "💡 Run: node fix-admin-login.js" -ForegroundColor Yellow
    } elseif ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "💡 Admin auth route not found. Check backend deployment." -ForegroundColor Yellow
    } else {
        Write-Host "💡 Server error. Check backend logs on Render." -ForegroundColor Yellow
    }
}

# Step 3: Check if admin user creation script exists
Write-Host "`n3. Checking admin user creation..." -ForegroundColor Cyan
if (Test-Path "fix-admin-login.js") {
    Write-Host "✅ Admin fix script found" -ForegroundColor Green
    Write-Host "💡 Run: node fix-admin-login.js" -ForegroundColor Yellow
} else {
    Write-Host "❌ Admin fix script not found" -ForegroundColor Red
}

# Step 4: Check Vercel environment variables
Write-Host "`n4. Checking Vercel deployment..." -ForegroundColor Cyan
if (Get-Command vercel -ErrorAction SilentlyContinue) {
    Write-Host "✅ Vercel CLI is installed" -ForegroundColor Green
    
    # Check if we're in admin-panel directory
    if (Test-Path "admin-panel") {
        Set-Location "admin-panel"
        Write-Host "📁 Switched to admin-panel directory" -ForegroundColor Blue
    }
    
    try {
        $envVars = vercel env ls 2>$null
        Write-Host "💡 Check your Vercel environment variables:" -ForegroundColor Yellow
        Write-Host "   - REACT_APP_API_URL should be: https://gameon-backend.onrender.com/api" -ForegroundColor Yellow
    } catch {
        Write-Host "💡 Run 'vercel env ls' to check environment variables" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Vercel CLI not installed" -ForegroundColor Red
    Write-Host "💡 Install with: npm install -g vercel" -ForegroundColor Yellow
}

# Step 5: Provide next steps
Write-Host "`n📋 Next Steps:" -ForegroundColor Green
Write-Host "1. If admin login API failed, run: node fix-admin-login.js" -ForegroundColor White
Write-Host "2. Check Vercel environment variables:" -ForegroundColor White
Write-Host "   vercel env ls" -ForegroundColor Gray
Write-Host "3. Ensure REACT_APP_API_URL = https://gameon-backend.onrender.com/api" -ForegroundColor White
Write-Host "4. Redeploy admin panel:" -ForegroundColor White
Write-Host "   cd admin-panel && vercel --prod" -ForegroundColor Gray
Write-Host "5. Check browser console for detailed errors" -ForegroundColor White

Write-Host "`n🔑 Default Admin Credentials:" -ForegroundColor Green
Write-Host "Email: admin@gameon.com" -ForegroundColor White
Write-Host "Password: GameOn@2024!" -ForegroundColor White

Write-Host "`n📖 For detailed troubleshooting, see: ADMIN_LOGIN_TROUBLESHOOTING.md" -ForegroundColor Blue