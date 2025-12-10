/**
 * PanelManager - Manages floating panels for tab content
 */

class PanelManager {
    constructor() {
        this.panels = new Map();
        this.panelCounter = 0;
        this.activePanel = null;
        this.dragState = null;
        this.resizeState = null;
        
        // Create overlay for better drag/resize performance
        this.overlay = document.createElement('div');
        this.overlay.className = 'panel-overlay';
        document.body.appendChild(this.overlay);
        
        // Bind event handlers
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
    }
    
    /**
     * Create a new floating panel
     * @param {Object} config - Panel configuration
     * @param {string} config.title - Panel title
     * @param {string} config.type - Panel type (highlight, notes, translate, map, mindmap, figures)
     * @param {HTMLElement} config.content - Content to display in panel
     * @param {number} config.width - Initial width
     * @param {number} config.height - Initial height
     * @returns {string} Panel ID
     */
    createPanel({ title, type, content, width = 800, height = 600 }) {
        const panelId = `panel-${this.panelCounter++}`;
        
        // Create panel element
        const panel = document.createElement('div');
        panel.className = 'floating-panel';
        panel.id = panelId;
        panel.dataset.type = type;
        
        // Position panel (cascade)
        const offset = this.panels.size * 30;
        panel.style.left = `${100 + offset}px`;
        panel.style.top = `${80 + offset}px`;
        panel.style.width = `${width}px`;
        panel.style.height = `${height}px`;
        
        // Create panel header
        const header = document.createElement('div');
        header.className = 'panel-header-bar';
        header.innerHTML = `
            <div class="panel-title">${title}</div>
            <div class="panel-controls">
                <button class="panel-control-btn minimize-btn" title="Minimize">─</button>
                <button class="panel-control-btn close-btn" title="Close">×</button>
            </div>
        `;
        
        // Create panel body
        const body = document.createElement('div');
        body.className = 'panel-body';
        
        // Clone or move content
        if (content) {
            if (content instanceof HTMLElement) {
                // Clone the content to preserve the original
                const clone = this.cloneViewContent(type, content);
                body.appendChild(clone);
            } else if (typeof content === 'string') {
                body.innerHTML = content;
            }
        }
        
        // Create resizers
        const resizerRight = document.createElement('div');
        resizerRight.className = 'panel-resizer right';
        
        const resizerBottom = document.createElement('div');
        resizerBottom.className = 'panel-resizer bottom';
        
        const resizerCorner = document.createElement('div');
        resizerCorner.className = 'panel-resizer corner';
        
        // Assemble panel
        panel.appendChild(header);
        panel.appendChild(body);
        panel.appendChild(resizerRight);
        panel.appendChild(resizerBottom);
        panel.appendChild(resizerCorner);
        
        // Add to DOM
        document.body.appendChild(panel);
        
        // Store panel reference
        this.panels.set(panelId, {
            element: panel,
            type: type,
            minimized: false,
            originalHeight: height
        });
        
        // Add event listeners
        this.attachPanelEvents(panelId, header, resizerRight, resizerBottom, resizerCorner);
        
        // Bring to front
        this.bringToFront(panelId);
        
        // Initialize content based on type
        this.initializePanelContent(panelId, type, body);
        
        return panelId;
    }
    
    /**
     * Clone view content for a panel
     */
    cloneViewContent(type, sourceElement) {
        const container = document.createElement('div');
        container.className = 'panel-content-wrapper';
        container.style.height = '100%';
        container.style.overflow = 'auto';
        
        // Clone the content
        const clone = sourceElement.cloneNode(true);
        clone.id = `${sourceElement.id}-panel`;
        clone.classList.remove('text-view');
        clone.style.display = 'block';
        clone.style.height = '100%';
        
        container.appendChild(clone);
        return container;
    }
    
    /**
     * Initialize panel content based on type
     */
    initializePanelContent(panelId, type, body) {
        const panelData = this.panels.get(panelId);
        if (!panelData) return;
        
        // Handle special initialization for different panel types
        switch(type) {
            case 'mindmap':
                // Initialize mindmap in panel
                setTimeout(() => {
                    if (window.mindmapManager) {
                        window.mindmapManager.refreshData();
                    }
                }, 100);
                break;
                
            case 'map':
                // Render map in panel
                setTimeout(() => {
                    if (typeof renderMap === 'function') {
                        renderMap().catch(err => console.error('Error rendering map in panel:', err));
                    }
                }, 100);
                break;
                
            case 'translate':
                // Update translation UI
                setTimeout(() => {
                    if (typeof updateCachedTranslationsUI === 'function') {
                        updateCachedTranslationsUI();
                    }
                }, 100);
                break;
                
            case 'notes':
                // Refresh notes
                setTimeout(() => {
                    if (window.notesManager) {
                        window.notesManager.render(true);
                    }
                }, 100);
                break;
                
            case 'highlighted':
                // Apply highlights
                setTimeout(() => {
                    if (window.notesManager) {
                        window.notesManager.applyHighlights();
                    }
                }, 100);
                break;
                
            case 'figures':
                // Render figures
                setTimeout(() => {
                    if (window.figuresManager) {
                        window.figuresManager.render();
                    }
                }, 100);
                break;
        }
    }
    
    /**
     * Attach event handlers to panel
     */
    attachPanelEvents(panelId, header, resizerRight, resizerBottom, resizerCorner) {
        const panelData = this.panels.get(panelId);
        if (!panelData) return;
        
        const panel = panelData.element;
        
        // Dragging
        header.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('panel-control-btn')) return;
            this.startDragging(panelId, e);
        });
        
        // Resizing
        resizerRight.addEventListener('mousedown', (e) => this.startResizing(panelId, 'right', e));
        resizerBottom.addEventListener('mousedown', (e) => this.startResizing(panelId, 'bottom', e));
        resizerCorner.addEventListener('mousedown', (e) => this.startResizing(panelId, 'corner', e));
        
        // Panel controls
        const minimizeBtn = panel.querySelector('.minimize-btn');
        const closeBtn = panel.querySelector('.close-btn');
        
        minimizeBtn.addEventListener('click', () => this.toggleMinimize(panelId));
        closeBtn.addEventListener('click', () => this.closePanel(panelId));
        
        // Bring to front on click
        panel.addEventListener('mousedown', () => this.bringToFront(panelId));
    }
    
    /**
     * Start dragging a panel
     */
    startDragging(panelId, e) {
        const panelData = this.panels.get(panelId);
        if (!panelData) return;
        
        const panel = panelData.element;
        const rect = panel.getBoundingClientRect();
        
        this.dragState = {
            panelId: panelId,
            startX: e.clientX,
            startY: e.clientY,
            panelLeft: rect.left,
            panelTop: rect.top
        };
        
        this.overlay.classList.add('active');
        panel.style.transition = 'none';
        
        e.preventDefault();
    }
    
    /**
     * Start resizing a panel
     */
    startResizing(panelId, direction, e) {
        const panelData = this.panels.get(panelId);
        if (!panelData) return;
        
        const panel = panelData.element;
        const rect = panel.getBoundingClientRect();
        
        this.resizeState = {
            panelId: panelId,
            direction: direction,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: rect.width,
            startHeight: rect.height,
            startLeft: rect.left,
            startTop: rect.top
        };
        
        this.overlay.classList.add('active');
        panel.style.transition = 'none';
        
        e.preventDefault();
        e.stopPropagation();
    }
    
    /**
     * Handle mouse move for dragging/resizing
     */
    handleMouseMove(e) {
        if (this.dragState) {
            const { panelId, startX, startY, panelLeft, panelTop } = this.dragState;
            const panelData = this.panels.get(panelId);
            if (!panelData) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const panel = panelData.element;
            panel.style.left = `${panelLeft + deltaX}px`;
            panel.style.top = `${panelTop + deltaY}px`;
        }
        
        if (this.resizeState) {
            const { panelId, direction, startX, startY, startWidth, startHeight } = this.resizeState;
            const panelData = this.panels.get(panelId);
            if (!panelData) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const panel = panelData.element;
            
            if (direction === 'right' || direction === 'corner') {
                const newWidth = Math.max(400, startWidth + deltaX);
                panel.style.width = `${newWidth}px`;
            }
            
            if (direction === 'bottom' || direction === 'corner') {
                const newHeight = Math.max(300, startHeight + deltaY);
                panel.style.height = `${newHeight}px`;
                panelData.originalHeight = newHeight;
            }
        }
    }
    
    /**
     * Handle mouse up (stop dragging/resizing)
     */
    handleMouseUp(e) {
        if (this.dragState || this.resizeState) {
            this.overlay.classList.remove('active');
            
            if (this.dragState) {
                const panelData = this.panels.get(this.dragState.panelId);
                if (panelData) {
                    panelData.element.style.transition = '';
                }
            }
            
            if (this.resizeState) {
                const panelData = this.panels.get(this.resizeState.panelId);
                if (panelData) {
                    panelData.element.style.transition = '';
                }
            }
            
            this.dragState = null;
            this.resizeState = null;
        }
    }
    
    /**
     * Toggle panel minimize state
     */
    toggleMinimize(panelId) {
        const panelData = this.panels.get(panelId);
        if (!panelData) return;
        
        const panel = panelData.element;
        const minimizeBtn = panel.querySelector('.minimize-btn');
        
        if (panelData.minimized) {
            // Restore
            panel.classList.remove('minimized');
            panel.style.height = `${panelData.originalHeight}px`;
            minimizeBtn.textContent = '─';
            minimizeBtn.title = 'Minimize';
            panelData.minimized = false;
        } else {
            // Minimize
            panelData.originalHeight = parseInt(panel.style.height);
            panel.classList.add('minimized');
            minimizeBtn.textContent = '□';
            minimizeBtn.title = 'Restore';
            panelData.minimized = true;
        }
    }
    
    /**
     * Close a panel
     */
    closePanel(panelId) {
        const panelData = this.panels.get(panelId);
        if (!panelData) return;
        
        // Fade out animation
        panelData.element.style.opacity = '0';
        
        setTimeout(() => {
            panelData.element.remove();
            this.panels.delete(panelId);
        }, 200);
    }
    
    /**
     * Bring panel to front
     */
    bringToFront(panelId) {
        const panelData = this.panels.get(panelId);
        if (!panelData) return;
        
        // Reset all panels z-index
        this.panels.forEach((data, id) => {
            data.element.style.zIndex = id === panelId ? 10000 : 9999;
        });
        
        this.activePanel = panelId;
    }
    
    /**
     * Get current view content for creating panel
     */
    getViewContent(type) {
        const viewMap = {
            'highlighted': document.getElementById('highlightedTextView'),
            'notes': document.getElementById('notesView'),
            'translate': document.getElementById('translateView'),
            'map': document.getElementById('mapView'),
            'mindmap': document.getElementById('mindmapView'),
            'figures': document.getElementById('figuresView')
        };
        
        return viewMap[type] || null;
    }
    
    /**
     * Get title for panel based on type
     */
    getTitle(type) {
        const titles = {
            'highlighted': 'Analyse',
            'notes': '📌 Notes',
            'translate': '🌐 Translate',
            'map': '🗺️ Map',
            'mindmap': '🧠 Mindmap',
            'figures': '🖼️ Figures'
        };
        
        return titles[type] || 'Panel';
    }
    
    /**
     * Open a panel for a specific tab type
     */
    openTabPanel(type) {
        const content = this.getViewContent(type);
        const title = this.getTitle(type);
        
        if (!content) {
            console.error(`No content found for type: ${type}`);
            return;
        }
        
        // Check if panel of this type already exists
        const existingPanel = Array.from(this.panels.entries())
            .find(([id, data]) => data.type === type);
        
        if (existingPanel) {
            // Bring existing panel to front
            this.bringToFront(existingPanel[0]);
            return existingPanel[0];
        }
        
        // Create new panel
        return this.createPanel({
            title: title,
            type: type,
            content: content,
            width: type === 'mindmap' || type === 'map' ? 900 : 800,
            height: type === 'mindmap' || type === 'map' ? 700 : 600
        });
    }
    
    /**
     * Close all panels
     */
    closeAllPanels() {
        const panelIds = Array.from(this.panels.keys());
        panelIds.forEach(id => this.closePanel(id));
    }
}

// Export for use in renderer
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PanelManager;
}

