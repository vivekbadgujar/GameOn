# Free Port 5000 for GameOn Backend

Port 5000 is currently being used by macOS AirPlay Receiver (ControlCenter). To use port 5000 for your GameOn backend, you need to disable AirPlay Receiver.

## Steps to Free Port 5000:

### Method 1: Disable AirPlay Receiver (Recommended)

**For macOS Ventura/Sonoma/Sequoia:**
1. Open **System Settings** (Apple menu → System Settings)
2. Click **General** in the sidebar
3. Click **AirDrop & Handoff**
4. Turn off **AirPlay Receiver**

**For macOS Monterey/Big Sur:**
1. Open **System Preferences** (Apple menu → System Preferences)
2. Click **Sharing**
3. Uncheck **AirPlay Receiver**

### Method 2: Change AirPlay Receiver Port
1. In the same AirPlay Receiver settings
2. Click **Options** or **Advanced**
3. Change the port from 5000 to another port (like 7000)

### Method 3: Temporary Solution (Terminal)
```bash
# This will temporarily stop the service (may restart automatically)
sudo launchctl unload -w /System/Library/LaunchDaemons/com.apple.AirPlayXPCHelper.plist
```

To re-enable later:
```bash
sudo launchctl load -w /System/Library/LaunchDaemons/com.apple.AirPlayXPCHelper.plist
```

## Verify Port 5000 is Free:
After disabling AirPlay Receiver, run:
```bash
lsof -i :5000
```

If no output is shown, port 5000 is now available for your GameOn backend.

## Start GameOn Backend:
Once port 5000 is free, you can start your backend:
```bash
cd /Users/naishailesh/GameOn/backend
npm start
```

The backend should now start successfully on port 5000.