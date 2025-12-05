/**
 * Mobile Fixes
 * Comprehensive fixes for mobile-specific issues
 */

(function() {
  'use strict';

  console.log('🔧 Mobile fixes initializing...');

  // Wait for DOM to be ready
  function init() {
    // Fix 1 & 2: Enable highlighting functionality
    enableHighlighting();
    
    // Fix 3: Enable continuous mode by default
    enableContinuousModeByDefault();
    
    // Fix 4: Show recent files in library
    setupRecentFiles();
    
    // Fix 5: Fix statistics panel sizing
    fixStatisticsScroll();
    
    // Fix 6: Make viewer controls smaller and hideable
    makeControlsHideable();
    
    // Fix 7: Add pinch to zoom and fix zoom buttons
    setupZoomControls();
    
    // Fix 8: Remove swipe navigation
    disableSwipeNavigation();
    
    console.log('✅ Mobile fixes applied');
  }

  /**
   * Fix 1 & 2: Enable highlighting functionality (ENHANCED)
   */
  function enableHighlighting() {
    console.log('🎨 Setting up highlighting...');
    
    // Wait for content container to be available
    const checkContainer = setInterval(() => {
      const highlightedTextContent = document.getElementById('highlightedTextContent');
      
      if (highlightedTextContent) {
        clearInterval(checkContainer);
        console.log('✓ Text container found, initializing selection listeners...');
        
        // Connect highlight checkboxes to updateHighlighting if available
        const checkboxes = document.querySelectorAll('.highlight-options input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
          checkbox.addEventListener('change', () => {
            if (window.updateHighlighting) {
              window.updateHighlighting();
            }
          });
        });
        
        // Setup text selection highlighting with context menu
        setupTextSelectionHighlighting();
        
        console.log('✓ Highlighting checkboxes connected');
      }
    }, 500);
    
    // Stop checking after 10 seconds
    setTimeout(() => clearInterval(checkContainer), 10000);
  }

  /**
   * Setup text selection highlighting with context menu (ENHANCED + Android Native Menu Integration)
   */
  function setupTextSelectionHighlighting() {
    console.log('📝 Setting up text selection highlighting...');
    
    const highlightedTextContent = document.getElementById('highlightedTextContent');
    if (!highlightedTextContent) {
      console.warn('⚠️ highlightedTextContent not found');
      return;
    }
    
    // Make text selectable
    highlightedTextContent.style.userSelect = 'text';
    highlightedTextContent.style.webkitUserSelect = 'text';
    
    let selectedText = '';
    let selectedRange = null;
    let selectionTimeout = null;
    let contextMenuVisible = false;
    
    // Listen for selectionchange to detect native Android menu
    document.addEventListener('selectionchange', () => {
      clearTimeout(selectionTimeout);
      selectionTimeout = setTimeout(() => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        
        if (text.length > 0) {
          // Check if selection is within our text content
          let container = null;
          if (selection.rangeCount > 0) {
             const range = selection.getRangeAt(0);
             container = range.commonAncestorContainer;
          }

          if (container && (highlightedTextContent.contains(container) || 
              highlightedTextContent.contains(container.parentElement))) {
            
            console.log('✓ Text selected:', text.substring(0, 30) + '...');
            selectedText = text;
            selectedRange = selection.getRangeAt(0);
            
            // Show floating button immediately
            const floatingBtn = document.getElementById('floatingHighlightBtn');
            if (floatingBtn) {
                floatingBtn.style.display = 'flex';
                floatingBtn.style.transform = 'scale(1)';
            }

            // Attempt to show menu if not already interacting
            if (!contextMenuVisible) {
              try {
                  const rect = selectedRange.getBoundingClientRect();
                  // If rect is valid (not all zeros)
                  if (rect.width > 0 && rect.height > 0) {
                      showContextMenu(rect.left + rect.width / 2, rect.bottom + 10);
                  } else {
                      // Fallback to center screen or approximate
                      showContextMenu(window.innerWidth / 2, window.innerHeight / 2);
                  }
              } catch (e) {
                  console.error('Error getting range rect:', e);
              }
            }
          }
        } else {
          // Selection cleared - hide menu and button
          const floatingBtn = document.getElementById('floatingHighlightBtn');
          if (floatingBtn) {
               floatingBtn.style.transform = 'scale(0)';
               setTimeout(() => { if (!window.getSelection().toString().trim()) floatingBtn.style.display = 'none'; }, 300);
          }
          // Optional: Auto-hide menu if selection is cleared? 
          // Often better to keep it if user just clicked away but menu is sticky, 
          // but for mobile selection change usually means deselect.
          if (contextMenuVisible) {
             // hideContextMenu(); // Uncomment if we want aggressive hiding
          }
        }
      }, 300); // Increased delay to allow native menu to settle
    });

    // Disable native context menu (Android copy/paste menu) on the text content
    highlightedTextContent.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });
    
    // CSS injection to attempt to hide native selection handles/menu if possible
    // Note: complete removal of native Android selection menu is difficult/impossible on some webviews 
    // without disabling selection entirely, but this helps.
    const style = document.createElement('style');
    style.textContent = `
      #highlightedTextContent {
        -webkit-touch-callout: none !important; /* Disables callout menu */
      }
    `;
    document.head.appendChild(style);
    
    function showContextMenu(x, y) {
      // Create or get context menu
      let menu = document.getElementById('mobileHighlightMenu');
      
      if (!menu) {
        menu = document.createElement('div');
        menu.id = 'mobileHighlightMenu';
        menu.style.cssText = `
          position: fixed;
          background: white;
          border: 1px solid #ddd;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.35);
          z-index: 2147483647; /* Max z-index */
          padding: 12px;
          display: none;
          min-width: 220px;
          animation: fadeIn 0.2s ease-out;
        `;
        
        // Add animation style
        const style = document.createElement('style');
        style.textContent = `@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`;
        document.head.appendChild(style);
        
        document.body.appendChild(menu);
      }
      
      // Build menu content
      menu.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 8px;">
            <span style="font-size: 12px; color: #333; font-weight: 700; text-transform: uppercase;">Highlight Options</span>
            <button class="menu-close" style="background: none; border: none; font-size: 18px; color: #999; padding: 0 4px; cursor: pointer;">&times;</button>
          </div>
          
          <div style="display: flex; gap: 12px; padding: 4px; justify-content: center;">
            <button class="color-option" data-color="#FFC107" style="width: 36px; height: 36px; background: rgba(255, 193, 7, 0.3); border: 2px solid #FFC107; border-radius: 50%; cursor: pointer; flex-shrink: 0;" title="Yellow"></button>
            <button class="color-option" data-color="#4CAF50" style="width: 36px; height: 36px; background: rgba(76, 175, 80, 0.3); border: 2px solid #4CAF50; border-radius: 50%; cursor: pointer; flex-shrink: 0;" title="Green"></button>
            <button class="color-option" data-color="#2196F3" style="width: 36px; height: 36px; background: rgba(33, 150, 243, 0.3); border: 2px solid #2196F3; border-radius: 50%; cursor: pointer; flex-shrink: 0;" title="Blue"></button>
            <button class="color-option" data-color="#E91E63" style="width: 36px; height: 36px; background: rgba(233, 30, 99, 0.3); border: 2px solid #E91E63; border-radius: 50%; cursor: pointer; flex-shrink: 0;" title="Pink"></button>
            <button class="color-option" data-color="#9C27B0" style="width: 36px; height: 36px; background: rgba(156, 39, 176, 0.3); border: 2px solid #9C27B0; border-radius: 50%; cursor: pointer; flex-shrink: 0;" title="Purple"></button>
          </div>
          
          <button class="menu-option" data-action="note" style="display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; border: none; background: #667eea; color: white; border-radius: 8px; font-size: 14px; cursor: pointer; font-weight: 600; width: 100%;">
            <span>📝</span> Add Note
          </button>
        </div>
      `;
      
      // Position menu
      const menuWidth = 250;
      const menuHeight = 180;
      
      // Ensure within viewport
      let menuX = Math.max(10, Math.min(x - menuWidth / 2, window.innerWidth - menuWidth - 10));
      
      // Prefer showing below, but go above if no space
      let menuY = y + 15;
      if (menuY + menuHeight > window.innerHeight) {
        menuY = Math.max(10, y - menuHeight - 15);
      }
      
      menu.style.left = menuX + 'px';
      menu.style.top = menuY + 'px';
      menu.style.display = 'block';
      contextMenuVisible = true;
      
      // Events
      menu.querySelectorAll('.color-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          highlightSelectedText(btn.dataset.color);
          hideContextMenu();
        });
      });
      
      menu.querySelector('.menu-option[data-action="note"]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        createNoteForSelection();
        hideContextMenu();
      });
      
      menu.querySelector('.menu-close')?.addEventListener('click', (e) => {
        e.stopPropagation();
        hideContextMenu();
      });
      
      // Auto-close on outside click/touch
      setTimeout(() => {
        const closeHandler = (e) => {
           if (!menu.contains(e.target) && e.target.id !== 'floatingHighlightBtn') {
               hideContextMenu();
               document.removeEventListener('touchstart', closeHandler);
               document.removeEventListener('click', closeHandler);
           }
        };
        document.addEventListener('touchstart', closeHandler);
        document.addEventListener('click', closeHandler);
      }, 200);
    }
    
    function hideContextMenu() {
      const menu = document.getElementById('mobileHighlightMenu');
      if (menu) {
        menu.style.display = 'none';
        contextMenuVisible = false;
      }
    }
    
    function highlightSelectedText(color) {
      if (!selectedRange || !selectedText) {
          // Try to recover selection from window
          const selection = window.getSelection();
          if (selection.toString().length > 0) {
              selectedText = selection.toString();
              selectedRange = selection.getRangeAt(0);
          } else {
              alert('Please select text first.');
              return;
          }
      }
      
      try {
        const colorName = getColorName(color);
        
        // Use execCommand for better compatibility if supported
        // document.designMode = 'on'; // Dangerous on mobile
        
        // Custom span wrapping
        const mark = document.createElement('mark');
        mark.className = `user-highlight color-${colorName}`;
        mark.setAttribute('data-highlight-id', 'highlight-' + Date.now());
        mark.setAttribute('data-highlight', 'true');
        mark.textContent = selectedText; // Replace content to ensure clean wrap
        
        // Note: surroundContents can fail if range crosses node boundaries
        // extractContents + insertNode is safer
        try {
            selectedRange.deleteContents();
            selectedRange.insertNode(mark);
        } catch (e) {
            console.error('Highlight insertion failed:', e);
            // Fallback: just append note/save without visual highlight if DOM is too complex
        }
        
        // Clear selection
        window.getSelection().removeAllRanges();
        
        // Save highlight
        saveHighlight(selectedText, colorName);
        
      } catch (error) {
        console.error('Highlight error:', error);
        alert('Highlight failed. Text saved to notes.');
        saveHighlight(selectedText, getColorName(color));
      }
    }
    
    // ... helper functions (getColorName, createNoteForSelection, saveHighlight) remain same ...
    // Redefining them inside scope to ensure they are available
    
    function getColorName(hexColor) {
      const colorMap = {
        '#FFC107': 'yellow',
        '#4CAF50': 'green',
        '#2196F3': 'blue',
        '#E91E63': 'pink',
        '#9C27B0': 'purple'
      };
      return colorMap[hexColor] || 'yellow';
    }
    
    function createNoteForSelection() {
        if (window.NotesManager && typeof window.NotesManager.showNoteDialog === 'function') {
            window.NotesManager.showNoteDialog(selectedText);
        } else if (window.notesManager && typeof window.notesManager.showNoteDialog === 'function') {
             // Handle lowerCamelCase instance if exists
             window.notesManager.showNoteDialog(selectedText);
        } else {
            // Fallback
            const note = prompt('Add your note:', '');
            if (note) {
                saveHighlight(selectedText, 'yellow', note);
                // Visual feedback
                alert('Note saved!');
            }
        }
    }
    
    function saveHighlight(text, color, note = null) {
    const timestamp = Date.now();
    
    // Ensure file path variables are available
    const filePath = window.currentFilePath || 'mobile-imported-file';
    const fileName = window.currentFileName || 'Mobile Document';
    
    console.log('💾 Saving highlight:', { filePath, fileName, text: text.substring(0, 30) });
    
    // Format as a highlight object compatible with NotesManager
    const highlight = {
      id: 'highlight-' + timestamp,
      type: 'highlight',
      text: text,
      color: color,
      note: note || '',
      page: window.currentPage || 1,
      createdAt: new Date().toISOString(),
      filePath: filePath,
      fileName: fileName,
      tags: [] 
    };
    
    // Save to local storage fallback (legacy)
    const highlights = JSON.parse(localStorage.getItem('userHighlights') || '[]');
    highlights.push({
      text,
      color,
      note,
      timestamp: timestamp,
      document: fileName
    });
    localStorage.setItem('userHighlights', JSON.stringify(highlights));
    
    // Add to NotesManager if available
    if (window.notesManager) {
        console.log('📝 NotesManager found, current state:', {
            currentFilePath: window.notesManager.currentFilePath,
            existingHighlights: window.notesManager.highlights.length,
            existingNotes: window.notesManager.notes.length
        });
        
        // Ensure highlights array exists
        if (!window.notesManager.highlights) window.notesManager.highlights = [];
        
        // Push the new highlight
        window.notesManager.highlights.push(highlight);
        
        console.log('✅ Highlight added. New count:', window.notesManager.highlights.length);
        
        // IMPORTANT: Sync file path if needed
        if (!window.notesManager.currentFilePath || window.notesManager.currentFilePath !== filePath) {
             console.log('⚠️ Syncing notesManager filePath from', window.notesManager.currentFilePath, 'to', filePath);
             window.notesManager.currentFilePath = filePath;
        }
        
        // Force save to localStorage
        window.notesManager.saveToStorage();
        console.log('💾 Saved to localStorage under key:', filePath);
        
        // Try to render (may not show if notes tab not visible)
        const wasRendered = window.notesManager.render();
        console.log('🎨 Render called, result:', wasRendered !== undefined ? 'completed' : 'skipped (tab not visible)');
        
        // Apply visual highlights if we are in a text view
        window.notesManager.applyHighlights();
        
        console.log('✓ Highlight saved to NotesManager:', highlight);
        
        // Visual confirmation
        const toastMsg = note ? 'Highlight with note saved!' : 'Highlight saved!';
        showToast(toastMsg);
    } else {
        console.error('❌ NotesManager not found on window object');
    }
  }
  
  // Simple toast notification
  function showToast(message) {
      const toast = document.createElement('div');
      toast.textContent = message;
      toast.style.cssText = `
          position: fixed;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 12px 24px;
          border-radius: 24px;
          font-size: 14px;
          z-index: 10000;
          animation: fadeIn 0.3s ease;
      `;
      document.body.appendChild(toast);
      
      setTimeout(() => {
          toast.style.opacity = '0';
          toast.style.transition = 'opacity 0.3s';
          setTimeout(() => document.body.removeChild(toast), 300);
      }, 2000);
  }
    
    setupFloatingHighlightButton();
    console.log('✓ Text selection highlighting enabled');
  }
  
  /**
   * Setup floating button that appears when text is selected
   */
  function setupFloatingHighlightButton() {
    let floatingBtn = document.getElementById('floatingHighlightBtn');
    
    if (!floatingBtn) {
      floatingBtn = document.createElement('button');
      floatingBtn.id = 'floatingHighlightBtn';
      floatingBtn.innerHTML = '🖍️';
      floatingBtn.title = 'Highlight selected text';
      floatingBtn.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 16px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: linear-gradient(135deg, #FFC107 0%, #FF9800 100%);
        color: white;
        border: none;
        font-size: 28px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 99999;
        display: none;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      `;
      document.body.appendChild(floatingBtn);
      
      // Show/hide based on text selection
      document.addEventListener('selectionchange', () => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        
        if (text.length > 0) {
          floatingBtn.style.display = 'flex';
          floatingBtn.style.transform = 'scale(1)';
        } else {
          floatingBtn.style.transform = 'scale(0)';
          setTimeout(() => {
            if (!window.getSelection().toString().trim()) {
              floatingBtn.style.display = 'none';
            }
          }, 300);
        }
      });
      
      // Click handler
      floatingBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          // Show context menu at selection position
          const menu = document.getElementById('mobileHighlightMenu');
          if (menu) {
            const x = rect.left + rect.width / 2;
            const y = rect.bottom + 10;
            menu.style.left = Math.max(10, Math.min(x - 110, window.innerWidth - 230)) + 'px';
            menu.style.top = Math.max(10, Math.min(y, window.innerHeight - 220)) + 'px';
            menu.style.display = 'block';
          }
        }
      });
      
      // Press effect
      floatingBtn.addEventListener('touchstart', () => {
        floatingBtn.style.transform = 'scale(0.9)';
      });
      
      floatingBtn.addEventListener('touchend', () => {
        floatingBtn.style.transform = 'scale(1)';
      });
    }
    
    console.log('✓ Floating highlight button added');
  }

  /**
   * Fix 3: Enable continuous mode by default
   */
  function enableContinuousModeByDefault() {
    console.log('🔄 Enabling continuous mode by default...');
    
    // Find all continuous mode checkboxes
    const continuousModeCheckboxes = document.querySelectorAll('.continuous-mode-checkbox');
    
    continuousModeCheckboxes.forEach(checkbox => {
      checkbox.checked = true;
      
      // Trigger change event to activate
      checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    console.log('✓ Continuous mode enabled by default');
  }

  /**
   * Fix 4: Setup recent files in library
   */
  function setupRecentFiles() {
    console.log('📚 Setting up recent files...');
    
    // Recent files functionality (works with existing LibraryManager)
    window.addToRecentFiles = function(filePath, fileName) {
      let recentFiles = JSON.parse(localStorage.getItem('recentFiles') || '[]');
      
      // Add to beginning, remove if already exists
      recentFiles = recentFiles.filter(f => f.path !== filePath);
      recentFiles.unshift({
        path: filePath,
        name: fileName,
        timestamp: Date.now()
      });
      
      // Keep only last 10
      recentFiles = recentFiles.slice(0, 10);
      
      localStorage.setItem('recentFiles', JSON.stringify(recentFiles));
      
      // Update UI if in library view
      updateRecentFilesUI();
    };
    
    // Update recent files UI
    window.updateRecentFilesUI = function() {
      const recentFiles = JSON.parse(localStorage.getItem('recentFiles') || '[]');
      const libraryView = document.getElementById('libraryView');
      
      if (!libraryView) return;
      
      // Check if recent section already exists
      let recentSection = libraryView.querySelector('.recent-files-section');
      
      if (recentFiles.length === 0) {
        // Remove section if no recent files
        if (recentSection) {
          recentSection.remove();
        }
        return;
      }
      
      if (!recentSection) {
        recentSection = document.createElement('div');
        recentSection.className = 'recent-files-section';
        recentSection.style.cssText = 'padding: 16px; background: #f5f5f5; border-radius: 8px; margin: 16px; margin-bottom: 16px;';
        
        // Insert at the beginning of library view
        if (libraryView.firstChild) {
          libraryView.insertBefore(recentSection, libraryView.firstChild);
        } else {
          libraryView.appendChild(recentSection);
        }
      }
      
      recentSection.innerHTML = `
        <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #333; font-weight: 600;">📋 Recent Files</h3>
        <div class="recent-files-list">
          ${recentFiles.map(file => `
            <div class="recent-file-item" style="padding: 12px; background: white; border-radius: 8px; margin-bottom: 8px; cursor: pointer; display: flex; align-items: center; gap: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" data-path="${file.path}">
              <span style="font-size: 28px;">📄</span>
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 14px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #333;">${file.name}</div>
                <div style="font-size: 11px; color: #999; margin-top: 2px;">${formatTimestamp(file.timestamp)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      
      // Add click handlers
      recentSection.querySelectorAll('.recent-file-item').forEach(item => {
        item.addEventListener('click', () => {
          const fileName = item.querySelector('div > div').textContent;
          // Show info that file needs to be re-selected
          if (confirm('Open "' + fileName + '"?\n\nNote: Please select this file again from your device storage.')) {
            // Trigger file picker
            if (window.MobileFileHandler && window.MobileFileHandler.openFile) {
              window.MobileFileHandler.openFile();
            }
          }
        });
      });
    };
    
    function formatTimestamp(timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
      if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
      return date.toLocaleDateString();
    }
    
    // Update UI when library view becomes active
    const checkLibraryInterval = setInterval(() => {
      const libraryPanel = document.getElementById('libraryPanel');
      if (libraryPanel) {
        clearInterval(checkLibraryInterval);
        
        // Initial update
        setTimeout(() => {
          if (libraryPanel.classList.contains('active')) {
            updateRecentFilesUI();
          }
        }, 500);
        
        // Watch for when library becomes active
        const observer = new MutationObserver(() => {
          if (libraryPanel.classList.contains('active')) {
            updateRecentFilesUI();
          }
        });
        
        observer.observe(libraryPanel, {
          attributes: true,
          attributeFilter: ['class']
        });
      }
    }, 100);
    
    console.log('✓ Recent files setup complete');
  }

  /**
   * Fix 5: Fix statistics panel sizing (ENHANCED + Hide when inactive)
   */
  function fixStatisticsScroll() {
    console.log('📊 Fixing statistics panel...');
    
    const statsPanel = document.getElementById('statsPanel');
    const statsContainer = document.querySelector('.stats-container');
    const panelHeader = statsPanel?.querySelector('.panel-header');
    
    if (statsPanel && window.innerWidth <= 768) {
      // Fix Parent Panel
      // Ensure it takes full height of main-container and handles layout
      statsPanel.style.height = '100%';
      statsPanel.style.maxHeight = '100%';
      statsPanel.style.overflow = 'hidden'; // Disable scrolling on parent
      
      // If not active, hide it (but keep layout ready)
      if (!statsPanel.classList.contains('active')) {
        statsPanel.style.display = 'none';
        statsPanel.style.visibility = 'hidden';
        statsPanel.style.pointerEvents = 'none';
      }
      
      // Fix header
      if (panelHeader) {
        panelHeader.style.cssText = `
          flex-shrink: 0 !important;
          position: relative !important;
          z-index: 10 !important;
          width: 100% !important;
        `;
      }
      
      // Fix container to be the scrollable area
      if (statsContainer) {
        statsContainer.style.cssText = `
          flex: 1 1 auto !important;
          display: block !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          -webkit-overflow-scrolling: touch !important;
          padding: 12px !important;
          padding-bottom: 100px !important; /* Extra padding to be safe */
          width: 100% !important;
          height: auto !important;
          min-height: 0 !important; /* Important for flex scrolling */
        `;
      }
      
      console.log('✓ Statistics panel sizing fixed (full height + scrollable container)');
    }
  }

  /**
   * Fix 6: Make viewer controls smaller and hideable
   */
  function makeControlsHideable() {
    console.log('🎛️ Making controls hideable...');
    
    const pdfControls = document.querySelector('.pdf-controls');
    const pdfPanel = document.getElementById('pdfPanel');
    
    if (!pdfControls || !pdfPanel) return;
    
    // Make controls smaller
    pdfControls.style.padding = '4px';
    pdfControls.style.gap = '4px';
    
    const buttons = pdfControls.querySelectorAll('button, .btn-icon');
    buttons.forEach(btn => {
      btn.style.minWidth = '36px';
      btn.style.minHeight = '36px';
      btn.style.fontSize = '14px';
      btn.style.padding = '6px';
    });
    
    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'btn-icon';
    toggleBtn.innerHTML = '👁️';
    toggleBtn.title = 'Hide/Show Controls';
    toggleBtn.style.cssText = 'min-width: 36px; min-height: 36px; font-size: 14px; background: #667eea; color: white; border: none; border-radius: 4px;';
    
    let controlsVisible = true;
    
    toggleBtn.addEventListener('click', () => {
      controlsVisible = !controlsVisible;
      
      if (controlsVisible) {
        pdfControls.style.display = 'flex';
        toggleBtn.innerHTML = '👁️';
        toggleBtn.style.position = 'static';
      } else {
        pdfControls.style.display = 'none';
        toggleBtn.innerHTML = '👁️';
        toggleBtn.style.position = 'absolute';
        toggleBtn.style.top = '10px';
        toggleBtn.style.right = '10px';
        toggleBtn.style.zIndex = '100';
      }
    });
    
    // Add to panel header
    const panelHeader = pdfPanel.querySelector('.panel-header');
    if (panelHeader) {
      panelHeader.style.position = 'relative';
      panelHeader.appendChild(toggleBtn);
    }
    
    console.log('✓ Controls made smaller and hideable');
  }

  /**
   * Fix 7: Setup zoom controls and pinch to zoom
   */
  function setupZoomControls() {
    console.log('🔍 Setting up zoom controls...');
    
    const canvas = document.getElementById('pdfCanvasElement');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const zoomLevel = document.getElementById('zoomLevel');
    
    let currentScale = 1.0;
    
    // Connect zoom buttons
    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        currentScale = Math.min(currentScale + 0.25, 3.0);
        applyZoom();
      });
    }
    
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        currentScale = Math.max(currentScale - 0.25, 0.5);
        applyZoom();
      });
    }
    
    function applyZoom() {
      if (canvas) {
        canvas.style.transform = `scale(${currentScale})`;
        canvas.style.transformOrigin = 'top center';
        
        if (zoomLevel) {
          zoomLevel.textContent = Math.round(currentScale * 100) + '%';
        }
        
        console.log('🔍 Zoom:', currentScale);
      }
    }
    
    // Pinch to zoom
    if (canvas) {
      let initialDistance = 0;
      let initialScale = 1.0;
      
      canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
          e.preventDefault();
          initialDistance = getDistance(e.touches[0], e.touches[1]);
          initialScale = currentScale;
        }
      }, { passive: false });
      
      canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
          e.preventDefault();
          const currentDistance = getDistance(e.touches[0], e.touches[1]);
          const scale = (currentDistance / initialDistance) * initialScale;
          currentScale = Math.max(0.5, Math.min(3.0, scale));
          applyZoom();
        }
      }, { passive: false });
      
      function getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
      }
      
      console.log('✓ Pinch to zoom enabled');
    }
    
    console.log('✓ Zoom controls connected');
  }

  /**
   * Fix 8: Remove swipe navigation
   */
  function disableSwipeNavigation() {
    console.log('👆 Disabling swipe navigation...');
    
    // Remove swipe gesture listeners from mobile-navigation.js
    if (window.MobileNavigation && window.MobileNavigation.disableSwipe) {
      window.MobileNavigation.disableSwipe();
    }
    
    // Disable touch navigation on main container
    const mainContainer = document.querySelector('.main-container');
    if (mainContainer) {
      mainContainer.addEventListener('touchmove', (e) => {
        // Allow normal scrolling/zooming but prevent swipe navigation
        e.stopPropagation();
      }, { passive: true });
    }
    
    console.log('✓ Swipe navigation disabled');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose APIs
  window.MobileFixes = {
    enableHighlighting,
    enableContinuousModeByDefault,
    updateRecentFilesUI,
    fixStatisticsScroll
  };

})();


