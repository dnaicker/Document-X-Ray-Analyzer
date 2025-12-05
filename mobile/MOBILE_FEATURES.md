# Mobile-Specific Features & Layout

This document describes how the mobile version differs from the desktop app.

## 🎨 Layout Differences

### Desktop (Multi-Column)
```
┌────────────────────────────────────────────────────┐
│  Toolbar                                            │
├──────┬────────────┬───────────────┬────────────────┤
│      │            │               │                │
│ Lib  │   Viewer   │   Analysis    │   Statistics   │
│rary  │            │               │                │
│      │            │               │                │
└──────┴────────────┴───────────────┴────────────────┘
```

### Mobile (Single View + Bottom Nav)
```
┌─────────────────────┐
│   Top App Bar       │ ← Title, Menu
├─────────────────────┤
│                     │
│    ACTIVE VIEW      │ ← Only one visible
│   (Full Screen)     │
│                     │
├─────────────────────┤
│ 📚 📄 ✨ 📌 📊      │ ← Bottom Navigation
└─────────────────────┘
```

## 📱 Bottom Navigation Tabs

### 1. 📚 Library
- Browse folders and documents
- Search library
- Import new files
- FAB: "+" to add documents

### 2. 📄 Reader
- View PDF/EPUB/DOCX/etc.
- Touch-optimized zoom and pan
- Page navigation
- Swipe between pages (if supported)

### 3. ✨ Analyze
- Sub-tabs for different analysis views:
  - **Analyse**: Grammar highlighting
  - **Notes**: View and manage notes
  - **Translate**: Document translation
  - **Map**: Visual page overview
  - **Mindmap**: Concept mapping
  - **Figures**: Extracted images

### 4. 📌 Notes (Shortcut)
- Quick access to notes view
- FAB: "✏️" to add note

### 5. 📊 Stats
- Reading statistics
- Word frequency
- Named entities
- Search functionality

## 🎯 Mobile Optimizations

### Touch-Friendly UI
- **Larger tap targets**: All buttons 44x44px minimum
- **Gesture support**: Swipe between views
- **Haptic feedback**: Subtle vibration on tap
- **Pull to refresh**: In library and lists

### Responsive Controls
- **Collapsible sections**: Highlight options fold away
- **Bottom sheets**: Replace dropdowns
- **Full-screen dialogs**: Better note editing
- **Floating Action Button (FAB)**: Context-dependent quick actions

### Performance
- **Lazy loading**: Views load only when active
- **Smaller chunks**: Process fewer pages at once
- **Memory management**: Clear unused resources
- **Progressive rendering**: Show partial results

### Navigation
- **Bottom navigation**: Primary navigation method
- **Swipe gestures**: Quick view switching
- **Back button**: Android back button support
- **Deep linking**: Open specific documents from notifications

## 🔄 Feature Parity

### ✅ Fully Supported
- PDF viewing and text extraction
- Grammar analysis and highlighting
- Notes and highlights
- Translation
- Statistics
- Library management
- File import (from storage)

### ⚠️ Limited/Modified
- **OCR**: Slower on mobile, limited pages at once
- **Google Drive Sync**: Uses in-app browser for OAuth
- **File System**: Android storage access restrictions apply
- **Multiple windows**: Single window only
- **Drag & drop**: Use file picker instead

### ❌ Not Available (Mobile Limitations)
- Folder import with directory structure (Android limitation)
- Native window controls (fullscreen by default)
- System tray/background sync
- Multi-document side-by-side view

## 🎨 UI Components

### Mobile App Bar
- Hamburger menu (☰) for main menu
- Document title (centered)
- More options (⋮) for secondary actions

### Bottom Navigation
- Always visible
- Active state with color highlight
- Badge support for notifications (future)

### Floating Action Button (FAB)
- Context-dependent primary action
- Position: Bottom-right, above bottom nav
- Examples:
  - Library view: Add document
  - Notes view: Create note
  - Hidden in other views

### Action Sheets
- Replace context menus
- Slide up from bottom
- Touch-optimized spacing
- Cancel button always present

### Full-Screen Dialogs
- Note editor
- Settings
- Filters and options
- Smooth slide-in animation

## 📐 Breakpoints

### Mobile Portrait (< 768px)
- Single column layout
- Bottom navigation
- Full-screen views
- Stacked controls

### Tablet Portrait (768px - 1024px)
- Two-column layout option
- Bottom navigation still active
- Side-by-side reader + analysis

### Tablet Landscape (768px - 1024px, landscape)
- Three-column layout possible
- Reader + Analysis + Stats
- Bottom navigation or side navigation

### Desktop (> 1024px)
- Full desktop UI
- No bottom navigation
- Multi-column layout
- Mouse-optimized controls

## 🎭 Adaptive Features

### Text Selection
- **Desktop**: Right-click context menu
- **Mobile**: Long-press → Action sheet

### File Picker
- **Desktop**: Native OS dialog
- **Mobile**: Android document picker

### Zoom Controls
- **Desktop**: Zoom buttons + scroll wheel
- **Mobile**: Pinch-to-zoom + buttons

### Search
- **Desktop**: Always visible in sidebar
- **Mobile**: Collapsible search bar, keyboard-aware

### Settings
- **Desktop**: Popup over content
- **Mobile**: Full-screen slide-in panel

## 🔧 Developer Notes

### Adding a New Mobile-Specific Feature

1. **Check platform**:
   ```javascript
   if (window.innerWidth <= 768) {
     // Mobile implementation
   } else {
     // Desktop implementation
   }
   ```

2. **Or use the bridge**:
   ```javascript
   import bridge from './capacitor-bridge.js';
   if (bridge.isMobile) {
     // Mobile-specific code
   }
   ```

3. **Add mobile styles**:
   ```css
   @media screen and (max-width: 768px) {
     .my-feature {
       /* Mobile styles */
     }
   }
   ```

### Testing Responsive Layout

1. **Browser DevTools**:
   - Chrome: F12 → Device Toolbar
   - Test various screen sizes
   - Throttle network/CPU

2. **Real Device**:
   - Use live reload for faster iteration
   - Test gestures and performance
   - Check different Android versions

3. **Emulator**:
   - Android Studio AVD
   - Test different screen densities
   - Simulate low-end devices

## 🚀 Future Enhancements

### Planned Features
- [ ] Offline mode with service workers
- [ ] Background sync
- [ ] Push notifications for sync completion
- [ ] Widget for quick access
- [ ] Share to other apps
- [ ] Android Auto-backup integration
- [ ] Biometric authentication
- [ ] Dark mode (device-based)
- [ ] Tablet-optimized layouts
- [ ] Foldable device support

### Under Consideration
- [ ] Text-to-speech playback controls
- [ ] Reading mode with estimated time
- [ ] Night light/reading mode
- [ ] Gesture customization
- [ ] Stylus support for annotations
- [ ] Split-screen multi-tasking

## 📚 References

- [Material Design Mobile Guidelines](https://material.io/design)
- [Android Navigation Patterns](https://developer.android.com/guide/navigation)
- [Capacitor Best Practices](https://capacitorjs.com/docs/guides/environment-setup)

