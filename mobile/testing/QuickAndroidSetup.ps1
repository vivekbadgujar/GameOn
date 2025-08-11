# Quick Android Development Setup for GameOn Testing
# Run this script as Administrator

Write-Host "🚀 Setting up Android development environment for GameOn testing..." -ForegroundColor Green

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ Please run this script as Administrator" -ForegroundColor Red
    exit 1
}

# Install Chocolatey if not present
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installing Chocolatey package manager..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
}

# Install Android Studio
Write-Host "📱 Installing Android Studio..." -ForegroundColor Yellow
choco install androidstudio -y

# Install Java JDK (required for Android development)
Write-Host "☕ Installing Java JDK..." -ForegroundColor Yellow
choco install openjdk11 -y

# Set environment variables
Write-Host "🔧 Setting up environment variables..." -ForegroundColor Yellow
$androidHome = "$env:LOCALAPPDATA\Android\Sdk"
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidHome, "User")
[Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $androidHome, "User")

# Add to PATH
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
$platformTools = "$androidHome\platform-tools"
$tools = "$androidHome\tools"
$toolsBin = "$androidHome\tools\bin"

if ($currentPath -notlike "*$platformTools*") {
    [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$platformTools;$tools;$toolsBin", "User")
}

Write-Host "✅ Android development environment setup complete!" -ForegroundColor Green
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart your computer" -ForegroundColor White
Write-Host "2. Open Android Studio" -ForegroundColor White
Write-Host "3. Complete the setup wizard" -ForegroundColor White
Write-Host "4. Create a virtual device (AVD)" -ForegroundColor White
Write-Host "5. Start the emulator" -ForegroundColor White
Write-Host "6. Run 'npx expo start' and press 'a' for Android" -ForegroundColor White

Write-Host "🎮 GameOn mobile app will be ready for testing!" -ForegroundColor Green