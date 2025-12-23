# Folder Delete Fix - Moving to Unfiled

## Problem
When trying to delete a folder, it was not being moved to "Unfiled Items" as expected. The folder deletion feature has a three-stage process:
1. **Stage 1**: Regular folder → Move to Unfiled Items
2. **Stage 2**: Folder in Unfiled → Move to Trash
3. **Stage 3**: Folder in Trash → Permanently delete

The issue was that folders in Stage 1 were not being moved to Unfiled Items.

## Root Cause
The problem had two potential causes:

1. **Missing Special Folders**: If the library was previously initialized but the 'unfiled' or 'trash' folders were somehow deleted or corrupted, the `moveFolder` operation would silently fail because the target parent folder didn't exist.

2. **Lack of Error Logging**: The `moveFolder` and `deleteFolder` methods had minimal error reporting, making it difficult to diagnose why folder moves were failing.

## Solution Implemented

### 1. Added `ensureSpecialFolders()` Method
Created a new method that checks for and recreates missing special folders:
- Runs automatically on library load (if folders exist but might be missing special ones)
- Recreates any missing special folders:
  - `root` (My Library)
  - `my-publications` (My Publications)
  - `duplicate-items` (Duplicate Items)
  - `unfiled` (Unfiled Items) ← **Critical for folder deletion**
  - `trash` (Trash)
- Ensures `folderOrder` is properly maintained
- Automatically saves the library if any folders were recreated

### 2. Enhanced Error Logging
Added comprehensive logging to both `moveFolder` and `deleteFolder` methods:

**In `moveFolder`:**
- Logs when folder is not found
- Warns when trying to move library or special folders
- Logs when new parent doesn't exist
- Warns when trying to move to own descendant
- Logs successful moves with before/after parent info

**In `deleteFolder`:**
- Logs when folder is not found
- Warns when trying to delete library or special folders
- Logs which deletion stage is being executed (1, 2, or 3)
- Shows parent folder info for debugging

### 3. Added Special Folder Type Check
Enhanced the `moveFolder` method to explicitly prevent moving special folders (in addition to library folders). This ensures system folders like 'unfiled' and 'trash' cannot be accidentally moved.

## Changes Made

### `src/components/library-manager.js`

**Constructor (lines 3-14):**
```javascript
constructor() {
    this.storageKey = 'grammar-highlighter-library';
    this.library = this.loadLibrary();
    this.currentFolder = null;
    this.selectedFiles = new Set();
    
    // Initialize default structure if empty
    if (!this.library.folders || Object.keys(this.library.folders).length === 0) {
        this.initializeDefaultStructure();
    } else {
        // Ensure all required special folders exist (fix for missing unfiled/trash)
        this.ensureSpecialFolders();
    }
}
```

**New Method: `ensureSpecialFolders()` (added after `initializeDefaultStructure`):**
- Checks for existence of all required special folders
- Recreates any missing folders
- Updates `folderOrder` if needed
- Saves library if any changes were made

**Enhanced `deleteFolder()` Method:**
- Added logging at each stage of deletion
- Better error messages when folder not found
- Clearer indication of which deletion stage is executing

**Enhanced `moveFolder()` Method:**
- Added explicit validation for folder and newParent existence
- Added check to prevent moving special folders
- Added detailed logging of move operations
- Better error messages for all failure cases

## Testing

### To verify the fix works:

1. **Test Normal Deletion (Stage 1: Move to Unfiled)**
   - Create a test folder under "My Library"
   - Right-click and select "Delete Folder"
   - Confirm the dialog
   - **Expected**: Folder should appear under "Unfiled Items"
   - **Check console**: Should see log like:
     ```
     deleteFolder: Stage 1 - Moving to unfiled
     moveFolder: Moving folder "Test" (folder-xxx) from root to unfiled
     ```

2. **Test Stage 2 (Unfiled to Trash)**
   - Find the folder in "Unfiled Items"
   - Right-click and select "Delete Folder" again
   - Confirm the dialog
   - **Expected**: Folder should move to "Trash"
   - **Check console**: Should see "Stage 2 - Moving from unfiled to trash"

3. **Test Stage 3 (Permanent Deletion)**
   - Find the folder in "Trash"
   - Right-click and select "Delete Folder" once more
   - Confirm the dialog
   - **Expected**: Folder should be permanently deleted
   - **Check console**: Should see "Stage 3 - Permanently deleting from trash"

4. **Test Missing Unfiled Folder Recovery**
   - Open browser DevTools console
   - Run: `localStorage.removeItem('grammar-highlighter-library')`
   - Manually create a corrupted library without unfiled:
     ```javascript
     const badLibrary = {
         folders: {
             'root': {
                 id: 'root',
                 name: 'My Library',
                 type: 'library',
                 icon: '🏛️',
                 parent: null,
                 children: ['test-folder'],
                 tags: [],
                 expanded: true,
                 files: []
             },
             'test-folder': {
                 id: 'test-folder',
                 name: 'Test Folder',
                 type: 'folder',
                 icon: '📁',
                 parent: 'root',
                 children: [],
                 tags: [],
                 expanded: false,
                 files: []
             }
         },
         files: {},
         folderOrder: ['root']
     };
     localStorage.setItem('grammar-highlighter-library', JSON.stringify(badLibrary));
     ```
   - Reload the application
   - **Expected**: Console should show "Missing special folder 'Unfiled Items' - recreating"
   - Try deleting "Test Folder"
   - **Expected**: Should successfully move to newly created Unfiled Items

## Debugging

If folder deletion still doesn't work after this fix:

1. **Check Browser Console**: Look for error logs from `deleteFolder` and `moveFolder`
2. **Verify Unfiled Exists**: In console, run:
   ```javascript
   JSON.parse(localStorage.getItem('grammar-highlighter-library')).folders.unfiled
   ```
   Should return the unfiled folder object, not `undefined`

3. **Check Folder Type**: Verify the folder being deleted is type 'folder' not 'special':
   ```javascript
   const lib = JSON.parse(localStorage.getItem('grammar-highlighter-library'));
   const folder = lib.folders['YOUR-FOLDER-ID'];
   console.log(folder.type); // Should be 'folder'
   ```

4. **Manual Repair**: If unfiled is still missing, reload the app or run:
   ```javascript
   window.libraryUI.libraryManager.ensureSpecialFolders();
   ```

## Additional Notes

- This fix is **non-breaking** - existing libraries will continue to work
- The fix runs automatically on app load
- Corrupted libraries will be automatically repaired
- All folder moves are now logged for easier debugging
- Special folders (unfiled, trash) are now protected from being moved or having the wrong type

## Files Modified
- `src/components/library-manager.js` - Enhanced folder deletion logic and added special folder recovery

