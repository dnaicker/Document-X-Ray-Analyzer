/**
 * Mobile View Tabs Handler
 * Manages the sub-tabs within the Analysis view (Analyse, Notes, Translate, Map, Mindmap, Figures)
 */

(function() {
  'use strict';

  console.log('📱 Mobile view tabs initializing...');

  // Wait for DOM to be ready
  function init() {
    setupAnalysisViewTabs();
    console.log('✅ Mobile view tabs initialized');
  }

  /**
   * Setup the sub-tabs in the Analysis/Text panel
   */
  function setupAnalysisViewTabs() {
    // Get all the view toggle buttons
    const highlightedTextBtn = document.getElementById('highlightedTextBtn');
    const notesBtn = document.getElementById('notesBtn');
    const translateTabBtn = document.getElementById('translateTabBtn');
    const mapBtn = document.getElementById('mapBtn');
    const mindmapBtn = document.getElementById('mindmapBtn');
    const figuresBtn = document.getElementById('figuresBtn');

    // Get all the view containers
    const views = {
      highlighted: document.getElementById('highlightedTextView'),
      notes: document.getElementById('notesView'),
      translate: document.getElementById('translateView'),
      map: document.getElementById('mapView'),
      mindmap: document.getElementById('mindmapView'),
      figures: document.getElementById('figuresView')
    };

    // Connect buttons to views
    if (highlightedTextBtn) {
      highlightedTextBtn.addEventListener('click', () => switchAnalysisView('highlighted', views));
    }

    if (notesBtn) {
      notesBtn.addEventListener('click', () => switchAnalysisView('notes', views));
    }

    if (translateTabBtn) {
      translateTabBtn.addEventListener('click', () => switchAnalysisView('translate', views));
    }

    if (mapBtn) {
      mapBtn.addEventListener('click', () => switchAnalysisView('map', views));
    }

    if (mindmapBtn) {
      mindmapBtn.addEventListener('click', () => switchAnalysisView('mindmap', views));
    }

    if (figuresBtn) {
      figuresBtn.addEventListener('click', () => switchAnalysisView('figures', views));
    }

    console.log('✓ Analysis view tabs connected');
  }

  /**
   * Switch between analysis sub-views
   */
  function switchAnalysisView(viewName, views) {
    console.log('📝 Switching analysis view to:', viewName);

    // Get all toggle buttons
    const buttons = document.querySelectorAll('.btn-toggle');

    // Remove active class from all buttons
    buttons.forEach(btn => btn.classList.remove('active'));

    // Add active class to clicked button
    const buttonMap = {
      'highlighted': document.getElementById('highlightedTextBtn'),
      'notes': document.getElementById('notesBtn'),
      'translate': document.getElementById('translateTabBtn'),
      'map': document.getElementById('mapBtn'),
      'mindmap': document.getElementById('mindmapBtn'),
      'figures': document.getElementById('figuresBtn')
    };

    const activeButton = buttonMap[viewName];
    if (activeButton) {
      activeButton.classList.add('active');
    }

    // Hide all views
    Object.values(views).forEach(view => {
      if (view) {
        view.classList.remove('active');
        view.style.display = 'none';
      }
    });

    // Show active view
    const activeView = views[viewName];
    if (activeView) {
      activeView.classList.add('active');
      activeView.style.display = 'flex';
      
      // Trigger view-specific initialization
      handleAnalysisViewActivation(viewName);
    }

    // Haptic feedback on mobile
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Haptics) {
      window.Capacitor.Plugins.Haptics.impact({ style: 'light' });
    }
  }

  /**
   * Handle view-specific activation
   */
  function handleAnalysisViewActivation(viewName) {
    switch (viewName) {
      case 'highlighted':
        console.log('✨ Analyse view active');
        // Trigger re-highlighting if needed
        if (window.updateHighlighting && typeof window.updateHighlighting === 'function') {
          window.updateHighlighting();
        }
        break;

      case 'notes':
        console.log('📌 Notes view active - forcing render');
        // Small delay to ensure DOM is updated before rendering
        setTimeout(() => {
          if (window.notesManager) {
            console.log('Calling notesManager.render()...', {
              notesCount: window.notesManager.notes.length,
              highlightsCount: window.notesManager.highlights.length,
              currentFilePath: window.notesManager.currentFilePath,
              notesContent: !!window.notesManager.notesContent,
              notesContentVisible: window.notesManager.notesContent && window.notesManager.notesContent.offsetParent !== null
            });
            
            // Force render by directly calling the render logic
            // bypassing the visibility check
            const notesContent = window.notesManager.notesContent;
            if (notesContent) {
              // Manually trigger render regardless of visibility
              let allItems = [
                ...window.notesManager.notes.map(n => ({ ...n, sortDate: n.createdAt })),
                ...window.notesManager.highlights.map(h => ({ ...h, sortDate: h.createdAt }))
              ].sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate));
              
              console.log('Total items to display:', allItems.length);
              
              if (allItems.length === 0) {
                notesContent.innerHTML = `
                  <div class="placeholder-text">
                    <p>📌 No notes yet</p>
                    <p style="font-size: 14px; color: #666;">Select text and click "Highlight Selection" or add notes manually</p>
                  </div>
                `;
              } else {
                // Call the actual render method
                window.notesManager.render();
              }
              
              // Update count
              if (window.notesManager.notesCount) {
                window.notesManager.notesCount.textContent = 
                  `${window.notesManager.notes.length} notes, ${window.notesManager.highlights.length} highlights`;
              }
            }
            console.log('✅ Render complete');
          } else {
            console.error('❌ No notesManager found!');
          }
        }, 100);
        break;

      case 'translate':
        console.log('🌐 Translate view active');
        // Initialize translation if needed
        break;

      case 'map':
        console.log('🗺️ Map view active');
        // Render map if needed
        if (window.renderMap && typeof window.renderMap === 'function') {
          setTimeout(() => window.renderMap(), 100);
        }
        break;

      case 'mindmap':
        console.log('🧠 Mindmap view active');
        // Initialize mindmap if needed
        if (window.MindmapManager && typeof window.MindmapManager.initialize === 'function') {
          setTimeout(() => window.MindmapManager.initialize(), 100);
        }
        break;

      case 'figures':
        console.log('🖼️ Figures view active');
        // Show figures if available
        break;
    }
  }

  /**
   * Setup pull-to-refresh for notes tab
   */
  function setupPullToRefresh() {
    const notesView = document.getElementById('notesView');
    const notesContent = document.getElementById('notesContent');
    
    if (!notesView || !notesContent) {
      console.warn('⚠️ Notes view elements not found for pull-to-refresh');
      return;
    }

    let startY = 0;
    let currentY = 0;
    let pulling = false;
    let refreshThreshold = 80; // pixels to pull before triggering refresh
    
    // Create pull-to-refresh indicator
    const refreshIndicator = document.createElement('div');
    refreshIndicator.id = 'notesRefreshIndicator';
    refreshIndicator.style.cssText = `
      position: absolute;
      top: -60px;
      left: 0;
      right: 0;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #667eea;
      font-size: 14px;
      font-weight: 600;
      transition: transform 0.3s ease;
      pointer-events: none;
      z-index: 10;
    `;
    refreshIndicator.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
        <div class="refresh-spinner" style="display: none; width: 24px; height: 24px; border: 3px solid #e0e0e0; border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <div class="refresh-icon" style="font-size: 24px;">↓</div>
        <span class="refresh-text">Pull to refresh</span>
      </div>
    `;
    
    // Add spinner animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    // Make notes content container position relative
    notesContent.style.position = 'relative';
    notesContent.parentElement.style.position = 'relative';
    // Don't set overflow:hidden - it prevents scrolling
    // notesContent.parentElement.style.overflow = 'hidden';
    
    // Insert indicator
    notesContent.parentElement.insertBefore(refreshIndicator, notesContent);
    
    // Touch start
    notesContent.addEventListener('touchstart', (e) => {
      // Only start if scrolled to top
      if (notesContent.scrollTop === 0) {
        startY = e.touches[0].clientY;
        pulling = true;
      }
    }, { passive: true });
    
    // Touch move
    notesContent.addEventListener('touchmove', (e) => {
      if (!pulling) return;
      
      currentY = e.touches[0].clientY;
      const pullDistance = currentY - startY;
      
      // Only allow pulling down when at the top AND pulling down significantly
      // This prevents interfering with normal scrolling
      if (pullDistance > 10 && notesContent.scrollTop === 0) {
        // Prevent default scrolling only when actively pulling to refresh
        e.preventDefault();
        
        // Apply elastic resistance
        const resistance = 0.5;
        const adjustedDistance = Math.min(pullDistance * resistance, 100);
        
        // Move indicator and content
        refreshIndicator.style.transform = `translateY(${adjustedDistance}px)`;
        notesContent.style.transform = `translateY(${adjustedDistance}px)`;
        
        // Update icon based on pull distance
        const icon = refreshIndicator.querySelector('.refresh-icon');
        const text = refreshIndicator.querySelector('.refresh-text');
        
        if (adjustedDistance >= refreshThreshold * resistance) {
          icon.style.transform = 'rotate(180deg)';
          text.textContent = 'Release to refresh';
          refreshIndicator.style.color = '#4CAF50';
        } else {
          icon.style.transform = 'rotate(0deg)';
          text.textContent = 'Pull to refresh';
          refreshIndicator.style.color = '#667eea';
        }
      } else {
        // Not at top or pulling up/sideways - reset pulling state to allow normal scroll
        if (notesContent.scrollTop > 0 || pullDistance < 0) {
          pulling = false;
        }
      }
    }, { passive: false });
    
    // Touch end
    notesContent.addEventListener('touchend', async (e) => {
      if (!pulling) return;
      
      const pullDistance = currentY - startY;
      const adjustedDistance = Math.min(pullDistance * 0.5, 100);
      
      // Check if pulled enough to trigger refresh
      if (adjustedDistance >= refreshThreshold * 0.5) {
        // Show loading state
        const spinner = refreshIndicator.querySelector('.refresh-spinner');
        const icon = refreshIndicator.querySelector('.refresh-icon');
        const text = refreshIndicator.querySelector('.refresh-text');
        
        spinner.style.display = 'block';
        icon.style.display = 'none';
        text.textContent = 'Refreshing...';
        refreshIndicator.style.color = '#667eea';
        
        // Keep indicator visible during refresh
        refreshIndicator.style.transform = `translateY(60px)`;
        notesContent.style.transform = `translateY(60px)`;
        
        // Trigger refresh
        await refreshNotes();
        
        // Reset after a brief delay
        setTimeout(() => {
          refreshIndicator.style.transition = 'transform 0.3s ease';
          notesContent.style.transition = 'transform 0.3s ease';
          refreshIndicator.style.transform = 'translateY(0)';
          notesContent.style.transform = 'translateY(0)';
          
          setTimeout(() => {
            spinner.style.display = 'none';
            icon.style.display = 'block';
            text.textContent = 'Pull to refresh';
            refreshIndicator.style.transition = '';
            notesContent.style.transition = '';
          }, 300);
        }, 500);
      } else {
        // Snap back without refreshing
        refreshIndicator.style.transition = 'transform 0.3s ease';
        notesContent.style.transition = 'transform 0.3s ease';
        refreshIndicator.style.transform = 'translateY(0)';
        notesContent.style.transform = 'translateY(0)';
        
        setTimeout(() => {
          refreshIndicator.style.transition = '';
          notesContent.style.transition = '';
        }, 300);
      }
      
      pulling = false;
      startY = 0;
      currentY = 0;
    });
    
    console.log('✅ Pull-to-refresh enabled for notes tab');
  }

  /**
   * Refresh notes data
   */
  async function refreshNotes() {
    console.log('🔄 Refreshing notes...');
    
    if (window.notesManager) {
      // Reload notes from storage
      if (window.notesManager.currentFilePath && window.notesManager.loadNotesForFile) {
        window.notesManager.loadNotesForFile(window.notesManager.currentFilePath);
      }
      
      // Force render
      const notesContent = window.notesManager.notesContent;
      if (notesContent) {
        let allItems = [
          ...window.notesManager.notes.map(n => ({ ...n, sortDate: n.createdAt })),
          ...window.notesManager.highlights.map(h => ({ ...h, sortDate: h.createdAt }))
        ].sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate));
        
        console.log('✓ Refreshed:', allItems.length, 'items');
        window.notesManager.render();
      }
    }
    
    // Simulate network delay for smooth UX
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init();
      setupPullToRefresh();
    });
  } else {
    init();
    setupPullToRefresh();
  }

  // Expose API
  window.MobileViewTabs = {
    switchView: (viewName) => {
      const views = {
        highlighted: document.getElementById('highlightedTextView'),
        notes: document.getElementById('notesView'),
        translate: document.getElementById('translateView'),
        map: document.getElementById('mapView'),
        mindmap: document.getElementById('mindmapView'),
        figures: document.getElementById('figuresView')
      };
      switchAnalysisView(viewName, views);
    },
    refreshNotes: refreshNotes
  };

})();

