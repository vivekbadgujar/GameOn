# Check Android Device Connection Script

Write-Host "=== Checking Android Device Connection ===" -ForegroundColor Green
Write-Host ""

# Check if ADB is available
try {
    $adbVersion = adb version 2>&1
    Write-Host "✓ ADB is available" -ForegroundColor Green
    Write-Host "  Version: $($adbVersion[0])" -ForegroundColor Gray
} catch {
    Write-Host "✗ ADB not found in PATH" -ForegroundColor Red
    Write-Host "  Please run setup-android-dev.ps1 first" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Checking for connected devices..." -ForegroundColor Yellow

# Check connected devices
$devices = adb devices 2>&1
Write-Host "ADB Devices Output:" -ForegroundColor Cyan
Write-Host $devices -ForegroundColor Gray

# Parse device list
$deviceLines = $devices -split "`n" | Where-Object { $_ -match "\t" }

if ($deviceLines.Count -eq 0) {
    Write-Host ""
    Write-Host "✗ No devices found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting steps:" -ForegroundColor Yellow
    Write-Host "1. Make sure your Android device is connected via USB" -ForegroundColor White
    Write-Host "2. Enable USB debugging in Developer Options" -ForegroundColor White
    Write-Host "3. Select 'File Transfer' or 'MTP' mode when connecting" -ForegroundColor White
    Write-Host "4. Accept the USB debugging authorization on your device" -ForegroundColor White
    Write-Host "5. Try a different USB cable or port" -ForegroundColor White
    Write-Host ""
    Write-Host "To enable Developer Options:" -ForegroundColor Cyan
    Write-Host "- Go to Settings > About phone" -ForegroundColor White
    Write-Host "- Tap 'Build number' 7 times" -ForegroundColor White
    Write-Host "- Go to Settings > Developer options" -ForegroundColor White
    Write-Host "- Enable 'USB debugging'" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "✓ Found $($deviceLines.Count) device(s):" -ForegroundColor Green
    foreach ($device in $deviceLines) {
        $parts = $device -split "`t"
        $deviceId = $parts[0].Trim()
        $status = $parts[1].Trim()
        
        if ($status -eq "device") {
            Write-Host "  ✓ $deviceId (Ready for development)" -ForegroundColor Green
        } elseif ($status -eq "unauthorized") {
            Write-Host "  ⚠ $deviceId (Unauthorized - accept USB debugging on device)" -ForegroundColor Yellow
        } else {
            Write-Host "  ⚠ $deviceId ($status)" -ForegroundColor Yellow
        }
    }
    
    $readyDevices = $deviceLines | Where-Object { $_ -match "\tdevice$" }
    if ($readyDevices.Count -gt 0) {
        Write-Host ""
        Write-Host "✓ Device ready! You can now run:" -ForegroundColor Green
        Write-Host "  npx expo run:android" -ForegroundColor Cyan
    }
}

Write-Host ""