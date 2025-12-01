# 🚀 Quick Start - Grammar Highlighter Desktop

## First Time Setup (One-time only)

### Step 1: Install Dependencies
Double-click on the project folder and open terminal, then run:
```bash
npm install
```
**Wait 2-3 minutes for installation to complete.**

### Step 2: Verify Setup
Check that these exist:
- ✅ `node_modules/` folder created
- ✅ `lib/compromise.js` exists
- ✅ `package.json` exists

## Running the App

### Method 1: Double-click (Windows)
Simply double-click: **`START_APP.bat`**

### Method 2: Terminal/Command Line
```bash
cd C:\Users\denver\Git\grammar-highlighter-desktop
npm start
```

### Method 3: VS Code
1. Open the project folder in VS Code
2. Press `` Ctrl+` `` to open terminal
3. Type: `npm start`
4. Press Enter

## First Use

1. **Open PDF**
   - Click "📂 Open PDF" button
   - Select any PDF file

2. **Extract Text**
   - Text-based PDF: Automatic extraction
   - Image-based PDF: Click "🔍 OCR Scan"

3. **Analyze**
   - Click "✨ Analyze Text"
   - Switch between views (Raw, Highlighted, Statistics)

4. **Explore Features**
   - Toggle highlighting options
   - Click on words in statistics to jump to them
   - Use PDF navigation controls

## Testing PDFs

Try these types:
- ✅ Regular text PDF (e.g., articles, papers)
- ✅ Image-based/scanned PDF (OCR will extract)
- ✅ Multi-page documents
- ✅ Academic papers with technical terms

## Keyboard Shortcuts

- `Ctrl+O` - Open file (coming soon)
- `Ctrl+S` - Save analysis (coming soon)
- `Ctrl+Shift+I` - Open DevTools (for debugging)

## Need Help?

**Error during npm install?**
- Make sure Node.js is installed: `node --version`
- Try: `npm cache clean --force` then `npm install` again

**App won't start?**
- Check console for errors
- Make sure `lib/compromise.js` exists
- Try deleting `node_modules/` and running `npm install` again

**No text extracted?**
- PDF might be image-based - use OCR
- Check if text is selectable in other PDF viewers

## What's Next?

1. ✅ Read `README.md` for full documentation
2. ✅ Check `FEATURES.md` to see what's new vs the extension
3. ✅ Read `SETUP_GUIDE.md` for building executables

---

**Enjoy your new desktop app! 🎉📚**

*No more browser limitations - full PDF analysis power in your hands!*

