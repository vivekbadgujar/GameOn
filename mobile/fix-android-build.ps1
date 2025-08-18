# Complete Android Build Fix Script
Write-Host "=== Android Build Environment Fix ===" -ForegroundColor Green

# Step 1: Set environment variables permanently
Write-Host "1. Setting up permanent environment variables..." -ForegroundColor Cyan

$JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"

try {
    [Environment]::SetEnvironmentVariable("JAVA_HOME", $JAVA_HOME, [EnvironmentVariableTarget]::User)
    [Environment]::SetEnvironmentVariable("ANDROID_HOME", $ANDROID_HOME, [EnvironmentVariableTarget]::User)
    [Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $ANDROID_HOME, [EnvironmentVariableTarget]::User)
    
    # Update PATH
    $currentPath = [Environment]::GetEnvironmentVariable("PATH", [EnvironmentVariableTarget]::User)
    $pathsToAdd = @(
        "$JAVA_HOME\bin",
        "$ANDROID_HOME\platform-tools",
        "$ANDROID_HOME\tools",
        "$ANDROID_HOME\tools\bin"
    )
    
    foreach ($pathToAdd in $pathsToAdd) {
        if ($currentPath -notlike "*$pathToAdd*") {
            $currentPath = "$pathToAdd;$currentPath"
        }
    }
    
    [Environment]::SetEnvironmentVariable("PATH", $currentPath, [EnvironmentVariableTarget]::User)
    Write-Host "✓ Permanent environment variables set" -ForegroundColor Green
} catch {
    Write-Host "⚠ Could not set permanent variables, continuing with session variables" -ForegroundColor Yellow
}

# Step 2: Set environment variables for current session
Write-Host "2. Setting up session environment variables..." -ForegroundColor Cyan
$env:JAVA_HOME = $JAVA_HOME
$env:ANDROID_HOME = $ANDROID_HOME
$env:ANDROID_SDK_ROOT = $ANDROID_HOME
$env:PATH = "$JAVA_HOME\bin;$ANDROID_HOME\platform-tools;$ANDROID_HOME\tools;$ANDROID_HOME\tools\bin;$env:PATH"

Write-Host "✓ Session environment variables set" -ForegroundColor Green
Write-Host "   JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Yellow
Write-Host "   ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Yellow

# Step 3: Verify local.properties file
Write-Host "3. Checking local.properties file..." -ForegroundColor Cyan
$localPropsPath = "android\local.properties"
if (Test-Path $localPropsPath) {
    Write-Host "✓ local.properties exists" -ForegroundColor Green
} else {
    Write-Host "Creating local.properties file..." -ForegroundColor Yellow
    $content = "sdk.dir=C:/Users/$env:USERNAME/AppData/Local/Android/Sdk"
    Set-Content -Path $localPropsPath -Value $content
    Write-Host "✓ local.properties created" -ForegroundColor Green
}

# Step 4: Test environment
Write-Host "4. Testing environment..." -ForegroundColor Cyan

# Test Java
try {
    $javaVersion = & "$env:JAVA_HOME\bin\java.exe" -version 2>&1
    Write-Host "✓ Java working: $($javaVersion[0])" -ForegroundColor Green
} catch {
    Write-Host "✗ Java test failed" -ForegroundColor Red
    exit 1
}

# Test ADB
try {
    $adbVersion = & "$env:ANDROID_HOME\platform-tools\adb.exe" version 2>&1
    Write-Host "✓ ADB working: $($adbVersion[0])" -ForegroundColor Green
} catch {
    Write-Host "✗ ADB test failed" -ForegroundColor Red
    exit 1
}

# Step 5: Check connected devices
Write-Host "5. Checking connected devices..." -ForegroundColor Cyan
try {
    $devices = & "$env:ANDROID_HOME\platform-tools\adb.exe" devices
    Write-Host "Connected devices:" -ForegroundColor Yellow
    $devices | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
} catch {
    Write-Host "⚠ Could not check devices" -ForegroundColor Yellow
}

Write-Host "`n=== Environment Setup Complete ===" -ForegroundColor Green
Write-Host "You can now run: npx expo run:android" -ForegroundColor Cyan
Write-Host "Or use the batch file: run-android-with-env.bat" -ForegroundColor Cyan