# Floating Panels Feature Guide

## Overview

The Grammar Highlighter Desktop now supports **floating panels** for all main tabs! You can open any tab (Analyse, Notes, Translate, Map, Mindmap, or Figures) into a separate, draggable window that can be positioned anywhere on screen, minimized, and closed.

## Features

### 🎯 What You Can Do

- **Pop Out Any Tab**: Click the ⧉ icon next to any tab button to open it in a new floating panel
- **Drag Panels**: Click and drag the panel header to reposition it anywhere on screen
- **Resize Panels**: Drag the edges or corner of panels to resize them
- **Minimize Panels**: Click the `─` button to minimize a panel (keeps it accessible but takes less space)
- **Close Panels**: Click the `×` button to close a panel when you're done
- **Multiple Panels**: Open multiple different panels at once to work with different views side-by-side
- **Auto-Focus**: Clicking a panel brings it to the front

### 🎨 Visual Features

- **Gradient Headers**: Beautiful purple gradient headers match the app theme
- **Smooth Animations**: Panels fade in/out and move smoothly
- **Cascade Positioning**: New panels automatically position themselves with a slight offset
- **Modern Design**: Clean, professional look with subtle shadows

## How to Use

### Opening a Panel

1. Look at the tab buttons (Analyse, Notes, Translate, etc.)
2. Hover over any tab button to see the ⧉ pop-out icon
3. Click the ⧉ icon to open that tab in a floating panel

**Note**: The pop-out icon is most visible when you hover over the tab or when the tab is active.

### Moving a Panel

1. Click and hold on the panel's header (the purple bar at the top)
2. Drag the panel to your desired position
3. Release the mouse button to place it

### Resizing a Panel

You can resize panels from three directions:

- **Right Edge**: Drag the right edge to adjust width
- **Bottom Edge**: Drag the bottom edge to adjust height  
- **Corner**: Drag the bottom-right corner (marked with ⋰) to adjust both dimensions at once

Panels have minimum sizes to ensure usability:
- Minimum width: 400px
- Minimum height: 300px

### Minimizing a Panel

1. Click the `─` button in the panel header
2. The panel content will collapse, showing only the header
3. Click the button again (now shows `□`) to restore the panel

**Tip**: Use minimize to keep panels accessible without taking up screen space.

### Closing a Panel

1. Click the `×` button in the panel header
2. The panel will fade out and close
3. You can re-open it anytime using the ⧉ icon

### Working with Multiple Panels

- Open as many different panels as you need
- Each tab type can only have one panel open at a time
- Clicking the ⧉ icon for an already-open panel will bring it to the front
- Click any panel to bring it to the front of other panels

## Panel Types

### 📝 Analyse Panel
- Shows the analyzed text with grammar highlighting
- Color-coded parts of speech
- Same content as the main Analyse tab

### 📌 Notes Panel
- View and manage your notes
- Add, edit, and organize notes
- Fully functional note-taking interface

### 🌐 Translate Panel
- Translation interface
- Language selection and translation controls
- View translated content

### 🗺️ Map Panel
- Visual word map/cloud
- Interactive word relationships
- Larger panel size (900x700) for better visualization

### 🧠 Mindmap Panel
- Interactive mind mapping
- Create and organize concepts
- Larger panel size (900x700) for complex diagrams

### 🖼️ Figures Panel
- View extracted figures and images
- Image gallery from your documents

## Use Cases

### 📚 Study Mode
Open Notes panel alongside Analyse to take notes while reviewing highlighted text.

### 🔄 Translation Comparison
Open both Analyse and Translate panels to compare original and translated text side-by-side.

### 🗺️ Visual Learning
Open Mindmap and Map panels together to see different visualizations of your content.

### 📝 Multi-Document Workflow
Keep Notes open in a panel while switching between different tabs in the main window.

## Tips & Tricks

1. **Organize Your Workspace**: Position panels around your main window for a multi-monitor feel
2. **Minimize When Not Needed**: Keep panels minimized until you need them
3. **Resize for Comfort**: Adjust panel sizes based on content type (larger for maps, smaller for quick notes)
4. **Quick Access**: Panels remember their type, so reopening brings the same content type back
5. **Single Instance**: Each panel type can only be open once to prevent confusion

## Technical Details

### Panel Management
- Panels are managed by the `PanelManager` class
- Each panel maintains its state independently
- Panels are overlays on top of the main application window
- All panels have proper z-index management for layering

### Content Cloning
- Panel content is cloned from the main tabs
- Interactive features are re-initialized in panels
- Changes in one view don't affect other views (isolated state)

### Performance
- Lightweight implementation with minimal overhead
- Smooth animations using CSS transitions
- Efficient drag and resize with proper event handling

## Keyboard Shortcuts

Currently, panels are mouse-driven. Future updates may include:
- `Ctrl+Click` on tab to pop out
- `Esc` to close focused panel
- Arrow keys to move focused panel

## Troubleshooting

### Panel Won't Open
- Make sure you have content loaded (open a document first)
- Check console for any JavaScript errors

### Panel Disappeared
- It may be positioned off-screen - close and reopen it
- Check if it's minimized (look for minimized panel bar)

### Content Not Showing
- Some features require the main tab to be initialized first
- Try switching to that tab in the main window, then pop it out

### Performance Issues
- Close unused panels
- Avoid having too many large panels (Map/Mindmap) open simultaneously

## Future Enhancements

Potential future features:
- Save panel positions and sizes
- Restore panels on app restart
- Panel snapping to edges
- Keyboard shortcuts
- Multi-monitor detection and positioning
- Panel grouping/tabbing
- Custom panel colors/themes

## Feedback

Enjoy the new floating panels feature! This enhancement provides a more flexible and powerful workflow for working with your documents.

