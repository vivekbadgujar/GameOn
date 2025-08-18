# Comprehensive Gradle Issue Fix Script
# This script addresses the common Gradle workspace issue on Windows

Write-Host "Starting Gradle Issue Fix..." -ForegroundColor Green

# Set environment variables
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\tools;$env:ANDROID_HOME\tools\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"

Write-Host "Environment variables set." -ForegroundColor Yellow

# Navigate to android directory
Set-Location "C:\Users\Vivek Badgujar\GameOn-Platform\mobile\android"

# Step 1: Stop all Gradle daemons
Write-Host "`nStep 1: Stopping Gradle daemons..." -ForegroundColor Cyan
try {
    .\gradlew --stop
    Write-Host "Gradle daemons stopped." -ForegroundColor Green
} catch {
    Write-Host "Warning: Could not stop Gradle daemons." -ForegroundColor Yellow
}

# Step 2: Kill any Java processes that might be holding locks
Write-Host "`nStep 2: Killing Java processes..." -ForegroundColor Cyan
Get-Process -Name "java" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process -Name "gradle*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Step 3: Wait a moment for processes to fully terminate
Start-Sleep -Seconds 3

# Step 4: Try to remove .gradle directory with different methods
Write-Host "`nStep 3: Cleaning Gradle cache..." -ForegroundColor Cyan

# Method 1: Try normal removal
try {
    if (Test-Path ".gradle") {
        Remove-Item -Path ".gradle" -Recurse -Force -ErrorAction Stop
        Write-Host "Gradle cache cleaned successfully." -ForegroundColor Green
    }
} catch {
    Write-Host "Normal cleanup failed, trying alternative methods..." -ForegroundColor Yellow
    
    # Method 2: Try with takeown and icacls (Windows file permission tools)
    try {
        if (Test-Path ".gradle") {
            & takeown /f ".gradle" /r /d y 2>$null
            & icacls ".gradle" /grant administrators:F /t 2>$null
            Remove-Item -Path ".gradle" -Recurse -Force -ErrorAction Stop
            Write-Host "Gradle cache cleaned with permission fix." -ForegroundColor Green
        }
    } catch {
        Write-Host "Permission fix failed, trying robocopy method..." -ForegroundColor Yellow
        
        # Method 3: Use robocopy to create empty directory and mirror it
        try {
            $tempDir = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_ }
            & robocopy $tempDir.FullName ".gradle" /mir /r:0 /w:0 2>$null
            Remove-Item $tempDir -Force
            Write-Host "Gradle cache cleaned with robocopy." -ForegroundColor Green
        } catch {
            Write-Host "All cleanup methods failed. Manual intervention may be required." -ForegroundColor Red
        }
    }
}

# Step 5: Clean global Gradle cache
Write-Host "`nStep 4: Cleaning global Gradle cache..." -ForegroundColor Cyan
$globalGradleCache = "$env:USERPROFILE\.gradle"
if (Test-Path $globalGradleCache) {
    try {
        Remove-Item -Path "$globalGradleCache\caches" -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item -Path "$globalGradleCache\daemon" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Global Gradle cache cleaned." -ForegroundColor Green
    } catch {
        Write-Host "Could not clean global cache completely." -ForegroundColor Yellow
    }
}

# Step 6: Clean node_modules and reinstall
Write-Host "`nStep 5: Cleaning node_modules..." -ForegroundColor Cyan
Set-Location "C:\Users\Vivek Badgujar\GameOn-Platform\mobile"
if (Test-Path "node_modules") {
    Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "node_modules cleaned." -ForegroundColor Green
}

# Step 7: Clean npm cache
Write-Host "`nStep 6: Cleaning npm cache..." -ForegroundColor Cyan
npm cache clean --force 2>$null

Write-Host "`nCleanup complete! Now reinstalling dependencies..." -ForegroundColor Green