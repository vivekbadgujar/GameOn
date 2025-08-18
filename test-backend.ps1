# Test Backend Connectivity
# Quick script to check if your backend is working

Write-Host "🔍 Testing Backend Connectivity" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green

$backendUrl = "https://gameon-backend.onrender.com"

# Test 1: Basic connectivity
Write-Host "`n1. Testing basic server response..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri $backendUrl -Method GET -TimeoutSec 15
    Write-Host "✅ Backend server is responding!" -ForegroundColor Green
    Write-Host "Message: $($response.message)" -ForegroundColor White
} catch {
    Write-Host "❌ Backend server is NOT responding!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Message -like "*timeout*") {
        Write-Host "💡 This might be a cold start - Render free tier sleeps after 15 minutes" -ForegroundColor Yellow
        Write-Host "💡 Try again in 30-60 seconds" -ForegroundColor Yellow
    }
}

# Test 2: Health endpoint
Write-Host "`n2. Testing health endpoint..." -ForegroundColor Cyan
try {
    $healthResponse = Invoke-RestMethod -Uri "$backendUrl/api/health" -Method GET -TimeoutSec 10
    Write-Host "✅ Health endpoint is working!" -ForegroundColor Green
    Write-Host "DB Status: $($healthResponse.dbStatus)" -ForegroundColor White
    Write-Host "Environment: $($healthResponse.environment)" -ForegroundColor White
} catch {
    Write-Host "❌ Health endpoint failed!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}

# Test 3: Admin auth endpoint
Write-Host "`n3. Testing admin auth endpoint..." -ForegroundColor Cyan
$loginData = @{
    email = "admin@gameon.com"
    password = "GameOn@2024!"
} | ConvertTo-Json

try {
    $headers = @{ "Content-Type" = "application/json" }
    $authResponse = Invoke-RestMethod -Uri "$backendUrl/api/admin/auth/login" -Method POST -Body $loginData -Headers $headers -TimeoutSec 15
    
    if ($authResponse.success) {
        Write-Host "✅ Admin auth endpoint is working!" -ForegroundColor Green
        Write-Host "Admin: $($authResponse.admin.name)" -ForegroundColor White
    } else {
        Write-Host "❌ Admin auth failed: $($authResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Admin auth endpoint failed!" -ForegroundColor Red
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Status Code: $statusCode" -ForegroundColor Red
    
    switch ($statusCode) {
        401 { Write-Host "💡 Admin user doesn't exist - run: node fix-admin-login.js" -ForegroundColor Yellow }
        404 { Write-Host "💡 Endpoint not found - check backend deployment" -ForegroundColor Yellow }
        500 { Write-Host "💡 Server error - check Render logs" -ForegroundColor Yellow }
        default { Write-Host "💡 Unknown error - check Render dashboard" -ForegroundColor Yellow }
    }
}

Write-Host "`n📋 Diagnosis Results:" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green

Write-Host "`n🔧 If backend is not responding:" -ForegroundColor Yellow
Write-Host "1. Check Render Dashboard: https://dashboard.render.com" -ForegroundColor White
Write-Host "2. Look for deployment errors in Render logs" -ForegroundColor White
Write-Host "3. Verify environment variables (MONGODB_URI, JWT_SECRET)" -ForegroundColor White
Write-Host "4. Try redeploying the backend service" -ForegroundColor White

Write-Host "`n🔧 If backend is responding but admin auth fails:" -ForegroundColor Yellow
Write-Host "1. Run: node fix-admin-login.js" -ForegroundColor White
Write-Host "2. Check MongoDB connection" -ForegroundColor White
Write-Host "3. Verify admin user exists in database" -ForegroundColor White

Write-Host "`n🔧 If everything works here but admin panel shows network error:" -ForegroundColor Yellow
Write-Host "1. Check Vercel environment variables" -ForegroundColor White
Write-Host "2. Ensure REACT_APP_API_URL = https://gameon-backend.onrender.com/api" -ForegroundColor White
Write-Host "3. Check browser console for CORS errors" -ForegroundColor White
Write-Host "4. Redeploy admin panel: cd admin-panel && vercel --prod" -ForegroundColor White

Write-Host "`n⏰ Note: Render free tier services sleep after 15 minutes of inactivity" -ForegroundColor Blue
Write-Host "First request after sleep can take 30-60 seconds to respond" -ForegroundColor Blue