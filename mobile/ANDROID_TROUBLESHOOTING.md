# Android Development Troubleshooting Guide

## Issue Fixed: Gradle Build Error

### Problem
```
Error resolving plugin [id: 'com.facebook.react.settings']
java.io.UncheckedIOException: Could not move temporary workspace
```

### Root Cause
1. Missing Java Development Kit (JDK)
2. Missing Android SDK environment variables
3. Corrupted Gradle cache files
4. File system permission issues

### Solution Applied

#### 1. Environment Setup
- **JAVA_HOME**: `C:\Program Files\Android\Android Studio\jbr`
- **ANDROID_HOME**: `C:\Users\[USERNAME]\AppData\Local\Android\Sdk`
- **ANDROID_SDK_ROOT**: Same as ANDROID_HOME
- **PATH**: Added Java and Android SDK tools to PATH

#### 2. Gradle Cache Cleanup
- Stopped all Gradle daemons: `gradlew --stop`
- Killed Java processes holding file locks
- Used `takeown` and `icacls` to fix file permissions
- Used `robocopy` to clean corrupted cache directories
- Cleaned global Gradle cache in `%USERPROFILE%\.gradle`

#### 3. Dependencies Reinstall
- Removed `node_modules` directory
- Cleaned npm cache: `npm cache clean --force`
- Reinstalled dependencies: `npm install`

## Quick Fix Scripts Created

### 1. `run-android.bat`
- Sets up environment variables
- Checks connected devices
- Runs Expo Android build

### 2. `fix-gradle-issue.ps1`
- Comprehensive cleanup script for Gradle issues
- Handles file permission problems
- Cleans all caches

### 3. `setup-env-simple.ps1`
- Sets environment variables for current session
- Tests Java and ADB installations

## Verification Steps

1. **Check Java**: `java -version`
2. **Check ADB**: `adb version`
3. **Check devices**: `adb devices`
4. **Test Gradle**: `cd android && gradlew --version`

## Common Issues and Solutions

### Issue: "adb is not recognized"
**Solution**: Run `setup-env-simple.ps1` or `run-android.bat`

### Issue: "JAVA_HOME is not set"
**Solution**: Ensure Android Studio is installed with bundled JDK

### Issue: Gradle daemon issues
**Solution**: Run `fix-gradle-issue.ps1`

### Issue: No devices found
**Solutions**:
- Enable USB Debugging on Android device
- Install device drivers
- Try different USB cable/port
- Use `adb devices` to verify connection

## Environment Variables Reference

```batch
JAVA_HOME=C:\Program Files\Android\Android Studio\jbr
ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
ANDROID_SDK_ROOT=%ANDROID_HOME%
PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin;%ANDROID_HOME%\platform-tools;%PATH%
```

## Build Commands

### Development Build
```bash
npx expo run:android
```

### Clean Build
```bash
cd android
gradlew clean
cd ..
npx expo run:android
```

### Build for specific device
```bash
npx expo run:android --device [DEVICE_ID]
```

## Device Setup

1. Enable Developer Options on Android device
2. Enable USB Debugging
3. Connect device via USB
4. Accept debugging authorization on device
5. Verify with `adb devices`

## Success Indicators

- ✅ Java version displays correctly
- ✅ ADB version displays correctly  
- ✅ Device appears in `adb devices` list
- ✅ Gradle build completes without errors
- ✅ App installs and launches on device

## Files Created for This Fix

- `fix-gradle-issue.ps1` - Comprehensive cleanup script
- `setup-env-simple.ps1` - Environment setup script
- `run-android.bat` - Convenient build script
- `ANDROID_TROUBLESHOOTING.md` - This troubleshooting guide