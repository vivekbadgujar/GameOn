# Fix CORS and Deploy Backend
# This script will commit the CORS fix and help you deploy

Write-Host "🔧 Fixing CORS and Deploying Backend" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

Write-Host "`n1. CORS Configuration Updated!" -ForegroundColor Cyan
Write-Host "✅ Added https://game-on-topaz.vercel.app to allowed origins" -ForegroundColor Green
Write-Host "✅ Updated both Express CORS and Socket.IO CORS" -ForegroundColor Green

Write-Host "`n2. Committing Changes..." -ForegroundColor Cyan
try {
    git add backend/server.js
    git commit -m "fix: Add admin panel domain to CORS allowed origins"
    Write-Host "✅ Changes committed successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Git commit failed - you may need to commit manually" -ForegroundColor Yellow
}

Write-Host "`n3. Deployment Options:" -ForegroundColor Cyan
Write-Host "Choose how to deploy your backend:" -ForegroundColor White

Write-Host "`nOption A - Automatic (if connected to Git):" -ForegroundColor Yellow
Write-Host "git push origin main" -ForegroundColor Gray
Write-Host "# Render will automatically deploy" -ForegroundColor Gray

Write-Host "`nOption B - Manual Deploy:" -ForegroundColor Yellow
Write-Host "1. Go to https://dashboard.render.com" -ForegroundColor Gray
Write-Host "2. Select your backend service" -ForegroundColor Gray
Write-Host "3. Click 'Manual Deploy' → 'Deploy latest commit'" -ForegroundColor Gray

Write-Host "`n4. After Deployment:" -ForegroundColor Cyan
Write-Host "Test your admin panel login at:" -ForegroundColor White
Write-Host "https://game-on-topaz.vercel.app" -ForegroundColor Blue

Write-Host "`n5. Verification Commands:" -ForegroundColor Cyan
Write-Host "# Test CORS preflight" -ForegroundColor Gray
Write-Host "curl -X OPTIONS https://gameon-backend.onrender.com/api/admin/auth/login \\" -ForegroundColor Gray
Write-Host "  -H 'Origin: https://game-on-topaz.vercel.app' \\" -ForegroundColor Gray
Write-Host "  -H 'Access-Control-Request-Method: POST'" -ForegroundColor Gray

Write-Host "`n# Test admin login" -ForegroundColor Gray
Write-Host "curl -X POST https://gameon-backend.onrender.com/api/admin/auth/login \\" -ForegroundColor Gray
Write-Host "  -H 'Content-Type: application/json' \\" -ForegroundColor Gray
Write-Host "  -H 'Origin: https://game-on-topaz.vercel.app' \\" -ForegroundColor Gray
Write-Host "  -d '{`"email`":`"admin@gameon.com`",`"password`":`"GameOn@2024!`"}'" -ForegroundColor Gray

Write-Host "`n📋 Next Steps:" -ForegroundColor Green
Write-Host "1. Push changes to Git (if using automatic deployment)" -ForegroundColor White
Write-Host "2. Or manually deploy on Render dashboard" -ForegroundColor White
Write-Host "3. Wait 2-3 minutes for deployment to complete" -ForegroundColor White
Write-Host "4. Test admin panel login" -ForegroundColor White
Write-Host "5. If still not working, check Render logs" -ForegroundColor White

Write-Host "`n🎯 Expected Result:" -ForegroundColor Green
Write-Host "Your admin panel at https://game-on-topaz.vercel.app should now be able to login!" -ForegroundColor White