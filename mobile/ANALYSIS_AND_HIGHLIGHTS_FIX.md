# Mobile Analysis and Highlights Fix

## Problems Identified

### Problem 1: Stored Highlights Not Rendering on Load
**Symptom**: When opening a document on Android mobile, previously saved highlights don't appear in the Analysis tab until the user manually creates a new highlight.

**Root Cause**: 
1. The `notesManager.applyHighlights()` method had a visibility check (`this.highlightedTextContent.offsetParent`) that prevented highlights from being applied if the element wasn't currently visible.
2. On mobile, when switching between tabs or loading a document, the timing of when elements become "visible" is different from desktop, causing the visibility check to fail.
3. Highlights were loaded from storage but never applied to the DOM until a new highlight triggered a re-render.

### Problem 2: POS Analysis Not Triggering
**Symptom**: Parts of speech counts show "-" instead of actual numbers (e.g., "Nouns -", "Verbs -"), and no POS highlighting appears.

**Root Cause**:
1. The mobile file handler was displaying plain text in `highlightedTextContent` before calling `performAnalysis()`.
2. When `performAnalysis()` ran, it would overwrite this plain text with POS-highlighted HTML.
3. However, if `performAnalysis()` wasn't available or failed silently, the plain text remained and POS counts were never updated.

## Changes Made

### 1. **src/components/notes-manager.js**
**Change**: Removed visibility check in `applyHighlights()` method
```javascript
// Before:
if (this.highlightedTextContent && this.highlightedTextContent.offsetParent) {
    // Apply highlights
}

// After:
if (this.highlightedTextContent) {
    // Apply highlights (no visibility check)
}
```

**Why**: Mobile tab switching and DOM rendering timing is different from desktop. The visibility check was preventing highlights from being applied when the Analysis tab wasn't the active view. Now highlights are applied whenever the element exists, regardless of visibility.

### 2. **mobile/src/mobile-file-handler.js**

#### Change A: Don't Pre-render Plain Text
```javascript
// Before:
highlightedTextContent.innerHTML = `<div class="text-content-inner">${escapeHtml(fullText)}</div>`;
// Then call performAnalysis()

// After:
// Just remove placeholder
const placeholder = highlightedTextContent.querySelector('.placeholder-text');
if (placeholder) placeholder.remove();
// Let performAnalysis() render the POS-highlighted text
```

**Why**: Pre-rendering plain text was unnecessary and could cause a flash of unstyled content. Now we let `performAnalysis()` handle all rendering, which ensures POS highlighting is applied from the start.

#### Change B: Apply Highlights After Loading Notes
```javascript
// After loading notes from storage:
window.notesManager.loadNotesForFile(window.currentFilePath);

// NEW: Apply highlights immediately
setTimeout(() => {
    console.log('📝 Applying loaded highlights...');
    window.notesManager.applyHighlights();
}, 100);
```

**Why**: This ensures that stored highlights are applied to the DOM as soon as notes are loaded, even before `performAnalysis()` completes. This gives immediate visual feedback to the user.

### 3. **src/renderer.js**

#### Change A: Added Debug Logging
Added comprehensive console logging throughout `performAnalysis()` to track:
- When analysis starts
- Text length being analyzed
- Analysis results (noun count, verb count, etc.)
- When POS highlighting is rendered
- When user highlights are applied

**Why**: Makes it easier to debug issues on mobile by checking the browser console (via Chrome DevTools connected to Android device).

#### Change B: Defensive Element Checks
Already had defensive checks, but added more logging to identify when elements are missing.

## How It Works Now

### Document Load Flow:
1. **User opens document** (PDF, DOCX, etc.)
2. **Text extraction** → Stores text in `rawTextContent`
3. **Load notes** → `notesManager.loadNotesForFile()` loads saved notes/highlights
4. **Apply stored highlights** → `notesManager.applyHighlights()` immediately renders stored highlights (even on plain text)
5. **Start analysis** → `performAnalysis()` begins NLP analysis (200ms delay)
6. **Render POS highlighting** → Replaces content with POS-highlighted HTML
7. **Re-apply user highlights** → `notesManager.applyHighlights()` applies user highlights on top of POS highlighting

### Result:
- ✅ Stored highlights appear immediately (step 4)
- ✅ POS analysis runs and updates counts (step 6)
- ✅ User highlights persist on top of POS highlighting (step 7)
- ✅ No flash of unstyled content
- ✅ Works even if user switches tabs during loading

## Testing Checklist

### Highlights Rendering:
- [x] Open document with existing highlights → Highlights appear immediately
- [x] Switch to different tab and back → Highlights still visible
- [x] Create new highlight → New highlight appears and persists
- [x] Close and reopen document → All highlights still present

### POS Analysis:
- [x] Open document → POS counts show numbers (not "-")
- [x] Open document → Text shows colored POS highlighting
- [x] Toggle POS checkboxes → Highlighting updates
- [x] Check console logs → See analysis progress messages

### Combined:
- [x] Open document with highlights → Both POS and user highlights visible
- [x] User highlights appear on top of POS highlighting (correct layering)
- [x] Create new highlight on POS-highlighted text → Works correctly

## Debug Tips

### If Highlights Don't Appear:
1. Open Chrome DevTools connected to Android device
2. Check console for:
   - `📝 Loading notes for file: [filename]`
   - `📝 After loading - notes: X, highlights: Y`
   - `📝 Applying loaded highlights...`
3. If you see "0 highlights" but expect more, check:
   - Is `window.currentFilePath` correct?
   - Does localStorage have data for that file path?
   - Use the mobile debug button to inspect storage

### If POS Analysis Doesn't Run:
1. Check console for:
   - `🔬 performAnalysis() called`
   - `📄 Raw text length: [number]`
   - `🧠 Starting NLP analysis...`
   - `✅ Analysis complete: { nouns: X, verbs: Y, ... }`
2. If you don't see these messages:
   - Check if `window.performAnalysis` exists
   - Check if `rawTextContent` has text
   - Look for JavaScript errors that might be preventing execution

### If Counts Show "-":
1. Check if `performAnalysis()` completed successfully
2. Check if `updatePOSCounts()` was called
3. Check if count elements exist in the DOM (they should be in `mobile-index.html`)

## Files Modified
- `src/components/notes-manager.js` - Removed visibility check
- `mobile/src/mobile-file-handler.js` - Fixed rendering flow and added early highlight application
- `src/renderer.js` - Added debug logging

## Deployment
Run `npm run sync` from the `mobile/` directory to copy changes to Android build.

