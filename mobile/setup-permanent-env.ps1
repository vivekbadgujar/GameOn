# Permanent Environment Variables Setup for Android Development
# This script sets up environment variables permanently in Windows

Write-Host "Setting up permanent environment variables for Android development..." -ForegroundColor Green

# Define paths
$JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"

# Check if paths exist
if (-not (Test-Path $JAVA_HOME)) {
    Write-Host "Error: JAVA_HOME path not found: $JAVA_HOME" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $ANDROID_HOME)) {
    Write-Host "Warning: ANDROID_HOME path not found: $ANDROID_HOME" -ForegroundColor Yellow
    Write-Host "Checking alternative locations..." -ForegroundColor Yellow
    
    $alternativeLocations = @(
        "C:\Program Files\Android\Sdk",
        "C:\Android\Sdk",
        "C:\Users\$env:USERNAME\Android\Sdk"
    )
    
    $found = $false
    foreach ($location in $alternativeLocations) {
        if (Test-Path $location) {
            $ANDROID_HOME = $location
            $found = $true
            Write-Host "Found Android SDK at: $ANDROID_HOME" -ForegroundColor Green
            break
        }
    }
    
    if (-not $found) {
        Write-Host "Error: Android SDK not found in any expected location!" -ForegroundColor Red
        Write-Host "Please install Android SDK through Android Studio." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Setting environment variables..." -ForegroundColor Cyan

try {
    # Set JAVA_HOME
    [Environment]::SetEnvironmentVariable("JAVA_HOME", $JAVA_HOME, [EnvironmentVariableTarget]::User)
    Write-Host "JAVA_HOME set to: $JAVA_HOME" -ForegroundColor Green
    
    # Set ANDROID_HOME
    [Environment]::SetEnvironmentVariable("ANDROID_HOME", $ANDROID_HOME, [EnvironmentVariableTarget]::User)
    Write-Host "ANDROID_HOME set to: $ANDROID_HOME" -ForegroundColor Green
    
    # Set ANDROID_SDK_ROOT (alternative name)
    [Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $ANDROID_HOME, [EnvironmentVariableTarget]::User)
    Write-Host "ANDROID_SDK_ROOT set to: $ANDROID_HOME" -ForegroundColor Green
    
    # Get current PATH
    $currentPath = [Environment]::GetEnvironmentVariable("PATH", [EnvironmentVariableTarget]::User)
    
    # Define paths to add
    $pathsToAdd = @(
        "$JAVA_HOME\bin",
        "$ANDROID_HOME\tools",
        "$ANDROID_HOME\tools\bin", 
        "$ANDROID_HOME\platform-tools"
    )
    
    # Add paths to PATH if not already present
    $pathModified = $false
    foreach ($pathToAdd in $pathsToAdd) {
        if ($currentPath -notlike "*$pathToAdd*") {
            $currentPath = "$pathToAdd;$currentPath"
            $pathModified = $true
            Write-Host "Added to PATH: $pathToAdd" -ForegroundColor Green
        } else {
            Write-Host "Already in PATH: $pathToAdd" -ForegroundColor Yellow
        }
    }
    
    # Update PATH if modified
    if ($pathModified) {
        [Environment]::SetEnvironmentVariable("PATH", $currentPath, [EnvironmentVariableTarget]::User)
        Write-Host "PATH updated successfully" -ForegroundColor Green
    }
    
    Write-Host "`nEnvironment variables set successfully!" -ForegroundColor Green
    Write-Host "Please restart your terminal or IDE to use the new environment variables." -ForegroundColor Yellow
    
    # Set for current session as well
    $env:JAVA_HOME = $JAVA_HOME
    $env:ANDROID_HOME = $ANDROID_HOME
    $env:ANDROID_SDK_ROOT = $ANDROID_HOME
    $env:PATH = "$JAVA_HOME\bin;$ANDROID_HOME\tools;$ANDROID_HOME\tools\bin;$ANDROID_HOME\platform-tools;$env:PATH"
    
    Write-Host "`nEnvironment variables also set for current session." -ForegroundColor Green
    
} catch {
    Write-Host "Error setting environment variables: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Verify installations
Write-Host "`nVerifying installations..." -ForegroundColor Cyan

# Test Java
try {
    $javaVersion = & "$JAVA_HOME\bin\java.exe" -version 2>&1
    Write-Host "✓ Java is working: $($javaVersion[0])" -ForegroundColor Green
} catch {
    Write-Host "✗ Java verification failed" -ForegroundColor Red
}

# Test ADB
try {
    $adbPath = "$ANDROID_HOME\platform-tools\adb.exe"
    if (Test-Path $adbPath) {
        $adbVersion = & $adbPath version 2>&1
        Write-Host "✓ ADB is available: $($adbVersion[0])" -ForegroundColor Green
    } else {
        Write-Host "✗ ADB not found at: $adbPath" -ForegroundColor Red
        Write-Host "  Install Android SDK Platform Tools through Android Studio SDK Manager" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ ADB verification failed" -ForegroundColor Red
}

Write-Host "`nSetup complete!" -ForegroundColor Green