# 📦 Installation Guide

## Prerequisites

Before you start, you need Node.js installed on your computer.

### Check if Node.js is Installed

Open Command Prompt or PowerShell and run:
```bash
node --version
npm --version
```

If you see version numbers (e.g., `v18.17.0`), you're good to go! ✅

### If Node.js is NOT Installed

**Download and Install Node.js:**
1. Go to: https://nodejs.org/
2. Download the **LTS version** (recommended)
3. Run the installer
4. Accept all defaults
5. Restart your computer after installation

**Verify installation:**
```bash
node --version
npm --version
```

## Installation Steps

### Step 1: Open Project in Terminal

**Option A: Using File Explorer**
1. Navigate to: `C:\Users\denver\Git\grammar-highlighter-desktop`
2. Hold `Shift` and right-click in the folder
3. Select "Open PowerShell window here" or "Open in Terminal"

**Option B: Using Command Prompt**
1. Press `Win+R`
2. Type: `cmd`
3. Press Enter
4. Type: `cd C:\Users\denver\Git\grammar-highlighter-desktop`
5. Press Enter

### Step 2: Install Dependencies

In the terminal, run:
```bash
npm install
```

**What this does:**
- Downloads Electron (~100MB)
- Downloads PDF.js
- Downloads Tesseract.js
- Downloads other dependencies

**Time:** 2-5 minutes depending on internet speed

**You should see:**
```
added 200+ packages in 2m
```

### Step 3: Verify Installation

Check that `node_modules` folder was created:
```bash
dir node_modules
```

You should see many folders.

### Step 4: Copy Compromise Library

The compromise.js file should already be in `lib/`. Verify:
```bash
dir lib\compromise.js
```

If it's missing, copy it manually from your extension project.

### Step 5: Start the App!

```bash
npm start
```

**The app window should open automatically!** 🎉

## Troubleshooting

### Error: "npm: command not found"

**Solution:** Node.js is not installed or not in PATH
1. Reinstall Node.js from https://nodejs.org/
2. Make sure to check "Add to PATH" during installation
3. Restart your terminal/computer

### Error: "Cannot find module 'electron'"

**Solution:** Dependencies not installed
```bash
npm install
```

### Error: "EACCES: permission denied"

**Solution:** Run as administrator or change folder permissions
```bash
npm install --unsafe-perm=true
```

### Error: "Network timeout"

**Solution:** Slow internet or firewall blocking
```bash
npm install --timeout=60000
```

### App window is blank

**Solution:** 
1. Press `Ctrl+Shift+I` to open DevTools
2. Check console for errors
3. Make sure `lib/compromise.js` exists

### "Cannot read property of undefined"

**Solution:** Check that all files are in correct locations:
```
grammar-highlighter-desktop/
├── electron-main.js ✓
├── package.json ✓
├── lib/
│   └── compromise.js ✓
├── src/
│   ├── index.html ✓
│   ├── styles.css ✓
│   ├── renderer.js ✓
│   └── components/
│       ├── pdf-viewer.js ✓
│       ├── text-analyzer.js ✓
│       └── stats-panel.js ✓
└── assets/
    └── icons/ ✓
```

## Uninstallation

To remove the app:
1. Delete the entire `grammar-highlighter-desktop` folder
2. That's it! No registry entries or hidden files.

To remove only dependencies (keep source code):
```bash
rmdir /s node_modules
```

## Next Steps

Once installation is complete:

1. **Start the app:** `npm start`
2. **Read the Quick Start:** See `QUICK_START.md`
3. **Test with a PDF:** Open any PDF and try the features
4. **Build executable:** See `SETUP_GUIDE.md` for creating `.exe` files

## Getting Help

**Check logs:**
1. Press `Ctrl+Shift+I` in the app
2. Go to "Console" tab
3. Look for red error messages

**Common issues:**
- Missing files → Re-download project
- Node errors → Reinstall Node.js
- Blank window → Check DevTools console

## System Requirements

- **OS:** Windows 10/11, macOS 10.13+, or Linux
- **RAM:** 4GB minimum (8GB recommended)
- **Disk:** 500MB free space
- **Internet:** Required for first-time setup only

---

**Ready to start? Run:** `npm start` 🚀

