# Android Development Environment Setup Script
# This script sets up the required environment variables for Android development

Write-Host "Setting up Android Development Environment..." -ForegroundColor Green

# Set JAVA_HOME to Android Studio's bundled JDK
$JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"

# Check if Android SDK exists in the default location
if (-not (Test-Path $ANDROID_HOME)) {
    # Try alternative locations
    $alternativeLocations = @(
        "C:\Program Files\Android\Sdk",
        "C:\Android\Sdk",
        "C:\Users\$env:USERNAME\Android\Sdk"
    )
    
    foreach ($location in $alternativeLocations) {
        if (Test-Path $location) {
            $ANDROID_HOME = $location
            break
        }
    }
}

Write-Host "JAVA_HOME: $JAVA_HOME" -ForegroundColor Yellow
Write-Host "ANDROID_HOME: $ANDROID_HOME" -ForegroundColor Yellow

# Set environment variables for current session
$env:JAVA_HOME = $JAVA_HOME
$env:ANDROID_HOME = $ANDROID_HOME
$env:ANDROID_SDK_ROOT = $ANDROID_HOME

# Add to PATH
$env:PATH = "$JAVA_HOME\bin;$ANDROID_HOME\tools;$ANDROID_HOME\tools\bin;$ANDROID_HOME\platform-tools;$env:PATH"

Write-Host "Environment variables set for current session." -ForegroundColor Green

# Verify Java installation
Write-Host "`nVerifying Java installation..." -ForegroundColor Cyan
try {
    & "$JAVA_HOME\bin\java.exe" -version
    Write-Host "Java is working correctly!" -ForegroundColor Green
} catch {
    Write-Host "Error: Java verification failed!" -ForegroundColor Red
    exit 1
}

# Check Android SDK
Write-Host "`nChecking Android SDK..." -ForegroundColor Cyan
if (Test-Path $ANDROID_HOME) {
    Write-Host "Android SDK found at: $ANDROID_HOME" -ForegroundColor Green
    
    # List available platforms
    $platformsPath = Join-Path $ANDROID_HOME "platforms"
    if (Test-Path $platformsPath) {
        $platforms = Get-ChildItem $platformsPath | Select-Object -ExpandProperty Name
        Write-Host "Available Android platforms: $($platforms -join ', ')" -ForegroundColor Yellow
    }
} else {
    Write-Host "Warning: Android SDK not found at expected location!" -ForegroundColor Red
    Write-Host "Please install Android SDK or update ANDROID_HOME path." -ForegroundColor Red
}

Write-Host "`nEnvironment setup complete!" -ForegroundColor Green
Write-Host "You can now run: npx expo run:android" -ForegroundColor Cyan