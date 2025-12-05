# Integration Guide: Desktop ↔️ Mobile

This guide explains how the mobile and desktop versions work together while remaining separate.

## 🏗️ Architecture Overview

```
grammar-highlighter-desktop/
│
├── electron-main.js          ← Desktop: Electron main process
├── src/                      ← SHARED: Core application code
│   ├── index.html           ← Desktop HTML
│   ├── renderer.js          ← Shared renderer logic
│   ├── styles.css           ← Desktop styles (base)
│   └── components/          ← Shared components
│       ├── pdf-viewer.js
│       ├── text-analyzer.js
│       ├── notes-manager.js
│       └── ...
│
├── lib/                      ← SHARED: Libraries
│   └── compromise.js
│
├── assets/                   ← SHARED: Images, icons
│
└── mobile/                   ← MOBILE: Separate project
    ├── package.json         ← Mobile dependencies
    ├── capacitor.config.json
    ├── android/             ← Generated Android project
    ├── www/                 ← Generated (copied from src/)
    └── src/                 ← Mobile-specific overrides
        ├── capacitor-bridge.js    ← API bridge
        ├── mobile-styles.css      ← Mobile CSS overrides
        ├── mobile-index.html      ← Mobile HTML
        └── mobile-navigation.js   ← Bottom nav controller
```

## 🔄 Code Sharing Strategy

### Shared Components (90% of code)

These files are used by BOTH desktop and mobile:

```
src/components/
├── pdf-viewer.js          ✅ Works on both
├── epub-reader.js         ✅ Works on both
├── docx-reader.js         ✅ Works on both
├── text-analyzer.js       ✅ Works on both
├── stats-panel.js         ✅ Works on both
├── notes-manager.js       ✅ Works on both
├── translation-service.js ✅ Works on both
├── library-manager.js     ✅ Works on both
└── ...                    ✅ All work on both!
```

**How it works:**
- These components are platform-agnostic
- They use web APIs only (no Node.js, no Electron)
- Mobile project copies them to `www/` during build

### Platform-Specific Code (10% of code)

#### Desktop Only
- `electron-main.js` - Electron main process
- Native menu bar
- File system access via Node.js
- Window management

#### Mobile Only
- `capacitor-bridge.js` - API adapter
- `mobile-styles.css` - Responsive overrides
- `mobile-navigation.js` - Bottom nav
- Android-specific permissions

## 🔌 API Bridge Pattern

The bridge allows shared code to work on both platforms:

### Desktop (Electron)
```javascript
// In shared component
const { ipcRenderer } = require('electron');
const result = await ipcRenderer.invoke('dialog:openFile');
```

### Mobile (Capacitor Bridge)
```javascript
// In shared component (with bridge)
import bridge from './capacitor-bridge.js';
const result = await bridge.fileSystem.openFile();
```

The bridge automatically detects the platform and uses the correct API!

## 📝 Workflow Examples

### Example 1: Adding a New Feature (Both Platforms)

**Goal**: Add a "word count per page" feature

1. **Edit shared component**:
   ```bash
   # Edit in src/components/text-analyzer.js
   vim ../src/components/text-analyzer.js
   ```

2. **Test on desktop**:
   ```bash
   cd ..
   npm start
   ```

3. **Copy to mobile**:
   ```bash
   cd mobile
   npm run dev
   npx cap sync
   ```

4. **Test on mobile**:
   ```bash
   npx cap open android
   # Run in Android Studio
   ```

✅ Feature works on both platforms!

### Example 2: Mobile-Only Feature

**Goal**: Add haptic feedback on button press (mobile only)

1. **Edit mobile navigation**:
   ```javascript
   // mobile/src/mobile-navigation.js
   import { Haptics } from '@capacitor/haptics';
   
   button.addEventListener('click', async () => {
     await Haptics.impact({ style: 'light' });
     // ... rest of logic
   });
   ```

2. **Test on mobile**:
   ```bash
   npm run build
   npx cap open android
   ```

✅ Feature only affects mobile, desktop unchanged!

### Example 3: Fixing a Desktop-Only Bug

**Goal**: Fix window minimize issue (desktop only)

1. **Edit Electron main**:
   ```javascript
   // electron-main.js (in project root)
   mainWindow.on('minimize', () => {
     // Fix here
   });
   ```

2. **Test on desktop**:
   ```bash
   cd .. # Back to root
   npm start
   ```

✅ Desktop fixed, mobile unaffected!

## 🎯 Best Practices

### DO ✅

1. **Write platform-agnostic code when possible**
   ```javascript
   // Good: Works everywhere
   const text = document.getElementById('text').textContent;
   
   // Good: Conditional platform code
   if (window.require) {
     // Desktop
   } else {
     // Mobile
   }
   ```

2. **Use the Capacitor bridge for file operations**
   ```javascript
   import bridge from './capacitor-bridge.js';
   const file = await bridge.fileSystem.openFile();
   ```

3. **Test on both platforms after changes**
   - Desktop: Quick iteration
   - Mobile: Real device testing

4. **Use responsive CSS for layout differences**
   ```css
   /* Desktop */
   .panel { width: 300px; }
   
   /* Mobile override */
   @media (max-width: 768px) {
     .panel { width: 100%; }
   }
   ```

### DON'T ❌

1. **Don't use Node.js modules in shared components**
   ```javascript
   // Bad: Won't work on mobile
   const fs = require('fs');
   
   // Good: Use bridge instead
   import bridge from './capacitor-bridge.js';
   ```

2. **Don't hardcode desktop-only features**
   ```javascript
   // Bad
   ipcRenderer.invoke('something');
   
   // Good
   if (window.require) {
     ipcRenderer.invoke('something');
   }
   ```

3. **Don't forget to sync after changes**
   ```bash
   # Always run after editing mobile files
   npm run build
   ```

## 🔍 Detecting Platform

Several ways to detect the current platform:

### Method 1: Check for Electron
```javascript
const isDesktop = !!window.require;
const isMobile = !window.require;
```

### Method 2: Check for Capacitor
```javascript
const isMobile = !!window.Capacitor;
const isDesktop = !window.Capacitor;
```

### Method 3: Screen Size (for responsive behavior)
```javascript
const isMobileLayout = window.innerWidth <= 768;
```

### Method 4: User Agent (less reliable)
```javascript
const isAndroid = /Android/i.test(navigator.userAgent);
```

### Best Practice: Use Bridge
```javascript
import bridge from './capacitor-bridge.js';

if (bridge.isMobile) {
  // Mobile behavior
} else {
  // Desktop behavior
}
```

## 🧪 Testing Strategy

### Unit Tests
- Test shared components in isolation
- Mock platform APIs
- Run same tests on both platforms

### Integration Tests
```bash
# Desktop
npm start
# Manual testing

# Mobile
cd mobile
npm run build
npx cap open android
# Manual testing in emulator
```

### Cross-Platform Checklist

Test these on BOTH platforms:
- [ ] Open PDF file
- [ ] Text extraction
- [ ] Grammar highlighting
- [ ] Add/edit notes
- [ ] Export notes
- [ ] Statistics display
- [ ] Search functionality
- [ ] Library management
- [ ] Translation (if configured)

## 📦 Deployment

### Desktop Release
```bash
# From project root
npm run build:win     # Windows
npm run build:mac     # macOS
npm run build:linux   # Linux
```

### Mobile Release
```bash
# From mobile directory
cd mobile
npm run build
cd android
./gradlew assembleRelease
```

Both can be released independently!

## 🔄 Keeping in Sync

### When You Update Desktop
```bash
# Desktop changes
cd grammar-highlighter-desktop
git commit -m "Update feature X"

# Sync to mobile
cd mobile
npm run dev      # Copy updated files
npx cap sync     # Sync to Android
# Test on mobile
```

### When You Update Mobile
```bash
# Mobile-only changes (already in mobile/)
cd mobile
git commit -m "Add mobile feature Y"
# Desktop is unaffected ✅
```

### When You Update Shared Components
```bash
# Edit in src/
vim src/components/some-component.js

# Test desktop
npm start

# Test mobile
cd mobile
npm run dev
npx cap open android
```

## 🎓 Advanced: Custom Native Plugins

If you need Android-specific native functionality:

1. **Create Capacitor plugin**:
   ```bash
   npm install @capacitor/cli
   npx cap plugin:generate
   ```

2. **Implement in Java/Kotlin**:
   ```java
   // Android native code
   ```

3. **Use in JavaScript**:
   ```javascript
   import { MyPlugin } from 'my-plugin';
   const result = await MyPlugin.doSomething();
   ```

4. **Stub for desktop**:
   ```javascript
   if (bridge.isMobile) {
     await MyPlugin.doSomething();
   } else {
     console.log('Not available on desktop');
   }
   ```

## 📚 Further Reading

- [Capacitor vs Electron](https://capacitorjs.com/docs/guides/electron-to-capacitor)
- [Progressive Enhancement](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement)
- [Responsive Design Patterns](https://web.dev/patterns/)

## 🆘 Troubleshooting

### "Module not found" on mobile
- Ensure file is copied: `npm run dev`
- Check www/ directory exists
- Verify import paths

### Feature works on desktop but not mobile
- Check browser console in Chrome DevTools
- Verify no Node.js dependencies
- Test Capacitor plugin is installed

### Layout broken on mobile
- Check mobile-styles.css is loaded
- Verify @media queries
- Test on real device (emulator may differ)

### File operations failing
- Use capacitor-bridge.js
- Check Android permissions
- Test with small files first

## 💡 Tips for Smooth Development

1. **Keep a device/emulator running**: Faster testing
2. **Use Chrome inspect**: Essential for debugging mobile web content
3. **Git ignore generated files**: android/, www/ shouldn't be committed
4. **Version lock dependencies**: Prevents build issues
5. **Document platform differences**: Help future developers

---

Now you have a complete understanding of how the desktop and mobile versions work together! 🚀

