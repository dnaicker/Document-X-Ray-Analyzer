/**
 * Mobile File Handler
 * Connects file opening buttons to Capacitor APIs
 */

(function() {
  'use strict';

  console.log('📱 Mobile file handler initialized');

  // Wait for DOM to be ready
  function init() {
    // Connect all file opening buttons
    connectFileButtons();
    
    // Connect folder import if available
    connectFolderButtons();
    
    console.log('✅ File handlers connected');
  }

  /**
   * Connect file opening buttons to mobile file picker
   */
  function connectFileButtons() {
    // Main open file button (in toolbar/menu)
    const openFileBtn = document.getElementById('openFileBtn');
    const welcomeOpenBtn = document.getElementById('welcomeOpenFileBtn');
    
    if (openFileBtn) {
      openFileBtn.addEventListener('click', handleOpenFile);
      console.log('✓ Connected: openFileBtn');
    }
    
    if (welcomeOpenBtn) {
      welcomeOpenBtn.addEventListener('click', handleOpenFile);
      console.log('✓ Connected: welcomeOpenFileBtn');
    }

    // Mobile menu button (if exists)
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', showMobileMenu);
      console.log('✓ Connected: mobileMenuBtn');
    }
  }

  /**
   * Connect folder import buttons
   */
  function connectFolderButtons() {
    // This will trigger when LibraryManager is loaded
    window.addEventListener('library-manager-ready', () => {
      console.log('✓ Library manager ready for folder import');
    });
  }

  /**
   * Handle file opening on mobile
   */
  async function handleOpenFile() {
    console.log('📂 Opening file picker...');
    
    try {
      // Create file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.epub,.docx,.doc,.md,.txt';
      input.style.display = 'none';
      
      // Handle file selection
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
          console.log('No file selected');
          return;
        }
        
        console.log('📄 File selected:', file.name);
        
        try {
          // Show loading
          showLoading('Loading file...');
          
          // Read file as array buffer
          const arrayBuffer = await readFileAsArrayBuffer(file);
          
          // Create file data object (compatible with desktop format)
          const fileData = {
            canceled: false,
            filePaths: [file.name],
            fileName: file.name,
            fileType: file.type || getFileTypeFromName(file.name),
            fileSize: file.size,
            data: arrayBuffer
          };
          
          // Determine file type
          const extension = file.name.split('.').pop().toLowerCase();
          
          // Load appropriate viewer based on file type
          await loadDocument(fileData, extension);
          
          // Load notes for this file - use a small delay to ensure everything is initialized
          setTimeout(() => {
            if (window.notesManager && window.notesManager.loadNotesForFile) {
              console.log('📝 Loading notes for file:', fileData.fileName);
              console.log('📝 Current global file path:', window.currentFilePath);
              
              // Use the global currentFilePath which was set by loadDocument
              window.notesManager.loadNotesForFile(window.currentFilePath);
              
              console.log('📝 After loading - notes:', window.notesManager.notes.length, 'highlights:', window.notesManager.highlights.length);
              
              // Apply highlights immediately after loading
              // This ensures stored highlights render even before analysis completes
              setTimeout(() => {
                console.log('📝 Applying loaded highlights...');
                window.notesManager.applyHighlights();
              }, 100);
            } else {
              console.warn('⚠️ notesManager not available for loading notes');
            }
          }, 500);
          
          // Add to recent files
          if (window.addToRecentFiles) {
            window.addToRecentFiles(file.name, file.name);
          }
          
          // Switch to viewer tab automatically
          if (window.MobileNavigation) {
            window.MobileNavigation.switchView('reader');
          }
          
          hideLoading();
          
        } catch (error) {
          console.error('Error loading file:', error);
          hideLoading();
          alert('Error loading file: ' + error.message);
        }
        
        // Clean up
        document.body.removeChild(input);
      };
      
      // Add to DOM and trigger
      document.body.appendChild(input);
      input.click();
      
    } catch (error) {
      console.error('Error opening file picker:', error);
      alert('Error opening file picker: ' + error.message);
    }
  }

  /**
   * Read file as array buffer
   */
  function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Get file type from filename
   */
  function getFileTypeFromName(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const mimeTypes = {
      'pdf': 'application/pdf',
      'epub': 'application/epub+zip',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'doc': 'application/msword',
      'txt': 'text/plain',
      'md': 'text/markdown'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Load document based on type
   */
  async function loadDocument(fileData, extension) {
    console.log('📖 Loading document:', extension);
    
    // Set global state
    window.currentFileName = fileData.fileName;
    window.currentFilePath = fileData.fileName;
    window.currentFileType = extension;
    
    // Update file name display
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    if (fileNameDisplay) {
      fileNameDisplay.textContent = fileData.fileName;
    }
    
    const mobileAppTitle = document.getElementById('mobileAppTitle');
    if (mobileAppTitle) {
      mobileAppTitle.textContent = fileData.fileName;
    }
    
    try {
      switch (extension) {
        case 'pdf':
          await loadPDFDocument(fileData.data);
          break;
          
        case 'epub':
          await loadEPUBDocument(fileData.data);
          break;
          
        case 'docx':
        case 'doc':
          await loadDOCXDocument(fileData.data);
          break;
          
        case 'txt':
          await loadTXTDocument(fileData.data);
          break;
          
        case 'md':
          await loadMarkdownDocument(fileData.data);
          break;
          
        default:
          throw new Error('Unsupported file type: ' + extension);
      }
      
      console.log('✅ Document loaded successfully');
      
    } catch (error) {
      console.error('Error loading document:', error);
      throw error;
    }
  }

  /**
   * Load PDF document (mobile-compatible)
   */
  async function loadPDFDocument(arrayBuffer) {
    console.log('📄 Loading PDF...');
    
    // Ensure PDF.js is loaded
    if (!window.pdfjsLib) {
      throw new Error('PDF.js library not loaded. Please refresh the page.');
    }
    
    try {
      // Configure PDF.js worker
      if (!window.pdfjsLib.GlobalWorkerOptions.workerSrc) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      }
      
      // Load PDF
      const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      console.log('✓ PDF loaded:', pdf.numPages, 'pages');
      
      // Store PDF data globally
      window.currentPdfData = pdf;
      window.currentPage = 1;
      
      // Hide empty state and show canvas
      const emptyState = document.querySelector('.viewer-empty-state');
      const canvas = document.getElementById('pdfCanvasElement');
      const canvasWrapper = document.getElementById('pdfCanvas');
      
      if (emptyState) {
        emptyState.style.display = 'none';
      }
      
      if (canvas) {
        canvas.style.display = 'block';
      }
      
      if (canvasWrapper) {
        canvasWrapper.style.display = 'flex';
        canvasWrapper.style.justifyContent = 'center';
        canvasWrapper.style.alignItems = 'flex-start';
        canvasWrapper.style.padding = '20px';
        canvasWrapper.style.overflow = 'auto';
      }
      
      console.log('📱 Rendering PDF page 1 of', pdf.numPages);
      
      // Always use manual rendering for mobile
      await renderPDFPage(pdf, 1);
      
      // Update UI controls
      updatePDFControls(pdf.numPages, 1);
      
      // Setup navigation buttons
      setupPDFNavigation();
      
      // Extract text for analysis (in background)
      setTimeout(() => extractPDFText(pdf), 500);
      
    } catch (error) {
      console.error('PDF loading error:', error);
      throw new Error('Failed to load PDF: ' + error.message);
    }
  }

  /**
   * Render PDF page manually
   */
  async function renderPDFPage(pdf, pageNum) {
    console.log('🎨 Rendering page', pageNum);
    
    try {
      const page = await pdf.getPage(pageNum);
      const canvas = document.getElementById('pdfCanvasElement');
      
      if (!canvas) {
        throw new Error('Canvas element not found');
      }
      
      const context = canvas.getContext('2d');
      
      // Calculate scale to fit screen
      const viewport = page.getViewport({ scale: 1.0 });
      const container = document.getElementById('pdfViewerContainer');
      const containerWidth = container.clientWidth || window.innerWidth;
      const containerHeight = container.clientHeight || window.innerHeight - 200;
      
      // Use a reasonable scale for mobile
      const scale = Math.min(
        (containerWidth - 40) / viewport.width,
        (containerHeight - 40) / viewport.height,
        2.0 // Max scale
      );
      
      const scaledViewport = page.getViewport({ scale: Math.max(scale, 0.5) });
      
      // Set canvas dimensions
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;
      
      // Make sure canvas is visible
      canvas.style.display = 'block';
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
      
      // Clear canvas
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Render page
      const renderContext = {
        canvasContext: context,
        viewport: scaledViewport
      };
      
      await page.render(renderContext).promise;
      
      // Store current page globally
      window.currentPage = pageNum;
      
      console.log('✓ Page', pageNum, 'rendered successfully');
      console.log('  Canvas size:', canvas.width, 'x', canvas.height);
      console.log('  Scale:', scale);
      
    } catch (error) {
      console.error('❌ Error rendering page:', error);
      throw error;
    }
  }

  /**
   * Update PDF controls
   */
  function updatePDFControls(totalPages, currentPage = 1) {
    const totalPagesDisplay = document.getElementById('totalPagesDisplay');
    const pageInput = document.getElementById('pageInput');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    if (totalPagesDisplay) {
      totalPagesDisplay.textContent = totalPages;
    }
    
    if (pageInput) {
      pageInput.value = currentPage;
      pageInput.max = totalPages;
    }
    
    if (prevBtn) {
      prevBtn.disabled = (currentPage <= 1);
    }
    
    if (nextBtn) {
      nextBtn.disabled = (currentPage >= totalPages);
    }
    
    console.log('📊 Controls updated: Page', currentPage, 'of', totalPages);
  }

  /**
   * Setup PDF page navigation
   */
  function setupPDFNavigation() {
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const pageInput = document.getElementById('pageInput');
    
    // Previous page
    if (prevBtn) {
      prevBtn.replaceWith(prevBtn.cloneNode(true)); // Remove old listeners
      const newPrevBtn = document.getElementById('prevPageBtn');
      
      newPrevBtn.addEventListener('click', async () => {
        const currentPage = window.currentPage || 1;
        if (currentPage > 1 && window.currentPdfData) {
          try {
            showLoading('Loading page...');
            await renderPDFPage(window.currentPdfData, currentPage - 1);
            updatePDFControls(window.currentPdfData.numPages, currentPage - 1);
            hideLoading();
          } catch (error) {
            console.error('Error going to previous page:', error);
            hideLoading();
          }
        }
      });
      console.log('✓ Previous button connected');
    }
    
    // Next page
    if (nextBtn) {
      nextBtn.replaceWith(nextBtn.cloneNode(true)); // Remove old listeners
      const newNextBtn = document.getElementById('nextPageBtn');
      
      newNextBtn.addEventListener('click', async () => {
        const currentPage = window.currentPage || 1;
        const totalPages = window.currentPdfData ? window.currentPdfData.numPages : 1;
        
        if (currentPage < totalPages && window.currentPdfData) {
          try {
            showLoading('Loading page...');
            await renderPDFPage(window.currentPdfData, currentPage + 1);
            updatePDFControls(totalPages, currentPage + 1);
            hideLoading();
          } catch (error) {
            console.error('Error going to next page:', error);
            hideLoading();
          }
        }
      });
      console.log('✓ Next button connected');
    }
    
    // Page input
    if (pageInput) {
      pageInput.replaceWith(pageInput.cloneNode(true)); // Remove old listeners
      const newPageInput = document.getElementById('pageInput');
      
      newPageInput.addEventListener('change', async (e) => {
        const targetPage = parseInt(e.target.value);
        const totalPages = window.currentPdfData ? window.currentPdfData.numPages : 1;
        
        if (targetPage >= 1 && targetPage <= totalPages && window.currentPdfData) {
          try {
            showLoading('Loading page...');
            await renderPDFPage(window.currentPdfData, targetPage);
            updatePDFControls(totalPages, targetPage);
            hideLoading();
          } catch (error) {
            console.error('Error going to page:', error);
            hideLoading();
          }
        } else {
          e.target.value = window.currentPage || 1;
        }
      });
      
      newPageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          newPageInput.blur();
        }
      });
      
      console.log('✓ Page input connected');
    }
  }

  /**
   * Extract text from PDF for analysis
   */
  async function extractPDFText(pdf) {
    console.log('📝 Extracting text from PDF...');
    
    try {
      let fullText = '';
      const maxPages = Math.min(pdf.numPages, 10); // Extract first 10 pages
      
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += `\n--- Page ${i} ---\n${pageText}\n`;
      }
      
      console.log('✓ Extracted', fullText.length, 'characters from', maxPages, 'pages');
      
      // Store extracted text globally
      window.currentExtractedText = fullText;
      
      // Display in raw text container (for analysis)
      const rawTextContent = document.getElementById('rawTextContent');
      if (rawTextContent) {
        rawTextContent.textContent = fullText;
      }
      
      // Display plain text initially in highlighted text view
      // This will be replaced by POS-highlighted text when analysis completes
      const highlightedTextContent = document.getElementById('highlightedTextContent');
      if (highlightedTextContent) {
        const placeholder = highlightedTextContent.querySelector('.placeholder-text');
        if (placeholder) {
          placeholder.remove();
        }
        // Show plain text immediately so user sees content
        highlightedTextContent.innerHTML = `<div class="text-content-inner" style="padding: 20px; white-space: pre-wrap;">${escapeHtml(fullText)}</div>`;
      }
      
      // Trigger analysis if performAnalysis is available
      // This will replace plain text with POS highlighted text and apply user highlights
      if (window.performAnalysis && typeof window.performAnalysis === 'function') {
        console.log('🔄 Starting text analysis...');
        setTimeout(() => {
          window.performAnalysis();
        }, 200);
      } else {
        console.warn('⚠️ performAnalysis not available - showing plain text only');
      }
      
      // Update statistics if available
      if (window.updateStatistics && typeof window.updateStatistics === 'function') {
        setTimeout(() => {
          window.updateStatistics(fullText);
        }, 300);
      }
      
      console.log('✅ Text extraction and display complete');
      
    } catch (error) {
      console.error('Text extraction error:', error);
    }
  }

  /**
   * Load EPUB document
   */
  async function loadEPUBDocument(arrayBuffer) {
    console.log('📖 Loading EPUB...');
    
    if (!window.ePub) {
      throw new Error('EPUB.js library not loaded');
    }
    
    try {
      const book = window.ePub(arrayBuffer);
      window.currentEpubBook = book;
      
      if (window.EPUBReader && typeof window.EPUBReader.renderEPUB === 'function') {
        await window.EPUBReader.renderEPUB(book);
      } else {
        throw new Error('EPUB reader not initialized');
      }
      
      console.log('✓ EPUB loaded');
    } catch (error) {
      throw new Error('Failed to load EPUB: ' + error.message);
    }
  }

  /**
   * Load DOCX document
   */
  async function loadDOCXDocument(arrayBuffer) {
    console.log('📄 Loading DOCX...');
    
    if (!window.mammoth) {
      throw new Error('Mammoth.js library not loaded');
    }
    
    try {
      const result = await window.mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;
      
      // Display HTML in viewer
      const container = document.getElementById('pdfCanvas');
      if (container) {
        container.innerHTML = `<div class="docx-content" style="padding: 20px; background: white;">${html}</div>`;
      }
      
      // Extract text for analysis
      const text = container ? container.textContent || '' : '';
      
      // Store in raw text container
      const rawTextContent = document.getElementById('rawTextContent');
      if (rawTextContent) {
        rawTextContent.textContent = text;
      }
      
      // Display plain text in Analysis tab (will be replaced by POS highlighting)
      const highlightedTextContent = document.getElementById('highlightedTextContent');
      if (highlightedTextContent) {
        const placeholder = highlightedTextContent.querySelector('.placeholder-text');
        if (placeholder) placeholder.remove();
        highlightedTextContent.innerHTML = `<div class="text-content-inner" style="padding: 20px; white-space: pre-wrap;">${escapeHtml(text)}</div>`;
      }
      
      // Trigger analysis
      if (window.performAnalysis) {
        setTimeout(() => window.performAnalysis(), 100);
      }
      
      console.log('✓ DOCX loaded');
    } catch (error) {
      throw new Error('Failed to load DOCX: ' + error.message);
    }
  }

  /**
   * Load TXT document
   */
  async function loadTXTDocument(arrayBuffer) {
    console.log('📝 Loading TXT...');
    
    try {
      const text = new TextDecoder().decode(arrayBuffer);
      
      // Display text in viewer
      const container = document.getElementById('pdfCanvas');
      if (container) {
        container.innerHTML = `<div class="txt-content" style="padding: 20px; background: white; white-space: pre-wrap; font-family: monospace;">${escapeHtml(text)}</div>`;
      }
      
      // Store in raw text container
      const rawTextContent = document.getElementById('rawTextContent');
      if (rawTextContent) {
        rawTextContent.textContent = text;
      }
      
      // Display plain text in Analysis tab (will be replaced by POS highlighting)
      const highlightedTextContent = document.getElementById('highlightedTextContent');
      if (highlightedTextContent) {
        const placeholder = highlightedTextContent.querySelector('.placeholder-text');
        if (placeholder) placeholder.remove();
        highlightedTextContent.innerHTML = `<div class="text-content-inner" style="padding: 20px; white-space: pre-wrap;">${escapeHtml(text)}</div>`;
      }
      
      // Trigger analysis
      if (window.performAnalysis) {
        setTimeout(() => window.performAnalysis(), 100);
      }
      
      console.log('✓ TXT loaded');
    } catch (error) {
      throw new Error('Failed to load TXT: ' + error.message);
    }
  }

  /**
   * Load Markdown document
   */
  async function loadMarkdownDocument(arrayBuffer) {
    console.log('📝 Loading Markdown...');
    
    try {
      const text = new TextDecoder().decode(arrayBuffer);
      
      // Display markdown in viewer (you could add a markdown parser here)
      const container = document.getElementById('pdfCanvas');
      if (container) {
        container.innerHTML = `<div class="md-content" style="padding: 20px; background: white; white-space: pre-wrap;">${escapeHtml(text)}</div>`;
      }
      
      // Store in raw text container
      const rawTextContent = document.getElementById('rawTextContent');
      if (rawTextContent) {
        rawTextContent.textContent = text;
      }
      
      // Display plain text in Analysis tab (will be replaced by POS highlighting)
      const highlightedTextContent = document.getElementById('highlightedTextContent');
      if (highlightedTextContent) {
        const placeholder = highlightedTextContent.querySelector('.placeholder-text');
        if (placeholder) placeholder.remove();
        highlightedTextContent.innerHTML = `<div class="text-content-inner" style="padding: 20px; white-space: pre-wrap;">${escapeHtml(text)}</div>`;
      }
      
      // Trigger analysis
      if (window.performAnalysis) {
        setTimeout(() => window.performAnalysis(), 100);
      }
      
      console.log('✓ Markdown loaded');
    } catch (error) {
      throw new Error('Failed to load Markdown: ' + error.message);
    }
  }

  /**
   * Escape HTML for safe display
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show mobile menu (replaces desktop File menu)
   */
  function showMobileMenu() {
    const menuOptions = [
      { 
        label: '📂 Open File', 
        action: handleOpenFile 
      },
      { 
        label: '📁 Open Folder', 
        action: () => {
          if (window.LibraryManager && window.LibraryManager.importFolder) {
            window.LibraryManager.importFolder();
          } else {
            alert('Folder import coming soon!');
          }
        }
      },
      { 
        label: '☁️ Sync with Drive', 
        action: () => {
          const syncBtn = document.getElementById('syncDriveBtn');
          if (syncBtn) {
            syncBtn.click();
          } else {
            alert('Google Drive sync requires setup. See docs for details.');
          }
        }
      }
    ];

    showActionSheet('File Menu', menuOptions);
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
      max-height: 70vh;
      overflow-y: auto;
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
   * Show loading overlay
   */
  function showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loadingOverlay');
    const messageEl = document.getElementById('loadingMessage');
    
    if (overlay) {
      overlay.classList.remove('hidden');
    }
    
    if (messageEl) {
      messageEl.textContent = message;
    }
  }

  /**
   * Hide loading overlay
   */
  function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API
  window.MobileFileHandler = {
    openFile: handleOpenFile,
    showMenu: showMobileMenu
  };

})();

