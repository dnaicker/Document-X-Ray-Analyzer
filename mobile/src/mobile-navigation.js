/**
 * Mobile Navigation Controller
 * Handles bottom navigation bar and view switching for mobile layout
 */

(function() {
  'use strict';

  // Only run on mobile
  if (window.innerWidth > 768) {
    return;
  }

  console.log('📱 Mobile navigation initialized');

  // Navigation state
  let currentView = 'library';

  // Get elements
  const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
  const panels = {
    library: document.getElementById('libraryPanel'),
    reader: document.getElementById('pdfPanel'),
    analyze: document.getElementById('textPanel'),
    stats: document.getElementById('statsPanel')
  };

  // Toggle highlight options on mobile
  const toggleHighlightOptionsBtn = document.getElementById('toggleHighlightOptions');
  const highlightOptionsPanel = document.getElementById('highlightOptionsPanel');

  if (toggleHighlightOptionsBtn && highlightOptionsPanel) {
    toggleHighlightOptionsBtn.addEventListener('click', () => {
      highlightOptionsPanel.classList.toggle('expanded');
      const isExpanded = highlightOptionsPanel.classList.contains('expanded');
      toggleHighlightOptionsBtn.textContent = isExpanded ? '🎨 Highlight Options ▲' : '🎨 Highlight Options ▼';
    });
  }

  /**
   * Switch to a specific view
   */
  function switchView(viewName) {
    console.log(`📱 Switching to view: ${viewName}`);
    
    // Update current view
    currentView = viewName;

    // Update bottom nav active state
    bottomNavItems.forEach(item => {
      const itemView = item.getAttribute('data-view');
      if (itemView === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Hide all panels
    Object.values(panels).forEach(panel => {
      if (panel) {
        panel.classList.remove('active');
        // Explicitly hide inactive panels
        panel.style.display = 'none';
        panel.style.visibility = 'hidden';
        panel.style.pointerEvents = 'none';
        panel.style.zIndex = '1';
      }
    });

    // Show active panel
    const activePanel = panels[viewName];
    if (activePanel) {
      activePanel.classList.add('active');
      // Explicitly show active panel
      activePanel.style.display = 'flex';
      activePanel.style.visibility = 'visible';
      activePanel.style.pointerEvents = 'auto';
      activePanel.style.zIndex = '2';
      
      // Trigger any view-specific logic
      handleViewActivation(viewName);
    }

    // Update FAB (Floating Action Button)
    updateFAB(viewName);

    // Update app title
    updateAppTitle(viewName);

    // Add haptic feedback if available
    if (window.Capacitor && window.Capacitor.Plugins.Haptics) {
      window.Capacitor.Plugins.Haptics.impact({ style: 'light' });
    }
  }

  /**
   * Handle view-specific activation logic
   */
  function handleViewActivation(viewName) {
    switch (viewName) {
      case 'reader':
        // Ensure PDF is rendered if loaded
        if (window.currentPdfData) {
          console.log('📄 Reader view activated');
        }
        break;
      case 'analyze':
        // Refresh analysis if needed
        console.log('✨ Analyze view activated');
        break;
      case 'stats':
        // Refresh stats if needed
        console.log('📊 Stats view activated');
        break;
      case 'library':
        console.log('📚 Library view activated');
        break;
    }
  }

  /**
   * Update Floating Action Button based on current view
   */
  function updateFAB(viewName) {
    const fab = document.getElementById('mobileFab');
    if (!fab) return;

    switch (viewName) {
      case 'library':
        fab.textContent = '+';
        fab.title = 'Add Document';
        fab.classList.remove('hidden');
        fab.onclick = () => {
          // Trigger file picker using mobile file handler
          if (window.MobileFileHandler) {
            window.MobileFileHandler.openFile();
          } else {
            document.getElementById('openFileBtn')?.click();
          }
        };
        break;
      case 'reader':
        fab.classList.add('hidden');
        break;
      case 'analyze':
        fab.classList.add('hidden');
        break;
      case 'stats':
        fab.classList.add('hidden');
        break;
      default:
        fab.classList.add('hidden');
    }
  }

  /**
   * Update app title based on view
   */
  function updateAppTitle(viewName) {
    const titleElement = document.getElementById('mobileAppTitle');
    if (!titleElement) return;

    // If a file is loaded, show filename; otherwise show view name
    if (window.currentFileName) {
      titleElement.textContent = window.currentFileName;
      return;
    }

    const titles = {
      library: '📁 File Directory',
      reader: '📄 Viewer',
      analyze: '📝 Extracted Text',
      stats: '📊 Statistics'
    };

    titleElement.textContent = titles[viewName] || 'Grammar Highlighter';
  }

  /**
   * Setup mobile menu
   */
  function setupMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const moreBtn = document.getElementById('mobileMoreBtn');

    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        // Show menu options
        showMobileMenu();
      });
    }

    if (moreBtn) {
      moreBtn.addEventListener('click', () => {
        // Show more options
        showMoreOptions();
      });
    }
  }

  /**
   * Show mobile menu (replaces desktop File menu)
   */
  function showMobileMenu() {
    // Create a simple menu overlay
    const menuOptions = [
      { label: '📂 Open File', action: () => document.getElementById('openFileBtn')?.click() },
      { label: '📁 Open Folder', action: () => window.LibraryManager?.importFolder() },
      { label: '☁️ Sync with Drive', action: () => document.getElementById('syncDriveBtn')?.click() }
    ];

    showActionSheet('File Menu', menuOptions);
  }

  /**
   * Show more options
   */
  function showMoreOptions() {
    const moreOptions = [
      { label: '⚙️ Settings', action: () => console.log('Settings') },
      { label: '❓ Help', action: () => console.log('Help') },
      { label: 'ℹ️ About', action: () => console.log('About') }
    ];

    showActionSheet('More Options', moreOptions);
  }

  /**
   * Show action sheet (mobile-style menu)
   */
  function showActionSheet(title, options) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'mobile-action-sheet-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 10000;
      display: flex;
      align-items: flex-end;
      animation: fadeIn 0.2s ease;
    `;

    // Create sheet
    const sheet = document.createElement('div');
    sheet.className = 'mobile-action-sheet';
    sheet.style.cssText = `
      background: white;
      width: 100%;
      border-radius: 16px 16px 0 0;
      padding: 20px;
      animation: slideUp 0.3s ease;
    `;

    // Add title
    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    titleEl.style.cssText = 'margin: 0 0 16px 0; font-size: 18px; color: #333;';
    sheet.appendChild(titleEl);

    // Add options
    options.forEach(option => {
      const btn = document.createElement('button');
      btn.textContent = option.label;
      btn.style.cssText = `
        display: block;
        width: 100%;
        padding: 16px;
        background: #f5f5f5;
        border: none;
        border-radius: 8px;
        margin-bottom: 8px;
        font-size: 16px;
        text-align: left;
        cursor: pointer;
      `;
      btn.onclick = () => {
        option.action();
        document.body.removeChild(overlay);
      };
      sheet.appendChild(btn);
    });

    // Add cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = `
      display: block;
      width: 100%;
      padding: 16px;
      background: #ef5350;
      color: white;
      border: none;
      border-radius: 8px;
      margin-top: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
    `;
    cancelBtn.onclick = () => document.body.removeChild(overlay);
    sheet.appendChild(cancelBtn);

    // Close on overlay click
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
      }
    };

    overlay.appendChild(sheet);
    document.body.appendChild(overlay);
  }

  /**
   * Setup swipe gestures for view switching (DISABLED for better interaction)
   */
  let swipeEnabled = false; // Disabled by default
  
  function setupSwipeGestures() {
    if (!swipeEnabled) {
      console.log('⚠️ Swipe navigation disabled - use bottom nav instead');
      return;
    }
    
    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 100; // Increased threshold

    document.addEventListener('touchstart', e => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    document.addEventListener('touchend', e => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const diff = touchEndX - touchStartX;
      
      if (Math.abs(diff) < swipeThreshold) return;

      const views = ['library', 'reader', 'analyze', 'stats'];
      const currentIndex = views.indexOf(currentView);

      if (diff > 0 && currentIndex > 0) {
        // Swipe right - go to previous view
        switchView(views[currentIndex - 1]);
      } else if (diff < 0 && currentIndex < views.length - 1) {
        // Swipe left - go to next view
        switchView(views[currentIndex + 1]);
      }
    }
  }
  
  /**
   * Disable swipe navigation
   */
  function disableSwipe() {
    swipeEnabled = false;
  }
  
  /**
   * Enable swipe navigation
   */
  function enableSwipe() {
    swipeEnabled = true;
    setupSwipeGestures();
  }

  // Initialize
  function init() {
    // Setup bottom navigation clicks
    bottomNavItems.forEach(item => {
      item.addEventListener('click', () => {
        const viewName = item.getAttribute('data-view');
        switchView(viewName);
      });
    });

    // Setup mobile menu
    setupMobileMenu();

    // Setup swipe gestures
    setupSwipeGestures();

    // Set initial view
    switchView('library');

    console.log('✅ Mobile navigation ready');
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API
  window.MobileNavigation = {
    switchView,
    getCurrentView: () => currentView,
    disableSwipe,
    enableSwipe
  };

})();

