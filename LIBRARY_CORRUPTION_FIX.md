# Library Corruption Fix

## Problem
After importing a source code folder, the library became corrupted with circular references (folder A contains folder B, and folder B contains folder A), causing the app to crash with "Maximum call stack size exceeded" errors.

## Solution Implemented

### 1. **Circular Reference Protection in Rendering**
- Added a `visited` Set to track which folders have been rendered in the current tree path
- Modified `renderFolder()` to check if a folder has already been visited before rendering
- Modified `folderMatchesSearch()` to prevent infinite recursion during search operations
- All recursive methods now skip folders that would create circular references

### 2. **Enhanced Cleanup on Load**
- Improved `cleanupFolderStructure()` in `library-manager.js` to detect and remove:
  - Self-references (folder containing itself)
  - Invalid child references (references to non-existent folders)
  - Circular references (A → B → A)
  - Duplicate children
- Cleanup runs automatically when the library is loaded from localStorage

### 3. **Manual Repair Tool**
- Added a "🔧 Repair" button to the library header (orange button)
- Click to manually trigger cleanup of corrupted folder structures
- Shows confirmation before repair and results after completion
- Useful when automatic cleanup isn't enough or corruption happens during runtime

## How to Fix Your Library Right Now

### IMMEDIATE FIX (Do This First!)
Since your app is currently broken and showing errors:

1. **Close the app completely** (if it's running)
2. **Restart the app** - The enhanced cleanup will run automatically on load
3. Once loaded, click the **🔧 Repair** button in the library header (orange button)
4. Confirm the repair operation
5. The library will be cleaned and refreshed
6. Your library should now work normally!

### If the App Won't Load At All
If the app crashes immediately on startup:

### Manual Fix (if app won't start)
If the app won't load at all due to corruption:

1. Open Developer Tools (F12 or Ctrl+Shift+I)
2. Go to the Console tab
3. Run this command:
```javascript
localStorage.removeItem('grammar-highlighter-library');
location.reload();
```

This will reset your library to the default state. **Warning: This will delete all your library data.**

### Better Alternative - Export Before Reset
If you want to save some data before reset:

1. Open Developer Tools (F12)
2. Go to Console
3. Export your library data:
```javascript
const library = JSON.parse(localStorage.getItem('grammar-highlighter-library'));
console.log(JSON.stringify(library, null, 2));
```
4. Copy the output
5. Save it to a file for later manual recovery if needed

## Preventing Future Corruption

### Automatic Protections (Now Implemented)
1. **Symlink Detection**: The folder scanner now automatically skips symbolic links to prevent circular references
2. **Path Tracking**: The scanner tracks visited directories and skips already-visited paths
3. **Enhanced Skip List**: Common problematic directories are automatically excluded:
   - Development: `node_modules`, `.git`, `.svn`, `.hg`, `.vscode`, `.cursor`, `.idea`, `.vs`
   - Build outputs: `dist`, `build`, `out`, `target`, `bin`, `obj`, `Debug`, `Release`
   - Virtual environments: `__pycache__`, `.venv`, `venv`
   - Engine folders: `.godot`, `.import`

### Best Practices
1. **Use the Repair button** if you notice slow performance or errors
2. **Avoid importing the same folder multiple times** without removing it first
3. **Import source code projects safely** - the scanner will automatically skip common problematic directories
4. **Regular cleanup** - Use the 🔧 Repair button periodically to maintain library health

## Technical Details

### Files Modified
- `src/components/library-ui.js`
  - Added `visited` parameter to `renderFolderTree()`, `renderFolder()`, and `folderMatchesSearch()`
  - Added circular reference detection before rendering each folder
  - Added `repairLibrary()` method for manual cleanup
  
- `src/components/library-manager.js`
  - Enhanced `cleanupFolderStructure()` with better circular reference detection
  - Added duplicate removal
  - Added `manualCleanup()` method for UI-triggered repairs

### What the Fix Does
1. **On Load**: Automatically detects and removes circular references
2. **During Render**: Skips folders that would cause infinite loops
3. **On Demand**: Manual repair button for when automatic fixes aren't enough

## Testing the Fix
After the fix is applied:
1. The app should load without "Maximum call stack size exceeded" errors
2. You should be able to expand folders normally
3. The library tree should render completely
4. Search functionality should work without crashes

If you still see issues after using the repair button, you may need to manually remove the problematic folder from your library and re-import it more carefully.

