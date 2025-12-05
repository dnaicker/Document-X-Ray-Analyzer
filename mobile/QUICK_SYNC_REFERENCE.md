# 🚀 Quick Sync Reference Card

## Most Common: Changed Shared Files

When you change files in `src/`, `lib/`, or `assets/`:

```bash
cd mobile
npm run dev && npx cap sync
```

Then in Android Studio: Click Run ▶️

---

## Three Simple Commands

### 1️⃣ Copy Changes
```bash
npm run dev
```
Copies desktop files to mobile `www/` folder

### 2️⃣ Sync to Android
```bash
npx cap sync
```
Updates Android project with new files

### 3️⃣ Test
```bash
npx cap open android
```
Opens Android Studio to run the app

---

## One-Line Sync & Run

```bash
npm run dev && npx cap sync && npx cap open android
```

---

## When Do I Need to Sync?

| You Changed... | Run This |
|----------------|----------|
| Any file in `src/components/` | `npm run dev && npx cap sync` |
| `src/styles.css` | `npm run dev && npx cap sync` |
| `src/renderer.js` | `npm run dev && npx cap sync` |
| Files in `lib/` | `npm run dev && npx cap sync` |
| Files in `assets/` | `npm run dev && npx cap sync` |
| `electron-main.js` | ❌ Nothing (desktop only) |
| Mobile-specific CSS | `npx cap sync` only |

---

## Typical Development Flow

```bash
# 1. Work on desktop (fast iteration)
npm start

# 2. When ready, sync to mobile
cd mobile
npm run dev && npx cap sync

# 3. Test on mobile
npx cap open android
# Click Run ▶️
```

---

## If Changes Don't Appear

```bash
# Clean and rebuild
cd mobile
rm -rf www
npm run dev
npx cap sync
# In Android Studio: Build → Clean Project → Rebuild
```

---

## Quick Troubleshooting

**Changes not showing?**
→ Did you run `npm run dev`?
→ Did you run `npx cap sync`?
→ Try: Build → Clean Project in Android Studio

**App crashes on mobile?**
→ Check Chrome DevTools: `chrome://inspect`
→ Check logcat: `adb logcat | grep Capacitor`

**Gradle sync failed?**
→ File → Invalidate Caches / Restart
→ File → Sync Project with Gradle Files

---

## Bookmark These Commands

```bash
# Full workflow
cd mobile && npm run dev && npx cap sync && npx cap open android

# Just sync
cd mobile && npm run dev && npx cap sync

# View logs
adb logcat | grep Capacitor

# Debug in browser
chrome://inspect
```

---

## File Structure Quick View

```
project-root/
├── src/              ← Edit here (shared)
├── lib/              ← Edit here (shared)  
├── assets/           ← Edit here (shared)
├── electron-main.js  ← Desktop only
└── mobile/
    ├── src/          ← Mobile overrides
    ├── www/          ← Generated (don't edit!)
    └── android/      ← Generated (don't edit!)
```

---

**Need more details?** See `SYNC_WORKFLOW.md` for complete guide.

**Print this page and keep it handy!** 📌

