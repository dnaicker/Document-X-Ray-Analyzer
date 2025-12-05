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
    
    // Wait for text analyzer to load
    const checkAnalyzer = setInterval(() => {
      if (window.analyzeText || window.TextAnalyzer) {
        clearInterval(checkAnalyzer);
        
        // Connect highlight checkboxes to updateHighlighting
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
    
    // Stop checking after 5 seconds
    setTimeout(() => clearInterval(checkAnalyzer), 5000);
  }

  /**
   * Setup text selection highlighting with context menu
   */
  function setupTextSelectionHighlighting() {
    console.log('📝 Setting up text selection highlighting...');
    
    const highlightedTextContent = document.getElementById('highlightedTextContent');
    if (!highlightedTextContent) return;
    
    let selectedText = '';
    let selectedRange = null;
    
    // Track text selection
    highlightedTextContent.addEventListener('mouseup', handleSelection);
    highlightedTextContent.addEventListener('touchend', handleSelection);
    
    function handleSelection(e) {
      const selection = window.getSelection();
      selectedText = selection.toString().trim();
      
      if (selectedText.length > 0) {
        selectedRange = selection.getRangeAt(0);
        showContextMenu(e.clientX || e.touches?.[0]?.clientX, e.clientY || e.touches?.[0]?.clientY);
      }
    }
    
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
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          padding: 8px;
          display: none;
        `;
        document.body.appendChild(menu);
      }
      
      // Build menu content
      menu.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 4px;">
          <button class="menu-option" data-action="highlight" style="padding: 12px 16px; border: none; background: #FFC107; border-radius: 6px; font-size: 14px; cursor: pointer;">
            🖍️ Highlight
          </button>
          <button class="menu-option" data-action="note" style="padding: 12px 16px; border: none; background: #2196F3; color: white; border-radius: 6px; font-size: 14px; cursor: pointer;">
            📝 Add Note
          </button>
          <div style="display: flex; gap: 4px; padding: 4px;">
            <button class="color-option" data-color="#FFC107" style="width: 32px; height: 32px; background: #FFC107; border: 2px solid #333; border-radius: 50%; cursor: pointer;" title="Yellow"></button>
            <button class="color-option" data-color="#4CAF50" style="width: 32px; height: 32px; background: #4CAF50; border: 2px solid #333; border-radius: 50%; cursor: pointer;" title="Green"></button>
            <button class="color-option" data-color="#2196F3" style="width: 32px; height: 32px; background: #2196F3; border: 2px solid #333; border-radius: 50%; cursor: pointer;" title="Blue"></button>
            <button class="color-option" data-color="#E91E63" style="width: 32px; height: 32px; background: #E91E63; border: 2px solid #333; border-radius: 50%; cursor: pointer;" title="Pink"></button>
          </div>
        </div>
      `;
      
      // Position menu
      menu.style.left = Math.min(x, window.innerWidth - 200) + 'px';
      menu.style.top = Math.max(y - 150, 10) + 'px';
      menu.style.display = 'block';
      
      // Add event listeners
      menu.querySelectorAll('.menu-option').forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.dataset.action;
          if (action === 'highlight') {
            highlightSelectedText('#FFC107');
          } else if (action === 'note') {
            createNoteForSelection();
          }
          menu.style.display = 'none';
        });
      });
      
      menu.querySelectorAll('.color-option').forEach(btn => {
        btn.addEventListener('click', () => {
          highlightSelectedText(btn.dataset.color);
          menu.style.display = 'none';
        });
      });
      
      // Close menu on outside click
      setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
          if (!menu.contains(e.target)) {
            menu.style.display = 'none';
            document.removeEventListener('click', closeMenu);
          }
        });
      }, 100);
    }
    
    function highlightSelectedText(color) {
      if (!selectedRange) return;
      
      try {
        const span = document.createElement('span');
        span.style.backgroundColor = color;
        span.style.padding = '2px 0';
        span.style.borderRadius = '2px';
        span.className = 'user-highlight';
        
        selectedRange.surroundContents(span);
        
        console.log('✓ Text highlighted:', selectedText.substring(0, 50));
        
        // Save highlight
        saveHighlight(selectedText, color);
        
      } catch (error) {
        console.error('Highlight error:', error);
      }
    }
    
    function createNoteForSelection() {
      if (window.NotesManager && typeof window.NotesManager.showNoteDialog === 'function') {
        window.NotesManager.showNoteDialog(selectedText);
      } else {
        const note = prompt('Add your note:', '');
        if (note) {
          saveHighlight(selectedText, '#FFC107', note);
          alert('Note saved!');
        }
      }
    }
    
    function saveHighlight(text, color, note = null) {
      const highlights = JSON.parse(localStorage.getItem('userHighlights') || '[]');
      highlights.push({
        text,
        color,
        note,
        timestamp: Date.now(),
        document: window.currentFileName || 'unknown'
      });
      localStorage.setItem('userHighlights', JSON.stringify(highlights));
    }
    
    console.log('✓ Text selection highlighting enabled');
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
      // Ensure panel is hidden by default
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
        `;
      }
      
      // Fix container
      if (statsContainer) {
        statsContainer.style.cssText = `
          flex: 1 !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          -webkit-overflow-scrolling: touch !important;
          padding: 12px !important;
          padding-bottom: 80px !important;
          height: auto !important;
        `;
      }
      
      console.log('✓ Statistics panel sizing fixed (enhanced + hidden when inactive)');
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

