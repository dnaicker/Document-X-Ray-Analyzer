# 🔧 Mobile App Troubleshooting Guide

## "Error loading PDF viewer" Issue - FIXED ✅

### What Was Wrong
The mobile app was trying to use the desktop PDF viewer class which wasn't initialized properly on mobile.

### What Was Fixed
Updated `mobile-file-handler.js` to:
- Load PDFs directly using PDF.js
- Render pages manually on mobile
- Extract text for analysis
- Handle all document types independently

### Apply the Fix
```bash
cd mobile
npm run sync:open
```

Then run in Android Studio.

---

## Common Errors & Solutions

### 1. "PDF.js library not loaded"

**Error Message:**
```
Error loading PDF: PDF.js library not loaded
```

**Cause:** PDF.js CDN script didn't load

**Solution:**
1. Check internet connection on device/emulator
2. Verify in Chrome DevTools (`chrome://inspect`):
   ```javascript
   console.log(window.pdfjsLib); // Should not be undefined
   ```
3. If undefined, check `index.html` has:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js"></script>
   ```

**Quick Fix:**
```bash
cd mobile
npm run sync
# Rebuild in Android Studio
```

---

### 2. "Cannot read property 'getPage' of null"

**Error Message:**
```
TypeError: Cannot read property 'getPage' of null
```

**Cause:** PDF didn't load before trying to render

**Solution:** File handler now waits for PDF to load completely

**If still occurs:**
```javascript
// Check in Chrome DevTools
console.log(window.currentPdfData); // Should be PDF object
```

---

### 3. File Picker Doesn't Open

**Symptoms:** Tap "Open File" but nothing happens

**Causes & Solutions:**

**A. Running in browser (not Android)**
- File picker only works on Android device/emulator
- Test in Android Studio, not Chrome browser

**B. JavaScript error**
```bash
# Check logs
adb logcat | grep -i "error\|exception"
```

**C. Button not connected**
```javascript
// Check in console
console.log(window.MobileFileHandler); // Should be object
```

**Fix:**
```bash
cd mobile
npm run sync
```

---

### 4. Black Screen After Opening File

**Symptoms:** File opens but screen stays black

**Causes & Solutions:**

**A. Canvas not rendering**
```javascript
// Check in DevTools
const canvas = document.getElementById('pdfCanvasElement');
console.log(canvas.width, canvas.height); // Should be > 0
```

**B. View not switched**
- Should auto-switch to Viewer tab
- Manually tap Viewer tab (📄)

**C. PDF rendering error**
```bash
# Check logcat
adb logcat | grep "PDF\|render"
```

---

### 5. "Unsupported file type" Error

**Error Message:**
```
Error: Unsupported file type: xyz
```

**Supported formats:**
- `.pdf` ✅
- `.epub` ✅
- `.docx`, `.doc` ✅
- `.txt` ✅
- `.md` ✅

**Solution:** Only open supported file types

---

### 6. App Crashes on File Open

**Symptoms:** App closes immediately when opening large file

**Cause:** Out of memory (large PDF/EPUB)

**Solutions:**

**A. Test with smaller file first**
- Try a PDF < 5MB
- Gradually test larger files

**B. Increase memory in `AndroidManifest.xml`**
```xml
<application
    android:largeHeap="true"
    ...>
```

**C. Check logcat for memory errors**
```bash
adb logcat | grep -i "memory\|oom"
```

---

### 7. Text Not Extracted / Analysis Not Working

**Symptoms:** File opens but Extracted Text tab is empty

**Causes & Solutions:**

**A. Text extraction in progress**
- Wait 5-10 seconds
- Check console: "Extracted X characters"

**B. Image-based PDF (needs OCR)**
- OCR not implemented yet on mobile
- Use text-based PDFs for now

**C. Analyzer not loaded**
```javascript
// Check in DevTools
console.log(window.analyzeText); // Should be function
```

---

### 8. Bottom Navigation Not Working

**Symptoms:** Tapping tabs doesn't switch views

**Causes & Solutions:**

**A. JavaScript error**
```javascript
// Check in DevTools
console.log(window.MobileNavigation); // Should be object
```

**B. Views not found**
```javascript
// Check panels exist
console.log(document.getElementById('libraryPanel')); // Should be element
console.log(document.getElementById('pdfPanel'));
console.log(document.getElementById('textPanel'));
console.log(document.getElementById('statsPanel'));
```

**Fix:**
```bash
cd mobile
rm -rf www
npm run dev
npx cap sync
```

---

### 9. Gradle Sync Failed

**Error in Android Studio:**
```
Gradle sync failed: ...
```

**Solutions:**

**A. Invalidate caches**
1. File → Invalidate Caches / Restart
2. Wait for restart
3. File → Sync Project with Gradle Files

**B. Clean and rebuild**
```bash
cd mobile/android
./gradlew clean
cd ..
npx cap sync
```

**C. Check Android SDK**
- Ensure Android SDK 33+ installed
- Tools → SDK Manager → Check SDK Platform

---

### 10. "www directory not found"

**Error:**
```
Error: www directory not found
```

**Solution:**
```bash
cd mobile
npm run dev  # Creates www/ and copies files
npx cap sync
```

---

## 🔍 Debugging Tools

### Chrome DevTools (Best for web debugging)

1. **Connect device via USB**
2. **Enable USB debugging** on Android
3. **Open Chrome** on desktop
4. **Go to:** `chrome://inspect`
5. **Find your app** and click "Inspect"
6. **Check Console** for errors

### ADB Logcat (Best for native errors)

```bash
# All logs
adb logcat

# Filter for app
adb logcat | grep "Capacitor"

# Filter for errors
adb logcat | grep -i "error\|exception"

# Clear and watch
adb logcat -c && adb logcat | grep "Grammar"
```

### Check File Copied

```bash
# Verify files in www/
ls mobile/www/

# Should see:
# - mobile-file-handler.js ✓
# - mobile-navigation.js ✓
# - mobile-styles.css ✓
# - components/ ✓
# - lib/ ✓
```

---

## 🧪 Testing Checklist

After applying fixes:

- [ ] Run `npm run sync:open`
- [ ] App builds without errors
- [ ] App launches on device/emulator
- [ ] Bottom nav shows 4 tabs
- [ ] Can tap tabs to switch views
- [ ] Menu button (☰) opens
- [ ] "Open File" opens file picker
- [ ] Can select a small PDF (< 5MB)
- [ ] PDF renders in Viewer tab
- [ ] Filename shows in title bar
- [ ] Can navigate PDF pages
- [ ] Extracted Text tab shows content
- [ ] Statistics tab shows word counts
- [ ] No errors in Chrome DevTools console
- [ ] No crashes in logcat

---

## 📝 Reporting Issues

If you still have issues, collect this info:

1. **Error message** (exact text)
2. **Console logs** (from Chrome DevTools)
3. **Logcat output** (from adb logcat)
4. **Steps to reproduce**
5. **File type and size** being opened
6. **Android version**
7. **Device/emulator model**

### Get Logs

```bash
# Save console logs
# In Chrome DevTools: Right-click console → Save as...

# Save logcat
adb logcat > logcat.txt
# Ctrl+C after reproducing issue

# Check Capacitor version
npx cap --version

# Check Android SDK
cd mobile/android
./gradlew --version
```

---

## 🚀 Quick Fixes Summary

| Issue | Quick Fix |
|-------|-----------|
| PDF won't load | `npm run sync:open` |
| Black screen | Tap Viewer tab manually |
| File picker doesn't open | Test on Android device, not browser |
| App crashes | Try smaller file (< 5MB) |
| Bottom nav broken | `rm -rf www && npm run dev && npx cap sync` |
| Gradle sync failed | File → Invalidate Caches / Restart |
| Changes not showing | `npm run sync` + Clean Project |
| JavaScript errors | Check `chrome://inspect` console |

---

## ✅ Verification Commands

Run these to verify everything is set up correctly:

```bash
# 1. Check files exist
ls mobile/www/mobile-file-handler.js
ls mobile/www/mobile-navigation.js
ls mobile/www/components/pdf-viewer.js

# 2. Check Android project
ls mobile/android/app/src/main/assets/public/

# 3. Verify Capacitor
npx cap doctor

# 4. Check device connected
adb devices

# 5. Test build
cd mobile/android
./gradlew assembleDebug
```

All should pass without errors! ✓

---

## 💡 Pro Tips

1. **Always sync after changes:** `npm run sync`
2. **Keep Chrome DevTools open** while testing
3. **Test with small files first** (< 1MB)
4. **Clear app data** if behavior is weird:
   - Settings → Apps → Grammar Highlighter → Storage → Clear Data
5. **Restart Android Studio** if Gradle acts up
6. **Use emulator with Google Play** for better compatibility

---

## 🆘 Still Stuck?

1. Read `MOBILE_UPDATES.md` for feature details
2. Check `SYNC_WORKFLOW.md` for sync process
3. Review `QUICK_SYNC_REFERENCE.md` for commands
4. Look at browser console for JavaScript errors
5. Check logcat for native Android errors

**Most issues are fixed by:**
```bash
cd mobile
rm -rf www android
npm run dev
npx cap add android
npx cap sync
npx cap open android
```

This rebuilds everything from scratch! 🔄

