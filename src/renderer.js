const { ipcRenderer } = require('electron');

// Global state
let currentPdfData = null;
let currentAnalysis = null;
let currentFileName = '';
let currentFilePath = '';
let currentFileType = 'pdf'; // 'pdf', 'epub', 'docx', 'md', or 'txt'
let translationState = {
    isTranslating: false,
    isComplete: false,
    targetLanguage: '',
    translatedContent: null,
    progress: 0,
    currentTranslatedText: '',
    currentLanguage: '',
    posAnalysisCache: {}, // Cache POS analysis per language
    lastAnalysis: null // Store analysis of translated text
};
let currentMapRenderPath = null; // Track which document the map is rendering for
let mindmapManager = null;

// Performance optimization: Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Debounced renderMap function
let renderMapDebounced = null;

// Recent Files Manager
// Tooltip Manager
class TooltipManager {
    constructor() {
        this.tooltip = document.getElementById('customTooltip');
        this.content = document.getElementById('tooltipContent');
        this.init();
    }
    
    init() {
        document.addEventListener('mouseover', (e) => {
            const target = e.target.closest('[data-tooltip]');
            if (target) {
                this.show(target, target.dataset.tooltip);
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            const target = e.target.closest('[data-tooltip]');
            if (target) {
                this.hide();
            }
        });
    }
    
    show(target, text) {
        if (!text || !text.trim() || !this.tooltip) return;
        
        this.content.innerHTML = text.replace(/\n/g, '<br>');
        this.tooltip.classList.remove('hidden');
        
        const rect = target.getBoundingClientRect();
        // Ensure tooltip is visible to calculate dimensions
        const tooltipRect = this.tooltip.getBoundingClientRect();
        
        let top = rect.top - tooltipRect.height - 12;
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        
        // Viewport boundaries
        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }
        
        // If top overflow, show below
        if (top < 10) {
            top = rect.bottom + 12;
            this.tooltip.classList.add('bottom');
        } else {
            this.tooltip.classList.remove('bottom');
        }
        
        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.left = `${left}px`;
    }
    
    hide() {
        if (this.tooltip) {
            this.tooltip.classList.add('hidden');
        }
    }
}

const tooltipManager = new TooltipManager();

// Google Drive Sync
const GoogleDriveSync = require('./components/google-drive-sync.js');
const driveSync = new GoogleDriveSync();

// UI Elements for Sync
const syncDriveBtn = document.getElementById('syncDriveBtn');
const syncDialog = document.getElementById('syncDialog');
const closeSyncDialog = document.getElementById('closeSyncDialog');
const gdriveLoginBtn = document.getElementById('gdriveLoginBtn');
const gdriveLogoutBtn = document.getElementById('gdriveLogoutBtn');
const syncStatusText = document.getElementById('syncStatusText');
const syncActions = document.getElementById('syncActions');
const syncUploadBtn = document.getElementById('syncUploadBtn');
const syncDownloadBtn = document.getElementById('syncDownloadBtn');
const syncDocumentsCheck = document.getElementById('syncDocumentsCheck');
const lastSyncTime = document.getElementById('lastSyncTime');
const syncLibraryUploadBtn = document.getElementById('syncLibraryUploadBtn');
const syncLibraryDownloadBtn = document.getElementById('syncLibraryDownloadBtn');
const librarySyncProgress = document.getElementById('librarySyncProgress');
const librarySyncStatus = document.getElementById('librarySyncStatus');
const librarySyncProgressBar = document.getElementById('librarySyncProgressBar');
const showStatsTabBtn = document.getElementById('showStatsTabBtn');
const collapseLibraryBtn = document.getElementById('collapseLibraryBtn');
const expandLibraryBtn = document.getElementById('expandLibraryBtn');
const collapseViewerBtn = document.getElementById('collapseViewerBtn');
const expandViewerBtn = document.getElementById('expandViewerBtn');
const collapseTextBtn = document.getElementById('collapseTextBtn');
const expandTextBtn = document.getElementById('expandTextBtn');
const collapseStatsBtn = document.getElementById('collapseStatsBtn');
const expandStatsBtn = document.getElementById('expandStatsBtn');
const libraryPanel = document.getElementById('libraryPanel');
const libraryResizer = document.getElementById('libraryResizer');

// Text Appearance Settings Manager
class TextSettingsManager {
    constructor() {
        this.popup = document.getElementById('textSettingsPopup');
        this.btns = document.querySelectorAll('.text-settings-btn');
        this.closeBtn = document.getElementById('closeSettingsBtn');
        
        this.fontSizeRange = document.getElementById('fontSizeRange');
        this.fontBtns = document.querySelectorAll('.font-family-group .btn-option');
        this.themeBtns = document.querySelectorAll('.theme-option');
        
        this.containers = [
            document.getElementById('rawTextContent'),
            document.getElementById('highlightedTextContent')
        ];
        
        this.settings = {
            fontSize: 14,
            fontFamily: 'sans',
            theme: 'light'
        };
        
        this.loadSettings();
        this.init();
    }
    
    init() {
        this.btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.popup.classList.toggle('hidden');
            });
        });
        
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                this.popup.classList.add('hidden');
            });
        }
        
        // Font Size
        this.fontSizeRange.addEventListener('input', (e) => {
            this.settings.fontSize = e.target.value;
            this.applySettings();
            this.saveSettings();
        });
        
        // Font Family
        this.fontBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.settings.fontFamily = btn.dataset.font;
                this.updateUI();
                this.applySettings();
                this.saveSettings();
            });
        });
        
        // Theme
        this.themeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.settings.theme = btn.dataset.theme;
                this.updateUI();
                this.applySettings();
                this.saveSettings();
            });
        });
        
        // Close when clicking outside
        document.addEventListener('click', (e) => {
            const isBtn = Array.from(this.btns).some(btn => btn.contains(e.target));
            if (this.popup && !this.popup.classList.contains('hidden') && !this.popup.contains(e.target) && !isBtn) {
                this.popup.classList.add('hidden');
            }
        });
    }
    
    loadSettings() {
        const saved = localStorage.getItem('textSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
            this.updateUI();
            this.applySettings();
        }
    }
    
    saveSettings() {
        localStorage.setItem('textSettings', JSON.stringify(this.settings));
    }
    
    updateUI() {
        if (this.fontSizeRange) this.fontSizeRange.value = this.settings.fontSize;
        
        this.fontBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.font === this.settings.fontFamily);
        });
        
        this.themeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === this.settings.theme);
        });
    }
    
    applySettings() {
        this.containers.forEach(container => {
            if (!container) return;
            
            // Font Size
            container.style.fontSize = `${this.settings.fontSize}px`;
            
            // Font Family
            container.classList.remove('font-sans', 'font-serif', 'font-mono');
            container.classList.add(`font-${this.settings.fontFamily}`);
            
            // Theme
            container.classList.remove('theme-light', 'theme-sepia', 'theme-dark');
            container.classList.add(`theme-${this.settings.theme}`);
        });
    }
}

class RecentFilesManager {
    constructor(maxFiles = 8) {
        this.maxFiles = maxFiles;
        this.storageKey = 'grammar-highlighter-recent-files';
        this.recentFiles = this.loadFromStorage();
    }
    
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading recent files:', e);
            return [];
        }
    }
    
    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.recentFiles));
        } catch (e) {
            console.error('Error saving recent files:', e);
        }
    }
    
    addFile(filePath, fileName) {
        // Check if exists to preserve location
        const existingFile = this.recentFiles.find(f => f.path === filePath);
        const lastLocation = existingFile ? existingFile.lastLocation : null;

        // Remove if already exists
        this.recentFiles = this.recentFiles.filter(f => f.path !== filePath);
        
        // Add to beginning
        this.recentFiles.unshift({
            path: filePath,
            name: fileName,
            openedAt: new Date().toISOString(),
            lastLocation: lastLocation
        });
        
        // Keep only max files
        this.recentFiles = this.recentFiles.slice(0, this.maxFiles);
        
        this.saveToStorage();
        this.render();
    }

    updateLocation(filePath, location) {
        const fileIndex = this.recentFiles.findIndex(f => f.path === filePath);
        if (fileIndex !== -1) {
            this.recentFiles[fileIndex].lastLocation = location;
            this.saveToStorage();
        }
    }

    getLastLocation(filePath) {
        const file = this.recentFiles.find(f => f.path === filePath);
        return file ? file.lastLocation : null;
    }
    
    render() {
        const container = document.getElementById('recentPdfsList');
        
        // Container might not exist if welcome screen is hidden
        if (!container) {
            return;
        }
        
        if (this.recentFiles.length === 0) {
            container.innerHTML = '<div class="no-recent-files">No recent files</div>';
            return;
        }
        
        const html = this.recentFiles.map(file => {
            const date = new Date(file.openedAt);
            const dateStr = this.formatDate(date);
            
            // Check existence
            let exists = false;
            try {
                exists = require('fs').existsSync(file.path);
            } catch (e) { exists = false; }
            
            const canDownload = !exists && file.driveId;
            
            let statusIcon = '';
            if (canDownload) {
                statusIcon = '<span class="status-icon cloud" title="Click to Download from Cloud" style="margin-right: 5px; cursor: pointer;">☁️</span>';
            } else if (!exists) {
                statusIcon = '<span class="status-icon missing" title="File Missing" style="margin-right: 5px;">⚠️</span>';
            }
            
            return `
                <div class="recent-pdf-item" data-path="${this.escapeHtml(file.path)}" data-drive-id="${file.driveId || ''}">
                    <div class="recent-pdf-icon">📄</div>
                    <div class="recent-pdf-info">
                        <div class="recent-pdf-name" title="${this.escapeHtml(file.name)}">
                             ${statusIcon}
                             ${this.escapeHtml(file.name)}
                        </div>
                        <div class="recent-pdf-path" title="${this.escapeHtml(file.path)}">${this.escapeHtml(file.path)}</div>
                    </div>
                    <div class="recent-pdf-date">${dateStr}</div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = html;
        
        // Add click listeners
        container.querySelectorAll('.recent-pdf-item').forEach(item => {
            item.addEventListener('click', async () => {
                const path = item.getAttribute('data-path');
                const driveId = item.getAttribute('data-drive-id');
                
                let exists = false;
                try {
                    exists = require('fs').existsSync(path);
                } catch (e) { exists = false; }
                
                if (!exists) {
                    if (driveId) {
                        if (confirm(`File "${path}" is missing locally.\n\nWould you like to download it from Google Drive?`)) {
                            await downloadAndOpenFile(driveId, path);
                            return;
                        }
                    } else {
                        // Let the openRecentFile handle the error naturally (it shows alert)
                    }
                }
                
                openRecentFile(path);
            });
        });
    }
    
    formatDate(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

const recentFilesManager = new RecentFilesManager();

// Dropdown menu handler
function initializeDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const dropbtn = dropdown.querySelector('.dropbtn');
        
        if (dropbtn) {
            dropbtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Toggle active class
                const isActive = dropdown.classList.contains('active');
                
                // Close all dropdowns
                document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('active'));
                
                // Toggle current
                if (!isActive) {
                    dropdown.classList.add('active');
                }
            });
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('active'));
        }
    });
    
    // Close dropdown after clicking a menu item
    document.querySelectorAll('.dropdown-content button, .dropdown-content a').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('active'));
        });
    });
}

// DOM Elements
const openFileBtn = document.getElementById('openFileBtn');
const closePdfBtn = document.getElementById('closePdfBtn');
const exportBtn = document.getElementById('exportBtn');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const statusMessage = document.getElementById('statusMessage');
const processingTime = document.getElementById('processingTime');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingMessage = document.getElementById('loadingMessage');
const progressBar = document.getElementById('progressBar');

// View toggle buttons
const highlightedTextBtn = document.getElementById('highlightedTextBtn');
const notesBtn = document.getElementById('notesBtn');
const translateTabBtn = document.getElementById('translateTabBtn');
const mapBtn = document.getElementById('mapBtn');
const mindmapBtn = document.getElementById('mindmapBtn');
const figuresBtn = document.getElementById('figuresBtn');

// View panels
const highlightedTextView = document.getElementById('highlightedTextView');
const notesView = document.getElementById('notesView');
const translateView = document.getElementById('translateView');
const mapView = document.getElementById('mapView');
const mindmapView = document.getElementById('mindmapView');
const figuresView = document.getElementById('figuresView');
const mapGrid = document.getElementById('mapGrid');
const mapZoom = document.getElementById('mapZoom');
const mapZoomValue = document.getElementById('mapZoomValue');
const mapFontSize = document.getElementById('mapFontSize');
const mapFontSizeValue = document.getElementById('mapFontSizeValue');
const mapSettingsBtn = document.getElementById('mapSettingsBtn');
const mapSettingsPopup = document.getElementById('mapSettingsPopup');
const closeMapSettingsBtn = document.getElementById('closeMapSettingsBtn');
const mapShowHighlights = document.getElementById('mapShowHighlights');
const mapShowLinks = document.getElementById('mapShowLinks');
const scanFiguresBtn = document.getElementById('scanFiguresBtn');
const figuresCount = document.getElementById('figuresCount');
const figuresGrid = document.getElementById('figuresGrid');
const snipBtn = document.getElementById('snipBtn');

// Page navigators
const rawTextPageNav = document.getElementById('rawTextPageNav');
const highlightedTextPageNav = document.getElementById('highlightedTextPageNav');

// Resizers and Panels
const pdfPanel = document.getElementById('pdfPanel');
const textPanel = document.getElementById('textPanel');
const statsPanelEl = document.getElementById('statsPanel');
const resizer1 = document.getElementById('resizer1');
const resizer2 = document.getElementById('resizer2');
const resizer3 = document.getElementById('resizer3');

// Toggle POS Section
window.togglePOSSection = function(sectionId) {
    const content = document.getElementById(`${sectionId}-content`);
    const arrow = document.getElementById(`${sectionId}-arrow`);
    
    if (content && arrow) {
        content.classList.toggle('collapsed');
        arrow.classList.toggle('collapsed');
        
        // Save state to localStorage
        const isCollapsed = content.classList.contains('collapsed');
        localStorage.setItem(`pos-section-${sectionId}`, isCollapsed ? 'collapsed' : 'expanded');
    }
};

// Restore POS section states on load
function restorePOSSectionStates() {
    const sections = [
        'basicPOS', 'namedEntities', 'specialEntities',
        'translateBasicPOS', 'translateNamedEntities', 'translateSpecialEntities'
    ];
    sections.forEach(sectionId => {
        const state = localStorage.getItem(`pos-section-${sectionId}`);
        if (state === 'collapsed') {
            const content = document.getElementById(`${sectionId}-content`);
            const arrow = document.getElementById(`${sectionId}-arrow`);
            if (content && arrow) {
                content.classList.add('collapsed');
                arrow.classList.add('collapsed');
            }
        }
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Grammar Highlighter Desktop initialized');
    setStatus('Ready to analyze PDFs');
    recentFilesManager.render();
    
    // Initialize Library UI
    if (typeof LibraryUI !== 'undefined' && typeof libraryManager !== 'undefined') {
        libraryUI = new LibraryUI(libraryManager);
        libraryUI.initialize('libraryView');
        setupLibraryResizer();
        console.log('Library UI initialized');
    }
    
    // Initialize translation UI
    initializeTranslation();
    
    // Initialize Speech Settings
    setupSpeechSettings();

    // Initialize Mindmap
    if (typeof MindmapManager !== 'undefined' && typeof notesManager !== 'undefined') {
        mindmapManager = new MindmapManager(notesManager);
        mindmapManager.initialize('mindmapContainer');
        
        const refreshBtn = document.getElementById('refreshMindmapBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => mindmapManager.refreshData());
        }
    }
    
    // Finish restoring workspace tabs after everything is loaded
    if (typeof tabManager !== 'undefined' && tabManager.finishRestore) {
        tabManager.finishRestore();
    }
    
    // Initialize dropdown click behavior
    initializeDropdowns();
    
    // Restore POS section states
    restorePOSSectionStates();
    
    // Initialize AI Semantic Analysis
    initializeAISemanticAnalysis();
});

// Helper function to download missing file
async function downloadAndOpenFile(driveId, originalPath) {
    try {
        showLoading('Downloading file from Drive...');
        const arrayBuffer = await driveSync.downloadFile(driveId);
        const buffer = new Uint8Array(arrayBuffer);
        
        const filename = originalPath.split(/[\\/]/).pop();
        
        // Prompt for save location, default to original filename
        const saveResult = await ipcRenderer.invoke('save-file-dialog', {
            defaultPath: filename,
            filters: [
                { name: 'Document', extensions: [filename.split('.').pop()] }
            ]
        });
        
        if (!saveResult.canceled && saveResult.filePath) {
             await ipcRenderer.invoke('write-file', {
                filePath: saveResult.filePath,
                content: buffer
             });
             
             // Open it
             openRecentFile(saveResult.filePath);
             setStatus(`✅ Downloaded and opened: ${filename}`);
        } else {
            hideLoading();
        }
    } catch (e) {
        console.error(e);
        alert('Download failed: ' + e.message);
        hideLoading();
    }
}

// Helper function to open a file by path
async function openRecentFile(filePath) {
    try {
        // Save current state if switching files
        if (currentFilePath && currentFilePath !== filePath && window.saveCurrentState) {
            await window.saveCurrentState();
        }

        // Determine file type from extension
        const ext = filePath.split('.').pop().toLowerCase();
        currentFileType = ext;
        
        showLoading(`Loading ${ext.toUpperCase()}...`);
        
        // Clean up previous state
        if (figuresGrid) figuresGrid.innerHTML = '';
        if (figuresCount) figuresCount.textContent = '';
        statsPanel.reset();
        resetPOSCounts();
        currentPdfData = null;
        
        // Extract filename from path
        const fileName = filePath.split(/[\\/]/).pop();
        currentFileName = fileName;
        currentFilePath = filePath;
        fileNameDisplay.textContent = currentFileName;
        
        // Load based on file type
        if (ext === 'pdf') {
            await loadPDFFileFromPath(filePath);
        } else if (ext === 'epub') {
            await loadEPUBFileFromPath(filePath);
        } else if (ext === 'docx') {
            await loadDOCXFileFromPath(filePath);
        } else if (ext === 'md') {
            await loadMarkdownFileFromPath(filePath);
        } else if (ext === 'txt') {
            await loadTxtFileFromPath(filePath);
        } else {
            throw new Error(`Unsupported file type: ${ext}`);
        }
    } catch (error) {
        console.error('Error opening recent file:', error);
        setStatus('❌ Error: ' + error.message);
        hideLoading();
    }
}

// Helper function for loading PDF from recent files
async function loadPDFFileFromPath(filePath) {
    try {
        cleanupEPUBNavigation();
        updateUILabels('pdf');
        // Read PDF file
        const fileData = await ipcRenderer.invoke('read-pdf-file', filePath);
        
        if (fileData.success) {
            // Extract filename from path
            const fileName = filePath.split(/[\\/]/).pop();
            
            currentFileName = fileName;
            currentFilePath = filePath;
            fileNameDisplay.textContent = currentFileName;
            
            currentPdfData = new Uint8Array(fileData.data);
            
            // Ensure PDF canvas wrapper is visible
            const pdfCanvasWrapper = document.getElementById('pdfCanvas');
            if (pdfCanvasWrapper) pdfCanvasWrapper.style.display = 'flex';
            
            // Enable snip button for PDF
            const snipBtn = document.getElementById('snipBtn');
            if (snipBtn) {
                snipBtn.disabled = false;
                snipBtn.title = "Snip Tool: Manually select tables, charts, or diagrams";
                snipBtn.style.opacity = '1';
                snipBtn.style.cursor = 'pointer';
            }
            
            // Load PDF in viewer
            await pdfViewer.loadPDF(currentPdfData);
            
            // Restore saved location
            const lastLocation = recentFilesManager.getLastLocation(filePath);
            if (lastLocation && lastLocation.page) {
                setTimeout(() => {
                    pdfViewer.renderPage(lastLocation.page);
                }, 50);
            }
            
            // Extract text using correct method name
            const text = await pdfViewer.extractAllText();
            
            if (text && text.trim().length > 0) {
                // Display text with page markers
                const rawTextContainer = document.getElementById('rawTextContent');
                rawTextContainer.innerHTML = '';
                
                for (let i = 1; i <= pdfViewer.totalPages; i++) {
                    const pageText = pdfViewer.getPageText(i);
                    
                    const pageDiv = document.createElement('div');
                    pageDiv.id = `text-page-${i}`;
                    pageDiv.className = 'page-section';
                    
                    const marker = document.createElement('div');
                    marker.className = 'page-marker';
                    marker.textContent = `--- Page ${i} ---`;
                    
                    const content = document.createElement('div');
                    content.className = 'page-text-content';
                    content.textContent = pageText;
                    
                    pageDiv.appendChild(marker);
                    pageDiv.appendChild(content);
                    rawTextContainer.appendChild(pageDiv);
                }
                
                // Only try to set properties if elements exist
                if (closePdfBtn) closePdfBtn.disabled = false;
                if (exportBtn) exportBtn.disabled = false;
                
                // Update page navigator max values
                if (rawTextPageNav) {
                    rawTextPageNav.max = pdfViewer.totalPages;
                    rawTextPageNav.placeholder = `1-${pdfViewer.totalPages}`;
                }
                if (highlightedTextPageNav) {
                    highlightedTextPageNav.max = pdfViewer.totalPages;
                    highlightedTextPageNav.placeholder = `1-${pdfViewer.totalPages}`;
                }

                // Auto-analyze immediately
                setTimeout(() => {
                    performAnalysis();
                }, 100);

            } else {
                // No text found
                document.getElementById('rawTextContent').textContent = '';
                
                if (closePdfBtn) closePdfBtn.disabled = false;
                if (exportBtn) exportBtn.disabled = true;
                
                setStatus('⚠️ No text found. The file might be an image.');
            }
            
            // Add to recent files
            recentFilesManager.addFile(filePath, fileName);
            
            // Load notes for this file
            notesManager.loadNotesForFile(filePath);
            
            // Add tab
            if (typeof tabManager !== 'undefined') {
                tabManager.addTab(filePath, currentFileName, 'pdf');
            }
            
            // Load figures for this file
            if (typeof figuresManager !== 'undefined') {
                figuresManager.loadFiguresForFile(filePath);
            }
            
            // Show Figures button for PDF
            if (figuresBtn) {
                figuresBtn.style.display = '';
            }

            hideLoading();
            setStatus(`Loaded: ${fileName}`);
        } else {
            hideLoading();
            setStatus('Error: Could not load PDF', 'error');
            alert('Failed to load PDF file. The file may not exist or has been moved.');
        }
    } catch (error) {
        console.error('Error loading PDF from path:', error);
        hideLoading();
        setStatus('Error loading file', 'error');
        alert(`Failed to open file: ${error.message}`);
    }
}

// Helper function for loading EPUB from recent files
async function loadEPUBFileFromPath(filePath) {
    try {
        currentFileType = 'epub';
        updateUILabels('epub');
        
        // Set current file info
        currentFilePath = filePath;
        currentFileName = filePath.split(/[\\/]/).pop();
        fileNameDisplay.textContent = currentFileName;
        
        const fileData = await ipcRenderer.invoke('read-epub-file', filePath);
        
        if (fileData.success) {
            const arrayBuffer = new Uint8Array(fileData.data).buffer;
            const result = await epubReader.loadFromBuffer(arrayBuffer);
            
            if (result.success && result.text && result.text.trim().length > 0) {
                document.getElementById('rawTextContent').innerHTML = 
                    `<div style="white-space: pre-wrap;">${escapeHtml(result.text)}</div>`;
                
                const pdfContainer = document.getElementById('pdfViewerContainer');
                
                // Hide PDF canvas wrapper
                const pdfCanvas = document.getElementById('pdfCanvas');
                if (pdfCanvas) pdfCanvas.style.display = 'none';
                
                // Disable snip button for EPUB (not supported yet)
                const snipBtn = document.getElementById('snipBtn');
                if (snipBtn) {
                    snipBtn.disabled = true;
                    snipBtn.title = "Snip Tool is only available for PDF files";
                    snipBtn.style.opacity = '0.5';
                    snipBtn.style.cursor = 'not-allowed';
                }
                
                // Create or reuse EPUB container
                let epubContainer = pdfContainer.querySelector('.epub-container');
                if (!epubContainer) {
                    epubContainer = document.createElement('div');
                    epubContainer.className = 'epub-container';
                    epubContainer.style.width = '100%';
                    epubContainer.style.height = '100%';
                    pdfContainer.appendChild(epubContainer);
                }
                
                await epubReader.render(epubContainer, pdfContainer.clientWidth, pdfContainer.clientHeight);
                
                // Setup resize observer for automatic resizing
                epubReader.setupResizeObserver(epubContainer);
                
                // Restore saved location
                const lastLocation = recentFilesManager.getLastLocation(filePath);
                if (lastLocation) {
                    if (lastLocation.cfi) {
                        if (epubReader.rendition) {
                            epubReader.rendition.display(lastLocation.cfi);
                        }
                    }
                    if (lastLocation.view) {
                        switchView(lastLocation.view);
                    }
                }
                
                // Setup EPUB navigation
                setupEPUBNavigation();
                
                if (closePdfBtn) closePdfBtn.disabled = false;
                if (exportBtn) exportBtn.disabled = false;
                
                notesManager.loadNotesForFile(filePath);
                
                // Add tab
                if (typeof tabManager !== 'undefined') {
                    tabManager.addTab(filePath, currentFileName, 'epub');
                }
                
                if (typeof figuresManager !== 'undefined') {
                    figuresManager.loadFiguresForFile(filePath);
                }
                
                hideLoading();
                setStatus(`Loaded: ${currentFileName}`);
                
                setTimeout(() => {
                    performAnalysis();
                }, 100);
            } else {
                hideLoading();
                setStatus('⚠️ No text found in EPUB');
            }
        } else {
            hideLoading();
            setStatus('Error: Could not load EPUB', 'error');
            alert('Failed to load EPUB file.');
        }
    } catch (error) {
        console.error('Error loading EPUB from path:', error);
        hideLoading();
        setStatus('Error loading file', 'error');
        alert(`Failed to open file: ${error.message}`);
    }
}

// Helper function for loading DOCX from recent files
async function loadDOCXFileFromPath(filePath) {
    try {
        currentFileType = 'docx';
        updateUILabels('docx');
        
        // Set current file info
        currentFilePath = filePath;
        currentFileName = filePath.split(/[\\/]/).pop();
        fileNameDisplay.textContent = currentFileName;
        
        const fileData = await ipcRenderer.invoke('read-docx-file', filePath);
        
        if (fileData.success) {
            const arrayBuffer = new Uint8Array(fileData.data).buffer;
            const result = await docxReader.loadFromBuffer(arrayBuffer);
            
            if (result.success && result.text && result.text.trim().length > 0) {
                document.getElementById('rawTextContent').innerHTML = 
                    `<div style="white-space: pre-wrap;">${escapeHtml(result.text)}</div>`;
                
                const pdfContainer = document.getElementById('pdfViewerContainer');
                
                // Hide PDF canvas wrapper
                const pdfCanvas = document.getElementById('pdfCanvas');
                if (pdfCanvas) pdfCanvas.style.display = 'none';
                
                // Disable snip button for DOCX (not supported yet)
                const snipBtn = document.getElementById('snipBtn');
                if (snipBtn) {
                    snipBtn.disabled = true;
                    snipBtn.title = "Snip Tool is only available for PDF files";
                    snipBtn.style.opacity = '0.5';
                    snipBtn.style.cursor = 'not-allowed';
                }
                
                const wrapper = document.createElement('div');
                wrapper.className = 'docx-content';
                wrapper.style.cssText = 'overflow-y: auto; height: 100%; padding: 20px;';
                
                pdfContainer.appendChild(wrapper);
                docxReader.render(wrapper);
                
                // Restore saved location
                const lastLocation = recentFilesManager.getLastLocation(filePath);
                if (lastLocation && lastLocation.scrollTop) {
                    setTimeout(() => {
                        wrapper.scrollTop = lastLocation.scrollTop;
                    }, 100);
                }
                
                if (closePdfBtn) closePdfBtn.disabled = false;
                if (exportBtn) exportBtn.disabled = false;
                
                notesManager.loadNotesForFile(filePath);
                
                // Add tab
                if (typeof tabManager !== 'undefined') {
                    tabManager.addTab(filePath, currentFileName, 'epub');
                }
                
                if (typeof figuresManager !== 'undefined') {
                    figuresManager.loadFiguresForFile(filePath);
                }
                
                hideLoading();
                setStatus(`Loaded: ${currentFileName}`);
                
                setTimeout(() => {
                    performAnalysis();
                }, 100);
            } else {
                hideLoading();
                setStatus('⚠️ No text found in DOCX');
            }
        } else {
            hideLoading();
            setStatus('Error: Could not load DOCX', 'error');
            alert('Failed to load DOCX file.');
        }
    } catch (error) {
        console.error('Error loading DOCX from path:', error);
        hideLoading();
        setStatus('Error loading file', 'error');
        alert(`Failed to open file: ${error.message}`);
    }
}

// Load Markdown file from path (for recent files)
async function loadMarkdownFileFromPath(filePath) {
    try {
        currentFileType = 'md';
        updateUILabels('md');
        
        // Set current file info
        currentFilePath = filePath;
        currentFileName = filePath.split(/[\\/]/).pop();
        fileNameDisplay.textContent = currentFileName;
        
        const fileData = await ipcRenderer.invoke('read-markdown-file', filePath);
        
        if (fileData.success) {
            const arrayBuffer = new Uint8Array(fileData.data).buffer;
            const result = await markdownReader.loadFromBuffer(arrayBuffer);
            
            if (result.success && result.text && result.text.trim().length > 0) {
                document.getElementById('rawTextContent').innerHTML = 
                    `<div style="white-space: pre-wrap;">${escapeHtml(result.text)}</div>`;
                
                // Hide PDF canvas wrapper
                const pdfCanvas = document.getElementById('pdfCanvas');
                if (pdfCanvas) pdfCanvas.style.display = 'none';
                
                const pdfContainer = document.getElementById('pdfViewerContainer');
                
                // Clean up ALL existing containers first
                if (pdfContainer) {
                    const epubContainer = pdfContainer.querySelector('.epub-container');
                    if (epubContainer) epubContainer.remove();
                    const docxContainer = pdfContainer.querySelector('.docx-content');
                    if (docxContainer) docxContainer.remove();
                    const mdContainer = pdfContainer.querySelector('.markdown-content');
                    if (mdContainer) mdContainer.remove();
                    const txtContainer = pdfContainer.querySelector('.txt-content');
                    if (txtContainer) txtContainer.remove();
                }
                
                // Disable snip button for Markdown (not supported)
                const snipBtn = document.getElementById('snipBtn');
                if (snipBtn) {
                    snipBtn.disabled = true;
                    snipBtn.title = "Snip Tool is only available for PDF files";
                    snipBtn.style.opacity = '0.5';
                    snipBtn.style.cursor = 'not-allowed';
                }
                
                const wrapper = document.createElement('div');
                wrapper.className = 'markdown-content';
                wrapper.style.cssText = 'overflow-y: auto; height: 100%; padding: 40px; background: #ffffff; color: #000000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 900px; margin: 0 auto;';
                wrapper.innerHTML = result.html;
                
                pdfContainer.appendChild(wrapper);
                
                // Restore saved location
                const lastLocation = recentFilesManager.getLastLocation(filePath);
                if (lastLocation && lastLocation.scrollTop) {
                    setTimeout(() => {
                        wrapper.scrollTop = lastLocation.scrollTop;
                    }, 100);
                }
                
                if (closePdfBtn) closePdfBtn.disabled = false;
                if (exportBtn) exportBtn.disabled = false;
                
                notesManager.loadNotesForFile(filePath);
                
                // Add tab
                if (typeof tabManager !== 'undefined') {
                    tabManager.addTab(filePath, currentFileName, 'md');
                }
                
                if (typeof figuresManager !== 'undefined') {
                    figuresManager.loadFiguresForFile(filePath);
                }
                
                hideLoading();
                setStatus(`Loaded: ${currentFileName}`);
                
                setTimeout(() => {
                    performAnalysis();
                }, 100);
            } else {
                hideLoading();
                setStatus('⚠️ No text found in Markdown file');
            }
        } else {
            hideLoading();
            setStatus('Error: Could not load Markdown file', 'error');
            alert('Failed to load Markdown file.');
        }
    } catch (error) {
        console.error('Error loading Markdown from path:', error);
        hideLoading();
        setStatus('Error loading file', 'error');
        alert(`Failed to open file: ${error.message}`);
    }
}

// Load Text file from path (for recent files)
async function loadTxtFileFromPath(filePath) {
    try {
        currentFileType = 'txt';
        updateUILabels('txt');
        
        // Set current file info
        currentFilePath = filePath;
        currentFileName = filePath.split(/[\\/]/).pop();
        fileNameDisplay.textContent = currentFileName;
        
        const fileData = await ipcRenderer.invoke('read-txt-file', filePath);
        
        if (fileData.success) {
            const arrayBuffer = new Uint8Array(fileData.data).buffer;
            const result = await txtReader.loadFromBuffer(arrayBuffer);
            
            if (result.success && result.text && result.text.trim().length > 0) {
                document.getElementById('rawTextContent').innerHTML = 
                    `<div style="white-space: pre-wrap;">${escapeHtml(result.text)}</div>`;
                
                // Hide PDF canvas wrapper
                const pdfCanvas = document.getElementById('pdfCanvas');
                if (pdfCanvas) pdfCanvas.style.display = 'none';
                
                const pdfContainer = document.getElementById('pdfViewerContainer');
                
                // Clean up ALL existing containers first
                if (pdfContainer) {
                    const epubContainer = pdfContainer.querySelector('.epub-container');
                    if (epubContainer) epubContainer.remove();
                    const docxContainer = pdfContainer.querySelector('.docx-content');
                    if (docxContainer) docxContainer.remove();
                    const mdContainer = pdfContainer.querySelector('.markdown-content');
                    if (mdContainer) mdContainer.remove();
                    const txtContainer = pdfContainer.querySelector('.txt-content');
                    if (txtContainer) txtContainer.remove();
                }
                
                // Disable snip button for Text files
                const snipBtn = document.getElementById('snipBtn');
                if (snipBtn) {
                    snipBtn.disabled = true;
                    snipBtn.title = "Snip Tool is only available for PDF files";
                    snipBtn.style.opacity = '0.5';
                    snipBtn.style.cursor = 'not-allowed';
                }
                
                const wrapper = document.createElement('div');
                wrapper.className = 'txt-content';
                wrapper.style.cssText = 'overflow-y: auto; height: 100%; padding: 40px; background: #ffffff !important; color: #000000 !important; font-family: "Consolas", "Monaco", "Courier New", monospace; line-height: 1.6; max-width: 900px; margin: 0 auto; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);';
                wrapper.innerHTML = `<pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word; color: #000000 !important;">${escapeHtml(result.text)}</pre>`;
                
                pdfContainer.appendChild(wrapper);
                
                // Restore saved location
                const lastLocation = recentFilesManager.getLastLocation(filePath);
                if (lastLocation && lastLocation.scrollTop) {
                    setTimeout(() => {
                        wrapper.scrollTop = lastLocation.scrollTop;
                    }, 100);
                }
                
                if (closePdfBtn) closePdfBtn.disabled = false;
                if (exportBtn) exportBtn.disabled = false;
                
                notesManager.loadNotesForFile(filePath);
                
                // Add tab
                if (typeof tabManager !== 'undefined') {
                    tabManager.addTab(filePath, currentFileName, 'txt');
                }
                
                if (typeof figuresManager !== 'undefined') {
                    figuresManager.loadFiguresForFile(filePath);
                }
                
                hideLoading();
                setStatus(`Loaded: ${currentFileName}`);
                
                setTimeout(() => {
                    performAnalysis();
                }, 100);
            } else {
                hideLoading();
                setStatus('⚠️ No text found in file');
            }
        } else {
            hideLoading();
            setStatus('Error: Could not load text file', 'error');
            alert('Failed to load text file.');
        }
    } catch (error) {
        console.error('Error loading text from path:', error);
        hideLoading();
        setStatus('Error loading file', 'error');
        alert(`Failed to open file: ${error.message}`);
    }
}

// Update UI Labels based on file type
function updateUILabels(fileType) {
    const viewerTitle = document.getElementById('viewerTitle');
    const closeBtn = document.getElementById('closePdfBtn');
    
    // Controls to toggle
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const pageInfo = document.getElementById('pageInfo');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomLevel = document.getElementById('zoomLevel');
    
    let typeLabel = 'Document';
    let icon = '📄';
    
    switch (fileType) {
        case 'pdf':
            typeLabel = 'PDF';
            icon = '📄';
            // Show all PDF controls
            if(prevPageBtn) prevPageBtn.style.display = '';
            if(nextPageBtn) nextPageBtn.style.display = '';
            if(pageInfo) pageInfo.style.display = '';
            if(zoomOutBtn) zoomOutBtn.style.display = '';
            if(zoomInBtn) zoomInBtn.style.display = '';
            if(zoomLevel) zoomLevel.style.display = '';
            break;
            
        case 'epub':
            typeLabel = 'EPUB';
            icon = '📖';
            // Show nav, hide zoom (EPUB has separate settings)
            if(prevPageBtn) prevPageBtn.style.display = '';
            if(nextPageBtn) nextPageBtn.style.display = '';
            if(pageInfo) pageInfo.style.display = '';
            if(zoomOutBtn) zoomOutBtn.style.display = 'none';
            if(zoomInBtn) zoomInBtn.style.display = 'none';
            if(zoomLevel) zoomLevel.style.display = 'none';
            break;
            
        case 'docx':
            typeLabel = 'Word Document';
            icon = '📝';
            // Hide all nav controls for scrolling DOCX
            if(prevPageBtn) prevPageBtn.style.display = 'none';
            if(nextPageBtn) nextPageBtn.style.display = 'none';
            if(pageInfo) pageInfo.style.display = 'none';
            if(zoomOutBtn) zoomOutBtn.style.display = 'none';
            if(zoomInBtn) zoomInBtn.style.display = 'none';
            if(zoomLevel) zoomLevel.style.display = 'none';
            break;
            
        case 'md':
            typeLabel = 'Markdown';
            icon = '📝';
            // Hide all nav controls for scrolling Markdown
            if(prevPageBtn) prevPageBtn.style.display = 'none';
            if(nextPageBtn) nextPageBtn.style.display = 'none';
            if(pageInfo) pageInfo.style.display = 'none';
            if(zoomOutBtn) zoomOutBtn.style.display = 'none';
            if(zoomInBtn) zoomInBtn.style.display = 'none';
            if(zoomLevel) zoomLevel.style.display = 'none';
            break;
            
        case 'txt':
            typeLabel = 'Text';
            icon = '📄';
            // Hide all nav controls for scrolling Text
            if(prevPageBtn) prevPageBtn.style.display = 'none';
            if(nextPageBtn) nextPageBtn.style.display = 'none';
            if(pageInfo) pageInfo.style.display = 'none';
            if(zoomOutBtn) zoomOutBtn.style.display = 'none';
            if(zoomInBtn) zoomInBtn.style.display = 'none';
            if(zoomLevel) zoomLevel.style.display = 'none';
            break;
    }
    
    if (viewerTitle) viewerTitle.textContent = `${icon} ${typeLabel} Viewer`;
    if (closeBtn) closeBtn.textContent = `✕ Close ${typeLabel}`;
}

// Setup EPUB Navigation
function setupEPUBNavigation() {
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const pageInfo = document.getElementById('pageInfo');
    const epubSettingsBtn = document.getElementById('epubSettingsBtn');
    
    // Remove old event listeners by cloning and replacing
    const newPrevBtn = prevBtn.cloneNode(true);
    const newNextBtn = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
    
    // Enable buttons
    newPrevBtn.disabled = false;
    newNextBtn.disabled = false;
    
    // Add EPUB navigation handlers
    newPrevBtn.addEventListener('click', async () => {
        await epubReader.prevPage();
    });
    
    newNextBtn.addEventListener('click', async () => {
        await epubReader.nextPage();
    });
    
    // Update page info
    if (pageInfo) {
        pageInfo.innerHTML = '<span style="font-size: 14px;">Use ◀ ▶ to navigate</span>';
    }
    
    // Show EPUB settings button
    if (epubSettingsBtn) {
        epubSettingsBtn.style.display = 'inline-block';
    }
    
    // Setup EPUB settings
    setupEPUBSettings();
}

// Setup EPUB Settings
function setupEPUBSettings() {
    const settingsBtn = document.getElementById('epubSettingsBtn');
    const settingsPopup = document.getElementById('epubSettingsPopup');
    const closeBtn = document.getElementById('closeEpubSettingsBtn');
    const themeButtons = document.querySelectorAll('.theme-btn');
    const fontSizeSlider = document.getElementById('epubFontSize');
    const fontSizeValue = document.getElementById('epubFontSizeValue');
    const fontFamilySelect = document.getElementById('epubFontFamily');
    const lineHeightSlider = document.getElementById('epubLineHeight');
    const lineHeightValue = document.getElementById('epubLineHeightValue');
    
    // Load saved settings
    const savedSettings = JSON.parse(localStorage.getItem('epub-settings') || '{}');
    const currentTheme = savedSettings.theme || 'light';
    
    // Apply saved settings
    applyEPUBTheme(currentTheme);
    if (savedSettings.fontSize) {
        fontSizeSlider.value = savedSettings.fontSize;
        fontSizeValue.textContent = savedSettings.fontSize + 'px';
    }
    if (savedSettings.fontFamily) {
        fontFamilySelect.value = savedSettings.fontFamily;
    }
    if (savedSettings.lineHeight) {
        lineHeightSlider.value = savedSettings.lineHeight;
        lineHeightValue.textContent = savedSettings.lineHeight;
    }
    
    // Update active theme button
    themeButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === currentTheme);
    });
    
    // Toggle settings popup
    settingsBtn.addEventListener('click', () => {
        settingsPopup.classList.toggle('hidden');
    });
    
    closeBtn.addEventListener('click', () => {
        settingsPopup.classList.add('hidden');
    });
    
    // Theme buttons
    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            themeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyEPUBTheme(theme);
            saveEPUBSettings();
        });
    });
    
    // Font size
    fontSizeSlider.addEventListener('input', (e) => {
        const size = e.target.value;
        fontSizeValue.textContent = size + 'px';
        updateEPUBDisplay();
        saveEPUBSettings();
    });
    
    // Font family
    fontFamilySelect.addEventListener('change', () => {
        updateEPUBDisplay();
        saveEPUBSettings();
    });
    
    // Line height
    lineHeightSlider.addEventListener('input', (e) => {
        const height = e.target.value;
        lineHeightValue.textContent = height;
        updateEPUBDisplay();
        saveEPUBSettings();
    });
}

// Apply EPUB Theme
function applyEPUBTheme(theme) {
    const themes = {
        light: {
            background: '#ffffff',
            color: '#333333'
        },
        sepia: {
            background: '#f4ecd8',
            color: '#5c4a2f'
        },
        dark: {
            background: '#1e1e1e',
            color: '#e0e0e0'
        }
    };
    
    const selectedTheme = themes[theme] || themes.light;
    const fontSize = document.getElementById('epubFontSize').value + 'px';
    const fontFamily = document.getElementById('epubFontFamily').value;
    const lineHeight = document.getElementById('epubLineHeight').value;
    
    epubReader.updateSettings({
        background: selectedTheme.background,
        color: selectedTheme.color,
        fontSize: fontSize,
        fontFamily: fontFamily,
        lineHeight: lineHeight
    });
}

// Update EPUB Display
function updateEPUBDisplay() {
    const activeTheme = document.querySelector('.theme-btn.active');
    const theme = activeTheme ? activeTheme.dataset.theme : 'light';
    applyEPUBTheme(theme);
}

// Save EPUB Settings
function saveEPUBSettings() {
    const activeTheme = document.querySelector('.theme-btn.active');
    const settings = {
        theme: activeTheme ? activeTheme.dataset.theme : 'light',
        fontSize: document.getElementById('epubFontSize').value,
        fontFamily: document.getElementById('epubFontFamily').value,
        lineHeight: document.getElementById('epubLineHeight').value
    };
    localStorage.setItem('epub-settings', JSON.stringify(settings));
}

// Cleanup EPUB Navigation (restore PDF navigation)
function cleanupEPUBNavigation() {
    // Reset buttons to clear EPUB listeners
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    
    if (prevBtn) prevBtn.parentNode.replaceChild(prevBtn.cloneNode(true), prevBtn);
    if (nextBtn) nextBtn.parentNode.replaceChild(nextBtn.cloneNode(true), nextBtn);
    if (zoomInBtn) zoomInBtn.parentNode.replaceChild(zoomInBtn.cloneNode(true), zoomInBtn);
    if (zoomOutBtn) zoomOutBtn.parentNode.replaceChild(zoomOutBtn.cloneNode(true), zoomOutBtn);
    
    // Reset page info text
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) {
        pageInfo.innerHTML = 'Page <input type="number" id="pageInput" class="page-input" value="1" min="1"> / <span id="totalPagesDisplay">-</span>';
    }
    
    // Re-initialize PDF viewer controls
    if (typeof pdfViewer !== 'undefined') {
        pdfViewer.initControls();
    }
}

// Save current location
function saveCurrentLocation() {
    if (!currentFilePath) return;

    let location = null;

    try {
        if (currentFileType === 'pdf') {
            if (pdfViewer) {
                location = { page: pdfViewer.currentPage };
            }
        } else if (currentFileType === 'epub') {
            if (epubReader && epubReader.rendition) {
                const loc = epubReader.rendition.currentLocation();
                if (loc && loc.start) {
                    location = { cfi: loc.start.cfi };
                }
            }
        } else if (currentFileType === 'docx') {
            const wrapper = document.querySelector('.docx-content');
            if (wrapper) {
                location = { scrollTop: wrapper.scrollTop };
            }
        }

        if (location) {
            // Capture active view
            let activeView = 'highlighted';
            if (typeof notesBtn !== 'undefined' && notesBtn.classList.contains('active')) activeView = 'notes';
            else if (typeof mapBtn !== 'undefined' && mapBtn.classList.contains('active')) activeView = 'map';
            else if (typeof figuresBtn !== 'undefined' && figuresBtn.classList.contains('active')) activeView = 'figures';
            else if (typeof translateTabBtn !== 'undefined' && translateTabBtn.classList.contains('active')) activeView = 'translate';
            
            location.view = activeView;
            
            recentFilesManager.updateLocation(currentFilePath, location);
        }
    } catch (e) {
        console.error('Error saving location:', e);
    }
}

// Save Current State (Location & Notes & Cache)
async function saveCurrentState() {
    if (!currentFilePath) return;
    
    try {
        // Save location
        await saveCurrentLocation();
        
        // Save notes
        if (notesManager) {
            notesManager.saveToStorage();
        }

        // Cache NLP Analysis and Data for Tabs
        if (typeof tabManager !== 'undefined') {
            const state = {
                pdfData: currentPdfData, // Cached PDF buffer
                analysis: currentAnalysis, // Cached NLP analysis
                // Cache DOM content to avoid re-rendering text
                rawTextHTML: document.getElementById('rawTextContent').innerHTML,
                highlightedTextHTML: document.getElementById('highlightedTextContent').innerHTML,
                // Cache figures if any
                figuresHTML: document.getElementById('figuresGrid') ? document.getElementById('figuresGrid').innerHTML : '',
                figuresCount: document.getElementById('figuresCount') ? document.getElementById('figuresCount').textContent : '0 found'
            };
            tabManager.updateTabState(currentFilePath, state);
        }
    } catch (e) {
        console.error('Error saving state:', e);
    }
}
window.saveCurrentState = saveCurrentState;

// Close Current File Function
async function closeCurrentFile() {
    // Save state before cleanup
    await saveCurrentState();

    // Auto-sync if connected
    if (typeof driveSync !== 'undefined' && driveSync.isAuthenticated() && currentFilePath) {
        showLoading('☁️ Syncing to Google Drive...', true);
        try {
            // Use checkbox state if available, otherwise default to true
            const shouldUploadDoc = document.getElementById('syncDocumentsCheck')?.checked ?? true;
            await performSyncToDrive(shouldUploadDoc); 
            setStatus('✅ Synced successfully');
            await new Promise(r => setTimeout(r, 500));
        } catch (e) {
            console.error('Auto-sync failed:', e);
            setStatus('⚠️ Auto-sync failed (proceeding to close)');
            await new Promise(r => setTimeout(r, 1000));
        } finally {
            hideLoading();
        }
    }

    // Cleanup based on file type
    if (currentFileType === 'epub') {
        epubReader.destroy();
    } else if (currentFileType === 'docx') {
        docxReader.destroy();
    } else if (currentFileType === 'md') {
        markdownReader.clear();
    } else if (currentFileType === 'txt') {
        txtReader.clear();
    }
    
    // Restore navigation controls
    cleanupEPUBNavigation();
    
    // Reset global state
    currentPdfData = null;
    currentAnalysis = null;
    currentFileName = '';
    currentFilePath = '';
    currentFileType = 'pdf';
    
    // Reset UI
    updateUILabels('pdf'); // Reset controls visibility
    fileNameDisplay.textContent = 'No file loaded';
    document.getElementById('viewerTitle').textContent = '📄 Document Viewer';
    if (document.getElementById('closePdfBtn')) {
        document.getElementById('closePdfBtn').textContent = '✕ Close File';
    }
    
    document.getElementById('rawTextContent').innerHTML = `
        <div class="placeholder-text">
            <p>📄 No text extracted yet</p>
            <p style="font-size: 14px; color: #666;">Open a PDF and text will appear here</p>
        </div>
    `;
    document.getElementById('highlightedTextContent').innerHTML = `
        <div class="placeholder-text">
            <p>✨ Analysis will start automatically...</p>
        </div>
    `;
    
    // Reset Viewer
    const pdfCanvasWrapper = document.getElementById('pdfCanvas');
    const pdfCanvasElement = document.getElementById('pdfCanvasElement');
    const welcomeMsg = document.querySelector('.welcome-message');
    const pdfContainer = document.getElementById('pdfViewerContainer');
    
    // Restore PDF canvas wrapper (contains welcome message)
    if (pdfCanvasWrapper) pdfCanvasWrapper.style.display = 'flex';
    
    // Ensure actual canvas is hidden
    if (pdfCanvasElement) pdfCanvasElement.style.display = 'none';
    
    // Ensure welcome message is visible
    if (welcomeMsg) welcomeMsg.style.display = 'block';
    
    // Clear PDF viewer container completely (for EPUB/DOCX/Markdown content)
    if (pdfContainer) {
        // Remove any EPUB/DOCX/Markdown rendered content
        const epubContent = pdfContainer.querySelector('.epub-container');
        const docxContent = pdfContainer.querySelector('.docx-content');
        const mdContent = pdfContainer.querySelector('.markdown-content');
        const txtContent = pdfContainer.querySelector('.txt-content');
        if (epubContent) epubContent.remove();
        if (docxContent) docxContent.remove();
        if (mdContent) mdContent.remove();
        if (txtContent) txtContent.remove();
        
        // Clear any other dynamically added content EXCEPT the pdfCanvas wrapper
        Array.from(pdfContainer.children).forEach(child => {
            if (child !== pdfCanvasWrapper) {
                child.remove();
            }
        });
    }
    
    // Hide EPUB settings button
    const epubSettingsBtn = document.getElementById('epubSettingsBtn');
    if (epubSettingsBtn) {
        epubSettingsBtn.style.display = 'none';
    }
    
    // Hide EPUB settings popup
    const epubSettingsPopup = document.getElementById('epubSettingsPopup');
    if (epubSettingsPopup) {
        epubSettingsPopup.classList.add('hidden');
    }
    
    // Reset Stats
    statsPanel.reset();
    
    // Reset POS counts
    resetPOSCounts();
    
    // Reset Figures
    if (figuresGrid) figuresGrid.innerHTML = '';
    if (figuresCount) figuresCount.textContent = '';
    
    // Reset Notes
    if (notesManager) {
        notesManager.notes = [];
        notesManager.highlights = [];
        notesManager.currentFilePath = '';
        notesManager.render();
    }
    
    // Reset Map
    const mapGrid = document.getElementById('mapGrid');
    if (mapGrid) {
        mapGrid.innerHTML = '<div class="placeholder-text"><p>📄 No document loaded</p></div>';
    }
    
    // Disable buttons
    if (closePdfBtn) closePdfBtn.disabled = true;
    if (analyzeBtn) analyzeBtn.disabled = true;
    if (exportBtn) exportBtn.disabled = true;
    
    // Reset navigation buttons
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const pageInput = document.getElementById('pageInput');
    const totalPagesDisplay = document.getElementById('totalPagesDisplay');
    const pageInfo = document.getElementById('pageInfo');
    
    if (prevPageBtn) prevPageBtn.disabled = true;
    if (nextPageBtn) nextPageBtn.disabled = true;
    if (pageInput) {
        pageInput.value = '1';
        pageInput.disabled = true;
    }
    if (totalPagesDisplay) totalPagesDisplay.textContent = '-';
    if (pageInfo) {
        pageInfo.innerHTML = 'Page <input type="number" id="pageInput" class="page-input" value="1" min="1"> / <span id="totalPagesDisplay">-</span>';
    }
    
    // Reset View
    switchView('highlighted');
    
    // Update status
    setStatus('Ready to analyze documents');
}

// Show New Tab Screen
function showNewTabScreen() {
    // Hide current viewer content
    const pdfCanvasElement = document.getElementById('pdfCanvasElement');
    const welcomeMsg = document.querySelector('.welcome-message');
    const pdfCanvasWrapper = document.getElementById('pdfCanvas');
    const pdfContainer = document.getElementById('pdfViewerContainer');
    
    // Ensure wrapper is visible
    if (pdfCanvasWrapper) pdfCanvasWrapper.style.display = 'flex';
    
    // Show welcome message (which contains recent files)
    if (welcomeMsg) welcomeMsg.style.display = 'block';
    
    // Hide actual content
    if (pdfCanvasElement) pdfCanvasElement.style.display = 'none';
    
    // Hide EPUB/DOCX/Markdown containers
    if (pdfContainer) {
        const epubContent = pdfContainer.querySelector('.epub-container');
        if (epubContent) epubContent.style.display = 'none';
        const docxContent = pdfContainer.querySelector('.docx-content');
        if (docxContent) docxContent.style.display = 'none';
        const mdContent = pdfContainer.querySelector('.markdown-content');
        if (mdContent) mdContent.style.display = 'none';
        const txtContent = pdfContainer.querySelector('.txt-content');
        if (txtContent) txtContent.style.display = 'none';
    }
    
    // Reset UI controls
    if (fileNameDisplay) fileNameDisplay.textContent = 'New Tab';
    const viewerTitle = document.getElementById('viewerTitle');
    if (viewerTitle) viewerTitle.textContent = 'New Tab';
    
    // Refresh recent files list
    if (recentFilesManager) recentFilesManager.render();
    
    // Clear global path so saves don't overwrite previous file
    currentFilePath = null;
    currentFileName = '';
    
    // Clear map view
    if (mapGrid) {
        mapGrid.innerHTML = '<div class="placeholder-text"><p>📄 No document loaded</p></div>';
    }
    
    // Clear text content views
    const rawTextContent = document.getElementById('rawTextContent');
    const highlightedTextContent = document.getElementById('highlightedTextContent');
    if (rawTextContent) {
        rawTextContent.innerHTML = `
            <div class="placeholder-text">
                <p>📄 No text extracted yet</p>
                <p style="font-size: 14px; color: #666;">Open a PDF and text will appear here</p>
            </div>
        `;
    }
    if (highlightedTextContent) {
        highlightedTextContent.innerHTML = `
            <div class="placeholder-text">
                <p>📄 No text extracted yet</p>
                <p style="font-size: 14px; color: #666;">Open a PDF and text will appear here</p>
            </div>
        `;
    }
    
    // Hide navigation controls
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const pageInfo = document.getElementById('pageInfo');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomLevel = document.getElementById('zoomLevel');
    
    if(prevPageBtn) prevPageBtn.style.display = 'none';
    if(nextPageBtn) nextPageBtn.style.display = 'none';
    if(pageInfo) pageInfo.style.display = 'none';
    if(zoomOutBtn) zoomOutBtn.style.display = 'none';
    if(zoomInBtn) zoomInBtn.style.display = 'none';
    if(zoomLevel) zoomLevel.style.display = 'none';
    
    if (closePdfBtn) closePdfBtn.disabled = true;
    if (exportBtn) exportBtn.disabled = true;
}
window.showNewTabScreen = showNewTabScreen;

// Close PDF Button Event
// Expose for TabManager
window.closeCurrentFile = closeCurrentFile;

if (closePdfBtn) {
    closePdfBtn.addEventListener('click', () => {
        if (typeof tabManager !== 'undefined' && currentFilePath) {
            tabManager.removeTab(currentFilePath);
        } else {
            closeCurrentFile();
        }
    });
}

// File Operations
if (openFileBtn) {
    openFileBtn.addEventListener('click', async (e) => {
        try {
            const result = await ipcRenderer.invoke('open-file-dialog');
            
            if (!result.canceled) {
            currentFileName = result.fileName;
            currentFilePath = result.filePath;
            currentFileType = result.fileType || 'pdf';
            fileNameDisplay.textContent = currentFileName;
            
            // Add file to library (root by default)
            if (typeof libraryManager !== 'undefined') {
                libraryManager.addFile(currentFilePath, currentFileName, 'root');
            }
            
            let extractedText = '';
            
            // Handle different file types
            if (currentFileType === 'pdf') {
                await loadPDFFile(result.filePath);
            } else if (currentFileType === 'epub') {
                await loadEPUBFile(result.filePath);
            } else if (currentFileType === 'docx') {
                await loadDOCXFile(result.filePath);
            } else if (currentFileType === 'md') {
                await loadMarkdownFile(result.filePath);
            } else if (currentFileType === 'txt') {
                await loadTxtFile(result.filePath);
            } else {
                throw new Error(`Unsupported file type: ${currentFileType}`);
            }
            
        }
    } catch (error) {
        console.error('Error opening file:', error);
        setStatus('❌ Error: ' + error.message);
        hideLoading();
    }
    });
}

// Welcome screen open file button
const welcomeOpenFileBtn = document.getElementById('welcomeOpenFileBtn');
if (welcomeOpenFileBtn) {
    welcomeOpenFileBtn.addEventListener('click', () => {
        if (openFileBtn) openFileBtn.click();
    });
}

// Load PDF file
async function loadPDFFile(filePath, cachedState = null) {
    try {
        showLoading('Loading PDF...');
        resetPOSCounts();
        statsPanel.reset();
        cleanupEPUBNavigation();
        updateUILabels('pdf');
        resetTranslationState();
        
        // Clear map view for new document
        if (mapGrid) {
            mapGrid.innerHTML = '<div class="placeholder-text"><p>📄 Loading document...</p></div>';
        }
        
        // Clean up EPUB/DOCX/Markdown containers
        const pdfContainer = document.getElementById('pdfViewerContainer');
        if (pdfContainer) {
            const epubContainer = pdfContainer.querySelector('.epub-container');
            if (epubContainer) epubContainer.remove();
            
            const docxContainer = pdfContainer.querySelector('.docx-content');
            if (docxContainer) docxContainer.remove();
            
            const mdContainer = pdfContainer.querySelector('.markdown-content');
            if (mdContainer) mdContainer.remove();
            
            const txtContainer = pdfContainer.querySelector('.txt-content');
            if (txtContainer) txtContainer.remove();
        }
        
        // Show PDF canvas
        const pdfCanvasWrapper = document.getElementById('pdfCanvas');
        if (pdfCanvasWrapper) pdfCanvasWrapper.style.display = 'flex';

        // 1. Try to restore from Persistent Cache (localStorage)
        if (typeof analysisCache !== 'undefined') {
            const persistentCache = analysisCache.loadAnalysis(filePath);
            if (persistentCache && persistentCache.analysis) {
                console.log('Restoring PDF from persistent cache (localStorage)...');
                currentAnalysis = persistentCache.analysis;
                
                // Restore HTML Content & Stats IMMEDIATELY
                if (persistentCache.rawTextHTML) document.getElementById('rawTextContent').innerHTML = persistentCache.rawTextHTML;
                if (persistentCache.highlightedTextHTML) document.getElementById('highlightedTextContent').innerHTML = persistentCache.highlightedTextHTML;
                if (persistentCache.figuresHTML && document.getElementById('figuresGrid')) {
                    document.getElementById('figuresGrid').innerHTML = persistentCache.figuresHTML;
                    if (document.getElementById('figuresCount')) document.getElementById('figuresCount').textContent = persistentCache.figuresCount;
                }
                
                if (currentAnalysis) {
                    statsPanel.renderStats(currentAnalysis);
                    updatePOSCounts(currentAnalysis);
                }
                
                // Load cached AI analysis if available
                if (window.aiSemanticAnalyzer) {
                    setTimeout(() => loadAndDisplayCachedAIResults(), 100);
                }

                const snipBtn = document.getElementById('snipBtn');
                if (snipBtn) {
                    snipBtn.disabled = false;
                    snipBtn.style.opacity = '1';
                }
                
                if (exportBtn) exportBtn.disabled = false;
                
                notesManager.loadNotesForFile(filePath);
                
                if (typeof tabManager !== 'undefined') {
                    tabManager.addTab(filePath, currentFileName, 'pdf');
                }
                
                // Load figures for this file
                if (typeof figuresManager !== 'undefined') {
                    figuresManager.loadFiguresForFile(filePath);
                }
                
                // Show Figures button for PDF
                if (figuresBtn) {
                    figuresBtn.style.display = '';
                }
                
                // Restore View Selection immediately
                const lastLocation = recentFilesManager.getLastLocation(filePath);
                if (lastLocation && lastLocation.view) {
                    switchView(lastLocation.view);
                }
                
                setStatus(`✅ Restored: ${currentFileName}`);
                hideLoading();
                
                // Refresh map if it's the active view
                const mapView = document.getElementById('mapView');
                if (mapView && mapView.classList.contains('active')) {
                    renderMap().catch(err => console.error('Error rendering map:', err));
                }

                // Refresh Mindmap if it's the active view
                const mindmapView = document.getElementById('mindmapView');
                if (mindmapView && mindmapView.classList.contains('active') && typeof mindmapManager !== 'undefined') {
                    setTimeout(() => mindmapManager.refreshData(), 50);
                }
                
                // Show PDF loading overlay
                const pdfLoadingOverlay = document.getElementById('pdfLoadingOverlay');
                if (pdfLoadingOverlay) pdfLoadingOverlay.classList.remove('hidden');
                
                // Load PDF Viewer in background (need to read file)
                const pdfCanvasWrapper = document.getElementById('pdfCanvas');
                if (pdfCanvasWrapper) pdfCanvasWrapper.style.display = 'flex';
                
                // Read PDF file for viewer
                ipcRenderer.invoke('read-pdf-file', filePath).then(fileData => {
                    if (fileData.success) {
                        currentPdfData = new Uint8Array(fileData.data);
                        return pdfViewer.loadPDF(currentPdfData);
                    }
                }).then(() => {
                    if (lastLocation && lastLocation.page) {
                        setTimeout(() => pdfViewer.renderPage(lastLocation.page), 50);
                    }
                    // Hide PDF loading overlay
                    if (pdfLoadingOverlay) pdfLoadingOverlay.classList.add('hidden');
                }).catch(e => {
                    console.error('Background PDF load error:', e);
                    if (pdfLoadingOverlay) pdfLoadingOverlay.classList.add('hidden');
                });
                
                return;
            }
        }

        // 2. Fallback: Try to restore from Memory Cache (TabManager)
        if (cachedState && cachedState.pdfData) {
            console.log('Restoring PDF from memory cache...');
            currentPdfData = cachedState.pdfData;
            currentAnalysis = cachedState.analysis;
            
            // Restore HTML Content & Stats IMMEDIATELY
            if (cachedState.rawTextHTML) document.getElementById('rawTextContent').innerHTML = cachedState.rawTextHTML;
            if (cachedState.highlightedTextHTML) document.getElementById('highlightedTextContent').innerHTML = cachedState.highlightedTextHTML;
            if (cachedState.figuresHTML && document.getElementById('figuresGrid')) {
                document.getElementById('figuresGrid').innerHTML = cachedState.figuresHTML;
                if (document.getElementById('figuresCount')) document.getElementById('figuresCount').textContent = cachedState.figuresCount;
            }
            
            if (currentAnalysis) {
                statsPanel.renderStats(currentAnalysis);
                updatePOSCounts(currentAnalysis);
            }
            
            // Load cached AI analysis if available
            if (window.aiSemanticAnalyzer) {
                setTimeout(() => loadAndDisplayCachedAIResults(), 100);
            }

            const snipBtn = document.getElementById('snipBtn');
            if (snipBtn) {
                snipBtn.disabled = false;
                snipBtn.style.opacity = '1';
            }
            
            if (exportBtn) exportBtn.disabled = false;
            
            notesManager.loadNotesForFile(filePath);
            
            if (typeof tabManager !== 'undefined') {
                tabManager.addTab(filePath, currentFileName, 'pdf');
            }
            
            // Load figures for this file
            if (typeof figuresManager !== 'undefined') {
                figuresManager.loadFiguresForFile(filePath);
            }
            
            // Show Figures button for PDF
            if (figuresBtn) {
                figuresBtn.style.display = '';
            }
            
            // Restore View Selection immediately
            const lastLocation = recentFilesManager.getLastLocation(filePath);
            if (lastLocation && lastLocation.view) {
                switchView(lastLocation.view);
            }
            
            setStatus(`✅ Restored: ${currentFileName}`);
            hideLoading();
            
            // Refresh map if it's the active view
            const mapView = document.getElementById('mapView');
            if (mapView && mapView.classList.contains('active')) {
                renderMap().catch(err => console.error('Error rendering map:', err));
            }
            
            // Show PDF loading overlay
            const pdfLoadingOverlay = document.getElementById('pdfLoadingOverlay');
            if (pdfLoadingOverlay) pdfLoadingOverlay.classList.remove('hidden');
            
            // Load PDF Viewer in background
            const pdfCanvasWrapper = document.getElementById('pdfCanvas');
            if (pdfCanvasWrapper) pdfCanvasWrapper.style.display = 'flex';
            
            pdfViewer.loadPDF(currentPdfData).then(() => {
                if (lastLocation && lastLocation.page) {
                    setTimeout(() => pdfViewer.renderPage(lastLocation.page), 50);
                }
                // Hide PDF loading overlay
                if (pdfLoadingOverlay) pdfLoadingOverlay.classList.add('hidden');
            }).catch(e => {
                console.error('Background PDF load error:', e);
                if (pdfLoadingOverlay) pdfLoadingOverlay.classList.add('hidden');
            });
            
            return;
        }
            
            // Read PDF file
        const fileData = await ipcRenderer.invoke('read-pdf-file', filePath);
            
            if (fileData.success) {
                currentPdfData = new Uint8Array(fileData.data);
                
                // Ensure PDF canvas wrapper is visible
                const pdfCanvasWrapper = document.getElementById('pdfCanvas');
                if (pdfCanvasWrapper) pdfCanvasWrapper.style.display = 'flex';
                
                // Enable snip button for PDF
                const snipBtn = document.getElementById('snipBtn');
                if (snipBtn) {
                    snipBtn.disabled = false;
                    snipBtn.title = "Snip Tool: Manually select tables, charts, or diagrams";
                    snipBtn.style.opacity = '1';
                    snipBtn.style.cursor = 'pointer';
                }
                
                // Load PDF in viewer
                await pdfViewer.loadPDF(currentPdfData);
                
                // Restore saved location
                const lastLocation = recentFilesManager.getLastLocation(filePath);
                if (lastLocation) {
                    if (lastLocation.page) {
                        setTimeout(() => {
                            pdfViewer.renderPage(lastLocation.page);
                        }, 50);
                    }
                    if (lastLocation.view) {
                        switchView(lastLocation.view);
                    }
                }
                
                // Extract text
                const extractedText = await pdfViewer.extractAllText();
                
                if (extractedText && extractedText.trim().length > 0) {
                    // Display raw text
                    document.getElementById('rawTextContent').innerHTML = 
                        `<div style="white-space: pre-wrap;">${escapeHtml(extractedText)}</div>`;
                    
                // Enable export
                if (exportBtn) exportBtn.disabled = false;
                
                // Add to recent files
                recentFilesManager.addFile(filePath, currentFileName);
                
            // Load notes for this file
            notesManager.loadNotesForFile(filePath);
            
            // Add tab
            if (typeof tabManager !== 'undefined') {
                tabManager.addTab(filePath, currentFileName, 'pdf');
            }
                    
                    setStatus(`✅ Loaded: ${currentFileName} (${extractedText.split(/\s+/).length} words)`);
                    hideLoading();

                // Auto-analyze immediately
                setTimeout(() => {
                    performAnalysis();
                }, 100);

                } else {
                    // No text found - might be image-based PDF
                if (exportBtn) exportBtn.disabled = true;
                
                // Still add to recent files even if no text
                recentFilesManager.addFile(filePath, currentFileName);
                
            // Load notes for this file
            notesManager.loadNotesForFile(filePath);
            
            // Add tab
            if (typeof tabManager !== 'undefined') {
                tabManager.addTab(filePath, currentFileName, 'pdf');
            }
            
            setStatus('⚠️ No text found. The file might be an image.');
                    hideLoading();
                }
            } else {
                setStatus('❌ Error reading PDF file');
                hideLoading();
        }
    } catch (error) {
        console.error('Error loading PDF:', error);
        setStatus('❌ Error: ' + error.message);
        hideLoading();
    }
}

// Load EPUB file
async function loadEPUBFile(filePath, cachedState = null) {
    try {
        showLoading('Loading EPUB...');
        resetPOSCounts();
        statsPanel.reset();
        currentFileType = 'epub';
        currentPdfData = null;
        updateUILabels('epub');
        resetTranslationState();
        
        // Clear map view for new document
        if (mapGrid) {
            mapGrid.innerHTML = '<div class="placeholder-text"><p>📄 Loading document...</p></div>';
        }
        
        // Hide PDF canvas and clean up containers
        const pdfCanvas = document.getElementById('pdfCanvas');
        if (pdfCanvas) pdfCanvas.style.display = 'none';
        
        const pdfContainer = document.getElementById('pdfViewerContainer');
        if (pdfContainer) {
            const docxContainer = pdfContainer.querySelector('.docx-content');
            if (docxContainer) docxContainer.remove();
            const mdContainer = pdfContainer.querySelector('.markdown-content');
            if (mdContainer) mdContainer.remove();
        }
        
        // 1. Try to restore from Persistent Cache (localStorage)
        if (typeof analysisCache !== 'undefined') {
            const persistentCache = analysisCache.loadAnalysis(filePath);
            if (persistentCache && persistentCache.analysis) {
                console.log('Restoring EPUB from persistent cache (localStorage)...');
                currentAnalysis = persistentCache.analysis;
                
                // Restore HTML Content & Stats IMMEDIATELY
                if (persistentCache.rawTextHTML) document.getElementById('rawTextContent').innerHTML = persistentCache.rawTextHTML;
                if (persistentCache.highlightedTextHTML) document.getElementById('highlightedTextContent').innerHTML = persistentCache.highlightedTextHTML;
                
                if (currentAnalysis) {
                    statsPanel.renderStats(currentAnalysis);
                    updatePOSCounts(currentAnalysis);
                }
                
                const snipBtn = document.getElementById('snipBtn');
                if (snipBtn) {
                    snipBtn.disabled = true;
                    snipBtn.title = "Snip Tool is only available for PDF files";
                    snipBtn.style.opacity = '0.5';
                    snipBtn.style.cursor = 'not-allowed';
                }
                
                if (exportBtn) exportBtn.disabled = false;
                
                notesManager.loadNotesForFile(filePath);
                
                if (typeof tabManager !== 'undefined') {
                    tabManager.addTab(filePath, currentFileName, 'epub');
                }
                
                // Clear figures for EPUB (not supported)
                if (typeof figuresManager !== 'undefined') {
                    figuresManager.loadFiguresForFile(filePath); // This will load empty array
                }
                
                // Hide Figures button for EPUB
                if (figuresBtn) {
                    figuresBtn.style.display = 'none';
                }
                
                // Restore View Selection immediately
                const lastLocation = recentFilesManager.getLastLocation(filePath);
                if (lastLocation && lastLocation.view) {
                    switchView(lastLocation.view);
                }
                
                // Load cached AI analysis if available
                if (window.aiSemanticAnalyzer) {
                    setTimeout(() => loadAndDisplayCachedAIResults(), 100);
                }
                
                setStatus(`✅ Restored: ${currentFileName}`);
                
                // Refresh map if it's the active view
                const mapView = document.getElementById('mapView');
                if (mapView && mapView.classList.contains('active')) {
                    renderMap().catch(err => console.error('Error rendering map:', err));
                }

                // Refresh Mindmap if it's the active view
                const mindmapView = document.getElementById('mindmapView');
                if (mindmapView && mindmapView.classList.contains('active') && typeof mindmapManager !== 'undefined') {
                    setTimeout(() => mindmapManager.refreshData(), 50);
                }
                
                // Show loading overlay for EPUB rendering
                const pdfLoadingOverlay = document.getElementById('pdfLoadingOverlay');
                if (pdfLoadingOverlay) {
                    pdfLoadingOverlay.classList.remove('hidden');
                }
                
                // Load EPUB Viewer in background
                (async () => {
                    try {
                        const fileData = await ipcRenderer.invoke('read-epub-file', filePath);
                        if (fileData.success) {
                            const arrayBuffer = new Uint8Array(fileData.data).buffer;
                            const result = await epubReader.loadFromBuffer(arrayBuffer);
                            
                            if (result && result.success) {
                                // Get container reference
                                const container = document.getElementById('pdfViewerContainer');
                                if (!container) {
                                    console.error('pdfViewerContainer not found');
                                    return;
                                }
                                
                                // Remove any existing EPUB container first
                                const oldEpubContainer = container.querySelector('.epub-container');
                                if (oldEpubContainer) {
                                    oldEpubContainer.remove();
                                }
                                
                                // Create new EPUB container
                                const epubContainer = document.createElement('div');
                                epubContainer.className = 'epub-container';
                                epubContainer.style.width = '100%';
                                epubContainer.style.height = '100%';
                                container.appendChild(epubContainer);
                                
                                console.log('Rendering EPUB to container...');
                                await epubReader.render(epubContainer, container.clientWidth, container.clientHeight);
                                console.log('EPUB rendered successfully');
                                
                                // Setup resize observer for automatic resizing
                                epubReader.setupResizeObserver(epubContainer);
                                
                                if (lastLocation && lastLocation.cfi && epubReader.rendition) {
                                    epubReader.rendition.display(lastLocation.cfi);
                                }
                                setupEPUBNavigation();
                            }
                        }
                        // Hide loading overlay after EPUB fully renders
                        setTimeout(() => {
                            if (pdfLoadingOverlay) pdfLoadingOverlay.classList.add('hidden');
                            hideLoading();
                        }, 300);
                    } catch (e) {
                        console.error('Background EPUB load error:', e);
                        if (pdfLoadingOverlay) pdfLoadingOverlay.classList.add('hidden');
                    }
                })();
                
                return;
            }
        }
        
        // Read EPUB file
        const fileData = await ipcRenderer.invoke('read-epub-file', filePath);
        
        if (fileData.success) {
            const arrayBuffer = new Uint8Array(fileData.data).buffer;
            
            // Load EPUB
            const result = await epubReader.loadFromBuffer(arrayBuffer);
            
            if (result.success && result.text && result.text.trim().length > 0) {
                // Restore from Cache if available
                let restoredFromCache = false;
                if (cachedState && cachedState.analysis) {
                    currentAnalysis = cachedState.analysis;
                    restoredFromCache = true;
                    
                    if (cachedState.rawTextHTML) {
                        document.getElementById('rawTextContent').innerHTML = cachedState.rawTextHTML;
                    } else {
            document.getElementById('rawTextContent').innerHTML = 
                            `<div style="white-space: pre-wrap;">${escapeHtml(result.text)}</div>`;
                    }
                    
                    if (cachedState.highlightedTextHTML) {
                        document.getElementById('highlightedTextContent').innerHTML = cachedState.highlightedTextHTML;
                    }
                } else {
                    // Display text in raw text view
                    document.getElementById('rawTextContent').innerHTML = 
                        `<div style="white-space: pre-wrap;">${escapeHtml(result.text)}</div>`;
                }
                
                // Render EPUB in PDF viewer container
                const pdfContainer = document.getElementById('pdfViewerContainer');
                
                // Hide PDF canvas wrapper (contains welcome message)
                const pdfCanvas = document.getElementById('pdfCanvas');
                if (pdfCanvas) pdfCanvas.style.display = 'none';
                
                // Disable snip button for EPUB (not supported yet)
                const snipBtn = document.getElementById('snipBtn');
                if (snipBtn) {
                    snipBtn.disabled = true;
                    snipBtn.title = "Snip Tool is only available for PDF files";
                    snipBtn.style.opacity = '0.5';
                    snipBtn.style.cursor = 'not-allowed';
                }
                
                // Create or reuse EPUB container
                let epubContainer = pdfContainer.querySelector('.epub-container');
                if (!epubContainer) {
                    epubContainer = document.createElement('div');
                    epubContainer.className = 'epub-container';
                    epubContainer.style.width = '100%';
                    epubContainer.style.height = '100%';
                    pdfContainer.appendChild(epubContainer);
                }
                
                await epubReader.render(epubContainer, pdfContainer.clientWidth, pdfContainer.clientHeight);
                
                // Restore saved location
                const lastLocation = recentFilesManager.getLastLocation(filePath);
                if (lastLocation) {
                    if (lastLocation.cfi) {
                        if (epubReader.rendition) {
                            epubReader.rendition.display(lastLocation.cfi);
                        }
                    }
                    if (lastLocation.view) {
                        switchView(lastLocation.view);
                    }
                }
                
                // Setup EPUB navigation
                setupEPUBNavigation();
                
                // Enable export
                if (exportBtn) exportBtn.disabled = false;
                
                // Add to recent files
                recentFilesManager.addFile(filePath, currentFileName);
                
            // Load notes for this file
            notesManager.loadNotesForFile(filePath);
            
            // Add tab
            if (typeof tabManager !== 'undefined') {
                tabManager.addTab(filePath, currentFileName, 'epub');
            }
            
            // Clear figures for EPUB (not supported)
            if (typeof figuresManager !== 'undefined') {
                figuresManager.loadFiguresForFile(filePath); // This will load empty array
            }
            
            // Hide Figures button for EPUB
            if (figuresBtn) {
                figuresBtn.style.display = 'none';
            }
            
            const metadata = result.metadata || {};
                setStatus(`✅ Loaded: ${currentFileName} (${result.text.split(/\s+/).length} words)`);
                
                // Wait a bit for EPUB to fully render in DOM before hiding loading
                setTimeout(() => {
                    hideLoading();
                }, 300);

                // Auto-analyze immediately
                setTimeout(() => {
                    if (typeof restoredFromCache !== 'undefined' && restoredFromCache && currentAnalysis) {
                         statsPanel.renderStats(currentAnalysis);
                         updatePOSCounts(currentAnalysis);
        } else {
                        performAnalysis();
                    }
                }, 100);
        } else {
                setStatus('❌ No text found in EPUB');
                hideLoading();
            }
        } else {
            setStatus('❌ Error reading EPUB file');
            hideLoading();
        }
    } catch (error) {
        console.error('Error loading EPUB:', error);
        setStatus('❌ Error: ' + error.message);
        hideLoading();
    }
}

// Load DOCX file
async function loadDOCXFile(filePath) {
    try {
        showLoading('Loading DOCX...');
        resetPOSCounts();
        statsPanel.reset();
        currentFileType = 'docx';
        currentPdfData = null;
        updateUILabels('docx');
        resetTranslationState();
        
        // Clear map view for new document
        if (mapGrid) {
            mapGrid.innerHTML = '<div class="placeholder-text"><p>📄 Loading document...</p></div>';
        }
        
        // Hide PDF canvas and clean up containers
        const pdfCanvas = document.getElementById('pdfCanvas');
        if (pdfCanvas) pdfCanvas.style.display = 'none';
        
        const pdfContainer = document.getElementById('pdfViewerContainer');
        if (pdfContainer) {
            const epubContainer = pdfContainer.querySelector('.epub-container');
            if (epubContainer) epubContainer.remove();
            const mdContainer = pdfContainer.querySelector('.markdown-content');
            if (mdContainer) mdContainer.remove();
        }
        
        // 1. Try to restore from Persistent Cache (localStorage)
        if (typeof analysisCache !== 'undefined') {
            const persistentCache = analysisCache.loadAnalysis(filePath);
            if (persistentCache && persistentCache.analysis) {
                console.log('Restoring DOCX from persistent cache (localStorage)...');
                currentAnalysis = persistentCache.analysis;
                
                // Restore HTML Content & Stats IMMEDIATELY
                if (persistentCache.rawTextHTML) document.getElementById('rawTextContent').innerHTML = persistentCache.rawTextHTML;
                if (persistentCache.highlightedTextHTML) document.getElementById('highlightedTextContent').innerHTML = persistentCache.highlightedTextHTML;
                
                if (currentAnalysis) {
                    statsPanel.renderStats(currentAnalysis);
                    updatePOSCounts(currentAnalysis);
                }
                
                const snipBtn = document.getElementById('snipBtn');
                if (snipBtn) {
                    snipBtn.disabled = true;
                    snipBtn.title = "Snip Tool is only available for PDF files";
                    snipBtn.style.opacity = '0.5';
                    snipBtn.style.cursor = 'not-allowed';
                }
                
                if (exportBtn) exportBtn.disabled = false;
                
                notesManager.loadNotesForFile(filePath);
                
                if (typeof tabManager !== 'undefined') {
                    tabManager.addTab(filePath, currentFileName, 'docx');
                }
                
                // Clear figures for DOCX (not supported)
                if (typeof figuresManager !== 'undefined') {
                    figuresManager.loadFiguresForFile(filePath); // This will load empty array
                }
                
                // Hide Figures button for DOCX
                if (figuresBtn) {
                    figuresBtn.style.display = 'none';
                }
                
                // Restore View Selection immediately
                const lastLocation = recentFilesManager.getLastLocation(filePath);
                if (lastLocation && lastLocation.view) {
                    switchView(lastLocation.view);
                }
                
                // Load cached AI analysis if available
                if (window.aiSemanticAnalyzer) {
                    setTimeout(() => loadAndDisplayCachedAIResults(), 100);
                }
                
                setStatus(`✅ Restored: ${currentFileName}`);
        hideLoading();
                
                // Refresh map if it's the active view
                const mapView = document.getElementById('mapView');
                if (mapView && mapView.classList.contains('active')) {
                    renderMap().catch(err => console.error('Error rendering map:', err));
                }

                // Refresh Mindmap if it's the active view
                const mindmapView = document.getElementById('mindmapView');
                if (mindmapView && mindmapView.classList.contains('active') && typeof mindmapManager !== 'undefined') {
                    setTimeout(() => mindmapManager.refreshData(), 50);
                }
                
                // Show loading overlay
                const pdfLoadingOverlay = document.getElementById('pdfLoadingOverlay');
                if (pdfLoadingOverlay) {
                    pdfLoadingOverlay.classList.remove('hidden');
                }
                
                // Load DOCX Viewer in background
                (async () => {
                    try {
                        const fileData = await ipcRenderer.invoke('read-docx-file', filePath);
                        if (fileData.success) {
                            const arrayBuffer = new Uint8Array(fileData.data).buffer;
                            const result = await docxReader.loadFromBuffer(arrayBuffer);
                            
                            if (result && result.success && result.html) {
                                // Get container reference
                                const container = document.getElementById('pdfViewerContainer');
                                if (!container) return;
                                
                                // Create or reuse DOCX container
                                let docxContainer = container.querySelector('.docx-content');
                                if (!docxContainer) {
                                    docxContainer = document.createElement('div');
                                    docxContainer.className = 'docx-content';
                                    docxContainer.style.width = '100%';
                                    docxContainer.style.height = '100%';
                                    docxContainer.style.overflow = 'auto';
                                    docxContainer.style.padding = '20px';
                                    docxContainer.style.background = 'white';
                                    container.appendChild(docxContainer);
                                }
                                
                                docxContainer.innerHTML = result.html;
                                
                                if (lastLocation && lastLocation.scrollTop) {
                                    docxContainer.scrollTop = lastLocation.scrollTop;
                                }
                            }
                        }
                        // Hide loading overlay
                        if (pdfLoadingOverlay) pdfLoadingOverlay.classList.add('hidden');
                    } catch (e) {
                        console.error('Background DOCX load error:', e);
                        if (pdfLoadingOverlay) pdfLoadingOverlay.classList.add('hidden');
                    }
                })();
                
                return;
            }
        }
        
        // Read DOCX file
        const fileData = await ipcRenderer.invoke('read-docx-file', filePath);
        
        if (fileData.success) {
            const arrayBuffer = new Uint8Array(fileData.data).buffer;
            
            // Load DOCX
            const result = await docxReader.loadFromBuffer(arrayBuffer);
            
            if (result.success && result.text && result.text.trim().length > 0) {
                // Display text in raw text view
                document.getElementById('rawTextContent').innerHTML = 
                    `<div style="white-space: pre-wrap;">${escapeHtml(result.text)}</div>`;
                
                // Render DOCX HTML in PDF viewer container
                const pdfContainer = document.getElementById('pdfViewerContainer');
                
                // Hide PDF canvas wrapper
                const pdfCanvas = document.getElementById('pdfCanvas');
                if (pdfCanvas) pdfCanvas.style.display = 'none';
                
                // Disable snip button for DOCX (not supported yet)
                const snipBtn = document.getElementById('snipBtn');
                if (snipBtn) {
                    snipBtn.disabled = true;
                    snipBtn.title = "Snip Tool is only available for PDF files";
                    snipBtn.style.opacity = '0.5';
                    snipBtn.style.cursor = 'not-allowed';
                }
                
                // Create wrapper for DOCX
                const wrapper = document.createElement('div');
                wrapper.className = 'docx-content';
                wrapper.style.cssText = 'overflow-y: auto; height: 100%; padding: 20px;';
                
                pdfContainer.appendChild(wrapper);
                docxReader.render(wrapper);
                
                // Restore saved location
                const lastLocation = recentFilesManager.getLastLocation(filePath);
                if (lastLocation) {
                    if (lastLocation.scrollTop) {
                        setTimeout(() => {
                            wrapper.scrollTop = lastLocation.scrollTop;
                        }, 100);
                    }
                    if (lastLocation.view) {
                        switchView(lastLocation.view);
                    }
                }
                
                // Enable export
                if (exportBtn) exportBtn.disabled = false;
                
                // Add to recent files
                recentFilesManager.addFile(filePath, currentFileName);
                
            // Load notes for this file
            notesManager.loadNotesForFile(filePath);
            
            // Add tab
            if (typeof tabManager !== 'undefined') {
                tabManager.addTab(filePath, currentFileName, 'docx');
            }
            
            setStatus(`✅ Loaded: ${currentFileName} (${result.text.split(/\s+/).length} words)`);
        hideLoading();

                // Auto-analyze immediately
                setTimeout(() => {
                    performAnalysis();
                }, 100);
            } else {
                setStatus('❌ No text found in DOCX');
                hideLoading();
            }
        } else {
            setStatus('❌ Error reading DOCX file');
            hideLoading();
        }
    } catch (error) {
        console.error('Error loading DOCX:', error);
        setStatus('❌ Error: ' + error.message);
        hideLoading();
    }
}

// Load Markdown file
async function loadMarkdownFile(filePath, cachedState = null) {
    try {
        showLoading('Loading Markdown...');
        resetPOSCounts();
        statsPanel.reset();
        currentFileType = 'md';
        currentPdfData = null;
        updateUILabels('md');
        resetTranslationState();
        
        // Clear map view for new document
        if (mapGrid) {
            mapGrid.innerHTML = '<div class="placeholder-text"><p>📄 Loading document...</p></div>';
        }
        
        // Hide PDF canvas and clean up containers
        const pdfCanvas = document.getElementById('pdfCanvas');
        if (pdfCanvas) pdfCanvas.style.display = 'none';
        
        const pdfContainer = document.getElementById('pdfViewerContainer');
        if (pdfContainer) {
            const epubContainer = pdfContainer.querySelector('.epub-container');
            if (epubContainer) epubContainer.remove();
            const docxContainer = pdfContainer.querySelector('.docx-content');
            if (docxContainer) docxContainer.remove();
            const mdContainer = pdfContainer.querySelector('.markdown-content');
            if (mdContainer) mdContainer.remove();
        }
        
        // 1. Try to restore from Persistent Cache (localStorage)
        if (typeof analysisCache !== 'undefined') {
            const persistentCache = analysisCache.loadAnalysis(filePath);
            if (persistentCache && persistentCache.analysis) {
                console.log('Restoring Markdown from persistent cache (localStorage)...');
                currentAnalysis = persistentCache.analysis;
                
                // Restore HTML Content & Stats IMMEDIATELY
                if (persistentCache.rawTextHTML) document.getElementById('rawTextContent').innerHTML = persistentCache.rawTextHTML;
                if (persistentCache.highlightedTextHTML) document.getElementById('highlightedTextContent').innerHTML = persistentCache.highlightedTextHTML;
                
                if (currentAnalysis) {
                    statsPanel.renderStats(currentAnalysis);
                    updatePOSCounts(currentAnalysis);
                }
                
                const snipBtn = document.getElementById('snipBtn');
                if (snipBtn) {
                    snipBtn.disabled = true;
                    snipBtn.title = "Snip Tool is only available for PDF files";
                    snipBtn.style.opacity = '0.5';
                    snipBtn.style.cursor = 'not-allowed';
                }
                
                if (exportBtn) exportBtn.disabled = false;
                
                notesManager.loadNotesForFile(filePath);
                
                if (typeof tabManager !== 'undefined') {
                    tabManager.addTab(filePath, currentFileName, 'md');
                }
                
                // Clear figures for Markdown (not supported)
                if (typeof figuresManager !== 'undefined') {
                    figuresManager.loadFiguresForFile(filePath);
                }
                
                // Hide Figures button for Markdown
                if (figuresBtn) {
                    figuresBtn.style.display = 'none';
                }
                
                // Restore View Selection immediately
                const lastLocation = recentFilesManager.getLastLocation(filePath);
                if (lastLocation && lastLocation.view) {
                    switchView(lastLocation.view);
                }
                
                // Load cached AI analysis if available
                if (window.aiSemanticAnalyzer) {
                    setTimeout(() => loadAndDisplayCachedAIResults(), 100);
                }
                
                setStatus(`✅ Restored: ${currentFileName}`);
                hideLoading();
                
                // Refresh map if it's the active view
                const mapView = document.getElementById('mapView');
                if (mapView && mapView.classList.contains('active')) {
                    renderMap().catch(err => console.error('Error rendering map:', err));
                }

                // Refresh Mindmap if it's the active view
                const mindmapView = document.getElementById('mindmapView');
                if (mindmapView && mindmapView.classList.contains('active') && typeof mindmapManager !== 'undefined') {
                    setTimeout(() => mindmapManager.refreshData(), 50);
                }
                
                // Show loading overlay
                const pdfLoadingOverlay = document.getElementById('pdfLoadingOverlay');
                if (pdfLoadingOverlay) {
                    pdfLoadingOverlay.classList.remove('hidden');
                }
                
                // Load Markdown Viewer in background
                (async () => {
                    try {
                        const fileData = await ipcRenderer.invoke('read-markdown-file', filePath);
                        if (fileData.success) {
                            const arrayBuffer = new Uint8Array(fileData.data).buffer;
                            const result = await markdownReader.loadFromBuffer(arrayBuffer);
                            
                            if (result && result.success && result.html) {
                                const container = document.getElementById('pdfViewerContainer');
                                if (!container) return;
                                
                                // Clean up any existing containers first
                                const oldEpub = container.querySelector('.epub-container');
                                if (oldEpub) oldEpub.remove();
                                const oldDocx = container.querySelector('.docx-content');
                                if (oldDocx) oldDocx.remove();
                                const oldMd = container.querySelector('.markdown-content');
                                if (oldMd) oldMd.remove();
                                const oldTxt = container.querySelector('.txt-content');
                                if (oldTxt) oldTxt.remove();
                                
                                // Create new markdown container
                                const mdContainer = document.createElement('div');
                                mdContainer.className = 'markdown-content';
                                mdContainer.style.cssText = 'overflow-y: auto; height: 100%; padding: 40px; background: #ffffff; color: #000000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 900px; margin: 0 auto;';
                                container.appendChild(mdContainer);
                                
                                mdContainer.innerHTML = result.html;
                                
                                if (lastLocation && lastLocation.scrollTop) {
                                    mdContainer.scrollTop = lastLocation.scrollTop;
                                }
                            }
                        }
                        if (pdfLoadingOverlay) pdfLoadingOverlay.classList.add('hidden');
                    } catch (e) {
                        console.error('Background Markdown load error:', e);
                        if (pdfLoadingOverlay) pdfLoadingOverlay.classList.add('hidden');
                    }
                })();
                
                return;
            }
        }
        
        // Read Markdown file
        const fileData = await ipcRenderer.invoke('read-markdown-file', filePath);
        
        if (fileData.success) {
            const arrayBuffer = new Uint8Array(fileData.data).buffer;
            
            // Load Markdown
            const result = await markdownReader.loadFromBuffer(arrayBuffer);
            
            if (result.success && result.text && result.text.trim().length > 0) {
                // Display text in raw text view
                document.getElementById('rawTextContent').innerHTML = 
                    `<div style="white-space: pre-wrap;">${escapeHtml(result.text)}</div>`;
                
                // Render Markdown HTML in PDF viewer container
                const pdfContainer = document.getElementById('pdfViewerContainer');
                
                // Hide PDF canvas wrapper
                const pdfCanvas = document.getElementById('pdfCanvas');
                if (pdfCanvas) pdfCanvas.style.display = 'none';
                
                // Disable snip button for Markdown
                const snipBtn = document.getElementById('snipBtn');
                if (snipBtn) {
                    snipBtn.disabled = true;
                    snipBtn.title = "Snip Tool is only available for PDF files";
                    snipBtn.style.opacity = '0.5';
                    snipBtn.style.cursor = 'not-allowed';
                }
                
                // Create wrapper for Markdown
                const wrapper = document.createElement('div');
                wrapper.className = 'markdown-content';
                wrapper.style.cssText = 'overflow-y: auto; height: 100%; padding: 40px; background: #ffffff; color: #000000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 900px; margin: 0 auto;';
                wrapper.innerHTML = result.html;
                
                pdfContainer.appendChild(wrapper);
                
                // Restore saved location
                const lastLocation = recentFilesManager.getLastLocation(filePath);
                if (lastLocation) {
                    if (lastLocation.scrollTop) {
                        setTimeout(() => {
                            wrapper.scrollTop = lastLocation.scrollTop;
                        }, 100);
                    }
                    if (lastLocation.view) {
                        switchView(lastLocation.view);
                    }
                }
                
                if (closePdfBtn) closePdfBtn.disabled = false;
                if (exportBtn) exportBtn.disabled = false;
                
                notesManager.loadNotesForFile(filePath);
                
                // Add tab
                if (typeof tabManager !== 'undefined') {
                    tabManager.addTab(filePath, currentFileName, 'md');
                }
                
                // Clear figures for Markdown (not supported)
                if (typeof figuresManager !== 'undefined') {
                    figuresManager.loadFiguresForFile(filePath);
                }
                
                // Hide Figures button for Markdown
                if (figuresBtn) {
                    figuresBtn.style.display = 'none';
                }
                
                hideLoading();
                setStatus(`Loaded: ${currentFileName}`);
                
                setTimeout(() => {
                    performAnalysis();
                }, 100);
            } else {
                setStatus('❌ No text found in Markdown file');
                hideLoading();
            }
        } else {
            setStatus('❌ Error reading Markdown file');
            hideLoading();
        }
    } catch (error) {
        console.error('Error loading Markdown:', error);
        setStatus('❌ Error: ' + error.message);
        hideLoading();
    }
}

// Load Text file
async function loadTxtFile(filePath, cachedState = null) {
    try {
        showLoading('Loading text file...');
        resetPOSCounts();
        statsPanel.reset();
        currentFileType = 'txt';
        currentPdfData = null;
        updateUILabels('txt');
        resetTranslationState();
        
        // Clear map view for new document
        if (mapGrid) {
            mapGrid.innerHTML = '<div class="placeholder-text"><p>📄 Loading document...</p></div>';
        }
        
        // Hide PDF canvas and clean up ALL containers
        const pdfCanvas = document.getElementById('pdfCanvas');
        if (pdfCanvas) pdfCanvas.style.display = 'none';
        
        const pdfContainer = document.getElementById('pdfViewerContainer');
        if (pdfContainer) {
            // Remove all document type containers
            const epubContainer = pdfContainer.querySelector('.epub-container');
            if (epubContainer) epubContainer.remove();
            const docxContainer = pdfContainer.querySelector('.docx-content');
            if (docxContainer) docxContainer.remove();
            const mdContainer = pdfContainer.querySelector('.markdown-content');
            if (mdContainer) mdContainer.remove();
            const txtContainer = pdfContainer.querySelector('.txt-content');
            if (txtContainer) txtContainer.remove();
        }
        
        // 1. Try to restore from Persistent Cache (localStorage)
        if (typeof analysisCache !== 'undefined') {
            const persistentCache = analysisCache.loadAnalysis(filePath);
            if (persistentCache && persistentCache.analysis) {
                console.log('Restoring text file from persistent cache (localStorage)...');
                currentAnalysis = persistentCache.analysis;
                
                // Restore HTML Content & Stats IMMEDIATELY
                if (persistentCache.rawTextHTML) document.getElementById('rawTextContent').innerHTML = persistentCache.rawTextHTML;
                if (persistentCache.highlightedTextHTML) document.getElementById('highlightedTextContent').innerHTML = persistentCache.highlightedTextHTML;
                
                if (currentAnalysis) {
                    statsPanel.renderStats(currentAnalysis);
                    updatePOSCounts(currentAnalysis);
                }
                
                const snipBtn = document.getElementById('snipBtn');
                if (snipBtn) {
                    snipBtn.disabled = true;
                    snipBtn.title = "Snip Tool is only available for PDF files";
                    snipBtn.style.opacity = '0.5';
                    // snipBtn.style.cursor = 'not-allowed';
                }
                
                if (exportBtn) exportBtn.disabled = false;
                
                notesManager.loadNotesForFile(filePath);
                
                if (typeof tabManager !== 'undefined') {
                    tabManager.addTab(filePath, currentFileName, 'txt');
                }
                
                // Clear figures for Text (not supported)
                if (typeof figuresManager !== 'undefined') {
                    figuresManager.loadFiguresForFile(filePath);
                }
                
                // Hide Figures button for Text
                if (figuresBtn) {
                    figuresBtn.style.display = 'none';
                }
                
                // Restore View Selection immediately
                const lastLocation = recentFilesManager.getLastLocation(filePath);
                if (lastLocation && lastLocation.view) {
                    switchView(lastLocation.view);
                }
                
                // Load cached AI analysis if available
                if (window.aiSemanticAnalyzer) {
                    setTimeout(() => loadAndDisplayCachedAIResults(), 100);
                }
                
                setStatus(`✅ Restored: ${currentFileName}`);
                hideLoading();
                
                // Refresh map if it's the active view
                const mapView = document.getElementById('mapView');
                if (mapView && mapView.classList.contains('active')) {
                    renderMap().catch(err => console.error('Error rendering map:', err));
                }

                // Refresh Mindmap if it's the active view
                const mindmapView = document.getElementById('mindmapView');
                if (mindmapView && mindmapView.classList.contains('active') && typeof mindmapManager !== 'undefined') {
                    setTimeout(() => mindmapManager.refreshData(), 50);
                }
                
                // Show loading overlay
                const pdfLoadingOverlay = document.getElementById('pdfLoadingOverlay');
                if (pdfLoadingOverlay) {
                    pdfLoadingOverlay.classList.remove('hidden');
                }
                
                // Load Text Viewer in background
                (async () => {
                    try {
                        const fileData = await ipcRenderer.invoke('read-txt-file', filePath);
                        if (fileData.success) {
                            const arrayBuffer = new Uint8Array(fileData.data).buffer;
                            const result = await txtReader.loadFromBuffer(arrayBuffer);
                            
                            if (result && result.success && result.text) {
                                const container = document.getElementById('pdfViewerContainer');
                                if (!container) return;
                                
                                // Clean up any existing containers first
                                const oldEpub = container.querySelector('.epub-container');
                                if (oldEpub) oldEpub.remove();
                                const oldDocx = container.querySelector('.docx-content');
                                if (oldDocx) oldDocx.remove();
                                const oldMd = container.querySelector('.markdown-content');
                                if (oldMd) oldMd.remove();
                                const oldTxt = container.querySelector('.txt-content');
                                if (oldTxt) oldTxt.remove();
                                
                                // Create new text container
                                const txtContainer = document.createElement('div');
                                txtContainer.className = 'txt-content';
                                txtContainer.style.cssText = 'overflow-y: auto; height: 100%; padding: 40px; background: #ffffff !important; color: #000000 !important; font-family: "Consolas", "Monaco", "Courier New", monospace; line-height: 1.6; max-width: 900px; margin: 0 auto; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);';
                                container.appendChild(txtContainer);
                                
                                txtContainer.innerHTML = `<pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word; color: #000000 !important;">${escapeHtml(result.text)}</pre>`;
                                
                                if (lastLocation && lastLocation.scrollTop) {
                                    txtContainer.scrollTop = lastLocation.scrollTop;
                                }
                            }
                        }
                        if (pdfLoadingOverlay) pdfLoadingOverlay.classList.add('hidden');
                    } catch (e) {
                        console.error('Background text load error:', e);
                        if (pdfLoadingOverlay) pdfLoadingOverlay.classList.add('hidden');
                    }
                })();
                
                return;
            }
        }
        
        // Read Text file
        const fileData = await ipcRenderer.invoke('read-txt-file', filePath);
        
        if (fileData.success) {
            const arrayBuffer = new Uint8Array(fileData.data).buffer;
            
            // Load Text
            const result = await txtReader.loadFromBuffer(arrayBuffer);
            
            if (result.success && result.text && result.text.trim().length > 0) {
                // Display text in raw text view
                document.getElementById('rawTextContent').innerHTML = 
                    `<div style="white-space: pre-wrap;">${escapeHtml(result.text)}</div>`;
                
                // Render Text in PDF viewer container
                const pdfContainer = document.getElementById('pdfViewerContainer');
                
                // Hide PDF canvas wrapper
                const pdfCanvas = document.getElementById('pdfCanvas');
                if (pdfCanvas) pdfCanvas.style.display = 'none';
                
                // Disable snip button for Text
                const snipBtn = document.getElementById('snipBtn');
                if (snipBtn) {
                    snipBtn.disabled = true;
                    snipBtn.title = "Snip Tool is only available for PDF files";
                    snipBtn.style.opacity = '0.5';
                    snipBtn.style.cursor = 'not-allowed';
                }
                
                // Create wrapper for Text
                const wrapper = document.createElement('div');
                wrapper.className = 'txt-content';
                wrapper.style.cssText = 'overflow-y: auto; height: 100%; padding: 40px; background: #ffffff !important; color: #000000 !important; font-family: "Consolas", "Monaco", "Courier New", monospace; line-height: 1.6; max-width: 900px; margin: 0 auto; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);';
                wrapper.innerHTML = `<pre style="margin: 0; white-space: pre-wrap; word-wrap: break-word; color: #000000 !important;">${escapeHtml(result.text)}</pre>`;
                
                pdfContainer.appendChild(wrapper);
                
                // Restore saved location
                const lastLocation = recentFilesManager.getLastLocation(filePath);
                if (lastLocation) {
                    if (lastLocation.scrollTop) {
                        setTimeout(() => {
                            wrapper.scrollTop = lastLocation.scrollTop;
                        }, 100);
                    }
                    if (lastLocation.view) {
                        switchView(lastLocation.view);
                    }
                }
                
                if (closePdfBtn) closePdfBtn.disabled = false;
                if (exportBtn) exportBtn.disabled = false;
                
                notesManager.loadNotesForFile(filePath);
                
                // Add tab
                if (typeof tabManager !== 'undefined') {
                    tabManager.addTab(filePath, currentFileName, 'txt');
                }
                
                // Clear figures for Text (not supported)
                if (typeof figuresManager !== 'undefined') {
                    figuresManager.loadFiguresForFile(filePath);
                }
                
                // Hide Figures button for Text
                if (figuresBtn) {
                    figuresBtn.style.display = 'none';
                }
                
                hideLoading();
                setStatus(`Loaded: ${currentFileName}`);
                
                setTimeout(() => {
                    performAnalysis();
                }, 100);
            } else {
                setStatus('❌ No text found in file');
                hideLoading();
            }
        } else {
            setStatus('❌ Error reading text file');
            hideLoading();
        }
    } catch (error) {
        console.error('Error loading text file:', error);
        setStatus('❌ Error: ' + error.message);
        hideLoading();
    }
}

// OCR Scan logic removed
// OCR Scan
// ocrScanBtn.addEventListener('click', async () => {
//     try {
//         showLoading('Running OCR (this may take a few minutes)...');
//         
//         const ocrText = await pdfViewer.performOCR((progress) => {
//             loadingMessage.textContent = `OCR Progress: ${Math.round(progress * 100)}%`;
//         });
//         
//         if (ocrText && ocrText.trim().length > 0) {
//             document.getElementById('rawTextContent').innerHTML = 
//                 `<div style="white-space: pre-wrap;">${escapeHtml(ocrText)}</div>`;
//             
//             analyzeBtn.disabled = false;
//             ocrScanBtn.disabled = true;
//             
//             setStatus(`✅ OCR Complete: ${ocrText.split(/\s+/).length} words extracted`);
//         } else {
//             setStatus('❌ OCR failed to extract text');
//         }
//         
//         hideLoading();
//     } catch (error) {
//         console.error('OCR error:', error);
//         setStatus('❌ OCR Error: ' + error.message);
//         hideLoading();
//     }
// });

// Cross-Document Navigation Function
window.openFileFromPath = async function(filePath, targetNoteId = null, cachedState = null) {
    try {
        // Save current state if switching files
        if (currentFilePath && currentFilePath !== filePath && window.saveCurrentState) {
            await window.saveCurrentState();
        }

        // Check if file exists and get file info
        let result = null;
        try {
            result = await ipcRenderer.invoke('get-file-info', filePath);
        } catch (e) {
            console.warn('get-file-info failed (handler missing), falling back to path parsing:', e);
            // Fallback: infer details from path string
            const name = filePath.split(/[\\/]/).pop();
            const ext = filePath.split('.').pop().toLowerCase();
            let type = 'pdf';
            if (ext === 'epub') type = 'epub';
            else if (ext === 'docx') type = 'docx';
            else if (ext === 'md') type = 'md';
            else if (ext === 'txt') type = 'txt';
            
            result = {
                exists: true, // Assume exists, load will fail gracefully if not
                fileName: name,
                filePath: filePath,
                fileType: type
            };
        }
        
        if (!result || !result.exists) {
            alert('File not found. It may have been moved or deleted:\n' + filePath);
            return;
        }
        
        // Set current file info
        currentFileName = result.fileName;
        currentFilePath = filePath;
        currentFileType = result.fileType || 'pdf';
        fileNameDisplay.textContent = currentFileName;
        
        // Load the file based on type
        if (currentFileType === 'pdf') {
            await loadPDFFile(filePath, cachedState);
        } else if (currentFileType === 'epub') {
            await loadEPUBFile(filePath, cachedState);
        } else if (currentFileType === 'docx') {
            await loadDOCXFile(filePath, cachedState);
        } else if (currentFileType === 'md') {
            await loadMarkdownFile(filePath, cachedState);
        } else if (currentFileType === 'txt') {
            await loadTxtFile(filePath, cachedState);
        }
        
        // After file is loaded, navigate to the target note if specified
        if (targetNoteId) {
            // Switch to notes tab
            const notesTab = document.querySelector('[data-tab="notes"]');
            if (notesTab) notesTab.click();
            
            // Wait a bit for rendering, then scroll to note
            setTimeout(() => {
                notesManager.scrollToNote(targetNoteId);
            }, 500);
        }
    } catch (error) {
        console.error('Error opening file from path:', error);
        alert('Error opening file:\n' + error.message);
    }
};

// Analyze Text Function
async function performAnalysis() {
    console.log('🔬 performAnalysis() called');
    try {
        showLoading('Analyzing text with NLP...', true);
        const startTime = performance.now();
        
        // Get text (use clean text without markers)
        const rawText = getCleanRawText();
        console.log('📄 Raw text length:', rawText ? rawText.length : 0);
        
        if (!rawText || rawText.trim().length === 0) {
            console.warn('⚠️ No text to analyze');
            setStatus('❌ No text to analyze');
            hideLoading();
            return;
        }
        
        // Simulating progress since NLP is blocking/fast enough not to support real stream
        if (progressBar) {
            progressBar.style.width = '10%';
            await new Promise(r => setTimeout(r, 10));
        }
        
        // Perform analysis
        console.log('🧠 Starting NLP analysis...');
        if (progressBar) progressBar.style.width = '40%';
        currentAnalysis = await textAnalyzer.analyze(rawText);
        console.log('✅ Analysis complete:', {
            nouns: currentAnalysis.pos.nouns.length,
            verbs: currentAnalysis.pos.verbs.length,
            sentences: currentAnalysis.stats.sentences
        });
        
        // Add page count to stats
        if (currentFileType === 'pdf' && pdfViewer && pdfViewer.totalPages) {
            currentAnalysis.stats.pages = pdfViewer.totalPages;
        } else {
            currentAnalysis.stats.pages = null;
        }
        
        // Render highlighted text
        if (progressBar) progressBar.style.width = '70%';
        await new Promise(r => setTimeout(r, 50)); // Give UI a chance to breathe

        console.log('🎨 Rendering POS highlighted text...');
        const highlightedHtml = textAnalyzer.renderHighlightedText(
            rawText,
            currentAnalysis,
            getHighlightOptions()
        );
        const highlightedContent = document.getElementById('highlightedTextContent');
        if (highlightedContent) {
            highlightedContent.innerHTML = highlightedHtml;
            console.log('✅ POS highlighted text rendered');
        } else {
            console.warn('⚠️ highlightedTextContent element not found');
        }
        
        // Update statistics
        if (progressBar) progressBar.style.width = '90%';
        statsPanel.renderStats(currentAnalysis);
        
        // Update POS counts in checkboxes
        console.log('📊 Updating POS counts...');
        updatePOSCounts(currentAnalysis);
        
        // Re-apply user highlights after analysis
        setTimeout(() => {
            console.log('🖍️ Applying user highlights...');
            notesManager.applyHighlights();
            if (progressBar) progressBar.style.width = '100%';
        }, 100);
        
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
        setStatus(`✅ Analysis complete`);
        processingTime.textContent = `⏱️ ${elapsed}s`;
        
        // Save analysis to persistent cache
        if (typeof analysisCache !== 'undefined' && currentFilePath) {
            analysisCache.saveAnalysis(currentFilePath, {
                analysis: currentAnalysis,
                rawTextHTML: document.getElementById('rawTextContent').innerHTML,
                highlightedTextHTML: document.getElementById('highlightedTextContent').innerHTML,
                figuresHTML: document.getElementById('figuresGrid') ? document.getElementById('figuresGrid').innerHTML : '',
                figuresCount: document.getElementById('figuresCount') ? document.getElementById('figuresCount').textContent : '0 found'
            });
        }
        
        // Pre-render map in background so it's ready when user switches to it
        setTimeout(() => {
            renderMap().catch(err => console.error('Error pre-rendering map:', err));
            
            // Also refresh mindmap data so it's ready
            if (typeof mindmapManager !== 'undefined') {
                mindmapManager.refreshData();
            }
        }, 100);
        
        setTimeout(() => {
        hideLoading();
        }, 500); // Small delay to show 100%
    } catch (error) {
        console.error('Analysis error:', error);
        setStatus('❌ Analysis Error: ' + error.message);
        hideLoading();
    }
}

// Expose performAnalysis globally for mobile
window.performAnalysis = performAnalysis;

// Export Notes & Highlights
if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
        try {
            const notes = notesManager.notes;
            const highlights = notesManager.highlights;
            
            if (notes.length === 0 && highlights.length === 0) {
                setStatus('⚠️ No notes or highlights to export');
                return;
            }
        
            let content = `# Notes & Highlights for ${currentFileName}\n\n`;
            content += `Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n\n`;

            // Helper function to get linked items
            const getLinkedItems = (item) => {
                if (!item.links || item.links.length === 0) return [];
                
                const linkedItems = [];
                const allData = notesManager.loadFromStorage();
                
                item.links.forEach(link => {
                    const linkId = typeof link === 'string' ? link : link.id;
                    const linkFilePath = typeof link === 'object' ? link.filePath : null;
                    
                    if (linkFilePath && linkFilePath !== currentFilePath) {
                        // External link
                        const externalData = allData[linkFilePath];
                        if (externalData) {
                            const linkedNote = externalData.notes?.find(n => n.id === linkId);
                            const linkedHighlight = externalData.highlights?.find(h => h.id === linkId);
                            const linkedItem = linkedNote || linkedHighlight;
                            
                            if (linkedItem) {
                                linkedItems.push({
                                    ...linkedItem,
                                    sourceFile: link.fileName || linkFilePath.split(/[\\/]/).pop()
                                });
                            }
                        }
                    } else {
                        // Internal link
                        const linkedNote = notes.find(n => n.id === linkId);
                        const linkedHighlight = highlights.find(h => h.id === linkId);
                        const linkedItem = linkedNote || linkedHighlight;
                        
                        if (linkedItem) {
                            linkedItems.push({
                                ...linkedItem,
                                sourceFile: null // Internal link
                            });
                        }
                    }
                });
                
                return linkedItems;
            };

            // Group by Page
            const itemsByPage = {};
            
            [...notes, ...highlights].forEach(item => {
                const page = item.page || 'General';
                if (!itemsByPage[page]) itemsByPage[page] = [];
                itemsByPage[page].push(item);
            });

            Object.keys(itemsByPage).sort((a, b) => {
                if (a === 'General') return -1;
                if (b === 'General') return 1;
                return parseInt(a) - parseInt(b);
            }).forEach(page => {
                content += `## Page ${page}\n\n`;
                
                itemsByPage[page].forEach(item => {
                    if (item.type === 'note') {
                        content += `### 📝 Note\n`;
                        content += `${item.text}\n\n`;
                        content += `_Created: ${new Date(item.createdAt).toLocaleString()}_\n\n`;
                    } else if (item.type === 'highlight') {
                        content += `### ✨ Highlight\n`;
                        content += `> "${item.text}"\n\n`;
                        if (item.note) {
                            content += `**Note:** ${item.note}\n\n`;
                        }
                        content += `_Created: ${new Date(item.createdAt).toLocaleString()}_\n\n`;
                    }
                    
                    // Add linked items
                    const linkedItems = getLinkedItems(item);
                    if (linkedItems.length > 0) {
                        content += `#### 🔗 Linked References (${linkedItems.length})\n\n`;
                        
                        linkedItems.forEach(linkedItem => {
                            const isExternal = linkedItem.sourceFile !== null;
                            const sourceLabel = isExternal ? `📄 ${linkedItem.sourceFile}` : '📍 This document';
                            
                            if (linkedItem.type === 'note') {
                                content += `- **${sourceLabel} - Note:**\n`;
                                content += `  ${linkedItem.text}\n\n`;
                            } else if (linkedItem.type === 'highlight') {
                                content += `- **${sourceLabel} - Highlight:**\n`;
                                content += `  > "${linkedItem.text}"\n`;
                                if (linkedItem.note) {
                                    content += `  \n  **Note:** ${linkedItem.note}\n`;
                                }
                                content += `\n`;
                            }
                        });
                        
                        content += `\n`;
                    }
                    
                    content += `---\n\n`;
                });
            });

            // Use IPC to save file
            const result = await ipcRenderer.invoke('save-file-dialog', {
                defaultPath: `${currentFileName.replace(/\.(pdf|epub|docx|md|txt)$/, '')}_notes.md`,
                filters: [{ name: 'Markdown', extensions: ['md'] }]
            });

            if (!result.canceled && result.filePath) {
                await ipcRenderer.invoke('write-file', {
                    filePath: result.filePath,
                    content: content
                });
                setStatus('✅ Notes exported successfully');
            }

        } catch (error) {
            console.error('Export error:', error);
            setStatus('❌ Export Error: ' + error.message);
        }
    });
}

// View Toggle (Raw, Highlighted, Notes, Map, Figures)
highlightedTextBtn.addEventListener('click', () => switchView('highlighted'));
notesBtn.addEventListener('click', () => switchView('notes'));
translateTabBtn.addEventListener('click', () => switchView('translate'));
mapBtn.addEventListener('click', () => switchView('map'));
mindmapBtn.addEventListener('click', () => switchView('mindmap'));

document.addEventListener('highlight-map-word', (e) => {
    if (e.detail && e.detail.word) {
        switchView('map');
        // Small delay to ensure view is active
        setTimeout(() => renderMap(e.detail.word), 50);
    }
});
figuresBtn.addEventListener('click', () => switchView('figures'));

if (scanFiguresBtn) {
    scanFiguresBtn.addEventListener('click', scanFigures);
}

// Page navigation for Highlight tab
if (rawTextPageNav) {
    const navigateRawTextPage = () => {
        const pageNum = parseInt(rawTextPageNav.value);
        if (pageNum && pageNum >= 1 && pageNum <= pdfViewer.totalPages) {
            const anchorId = `text-page-${pageNum}`;
            const anchor = document.getElementById(anchorId);
            if (anchor) {
                anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };
    
    rawTextPageNav.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            navigateRawTextPage();
        }
    });
    
    const rawTextNavBtn = rawTextPageNav.nextElementSibling;
    if (rawTextNavBtn) {
        rawTextNavBtn.addEventListener('click', navigateRawTextPage);
    }
}

// Page navigation for Analyse tab
if (highlightedTextPageNav) {
    const navigateHighlightedTextPage = () => {
        const pageNum = parseInt(highlightedTextPageNav.value);
        if (pageNum && pageNum >= 1 && pageNum <= pdfViewer.totalPages) {
            const anchorId = `highlight-page-${pageNum}`;
            const anchor = document.getElementById(anchorId);
            if (anchor) {
                anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };
    
    highlightedTextPageNav.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            navigateHighlightedTextPage();
        }
    });
    
    const highlightedTextNavBtn = highlightedTextPageNav.nextElementSibling;
    if (highlightedTextNavBtn) {
        highlightedTextNavBtn.addEventListener('click', navigateHighlightedTextPage);
    }
}

function switchView(view) {
    // Save current view to recent files
    if (currentFilePath) {
        const currentLocation = recentFilesManager.getLastLocation(currentFilePath) || {};
        recentFilesManager.updateLocation(currentFilePath, {
            ...currentLocation,
            view: view
        });
    }
    
    // Update buttons
    [highlightedTextBtn, notesBtn, translateTabBtn, mapBtn, mindmapBtn, figuresBtn].forEach(btn => btn.classList.remove('active'));
    
    // Update views
    [highlightedTextView, notesView, translateView, mapView, mindmapView, figuresView].forEach(v => v.classList.remove('active'));
    
    // Update stats panel based on view
    if (typeof statsPanel !== 'undefined') {
        if (view === 'translate' && translationState.lastAnalysis) {
            statsPanel.renderStats(translationState.lastAnalysis, 'translate');
        } else if (currentAnalysis) {
            statsPanel.renderStats(currentAnalysis, 'highlighted');
        }
    }
    
    switch(view) {
        case 'highlighted':
            highlightedTextBtn.classList.add('active');
            highlightedTextView.classList.add('active');
            // Apply highlights when switching to highlighted view
            if (typeof notesManager !== 'undefined') {
                setTimeout(() => notesManager.applyHighlights(), 10);
            }
            break;
        case 'notes':
            notesBtn.classList.add('active');
            notesView.classList.add('active');
            // Refresh notes list (force render to bypass visibility optimization)
            if (typeof notesManager !== 'undefined') {
                setTimeout(() => notesManager.render(true), 10);
            }
            break;
        case 'translate':
            translateTabBtn.classList.add('active');
            translateView.classList.add('active');
            if (typeof notesManager !== 'undefined') {
                setTimeout(() => notesManager.applyHighlights(), 10);
            }
            updateCachedTranslationsUI();
            break;
        case 'map':
            mapBtn.classList.add('active');
            mapView.classList.add('active');
            
            // Auto-enable Continuous Mode for Map
            const mapToggle = document.querySelector('#mapView .continuous-mode-checkbox');
            if (mapToggle && !mapToggle.checked) {
                mapToggle.click();
            }
            
            // Call async renderMap
            renderMap().catch(err => console.error('Error rendering map:', err));
            break;
        case 'mindmap':
            mindmapBtn.classList.add('active');
            mindmapView.classList.add('active');
            if (mindmapManager) {
                mindmapManager.refreshData();
                setTimeout(() => mindmapManager.handleResize(), 10);
            }
            break;
        case 'figures':
            figuresBtn.classList.add('active');
            figuresView.classList.add('active');
            // Re-render figures to ensure they're up to date
            if (typeof figuresManager !== 'undefined') {
                figuresManager.render();
            }
            break;
    }
}

// Snip Button Logic
if (snipBtn) {
    snipBtn.addEventListener('click', () => {
        if (!currentPdfData) {
            setStatus('⚠️ No PDF loaded');
            return;
        }
        
        setStatus('✂️ Drag to select an area on the PDF...');
        
        pdfViewer.enableSnipping((dataUrl) => {
            console.log('Snip captured, data URL length:', dataUrl.length);
            
            // Capture the CURRENT page number immediately
            const capturedPage = pdfViewer.currentPage;
            
            if (typeof figuresManager !== 'undefined') {
                // Ensure currentFilePath is set (fallback)
                if (!figuresManager.currentFilePath && currentFilePath) {
                    console.log('Setting currentFilePath in figuresManager:', currentFilePath);
                    figuresManager.setCurrentFile(currentFilePath);
                }
                
                figuresManager.addFigure({
                    page: capturedPage,
                    src: dataUrl,
                    type: 'snip'
                });
            }
            
            setStatus('✅ Figure captured! Added to Figures tab.');
            
            // Auto-switch to figures view so user sees it immediately
            switchView('figures');
        });
    });
}

async function scanFigures() {
    if (!currentPdfData) return;
    
    showLoading('Scanning for figures...', true);
    scanFiguresBtn.disabled = true;
    
    try {
        const images = await pdfViewer.extractImages((progress) => {
            loadingMessage.textContent = `Scanning: ${Math.round(progress * 100)}%`;
        });
        
        if (typeof figuresManager !== 'undefined') {
            figuresManager.addTransient(images.map(img => ({
                ...img,
                id: `scan_${Date.now()}_${Math.random()}`,
                type: 'scan'
            })));
        } else {
            // Fallback for safety
            figuresCount.textContent = `${images.length} found`;
            if (images.length === 0) {
                figuresGrid.innerHTML = '<div class="placeholder-text"><p>🖼️ No images found</p></div>';
            } else {
                // ... manual rendering ...
                // But I should assume manager exists.
            }
        }
        
    } catch (error) {
        console.error('Error scanning figures:', error);
        setStatus('❌ Error scanning figures');
    } finally {
        hideLoading();
        scanFiguresBtn.disabled = false;
    }
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function processPOSTokens(text, filterWord, posSets) {
    const parts = text.split(/(\s+|[$€£¥₹₽₪₩₫₿]|[.,!?;:()"\-])/);
    
    return parts.map(part => {
        if (!part) return '';
        if (/^(\s+|[.,!?;:()"\-])$/.test(part)) return escapeHtml(part);
        
        const lower = part.toLowerCase();
        let style = '';
        let className = '';
        
        if (filterWord && lower.includes(filterWord.toLowerCase())) {
            style = 'background-color: #ff9800; color: white; border-radius: 2px; padding: 0 2px;';
            className = 'map-search-match';
        } else if (posSets) {
            const clean = lower.replace(/[^a-z0-9]/g, '');
            const normalized = part.replace(/,/g, ''); // For numbers with commas
            
            // New Categories
            if (posSets['currency-symbol'] && posSets['currency-symbol'].has(lower)) {
                 style = 'background-color: #dcfce7; color: #166534; padding: 0 2px; border-radius: 2px; font-weight: bold;';
            } else if (posSets['currency-pair'] && posSets['currency-pair'].has(lower)) {
                 style = 'background-color: #e0e7ff; color: #3730a3; padding: 0 2px; border-radius: 2px;';
            } else if (posSets.crypto && posSets.crypto.has(clean)) {
                 style = 'background-color: #fef9c3; color: #854d0e; padding: 0 2px; border-radius: 2px;';
            } else if (posSets.currency && posSets.currency.has(clean)) {
                 style = 'background-color: #d1fae5; color: #065f46; padding: 0 2px; border-radius: 2px;';
            } else if (posSets.number && (posSets.number.has(clean) || posSets.number.has(normalized.toLowerCase()))) {
                 style = 'background-color: #e0f2fe; color: #075985; padding: 0 2px; border-radius: 2px;';
            } else if (posSets.date && (posSets.date.has(lower) || posSets.date.has(clean))) { 
                 style = 'background-color: #ffedd5; color: #9a3412; padding: 0 2px; border-radius: 2px;';
            } else if (posSets.abbreviation && (posSets.abbreviation.has(lower) || posSets.abbreviation.has(clean))) {
                 style = 'border-bottom: 1px dotted #333; background-color: #f3f4f6;';
            } else if (posSets.acronym && posSets.acronym.has(clean)) {
                 style = 'border: 1px solid #e5e7eb; background-color: #f9fafb; font-weight: bold; font-size: 0.9em;';
            }
            
            // Existing Categories
            else if (posSets.people && posSets.people.has(clean)) {
                 style = 'background-color: rgba(233, 30, 99, 0.3); border-bottom: 1px solid #e91e63; padding: 0 2px; border-radius: 2px; color: #333;';
            } else if (posSets.places && posSets.places.has(clean)) {
                 style = 'background-color: rgba(156, 39, 176, 0.3); border-bottom: 1px solid #9c27b0; padding: 0 2px; border-radius: 2px; color: #333;';
            } else if (posSets.nouns && posSets.nouns.has(clean)) {
                style = 'background-color: rgba(33, 150, 243, 0.3); padding: 0 2px; border-radius: 2px; color: #333;';
            } else if (posSets.verbs && posSets.verbs.has(clean)) {
                style = 'background-color: rgba(76, 175, 80, 0.3); padding: 0 2px; border-radius: 2px; color: #333;';
            } else if (posSets.adj && posSets.adj.has(clean)) {
                style = 'background-color: rgba(255, 235, 59, 0.4); padding: 0 2px; border-radius: 2px; color: #333;';
            } else if (posSets.adv && posSets.adv.has(clean)) {
                style = 'background-color: rgba(255, 152, 0, 0.3); padding: 0 2px; border-radius: 2px; color: #333;';
            } else if (posSets.prep && posSets.prep.has(clean)) {
                style = 'background-color: rgba(156, 39, 176, 0.25); padding: 0 2px; border-radius: 2px; color: #333;';
            } else if (posSets.conj && posSets.conj.has(clean)) {
                style = 'background-color: rgba(121, 85, 72, 0.3); padding: 0 2px; border-radius: 2px; color: #333;';
            } else if (posSets.interj && posSets.interj.has(clean)) {
                style = 'background-color: rgba(244, 67, 54, 0.3); padding: 0 2px; border-radius: 2px; color: #333;';
            } else if (posSets.det && posSets.det.has(clean)) {
                style = 'background-color: rgba(158, 158, 158, 0.25); padding: 0 2px; border-radius: 2px; color: #333;';
            }
        }
        
        if (style) {
            return `<span class="${className}" style="${style}">${escapeHtml(part)}</span>`;
        }
        return escapeHtml(part);
    }).join('');
}

// Cache color mapping for better performance
const COLOR_MAP = {
    'yellow': '#ffeb3b',
    'green': '#a5d6a7',
    'blue': '#90caf9',
    'pink': '#f48fb1',
    'purple': '#ce93d8'
};

function processThumbnailText(text, filterWord, posSets, pageHighlights = [], sectionStartOffset = 0) {
    if (!filterWord && (!posSets || Object.keys(posSets).length === 0) && (!pageHighlights || pageHighlights.length === 0)) return escapeHtml(text);
    
    // 1. Build Character Map for Highlights (optimized with sparse array)
    const charInfo = {}; // Use object for sparse storage instead of full array
    
    if (pageHighlights.length > 0) {
        pageHighlights.forEach(h => {
            if (!h.text) return;
            
            // Check for Offset-based highlighting (Preferred)
            if (h.startOffset !== undefined && h.endOffset !== undefined && sectionStartOffset !== undefined) {
                const hStart = h.startOffset;
                const hEnd = h.endOffset;
                const sStart = sectionStartOffset;
                const sEnd = sectionStartOffset + text.length;
                
                // Check overlap
                if (hStart < sEnd && hEnd > sStart) {
                    // Calculate local range
                    const localStart = Math.max(0, hStart - sStart);
                    const localEnd = Math.min(text.length, hEnd - sStart);
                    
                    const info = { color: h.color || 'yellow', id: h.id, start: localStart, end: localEnd };
                    
                    // Store range instead of individual chars for better performance
                    for (let k = localStart; k < localEnd; k++) {
                        charInfo[k] = info;
                    }
                }
            } else {
                // Fallback to Text Matching (Legacy or missing offsets)
                try {
                    const regex = new RegExp(h.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                    let match;
                    while ((match = regex.exec(text)) !== null) {
                        const color = h.color || 'yellow';
                        const info = { color, id: h.id };
                        for (let k = match.index; k < match.index + match[0].length; k++) {
                            charInfo[k] = info;
                        }
                    }
                } catch(e) {}
            }
        });
    }

    // 2. Build Segments
    const segments = [];
    let currentStart = 0;
    const isSame = (a, b) => {
        if (a === b) return true;
        if (!a || !b) return false;
        return a.color === b.color && a.id === b.id;
    };
    
    let currentInfo = charInfo[0];
    
    for (let i = 1; i < text.length; i++) {
        if (!isSame(charInfo[i], currentInfo)) {
            segments.push({ text: text.substring(currentStart, i), info: currentInfo });
            currentStart = i;
            currentInfo = charInfo[i];
        }
    }
    segments.push({ text: text.substring(currentStart), info: currentInfo });

    // 3. Render Segments
    return segments.map(seg => {
        if (seg.info) {
            // User Highlight Segment - use cached color map
            const hex = COLOR_MAP[seg.info.color] || seg.info.color;
            
            const highlightIdAttr = seg.info.id ? ` data-highlight-id="${seg.info.id}"` : '';
            const highlightClass = 'map-user-highlight';
            
            // Handle search match overlapping with highlight
            if (filterWord && seg.text.toLowerCase().includes(filterWord.toLowerCase())) {
                const parts = seg.text.split(/(\s+|[.,!?;:()"\-])/);
                return parts.map(part => {
                    if (!part) return '';
                    const lower = part.toLowerCase();
                    if (filterWord && lower.includes(filterWord.toLowerCase())) {
                         return `<span class="map-search-match" style="background-color: #ff9800; color: white; border-radius: 2px; padding: 0 2px;">${escapeHtml(part)}</span>`;
                    }
                    return `<span class="${highlightClass}" style="background-color: ${hex}; color: #333; padding: 0 2px; border-radius: 2px;"${highlightIdAttr}>${escapeHtml(part)}</span>`;
                }).join('');
            } else {
                return `<span class="${highlightClass}" style="background-color: ${hex}; color: #333; padding: 0 2px; border-radius: 2px;"${highlightIdAttr}>${escapeHtml(seg.text)}</span>`;
            }
        } else {
            // Normal Segment - Apply POS and Search
            return processPOSTokens(seg.text, filterWord, posSets);
        }
    }).join('');
}

// Initialize debounced renderMap after functions are defined
// Use 300ms delay to batch multiple rapid updates
if (typeof renderMapDebounced === 'undefined' || renderMapDebounced === null) {
    renderMapDebounced = debounce(renderMap, 300);
}

// Map Search Navigation State
let mapSearchMatches = [];
let currentMapMatchIndex = 0;

function updateMapNav() {
    if (mapSearchMatches.length > 0) {
        const match = mapSearchMatches[currentMapMatchIndex];
        
        // Scroll to match
        match.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Highlight with outline
        mapSearchMatches.forEach(m => m.style.outline = 'none');
        match.style.outline = '3px solid #FF5722';
        match.style.transition = 'outline 0.2s';
        
        // Update Text/Input
        const navInput = document.getElementById('navOccurrenceInput');
        const navTotal = document.getElementById('navTotalCount');
        
        if (navInput) {
            navInput.value = currentMapMatchIndex + 1;
            navInput.max = mapSearchMatches.length;
        }
        
        if (navTotal) {
            navTotal.textContent = mapSearchMatches.length;
        }
    }
}

function collectMapPOSSets() {
    const posSets = {};
    if (currentAnalysis) {
        const mappings = [
            { id: 'mapHighlightNouns', type: 'nouns', source: currentAnalysis.pos?.nouns },
            { id: 'mapHighlightVerbs', type: 'verbs', source: currentAnalysis.pos?.verbs },
            { id: 'mapHighlightAdj', type: 'adj', source: currentAnalysis.pos?.adjectives },
            { id: 'mapHighlightAdv', type: 'adv', source: currentAnalysis.pos?.adverbs },
            { id: 'mapHighlightPrep', type: 'prep', source: currentAnalysis.pos?.prepositions },
            { id: 'mapHighlightConj', type: 'conj', source: currentAnalysis.pos?.conjunctions },
            { id: 'mapHighlightInterj', type: 'interj', source: currentAnalysis.pos?.interjections },
            { id: 'mapHighlightDet', type: 'det', source: currentAnalysis.pos?.determiners },
            { id: 'mapHighlightPeople', type: 'people', source: currentAnalysis.entities?.people },
            { id: 'mapHighlightPlaces', type: 'places', source: currentAnalysis.entities?.places },
            { id: 'mapHighlightAbbr', type: 'abbreviation', source: currentAnalysis.entities?.abbreviations },
            { id: 'mapHighlightAcronyms', type: 'acronym', source: currentAnalysis.entities?.acronyms },
            { id: 'mapHighlightNumbers', type: 'number', source: currentAnalysis.entities?.numbers },
            { id: 'mapHighlightCurrencies', type: 'currency', source: currentAnalysis.entities?.currencies },
            { id: 'mapHighlightDates', type: 'date', source: currentAnalysis.entities?.dates },
            { id: 'mapHighlightCrypto', type: 'crypto', source: currentAnalysis.entities?.crypto },
            { id: 'mapHighlightCurrencyPairs', type: 'currency-pair', source: currentAnalysis.entities?.currencyPairs },
            { id: 'mapHighlightCurrencySymbols', type: 'currency-symbol', source: currentAnalysis.entities?.currencySymbols }
        ];
        
        mappings.forEach(m => {
            const el = document.getElementById(m.id);
            if (el && el.checked && m.source) {
                const items = [];
                m.source.forEach(i => {
                    const word = i.word.toLowerCase();
                    
                    // For symbols and specialized types, keep punctuation/format
                    if (['currency-symbol', 'currency-pair', 'abbreviation', 'number', 'currency', 'date', 'crypto'].includes(m.type)) {
                        items.push(word);
                        
                        // For numbers, also add comma-formatted version
                        if (m.type === 'number') {
                            const num = parseInt(word);
                            if (!isNaN(num) && num >= 1000) {
                                const formatted = num.toLocaleString('en-US').toLowerCase();
                                items.push(formatted);
                            }
                        }
                        
                        // For dates, also add clean version (no punctuation)
                        if (m.type === 'date') {
                            const clean = word.replace(/[\/\-\.]/g, '');
                            if (clean !== word) {
                                items.push(clean);
                            }
                        }
                    } else {
                        // For standard words, strip punctuation to match loosely
                        items.push(word.replace(/[^a-z0-9]/g, ''));
                    }
                });
                
                posSets[m.type] = new Set(items);
            }
        });
    }
    return posSets;
}

let mapRenderJobId = 0;

async function renderMap(filterWord = null) {
    const jobId = ++mapRenderJobId;

    // Check if map view is active
    const mapView = document.getElementById('mapView');
    if (!mapView || !mapView.classList.contains('active')) {
        return;
    }

    // Check if any document is loaded
    if (!currentFilePath) {
        mapGrid.innerHTML = '<div class="placeholder-text"><p>📄 No document loaded</p></div>';
        return;
    }
    
    // Store the file path we're rendering for
    const renderingForPath = currentFilePath;
    currentMapRenderPath = renderingForPath;
    
    // For PDFs, we need to get text - either from pdfViewer cache or from DOM
    if (currentFileType === 'pdf') {
        // Check if we can use the DOM text (more reliable when restoring from cache)
        const rawTextContent = document.getElementById('rawTextContent');
        const hasTextInDOM = rawTextContent && rawTextContent.textContent && rawTextContent.textContent.trim().length > 100;
        
        if (hasTextInDOM) {
            // Use text from DOM - this is already the correct document's text
            console.log('Using text from DOM for map rendering (more reliable)');
            
            // Collect POS Sets first
            const posSets = collectMapPOSSets();
            
            await renderMapForTextDocument(filterWord, posSets);
            return;
        }
        
        // Otherwise, use PDF viewer (but ensure it's ready)
        if (!pdfViewer || !pdfViewer.pdfDoc || !pdfViewer.totalPages) {
            console.log('PDF viewer not ready, deferring map render');
            mapGrid.innerHTML = '<div class="placeholder-text"><p>⏳ Loading PDF...</p></div>';
            return;
        }
        
        const cacheKeys = Object.keys(pdfViewer.pageTextCache || {});
        
        // If cache is empty or incomplete, extract text first
        if (cacheKeys.length === 0 || cacheKeys.length < pdfViewer.totalPages) {
            console.log('PDF text cache empty or incomplete, extracting text...');
            mapGrid.innerHTML = '<div class="placeholder-text"><p>⏳ Extracting text from PDF...</p></div>';
            
            try {
                await pdfViewer.extractAllText();
                console.log('Text extraction complete, cache now has:', Object.keys(pdfViewer.pageTextCache || {}).length, 'pages');
                
                // Check if document changed during extraction
                if (currentFilePath !== renderingForPath) {
                    console.log('Document changed during extraction, aborting map render');
                    return;
                }
            } catch (error) {
                console.error('Error extracting PDF text:', error);
                mapGrid.innerHTML = '<div class="placeholder-text"><p>❌ Error extracting text</p></div>';
                return;
            }
        }
    }
    
    // Collect POS Sets
    const posSets = collectMapPOSSets();
    
    // For EPUB/DOCX/MD/TXT, show a simplified view based on highlights only
    if (['epub', 'docx', 'md', 'txt'].includes(currentFileType)) {
        await renderMapForTextDocument(filterWord, posSets);
        return;
    }
    
    // Double-check we're still on the same document
    if (currentFilePath !== renderingForPath) {
        console.log('Document changed before starting map render loop');
        return;
    }
    
    const totalPages = pdfViewer.totalPages;
    const notes = notesManager.notes;
    const highlights = notesManager.highlights;
    
    // Instead of one giant string, append chunks to DOM
    // First, clear existing content (we are about to render new map)
    mapGrid.innerHTML = '';
    
    let chunkHtml = '';
    let hasContent = false;
    let currentOffset = 0;
    const CHUNK_SIZE = 10;
    
    for (let i = 1; i <= totalPages; i++) {
        // Check for cancellation
        if (mapRenderJobId !== jobId) return;

        // Yield to main thread to prevent UI freezing
        if (i > 1 && i % CHUNK_SIZE === 1) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        // Check periodically if document changed (every 10 pages)
        if (i % 10 === 0 && currentFilePath !== renderingForPath) {
            console.log(`Document changed during map render at page ${i}, aborting`);
            return;
        }
        
        // Calculate offset adjustments for page markers (--- Page X ---)
        const markerText = `--- Page ${i} ---`;
        currentOffset += markerText.length;
        const pageStartOffset = currentOffset;
        
        // Get page text
        const fullPageText = pdfViewer.getPageText(i);
        
        const pageEndOffset = pageStartOffset + fullPageText.length;

        // Find highlights for this page (Overlap Check or Page Match)
        const pageHighlights = highlights.filter(h => {
            if (h.startOffset !== undefined && h.endOffset !== undefined) {
                return (h.startOffset < pageEndOffset && h.endOffset > pageStartOffset);
            }
            return parseInt(h.page) === i;
        });
        
        const pageNotes = notes.filter(n => parseInt(n.page) === i);
        
        const hasItems = pageHighlights.length > 0 || pageNotes.length > 0;
        const itemClass = hasItems ? 'page-has-highlights' : '';
        
        let pageText = fullPageText;
        if (pageText.length > 1500) pageText = pageText.substring(0, 1500) + '...';
        
        const processedText = processThumbnailText(pageText, filterWord, posSets, pageHighlights, pageStartOffset);
        
        // Advance offset by full length for next iteration
        currentOffset += fullPageText.length;
        
        let stripsHtml = '';
        const maxStrips = 15;
        const displayHighlights = pageHighlights.slice(0, maxStrips);
        
        stripsHtml = displayHighlights.map(h => {
            const text = h.text || '';
            const hasLinks = h.links && h.links.length > 0;
            const linkClass = hasLinks ? 'has-links' : '';
            return `<div class="highlight-strip color-${h.color || 'yellow'} ${linkClass}" data-highlight-id="${h.id}" title="${escapeHtml(text)}">${escapeHtml(text)}</div>`;
        }).join('');
        
        if (pageHighlights.length > maxStrips) {
            stripsHtml += `<div style="font-size:10px; text-align:center; color:#999; margin-top:2px;">+${pageHighlights.length - maxStrips}</div>`;
        }

        // Badge
        let badgeHtml = '';
        if (hasItems) {
            const count = pageHighlights.length + pageNotes.length;
            badgeHtml = `<div class="highlight-count-badge">${count}</div>`;
        }
        
        chunkHtml += `
            <div class="page-card ${itemClass}" data-page="${i}" data-start-offset="${pageStartOffset}">
                <div class="page-card-header" onclick="goToPage(${i})" title="Go to Page ${i}" style="cursor: pointer;">Page ${i}</div>
                <div class="page-card-body">
                    ${processedText}
                    <div class="highlight-overlay">
                        ${stripsHtml}
                    </div>
                    ${badgeHtml}
                </div>
            </div>
        `;
        hasContent = true;

        // Flush chunk to DOM
        if (i % CHUNK_SIZE === 0) {
            // Final check before DOM update
            if (currentFilePath !== renderingForPath || mapRenderJobId !== jobId) return;
            
            mapGrid.insertAdjacentHTML('beforeend', chunkHtml);
            chunkHtml = '';
        }
    }
    
    // Append any remaining HTML
    if (chunkHtml) {
        if (currentFilePath !== renderingForPath || mapRenderJobId !== jobId) return;
        mapGrid.insertAdjacentHTML('beforeend', chunkHtml);
    }
    
    // Check if we have any content
    if (!hasContent) {
        mapGrid.innerHTML = '<div class="placeholder-text"><p>📄 No pages to display</p><p style="font-size: 14px; color: #666;">The document may be empty or image-based</p></div>';
        return;
    }
    
    // Apply show/hide settings
    
    // Apply show/hide settings
    const showHighlights = localStorage.getItem('map-show-highlights') !== 'false';
    const showLinks = localStorage.getItem('map-show-links') !== 'false';
    
    if (!showHighlights) {
        const highlightOverlays = mapGrid.querySelectorAll('.highlight-overlay');
        highlightOverlays.forEach(overlay => {
            overlay.style.display = 'none';
        });
    }
    
    // Draw link connections after DOM is rendered (if enabled)
    if (showLinks) {
        setTimeout(() => drawLinkConnections(), 100);
    }
    
    if (filterWord) {
        setTimeout(() => {
            mapSearchMatches = Array.from(mapGrid.querySelectorAll('.map-search-match'));
            currentMapMatchIndex = 0;
            
            // Dispatch event to update search status in stats panel
            const searchResultEvent = new CustomEvent('map-search-complete', { 
                detail: { matchCount: mapSearchMatches.length, word: filterWord } 
            });
            document.dispatchEvent(searchResultEvent);
            
            if (mapSearchMatches.length > 0) {
                const navBar = document.getElementById('wordNavBar');
                const navWord = document.getElementById('navWordDisplay');
                
                if (navBar) {
                    navBar.classList.remove('hidden');
                    if (navWord) navWord.textContent = `"${filterWord}"`;
                    
                    updateMapNav();
                    
                    if (typeof statsPanel !== 'undefined') {
                        statsPanel.matchingSpans = [];
                    }
                }
            } else {
                const navBar = document.getElementById('wordNavBar');
                if (navBar) navBar.classList.add('hidden');
            }
        }, 100);
    } else {
        const navBar = document.getElementById('wordNavBar');
        if (navBar) navBar.classList.add('hidden');
        mapSearchMatches = [];
    }
}

async function renderMapForTextDocument(filterWord = null, posSets = {}) {
    const jobId = mapRenderJobId;
    // Store the file path we're rendering for
    const renderingForPath = currentFilePath;
    
    const notes = notesManager.notes;
    const highlights = notesManager.highlights;
    
    // Get the full text content
    const rawTextContent = document.getElementById('rawTextContent');
    if (!rawTextContent) {
        mapGrid.innerHTML = '<div class="placeholder-text"><p>📄 No content available</p></div>';
        return;
    }
    
    // Get settings
    const showNouns = document.getElementById('mapShowNouns')?.checked;
    const showVerbs = document.getElementById('mapShowVerbs')?.checked;
    
    // Split text into chunks at natural boundaries (paragraphs)
    const fullText = rawTextContent.textContent || '';
    
    if (!fullText.trim()) {
        mapGrid.innerHTML = '<div class="placeholder-text"><p>📄 No text content extracted</p></div>';
        return;
    }
    
    // Group text into sections with exact offsets
    const sections = [];
    let currentStart = 0;
    const targetSectionSize = 1000;
    
    // Check if we have valid text
    if (fullText.length > 0) {
        while (currentStart < fullText.length) {
            let splitIndex = currentStart + targetSectionSize;
            
            if (splitIndex >= fullText.length) {
                sections.push({
                    text: fullText.substring(currentStart),
                    start: currentStart,
                    end: fullText.length
                });
                break;
            }
            
            // Find nearest paragraph break after target size
            let nextNewline = fullText.indexOf('\n', splitIndex);
            
            // If no newline found, or it's too far, split at space
            if (nextNewline === -1 || (nextNewline - currentStart) > targetSectionSize * 2) {
                nextNewline = fullText.indexOf(' ', splitIndex);
            }
            
            // If still no split point, hard split
            if (nextNewline === -1) {
                nextNewline = fullText.length;
            }
            
            sections.push({
                text: fullText.substring(currentStart, nextNewline).trim(),
                start: currentStart,
                end: nextNewline
            });
            
            currentStart = nextNewline + 1;
        }
    }
    
    if (sections.length === 0) {
        mapGrid.innerHTML = '<div class="placeholder-text"><p>📄 No content to display</p></div>';
        return;
    }
    
    // Clear map grid for new content
    mapGrid.innerHTML = '';
    let chunkHtml = '';
    let hasContent = false;
    let previousDisplayEnd = ''; // Track the actual end of the previous displayed text
    
    const CHUNK_SIZE = 10;
    for (let index = 0; index < sections.length; index++) {
        if (mapRenderJobId !== jobId) return;
        if (index > 0 && index % CHUNK_SIZE === 0) {
            await new Promise(r => setTimeout(r, 0));
        }
        const section = sections[index];
        const chunk = section.text;
        const pageNum = index + 1;
        
        // Find highlights that might be in this chunk
        const pageHighlights = highlights.filter(h => {
            if (h.startOffset !== undefined && h.endOffset !== undefined) {
                 const sStart = section.start;
                 const sEnd = section.end;
                 return (h.startOffset < sEnd && h.endOffset > sStart);
            }
            const highlightText = h.text || '';
            return chunk.includes(highlightText.substring(0, 50)); // Match first 50 chars
        });
        
        const pageNotes = notes.filter(n => {
            const noteText = n.text || '';
            return chunk.includes(noteText.substring(0, 50));
        });
        
        const hasItems = pageHighlights.length > 0 || pageNotes.length > 0;
        const itemClass = hasItems ? 'page-has-highlights' : '';
        
        // Show more text and truncate at paragraph boundaries
        let displayText = chunk.trim();
        
        // Show up to 2000 characters, but try to end at a complete sentence or paragraph
        if (displayText.length > 2000) {
            // Try to find the last period, question mark, or exclamation within 2000 chars
            let truncateAt = 2000;
            const lastPeriod = displayText.lastIndexOf('.', 2000);
            const lastQuestion = displayText.lastIndexOf('?', 2000);
            const lastExclaim = displayText.lastIndexOf('!', 2000);
            const lastSentence = Math.max(lastPeriod, lastQuestion, lastExclaim);
            
            if (lastSentence > 1000) { // Only use sentence boundary if it's not too early
                truncateAt = lastSentence + 1;
            }
            
            displayText = displayText.substring(0, truncateAt).trim();
            
            // Add ellipsis if we truncated
            if (truncateAt < chunk.length) {
                displayText += '...';
            }
        }
        
        // Store the actual end of this display text for the next section
        const currentDisplayEnd = displayText.replace(/\.\.\.$/, '').trim();
        const endWords = currentDisplayEnd.split(/\s+/).slice(-4).join(' ');
        
        // Capture continuation info before updating state
        let continuationHtml = '';
        if (index > 0 && previousDisplayEnd) {
            const continueFrom = previousDisplayEnd.split(/\s+/).slice(-4).join(' ');
            continuationHtml = `<span style="color: #999; font-size: 0.9em;">...${escapeHtml(continueFrom)} → </span>`;
        }
        
        // Update for next iteration
        previousDisplayEnd = endWords;
        
        // Process text for visualization (highlight nouns, verbs, or search term)
        const processedContent = processThumbnailText(displayText, filterWord, posSets, pageHighlights, section.start);
        const processedText = continuationHtml + processedContent;
        
        // Create highlight strips
        let stripsHtml = '';
        const maxStrips = 15;
        const displayHighlights = pageHighlights.slice(0, maxStrips);
        
        stripsHtml = displayHighlights.map(h => {
            const text = h.text || '';
            const hasLinks = h.links && h.links.length > 0;
            const linkClass = hasLinks ? 'has-links' : '';
            return `<div class="highlight-strip color-${h.color || 'yellow'} ${linkClass}" data-highlight-id="${h.id}" title="${escapeHtml(text)}">${escapeHtml(text.substring(0, 100))}${text.length > 100 ? '...' : ''}</div>`;
        }).join('');
        
        if (pageHighlights.length > maxStrips) {
            stripsHtml += `<div style="font-size:10px; text-align:center; color:#999; margin-top:2px;">+${pageHighlights.length - maxStrips}</div>`;
        }
        
        // Badge
        let badgeHtml = '';
        if (hasItems) {
            const count = pageHighlights.length + pageNotes.length;
            badgeHtml = `<div class="highlight-count-badge">${count}</div>`;
        }
        
        chunkHtml += `
            <div class="page-card ${itemClass}" data-start-offset="${section.start}">
                <div class="page-card-header" onclick="scrollToOffset(${section.start})" title="Go to Section ${pageNum}" style="cursor: pointer;">Section ${pageNum}</div>
                <div class="page-card-body">
                    ${processedText}
                    <div class="highlight-overlay">
                        ${stripsHtml}
                    </div>
                    ${badgeHtml}
                </div>
            </div>
        `;
        hasContent = true;

        // Flush chunk to DOM
        if (index % CHUNK_SIZE === 0) {
            if (mapRenderJobId !== jobId) return;
            mapGrid.insertAdjacentHTML('beforeend', chunkHtml);
            chunkHtml = '';
        }
    }
    
    // Flush remaining
    if (chunkHtml) {
        if (mapRenderJobId !== jobId) return;
        mapGrid.insertAdjacentHTML('beforeend', chunkHtml);
    }
    
    if (!hasContent) {
        mapGrid.innerHTML = '<div class="placeholder-text"><p>📄 No content to display</p></div>';
        return;
    }
    
    // Apply show/hide settings
    const showHighlights = localStorage.getItem('map-show-highlights') !== 'false';
    const showLinks = localStorage.getItem('map-show-links') !== 'false';
    
    if (!showHighlights) {
        const highlightOverlays = mapGrid.querySelectorAll('.highlight-overlay');
        highlightOverlays.forEach(overlay => {
            overlay.style.display = 'none';
        });
    }
    
    // Draw link connections after DOM is rendered (if enabled)
    if (showLinks) {
        setTimeout(() => drawLinkConnections(), 100);
    }
    
    // Scroll to first match if filtering
    if (filterWord) {
        setTimeout(() => {
            mapSearchMatches = Array.from(mapGrid.querySelectorAll('.map-search-match'));
            currentMapMatchIndex = 0;
            
            // Dispatch event to update search status in stats panel
            const searchResultEvent = new CustomEvent('map-search-complete', { 
                detail: { matchCount: mapSearchMatches.length, word: filterWord } 
            });
            document.dispatchEvent(searchResultEvent);
            
            if (mapSearchMatches.length > 0) {
                const navBar = document.getElementById('wordNavBar');
                const navWord = document.getElementById('navWordDisplay');
                
                if (navBar) {
                    navBar.classList.remove('hidden');
                    if (navWord) navWord.textContent = `"${filterWord}"`;
                    
                    updateMapNav();
                    
                    if (typeof statsPanel !== 'undefined') {
                        statsPanel.matchingSpans = [];
                    }
                }
            } else {
                const navBar = document.getElementById('wordNavBar');
                if (navBar) navBar.classList.add('hidden');
            }
        }, 100);
    } else {
        const navBar = document.getElementById('wordNavBar');
        if (navBar) navBar.classList.add('hidden');
        mapSearchMatches = [];
    }
}

// Scroll to specific offset in text document (EPUB/DOCX)
function scrollToOffset(targetOffset) {
    // Prevent navigation if user is selecting text or just highlighted
    if (window.getSelection().toString().trim().length > 0 || window.justHighlightedMap) {
        return;
    }

    if (window.switchView) {
        window.switchView('highlight');
    }
    
    const rawTextContent = document.getElementById('rawTextContent');
    if (!rawTextContent) return;
    
    // Force layout update
    rawTextContent.offsetHeight;
    
    // Traverse DOM to find the node containing this offset
    const walker = document.createTreeWalker(
        rawTextContent,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );
    
    let currentPos = 0;
    let targetNode = null;
    
    while (walker.nextNode()) {
        const node = walker.currentNode;
        const nodeLength = node.textContent.length;
        
        // If target is within this node (inclusive of end)
        if (currentPos <= targetOffset && (currentPos + nodeLength) >= targetOffset) {
            targetNode = node;
            break;
        }
        
        currentPos += nodeLength;
    }
    
    if (targetNode) {
        const localOffset = Math.max(0, Math.min(targetOffset - currentPos, targetNode.textContent.length));
        
        try {
            // Create range for the target position
            const range = document.createRange();
            range.setStart(targetNode, localOffset);
            range.setEnd(targetNode, localOffset);
            
            // 1. Try to select it (helps with focus)
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            
            // 2. Insert a visible anchor element to ensure robust scrolling
            const span = document.createElement('span');
            span.className = 'scroll-anchor-target';
            span.innerHTML = '&#8203;'; // Zero-width space
            span.style.display = 'inline-block';
            span.style.width = '0px';
            span.style.height = '1.2em'; // Match text height
            span.style.verticalAlign = 'text-bottom';
            
            range.insertNode(span);
            
            // 3. Scroll into view with a small timeout to ensure rendering
            setTimeout(() => {
                span.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                
                // Visual cue
                if (span.parentElement) {
                    const parent = span.parentElement;
                    const originalBg = parent.style.backgroundColor;
                    
                    parent.style.transition = 'background-color 0.2s ease-in';
                    parent.style.backgroundColor = 'rgba(255, 255, 0, 0.4)';
                    
                    setTimeout(() => {
                        parent.style.backgroundColor = originalBg;
                        
                        // Cleanup
                        if (span.parentNode) {
                            const p = span.parentNode;
                            span.remove();
                            p.normalize(); // Merge text nodes back
                        }
                    }, 1500);
                }
            }, 50);
            
        } catch (e) {
            console.error('Error scrolling to offset:', e);
            // Fallback
            if (targetNode.parentElement) {
                targetNode.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }
}

function drawLinkConnections() {
    // Check if links should be shown
    const showLinks = localStorage.getItem('map-show-links') !== 'false';
    
    // Remove existing SVG if any
    const existingSvg = document.getElementById('mapLinksSvg');
    if (existingSvg) existingSvg.remove();
    
    // Don't draw if disabled
    if (!showLinks) return;
    
    const allItems = [...notesManager.notes, ...notesManager.highlights];
    const itemsWithLinks = allItems.filter(item => item.links && item.links.length > 0);
    
    if (itemsWithLinks.length === 0) return;
    
    // Create SVG overlay
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'mapLinksSvg';
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '1';
    
    mapGrid.style.position = 'relative';
    mapGrid.appendChild(svg);
    
    const mapRect = mapGrid.getBoundingClientRect();
    
    // Draw connections
    itemsWithLinks.forEach(sourceItem => {
        sourceItem.links.forEach(targetId => {
            const targetItem = notesManager.getItemById(targetId);
            if (!targetItem) return;
            
            // Find the page cards
            const sourceCard = mapGrid.querySelector(`.page-card[data-page="${sourceItem.page}"]`);
            const targetCard = mapGrid.querySelector(`.page-card[data-page="${targetItem.page}"]`);
            
            if (!sourceCard || !targetCard) return;
            
            const sourceRect = sourceCard.getBoundingClientRect();
            const targetRect = targetCard.getBoundingClientRect();
            
            // Calculate center points relative to map grid
            const x1 = sourceRect.left + sourceRect.width / 2 - mapRect.left;
            const y1 = sourceRect.top + sourceRect.height / 2 - mapRect.top;
            const x2 = targetRect.left + targetRect.width / 2 - mapRect.left;
            const y2 = targetRect.top + targetRect.height / 2 - mapRect.top;
            
            // Create curved path
            const dx = x2 - x1;
            const dy = y2 - y1;
            const curve = Math.abs(dx) * 0.3;
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `M ${x1} ${y1} Q ${x1 + dx/2} ${y1 - curve}, ${x2} ${y2}`);
            path.setAttribute('stroke', '#2196F3');
            path.setAttribute('stroke-width', '2');
            path.setAttribute('fill', 'none');
            path.setAttribute('opacity', '0.6');
            path.setAttribute('stroke-dasharray', '5,5');
            
            // Add arrow marker
            const markerId = `arrow-${sourceItem.id}-${targetId}`;
            const defs = svg.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            if (!svg.querySelector('defs')) svg.appendChild(defs);
            
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', markerId);
            marker.setAttribute('markerWidth', '10');
            marker.setAttribute('markerHeight', '10');
            marker.setAttribute('refX', '9');
            marker.setAttribute('refY', '3');
            marker.setAttribute('orient', 'auto');
            marker.setAttribute('markerUnits', 'strokeWidth');
            
            const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            arrowPath.setAttribute('d', 'M0,0 L0,6 L9,3 z');
            arrowPath.setAttribute('fill', '#2196F3');
            arrowPath.setAttribute('opacity', '0.6');
            
            marker.appendChild(arrowPath);
            defs.appendChild(marker);
            
            path.setAttribute('marker-end', `url(#${markerId})`);
            
            svg.appendChild(path);
        });
    });
}

// Map Zoom
if (mapZoom) {
    mapZoom.addEventListener('input', (e) => {
        const size = e.target.value;
        mapZoomValue.textContent = `${size}px`;
        mapGrid.style.setProperty('--thumbnail-width', `${size}px`);
        // Redraw connections after resize (if enabled)
        setTimeout(() => {
            const showLinks = localStorage.getItem('map-show-links') !== 'false';
            if (showLinks) {
                drawLinkConnections();
            }
        }, 100);
    });
}

// Map Font Size
if (mapFontSize) {
    // Load saved font size
    const savedFontSize = localStorage.getItem('map-font-size') || '4';
    mapFontSize.value = savedFontSize;
    mapFontSizeValue.textContent = `${savedFontSize}px`;
    mapGrid.style.setProperty('--map-text-size', `${savedFontSize}px`);
    
    mapFontSize.addEventListener('input', (e) => {
        const size = e.target.value;
        mapFontSizeValue.textContent = `${size}px`;
        mapGrid.style.setProperty('--map-text-size', `${size}px`);
        localStorage.setItem('map-font-size', size);
    });
}

// Map Font Selection
const mapFontSelect = document.getElementById('mapFontSelect');
if (mapFontSelect) {
    // Load saved font
    const savedFont = localStorage.getItem('map-font-family');
    if (savedFont) {
        mapFontSelect.value = savedFont;
        mapGrid.style.fontFamily = savedFont;
    }

    mapFontSelect.addEventListener('change', (e) => {
        const font = e.target.value;
        mapGrid.style.fontFamily = font;
        localStorage.setItem('map-font-family', font);
    });
}

// Map Settings
if (mapSettingsBtn && mapSettingsPopup) {
    // Load saved settings
    const mapSettings = {
        textColor: localStorage.getItem('map-text-color') || '#ccc',
        textAlign: localStorage.getItem('map-text-align') || 'left',
        showHighlights: localStorage.getItem('map-show-highlights') !== 'false',
        showLinks: localStorage.getItem('map-show-links') !== 'false'
    };
    
    // Apply saved settings
    mapGrid.style.setProperty('--map-text-color', mapSettings.textColor);
    mapGrid.style.setProperty('--map-text-align', mapSettings.textAlign);
    if (mapShowHighlights) mapShowHighlights.checked = mapSettings.showHighlights;
    if (mapShowLinks) mapShowLinks.checked = mapSettings.showLinks;
    
    // Toggle popup
    mapSettingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        mapSettingsPopup.classList.toggle('hidden');
    });
    
    if (closeMapSettingsBtn) {
        closeMapSettingsBtn.addEventListener('click', () => {
            mapSettingsPopup.classList.add('hidden');
        });
    }
    
    // Close when clicking outside
    document.addEventListener('click', (e) => {
        if (mapSettingsPopup && !mapSettingsPopup.classList.contains('hidden') && 
            !mapSettingsPopup.contains(e.target) && !mapSettingsBtn.contains(e.target)) {
            mapSettingsPopup.classList.add('hidden');
        }
    });
    
    // Color buttons
    const colorBtns = mapSettingsPopup.querySelectorAll('.color-btn');
    colorBtns.forEach(btn => {
        if (btn.dataset.color === mapSettings.textColor) {
            btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
            colorBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const color = btn.dataset.color;
            mapGrid.style.setProperty('--map-text-color', color);
            localStorage.setItem('map-text-color', color);
        });
    });
    
    // Alignment buttons
    const alignBtns = mapSettingsPopup.querySelectorAll('.alignment-options .btn-option');
    alignBtns.forEach(btn => {
        if (btn.dataset.align === mapSettings.textAlign) {
            btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
            alignBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const align = btn.dataset.align;
            mapGrid.style.setProperty('--map-text-align', align);
            localStorage.setItem('map-text-align', align);
        });
    });
    
    // Show/Hide Highlights
    if (mapShowHighlights) {
        mapShowHighlights.addEventListener('change', (e) => {
            const show = e.target.checked;
            localStorage.setItem('map-show-highlights', show);
            
            const highlightOverlays = mapGrid.querySelectorAll('.highlight-overlay');
            highlightOverlays.forEach(overlay => {
                overlay.style.display = show ? 'flex' : 'none';
            });
        });
        
        // Apply initial state
        if (!mapSettings.showHighlights) {
            const highlightOverlays = mapGrid.querySelectorAll('.highlight-overlay');
            highlightOverlays.forEach(overlay => {
                overlay.style.display = 'none';
            });
        }
    }
    
    // Show/Hide Links
    if (mapShowLinks) {
        mapShowLinks.addEventListener('change', (e) => {
            const show = e.target.checked;
            localStorage.setItem('map-show-links', show);
            
            if (show) {
                // Redraw connections
                drawLinkConnections();
            } else {
                // Remove SVG
                const svg = document.getElementById('mapLinksSvg');
                if (svg) {
                    svg.remove();
                }
            }
        });
        
        // Apply initial state - hide SVG if disabled
        if (!mapSettings.showLinks) {
            const svg = document.getElementById('mapLinksSvg');
            if (svg) {
                svg.remove();
            }
        }
    }

    // POS Filter Listeners
    const mapPosIds = [
        'mapHighlightNouns', 'mapHighlightVerbs', 'mapHighlightAdj', 
        'mapHighlightAdv', 'mapHighlightPrep', 'mapHighlightConj', 
        'mapHighlightInterj', 'mapHighlightDet', 'mapHighlightPeople', 
        'mapHighlightPlaces'
    ];
    
    mapPosIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                renderMap().catch(err => console.error('Error rendering map:', err));
            });
        }
    });
}

// Redraw connections on scroll
if (mapGrid) {
    let scrollTimeout;
    mapGrid.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            const showLinks = localStorage.getItem('map-show-links') !== 'false';
            if (showLinks) {
                drawLinkConnections();
            }
        }, 50);
    });
}

// Go to page helper (exposed to window for onclick)
window.goToPage = function(pageNum, switchTab = true) {
    // Prevent navigation if user is selecting text
    if (window.getSelection().toString().trim().length > 0) {
        return;
    }

    // Update PDF Viewer
    pdfViewer.renderPage(pageNum);
    pdfViewer.currentPage = pageNum;
    pdfViewer.updateControls();
    
    // Switch to analyse view only if requested
    if (switchTab) {
        switchView('highlighted');
    }
    
    // Scroll to text anchor
    const isAnalyseView = document.getElementById('highlightedTextView').classList.contains('active');
    const anchorId = isAnalyseView ? `highlight-page-${pageNum}` : `text-page-${pageNum}`;
    const anchor = document.getElementById(anchorId);
    
    if (anchor) {
        setTimeout(() => {
             anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
};

// Highlight options change
// Handle "Select All" checkboxes
function setupSelectAllCheckbox(selectAllId, prefix) {
    const selectAllCheckbox = document.getElementById(selectAllId);
    if (!selectAllCheckbox) return;
    
    selectAllCheckbox.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        const checkboxes = document.querySelectorAll(`input[id^="${prefix}"]:not(#${selectAllId})`);
        
        checkboxes.forEach(cb => {
            cb.checked = isChecked;
        });
        
        // Trigger update based on which view
        if (prefix === 'translateHighlight') {
            if (translationState.lastAnalysis && translationState.currentLanguage) {
                applyTranslatedPOSHighlighting(translationState.currentLanguage);
            }
        } else if (prefix === 'mapHighlight') {
            if (document.getElementById('mapView').classList.contains('active')) {
                renderMap();
            }
        } else if (prefix === 'highlight') {
            if (currentAnalysis) {
                const rawText = getCleanRawText();
                const highlightedHtml = textAnalyzer.renderHighlightedText(
                    rawText,
                    currentAnalysis,
                    getHighlightOptions()
                );
                document.getElementById('highlightedTextContent').innerHTML = highlightedHtml;
                
                // Re-apply user highlights after POS rendering
                if (typeof notesManager !== 'undefined') {
                    setTimeout(() => notesManager.applyHighlights(), 50);
                }
            }
        }
    });
}

// Setup all three "Select All" checkboxes
setupSelectAllCheckbox('highlightSelectAll', 'highlight');
setupSelectAllCheckbox('mapHighlightSelectAll', 'mapHighlight');
setupSelectAllCheckbox('translateHighlightSelectAll', 'translateHighlight');

document.querySelectorAll('.highlight-options input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
        const id = e.target.id;
        
        // Skip if this is a "Select All" checkbox (already handled above)
        if (id.endsWith('SelectAll')) return;
        
        if (id.startsWith('translateHighlight')) {
            // Update Translate View
            if (translationState.lastAnalysis && translationState.currentLanguage) {
                // Re-apply highlighting (which includes rendering)
                applyTranslatedPOSHighlighting(translationState.currentLanguage);
            }
        } else if (id.startsWith('mapHighlight')) {
            // Update Map View
            // We need to trigger map re-render if map is active
            if (document.getElementById('mapView').classList.contains('active')) {
                renderMap();
            }
        } else {
            // Update Main Highlighted View
        if (currentAnalysis) {
                const rawText = getCleanRawText();
            const highlightedHtml = textAnalyzer.renderHighlightedText(
                rawText,
                currentAnalysis,
                getHighlightOptions()
            );
            document.getElementById('highlightedTextContent').innerHTML = highlightedHtml;
            
            // Re-apply user highlights after POS rendering
            if (typeof notesManager !== 'undefined') {
                setTimeout(() => notesManager.applyHighlights(), 50);
            }
            }
        }
    });
});

// Expose updateHighlighting globally for mobile
window.updateHighlighting = function() {
    if (currentAnalysis) {
        const rawText = getCleanRawText();
        const highlightedHtml = textAnalyzer.renderHighlightedText(
            rawText,
            currentAnalysis,
            getHighlightOptions()
        );
        const highlightedContent = document.getElementById('highlightedTextContent');
        if (highlightedContent) {
            highlightedContent.innerHTML = highlightedHtml;
        }
        
        // Re-apply user highlights after POS rendering
        if (typeof notesManager !== 'undefined') {
            setTimeout(() => notesManager.applyHighlights(), 50);
        }
    }
};

function getCleanRawText() {
    let text = '';
    
    // Try PDF viewer first for PDF files
    if (currentFileType === 'pdf' && typeof pdfViewer !== 'undefined' && pdfViewer.totalPages > 0) {
        for (let i = 1; i <= pdfViewer.totalPages; i++) {
            text += (pdfViewer.getPageText(i) || '') + '\n\n';
        }
        if (text && text.trim().length > 0) {
            console.log(`Extracted ${text.length} characters from PDF viewer`);
            return text;
        }
        console.warn('PDF viewer returned no text, falling back to DOM');
    }
    
    // Fallback for all file types: read from rawTextContent DOM element
    const content = document.getElementById('rawTextContent');
    if (content) {
        text = content.textContent || content.innerText || '';
        
        // Remove page markers and clean up
        text = text.replace(/---\s*Page\s+\d+\s*---/g, '').trim();
        
        console.log(`Extracted ${text.length} characters from rawTextContent DOM (file type: ${currentFileType})`);
        
        if (!text || text.length < 10) {
            console.error('Text extraction failed or too short. rawTextContent HTML:', content.innerHTML.substring(0, 200));
        }
        
        return text;
    }
    
    console.error('No text source available for extraction - rawTextContent element not found');
    return '';
}

function getHighlightOptions() {
    // Defensive: Check if elements exist (for mobile compatibility)
    const getChecked = (id) => {
        const el = document.getElementById(id);
        return el ? el.checked : false;
    };
    
    return {
        nouns: getChecked('highlightNouns'),
        verbs: getChecked('highlightVerbs'),
        adjectives: getChecked('highlightAdj'),
        adverbs: getChecked('highlightAdv'),
        prepositions: getChecked('highlightPrep'),
        conjunctions: getChecked('highlightConj'),
        interjections: getChecked('highlightInterj'),
        determiners: getChecked('highlightDet'),
        people: getChecked('highlightPeople'),
        places: getChecked('highlightPlaces'),
        abbreviations: getChecked('highlightAbbr'),
        acronyms: getChecked('highlightAcronyms'),
        numbers: getChecked('highlightNumbers'),
        currencies: getChecked('highlightCurrencies'),
        dates: getChecked('highlightDates'),
        crypto: getChecked('highlightCrypto'),
        currencyPairs: getChecked('highlightCurrencyPairs'),
        currencySymbols: getChecked('highlightCurrencySymbols')
    };
}

function updatePOSCounts(analysis) {
    // Defensive: Check if elements exist (for mobile compatibility)
    const updateCount = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };
    
    // Update POS counts
    updateCount('countNouns', analysis.pos.nouns.length);
    updateCount('countVerbs', analysis.pos.verbs.length);
    updateCount('countAdj', analysis.pos.adjectives.length);
    updateCount('countAdv', analysis.pos.adverbs.length);
    updateCount('countPrep', analysis.pos.prepositions.length);
    updateCount('countConj', analysis.pos.conjunctions.length);
    updateCount('countInterj', analysis.pos.interjections.length);
    updateCount('countDet', analysis.pos.determiners.length);
    
    // Update entity counts
    updateCount('countPeople', analysis.entities.people.length);
    updateCount('countPlaces', analysis.entities.places.length);
    updateCount('countAbbr', analysis.entities.abbreviations?.length || 0);
    updateCount('countAcronyms', analysis.entities.acronyms?.length || 0);
    updateCount('countNumbers', analysis.entities.numbers?.length || 0);
    updateCount('countCurrencies', analysis.entities.currencies?.length || 0);
    updateCount('countDates', analysis.entities.dates?.length || 0);
    updateCount('countCrypto', analysis.entities.crypto?.length || 0);
    updateCount('countCurrencyPairs', analysis.entities.currencyPairs?.length || 0);
    updateCount('countCurrencySymbols', analysis.entities.currencySymbols?.length || 0);

    // Update Map Tab counts
    updateCount('mapCountNouns', analysis.pos.nouns.length);
    updateCount('mapCountVerbs', analysis.pos.verbs.length);
    updateCount('mapCountAdj', analysis.pos.adjectives.length);
    updateCount('mapCountAdv', analysis.pos.adverbs.length);
    updateCount('mapCountPrep', analysis.pos.prepositions.length);
    updateCount('mapCountConj', analysis.pos.conjunctions.length);
    updateCount('mapCountInterj', analysis.pos.interjections.length);
    updateCount('mapCountDet', analysis.pos.determiners.length);
    updateCount('mapCountPeople', analysis.entities.people.length);
    updateCount('mapCountPlaces', analysis.entities.places.length);
    updateCount('mapCountAbbr', analysis.entities.abbreviations?.length || 0);
    updateCount('mapCountAcronyms', analysis.entities.acronyms?.length || 0);
    updateCount('mapCountNumbers', analysis.entities.numbers?.length || 0);
    updateCount('mapCountCurrencies', analysis.entities.currencies?.length || 0);
    updateCount('mapCountDates', analysis.entities.dates?.length || 0);
    updateCount('mapCountCrypto', analysis.entities.crypto?.length || 0);
    updateCount('mapCountCurrencyPairs', analysis.entities.currencyPairs?.length || 0);
    updateCount('mapCountCurrencySymbols', analysis.entities.currencySymbols?.length || 0);
}

function resetPOSCounts() {
    const counts = [
        'countNouns', 'countVerbs', 'countAdj', 'countAdv', 
        'countPrep', 'countConj', 'countInterj', 'countDet',
        'countPeople', 'countPlaces',
        'countAbbr', 'countAcronyms', 'countNumbers', 'countCurrencies', 
        'countDates', 'countCrypto', 'countCurrencyPairs', 'countCurrencySymbols',
        
        'mapCountNouns', 'mapCountVerbs', 'mapCountAdj', 'mapCountAdv',
        'mapCountPrep', 'mapCountConj', 'mapCountInterj', 'mapCountDet',
        'mapCountPeople', 'mapCountPlaces',
        'mapCountAbbr', 'mapCountAcronyms', 'mapCountNumbers', 'mapCountCurrencies', 
        'mapCountDates', 'mapCountCrypto', 'mapCountCurrencyPairs', 'mapCountCurrencySymbols'
    ];
    counts.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '-';
    });
}

// Utility Functions
function showLoading(message = 'Processing...', indeterminate = false) {
    loadingMessage.textContent = message;
    loadingOverlay.classList.remove('hidden');
    
    if (progressBar) {
        if (indeterminate) {
            progressBar.classList.add('indeterminate');
            progressBar.style.width = '100%';
        } else {
            progressBar.classList.remove('indeterminate');
            progressBar.style.width = '0%';
        }
        progressBar.parentElement.style.display = 'block';
    }
}

// Library Panel Resizer
function setupLibraryResizer() {
    const libraryPanel = document.getElementById('libraryPanel');
    const libraryResizer = document.getElementById('libraryResizer');
    
    if (!libraryPanel || !libraryResizer) return;
    
    let isResizing = false;
    
    libraryResizer.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        
        const newWidth = e.clientX;
        if (newWidth >= 200 && newWidth <= 500) {
            libraryPanel.style.width = newWidth + 'px';
        }
    });
    
    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
    });
}

// Open file from library
window.openFileFromLibrary = async function(filePath) {
    try {
        // Determine file type from extension
        const ext = filePath.split('.').pop().toLowerCase();
        let fileType = 'pdf';
        if (ext === 'epub') fileType = 'epub';
        else if (ext === 'docx' || ext === 'doc') fileType = 'docx';
        else if (ext === 'md') fileType = 'md';
        else if (ext === 'txt') fileType = 'txt';
        
        currentFilePath = filePath;
        currentFileName = filePath.split(/[\\/]/).pop();
        currentFileType = fileType;
        fileNameDisplay.textContent = currentFileName;
        
        // Update last opened in library
        if (typeof libraryManager !== 'undefined') {
            libraryManager.updateFileLastOpened(filePath);
        }
        
        // Load the file
        if (fileType === 'pdf') {
            await loadPDFFile(filePath);
        } else if (fileType === 'epub') {
            await loadEPUBFile(filePath);
        } else if (fileType === 'docx') {
            await loadDOCXFile(filePath);
        } else if (fileType === 'md') {
            await loadMarkdownFile(filePath);
        } else if (fileType === 'txt') {
            await loadTxtFile(filePath);
        }
    } catch (error) {
        console.error('Error opening file from library:', error);
        setStatus('❌ Error: ' + error.message);
        hideLoading();
    }
};

// Open file in new tab from library (or switch to existing tab)
window.openFileInNewTab = async function(filePath) {
    try {
        // Determine file type from extension
        const ext = filePath.split('.').pop().toLowerCase();
        let fileType = 'pdf';
        if (ext === 'epub') fileType = 'epub';
        else if (ext === 'docx' || ext === 'doc') fileType = 'docx';
        
        const fileName = filePath.split(/[\\/]/).pop();
        
        // Update last opened in library
        if (typeof libraryManager !== 'undefined') {
            libraryManager.updateFileLastOpened(filePath);
        }
        
        // Check if file is already open in a tab
        if (typeof tabManager !== 'undefined') {
            const existingTab = tabManager.tabs.find(t => t.filePath === filePath);
            
            if (existingTab) {
                // File is already open - just switch to that tab
                console.log('File already open in tab, switching to it:', filePath);
                tabManager.switchTab(filePath);
                return;
            }
            
            // File not open yet - add new tab
            tabManager.addTab(filePath, fileName, fileType);
        }
        
        // Then load the file
        currentFilePath = filePath;
        currentFileName = fileName;
        currentFileType = fileType;
        fileNameDisplay.textContent = currentFileName;
        
        if (fileType === 'pdf') {
            await loadPDFFile(filePath);
        } else if (fileType === 'epub') {
            await loadEPUBFile(filePath);
        } else if (fileType === 'docx') {
            await loadDOCXFile(filePath);
        }
    } catch (error) {
        console.error('Error opening file in new tab:', error);
        setStatus('❌ Error: ' + error.message);
        hideLoading();
    }
};

function hideLoading() {
    loadingOverlay.classList.add('hidden');
    if (progressBar) {
        progressBar.style.width = '0%';
        progressBar.classList.remove('indeterminate');
    }
}

function setStatus(message) {
    statusMessage.textContent = message;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Toggle Stats Panel via Tab
if (showStatsTabBtn) {
    showStatsTabBtn.addEventListener('click', () => {
        const isVisible = window.getComputedStyle(statsPanelEl).display !== 'none';
        
        if (isVisible) {
            // Hide
            statsPanelEl.style.display = 'none';
            if (resizer2) resizer2.style.display = 'none';
            if (resizer3) resizer3.style.display = 'none';
            showStatsTabBtn.classList.remove('active');
        } else {
            // Show
            statsPanelEl.style.display = '';
            if (window.getComputedStyle(statsPanelEl).display === 'none') {
                statsPanelEl.style.display = 'flex';
            }
            if (resizer2) resizer2.style.display = '';
            if (resizer3) resizer3.style.display = '';
            showStatsTabBtn.classList.add('active');
        }
    });
    
    // Initialize active state based on initial visibility
    // Use setTimeout to allow CSS to apply
    setTimeout(() => {
        if (window.getComputedStyle(statsPanelEl).display !== 'none') {
            showStatsTabBtn.classList.add('active');
        }
    }, 100);
}

// Expand Library Panel (collapse is handled in library-ui.js)
if (expandLibraryBtn && libraryPanel) {
    expandLibraryBtn.addEventListener('click', () => {
        libraryPanel.style.display = '';
        if (window.getComputedStyle(libraryPanel).display === 'none') {
            libraryPanel.style.display = 'flex';
        }
        if (libraryResizer) libraryResizer.style.display = '';
        expandLibraryBtn.classList.add('hidden');
    });
}

// Collapse/Expand Document Viewer Panel
if (collapseViewerBtn && expandViewerBtn && pdfPanel) {
    collapseViewerBtn.addEventListener('click', () => {
        pdfPanel.style.display = 'none';
        if (resizer1) resizer1.style.display = 'none';
        expandViewerBtn.classList.remove('hidden');
        
        // Position the expand button on the far left side
        expandViewerBtn.style.left = '0px';
        expandViewerBtn.style.right = 'auto';
        expandViewerBtn.style.borderRadius = '0 8px 8px 0'; // Border radius for left side
    });
    
    expandViewerBtn.addEventListener('click', () => {
        pdfPanel.style.display = '';
        if (window.getComputedStyle(pdfPanel).display === 'none') {
            pdfPanel.style.display = 'flex';
        }
        if (resizer1) resizer1.style.display = '';
        expandViewerBtn.classList.add('hidden');
    });
}

// Collapse/Expand Extracted Text Panel
if (collapseTextBtn && expandTextBtn && textPanel) {
    collapseTextBtn.addEventListener('click', () => {
        textPanel.style.display = 'none';
        if (resizer2) resizer2.style.display = 'none';
        expandTextBtn.classList.remove('hidden');
        
        // Position the expand button on the far right of the window
        expandTextBtn.style.right = '0px';
        expandTextBtn.style.left = 'auto';
        expandTextBtn.style.borderRadius = '8px 0 0 8px'; // Reversed border radius for right side
    });
    
    expandTextBtn.addEventListener('click', () => {
        textPanel.style.display = '';
        if (window.getComputedStyle(textPanel).display === 'none') {
            textPanel.style.display = 'flex';
        }
        if (resizer2) resizer2.style.display = '';
        expandTextBtn.classList.add('hidden');
    });
}

// Collapse/Expand Statistics Panel
if (collapseStatsBtn && expandStatsBtn && statsPanelEl) {
    collapseStatsBtn.addEventListener('click', () => {
        statsPanelEl.style.display = 'none';
        if (resizer2) resizer2.style.display = 'none';
        if (resizer3) resizer3.style.display = 'none';
        expandStatsBtn.classList.remove('hidden');
        
        // Position the expand button on the far right of the window
        expandStatsBtn.style.right = '0px';
        expandStatsBtn.style.left = 'auto';
        expandStatsBtn.style.borderRadius = '8px 0 0 8px'; // Reversed border radius for right side
    });
    
    expandStatsBtn.addEventListener('click', () => {
        statsPanelEl.style.display = '';
        if (window.getComputedStyle(statsPanelEl).display === 'none') {
            statsPanelEl.style.display = 'flex';
        }
        if (resizer2) resizer2.style.display = '';
        if (resizer3) resizer3.style.display = '';
        expandStatsBtn.classList.add('hidden');
    });
}

// Resize Logic
if (resizer1) {
    resizer1.addEventListener('mousedown', (e) => initResize(e, pdfPanel, 1));
}

if (resizer2) {
    resizer2.addEventListener('mousedown', (e) => initResize(e, statsPanelEl, -1));
}

if (resizer3) {
    resizer3.addEventListener('mousedown', (e) => initResize(e, statsPanelEl, 1));
}

function initResize(e, targetPanel, direction) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = targetPanel.getBoundingClientRect().width;
    
    const onMouseMove = (e) => {
        // direction: 1 for dragging right increasing width, -1 for dragging right decreasing width
        const dx = (e.clientX - startX) * direction;
        let newWidth = startWidth + dx;
        
        // Apply min and max width constraints
        if (targetPanel === statsPanelEl) {
            newWidth = Math.max(250, Math.min(800, newWidth)); // Stats panel: 250px to 800px
        } else {
            newWidth = Math.max(200, newWidth); // Other panels: min 200px
        }
        
        // Update flex-basis
        targetPanel.style.flex = `0 0 ${newWidth}px`;
        targetPanel.style.width = `${newWidth}px`;
    };
    
    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
}

console.log('Renderer script loaded');

// Initialize UI
function updateSyncUI() {
    if (driveSync.isAuthenticated()) {
        syncStatusText.textContent = '✅ Connected to Google Drive';
        syncStatusText.style.color = 'green';
        gdriveLoginBtn.classList.add('hidden');
        gdriveLogoutBtn.classList.remove('hidden');
        syncActions.classList.remove('hidden');
        
        const lastSync = localStorage.getItem('gdrive_last_sync');
        lastSyncTime.textContent = lastSync ? `Last synced: ${new Date(lastSync).toLocaleString()}` : '';
    } else {
        syncStatusText.textContent = 'Not connected';
        syncStatusText.style.color = '#666';
        gdriveLoginBtn.classList.remove('hidden');
        gdriveLogoutBtn.classList.add('hidden');
        syncActions.classList.add('hidden');
    }
}

if (syncDriveBtn) {
    syncDriveBtn.addEventListener('click', () => {
        updateSyncUI();
        syncDialog.classList.remove('hidden');
    });
}

if (closeSyncDialog) {
    closeSyncDialog.addEventListener('click', () => {
        syncDialog.classList.add('hidden');
    });
}

// Setup guide link handler
const setupGuideLink = document.getElementById('setupGuideLink');
if (setupGuideLink) {
    setupGuideLink.addEventListener('click', (e) => {
        e.preventDefault();
        const { shell } = require('electron');
        const path = require('path');
        const guidePath = path.join(__dirname, '..', 'GOOGLE_DRIVE_SETUP.md');
        shell.openPath(guidePath).catch(() => {
            // Fallback: show alert with instructions
            alert('Setup Guide Location:\n\n' + guidePath + '\n\nThe guide contains step-by-step instructions for setting up Google Drive OAuth credentials.');
        });
    });
}

if (gdriveLoginBtn) {
    gdriveLoginBtn.addEventListener('click', async () => {
        try {
            gdriveLoginBtn.disabled = true;
            gdriveLoginBtn.textContent = 'Connecting...';
            
            const success = await driveSync.login();
            if (success) {
                updateSyncUI();
            } else {
                alert('Login failed');
            }
        } catch (error) {
            console.error(error);
            alert('Error connecting: ' + error.message);
        } finally {
            gdriveLoginBtn.disabled = false;
            gdriveLoginBtn.textContent = 'Connect Google Drive';
        }
    });
}

if (gdriveLogoutBtn) {
    gdriveLogoutBtn.addEventListener('click', async () => {
        await driveSync.logout();
        updateSyncUI();
    });
}

// Helper: Perform Sync to Drive
async function performSyncToDrive(uploadDoc = true) {
    try {
        // 1. Collect Data
        const appData = {
            notes: notesManager.notes,
            highlights: notesManager.highlights,
            figures: (typeof figuresManager !== 'undefined') ? figuresManager.figures : [],
            recentFiles: recentFilesManager.recentFiles,
            settings: {
                text: textSettingsManager.settings
            },
            timestamp: Date.now()
        };
        
        // 2. Upload Document if requested
        if (uploadDoc && currentFilePath) {
            let mimeType = 'application/pdf';
            if (currentFileType === 'epub') mimeType = 'application/epub+zip';
            if (currentFileType === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            
            const docResult = await driveSync.uploadDocument(currentFilePath, currentFileName, mimeType);
            const docId = docResult.id || docResult;
            
            // Update recent files with driveId
            const currentFile = recentFilesManager.recentFiles.find(f => f.path === currentFilePath);
            if (currentFile) {
                currentFile.driveId = docId;
                recentFilesManager.saveToStorage();
                appData.recentFiles = recentFilesManager.recentFiles;
            }
        }
        
        // 3. Upload JSON
        await driveSync.uploadJson('grammar-highlighter-data.json', appData);
        
        localStorage.setItem('gdrive_last_sync', new Date().toISOString());
        updateSyncUI();
        return true;
    } catch (error) {
        console.error('Sync error:', error);
        throw error;
    }
}

if (syncUploadBtn) {
    syncUploadBtn.addEventListener('click', async () => {
        try {
            syncUploadBtn.disabled = true;
            syncUploadBtn.textContent = 'Uploading...';
            
            await performSyncToDrive(syncDocumentsCheck.checked);
            
            alert('Sync Complete!');
        } catch (error) {
            console.error(error);
            alert('Upload failed: ' + error.message);
        } finally {
            syncUploadBtn.disabled = false;
            syncUploadBtn.textContent = '⬆️ Upload to Drive';
        }
    });
}

// Library Structure Sync Handlers
if (syncLibraryUploadBtn) {
    syncLibraryUploadBtn.addEventListener('click', async () => {
        try {
            if (typeof libraryManager === 'undefined') {
                alert('Library manager not available');
                return;
            }
            
            const confirmMsg = 'This will backup your entire library structure (folders and files) to Google Drive.\n\n' +
                              'This may take some time depending on the number of files.\n\n' +
                              'Continue?';
            
            if (!confirm(confirmMsg)) return;
            
            syncLibraryUploadBtn.disabled = true;
            syncLibraryUploadBtn.textContent = 'Backing up...';
            librarySyncProgress.classList.remove('hidden');
            librarySyncStatus.textContent = 'Starting complete backup...';
            librarySyncProgressBar.style.width = '0%';
            
            const library = libraryManager.library;
            
            // Gather all notes from localStorage
            const allNotes = {};
            if (typeof notesManager !== 'undefined') {
                Object.keys(library.files || {}).forEach(filePath => {
                    const notes = notesManager.loadNotesForFileSync(filePath);
                    if (notes && notes.length > 0) {
                        allNotes[filePath] = notes;
                    }
                });
            }
            
            // Gather all analysis cache from localStorage
            const allAnalysis = {};
            if (typeof analysisCache !== 'undefined') {
                Object.keys(library.files || {}).forEach(filePath => {
                    const cachedData = analysisCache.loadAnalysis(filePath);
                    if (cachedData) {
                        allAnalysis[filePath] = cachedData;
                    }
                });
            }
            
            const result = await driveSync.syncLibraryStructure(library, allNotes, allAnalysis, (current, total, message) => {
                librarySyncStatus.textContent = message;
                const percent = (current / total) * 100;
                librarySyncProgressBar.style.width = `${percent}%`;
            });
            
            librarySyncProgress.classList.add('hidden');
            
            let message = `✅ Complete Backup Successful!\n\n`;
            message += `📁 Folders: ${result.foldersCreated}\n`;
            message += `📄 Files: ${result.filesUploaded}\n`;
            message += `📝 Notes & Highlights: ${result.notesBackedUp} files\n`;
            message += `🧠 Analysis Cache: ${result.analysisBackedUp} files\n`;
            
            if (result.filesSkipped > 0) {
                message += `\n⏭️ Files skipped (already exist): ${result.filesSkipped}\n`;
            }
            
            if (result.errors.length > 0) {
                message += `\n⚠️ Errors: ${result.errors.length}\n`;
                message += result.errors.slice(0, 5).join('\n');
                if (result.errors.length > 5) {
                    message += `\n... and ${result.errors.length - 5} more`;
                }
            }
            
            alert(message);
            localStorage.setItem('gdrive_last_library_sync', new Date().toISOString());
            
        } catch (error) {
            console.error('Library sync error:', error);
            alert('Library backup failed: ' + error.message);
        } finally {
            syncLibraryUploadBtn.disabled = false;
            syncLibraryUploadBtn.textContent = '📤 Backup Library to Drive';
            librarySyncProgress.classList.add('hidden');
        }
    });
}

if (syncLibraryDownloadBtn) {
    syncLibraryDownloadBtn.addEventListener('click', async () => {
        try {
            if (typeof libraryManager === 'undefined') {
                alert('Library manager not available');
                return;
            }
            
            const confirmMsg = 'This will restore your library structure from Google Drive.\n\n' +
                              '⚠️ Warning: This will merge with your current library.\n' +
                              'Files with the same name will not be duplicated.\n\n' +
                              'Continue?';
            
            if (!confirm(confirmMsg)) return;
            
            syncLibraryDownloadBtn.disabled = true;
            syncLibraryDownloadBtn.textContent = 'Restoring...';
            librarySyncProgress.classList.remove('hidden');
            librarySyncStatus.textContent = 'Downloading complete backup...';
            librarySyncProgressBar.style.width = '25%';
            
            const data = await driveSync.downloadCompleteBackup();
            
            if (!data || !data.library) {
                alert('No library backup found in Google Drive.\n\nPlease backup your library first using "Backup Library to Drive".');
                librarySyncProgress.classList.add('hidden');
                return;
            }
            
            librarySyncStatus.textContent = 'Restoring library structure...';
            librarySyncProgressBar.style.width = '40%';
            
            // Merge the library structure
            const currentLibrary = libraryManager.library;
            const downloadedLibrary = data.library;
            
            // Merge folders
            Object.keys(downloadedLibrary.folders || {}).forEach(folderId => {
                if (!currentLibrary.folders[folderId]) {
                    currentLibrary.folders[folderId] = downloadedLibrary.folders[folderId];
                }
            });
            
            // Merge files
            Object.keys(downloadedLibrary.files || {}).forEach(filePath => {
                if (!currentLibrary.files[filePath]) {
                    currentLibrary.files[filePath] = downloadedLibrary.files[filePath];
                }
            });
            
            libraryManager.library = currentLibrary;
            libraryManager.saveLibrary();
            
            librarySyncStatus.textContent = 'Restoring notes and highlights...';
            librarySyncProgressBar.style.width = '60%';
            
            // Restore notes
            let notesRestored = 0;
            if (data.notes && typeof notesManager !== 'undefined') {
                const currentNotes = notesManager.loadFromStorage();
                Object.keys(data.notes).forEach(filePath => {
                    // Merge notes (don't overwrite existing)
                    if (!currentNotes[filePath]) {
                        currentNotes[filePath] = data.notes[filePath];
                        notesRestored++;
                    }
                });
                localStorage.setItem(notesManager.storageKey, JSON.stringify(currentNotes));
            }
            
            librarySyncStatus.textContent = 'Restoring analysis cache...';
            librarySyncProgressBar.style.width = '80%';
            
            // Restore analysis cache
            let analysisRestored = 0;
            if (data.analysis && typeof analysisCache !== 'undefined') {
                Object.keys(data.analysis).forEach(filePath => {
                    const existing = analysisCache.loadAnalysis(filePath);
                    if (!existing) {
                        analysisCache.saveAnalysis(filePath, data.analysis[filePath]);
                        analysisRestored++;
                    }
                });
            }
            
            librarySyncStatus.textContent = 'Complete!';
            librarySyncProgressBar.style.width = '100%';
            
            setTimeout(() => {
                librarySyncProgress.classList.add('hidden');
            }, 1000);
            
            if (typeof libraryUI !== 'undefined') {
                libraryUI.render();
            }
            
            const syncDate = data.syncDate ? new Date(data.syncDate).toLocaleString() : 'Unknown';
            const stats = data.stats || {};
            
            let message = `✅ Complete Backup Restored!\n\n`;
            message += `📅 Backup Date: ${syncDate}\n\n`;
            message += `📁 Folders: ${stats.folders || 'N/A'}\n`;
            message += `📄 Files: ${stats.files || 'N/A'}\n`;
            message += `📝 Notes & Highlights: ${notesRestored} files restored\n`;
            message += `🧠 Analysis Cache: ${analysisRestored} files restored\n\n`;
            message += `Your complete library has been restored!`;
            
            alert(message);
            
        } catch (error) {
            console.error('Library restore error:', error);
            alert('Library restore failed: ' + error.message);
        } finally {
            syncLibraryDownloadBtn.disabled = false;
            syncLibraryDownloadBtn.textContent = '📥 Restore from Drive';
            librarySyncProgress.classList.add('hidden');
        }
    });
}

if (syncDownloadBtn) {
    syncDownloadBtn.addEventListener('click', async () => {
        try {
            syncDownloadBtn.disabled = true;
            syncDownloadBtn.textContent = 'Downloading...';
            
            const data = await driveSync.downloadJson('grammar-highlighter-data.json');
            
            if (data) {
                // Restore Data
                if (data.notes) notesManager.notes = data.notes;
                if (data.highlights) notesManager.highlights = data.highlights;
                if (data.figures && typeof figuresManager !== 'undefined') figuresManager.figures = data.figures;
                if (data.recentFiles) {
                    recentFilesManager.recentFiles = data.recentFiles;
                    recentFilesManager.saveToStorage();
                }
                
                // Save to local storage
                notesManager.saveNotes();
                if (typeof figuresManager !== 'undefined') figuresManager.saveFigures();
                
                // Update UI if relevant
                recentFilesManager.render();
                if (currentFilePath) notesManager.loadNotesForFile(currentFilePath);
                
                localStorage.setItem('gdrive_last_sync', new Date().toISOString());
                updateSyncUI();
                alert('Data downloaded and restored successfully!');
            } else {
                alert('No sync data found on Drive.');
            }
        } catch (error) {
            console.error(error);
            alert('Download failed: ' + error.message);
        } finally {
            syncDownloadBtn.disabled = false;
            syncDownloadBtn.textContent = '⬇️ Download from Drive';
        }
    });
}

// Initialize Text Settings
const textSettingsManager = new TextSettingsManager();

// Map Search Navigation Listeners
const prevOccBtn = document.getElementById('prevOccurrenceBtn');
const nextOccBtn = document.getElementById('nextOccurrenceBtn');
const closeNavBtn = document.getElementById('closeNavBtn');

if (prevOccBtn) {
    prevOccBtn.addEventListener('click', (e) => {
        // Only act if Map View is active AND we have map matches
        if (document.getElementById('mapView').classList.contains('active') && mapSearchMatches.length > 0) {
            if (currentMapMatchIndex > 0) {
                mapSearchMatches[currentMapMatchIndex].style.outline = 'none';
                currentMapMatchIndex--;
                updateMapNav();
            } else {
                // Wrap around
                mapSearchMatches[currentMapMatchIndex].style.outline = 'none';
                currentMapMatchIndex = mapSearchMatches.length - 1;
                updateMapNav();
            }
        }
    });
}

if (nextOccBtn) {
    nextOccBtn.addEventListener('click', (e) => {
         if (document.getElementById('mapView').classList.contains('active') && mapSearchMatches.length > 0) {
            if (currentMapMatchIndex < mapSearchMatches.length - 1) {
                mapSearchMatches[currentMapMatchIndex].style.outline = 'none';
                currentMapMatchIndex++;
                updateMapNav();
            } else {
                mapSearchMatches[currentMapMatchIndex].style.outline = 'none';
                currentMapMatchIndex = 0;
                updateMapNav();
            }
        }
    });
}

if (closeNavBtn) {
    closeNavBtn.addEventListener('click', (e) => {
        if (document.getElementById('mapView').classList.contains('active')) {
             // Clear map highlights
             mapSearchMatches.forEach(m => m.style.outline = 'none');
             mapSearchMatches = [];
             
             // Hide bar
             const navBar = document.getElementById('wordNavBar');
             if (navBar) navBar.classList.add('hidden');
             
             // Re-render map without filter to remove highlights
             renderMap(null);
        }
    });
}

const navOccurrenceInput = document.getElementById('navOccurrenceInput');
if (navOccurrenceInput) {
    navOccurrenceInput.addEventListener('change', (e) => {
        // Only process if Map View is active
        if (document.getElementById('mapView').classList.contains('active') && mapSearchMatches.length > 0) {
            let val = parseInt(e.target.value);
            if (isNaN(val) || val < 1) val = 1;
            if (val > mapSearchMatches.length) val = mapSearchMatches.length;
            
            currentMapMatchIndex = val - 1;
            updateMapNav();
        }
    });
    
    navOccurrenceInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.target.blur();
        }
    });
}

// Initialize Context Menu for Map Grid
if (typeof notesManager !== 'undefined' && typeof mapGrid !== 'undefined' && mapGrid) {
    notesManager.setupContextMenu(mapGrid);
}

// Continuous Mode for Map View
if (typeof mapGrid !== 'undefined' && mapGrid) {
    mapGrid.addEventListener('mouseup', (e) => {
        if (typeof notesManager !== 'undefined' && notesManager.isContinuousMode) {
            const selection = window.getSelection();
            const text = selection.toString().trim();
            
            // Check if selection is within mapGrid and not empty
            if (text && mapGrid.contains(selection.anchorNode)) {
                window.justHighlightedMap = true;
                setTimeout(() => window.justHighlightedMap = false, 200);
                
                notesManager.selectedText = text;
                notesManager.highlightSelectionFromContext();
                
                // Refresh Map to show new highlight
                setTimeout(() => {
                    renderMap().catch(err => console.error('Error rendering map:', err));
                }, 50);
            }
        }
    });
}

// Listen for Notes/Highlights changes to refresh Map
document.addEventListener('notes-updated', () => {
    const mapView = document.getElementById('mapView');
    if (mapView && mapView.classList.contains('active')) {
        // Use debounced version to prevent lag when adding multiple highlights
        if (renderMapDebounced) {
            renderMapDebounced();
        } else {
            renderMap().catch(err => console.error('Error rendering map:', err));
        }
    }
});


// Menu Bar Event Listeners
ipcRenderer.on('menu-open-file', () => {
    // Trigger the open file dialog logic
    if (openFileBtn) {
        openFileBtn.click();
    } else {
        // If button is removed/hidden, invoke directly
        // But we need the logic that follows.
        // For now, we assume button exists (hidden)
    }
});

ipcRenderer.on('menu-sync-drive', () => {
    if (syncDriveBtn) {
        syncDriveBtn.click();
    }
});

// Folder import function
async function importFolderWithSubdirectories() {
    try {
        showLoading('Opening folder...');
        
        // Open folder dialog
        const result = await ipcRenderer.invoke('open-folder-dialog');
        
        if (!result.canceled) {
            const folderPath = result.folderPath;
            const folderName = result.folderName;
            
            setStatus(`Scanning folder: ${folderName}...`);
            
            // Scan folder for supported files
            const scanResult = await ipcRenderer.invoke('scan-folder', folderPath);
            
            if (scanResult.success && scanResult.files.length > 0) {
                setStatus(`Found ${scanResult.totalFiles} files. Importing...`);
                
                // Import folder into library
                if (typeof libraryManager !== 'undefined') {
                    const importResult = libraryManager.importFolder(
                        folderName,
                        scanResult.files,
                        'root'
                    );
                    
                    if (importResult.success) {
                        hideLoading();
                        
                        // Show success message
                        let message = `✅ Successfully imported folder "${folderName}"!\n\n`;
                        message += `📁 Folders created: ${importResult.foldersCreated}\n`;
                        message += `📄 Files imported: ${importResult.filesImported}`;
                        
                        if (importResult.filesSkipped > 0) {
                            message += `\n⚠️ Files skipped: ${importResult.filesSkipped}`;
                        }
                        
                        alert(message);
                        setStatus(`✅ Imported ${importResult.filesImported} files from "${folderName}"`);
                        
                        // Refresh library UI
                        if (typeof libraryUI !== 'undefined') {
                            libraryUI.render();
                        }
                    } else {
                        hideLoading();
                        alert('Failed to import folder. Please try again.');
                        setStatus('❌ Import failed');
                    }
                } else {
                    hideLoading();
                    alert('Library manager not available.');
                    setStatus('❌ Import failed');
                }
            } else if (scanResult.success && scanResult.files.length === 0) {
                hideLoading();
                alert(`No supported files found in "${folderName}".\n\nSupported formats: PDF, EPUB, DOCX, Markdown`);
                setStatus('No files found');
            } else {
                hideLoading();
                alert(`Error scanning folder: ${scanResult.error}`);
                setStatus('❌ Scan failed');
            }
        } else {
            hideLoading();
            setStatus('Folder import cancelled');
        }
    } catch (error) {
        console.error('Error importing folder:', error);
        hideLoading();
        alert(`Error importing folder: ${error.message}`);
        setStatus('❌ Error importing folder');
    }
}

// Expose globally for library UI
window.triggerFolderImport = importFolderWithSubdirectories;

// Listen for menu trigger
ipcRenderer.on('menu-open-folder', () => {
    importFolderWithSubdirectories();
});

// ============================================
// Translation Functions
// ============================================

function initializeTranslation() {
    const translateLanguageSelect = document.getElementById('translateLanguageSelect');
    const startTranslateBtn = document.getElementById('startTranslateBtn');
    const cancelTranslateBtn = document.getElementById('cancelTranslateBtn');
    const loadCachedBtn = document.getElementById('loadCachedBtn');
    
    if (!translateLanguageSelect || !startTranslateBtn || !cancelTranslateBtn) return;
    
    // Populate language dropdown
    if (typeof translationService !== 'undefined') {
        Object.entries(translationService.languages).forEach(([code, name]) => {
            if (code !== 'auto') {
                const option = document.createElement('option');
                option.value = code;
                option.textContent = name;
                translateLanguageSelect.appendChild(option);
            }
        });
    }
    
    // Enable translate button when language is selected
    translateLanguageSelect.addEventListener('change', () => {
        const selectedLang = translateLanguageSelect.value;
        startTranslateBtn.disabled = !selectedLang || !currentFilePath;
        
        // Check if cached translation exists for this language
        if (selectedLang && currentFilePath && typeof translationCache !== 'undefined') {
            const cached = translationCache.loadTranslation(currentFilePath, selectedLang);
            if (cached) {
                loadCachedBtn.classList.remove('hidden');
            } else {
                loadCachedBtn.classList.add('hidden');
            }
        }
    });
    
    // POS highlighting toggle for translate view
    const translatePosToggle = document.getElementById('translatePosToggle');
    const translatePosOptions = document.getElementById('translatePosOptions');
    
    if (translatePosToggle) {
        translatePosToggle.addEventListener('change', async () => {
            const translatedTextContent = document.getElementById('translatedTextContent');
            if (!translatedTextContent || !translationState.currentLanguage) return;
            
            if (translatePosToggle.checked) {
                // Show POS checkboxes
                if (translatePosOptions) translatePosOptions.style.display = 'block';
                
                // Apply POS highlighting
                await applyTranslatedPOSHighlighting(translationState.currentLanguage);
            } else {
                // Hide POS checkboxes
                if (translatePosOptions) translatePosOptions.style.display = 'none';
                
                // Remove POS highlighting, restore plain translated text
                const translateLangSelect = document.getElementById('translateLanguageSelect');
                const targetLang = translateLangSelect ? translateLangSelect.value : translationState.currentLanguage;
                
                if (currentFilePath && typeof translationCache !== 'undefined') {
                    const cached = translationCache.loadTranslation(currentFilePath, targetLang);
                    if (cached) {
                        translatedTextContent.innerHTML = cached.translatedContent;
                        setupTranslationTooltips();
                        
                        // Re-apply user highlights
                        setTimeout(() => {
                            if (typeof notesManager !== 'undefined') {
                                notesManager.applyHighlights();
                            }
                        }, 100);
                    }
                }
            }
        });
    }
    
    // Wire up translate POS checkboxes to re-render when changed
    const translatePosCheckboxes = [
        'translateHighlightNouns', 'translateHighlightVerbs', 'translateHighlightAdj',
        'translateHighlightAdv', 'translateHighlightPrep', 'translateHighlightConj',
        'translateHighlightInterj', 'translateHighlightDet', 'translateHighlightPeople',
        'translateHighlightPlaces'
    ];
    
    translatePosCheckboxes.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) {
            checkbox.addEventListener('change', async () => {
                if (translationState.currentLanguage) {
                    // Re-render with new options
                    await applyTranslatedPOSHighlighting(translationState.currentLanguage);
                }
            });
        }
    });
    
    // Start translation button
    startTranslateBtn.addEventListener('click', async () => {
        const targetLang = translateLanguageSelect.value;
        if (!targetLang || !currentFilePath) return;
        
        await startBackgroundTranslation(targetLang);
    });
    
    // Cancel translation button
    cancelTranslateBtn.addEventListener('click', () => {
        cancelTranslation();
    });
    
    // Load cached translation button
    if (loadCachedBtn) {
        loadCachedBtn.addEventListener('click', async () => {
            const targetLang = translateLanguageSelect.value;
            if (targetLang && currentFilePath) {
                await loadCachedTranslation(targetLang);
            }
        });
    }
}

async function startBackgroundTranslation(targetLang) {
    if (!currentFilePath || typeof translationService === 'undefined') return;
    
    try {
        const originalText = getCleanRawText();
        if (!originalText || !originalText.trim()) {
            alert('No text available to translate. Please ensure the document is fully loaded and contains text.');
            return;
        }
        
        // Validate minimum text length
        if (originalText.trim().length < 10) {
            alert('The document text is too short to translate (less than 10 characters). Please check if the document loaded correctly.');
            return;
        }
        
        console.log(`Starting translation of ${originalText.length} characters to ${targetLang}`);
        console.log(`First 100 characters: "${originalText.substring(0, 100)}..."`);

        
        // Update UI state
        translationState.isTranslating = true;
        translationState.isComplete = false;
        translationState.targetLanguage = targetLang;
        translationState.progress = 0;
        
        const startTranslateBtn = document.getElementById('startTranslateBtn');
        const cancelTranslateBtn = document.getElementById('cancelTranslateBtn');
        const translateStatus = document.getElementById('translateStatus');
        const translateLanguageSelect = document.getElementById('translateLanguageSelect');
        
        if (startTranslateBtn) startTranslateBtn.classList.add('hidden');
        if (cancelTranslateBtn) cancelTranslateBtn.classList.remove('hidden');
        if (translateLanguageSelect) translateLanguageSelect.disabled = true;
        if (translateStatus) translateStatus.textContent = '🔄 Translating... 0%';
        
        // Add notification badge to translate tab button
        if (translateTabBtn) {
            translateTabBtn.innerHTML = '🌐 Translate <span style="background: #ef4444; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; margin-left: 4px;">...</span>';
        }
        
        setStatus(`🌐 Translating to ${translationService.languages[targetLang]}...`);
        
        // Start translation in background (non-blocking)
        translationService.translateSentences(
            originalText,
            targetLang,
            'auto',
            (progress) => {
                if (!translationState.isTranslating) return; // Cancelled
                
                translationState.progress = progress;
                if (translateStatus) {
                    translateStatus.textContent = `🔄 Translating... ${Math.round(progress)}%`;
                }
                if (translateTabBtn) {
                    translateTabBtn.innerHTML = `🌐 Translate <span style="background: #7C3AED; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; margin-left: 4px;">${Math.round(progress)}%</span>`;
                }
            }
        ).then(async (translated) => {
            if (!translationState.isTranslating) return; // Cancelled
            
            // Validate that we actually got translations
            if (!translated || translated.length === 0) {
                throw new Error('No translation results received. The text may be too short or the translation service may have failed.');
            }
            
            // Build translated HTML with hover tooltips
            let translatedHTML = '';
            for (const item of translated) {
                if (item.isNewline) {
                    translatedHTML += item.original;
                } else if (item.isEmpty) {
                    translatedHTML += item.original;
                } else {
                    const escapedOriginal = escapeHtml(item.original.trim());
                    const escapedTranslated = escapeHtml(item.translated);
                    translatedHTML += `<span class="translated-text" data-original="${escapedOriginal}">${escapedTranslated}</span> `;
                }
            }
            
            // Validate that the HTML actually contains text
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = translatedHTML;
            const textContent = tempDiv.textContent.trim();
            
            if (!textContent || textContent.length < 10) {
                throw new Error('Translation produced empty or too short result. Original text may not have been properly extracted.');
            }
            
            // Store translation
            translationState.translatedContent = translatedHTML;
            translationState.isComplete = true;
            translationState.isTranslating = false;
            
            // Save to cache
            if (typeof translationCache !== 'undefined' && currentFilePath) {
                translationCache.saveTranslation(currentFilePath, targetLang, translatedHTML);
                
                // Update cached translations list immediately
                updateCachedTranslationsUI();
            }
            
            // Update translate view
            const translatedTextContent = document.getElementById('translatedTextContent');
            if (translatedTextContent) {
                translatedTextContent.innerHTML = translatedHTML;
                setupTranslationTooltips();
                
                // Re-attach context menu for speech functionality
                if (typeof notesManager !== 'undefined') {
                    notesManager.setupContextMenu(translatedTextContent);
                }
                
                // Store translated text for POS analysis
                translationState.currentTranslatedText = translatedTextContent.textContent || '';
                translationState.currentLanguage = targetLang;
                
                // Apply POS highlighting
                await applyTranslatedPOSHighlighting(targetLang);
                
                // Apply user highlights to translated text
                setTimeout(() => {
                    if (typeof notesManager !== 'undefined') {
                        notesManager.applyHighlights();
                    }
                }, 100);
            }
            
            // Update UI
            if (startTranslateBtn) startTranslateBtn.classList.remove('hidden');
            if (cancelTranslateBtn) cancelTranslateBtn.classList.add('hidden');
            if (translateLanguageSelect) translateLanguageSelect.disabled = false;
            if (translateStatus) translateStatus.textContent = '✅ Translation complete!';
            if (translateTabBtn) {
                translateTabBtn.innerHTML = '🌐 Translate <span style="background: #10b981; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; margin-left: 4px;">✓</span>';
            }
            
            setStatus(`✅ Translation complete! Click the Translate tab to view.`);
            
            // Show notification
            showNotification('Translation Complete', `Document translated to ${translationService.languages[targetLang]}. Click the Translate tab to view.`);
            
        }).catch((error) => {
            console.error('Translation error:', error);
            translationState.isTranslating = false;
            
            if (startTranslateBtn) startTranslateBtn.classList.remove('hidden');
            if (cancelTranslateBtn) cancelTranslateBtn.classList.add('hidden');
            if (translateLanguageSelect) translateLanguageSelect.disabled = false;
            if (translateStatus) translateStatus.textContent = '❌ Translation failed';
            if (translateTabBtn) translateTabBtn.innerHTML = '🌐 Translate';
            
            setStatus('❌ Translation failed: ' + error.message);
            alert('Translation failed: ' + error.message);
        });
        
    } catch (error) {
        console.error('Translation error:', error);
        translationState.isTranslating = false;
        setStatus('❌ Translation failed: ' + error.message);
    }
}

function cancelTranslation() {
    translationState.isTranslating = false;
    translationState.progress = 0;
    
    const startTranslateBtn = document.getElementById('startTranslateBtn');
    const cancelTranslateBtn = document.getElementById('cancelTranslateBtn');
    const translateStatus = document.getElementById('translateStatus');
    const translateLanguageSelect = document.getElementById('translateLanguageSelect');
    
    if (startTranslateBtn) startTranslateBtn.classList.remove('hidden');
    if (cancelTranslateBtn) cancelTranslateBtn.classList.add('hidden');
    if (translateLanguageSelect) translateLanguageSelect.disabled = false;
    if (translateStatus) translateStatus.textContent = '⏹️ Cancelled';
    if (translateTabBtn) translateTabBtn.innerHTML = '🌐 Translate';
    
    setStatus('⏹️ Translation cancelled');
}

window.loadCachedTranslation = loadCachedTranslation;
async function loadCachedTranslation(targetLang) {
    if (!currentFilePath || typeof translationCache === 'undefined') return;
    
    const cached = translationCache.loadTranslation(currentFilePath, targetLang);
    if (!cached) {
        alert('No cached translation found for this language.');
        return;
    }
    
    // Load the cached translation
    const translatedTextContent = document.getElementById('translatedTextContent');
    if (translatedTextContent) {
        translatedTextContent.innerHTML = cached.translatedContent;
        setupTranslationTooltips();
        
        // Re-attach context menu for speech functionality
        if (typeof notesManager !== 'undefined') {
            notesManager.setupContextMenu(translatedTextContent);
        }
        
        // Store translated text for POS analysis
        translationState.currentTranslatedText = translatedTextContent.textContent || '';
        translationState.currentLanguage = targetLang;
        
        // Apply POS highlighting
        await applyTranslatedPOSHighlighting(targetLang);
        
        // Apply user highlights to translated text
        setTimeout(() => {
            if (typeof notesManager !== 'undefined') {
                notesManager.applyHighlights();
            }
        }, 100);
    }
    
    // Update state
    translationState.translatedContent = cached.translatedContent;
    translationState.isComplete = true;
    translationState.targetLanguage = targetLang;
    
    // Update UI
    const translateStatus = document.getElementById('translateStatus');
    if (translateStatus) {
        const age = getTimeAgo(cached.timestamp);
        translateStatus.textContent = `💾 Loaded from cache (${age})`;
    }
    
    if (translateTabBtn) {
        translateTabBtn.innerHTML = '🌐 Translate <span style="background: #10b981; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; margin-left: 4px;">💾</span>';
    }
    
    setStatus(`✅ Loaded cached translation (${cached.languageName})`);
}

function updateCachedTranslationsUI() {
    if (!currentFilePath || typeof translationCache === 'undefined') return;
    
    const available = translationCache.getAvailableTranslations(currentFilePath);
    const banner = document.getElementById('cachedTranslationsBanner');
    const list = document.getElementById('cachedTranslationsList');
    
    if (!banner || !list) return;
    
    if (available.length > 0) {
        banner.classList.remove('hidden');
        
        const items = available.map(trans => {
            const age = getTimeAgo(trans.timestamp);
            return `<button class="cached-translation-btn" onclick="document.getElementById('translateLanguageSelect').value='${trans.language}'; document.getElementById('translateLanguageSelect').dispatchEvent(new Event('change')); loadCachedTranslation('${trans.language}')">
                ${trans.languageName} <span style="color: #059669; font-size: 11px;">(${age})</span>
            </button>`;
        }).join('');
        
        list.innerHTML = items;
    } else {
        banner.classList.add('hidden');
    }
}

function getTimeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 2592000)}mo ago`;
}

function setupTranslationTooltips() {
    const translatedElements = document.querySelectorAll('.translated-text');
    
    translatedElements.forEach(element => {
        element.addEventListener('mouseenter', (e) => {
            const original = element.dataset.original;
            if (!original) return;
            
            showTranslationTooltip(e.target, original);
        });
        
        element.addEventListener('mouseleave', () => {
            hideTranslationTooltip();
        });
    });
}

function showTranslationTooltip(element, originalText) {
    // Remove existing tooltip
    hideTranslationTooltip();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'translation-tooltip';
    tooltip.innerHTML = `<span class="translation-label">Original:</span>${escapeHtml(originalText)}`;
    
    document.body.appendChild(tooltip);
    
    // Position tooltip
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let top = rect.top - tooltipRect.height - 12;
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    
    // Keep within viewport
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
    }
    
    // If tooltip would go above viewport, show below
    if (top < 10) {
        top = rect.bottom + 12;
        tooltip.classList.add('top');
    }
    
    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';
    
    // Store reference for cleanup
    element._tooltip = tooltip;
}

function hideTranslationTooltip() {
    const existingTooltip = document.querySelector('.translation-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
}

// Get translate-specific highlight options
function getTranslateHighlightOptions() {
    return {
        nouns: document.getElementById('translateHighlightNouns')?.checked || false,
        verbs: document.getElementById('translateHighlightVerbs')?.checked || false,
        adjectives: document.getElementById('translateHighlightAdj')?.checked || false,
        adverbs: document.getElementById('translateHighlightAdv')?.checked || false,
        prepositions: document.getElementById('translateHighlightPrep')?.checked || false,
        conjunctions: document.getElementById('translateHighlightConj')?.checked || false,
        interjections: document.getElementById('translateHighlightInterj')?.checked || false,
        determiners: document.getElementById('translateHighlightDet')?.checked || false,
        people: document.getElementById('translateHighlightPeople')?.checked || false,
        places: document.getElementById('translateHighlightPlaces')?.checked || false,
        abbreviations: document.getElementById('translateHighlightAbbr')?.checked || false,
        acronyms: document.getElementById('translateHighlightAcronyms')?.checked || false,
        numbers: document.getElementById('translateHighlightNumbers')?.checked || false,
        currencies: document.getElementById('translateHighlightCurrencies')?.checked || false,
        dates: document.getElementById('translateHighlightDates')?.checked || false,
        crypto: document.getElementById('translateHighlightCrypto')?.checked || false,
        currencyPairs: document.getElementById('translateHighlightCurrencyPairs')?.checked || false,
        currencySymbols: document.getElementById('translateHighlightCurrencySymbols')?.checked || false
    };
}

// Update translate POS counts
function updateTranslatePOSCounts(analysis) {
    if (!analysis || !analysis.pos) return;
    
    document.getElementById('translateCountNouns').textContent = analysis.pos.nouns?.length || 0;
    document.getElementById('translateCountVerbs').textContent = analysis.pos.verbs?.length || 0;
    document.getElementById('translateCountAdj').textContent = analysis.pos.adjectives?.length || 0;
    document.getElementById('translateCountAdv').textContent = analysis.pos.adverbs?.length || 0;
    document.getElementById('translateCountPrep').textContent = analysis.pos.prepositions?.length || 0;
    document.getElementById('translateCountConj').textContent = analysis.pos.conjunctions?.length || 0;
    document.getElementById('translateCountInterj').textContent = analysis.pos.interjections?.length || 0;
    document.getElementById('translateCountDet').textContent = analysis.pos.determiners?.length || 0;
    
    // Entities are in analysis.entities
    if (analysis.entities) {
        document.getElementById('translateCountPeople').textContent = analysis.entities.people?.length || 0;
        document.getElementById('translateCountPlaces').textContent = analysis.entities.places?.length || 0;
        document.getElementById('translateCountAbbr').textContent = analysis.entities.abbreviations?.length || 0;
        document.getElementById('translateCountAcronyms').textContent = analysis.entities.acronyms?.length || 0;
        document.getElementById('translateCountNumbers').textContent = analysis.entities.numbers?.length || 0;
        document.getElementById('translateCountCurrencies').textContent = analysis.entities.currencies?.length || 0;
        document.getElementById('translateCountDates').textContent = analysis.entities.dates?.length || 0;
        document.getElementById('translateCountCrypto').textContent = analysis.entities.crypto?.length || 0;
        document.getElementById('translateCountCurrencyPairs').textContent = analysis.entities.currencyPairs?.length || 0;
        document.getElementById('translateCountCurrencySymbols').textContent = analysis.entities.currencySymbols?.length || 0;
    }
}

// Apply POS highlighting to translated text
async function applyTranslatedPOSHighlighting(targetLang) {
    try {
        const translatedTextContent = document.getElementById('translatedTextContent');
        if (!translatedTextContent) return;
        
        // Get translated text
        const translatedText = translationState.currentTranslatedText || translatedTextContent.textContent || '';
        if (!translatedText.trim()) return;
        
        // Perform NLP analysis on translated text (always re-analyze to get fresh counts)
        // Pass targetLang to support the broad noun strategy for non-English
        const analysis = await textAnalyzer.analyze(translatedText, targetLang);
        
        // Save analysis for stats panel
        translationState.lastAnalysis = analysis;
        
        // Update POS counts for translate view
        updateTranslatePOSCounts(analysis);
        
        // Update stats panel if we are in translate view
        const translateView = document.getElementById('translateView');
        if (translateView && translateView.classList.contains('active')) {
            if (typeof statsPanel !== 'undefined') {
                statsPanel.renderStats(analysis, 'translate');
            }
        }
        
        // Get current highlight options from translate checkboxes
        const options = getTranslateHighlightOptions();
        
        // Find existing translation spans (which hold the tooltips)
        const originalSpans = translatedTextContent.querySelectorAll('.translated-text');
        
        if (originalSpans.length > 0) {
            // METHOD 1: Preserve structure by updating spans in-place
            originalSpans.forEach(span => {
                const text = span.textContent;
                // Render highlighted HTML for just this span's text
                const highlightedHtml = textAnalyzer.renderHighlightedText(
                    text,
                    analysis,
                    options
                );
                
                // renderHighlightedText returns a wrapping div, we just want the inner content
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = highlightedHtml;
                
                // Extract content from the wrapper div
                if (tempDiv.firstElementChild) {
                    span.innerHTML = tempDiv.firstElementChild.innerHTML;
                } else {
                    span.innerHTML = highlightedHtml;
                }
            });
            
            // Re-attach tooltips (listeners might persist, but safe to re-run)
            setupTranslationTooltips();
            
            // Re-attach context menu for speech functionality
            if (typeof notesManager !== 'undefined') {
                notesManager.setupContextMenu(translatedTextContent);
            }
            
        } else {
            // METHOD 2: Fallback if no spans exist (plain text)
            const highlightedHtml = textAnalyzer.renderHighlightedText(
                translatedText,
                analysis,
                options
            );
            translatedTextContent.innerHTML = highlightedHtml;
        }
        
        // Re-apply user highlights
        setTimeout(() => {
            if (typeof notesManager !== 'undefined') {
                notesManager.applyHighlights();
            }
        }, 100);
        
    } catch (error) {
        console.error('Error applying POS highlighting to translation:', error);
    }
}

function showNotification(title, message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'translation-notification';
    notification.innerHTML = `
        <div class="notification-header">
            <strong>${escapeHtml(title)}</strong>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="notification-body">${escapeHtml(message)}</div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }
    }, 10000);
}

// Speech Settings UI Logic
function setupSpeechSettings() {
    const btn = document.getElementById('speechSettingsBtn');
    const dialog = document.getElementById('speechSettingsDialog');
    const closeBtn = document.getElementById('closeSpeechSettingsDialog');
    const voicesList = document.getElementById('availableVoicesList');
    const openSettingsBtn = document.getElementById('openWindowsSpeechSettingsBtn');
    const openMacSettingsBtn = document.getElementById('openMacSpeechSettingsBtn');
    const linuxInstructions = document.getElementById('linuxVoiceInstructions');
    const voiceInstructions = document.getElementById('voiceInstallInstructions');
    const testVoiceBtn = document.getElementById('testVoiceBtn');
    const testVoiceSelect = document.getElementById('testVoiceSelect');
    
    if (!btn || !dialog) return;
    
    // Detect Platform
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const isWin = navigator.platform.toUpperCase().indexOf('WIN') >= 0;
    const isLinux = navigator.platform.toUpperCase().indexOf('LINUX') >= 0;
    
    // Update UI based on Platform
    if (isMac) {
        if (openMacSettingsBtn) openMacSettingsBtn.classList.remove('hidden');
        if (voiceInstructions) {
            voiceInstructions.innerHTML = 'To get voices for other languages, go to <strong>System Settings > Accessibility > Spoken Content</strong>.';
        }
    } else if (isWin) {
        if (openSettingsBtn) openSettingsBtn.classList.remove('hidden');
        if (voiceInstructions) {
            voiceInstructions.innerHTML = 'To get voices for other languages, install the <strong>Language Pack</strong> in Windows Settings.';
        }
    } else if (isLinux) {
        if (linuxInstructions) linuxInstructions.classList.remove('hidden');
        if (voiceInstructions) {
            voiceInstructions.innerHTML = 'On Linux, text-to-speech uses system packages like <strong>espeak</strong> or <strong>speech-dispatcher</strong>.';
        }
    }
    
    // Open dialog
    btn.addEventListener('click', () => {
        dialog.classList.remove('hidden');
        loadVoicesList();
    });
    
    // Close dialog
    closeBtn.addEventListener('click', () => {
        dialog.classList.add('hidden');
    });
    
    // Open Windows Settings
    if (openSettingsBtn) {
        openSettingsBtn.addEventListener('click', () => {
            const { shell } = require('electron');
            // Opens Windows Speech Settings directly
            shell.openExternal('ms-settings:speech');
        });
    }
    
    // Open Mac Settings
    if (openMacSettingsBtn) {
        openMacSettingsBtn.addEventListener('click', () => {
            const { shell } = require('electron');
            // Open macOS System Settings -> Accessibility -> Spoken Content
            // Note: Direct deep linking varies by macOS version, general preference pane is safer
            shell.openExternal('x-apple.systempreferences:com.apple.preference.universalaccess?Speech');
        });
    }
    
    // Test Voice
    if (testVoiceBtn && testVoiceSelect) {
        testVoiceBtn.addEventListener('click', () => {
            const voiceName = testVoiceSelect.value;
            const voices = window.speechSynthesis.getVoices();
            const voice = voices.find(v => v.name === voiceName);
            
            if (voice) {
                const utterance = new SpeechSynthesisUtterance("Hello, this is a test of the selected voice.");
                // If voice is not English, try to say something generic in that language or just the name
                if (!voice.lang.startsWith('en')) {
                    utterance.text = voice.name;
                }
                utterance.voice = voice;
                window.speechSynthesis.speak(utterance);
            }
        });
    }
    
    function loadVoicesList() {
        const voices = window.speechSynthesis.getVoices();
        
        if (voices.length === 0) {
            voicesList.innerHTML = '<div style="padding: 10px; text-align: center;">No voices detected yet. Wait a moment or check system settings.</div>';
            return;
        }
        
        // Group by language
        const grouped = {};
        voices.forEach(v => {
            const lang = v.lang.split('-')[0].toUpperCase();
            if (!grouped[lang]) grouped[lang] = [];
            grouped[lang].push(v);
        });
        
        let html = '';
        
        // Sort languages
        Object.keys(grouped).sort().forEach(lang => {
            html += `<div style="font-weight: bold; margin-top: 10px; padding-bottom: 5px; border-bottom: 1px solid #eee;">${lang}</div>`;
            grouped[lang].forEach(v => {
                html += `<div style="padding: 4px 0; font-size: 0.9em; display: flex; justify-content: space-between;">
                    <span>${v.name}</span>
                    <span style="color: #888; font-size: 0.8em;">${v.lang}</span>
                </div>`;
            });
        });
        
        voicesList.innerHTML = html;
        
        // Update test dropdown
        testVoiceSelect.innerHTML = voices.map(v => `<option value="${v.name}">${v.name} (${v.lang})</option>`).join('');
    }
    
    // Initial load ensures onvoiceschanged fires
    if (window.speechSynthesis.onvoiceschanged === null) {
        window.speechSynthesis.onvoiceschanged = () => {
            if (!dialog.classList.contains('hidden')) {
                loadVoicesList();
            }
        };
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Reset translation state when loading new file
function resetTranslationState() {
    // Cancel any ongoing translation
    if (translationState.isTranslating) {
        cancelTranslation();
    }
    
    translationState = {
        isTranslating: false,
        isComplete: false,
        targetLanguage: '',
        translatedContent: null,
        progress: 0
    };
    
    const startTranslateBtn = document.getElementById('startTranslateBtn');
    const cancelTranslateBtn = document.getElementById('cancelTranslateBtn');
    const translateStatus = document.getElementById('translateStatus');
    const translateLanguageSelect = document.getElementById('translateLanguageSelect');
    const translatedTextContent = document.getElementById('translatedTextContent');
    
    if (startTranslateBtn) {
        startTranslateBtn.classList.remove('hidden');
        startTranslateBtn.disabled = !translateLanguageSelect?.value;
    }
    if (cancelTranslateBtn) cancelTranslateBtn.classList.add('hidden');
    if (translateLanguageSelect) {
        translateLanguageSelect.value = '';
        translateLanguageSelect.disabled = false;
    }
    if (translateStatus) translateStatus.textContent = '';
    if (translateTabBtn) translateTabBtn.innerHTML = '🌐 Translate';
    if (translatedTextContent) {
        translatedTextContent.innerHTML = `
            <div class="placeholder-text">
                <p>🌐 Document Translation</p>
                <p style="font-size: 14px; color: #666;">Select a language and click "Start Translation"</p>
                <p style="font-size: 12px; color: #999; margin-top: 10px;">Supports 30+ languages including Spanish, French, German, Japanese, Chinese, and more</p>
            </div>
        `;
    }
}

// ========================================
// AI Semantic Analysis UI Handlers
// ========================================

function initializeAISemanticAnalysis() {
    // Check if AI analyzer is available
    if (!window.aiSemanticAnalyzer) {
        console.warn('AI Semantic Analyzer not available');
        return;
    }
    
    // Get UI elements
    const aiProviderSelect = document.getElementById('aiProviderSelect');
    const openaiApiKeyInput = document.getElementById('openaiApiKey');
    const geminiApiKeyInput = document.getElementById('geminiApiKey');
    const ollamaEndpointInput = document.getElementById('ollamaEndpoint');
    const ollamaModelSelect = document.getElementById('ollamaModel');
    const openaiKeySection = document.getElementById('openaiApiKeySection');
    const geminiKeySection = document.getElementById('geminiApiKeySection');
    const ollamaConfigSection = document.getElementById('ollamaConfigSection');
    const saveOpenAIKeyBtn = document.getElementById('saveOpenAIKeyBtn');
    const saveGeminiKeyBtn = document.getElementById('saveGeminiKeyBtn');
    const saveOllamaConfigBtn = document.getElementById('saveOllamaConfigBtn');
    const testOpenAIKeyBtn = document.getElementById('testOpenAIKeyBtn');
    const testGeminiKeyBtn = document.getElementById('testGeminiKeyBtn');
    const testOllamaBtn = document.getElementById('testOllamaBtn');
    const runAIAnalysisBtn = document.getElementById('runAIAnalysisBtn');
    const aiAnalysisStatus = document.getElementById('aiAnalysisStatus');
    const aiAnalysisProgress = document.getElementById('aiAnalysisProgress');
    
    // Check if elements exist
    if (!aiProviderSelect || !runAIAnalysisBtn) {
        console.warn('AI Analysis UI elements not found');
        return;
    }
    
    // AI Config collapse/expand handlers
    const aiConfigHeader = document.getElementById('aiConfigHeader');
    const aiConfigContent = document.getElementById('aiConfigContent');
    const aiConfigArrow = document.getElementById('aiConfigArrow');
    const closeAiConfigBtn = document.getElementById('closeAiConfigBtn');
    
    // Load saved config visibility state
    const configCollapsed = localStorage.getItem('aiConfigCollapsed') === 'true';
    const configHidden = localStorage.getItem('aiConfigHidden') === 'true';
    
    if (configCollapsed) {
        aiConfigContent.style.display = 'none';
        aiConfigArrow.style.transform = 'rotate(-90deg)';
    }
    
    if (configHidden) {
        const configSection = aiConfigHeader.closest('div[style*="margin-bottom: 20px"]');
        if (configSection) {
            configSection.style.display = 'none';
            
            // Show the "Show Configuration" button
            const aiTabContent = document.querySelector('[data-stats-content="ai-analysis"]');
            if (aiTabContent) {
                let showConfigBtn = document.getElementById('showAiConfigBtn');
                if (!showConfigBtn) {
                    showConfigBtn = document.createElement('button');
                    showConfigBtn.id = 'showAiConfigBtn';
                    showConfigBtn.className = 'btn-secondary';
                    showConfigBtn.style.cssText = 'margin: 10px 16px; padding: 10px; font-size: 13px; width: calc(100% - 32px);';
                    showConfigBtn.innerHTML = '⚙️ Show Configuration';
                    showConfigBtn.addEventListener('click', () => {
                        configSection.style.display = 'block';
                        localStorage.setItem('aiConfigHidden', 'false');
                        showConfigBtn.remove();
                    });
                    const firstChild = aiTabContent.querySelector('div');
                    if (firstChild) {
                        aiTabContent.insertBefore(showConfigBtn, firstChild);
                    } else {
                        aiTabContent.appendChild(showConfigBtn);
                    }
                }
            }
        }
    }
    
    // Toggle collapse/expand
    if (aiConfigHeader) {
        aiConfigHeader.addEventListener('click', (e) => {
            // Don't toggle if clicking the close button
            if (e.target.closest('#closeAiConfigBtn')) return;
            
            const isCollapsed = aiConfigContent.style.display === 'none';
            
            if (isCollapsed) {
                aiConfigContent.style.display = 'block';
                aiConfigArrow.style.transform = 'rotate(0deg)';
                localStorage.setItem('aiConfigCollapsed', 'false');
            } else {
                aiConfigContent.style.display = 'none';
                aiConfigArrow.style.transform = 'rotate(-90deg)';
                localStorage.setItem('aiConfigCollapsed', 'true');
            }
        });
    }
    
    // Close/hide configuration
    if (closeAiConfigBtn) {
        closeAiConfigBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const configSection = aiConfigHeader.closest('div[style*="margin-bottom: 20px"]');
            if (configSection) {
                configSection.style.display = 'none';
                localStorage.setItem('aiConfigHidden', 'true');
                
                // Show a button to restore it
                const aiTabContent = document.querySelector('[data-stats-content="ai-analysis"]');
                if (aiTabContent) {
                    let showConfigBtn = document.getElementById('showAiConfigBtn');
                    if (!showConfigBtn) {
                        showConfigBtn = document.createElement('button');
                        showConfigBtn.id = 'showAiConfigBtn';
                        showConfigBtn.className = 'btn-secondary';
                        showConfigBtn.style.cssText = 'margin: 10px 16px; padding: 10px; font-size: 13px; width: calc(100% - 32px);';
                        showConfigBtn.innerHTML = '⚙️ Show Configuration';
                        showConfigBtn.addEventListener('click', () => {
                            configSection.style.display = 'block';
                            localStorage.setItem('aiConfigHidden', 'false');
                            showConfigBtn.remove();
                        });
                        aiTabContent.insertBefore(showConfigBtn, aiTabContent.firstChild);
                    }
                }
            }
        });
    }
    
    // Load saved provider and API keys
    const savedProvider = window.aiSemanticAnalyzer.getProvider();
    aiProviderSelect.value = savedProvider;
    
    const openaiKey = window.aiSemanticAnalyzer.getApiKey('openai');
    const geminiKey = window.aiSemanticAnalyzer.getApiKey('gemini');
    const ollamaConfig = window.aiSemanticAnalyzer.getOllamaConfig();
    
    if (openaiKey && openaiApiKeyInput) {
        openaiApiKeyInput.value = openaiKey;
    }
    if (geminiKey && geminiApiKeyInput) {
        geminiApiKeyInput.value = geminiKey;
    }
    if (ollamaEndpointInput) {
        ollamaEndpointInput.value = ollamaConfig.endpoint;
    }
    if (ollamaModelSelect) {
        ollamaModelSelect.value = ollamaConfig.model;
    }
    
    // Show/hide sections based on provider
    const updateProviderUI = () => {
        const provider = aiProviderSelect.value;
        window.aiSemanticAnalyzer.setProvider(provider);
        
        // Hide all sections first
        if (openaiKeySection) openaiKeySection.style.display = 'none';
        if (geminiKeySection) geminiKeySection.style.display = 'none';
        if (ollamaConfigSection) ollamaConfigSection.style.display = 'none';
        
        // Show appropriate section
        if (provider === 'openai') {
            if (openaiKeySection) openaiKeySection.style.display = 'block';
            runAIAnalysisBtn.disabled = !openaiApiKeyInput?.value.trim();
        } else if (provider === 'gemini') {
            if (geminiKeySection) geminiKeySection.style.display = 'block';
            runAIAnalysisBtn.disabled = !geminiApiKeyInput?.value.trim();
        } else if (provider === 'ollama') {
            if (ollamaConfigSection) ollamaConfigSection.style.display = 'block';
            runAIAnalysisBtn.disabled = false; // Ollama doesn't need API key
        }
    };
    
    updateProviderUI();
    
    // Provider change handler
    aiProviderSelect.addEventListener('change', updateProviderUI);
    
    // Save OpenAI API Key
    saveOpenAIKeyBtn.addEventListener('click', () => {
        const apiKey = openaiApiKeyInput.value.trim();
        if (apiKey) {
            window.aiSemanticAnalyzer.setApiKey(apiKey, 'openai');
            runAIAnalysisBtn.disabled = false;
            
            // Visual feedback
            saveOpenAIKeyBtn.textContent = '✓';
            saveOpenAIKeyBtn.style.background = '#4caf50';
            setTimeout(() => {
                saveOpenAIKeyBtn.textContent = '💾';
                saveOpenAIKeyBtn.style.background = '';
            }, 1500);
            
            alert('✓ OpenAI API Key saved successfully!');
        } else {
            alert('Please enter a valid API key');
        }
    });
    
    // Save Gemini API Key
    saveGeminiKeyBtn.addEventListener('click', () => {
        const apiKey = geminiApiKeyInput.value.trim();
        if (apiKey) {
            window.aiSemanticAnalyzer.setApiKey(apiKey, 'gemini');
            runAIAnalysisBtn.disabled = false;
            
            // Visual feedback
            saveGeminiKeyBtn.textContent = '✓';
            saveGeminiKeyBtn.style.background = '#4caf50';
            setTimeout(() => {
                saveGeminiKeyBtn.textContent = '💾';
                saveGeminiKeyBtn.style.background = '';
            }, 1500);
            
            alert('✓ Gemini API Key saved successfully!');
        } else {
            alert('Please enter a valid API key');
        }
    });
    
    // Save Ollama Configuration
    if (saveOllamaConfigBtn && ollamaEndpointInput && ollamaModelSelect) {
        saveOllamaConfigBtn.addEventListener('click', () => {
            const endpoint = ollamaEndpointInput.value.trim();
            const model = ollamaModelSelect.value;
            
            window.aiSemanticAnalyzer.setOllamaConfig(endpoint, model);
            
            // Visual feedback
            saveOllamaConfigBtn.textContent = '✓ Saved';
            saveOllamaConfigBtn.style.background = '#4caf50';
            setTimeout(() => {
                saveOllamaConfigBtn.textContent = '💾 Save Config';
                saveOllamaConfigBtn.style.background = '';
            }, 1500);
        });
    }
    
    // Enable button when typing
    if (openaiApiKeyInput) {
        openaiApiKeyInput.addEventListener('input', () => {
            if (aiProviderSelect.value === 'openai') {
                runAIAnalysisBtn.disabled = !openaiApiKeyInput.value.trim();
            }
        });
    }
    
    if (geminiApiKeyInput) {
        geminiApiKeyInput.addEventListener('input', () => {
            if (aiProviderSelect.value === 'gemini') {
                runAIAnalysisBtn.disabled = !geminiApiKeyInput.value.trim();
            }
        });
    }
    
    // Test OpenAI API Key
    testOpenAIKeyBtn.addEventListener('click', async () => {
        const apiKey = openaiApiKeyInput.value.trim();
        if (!apiKey) {
            alert('Please enter an API key first');
            return;
        }
        
        // Save key temporarily for testing
        window.aiSemanticAnalyzer.setApiKey(apiKey, 'openai');
        
        testOpenAIKeyBtn.disabled = true;
        testOpenAIKeyBtn.textContent = '⏳';
        
        try {
            const result = await window.aiSemanticAnalyzer.testApiKey('openai');
            
            if (result.valid) {
                const modelList = result.availableModels.length > 0 
                    ? result.availableModels.join('\n• ')
                    : 'No models found';
                    
                alert(`✓ OpenAI API Key is valid!\n\nAvailable models:\n• ${modelList}`);
                runAIAnalysisBtn.disabled = false;
            } else {
                alert(`✗ API Key test failed:\n\n${result.error}\n\nPlease get a new API key from:\nhttps://platform.openai.com/api-keys`);
            }
        } catch (error) {
            alert(`✗ Test failed: ${error.message}`);
        } finally {
            testOpenAIKeyBtn.disabled = false;
            testOpenAIKeyBtn.textContent = '🔍';
        }
    });
    
    // Test Gemini API Key
    testGeminiKeyBtn.addEventListener('click', async () => {
        const apiKey = geminiApiKeyInput.value.trim();
        if (!apiKey) {
            alert('Please enter an API key first');
            return;
        }
        
        // Save key temporarily for testing
        window.aiSemanticAnalyzer.setApiKey(apiKey, 'gemini');
        
        testGeminiKeyBtn.disabled = true;
        testGeminiKeyBtn.textContent = '⏳';
        
        try {
            const result = await window.aiSemanticAnalyzer.testApiKey('gemini');
            
            if (result.valid) {
                const modelList = result.availableModels.length > 0 
                    ? result.availableModels.join('\n• ')
                    : 'No models found';
                    
                alert(`✓ Gemini API Key is valid!\n\nAvailable models:\n• ${modelList}`);
                runAIAnalysisBtn.disabled = false;
            } else {
                alert(`✗ API Key test failed:\n\n${result.error}\n\nPlease get a new API key from:\nhttps://aistudio.google.com/app/apikey`);
            }
        } catch (error) {
            alert(`✗ Test failed: ${error.message}`);
        } finally {
            testGeminiKeyBtn.disabled = false;
            testGeminiKeyBtn.textContent = '🔍';
        }
    });
    
    // Test Ollama Connection
    if (testOllamaBtn) {
        testOllamaBtn.addEventListener('click', async () => {
            // Save config first
            if (ollamaEndpointInput && ollamaModelSelect) {
                window.aiSemanticAnalyzer.setOllamaConfig(
                    ollamaEndpointInput.value.trim(),
                    ollamaModelSelect.value
                );
            }
            
            testOllamaBtn.disabled = true;
            testOllamaBtn.textContent = '⏳';
            
            try {
                const result = await window.aiSemanticAnalyzer.testApiKey('ollama');
                
                if (result.valid) {
                    const modelList = result.availableModels.length > 0 
                        ? result.availableModels.join('\n• ')
                        : 'No models found (run: ollama pull llama3.2)';
                        
                    alert(`✓ Ollama is running!\n\nEndpoint: ${result.endpoint}\nCurrent model: ${result.currentModel}\n\nInstalled models:\n• ${modelList}\n\n✨ Ready to analyze!`);
                    runAIAnalysisBtn.disabled = false;
                } else {
                    alert(`✗ Cannot connect to Ollama:\n\n${result.error}\n\nTo start Ollama:\n1. Open terminal\n2. Run: ollama serve\n3. Test again`);
                }
            } catch (error) {
                alert(`✗ Test failed: ${error.message}`);
            } finally {
                testOllamaBtn.disabled = false;
                testOllamaBtn.textContent = '🔍 Test Connection';
            }
        });
    }
    
    // Run AI Analysis
    runAIAnalysisBtn.addEventListener('click', async () => {
            try {
                // Get the current document text
                const rawTextContent = document.getElementById('rawTextContent');
                if (!rawTextContent || !rawTextContent.textContent.trim()) {
                    alert('No document loaded. Please open a document first.');
                    return;
                }
                
                const documentText = rawTextContent.textContent.trim();
                
                // Show status
                aiAnalysisStatus.style.display = 'block';
                runAIAnalysisBtn.disabled = true;
                
                // Run analysis with progress updates
                const results = await window.aiSemanticAnalyzer.analyzeDocument(
                    documentText,
                    (message, progress) => {
                        aiAnalysisProgress.textContent = `${message} (${progress}%)`;
                    }
                );
                
                // Hide status
                aiAnalysisStatus.style.display = 'none';
                
                // Cache the results
                cacheAIAnalysisResults(currentFilePath, results);
                
                // Display results in Statistics panel AI tab
                displayAIResultsInStatsPanel(results, false);
                
                // Switch to Statistics panel AI Analysis tab
                const aiAnalysisTab = document.querySelector('[data-stats-tab="ai-analysis"]');
                if (aiAnalysisTab) {
                    aiAnalysisTab.click();
                }
                
                // Show success message
                setTimeout(() => {
                    alert(`✓ Analysis complete! Found ${results.similarGroups.length} pattern groups.\n\nResults are shown below. Click any sentence to navigate to it in the document.`);
                }, 500);
                
            } catch (error) {
                console.error('AI Analysis error:', error);
                alert(`Analysis failed: ${error.message}`);
                aiAnalysisStatus.style.display = 'none';
            } finally {
                runAIAnalysisBtn.disabled = false;
            }
        });
    
    console.log('✓ AI Semantic Analysis initialized');
}

// Cache AI Analysis results
function cacheAIAnalysisResults(filePath, results) {
    if (!filePath) return;
    
    const cacheKey = `aiAnalysis_${btoa(filePath)}`; // Base64 encode the file path
    
    // Serialize the similarSentences Map
    const similarSentencesArray = Array.from(window.aiSemanticAnalyzer.similarSentences.entries());
    
    const cacheData = {
        results: results,
        similarSentencesArray: similarSentencesArray, // Serialized Map
        timestamp: Date.now(),
        filePath: filePath
    };
    
    try {
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        console.log(`✓ Cached AI analysis for: ${filePath}`);
    } catch (error) {
        console.warn('Failed to cache AI analysis:', error);
    }
}

// Load cached AI Analysis results
function loadCachedAIAnalysisResults(filePath) {
    if (!filePath) return null;
    
    const cacheKey = `aiAnalysis_${btoa(filePath)}`;
    
    try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            const cacheData = JSON.parse(cached);
            console.log(`✓ Loaded cached AI analysis for: ${filePath}`);
            return cacheData;
        }
    } catch (error) {
        console.warn('Failed to load cached AI analysis:', error);
    }
    
    return null;
}

// Clear cached AI Analysis results
function clearCachedAIAnalysisResults(filePath) {
    if (!filePath) return;
    
    const cacheKey = `aiAnalysis_${btoa(filePath)}`;
    localStorage.removeItem(cacheKey);
    console.log(`✓ Cleared cached AI analysis for: ${filePath}`);
}

// Display AI results in Statistics panel
// Store current page for each pattern's sentences
const patternSentencePages = new Map(); // patternId -> currentPage
const SENTENCES_PER_PAGE = 5; // Show 5 sentences per page within each pattern
let currentAIResults = null;
let currentAIResultsCached = false;

function displayAIResultsInStatsPanel(results, isCached = false) {
    const aiTabContent = document.getElementById('aiAnalysisTabContent');
    if (!aiTabContent) return;
    
    // Reset pagination for all patterns and store results
    patternSentencePages.clear();
    currentAIResults = results;
    currentAIResultsCached = isCached;
    
    renderAIPatternPage(results, isCached);
}

function renderAIPatternPage(results, isCached = false) {
    const aiTabContent = document.getElementById('aiAnalysisTabContent');
    if (!aiTabContent) return;
    
    let providerName = 'Unknown';
    if (results.provider === 'openai') providerName = 'OpenAI GPT-4';
    else if (results.provider === 'gemini') providerName = 'Google Gemini';
    else if (results.provider === 'ollama') providerName = `Ollama (${window.aiSemanticAnalyzer.getOllamaConfig().model})`;
    
    const fullData = window.aiSemanticAnalyzer.similarSentences;
    const colors = ['#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#f44336'];
    const allPatterns = Array.from(fullData.entries());
    
    // Generate HTML for all patterns with individual pagination
    let patternsHTML = '';
    allPatterns.forEach(([patternId, groupData]) => {
        const idx = Array.from(fullData.keys()).indexOf(patternId);
        const borderColor = colors[idx % colors.length];
        
        // Get current page for this pattern (default to 1)
        if (!patternSentencePages.has(patternId)) {
            patternSentencePages.set(patternId, 1);
        }
        const currentPage = patternSentencePages.get(patternId);
        
        // Calculate sentence pagination for this pattern
        const totalSentences = groupData.sentences.length;
        const totalPages = Math.ceil(totalSentences / SENTENCES_PER_PAGE);
        const startIdx = (currentPage - 1) * SENTENCES_PER_PAGE;
        const endIdx = Math.min(startIdx + SENTENCES_PER_PAGE, totalSentences);
        const sentencesToShow = groupData.sentences.slice(startIdx, endIdx);
        
        // Generate pagination controls for this pattern
        const patternPagination = totalPages > 1 ? `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding: 10px; background: #f0f0f0; border-radius: 6px;">
                <button class="pattern-prev-btn" data-pattern-id="${patternId}" 
                        style="padding: 6px 12px; border-radius: 4px; border: 1px solid #ddd; background: white; cursor: pointer; font-size: 12px; transition: all 0.2s;" 
                        ${currentPage === 1 ? 'disabled' : ''}>
                    ← Prev
                </button>
                <div style="display: flex; gap: 4px; align-items: center;">
                    ${Array.from({length: Math.min(totalPages, 7)}, (_, i) => {
                        // Show first 3 pages, last 3 pages, and current page
                        let pageNum;
                        if (totalPages <= 7) {
                            pageNum = i + 1;
                        } else if (i < 3) {
                            pageNum = i + 1;
                        } else if (i >= totalPages - 3) {
                            pageNum = totalPages - (totalPages - i - 1);
                        } else if (currentPage >= 4 && currentPage <= totalPages - 3) {
                            pageNum = currentPage;
                        } else {
                            return '';
                        }
                        
                        return `
                            <button class="pattern-page-btn" data-pattern-id="${patternId}" data-page="${pageNum}" 
                                    style="padding: 4px 8px; border-radius: 4px; border: 1px solid #ddd; background: ${pageNum === currentPage ? borderColor : 'white'}; color: ${pageNum === currentPage ? 'white' : '#333'}; font-weight: ${pageNum === currentPage ? '600' : '400'}; cursor: pointer; transition: all 0.2s; font-size: 11px; min-width: 28px;">
                                ${pageNum}
                            </button>
                        `;
                    }).join('')}
                </div>
                <button class="pattern-next-btn" data-pattern-id="${patternId}" 
                        style="padding: 6px 12px; border-radius: 4px; border: 1px solid #ddd; background: white; cursor: pointer; font-size: 12px; transition: all 0.2s;" 
                        ${currentPage === totalPages ? 'disabled' : ''}>
                    Next →
                </button>
                <div style="font-size: 11px; color: #666; margin-left: 10px;">
                    ${startIdx + 1}-${endIdx} of ${totalSentences}
                </div>
            </div>
        ` : '';
        
        patternsHTML += `
            <div style="margin-bottom: 20px; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid ${borderColor}; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="font-weight: 600; margin-bottom: 8px; color: #333; font-size: 15px;">
                    Pattern ${idx + 1}: ${escapeHtml(groupData.theme)}
                </div>
                <div style="font-size: 12px; color: #666; margin-bottom: 12px;">
                    <strong>${groupData.sentences.length}</strong> similar sentences found
                    <span style="margin-left: 10px; padding: 2px 8px; background: ${
                        groupData.significance === 'high' ? '#4caf50' : 
                        groupData.significance === 'medium' ? '#ff9800' : '#9e9e9e'
                    }; color: white; border-radius: 3px; font-size: 10px; font-weight: 600;">
                        ${groupData.significance.toUpperCase()}
                    </span>
                </div>
                <div style="background: #f9f9f9; padding: 10px; border-radius: 6px; min-height: 150px;">
                    ${sentencesToShow.map((sentence, sIdx) => {
                        const absoluteIdx = startIdx + sIdx;
                        return `
                            <div class="ai-pattern-sentence" data-sentence-text="${escapeHtml(sentence)}" 
                                 style="padding: 8px; margin-bottom: 6px; background: white; border-radius: 4px; cursor: pointer; font-size: 13px; line-height: 1.6; border: 1px solid #e0e0e0; transition: all 0.2s;"
                                 onmouseover="this.style.borderColor='${borderColor}'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'; this.style.transform='translateX(2px)'"
                                 onmouseout="this.style.borderColor='#e0e0e0'; this.style.boxShadow='none'; this.style.transform='translateX(0)'">
                                <span style="color: ${borderColor}; font-weight: 600; margin-right: 6px; font-size: 12px;">${absoluteIdx + 1}.</span>
                                <span style="color: #333;">"${escapeHtml(sentence)}"</span>
                            </div>
                        `;
                    }).join('')}
                </div>
                ${patternPagination}
            </div>
        `;
    });
    
    const paginationHTML = '';
    
    const cacheInfo = isCached ? `
        <div style="font-size: 11px; opacity: 0.9; margin-top: 8px; padding: 8px; background: rgba(255,255,255,0.15); border-radius: 4px; display: flex; align-items: center; justify-content: space-between;">
            <span>📦 Cached results from ${new Date(isCached).toLocaleString()}</span>
            <button id="reAnalyzeBtn" class="btn-icon" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 4px 10px; font-size: 11px; border-radius: 4px; cursor: pointer;">
                🔄 Re-analyze
            </button>
        </div>
    ` : '';
    
    aiTabContent.innerHTML = `
        <div style="margin-bottom: 20px; padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; color: white;">
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">🤖 AI Pattern Analysis Results ${isCached ? '(Cached)' : ''}</div>
            <div style="font-size: 14px; opacity: 0.9;">
                Found <strong>${results.patternsFound}</strong> semantic patterns across <strong>${results.similarGroups.length}</strong> groups
            </div>
            <div style="font-size: 12px; opacity: 0.8; margin-top: 6px;">
                Analyzed ${results.totalSentences} sentences using ${providerName}
            </div>
            ${cacheInfo}
        </div>
        
        <div style="margin-bottom: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
            <button id="applyAIHighlightsBtn2" class="btn-primary" style="flex: 1; min-width: 200px; padding: 10px; font-size: 13px;">
                ✨ Apply Pattern Highlights
            </button>
            <button id="addToMindmapBtn2" class="btn-secondary" style="flex: 1; min-width: 200px; padding: 10px; font-size: 13px;">
                🧠 Add to Mindmap
            </button>
        </div>
        
        ${patternsHTML}
        ${paginationHTML}
    `;
    
    // Add click handlers for sentence navigation
    aiTabContent.querySelectorAll('.ai-pattern-sentence').forEach(el => {
        el.addEventListener('click', () => {
            const sentenceText = el.dataset.sentenceText;
            navigateToSentenceInDocument(sentenceText);
        });
    });
    
    // Add click handlers for per-pattern pagination - Previous buttons
    aiTabContent.querySelectorAll('.pattern-prev-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const patternId = btn.dataset.patternId;
            const currentPage = patternSentencePages.get(patternId) || 1;
            if (currentPage > 1) {
                patternSentencePages.set(patternId, currentPage - 1);
                renderAIPatternPage(currentAIResults, currentAIResultsCached);
            }
        });
    });
    
    // Add click handlers for per-pattern pagination - Next buttons
    aiTabContent.querySelectorAll('.pattern-next-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const patternId = btn.dataset.patternId;
            const groupData = window.aiSemanticAnalyzer.similarSentences.get(patternId);
            if (groupData) {
                const totalPages = Math.ceil(groupData.sentences.length / SENTENCES_PER_PAGE);
                const currentPage = patternSentencePages.get(patternId) || 1;
                if (currentPage < totalPages) {
                    patternSentencePages.set(patternId, currentPage + 1);
                    renderAIPatternPage(currentAIResults, currentAIResultsCached);
                }
            }
        });
    });
    
    // Add click handlers for per-pattern pagination - Page number buttons
    aiTabContent.querySelectorAll('.pattern-page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const patternId = btn.dataset.patternId;
            const targetPage = parseInt(btn.dataset.page);
            const currentPage = patternSentencePages.get(patternId) || 1;
            if (targetPage !== currentPage) {
                patternSentencePages.set(patternId, targetPage);
                renderAIPatternPage(currentAIResults, currentAIResultsCached);
            }
        });
    });
    
    // Add click handler for re-analyze button
    const reAnalyzeBtn = document.getElementById('reAnalyzeBtn');
    if (reAnalyzeBtn) {
        reAnalyzeBtn.addEventListener('click', () => {
            if (confirm('Re-analyze this document? This will replace the cached results.')) {
                clearCachedAIAnalysisResults(currentFilePath);
                const runBtn = document.getElementById('runAIAnalysisBtn');
                if (runBtn) runBtn.click();
            }
        });
    }
    
    // Add click handlers for action buttons
    const applyBtn2 = document.getElementById('applyAIHighlightsBtn2');
    const mindmapBtn2 = document.getElementById('addToMindmapBtn2');
    
    if (applyBtn2) {
        applyBtn2.addEventListener('click', () => {
            try {
                const rawTextContent = document.getElementById('rawTextContent');
                if (!rawTextContent || !window.notesManager) {
                    alert('Cannot apply highlights at this time');
                    return;
                }
                
                const documentText = rawTextContent.textContent.trim();
                const highlights = window.aiSemanticAnalyzer.createPatternHighlights(
                    window.notesManager,
                    documentText
                );
                
                if (highlights.length === 0) {
                    alert('No patterns found to highlight');
                    return;
                }
                
                highlights.forEach(h => window.notesManager.highlights.push(h));
                window.notesManager.saveToStorage();
                window.notesManager.renderDebounced();
                window.notesManager.applyHighlightsDebounced();
                
                alert(`✓ Applied ${highlights.length} pattern highlights with 'ai' tag!\n\nView them in:\n• Analyse tab (highlighted text)\n• Notes tab (all highlights)`);
                
                // Switch to highlighted view to show AI highlights immediately
                const highlightedTextBtn = document.getElementById('highlightedTextBtn');
                if (highlightedTextBtn) {
                    highlightedTextBtn.click();
                    // Give it a moment to render, then apply highlights
                    setTimeout(() => {
                        window.notesManager.applyHighlights();
                    }, 100);
                }
            } catch (error) {
                console.error('Error applying highlights:', error);
                alert(`Failed to apply highlights: ${error.message}`);
            }
        });
    }
    
    if (mindmapBtn2) {
        mindmapBtn2.addEventListener('click', addAIPatternsToMindmap);
    }
}

// Add AI patterns to mindmap
function addAIPatternsToMindmap() {
    try {
        if (!window.mindmapManager) {
            alert('Mindmap not available');
            return;
        }
        
        const summary = window.aiSemanticAnalyzer.getSummary();
        
        if (summary.groups.length === 0) {
            alert('No patterns to add');
            return;
        }
        
        // Get the AI patterns from similar sentences
        const groups = Array.from(window.aiSemanticAnalyzer.similarSentences.values());
        
        // Add patterns to mindmap
        groups.forEach((group, idx) => {
            // Create a parent node for the pattern theme
            const themeNode = {
                id: `ai_theme_${Date.now()}_${idx}`,
                text: `🤖 ${group.theme}`,
                x: 200 + (idx % 3) * 250,
                y: 150 + Math.floor(idx / 3) * 200,
                color: ['#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#f44336'][idx % 5],
                connections: []
            };
            
            // Add child nodes for each sentence in the group
            group.sentences.forEach((sentence, sIdx) => {
                const sentenceNode = {
                    id: `ai_sentence_${Date.now()}_${idx}_${sIdx}`,
                    text: sentence.substring(0, 50) + (sentence.length > 50 ? '...' : ''),
                    x: themeNode.x + (sIdx % 2) * 150 - 75,
                    y: themeNode.y + 100 + Math.floor(sIdx / 2) * 80,
                    color: themeNode.color,
                    connections: []
                };
                
                window.mindmapManager.addNode(sentenceNode);
                window.mindmapManager.addConnection(themeNode.id, sentenceNode.id);
            });
            
            window.mindmapManager.addNode(themeNode);
        });
        
        alert(`✓ Added ${groups.length} pattern groups to mindmap!`);
        
        // Switch to mindmap view
        const mindmapBtn = document.getElementById('mindmapBtn');
        if (mindmapBtn) mindmapBtn.click();
        
    } catch (error) {
        console.error('Error adding to mindmap:', error);
        alert(`Failed to add to mindmap: ${error.message}`);
    }
}

// Stats panel tab switching
document.addEventListener('DOMContentLoaded', () => {
    const statsTabs = document.querySelectorAll('.stats-tab-btn');
    const statsContents = document.querySelectorAll('.stats-tab-content');
    
    statsTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.statsTab;
            
            // Update tab buttons
            statsTabs.forEach(t => {
                t.classList.remove('active');
            });
            tab.classList.add('active');
            
            // Update tab contents
            statsContents.forEach(content => {
                if (content.dataset.statsContent === targetTab) {
                    content.style.display = 'block';
                } else {
                    content.style.display = 'none';
                }
            });
            
            // Load cached AI results when switching to AI Analysis tab
            if (targetTab === 'ai-analysis' && currentFilePath && window.aiSemanticAnalyzer) {
                loadAndDisplayCachedAIResults();
            }
        });
    });
});

// Load and display cached AI results
function loadAndDisplayCachedAIResults() {
    const cached = loadCachedAIAnalysisResults(currentFilePath);
    const aiTabContent = document.getElementById('aiAnalysisTabContent');
    
    if (cached && cached.results) {
        // Restore the similarSentences Map from the serialized array
        if (cached.similarSentencesArray && Array.isArray(cached.similarSentencesArray)) {
            window.aiSemanticAnalyzer.similarSentences = new Map(cached.similarSentencesArray);
        }
        
        // Display the cached results
        displayAIResultsInStatsPanel(cached.results, cached.timestamp);
        console.log('✓ Displayed cached AI analysis results');
    } else {
        // Clear AI analysis display if no cached results for this document
        if (aiTabContent) {
            aiTabContent.innerHTML = `
                <div class="placeholder-text">
                    <p>🤖 AI Semantic Analysis</p>
                    <p>Configure your AI provider above and click <strong>🚀 Analyze Document</strong> to find semantic patterns.</p>
                </div>
            `;
        }
        // Clear the similarSentences Map
        if (window.aiSemanticAnalyzer) {
            window.aiSemanticAnalyzer.similarSentences = new Map();
        }
        console.log('✓ Cleared AI analysis (no cached results for this document)');
    }
}

// Navigate to sentence in document
function navigateToSentenceInDocument(sentenceText) {
    try {
        const rawTextContent = document.getElementById('rawTextContent');
        const highlightedTextContent = document.getElementById('highlightedTextContent');
        
        if (!rawTextContent) {
            alert('Cannot navigate: document not loaded');
            return;
        }
        
        // Always switch to the Analyse tab first
        const highlightedTextBtn = document.getElementById('highlightedTextBtn');
        if (highlightedTextBtn) {
            highlightedTextBtn.click();
        }
        
        // Normalize text for better matching
        const normalizeText = (text) => {
            return text
                .replace(/\s+/g, ' ')  // Normalize whitespace
                .replace(/["'"'"]/g, '"')  // Normalize quotes
                .replace(/['']/g, "'")  // Normalize apostrophes
                .trim();
        };
        
        const normalizedSentence = normalizeText(sentenceText);
        const docText = normalizeText(rawTextContent.textContent);
        
        // Try exact match first
        let found = false;
        
        // Scroll to the sentence
        setTimeout(() => {
            const container = highlightedTextContent || rawTextContent;
            if (!container) return;
            
            // Try to find the text node containing this sentence
            const walker = document.createTreeWalker(
                container,
                NodeFilter.SHOW_TEXT,
                null
            );
            
            let node;
            let bestMatch = null;
            let bestMatchScore = 0;
            
            while (node = walker.nextNode()) {
                const nodeText = normalizeText(node.textContent);
                
                // Try exact match
                if (nodeText.includes(normalizedSentence)) {
                    found = true;
                    const element = node.parentElement;
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        
                        // Highlight temporarily
                        const originalBG = element.style.background;
                        element.style.background = '#ffeb3b';
                        element.style.transition = 'background 0.3s';
                        
                        setTimeout(() => {
                            element.style.background = originalBG;
                        }, 2000);
                    }
                    break;
                }
                
                // Try partial match (find the best match based on word overlap)
                const sentenceWords = normalizedSentence.split(' ').filter(w => w.length > 3);
                const nodeWords = nodeText.split(' ');
                const matchCount = sentenceWords.filter(w => nodeWords.includes(w)).length;
                const matchScore = matchCount / sentenceWords.length;
                
                if (matchScore > bestMatchScore && matchScore > 0.5) {
                    bestMatchScore = matchScore;
                    bestMatch = node.parentElement;
                }
            }
            
            // If no exact match but we have a good partial match, use it
            if (!found && bestMatch) {
                found = true;
                bestMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                const originalBG = bestMatch.style.background;
                bestMatch.style.background = '#ffc107';
                bestMatch.style.transition = 'background 0.3s';
                
                setTimeout(() => {
                    bestMatch.style.background = originalBG;
                }, 2000);
                
                setStatus(`⚠️ Approximate match found (${Math.round(bestMatchScore * 100)}% similarity)`);
            }
            
            // If still not found, show helpful message
            if (!found) {
                setStatus('❌ Sentence not found in document - text may have been modified or processed differently');
                console.log('Could not find sentence:', sentenceText);
            } else {
                setStatus('✅ Navigated to sentence');
            }
        }, 300);
        
    } catch (error) {
        console.error('Navigation error:', error);
        setStatus('❌ Failed to navigate to sentence');
    }
}