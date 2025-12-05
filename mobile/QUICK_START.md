# Quick Start Guide - Mobile Version

Get the Android app running in 10 minutes! ⚡

## ✅ Prerequisites Checklist

- [ ] Node.js installed (v16+)
- [ ] Android Studio installed
- [ ] Android SDK installed (via Android Studio)
- [ ] At least one Android emulator created
- [ ] `ANDROID_HOME` environment variable set

> **First time?** See [README.md](README.md) for detailed setup instructions.

## 🚀 5-Minute Setup

### 1. Install Dependencies (2 min)

```bash
cd mobile
npm install
```

### 2. Prepare Web Assets (1 min)

```bash
npm run dev
```

This copies all source files from the desktop app.

### 3. Add Android Platform (1 min)

```bash
npx cap add android
```

### 4. Open in Android Studio (1 min)

```bash
npx cap open android
```

Wait for Gradle sync to complete (first time may take a few minutes).

### 5. Run! 🎉

Click the green "Run" button in Android Studio.

The app should launch in your emulator!

## 🎯 Development Workflow

### Making Changes

**Option A: Edit shared files** (affects both desktop and mobile)
```bash
cd ..              # Go to project root
# Edit files in src/
cd mobile
npm run dev        # Copy changes
npx cap sync       # Sync to Android
```

**Option B: Edit mobile-specific files** (mobile only)
```bash
# Edit files in mobile/src/
npm run build      # Build and sync
```

Then in Android Studio: Run → Reload

### Quick Commands

```bash
# Copy source files
npm run dev

# Build everything and sync
npm run build

# Run on device/emulator
npm run run:android

# Open in Android Studio
npm run open:android
```

## 🐛 Troubleshooting

### App Won't Build

**Problem**: Gradle sync failed
```bash
# Fix: Clear Gradle cache
cd android
./gradlew clean
cd ..
npx cap sync
```

### App Crashes on Launch

**Problem**: Missing web assets
```bash
# Fix: Rebuild web assets
npm run dev
npx cap sync
```

### Changes Not Showing

**Problem**: Not synced to Android
```bash
# Fix: Force sync
npm run build
```

Then in Android Studio: Build → Clean Project → Rebuild Project

### Black Screen

**Problem**: Web content not loading
```bash
# Check logcat for errors
adb logcat | grep "Capacitor"
```

Common causes:
- Missing index.html in www/ → Run `npm run dev`
- Script loading errors → Check browser console
- Permissions issue → Add to AndroidManifest.xml

## 📱 Testing Checklist

Before submitting, test these core features:

- [ ] Open a PDF file
- [ ] View document in Reader tab
- [ ] Switch to Analyze tab
- [ ] Enable grammar highlighting
- [ ] Add a note (long-press text)
- [ ] Check Statistics tab
- [ ] Navigate with bottom nav
- [ ] Swipe between views
- [ ] Test on different screen sizes

## 🎨 Customization

### Change App Name
```javascript
// mobile/capacitor.config.json
{
  "appName": "Your App Name"
}
```

### Change App Icon
1. Generate icons at: https://icon.kitchen/
2. Replace files in: `android/app/src/main/res/mipmap-*/`
3. Or use Android Studio: Right-click `res` → New → Image Asset

### Change Colors
```css
/* mobile/src/mobile-styles.css */
.mobile-app-bar {
  background: linear-gradient(135deg, #YOUR_COLOR_1, #YOUR_COLOR_2);
}

.bottom-nav-item.active {
  color: #YOUR_PRIMARY_COLOR;
}
```

## 📦 Build Release APK

### Quick Build (Debug)
```bash
cd android
./gradlew assembleDebug
```
APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release Build
See [README.md#building-release-apk](README.md#building-release-apk) for signing setup.

## 🆘 Still Stuck?

1. **Read the full README**: [README.md](README.md)
2. **Check logs**: `adb logcat`
3. **Inspect with Chrome**: `chrome://inspect`
4. **Search issues**: [Capacitor Forums](https://forum.ionicframework.com/c/capacitor/)

## 🎓 Next Steps

- [ ] Read [MOBILE_FEATURES.md](MOBILE_FEATURES.md) for platform differences
- [ ] Set up live reload for faster development
- [ ] Configure Google Drive sync
- [ ] Test on a real Android device
- [ ] Optimize performance for low-end devices

## 💡 Pro Tips

1. **Use live reload**: See README.md for setup - changes reflect instantly!
2. **Keep Chrome DevTools open**: Essential for debugging web issues
3. **Test on real device early**: Emulators don't catch everything
4. **Profile performance**: Use Chrome DevTools Performance tab
5. **Test different screen sizes**: Use multiple emulators

Happy coding! 🚀

