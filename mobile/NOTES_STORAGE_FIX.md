# Notes Storage Fix for Mobile

## The Problem

**Desktop and Mobile store notes under different keys in localStorage:**

- **Desktop:** Uses full file path as key (e.g., `C:\Users\denver\Documents\file.pdf`)
- **Mobile:** Uses only filename as key (e.g., `file.pdf`)

This means notes saved on mobile don't appear on desktop and vice versa, even though they're both using the same `localStorage` key (`grammar-highlighter-notes`).

## The Solution

### 1. Debug Tool (Included)

A debug button (🐛) appears in the top-right of the mobile app. Tap it to:

- **View Storage Info:** See what's stored and under which keys
- **Force Reload Notes:** Manually reload notes for the current file
- **View All Stored Notes:** See everything in localStorage
- **Export to Console:** Copy full data to DevTools console

### 2. Forced Rendering

The `mobile-fixes.js` now forces the notes to render immediately after saving, bypassing the visibility check that was preventing notes from showing until you switched tabs.

### 3. Auto-fill Note Content

When you highlight text on mobile, the selected text is automatically saved as the note content (matching desktop behavior).

## How to Use

1. **Rebuild the app** after pulling these changes:
   ```bash
   npm run sync
   npm run build:android
   ```

2. **Test highlighting:**
   - Open a document
   - Select text in the Analyse tab
   - The highlight menu will appear
   - Choose a color or "Add Note"
   - The highlight should save immediately

3. **Check if it saved:**
   - Tap the 🐛 debug button
   - Look at the storage keys
   - The current file should be highlighted in green
   - You should see the count of notes/highlights

## Workaround for Existing Notes

If you have notes saved on desktop that aren't showing on mobile:

1. Open the debug tool (🐛 button)
2. Tap "View All Stored Notes"
3. Open DevTools (Chrome inspect)
4. Look at the console output to see all file paths
5. You may need to manually copy highlights between keys if the paths don't match

## Files Changed

- `mobile/src/mobile-fixes.js` - Force render, auto-fill notes
- `mobile/src/mobile-notes-debug.js` - NEW debug helper
- `mobile/src/mobile-index.html` - Include debug script
- `src/components/notes-manager.js` - Support force parameter in render()

## Next Steps

To fully sync notes between desktop and mobile in the future, consider:

1. **Normalize file paths** - Always store by filename only
2. **Cloud sync** - Use Google Drive sync feature to sync notes
3. **Export/Import** - Add a feature to export notes JSON and import on other device

