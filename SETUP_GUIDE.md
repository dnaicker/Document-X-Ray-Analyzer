# Setup Guide - Grammar Highlighter Desktop

## 📋 Quick Setup Checklist

Follow these steps to get your desktop app running:

### ✅ Step 1: Verify Project Structure

Make sure you have these folders:
```
grammar-highlighter-desktop/
├── lib/
├── assets/icons/
└── src/components/
```

### ✅ Step 2: Install Node Dependencies

Open a terminal in the project folder and run:

```bash
cd C:\Users\denver\Git\grammar-highlighter-desktop
npm install
```

This will install:
- Electron (desktop framework)
- Electron Builder (for creating executables)
- PDF.js (PDF rendering)
- Tesseract.js (OCR)

**Installation time:** ~2-3 minutes

### ✅ Step 3: Copy Libraries

The `compromise.js` file should already be copied, but verify:

**Check if exists:**
```bash
ls lib/compromise.js
```

**If missing, copy manually:**
```bash
cp ../pos-highlighter-click/lib/compromise.js lib/
```

### ✅ Step 4: Add App Icon

Copy your logo:
```bash
cp ../pos-highlighter-click/icons/grammar_highlighter_logo.jpg assets/icons/icon.png
```

### ✅ Step 5: Run the App!

```bash
npm start
```

The app should open in a new window!

## 🎮 First Run

1. Click **"📂 Open PDF"**
2. Select any PDF file
3. Wait for text extraction
4. Click **"✨ Analyze Text"**
5. Explore the three views:
   - Raw Text
   - Highlighted
   - Statistics

## 🐛 Troubleshooting

### "Cannot find module 'electron'"
**Solution:** Run `npm install` again

### "compromise.js not found"
**Solution:** Copy from extension project:
```bash
cp ../pos-highlighter-click/lib/compromise.js lib/
```

### PDF.js worker error
**Solution:** The app uses CDN for PDF.js worker, ensure internet connection on first run

### OCR doesn't work
**Solution:** OCR downloads Tesseract on first use, requires internet

## 🏗️ Building Executables

### Windows .exe
```bash
npm run build:win
```
Output: `dist/Grammar Highlighter Setup.exe`

### macOS .dmg
```bash
npm run build:mac
```
Output: `dist/Grammar Highlighter.dmg`

### Linux AppImage
```bash
npm run build:linux
```
Output: `dist/Grammar Highlighter.AppImage`

**Build time:** ~5-10 minutes per platform

## 📦 Distribution

Executables in `dist/` folder are standalone and can be:
- Shared with others
- Installed on any compatible system
- Run without Node.js or npm

## 🎨 Customization

### Change App Name
Edit `package.json`:
```json
"productName": "Your App Name"
```

### Change Icon
Replace files in `assets/icons/`:
- `icon.ico` (Windows)
- `icon.icns` (macOS)
- `icon.png` (Linux)

### Adjust Window Size
Edit `electron-main.js`:
```javascript
width: 1400,  // Change width
height: 900   // Change height
```

## 🚀 Next Steps

1. **Test with different PDFs**
   - Text-based PDFs
   - Image-based PDFs (OCR)
   - Multi-page documents

2. **Customize highlighting colors**
   - Edit `src/styles.css`
   - Modify `.highlight-*` classes

3. **Add new features**
   - The codebase is modular and easy to extend
   - See component files in `src/components/`

## 💡 Tips

- **Development:** Use `npm start` for instant feedback
- **Production:** Use `npm run build` for distributable executables
- **Debugging:** Open DevTools with Ctrl+Shift+I (Windows/Linux) or Cmd+Option+I (macOS)

## 📖 Learn More

- [Electron Documentation](https://www.electronjs.org/docs)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [Compromise.js Documentation](https://github.com/spencermountain/compromise)

---

**Need help?** Check the main README.md or console logs for error details.

**Ready to start?** Run `npm start` and enjoy! 🎉

