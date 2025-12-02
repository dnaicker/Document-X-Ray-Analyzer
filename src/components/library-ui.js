// Library UI Component
class LibraryUI {
    constructor(libraryManager) {
        this.libraryManager = libraryManager;
        this.container = null;
        this.searchQuery = '';
        this.activeTagFilter = null;
        this.contextMenuTarget = null;
        
        // Listen for library updates
        document.addEventListener('library-updated', () => this.render());
    }
    
    initialize(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error('Library container not found:', containerId);
            return;
        }
        
        this.render();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Context menu
        document.addEventListener('click', () => this.hideContextMenu());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.showCreateFolderDialog();
            }
        });
    }
    
    render() {
        if (!this.container) return;
        
        const html = `
            <div class="library-container">
                <div class="library-header">
                    <h2>📚 My Library</h2>
                    <div class="library-actions">
                        <button class="btn-library" onclick="libraryUI.showCreateFolderDialog()" title="New Folder (Ctrl+N)">
                            ➕ New Folder
                        </button>
                        <button class="btn-library" onclick="libraryUI.showImportDialog()" title="Import Files">
                            📥 Import
                        </button>
                    </div>
                </div>
                
                <div class="library-search">
                    <input type="text" 
                           id="librarySearchInput" 
                           class="library-search-input" 
                           placeholder="🔍 Search files and folders..."
                           value="${this.escapeHtml(this.searchQuery)}">
                </div>
                
                ${this.renderTagFilter()}
                
                <div class="library-tree">
                    ${this.renderFolderTree()}
                </div>
                
                <div class="library-context-menu hidden" id="libraryContextMenu">
                    <!-- Context menu content -->
                </div>
            </div>
        `;
        
        this.container.innerHTML = html;
        
        // Setup search
        const searchInput = document.getElementById('librarySearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.render();
            });
        }
    }
    
    renderTagFilter() {
        const tags = this.libraryManager.getAllFolderTags();
        if (tags.length === 0) return '';
        
        return `
            <div class="library-tag-filter">
                <span class="tag-filter-label">🏷️ Filter:</span>
                ${tags.map(tag => `
                    <span class="library-tag-badge ${this.activeTagFilter === tag ? 'active' : ''}"
                          onclick="libraryUI.setTagFilter('${this.escapeHtml(tag)}')">
                        ${this.escapeHtml(tag)}
                    </span>
                `).join('')}
                ${this.activeTagFilter ? `
                    <span class="tag-filter-clear" onclick="libraryUI.setTagFilter(null)">✕ Clear</span>
                ` : ''}
            </div>
        `;
    }
    
    renderFolderTree() {
        const library = this.libraryManager.library;
        
        // Render in order
        return library.folderOrder.map(folderId => {
            const folder = library.folders[folderId];
            if (!folder) return '';
            
            // Apply search filter
            if (this.searchQuery) {
                const matchesSearch = folder.name.toLowerCase().includes(this.searchQuery.toLowerCase());
                const hasMatchingFiles = folder.files.some(filePath => {
                    const file = library.files[filePath];
                    return file && file.name.toLowerCase().includes(this.searchQuery.toLowerCase());
                });
                
                if (!matchesSearch && !hasMatchingFiles) return '';
            }
            
            // Apply tag filter
            if (this.activeTagFilter && !folder.tags.includes(this.activeTagFilter)) {
                return '';
            }
            
            return this.renderFolder(folder, 0);
        }).join('');
    }
    
    renderFolder(folder, depth) {
        const library = this.libraryManager.library;
        const indent = depth * 20;
        const hasChildren = folder.children && folder.children.length > 0;
        const expandIcon = hasChildren ? (folder.expanded ? '▼' : '▶') : '';
        const fileCount = folder.files ? folder.files.length : 0;
        
        let html = `
            <div class="library-folder ${folder.expanded ? 'expanded' : ''}" 
                 data-folder-id="${folder.id}"
                 style="padding-left: ${indent}px;">
                <div class="folder-header" 
                     onclick="libraryUI.toggleFolder('${folder.id}')"
                     oncontextmenu="libraryUI.showFolderContextMenu(event, '${folder.id}')">
                    ${hasChildren ? `<span class="folder-expand-icon">${expandIcon}</span>` : '<span class="folder-expand-icon" style="width: 16px;"></span>'}
                    <span class="folder-icon">${folder.icon}</span>
                    <span class="folder-name">${this.escapeHtml(folder.name)}</span>
                    <span class="folder-count">${fileCount}</span>
                    ${folder.tags && folder.tags.length > 0 ? `
                        <div class="folder-tags-inline">
                            ${folder.tags.slice(0, 2).map(tag => `
                                <span class="folder-tag-mini">${this.escapeHtml(tag)}</span>
                            `).join('')}
                            ${folder.tags.length > 2 ? `<span class="folder-tag-mini">+${folder.tags.length - 2}</span>` : ''}
                        </div>
                    ` : ''}
                </div>
                
                ${folder.expanded ? `
                    <div class="folder-content">
                        ${this.renderFolderFiles(folder)}
                        ${hasChildren ? folder.children.map(childId => {
                            const child = library.folders[childId];
                            return child ? this.renderFolder(child, depth + 1) : '';
                        }).join('') : ''}
                    </div>
                ` : ''}
            </div>
        `;
        
        return html;
    }
    
    renderFolderFiles(folder) {
        if (!folder.files || folder.files.length === 0) return '';
        
        const library = this.libraryManager.library;
        
        return folder.files.map(filePath => {
            const file = library.files[filePath];
            if (!file) return '';
            
            // Apply search filter
            if (this.searchQuery && !file.name.toLowerCase().includes(this.searchQuery.toLowerCase())) {
                return '';
            }
            
            const fileExt = file.name.split('.').pop().toLowerCase();
            const fileIcon = this.getFileIcon(fileExt);
            const lastOpened = file.lastOpened ? new Date(file.lastOpened).toLocaleDateString() : 'Never';
            
            return `
                <div class="library-file" 
                     data-file-path="${this.escapeHtml(file.path)}"
                     onclick="libraryUI.openFile('${this.escapeHtml(file.path)}')"
                     oncontextmenu="libraryUI.showFileContextMenu(event, '${this.escapeHtml(file.path)}')">
                    <span class="file-icon">${fileIcon}</span>
                    <div class="file-info">
                        <div class="file-name">${this.escapeHtml(file.name)}</div>
                        <div class="file-meta">
                            Last opened: ${lastOpened}
                            ${file.tags && file.tags.length > 0 ? `
                                · ${file.tags.map(tag => `<span class="file-tag-mini">${this.escapeHtml(tag)}</span>`).join(' ')}
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    getFileIcon(extension) {
        const icons = {
            'pdf': '📕',
            'epub': '📘',
            'docx': '📄',
            'doc': '📄',
            'txt': '📝',
            'md': '📝'
        };
        return icons[extension] || '📄';
    }
    
    // ========== FOLDER ACTIONS ==========
    
    toggleFolder(folderId) {
        this.libraryManager.toggleFolderExpanded(folderId);
    }
    
    showCreateFolderDialog(parentId = 'root') {
        const dialog = document.createElement('div');
        dialog.className = 'note-dialog-overlay';
        dialog.innerHTML = `
            <div class="note-dialog" style="max-width: 400px;">
                <div class="note-dialog-header">
                    <h3>➕ Create New Folder</h3>
                    <button class="note-dialog-close" onclick="this.closest('.note-dialog-overlay').remove()">×</button>
                </div>
                <div class="note-dialog-body">
                    <div class="form-group">
                        <label>Folder Name:</label>
                        <input type="text" id="newFolderName" class="tag-input" placeholder="Enter folder name..." autofocus>
                    </div>
                    <div class="form-group">
                        <label>Icon (emoji):</label>
                        <div class="icon-picker">
                            ${['📁', '📂', '📚', '📖', '📕', '📘', '📗', '📙', '🗂️', '📋', '📊', '🔬', '🎓', '💼', '🏢', '🌍'].map(icon => `
                                <button class="icon-option" data-icon="${icon}" onclick="libraryUI.selectIcon(this)">${icon}</button>
                            `).join('')}
                        </div>
                        <input type="hidden" id="selectedIcon" value="📁">
                    </div>
                </div>
                <div class="note-dialog-footer">
                    <button class="btn-secondary" onclick="this.closest('.note-dialog-overlay').remove()">Cancel</button>
                    <button class="btn-primary" onclick="libraryUI.createFolder('${parentId}')">Create</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
        
        setTimeout(() => document.getElementById('newFolderName').focus(), 100);
    }
    
    selectIcon(button) {
        // Remove active class from all
        document.querySelectorAll('.icon-option').forEach(btn => btn.classList.remove('active'));
        // Add to clicked
        button.classList.add('active');
        // Update hidden input
        document.getElementById('selectedIcon').value = button.dataset.icon;
    }
    
    createFolder(parentId) {
        const nameInput = document.getElementById('newFolderName');
        const iconInput = document.getElementById('selectedIcon');
        
        const name = nameInput.value.trim();
        if (!name) {
            alert('Please enter a folder name');
            return;
        }
        
        const icon = iconInput.value || '📁';
        
        this.libraryManager.createFolder(name, parentId, icon);
        
        // Close dialog
        document.querySelector('.note-dialog-overlay').remove();
    }
    
    showFolderContextMenu(event, folderId) {
        event.preventDefault();
        event.stopPropagation();
        
        this.contextMenuTarget = { type: 'folder', id: folderId };
        const folder = this.libraryManager.getFolder(folderId);
        
        const menu = document.getElementById('libraryContextMenu');
        if (!menu) return;
        
        menu.innerHTML = `
            <div class="context-menu-item" onclick="libraryUI.showCreateFolderDialog('${folderId}')">
                ➕ New Subfolder
            </div>
            <div class="context-menu-item" onclick="libraryUI.showRenameFolderDialog('${folderId}')">
                ✏️ Rename
            </div>
            <div class="context-menu-item" onclick="libraryUI.showFolderTagsDialog('${folderId}')">
                🏷️ Manage Tags
            </div>
            ${folder.type !== 'library' && folder.type !== 'special' ? `
                <div class="context-menu-divider"></div>
                <div class="context-menu-item danger" onclick="libraryUI.deleteFolder('${folderId}')">
                    🗑️ Delete Folder
                </div>
            ` : ''}
        `;
        
        menu.classList.remove('hidden');
        menu.style.left = event.clientX + 'px';
        menu.style.top = event.clientY + 'px';
    }
    
    showFileContextMenu(event, filePath) {
        event.preventDefault();
        event.stopPropagation();
        
        this.contextMenuTarget = { type: 'file', path: filePath };
        
        const menu = document.getElementById('libraryContextMenu');
        if (!menu) return;
        
        menu.innerHTML = `
            <div class="context-menu-item" onclick="libraryUI.openFile('${this.escapeHtml(filePath)}')">
                📂 Open
            </div>
            <div class="context-menu-item" onclick="libraryUI.showMoveFileDialog('${this.escapeHtml(filePath)}')">
                📁 Move to Folder
            </div>
            <div class="context-menu-item" onclick="libraryUI.showFileTagsDialog('${this.escapeHtml(filePath)}')">
                🏷️ Manage Tags
            </div>
            <div class="context-menu-divider"></div>
            <div class="context-menu-item danger" onclick="libraryUI.moveFileToTrash('${this.escapeHtml(filePath)}')">
                🗑️ Move to Trash
            </div>
        `;
        
        menu.classList.remove('hidden');
        menu.style.left = event.clientX + 'px';
        menu.style.top = event.clientY + 'px';
    }
    
    hideContextMenu() {
        const menu = document.getElementById('libraryContextMenu');
        if (menu) menu.classList.add('hidden');
    }
    
    showRenameFolderDialog(folderId) {
        const folder = this.libraryManager.getFolder(folderId);
        if (!folder) return;
        
        const newName = prompt('Rename folder:', folder.name);
        if (newName && newName.trim()) {
            this.libraryManager.renameFolder(folderId, newName.trim());
        }
    }
    
    deleteFolder(folderId) {
        const folder = this.libraryManager.getFolder(folderId);
        if (!folder) return;
        
        if (confirm(`Delete folder "${folder.name}"? Files will be moved to Unfiled Items.`)) {
            this.libraryManager.deleteFolder(folderId);
        }
    }
    
    showFolderTagsDialog(folderId) {
        const folder = this.libraryManager.getFolder(folderId);
        if (!folder) return;
        
        const existingTags = folder.tags || [];
        const allTags = this.libraryManager.getAllFolderTags();
        const suggestedTags = allTags.filter(t => !existingTags.includes(t));
        
        const dialog = document.createElement('div');
        dialog.className = 'note-dialog-overlay';
        dialog.innerHTML = `
            <div class="note-dialog" style="max-width: 400px;">
                <div class="note-dialog-header">
                    <h3>🏷️ Folder Tags</h3>
                    <button class="note-dialog-close" onclick="this.closest('.note-dialog-overlay').remove()">×</button>
                </div>
                <div class="note-dialog-body">
                    <div class="tag-input-container">
                        <input type="text" id="folderTagInput" class="tag-input" placeholder="Type a tag and press Enter...">
                    </div>
                    ${existingTags.length > 0 ? `
                        <div class="current-tags-section">
                            <label>Current tags:</label>
                            <div class="current-tags-list" id="currentFolderTags">
                                ${existingTags.map(tag => `
                                    <span class="tag-badge">
                                        ${this.escapeHtml(tag)}
                                        <button class="tag-remove-btn" onclick="libraryUI.removeFolderTag('${folderId}', '${this.escapeHtml(tag)}', this)">×</button>
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    ` : '<div id="currentFolderTags"></div>'}
                    ${suggestedTags.length > 0 ? `
                        <div class="suggested-tags-section">
                            <label>Suggested:</label>
                            <div class="suggested-tags-list">
                                ${suggestedTags.map(tag => `
                                    <span class="tag-badge suggested" onclick="libraryUI.addFolderTag('${folderId}', '${this.escapeHtml(tag)}', this)">${this.escapeHtml(tag)}</span>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="note-dialog-footer">
                    <button class="btn-secondary" onclick="this.closest('.note-dialog-overlay').remove()">Done</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
        
        const input = document.getElementById('folderTagInput');
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const tag = input.value.trim();
                if (tag) {
                    this.addFolderTag(folderId, tag);
                    input.value = '';
                }
            }
        });
        
        setTimeout(() => input.focus(), 100);
    }
    
    addFolderTag(folderId, tag, element) {
        if (this.libraryManager.addTagToFolder(folderId, tag)) {
            // Remove from suggestions if present
            if (element) element.remove();
            
            // Add to current tags
            const container = document.getElementById('currentFolderTags');
            if (container) {
                const badge = document.createElement('span');
                badge.className = 'tag-badge';
                badge.innerHTML = `${this.escapeHtml(tag)} <button class="tag-remove-btn" onclick="libraryUI.removeFolderTag('${folderId}', '${this.escapeHtml(tag)}', this.parentElement)">×</button>`;
                container.appendChild(badge);
            }
        }
    }
    
    removeFolderTag(folderId, tag, element) {
        if (this.libraryManager.removeTagFromFolder(folderId, tag)) {
            if (element) element.remove();
        }
    }
    
    // ========== FILE ACTIONS ==========
    
    openFile(filePath) {
        this.libraryManager.updateFileLastOpened(filePath);
        
        // Trigger file open in main app
        if (window.openFileFromLibrary) {
            window.openFileFromLibrary(filePath);
        }
    }
    
    showMoveFileDialog(filePath) {
        // Simple implementation - could be enhanced with tree picker
        const folders = Object.values(this.libraryManager.library.folders)
            .filter(f => f.type !== 'special' || f.id === 'unfiled');
        
        const dialog = document.createElement('div');
        dialog.className = 'note-dialog-overlay';
        dialog.innerHTML = `
            <div class="note-dialog" style="max-width: 400px;">
                <div class="note-dialog-header">
                    <h3>📁 Move File</h3>
                    <button class="note-dialog-close" onclick="this.closest('.note-dialog-overlay').remove()">×</button>
                </div>
                <div class="note-dialog-body">
                    <label>Select destination folder:</label>
                    <select id="moveToFolderId" class="folder-select" style="width: 100%; padding: 10px; margin-top: 10px; border: 2px solid #e0e0e0; border-radius: 6px;">
                        ${folders.map(f => `
                            <option value="${f.id}">${f.icon} ${this.escapeHtml(this.libraryManager.getFolderPath(f.id))}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="note-dialog-footer">
                    <button class="btn-secondary" onclick="this.closest('.note-dialog-overlay').remove()">Cancel</button>
                    <button class="btn-primary" onclick="libraryUI.moveFile('${this.escapeHtml(filePath)}')">Move</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
    }
    
    moveFile(filePath) {
        const select = document.getElementById('moveToFolderId');
        if (select) {
            this.libraryManager.moveFileToFolder(filePath, select.value);
            document.querySelector('.note-dialog-overlay').remove();
        }
    }
    
    moveFileToTrash(filePath) {
        if (confirm('Move file to trash?')) {
            this.libraryManager.moveFileToFolder(filePath, 'trash');
        }
    }
    
    showFileTagsDialog(filePath) {
        // Similar to folder tags dialog
        const file = this.libraryManager.getFile(filePath);
        if (!file) return;
        
        const existingTags = file.tags || [];
        
        const dialog = document.createElement('div');
        dialog.className = 'note-dialog-overlay';
        dialog.innerHTML = `
            <div class="note-dialog" style="max-width: 400px;">
                <div class="note-dialog-header">
                    <h3>🏷️ File Tags</h3>
                    <button class="note-dialog-close" onclick="this.closest('.note-dialog-overlay').remove()">×</button>
                </div>
                <div class="note-dialog-body">
                    <div class="tag-input-container">
                        <input type="text" id="fileTagInput" class="tag-input" placeholder="Type a tag and press Enter...">
                    </div>
                    <div class="current-tags-list" id="currentFileTags">
                        ${existingTags.map(tag => `
                            <span class="tag-badge">
                                ${this.escapeHtml(tag)}
                                <button class="tag-remove-btn" onclick="libraryUI.removeFileTag('${this.escapeHtml(filePath)}', '${this.escapeHtml(tag)}', this)">×</button>
                            </span>
                        `).join('')}
                    </div>
                </div>
                <div class="note-dialog-footer">
                    <button class="btn-secondary" onclick="this.closest('.note-dialog-overlay').remove()">Done</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
        
        const input = document.getElementById('fileTagInput');
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const tag = input.value.trim();
                if (tag) {
                    this.addFileTag(filePath, tag);
                    input.value = '';
                }
            }
        });
        
        setTimeout(() => input.focus(), 100);
    }
    
    addFileTag(filePath, tag) {
        if (this.libraryManager.addTagToFile(filePath, tag)) {
            const container = document.getElementById('currentFileTags');
            if (container) {
                const badge = document.createElement('span');
                badge.className = 'tag-badge';
                badge.innerHTML = `${this.escapeHtml(tag)} <button class="tag-remove-btn" onclick="libraryUI.removeFileTag('${this.escapeHtml(filePath)}', '${this.escapeHtml(tag)}', this.parentElement)">×</button>`;
                container.appendChild(badge);
            }
        }
    }
    
    removeFileTag(filePath, tag, element) {
        if (this.libraryManager.removeTagFromFile(filePath, tag)) {
            if (element) element.remove();
        }
    }
    
    showImportDialog() {
        // Trigger file picker
        if (window.openFileBtn) {
            window.openFileBtn.click();
        }
    }
    
    setTagFilter(tag) {
        if (this.activeTagFilter === tag) {
            this.activeTagFilter = null;
        } else {
            this.activeTagFilter = tag;
        }
        this.render();
    }
    
    // ========== UTILITIES ==========
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize Library UI (will be called after DOM is ready)
let libraryUI;

