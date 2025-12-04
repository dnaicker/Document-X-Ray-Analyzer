
## 4. Highlight Processing Memory Fix (Dec 4, 2025)

### Problem
The application could crash with an "Out of Memory" error when applying highlights to large text documents. The issue was in `wrapFragmentedText` within `src/components/notes-manager.js`, which created an object for **every single character** in the text to map indices to DOM nodes. For a 5MB text file, this would create ~5 million objects, easily exhausting the V8 heap.

### Changes
1.  **Range-Based Mapping**:
    *   Rewrote `wrapFragmentedText` to use a **range-based approach** instead of a character-based map.
    *   Instead of an array of size N (where N = characters), it now uses an array of size M (where M = text nodes).
    *   `nodeRanges` stores `{ node, start, end }` for each text node.
    *   When a text match is found, the code scans `nodeRanges` to find the start and end nodes.

### Impact
-   **Memory Usage**: Drastically reduced memory footprint for highlighting (O(Nodes) instead of O(Characters)). A 1000-page book now uses kilobytes instead of gigabytes for this mapping.
-   **Stability**: Eliminates the "Paused before potential out-of-memory crash" error seen in DevTools.
-   **Performance**: Faster setup time for highlighting operations on large texts.
