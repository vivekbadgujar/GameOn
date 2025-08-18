# Simple Environment Variables Setup for Android Development

Write-Host "Setting up environment variables for Android development..." -ForegroundColor Green

# Define paths
$JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"

# Set environment variables for current session
$env:JAVA_HOME = $JAVA_HOME
$env:ANDROID_HOME = $ANDROID_HOME
$env:ANDROID_SDK_ROOT = $ANDROID_HOME
$env:PATH = "$JAVA_HOME\bin;$ANDROID_HOME\tools;$ANDROID_HOME\tools\bin;$ANDROID_HOME\platform-tools;$env:PATH"

Write-Host "Environment variables set for current session:" -ForegroundColor Yellow
Write-Host "JAVA_HOME: $JAVA_HOME" -ForegroundColor Cyan
Write-Host "ANDROID_HOME: $ANDROID_HOME" -ForegroundColor Cyan

# Test Java
Write-Host "`nTesting Java..." -ForegroundColor Cyan
try {
    & "$JAVA_HOME\bin\java.exe" -version
    Write-Host "Java is working!" -ForegroundColor Green
} catch {
    Write-Host "Java test failed!" -ForegroundColor Red
}

# Test ADB
Write-Host "`nTesting ADB..." -ForegroundColor Cyan
try {
    $adbPath = "$ANDROID_HOME\platform-tools\adb.exe"
    if (Test-Path $adbPath) {
        & $adbPath version
        Write-Host "ADB is working!" -ForegroundColor Green
    } else {
        Write-Host "ADB not found. Install Android SDK Platform Tools." -ForegroundColor Yellow
    }
} catch {
    Write-Host "ADB test failed!" -ForegroundColor Red
}

Write-Host "`nEnvironment setup complete for current session!" -ForegroundColor Green