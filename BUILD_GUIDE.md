# Build & Release Guide

## Building Locally

### Prerequisites
- Node.js 16+ installed
- npm package manager
- Git

### Build Commands

**Windows:**
```bash
npm run build:win
```

**macOS (requires Mac):**
```bash
npm run build:mac
```

**Linux:**
```bash
npm run build:linux
```

**All platforms:**
```bash
npm run build
```

### Output Location
Built installers will be in the `dist/` folder:
- Windows: `Grammar Highlighter Setup 1.0.0.exe`
- macOS: `Grammar Highlighter-1.0.0.dmg`
- Linux: `Grammar Highlighter-1.0.0.AppImage`

---

## Common Build Issues & Solutions

### Issue 1: "npm: command not found"
**Problem:** npm is not in your PATH

**Solution:**
1. Restart your terminal
2. Verify Node.js is installed: `node --version`
3. Reinstall Node.js from https://nodejs.org/

### Issue 2: "electron-builder not found"
**Problem:** Dependencies not installed

**Solution:**
```bash
npm install
```

### Issue 3: Build fails with "ENOSPC: no space left on device"
**Problem:** Not enough disk space

**Solution:**
- Free up at least 2GB of disk space
- Clean npm cache: `npm cache clean --force`

### Issue 4: Windows build fails with icon error
**Problem:** Icon file missing or corrupt

**Solution:**
- Ensure `assets/icons/icon.ico` exists
- Or comment out the icon line in `package.json`

### Issue 5: macOS build fails on Windows
**Problem:** Can't build macOS apps on Windows

**Solution:**
- Use the GitHub Actions workflow (builds on all platforms automatically)
- Or use a Mac for building
- Or use a cloud Mac service

### Issue 6: "Cannot find module 'compromise'"
**Problem:** node_modules missing

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue 7: Build succeeds but app won't start
**Problem:** Missing dependencies in build

**Solution:**
- Check `package.json` has all dependencies listed
- Ensure `config.js` exists (copy from `config.example.js`)

### Issue 8: "Error: EPERM: operation not permitted"
**Problem:** File permissions or antivirus blocking

**Solution:**
- Run terminal as Administrator (Windows)
- Temporarily disable antivirus
- Close the app if it's running

---

## Using GitHub Actions (Automated Builds)

### Setup (One-time)
1. Push the `.github/workflows/build-release.yml` file to your repo
2. That's it! GitHub will handle the rest.

### Creating a Release with GitHub Actions

1. **Create and push a version tag:**
```bash
git tag v1.0.0
git push origin v1.0.0
```

2. **GitHub Actions will automatically:**
   - Build Windows, macOS, and Linux versions
   - Run tests
   - Create a GitHub Release
   - Attach all installers to the release

3. **Monitor progress:**
   - Go to your repo → Actions tab
   - Watch the build progress
   - Takes about 10-15 minutes

4. **Release is ready:**
   - Go to Releases → you'll see your new release
   - All installers are attached
   - Your website download button will auto-update!

### Advantages of GitHub Actions
- ✅ Builds all platforms automatically
- ✅ No need for Mac hardware
- ✅ Consistent builds every time
- ✅ Free for public repositories
- ✅ Automatic release creation

---

## Manual Release Process (Without GitHub Actions)

### Step 1: Build Locally
```bash
npm run build:win
```

### Step 2: Test the Installer
1. Go to `dist/` folder
2. Run the `.exe` installer
3. Test the app works correctly
4. Uninstall and test again

### Step 3: Create GitHub Release
1. Go to https://github.com/dnaicker/Document-X-Ray-Analyzer/releases
2. Click "Draft a new release"
3. Create tag: `v1.0.0`
4. Title: `v1.0.0 - Initial Release`
5. Description: Copy from `RELEASE_NOTES_v1.0.0.md`
6. Upload the `.exe` file from `dist/`
7. Click "Publish release"

### Step 4: Verify
1. Go to your website: https://dnaicker.github.io/Document-X-Ray-Analyzer
2. Click the download button
3. Verify it downloads your new release

---

## Updating Version Numbers

Before building a new release:

1. **Update `package.json`:**
```json
{
  "version": "1.0.1"
}
```

2. **Commit the change:**
```bash
git add package.json
git commit -m "Bump version to 1.0.1"
git push
```

3. **Create and push tag:**
```bash
git tag v1.0.1
git push origin v1.0.1
```

4. **GitHub Actions builds automatically** (if using workflow)

---

## Build Configuration

### Customizing the Build

Edit `package.json` → `build` section:

```json
"build": {
  "appId": "com.grammarhighlighter.desktop",
  "productName": "Grammar Highlighter",
  "win": {
    "target": "nsis",
    "icon": "assets/icons/icon.ico"
  }
}
```

### Adding Code Signing (Optional)

For Windows:
```json
"win": {
  "certificateFile": "path/to/cert.pfx",
  "certificatePassword": "password"
}
```

For macOS:
```json
"mac": {
  "identity": "Developer ID Application: Your Name"
}
```

---

## Getting Help

If you encounter issues not covered here:

1. Check electron-builder docs: https://www.electron.build/
2. Open an issue: https://github.com/dnaicker/Document-X-Ray-Analyzer/issues
3. Check GitHub Actions logs (if using workflow)

---

**Happy Building! 🚀**

