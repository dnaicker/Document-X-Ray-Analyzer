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
                    <img src="${fig.src}" class="figure-image" loading="lazy">
                    <div class="figure-actions">
                        <button class="note-btn ${hasNote ? 'has-note' : ''}" title="${hasNote ? 'Edit note' : 'Add note'}">📝</button>
                        <button class="delete-btn" title="Delete Figure">×</button>
                    </div>
                </div>
                <div class="figure-card-footer">
                    <div class="figure-page-info">Page ${fig.page} ${fig.type === 'snip' ? '(Snipped)' : ''}</div>
                    ${hasNote ? `<div class="figure-note-preview">${notePreview}</div>` : ''}
                </div>
            `;

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
