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
        console.log('📌 Notes view active');
        // Refresh notes list if needed
        if (window.NotesManager && typeof window.NotesManager.renderNotes === 'function') {
          window.NotesManager.renderNotes();
        }
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

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
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
    }
  };

})();

