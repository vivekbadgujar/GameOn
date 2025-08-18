# Android Development Setup Guide

## Step 1: Install Android Studio

1. **Download Android Studio:**
   - Go to https://developer.android.com/studio
   - Download Android Studio for Windows
   - Run the installer and follow the setup wizard

2. **During Installation:**
   - Choose "Standard" installation
   - Accept all license agreements
   - Let it download the Android SDK, Android SDK Platform-Tools, and Android Virtual Device

## Step 2: Configure Environment Variables

After Android Studio installation, add these to your system PATH:

1. **Open System Environment Variables:**
   - Press `Win + R`, type `sysdm.cpl`, press Enter
   - Click "Environment Variables"
   - Under "System Variables", find and edit "Path"

2. **Add these paths (adjust for your installation):**
   ```
   C:\Users\%USERNAME%\AppData\Local\Android\Sdk\platform-tools
   C:\Users\%USERNAME%\AppData\Local\Android\Sdk\tools
   C:\Users\%USERNAME%\AppData\Local\Android\Sdk\tools\bin
   ```

## Step 3: Enable USB Debugging on Your Android Device

1. **Enable Developer Options:**
   - Go to Settings > About phone
   - Tap "Build number" 7 times
   - You'll see "You are now a developer!"

2. **Enable USB Debugging:**
   - Go to Settings > Developer options
   - Turn on "USB debugging"
   - Turn on "Install via USB" (if available)

3. **Connect Your Device:**
   - Connect via USB cable
   - When prompted, allow USB debugging for this computer
   - Select "File Transfer" or "MTP" mode

## Step 4: Verify Setup

After setup, run these commands to verify:

```powershell
# Check if ADB is working
adb devices

# Should show your connected device
```

## Step 5: Build and Install the App

Once everything is set up:

```powershell
cd "c:\Users\Vivek Badgujar\GameOn-Platform\mobile"
npx expo run:android
```

This will:
- Build the development version of your app
- Install it directly on your connected device
- Start the Metro bundler for live reloading

## Troubleshooting

**If device not detected:**
- Try different USB cable
- Enable "File Transfer" mode
- Restart ADB: `adb kill-server` then `adb start-server`

**If build fails:**
- Make sure Android SDK is properly installed
- Check that environment variables are set correctly
- Restart your terminal/PowerShell after setting environment variables

**For faster development:**
- Keep the device connected
- Use `npx expo start --dev-client` for subsequent runs
- The app will update automatically when you make changes