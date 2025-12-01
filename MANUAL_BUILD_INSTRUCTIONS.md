# Manual Build Instructions (Temporary)

Since GitHub Actions is having issues, let's build locally for now:

## Build Windows Installer Locally

1. **Open your terminal** (where npm works - looks like terminal 3)

2. **Run the build command:**
```bash
npm run build:win
```

3. **Wait for the build** (takes 2-5 minutes)

4. **Find the installer:**
   - Look in the `dist/` folder
   - You should see `Grammar Highlighter Setup 1.0.0.exe`

5. **Test it:**
   - Run the installer
   - Make sure the app works
   - Uninstall and test again

6. **Upload to GitHub Release manually:**
   - Go to https://github.com/dnaicker/Document-X-Ray-Analyzer/releases
   - Click "Draft a new release"
   - Tag: `v1.0.0`
   - Title: `v1.0.0 - Initial Release`
   - Description: Copy from `RELEASE_NOTES_v1.0.0.md`
   - Drag and drop the `.exe` file
   - Click "Publish release"

## Common Local Build Errors

### Error: "Cannot find module 'electron'"
**Fix:**
```bash
npm install
```

### Error: "ENOENT: no such file or directory"
**Fix:** Make sure you're in the project root directory

### Error: Build succeeds but creates no files
**Fix:** Check the `dist/` folder - it might be there but hidden

---

## For macOS/Linux (Future)

Since you don't have a Mac, you have two options:

1. **Wait for GitHub Actions fix** (we'll figure it out)
2. **Windows only for now** - perfectly fine for v1.0.0

Most users are on Windows anyway, so releasing Windows-only first is totally acceptable!

---

Let me know if the local build works and I'll help troubleshoot the GitHub Actions issue separately.

