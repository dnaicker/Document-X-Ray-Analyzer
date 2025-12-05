# Grammar Highlighter Mobile

Android version of Grammar Highlighter built with Capacitor.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Node.js** (v16 or higher)
   - Download from: https://nodejs.org/

2. **Android Studio**
   - Download from: https://developer.android.com/studio
   - Install Android SDK (API 33 or higher recommended)
   - Set up Android Virtual Device (AVD) for testing

3. **Java Development Kit (JDK)**
   - JDK 11 or higher
   - Usually installed with Android Studio

### Environment Variables

Add these to your system PATH:
- `ANDROID_HOME` pointing to your Android SDK location
  - Windows: `C:\Users\YourName\AppData\Local\Android\Sdk`
  - macOS: `~/Library/Android/sdk`
  - Linux: `~/Android/Sdk`

## 🚀 Setup Instructions

### Step 1: Install Dependencies

From the `mobile` directory:

```bash
npm install
```

### Step 2: Copy Source Files

Copy the shared source files from the desktop app:

```bash
npm run copy:src
npm run copy:assets
```

This copies:
- `../src/*` → `./www/`
- `../lib/*` → `./www/`
- `../assets/*` → `./www/`

### Step 3: Add Android Platform

```bash
npx cap add android
```

This creates the `android` directory with the native Android project.

### Step 4: Sync Capacitor

Whenever you make changes to web files, sync them to the native project:

```bash
npx cap sync
```

## 🔧 Development Workflow

### Option 1: Run in Android Studio (Recommended)

1. Open Android Studio
2. Open the project: `mobile/android`
3. Wait for Gradle sync to complete
4. Select an emulator or connect a physical device
5. Click the "Run" button (green play icon)

### Option 2: Command Line

```bash
# Build and run on connected device/emulator
npm run run:android

# Or manually
npm run build
npx cap open android
```

### Making Changes

1. **Edit web files** in `../src/` (shared with desktop app)
2. **Or edit mobile-specific files** in `mobile/src/`
3. **Sync changes**: `npm run build`
4. **Reload app** in Android Studio or use live reload

### Live Reload (Development)

For faster development, you can use a dev server:

1. Start a local server (from project root):
   ```bash
   # Example using Python
   cd ..
   python -m http.server 8000
   ```

2. Update `mobile/capacitor.config.json`:
   ```json
   {
     "server": {
       "url": "http://YOUR_COMPUTER_IP:8000/src",
       "cleartext": true
     }
   }
   ```

3. Sync and run:
   ```bash
   npx cap sync
   npx cap run android
   ```

Now changes reload instantly on the device!

## 📱 Building Release APK

### Step 1: Generate Signing Key

```bash
keytool -genkey -v -keystore release-key.keystore -alias key0 -keyalg RSA -keysize 2048 -validity 10000
```

Keep this key safe! You'll need it for all future updates.

### Step 2: Configure Build

1. Open `mobile/android/app/build.gradle`
2. Add signing config:

```gradle
android {
    ...
    signingConfigs {
        release {
            storeFile file('../../release-key.keystore')
            storePassword 'your_store_password'
            keyAlias 'key0'
            keyPassword 'your_key_password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Step 3: Build Release

```bash
cd android
./gradlew assembleRelease
```

The APK will be at:
`mobile/android/app/build/outputs/apk/release/app-release.apk`

### Step 4: Install on Device

```bash
adb install app-release.apk
```

## 🎨 Customization

### App Icon

Replace these files:
- `android/app/src/main/res/mipmap-*/ic_launcher.png`
- Use Android Studio's Image Asset tool for easy generation

### Splash Screen

Edit: `android/app/src/main/res/values/styles.xml`

### App Name

Edit: `android/app/src/main/res/values/strings.xml`

```xml
<string name="app_name">Grammar Highlighter</string>
```

### Package Name

To change `com.grammarhighlighter.mobile`:
1. Edit `capacitor.config.json` → `appId`
2. Run: `npx cap sync`
3. Manually update `android/app/build.gradle` if needed

## 🔍 Debugging

### View Logs

```bash
# All logs
adb logcat

# Filter for your app
adb logcat | grep "Capacitor"

# Chrome DevTools (for web debugging)
chrome://inspect
```

### Common Issues

#### 1. "SDK location not found"

**Fix**: Set `ANDROID_HOME` environment variable

#### 2. "Gradle sync failed"

**Fix**: 
- Open `android` folder in Android Studio
- File → Invalidate Caches / Restart
- Let Gradle sync complete

#### 3. "App crashes on launch"

**Fix**:
- Check logcat for errors
- Ensure all web resources are copied: `npm run build`
- Check file permissions in Android manifest

#### 4. "Cannot read file"

**Fix**:
- Add storage permissions to `AndroidManifest.xml`:
  ```xml
  <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
  <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
  ```

#### 5. "PDF.js not loading"

**Fix**:
- Ensure PDF.js worker is accessible
- Check network tab in Chrome DevTools
- May need to bundle PDF.js locally instead of CDN

## 📦 Project Structure

```
mobile/
├── android/              # Native Android project (generated)
├── src/
│   ├── capacitor-bridge.js    # Electron → Capacitor API bridge
│   ├── mobile-styles.css      # Mobile-specific responsive styles
│   ├── mobile-index.html      # Mobile-optimized HTML
│   └── mobile-navigation.js   # Bottom nav controller
├── www/                  # Built web assets (generated)
├── capacitor.config.json # Capacitor configuration
├── package.json
└── README.md
```

## 🔄 Keeping Desktop and Mobile in Sync

Since both projects share the same source code:

1. **Shared files** (in `../src/`):
   - Make changes here for features that work on both platforms
   - Test on both desktop and mobile

2. **Mobile-specific overrides** (in `mobile/src/`):
   - `mobile-styles.css` overrides desktop styles
   - `capacitor-bridge.js` replaces Electron APIs
   - `mobile-navigation.js` adds bottom nav

3. **Desktop-specific** (in root `electron-main.js`):
   - Only affects desktop app

### Best Practice

1. Edit shared code in `../src/`
2. Copy to mobile: `npm run copy:src`
3. Test on both platforms
4. If mobile needs different behavior, use:
   ```javascript
   if (window.innerWidth <= 768) {
     // Mobile-specific code
   }
   ```

## 📊 Performance Tips

1. **Optimize Images**: Use smaller assets for mobile
2. **Lazy Load**: Load analysis only when needed
3. **Limit OCR**: Process fewer pages at once on mobile
4. **Cache Aggressively**: Save processed data to avoid re-processing
5. **Use Workers**: Run heavy tasks in web workers

## 🚢 Publishing to Play Store

1. Create a Google Play Developer account ($25 one-time fee)
2. Build a signed release APK (see above)
3. Create app listing with screenshots
4. Upload APK
5. Fill in store listing details
6. Submit for review

**Alternative**: Use Capacitor's App Flow for easier updates:
```bash
npm install @capacitor/app-flow
```

## 📚 Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)

## 🆘 Support

If you encounter issues:
1. Check the logs: `adb logcat`
2. Inspect with Chrome DevTools: `chrome://inspect`
3. Search Capacitor forums: https://forum.ionicframework.com/c/capacitor/

## 📝 License

Same as the desktop application - MIT License

