# Android Development Environment Setup Script
# Run this script as Administrator

Write-Host "=== GameOn Mobile - Android Development Setup ===" -ForegroundColor Green
Write-Host ""

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script requires Administrator privileges. Please run as Administrator." -ForegroundColor Red
    exit 1
}

# Function to add to PATH if not already present
function Add-ToPath {
    param([string]$PathToAdd)
    
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    if ($currentPath -notlike "*$PathToAdd*") {
        Write-Host "Adding to PATH: $PathToAdd" -ForegroundColor Yellow
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$PathToAdd", "Machine")
    } else {
        Write-Host "Already in PATH: $PathToAdd" -ForegroundColor Green
    }
}

# Check if Android Studio is installed
$androidStudioPath = "C:\Program Files\Android\Android Studio\bin\studio64.exe"
if (Test-Path $androidStudioPath) {
    Write-Host "✓ Android Studio found at: $androidStudioPath" -ForegroundColor Green
} else {
    Write-Host "✗ Android Studio not found. Please install it from:" -ForegroundColor Red
    Write-Host "  https://developer.android.com/studio" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After installation, run this script again." -ForegroundColor Yellow
    exit 1
}

# Check for Android SDK
$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
if (Test-Path $sdkPath) {
    Write-Host "✓ Android SDK found at: $sdkPath" -ForegroundColor Green
    
    # Add SDK paths to environment
    Add-ToPath "$sdkPath\platform-tools"
    Add-ToPath "$sdkPath\tools"
    Add-ToPath "$sdkPath\tools\bin"
    
    Write-Host "✓ Android SDK paths added to system PATH" -ForegroundColor Green
} else {
    Write-Host "✗ Android SDK not found. Please install it through Android Studio SDK Manager." -ForegroundColor Red
    exit 1
}

# Check if Java is available
try {
    $javaVersion = java -version 2>&1
    Write-Host "✓ Java found: $($javaVersion[0])" -ForegroundColor Green
} catch {
    Write-Host "✗ Java not found. Android Studio should have installed it." -ForegroundColor Red
    Write-Host "  Please check Android Studio installation." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart your PowerShell/Command Prompt" -ForegroundColor White
Write-Host "2. Connect your Android device via USB" -ForegroundColor White
Write-Host "3. Enable USB debugging on your device (see ANDROID_SETUP_GUIDE.md)" -ForegroundColor White
Write-Host "4. Run: adb devices (to verify device connection)" -ForegroundColor White
Write-Host "5. Run: npx expo run:android (to build and install the app)" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see: ANDROID_SETUP_GUIDE.md" -ForegroundColor Cyan