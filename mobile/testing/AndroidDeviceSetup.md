# Android Device Setup for GameOn Mobile Testing

## 📱 Physical Device Connection (Recommended)

### Step 1: Enable Developer Options
1. **Open Settings** on your Android device
2. **Go to About Phone** (or About Device)
3. **Tap Build Number** 7 times rapidly
4. **Developer Options** will be enabled

### Step 2: Enable USB Debugging
1. **Go to Settings > Developer Options**
2. **Enable USB Debugging**
3. **Enable Install via USB** (if available)
4. **Enable USB Debugging (Security Settings)** (if available)

### Step 3: Connect Device
1. **Connect device to PC** via USB cable
2. **Select "File Transfer" or "MTP"** mode when prompted
3. **Allow USB Debugging** when popup appears on device
4. **Trust this computer** if prompted

### Step 4: Verify Connection
```powershell
# Check if device is detected
adb devices
```

### Step 5: Install Expo Go
1. **Open Google Play Store** on device
2. **Search for "Expo Go"**
3. **Install the app**
4. **Open Expo Go**

### Step 6: Connect to Development Server
1. **Scan QR code** displayed in terminal with Expo Go
2. **Or manually enter:** `exp://10.217.86.8:8082`
3. **App should load automatically**

## 🖥️ Android Emulator Setup (Alternative)

### Option A: Android Studio Emulator

#### Step 1: Install Android Studio
```powershell
# Download from: https://developer.android.com/studio
# Install with default settings
```

#### Step 2: Create Virtual Device
1. **Open Android Studio**
2. **Go to Tools > AVD Manager**
3. **Click "Create Virtual Device"**
4. **Select Phone > Pixel 4** (recommended)
5. **Download System Image** (API 30 or higher)
6. **Configure AVD settings**
7. **Click Finish**

#### Step 3: Start Emulator
1. **Click Play button** in AVD Manager
2. **Wait for emulator to boot**
3. **Install Expo Go** from Play Store in emulator

### Option B: Genymotion (Alternative)

#### Step 1: Install Genymotion
```powershell
# Download from: https://www.genymotion.com/
# Install personal edition (free)
```

#### Step 2: Configure ADB
1. **Open Genymotion**
2. **Go to Settings > ADB**
3. **Select "Use custom Android SDK tools"**
4. **Point to Android SDK directory**

#### Step 3: Create Virtual Device
1. **Click "+" to add device**
2. **Select Android version** (9.0 or higher)
3. **Start virtual device**

## 🌐 Web Testing (Quick Alternative)

### Test in Browser
```powershell
# In the Expo terminal, press 'w' to open web version
# This allows basic functionality testing
```

## 🔍 Troubleshooting

### Device Not Detected
```powershell
# Check ADB connection
adb devices

# Restart ADB server
adb kill-server
adb start-server

# Check device drivers (Windows)
# Device Manager > Update driver for Android device
```

### Expo Go Connection Issues
1. **Ensure same WiFi network** for PC and device
2. **Disable firewall** temporarily
3. **Try manual URL:** `exp://10.217.86.8:8082`
4. **Restart Expo development server**

### Performance Issues
1. **Close other apps** on device
2. **Ensure sufficient storage** (>1GB free)
3. **Use USB 3.0 port** for connection
4. **Enable "Stay Awake"** in Developer Options

## 📋 Quick Testing Checklist

### Once Connected:
- [ ] App loads without crashes
- [ ] Splash screen displays
- [ ] Navigation works smoothly
- [ ] All screens accessible
- [ ] Touch interactions responsive
- [ ] Performance is smooth

### If Issues Occur:
1. **Check console logs** in Expo terminal
2. **Shake device** to open developer menu
3. **Reload app** from developer menu
4. **Check network connection**
5. **Restart Expo Go app**

## 🚀 Ready for Testing

Once your device is connected and the app loads:

1. **Follow the comprehensive testing checklist** in `DeviceTestingGuide.md`
2. **Test all 11 screens systematically**
3. **Validate core features** (tournaments, wallet, auth)
4. **Check performance** and responsiveness
5. **Report any issues** found during testing

The GameOn mobile app is ready for thorough device testing once you have a connected Android device or emulator running!