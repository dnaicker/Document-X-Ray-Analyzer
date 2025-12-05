class FiguresManager {
    constructor() {
        this.figures = [];
        this.transientFigures = [];
        this.currentFilePath = null;
        this.container = document.getElementById('figuresGrid');
        this.countDisplay = document.getElementById('figuresCount');
    }

    loadFiguresForFile(filePath) {
        console.log('=== loadFiguresForFile called ===');
        console.log('Previous file:', this.currentFilePath);
        console.log('New file:', filePath);
        
        this.currentFilePath = filePath;
        this.figures = [];
        this.transientFigures = []; // Clear transient figures when switching documents
        
        // Check if this is a non-PDF file (EPUB/DOCX) - don't load figures
        const isNonPDF = filePath && (filePath.toLowerCase().endsWith('.epub') || filePath.toLowerCase().endsWith('.docx'));
        
        if (isNonPDF) {
            console.log('✓ Non-PDF file detected - skipping figure loading');
            this.render();
            return;
        }
        
        try {
            const key = `figures_${filePath}`;
            console.log('Loading from localStorage key:', key);
            const stored = localStorage.getItem(key);
            if (stored) {
                this.figures = JSON.parse(stored);
                // Ensure all figures have a note field (migration for old data)
                this.figures = this.figures.map(fig => ({
                    ...fig,
                    note: fig.note || ''
                }));
                console.log(`✓ Loaded ${this.figures.length} figures for: ${filePath}`);
            } else {
                console.log('✓ No stored figures found for this document (clean slate)');
            }
        } catch (e) {
            console.error('Error loading figures:', e);
        }
        
        console.log('=== Rendering figures ===');
        this.render();
    }

    setCurrentFile(filePath) {
        // Allow manual setting of current file path
        if (filePath && filePath !== this.currentFilePath) {
            this.loadFiguresForFile(filePath);
        }
    }

    addFigure(figure) {
        // figure: { id, page, src, type: 'snip'|'scan', timestamp, note }
        if (!figure.id) figure.id = Date.now().toString();
        if (!figure.timestamp) figure.timestamp = Date.now();
        if (!figure.note) figure.note = '';
        
        if (!this.currentFilePath) {
            console.error('Cannot add figure: no document is currently loaded');
            console.error('currentFilePath:', this.currentFilePath);
            console.error('Please ensure loadFiguresForFile() was called');
            alert('Please open a document before adding figures.');
            return;
        }
        
        console.log(`Adding figure to document: ${this.currentFilePath}, page: ${figure.page}`);
        this.figures.push(figure);
        this.saveToStorage();
        this.render();
    }

    addTransient(figures) {
        this.transientFigures = figures;
        this.render();
    }

    clearTransient() {
        this.transientFigures = [];
        this.render();
    }

    deleteFigure(id) {
        const wasPersisted = this.figures.some(f => f.id === id);
        if (wasPersisted) {
            this.figures = this.figures.filter(f => f.id !== id);
            this.saveToStorage();
        } else {
            this.transientFigures = this.transientFigures.filter(f => f.id !== id);
        }
        this.render();
    }
    
    editNote(id) {
        const figure = this.figures.find(f => f.id === id) || this.transientFigures.find(f => f.id === id);
        if (!figure) return;
        
        this.showNoteDialog(figure);
    }
    
    showNoteDialog(figure) {
        const dialog = document.createElement('div');
        dialog.className = 'note-dialog-overlay';
        dialog.innerHTML = `
            <div class="note-dialog">
                <div class="note-dialog-header">
                    <h3>📝 Figure Note</h3>
                    <button class="note-dialog-close" onclick="this.closest('.note-dialog-overlay').remove()">×</button>
                </div>
                <div class="note-dialog-body">
                    <textarea id="figureNoteInput" class="note-dialog-textarea" placeholder="Add a note about this figure...">${this.escapeHtml(figure.note || '')}</textarea>
                </div>
                <div class="note-dialog-footer single-button">
                    <div class="note-dialog-footer-hint">Press Ctrl+Enter to save</div>
                    <div class="note-dialog-footer-actions">
                        <button class="btn-primary" id="saveFigureNote">💾 Save Note</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
        
        const textarea = dialog.querySelector('#figureNoteInput');
        const saveBtn = dialog.querySelector('#saveFigureNote');
        
        textarea.focus();
        
        // Save on Ctrl+Enter
        textarea.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                saveNote();
            }
        });
        
        const saveNote = () => {
            const noteText = textarea.value.trim();
            this.updateFigureNote(figure.id, noteText);
            dialog.remove();
        };
        
        saveBtn.addEventListener('click', saveNote);
    }
    
    updateFigureNote(id, note) {
        const persistedFigure = this.figures.find(f => f.id === id);
        if (persistedFigure) {
            persistedFigure.note = note;
            this.saveToStorage();
        } else {
            const transientFigure = this.transientFigures.find(f => f.id === id);
            if (transientFigure) {
                transientFigure.note = note;
            }
        }
        this.render();
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    openImageViewer(figure) {
        const viewer = document.createElement('div');
        viewer.className = 'image-viewer-overlay';
        viewer.innerHTML = `
            <div class="image-viewer-container">
                <div class="image-viewer-header">
                    <div class="image-viewer-title">
                        <span>🖼️ Page ${figure.page} ${figure.type === 'snip' ? '(Snipped)' : ''}</span>
                    </div>
                    <div class="image-viewer-controls">
                        <button class="image-viewer-btn" id="zoomOut" title="Zoom Out (-)">🔍−</button>
                        <span class="zoom-level">100%</span>
                        <button class="image-viewer-btn" id="zoomIn" title="Zoom In (+)">🔍+</button>
                        <button class="image-viewer-btn" id="resetZoom" title="Reset Zoom (0)">⟲</button>
                        <button class="image-viewer-btn" id="fitScreen" title="Fit to Screen (F)">⛶</button>
                        <button class="image-viewer-close" title="Close (Esc)">×</button>
                    </div>
                </div>
                <div class="image-viewer-content" id="imageViewerContent">
                    <img src="${figure.src}" class="viewer-image" id="viewerImage" draggable="false">
                </div>
                ${figure.note ? `<div class="image-viewer-note">${this.escapeHtml(figure.note)}</div>` : ''}
            </div>
        `;
        
        document.body.appendChild(viewer);
        
        let currentZoom = 1.0;
        const img = viewer.querySelector('#viewerImage');
        const content = viewer.querySelector('#imageViewerContent');
        const zoomDisplay = viewer.querySelector('.zoom-level');
        
        // Pan functionality
        let isDragging = false;
        let startX, startY, scrollLeft, scrollTop;
        
        content.addEventListener('mousedown', (e) => {
            if (e.target === img && currentZoom > 1) {
                isDragging = true;
                content.style.cursor = 'grabbing';
                startX = e.pageX - content.offsetLeft;
                startY = e.pageY - content.offsetTop;
                scrollLeft = content.scrollLeft;
                scrollTop = content.scrollTop;
            }
        });
        
        content.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const x = e.pageX - content.offsetLeft;
            const y = e.pageY - content.offsetTop;
            const walkX = (x - startX) * 2;
            const walkY = (y - startY) * 2;
            content.scrollLeft = scrollLeft - walkX;
            content.scrollTop = scrollTop - walkY;
        });
        
        content.addEventListener('mouseup', () => {
            isDragging = false;
            if (currentZoom > 1) {
                content.style.cursor = 'grab';
            } else {
                content.style.cursor = 'default';
            }
        });
        
        content.addEventListener('mouseleave', () => {
            isDragging = false;
            content.style.cursor = currentZoom > 1 ? 'grab' : 'default';
        });
        
        const updateZoom = (zoom) => {
            currentZoom = Math.max(0.25, Math.min(5, zoom));
            img.style.transform = `scale(${currentZoom})`;
            zoomDisplay.textContent = `${Math.round(currentZoom * 100)}%`;
            content.style.cursor = currentZoom > 1 ? 'grab' : 'default';
        };
        
        const fitToScreen = () => {
            const contentRect = content.getBoundingClientRect();
            const imgRect = img.getBoundingClientRect();
            const scaleX = contentRect.width / img.naturalWidth;
            const scaleY = contentRect.height / img.naturalHeight;
            const scale = Math.min(scaleX, scaleY, 1);
            updateZoom(scale);
        };
        
        // Button handlers
        viewer.querySelector('#zoomIn').addEventListener('click', () => updateZoom(currentZoom + 0.25));
        viewer.querySelector('#zoomOut').addEventListener('click', () => updateZoom(currentZoom - 0.25));
        viewer.querySelector('#resetZoom').addEventListener('click', () => updateZoom(1));
        viewer.querySelector('#fitScreen').addEventListener('click', fitToScreen);
        viewer.querySelector('.image-viewer-close').addEventListener('click', () => viewer.remove());
        
        // Click outside to close
        viewer.addEventListener('click', (e) => {
            if (e.target === viewer) viewer.remove();
        });
        
        // Keyboard shortcuts
        const handleKeyboard = (e) => {
            if (e.key === 'Escape') viewer.remove();
            else if (e.key === '+' || e.key === '=') updateZoom(currentZoom + 0.25);
            else if (e.key === '-') updateZoom(currentZoom - 0.25);
            else if (e.key === '0') updateZoom(1);
            else if (e.key === 'f' || e.key === 'F') fitToScreen();
        };
        document.addEventListener('keydown', handleKeyboard);
        
        // Mouse wheel zoom
        content.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            updateZoom(currentZoom + delta);
        }, { passive: false });
        
        // Clean up event listener when viewer is closed
        const observer = new MutationObserver((mutations) => {
            if (!document.body.contains(viewer)) {
                document.removeEventListener('keydown', handleKeyboard);
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true });
        
        // Initial fit to screen
        img.addEventListener('load', fitToScreen);
        if (img.complete) fitToScreen();
    }

    saveToStorage() {
        if (!this.currentFilePath) {
            console.warn('Cannot save figures: no currentFilePath set');
            return;
        }
        
        try {
            const key = `figures_${this.currentFilePath}`;
            localStorage.setItem(key, JSON.stringify(this.figures));
            console.log(`Saved ${this.figures.length} figures for: ${this.currentFilePath}`);
        } catch (e) {
            console.error('Error saving figures (storage quota might be full):', e);
            alert('Failed to save figure: Storage limit reached.');
        }
    }

    render() {
        if (!this.container) {
            this.container = document.getElementById('figuresGrid');
            this.countDisplay = document.getElementById('figuresCount');
        }
        if (!this.container) return;
        
        // Clear container
        this.container.innerHTML = '';
        
        const allFigures = [...this.figures, ...this.transientFigures];
        
        if (allFigures.length === 0) {
            this.container.innerHTML = `
                <div class="placeholder-text">
                    <p>🖼️ No figures yet</p>
                    <p style="font-size: 14px; color: #666;">Use the ✂️ <strong>Snip Tool</strong> in the PDF toolbar to capture charts and tables.</p>
                </div>
            `;
            if (this.countDisplay) this.countDisplay.textContent = '';
            return;
        }

        // Sort by page number
        const sortedFigures = allFigures.sort((a, b) => a.page - b.page);

        sortedFigures.forEach(fig => {
            const div = document.createElement('div');
            div.className = 'figure-card';
            div.title = `Go to Page ${fig.page}`;
            div.onclick = (e) => {
                // Prevent navigation if clicking action buttons
                if (e.target.closest('.delete-btn') || e.target.closest('.note-btn')) return;
                if (window.goToPage) window.goToPage(fig.page, false);
            };
            
            const hasNote = fig.note && fig.note.trim().length > 0;
            const notePreview = hasNote ? this.escapeHtml(fig.note.substring(0, 60) + (fig.note.length > 60 ? '...' : '')) : '';
            
            div.innerHTML = `
                <div class="figure-image-container">
                    <img src="${fig.src}" class="figure-image" loading="lazy" title="Click to view full size">
                    <div class="figure-actions">
                        <button class="view-btn" title="View full size">🔍</button>
                        <button class="note-btn ${hasNote ? 'has-note' : ''}" title="${hasNote ? 'Edit note' : 'Add note'}">📝</button>
                        <button class="delete-btn" title="Delete Figure">×</button>
                    </div>
                </div>
                <div class="figure-card-footer">
                    <div class="figure-page-info">Page ${fig.page} ${fig.type === 'snip' ? '(Snipped)' : ''}</div>
                    ${hasNote ? `<div class="figure-note-preview">${notePreview}</div>` : ''}
                </div>
            `;

            // Attach view handler (for both image and view button)
            const imgElement = div.querySelector('.figure-image');
            const viewBtn = div.querySelector('.view-btn');
            
            const openViewer = (e) => {
                e.stopPropagation();
                this.openImageViewer(fig);
            };
            
            if (imgElement) imgElement.onclick = openViewer;
            if (viewBtn) viewBtn.onclick = openViewer;
            
            // Attach note handler
            const noteBtn = div.querySelector('.note-btn');
            if (noteBtn) {
                noteBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.editNote(fig.id);
                };
            }

            // Attach delete handler
            const deleteBtn = div.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (confirm('Delete this figure?')) {
                        this.deleteFigure(fig.id);
                    }
                };
            }

            this.container.appendChild(div);
        });

        if (this.countDisplay) {
            const total = allFigures.length;
            const saved = this.figures.length;
            this.countDisplay.textContent = `${total} found (${saved} saved)`;
        }
    }
}

const figuresManager = new FiguresManager();
