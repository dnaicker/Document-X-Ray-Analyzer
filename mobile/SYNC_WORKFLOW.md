# Desktop → Mobile Sync Workflow

This guide explains how to bring changes from the desktop app to the mobile version.

## 📋 Quick Reference

```bash
# From mobile/ directory
npm run dev          # Copy changes
npx cap sync         # Update Android project
npx cap open android # Open in Android Studio
# Then click Run ▶️
```

---

## 🔄 Complete Workflow

### Scenario 1: You Changed Shared Files (Most Common)

**Changed files in:**
- `src/components/` (any component)
- `src/renderer.js`
- `src/styles.css`
- `lib/` (libraries)
- `assets/` (images, icons)

**Steps:**

1. **Save your desktop changes** (optional but recommended)
   ```bash
   cd c:/Users/denver/Git/grammar-highlighter-desktop
   git add .
   git commit -m "Updated feature X"
   ```

2. **Navigate to mobile directory**
   ```bash
   cd mobile
   ```

3. **Copy updated files**
   ```bash
   npm run dev
   ```
   This copies:
   - `../src/*` → `www/`
   - `../lib/*` → `www/lib/`
   - `../assets/*` → `www/assets/`
   - Mobile overrides from `src/` → `www/`

4. **Sync to Android**
   ```bash
   npx cap sync
   ```
   This updates the Android project with new files.

5. **Test in Android Studio**
   ```bash
   npx cap open android
   ```
   Click the Run button (▶️) to test changes.

---

### Scenario 2: You Only Changed Desktop-Specific Files

**Changed files in:**
- `electron-main.js`
- Desktop-only menus or windows

**Steps:**

**Nothing needed!** These files are only for Electron and don't affect mobile. ✅

---

### Scenario 3: You Added New Files to Desktop

**Added:**
- New component in `src/components/new-component.js`
- New library in `lib/`
- New assets in `assets/`

**Steps:**

Same as Scenario 1:
```bash
cd mobile
npm run dev       # Copies new files
npx cap sync      # Syncs to Android
```

If you added **new script tags** in `index.html`, you may need to update `mobile/src/mobile-index.html` too.

---

### Scenario 4: You Changed HTML Structure

**Changed:**
- `src/index.html` (added/removed elements)

**Steps:**

1. **Copy files as usual**
   ```bash
   cd mobile
   npm run dev
   npx cap sync
   ```

2. **Check if mobile layout needs adjustment**
   - Open `mobile/src/mobile-index.html`
   - Verify the changes work with bottom navigation
   - Test responsive layout

3. **If needed, update mobile-specific styles**
   ```bash
   # Edit mobile/src/mobile-styles.css
   # Add responsive overrides for new elements
   ```

4. **Re-sync**
   ```bash
   npm run dev
   npx cap sync
   ```

---

## 🎯 Step-by-Step Example

Let's say you fixed a bug in `text-analyzer.js`:

### Before (Desktop has bug, Mobile has old version)
```
src/components/text-analyzer.js  ← Fixed bug here ✅
mobile/www/components/text-analyzer.js  ← Still has bug ❌
```

### Step 1: Copy Changes
```bash
cd mobile
npm run dev
```

### After Copy
```
src/components/text-analyzer.js  ← Fixed ✅
mobile/www/components/text-analyzer.js  ← Now fixed! ✅
```

### Step 2: Sync to Android
```bash
npx cap sync
```

### Step 3: Test
```bash
npx cap open android
# Click Run in Android Studio
```

### Result
Mobile app now has the bug fix! 🎉

---

## 🚀 Development Workflow Recommendations

### Option A: Active Mobile Development

If you're actively working on mobile:

1. **Make changes** in desktop `src/` files
2. **Test on desktop** (quick iteration)
   ```bash
   npm start
   ```
3. **When satisfied, sync to mobile**
   ```bash
   cd mobile
   npm run dev
   npx cap sync
   ```
4. **Test on mobile**

### Option B: Periodic Mobile Updates

If mobile is stable and you're mainly on desktop:

1. **Work on desktop** for days/weeks
2. **Periodically sync to mobile** (weekly?)
   ```bash
   cd mobile
   npm run dev
   npx cap sync
   ```
3. **Test mobile** to ensure nothing broke

---

## 🔍 What Each Command Does

### `npm run dev`
- **What it does**: Copies files from desktop to mobile
- **Files affected**: `www/` directory
- **When to run**: After changing any shared files
- **Time**: ~1-2 seconds

### `npx cap sync`
- **What it does**: Syncs `www/` to Android project
- **Files affected**: `android/app/src/main/assets/public/`
- **When to run**: After `npm run dev`
- **Time**: ~3-5 seconds

### `npx cap open android`
- **What it does**: Opens Android Studio
- **When to run**: When you want to test/debug
- **Time**: Instant (just opens IDE)

---

## 🛠️ Advanced: Automated Sync

For frequent updates, you can automate the process:

### Create a sync script:

**File: `mobile/quick-sync.sh`**
```bash
#!/bin/bash
echo "🔄 Syncing desktop changes to mobile..."
npm run dev && npx cap sync && echo "✅ Sync complete!"
```

**Usage:**
```bash
cd mobile
chmod +x quick-sync.sh
./quick-sync.sh
```

Or add to package.json:
```json
"scripts": {
  "sync": "npm run dev && npx cap sync",
  "sync-and-open": "npm run dev && npx cap sync && npx cap open android"
}
```

**Then just run:**
```bash
npm run sync-and-open
```

---

## 📊 File Change Matrix

| Changed File | Copy Needed? | Sync Needed? | Mobile Rebuild? |
|--------------|--------------|--------------|-----------------|
| `src/components/*.js` | ✅ Yes | ✅ Yes | No* |
| `src/styles.css` | ✅ Yes | ✅ Yes | No* |
| `src/renderer.js` | ✅ Yes | ✅ Yes | No* |
| `lib/*.js` | ✅ Yes | ✅ Yes | No* |
| `assets/**` | ✅ Yes | ✅ Yes | No* |
| `electron-main.js` | ❌ No | ❌ No | ❌ No |
| `package.json` (root) | ❌ No | ❌ No | ❌ No |
| `mobile/src/mobile-styles.css` | ⚠️ Already in mobile | ✅ Yes | No* |
| `mobile/capacitor.config.json` | N/A | ✅ Yes | ✅ Yes |
| `mobile/android/**` | ❌ No | N/A | ✅ Yes |

*No rebuild needed - Android Studio will hot-reload changes if app is running

---

## 🐛 Troubleshooting

### Changes Not Appearing on Mobile

**Problem:** Updated desktop files but mobile still shows old version.

**Solution:**
```bash
cd mobile
npm run dev        # Ensure files are copied
npx cap sync       # Ensure synced to Android
# In Android Studio: Build → Clean Project → Rebuild Project
```

### "File not found" errors on mobile

**Problem:** New file added to desktop but mobile can't find it.

**Solution:**
```bash
cd mobile
npm run dev        # Copy new files
npx cap sync       # Sync to Android

# If still not working, check:
ls www/components/  # Verify file is in www/
```

### Mobile layout broken after desktop changes

**Problem:** Desktop HTML changes broke mobile responsive design.

**Solution:**
1. Check `mobile/src/mobile-styles.css` for overrides
2. Add responsive fixes:
   ```css
   @media screen and (max-width: 768px) {
     .new-element {
       /* Mobile-specific styles */
     }
   }
   ```
3. Re-sync:
   ```bash
   npm run dev
   npx cap sync
   ```

---

## 💡 Best Practices

### ✅ DO:
1. **Test on desktop first** - Faster iteration
2. **Sync regularly** - Don't let mobile fall too far behind
3. **Use version control** - Commit before syncing
4. **Test mobile after sync** - Ensure nothing broke
5. **Document mobile-specific changes** - Comment why something is different

### ❌ DON'T:
1. **Don't edit files in `www/` directly** - They get overwritten
2. **Don't edit Android Java/Kotlin** unless you know what you're doing
3. **Don't forget to sync** - Easy to forget `npx cap sync`
4. **Don't skip mobile testing** - Desktop ≠ Mobile performance

---

## 📝 Sync Checklist

When syncing desktop changes to mobile:

- [ ] Desktop changes tested and working
- [ ] Committed to git (optional but recommended)
- [ ] Navigated to `mobile/` directory
- [ ] Ran `npm run dev` (files copied)
- [ ] Ran `npx cap sync` (synced to Android)
- [ ] Opened in Android Studio
- [ ] Tested on emulator/device
- [ ] Verified all features work
- [ ] Checked responsive layout
- [ ] Tested touch interactions

---

## 🎓 Summary

**Most common workflow:**
```bash
# 1. Make changes to desktop app
code src/components/something.js

# 2. Test on desktop
npm start

# 3. Sync to mobile
cd mobile
npm run dev
npx cap sync

# 4. Test on mobile
npx cap open android
# Click Run ▶️
```

**That's it!** 🚀

---

## 📚 Related Documentation

- `README.md` - Full mobile setup guide
- `INTEGRATION_GUIDE.md` - Desktop/Mobile code sharing
- `MOBILE_FEATURES.md` - Mobile-specific features
- `QUICK_START.md` - Quick setup guide

---

**Quick Command Reference:**
```bash
npm run dev           # Copy desktop → mobile
npx cap sync          # Sync to Android
npx cap open android  # Open Android Studio
```

Keep this workflow handy! 📌

