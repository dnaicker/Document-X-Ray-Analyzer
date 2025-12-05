/**
 * Mobile Document Scroll
 * Enables continuous scrolling for PDF viewing instead of just paging
 */

(function() {
  'use strict';

  console.log('📜 Mobile document scroll initializing...');

  let isScrollMode = true; // Default to scroll mode
  let renderedPages = new Set();
  let currentPdf = null;

  function init() {
    setupScrollMode();
    console.log('✅ Mobile document scroll ready');
  }

  /**
   * Setup continuous scroll mode for PDFs
   */
  function setupScrollMode() {
    // Add scroll mode toggle to PDF controls
    addScrollModeToggle();
    
    // Monitor when PDF is loaded
    const originalLoadPDF = window.MobileFileHandler?.loadPDFDocument;
    if (originalLoadPDF) {
      window.MobileFileHandler.loadPDFDocument = async function(arrayBuffer) {
        const result = await originalLoadPDF.call(this, arrayBuffer);
        
        if (isScrollMode && window.currentPdfData) {
          await setupContinuousScroll(window.currentPdfData);
        }
        
        return result;
      };
    }
  }

  /**
   * Add toggle button for scroll mode
   */
  function addScrollModeToggle() {
    const pdfControls = document.querySelector('.pdf-controls');
    if (!pdfControls) return;

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'btn-icon';
    toggleBtn.id = 'scrollModeToggle';
    toggleBtn.innerHTML = '📜';
    toggleBtn.title = 'Toggle Scroll/Page Mode';
    toggleBtn.style.cssText = 'min-width: 36px; min-height: 36px; font-size: 16px;';

    toggleBtn.addEventListener('click', () => {
      isScrollMode = !isScrollMode;
      toggleBtn.innerHTML = isScrollMode ? '📜' : '📄';
      toggleBtn.title = isScrollMode ? 'Scroll Mode (tap to switch to Page Mode)' : 'Page Mode (tap to switch to Scroll Mode)';
      
      if (window.currentPdfData) {
        if (isScrollMode) {
          setupContinuousScroll(window.currentPdfData);
        } else {
          setupPageMode(window.currentPdfData);
        }
      }
    });

    pdfControls.appendChild(toggleBtn);
    console.log('✓ Scroll mode toggle added');
  }

  /**
   * Setup continuous scrolling with all pages
   */
  async function setupContinuousScroll(pdf) {
    console.log('📜 Setting up continuous scroll for', pdf.numPages, 'pages');
    
    currentPdf = pdf;
    renderedPages.clear();
    
    const canvasWrapper = document.getElementById('pdfCanvas');
    if (!canvasWrapper) return;

    // Hide single canvas
    const singleCanvas = document.getElementById('pdfCanvasElement');
    if (singleCanvas) {
      singleCanvas.style.display = 'none';
    }

    // Hide page navigation buttons in scroll mode
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const pageInput = document.getElementById('pageInput');
    
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    if (pageInput) pageInput.parentElement.style.display = 'none';

    // Create scroll container
    let scrollContainer = document.getElementById('pdfScrollContainer');
    
    if (!scrollContainer) {
      scrollContainer = document.createElement('div');
      scrollContainer.id = 'pdfScrollContainer';
      scrollContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        padding: 20px 10px 80px 10px;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        height: 100%;
      `;
      canvasWrapper.appendChild(scrollContainer);
    } else {
      scrollContainer.innerHTML = ''; // Clear existing
      scrollContainer.style.display = 'flex';
    }

    // Render first 3 pages immediately
    for (let i = 1; i <= Math.min(3, pdf.numPages); i++) {
      await renderPageToScroll(pdf, i, scrollContainer);
    }

    // Lazy load remaining pages on scroll
    let isLoading = false;
    
    scrollContainer.addEventListener('scroll', async () => {
      if (isLoading) return;
      
      const scrollPercentage = (scrollContainer.scrollTop + scrollContainer.clientHeight) / scrollContainer.scrollHeight;
      
      // Load more when 70% scrolled
      if (scrollPercentage > 0.7) {
        const nextPage = renderedPages.size + 1;
        
        if (nextPage <= pdf.numPages) {
          isLoading = true;
          await renderPageToScroll(pdf, nextPage, scrollContainer);
          isLoading = false;
        }
      }
    });

    console.log('✓ Continuous scroll enabled');
  }

  /**
   * Render a single page to scroll container
   */
  async function renderPageToScroll(pdf, pageNum, container) {
    if (renderedPages.has(pageNum)) return;
    
    try {
      const page = await pdf.getPage(pageNum);
      
      // Create page wrapper
      const pageWrapper = document.createElement('div');
      pageWrapper.className = 'scroll-page';
      pageWrapper.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        background: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border-radius: 4px;
        padding: 10px;
        width: 100%;
        max-width: 800px;
      `;

      // Page number label
      const label = document.createElement('div');
      label.textContent = `Page ${pageNum}`;
      label.style.cssText = `
        font-size: 12px;
        color: #666;
        margin-bottom: 8px;
        font-weight: 500;
      `;
      pageWrapper.appendChild(label);

      // Create canvas for this page
      const canvas = document.createElement('canvas');
      canvas.className = 'scroll-page-canvas';
      const context = canvas.getContext('2d');

      // Calculate scale
      const viewport = page.getViewport({ scale: 1.0 });
      const containerWidth = container.clientWidth - 60; // Account for padding
      const scale = Math.min(containerWidth / viewport.width, 2.0);
      const scaledViewport = page.getViewport({ scale });

      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      canvas.style.cssText = 'max-width: 100%; height: auto; display: block;';

      // Render page
      await page.render({
        canvasContext: context,
        viewport: scaledViewport
      }).promise;

      pageWrapper.appendChild(canvas);
      container.appendChild(pageWrapper);
      
      renderedPages.add(pageNum);
      
      console.log('✓ Rendered page', pageNum, 'to scroll');
      
    } catch (error) {
      console.error('Error rendering page', pageNum, ':', error);
    }
  }

  /**
   * Setup page mode (original behavior)
   */
  function setupPageMode(pdf) {
    console.log('📄 Setting up page mode');
    
    // Show single canvas
    const singleCanvas = document.getElementById('pdfCanvasElement');
    if (singleCanvas) {
      singleCanvas.style.display = 'block';
    }

    // Show page navigation buttons
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const pageInput = document.getElementById('pageInput');
    
    if (prevBtn) prevBtn.style.display = '';
    if (nextBtn) nextBtn.style.display = '';
    if (pageInput) pageInput.parentElement.style.display = '';

    // Hide scroll container
    const scrollContainer = document.getElementById('pdfScrollContainer');
    if (scrollContainer) {
      scrollContainer.style.display = 'none';
    }

    console.log('✓ Page mode enabled');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 500); // Wait for other mobile scripts
  }

  // Expose API
  window.MobileDocumentScroll = {
    setupContinuousScroll,
    setupPageMode,
    isScrollMode: () => isScrollMode
  };

})();

