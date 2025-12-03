# Folder Import Feature Guide

## Overview

The Grammar Highlighter now supports importing entire folders with their subdirectory structure! This feature allows you to organize your document library by importing folders containing PDFs, EPUBs, DOCX files, and Markdown documents.

## Features

### 1. **Import Entire Folders**
   - Import a folder and all its subdirectories
   - Automatically scans for supported file types
   - Preserves the original folder structure in your library

### 2. **Supported File Types**
   - PDF (`.pdf`)
   - EPUB (`.epub`)
   - Word Documents (`.docx`)
   - Markdown (`.md`)

### 3. **Automatic Organization**
   - Creates matching folder structure in your library
   - All subdirectories are preserved
   - Files are automatically organized into their respective folders

## How to Use

### Method 1: Using the Menu
1. Go to **File → Open Folder...** (or press `Ctrl+Shift+O`)
2. Select the folder you want to import
3. Wait for the scan to complete
4. Review the import summary

### Method 2: Using the Library Panel
1. Click the **📥 Import** button in the Library panel
2. Select **📁 Import Folder (with subdirectories)**
3. Choose your folder
4. The app will scan and import all supported files

### Method 3: Create Folders Manually
1. Click the **➕ Folder** button in the Library panel (or press `Ctrl+N`)
2. Enter a folder name
3. Drag and drop files into the folder (if supported by your OS)

## Example

If you import a folder structure like this:

```
Research/
├── Papers/
│   ├── paper1.pdf
│   └── paper2.pdf
├── Books/
│   ├── book1.epub
│   └── notes.md
└── Reports/
    └── report.docx
```

The app will create:

```
My Library/
└── Research/
    ├── Papers/
    │   ├── paper1.pdf
    │   └── paper2.pdf
    ├── Books/
    │   ├── book1.epub
    │   └── notes.md
    └── Reports/
        └── report.docx
```

## Import Summary

After importing, you'll see a summary showing:
- **Folders created**: Number of subdirectories created
- **Files imported**: Number of files successfully imported
- **Files skipped**: Number of unsupported files (if any)

## Tips

1. **Large Folders**: Importing large folders may take a few moments. Be patient!
2. **Unsupported Files**: Only PDF, EPUB, DOCX, and MD files are imported. Other file types are skipped.
3. **Nested Folders**: The feature supports deeply nested folder structures.
4. **Duplicate Files**: If a file already exists in your library, it won't be duplicated.

## Keyboard Shortcuts

- `Ctrl+O` - Open single file
- `Ctrl+Shift+O` - Open folder
- `Ctrl+N` - Create new folder in library

## Technical Details

### Implementation
- **Recursive Scanning**: The folder scanner recursively traverses all subdirectories
- **Path Preservation**: Relative paths are maintained to recreate the folder structure
- **Async Processing**: Files are imported asynchronously for better performance
- **Error Handling**: Failed imports are reported in the summary

### File Detection
The scanner identifies files by their extension:
- `.pdf` → PDF Viewer
- `.epub` → EPUB Reader
- `.docx` → DOCX Reader
- `.md` → Markdown Reader

## Troubleshooting

**Q: No files were found in my folder**
- A: Make sure your folder contains supported file types (PDF, EPUB, DOCX, MD)

**Q: Some files were skipped**
- A: Check the import summary to see which files were skipped and why

**Q: The folder structure looks different**
- A: The app preserves the relative structure from the selected folder downward

**Q: Can I import multiple folders at once?**
- A: Currently, you need to import folders one at a time. However, you can create a parent folder and import multiple subfolders into it.

## Future Enhancements

Potential future features:
- Drag and drop folder import
- Batch folder import
- Import progress bar with file-by-file status
- Option to flatten folder structure
- Import filters (by file type, date, size)

---

**Enjoy organizing your documents!** 📚

