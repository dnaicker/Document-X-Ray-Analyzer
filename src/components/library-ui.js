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
        
        // Check if this is initial render
        const isInitialRender = !this.container.querySelector('.library-container');
        
        if (isInitialRender) {
            const html = `
                <div class="library-container">
                    <div class="library-header">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h2>📚 My Library</h2>
                        </div>
                        <div class="library-actions">
                            <button class="btn-library" onclick="libraryUI.showCreateFolderDialog()" title="New Folder (Ctrl+N)">
                                ➕ Folder
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
                               value="">
                    </div>
                    
                    <div id="libraryTagFilter" class="library-tag-filter-container">
                        ${this.renderTagFilter()}
                    </div>
                    
                    <div class="library-tree" id="libraryTree">
                        ${this.renderFolderTree()}
                    </div>
                    
                    <div class="library-context-menu hidden" id="libraryContextMenu">
                        <!-- Context menu content -->
                    </div>
                </div>
            `;
            
            this.container.innerHTML = html;
            
            // Setup search listener (only once)
            const searchInput = document.getElementById('librarySearchInput');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.searchQuery = e.target.value;
                    console.log('Search query updated:', this.searchQuery);
                    this.updateTreeAndFilters();
                });
            }
        } else {
            // Just update the tree and filters without re-rendering search input
            this.updateTreeAndFilters();
        }
    }
    
    updateTreeAndFilters() {
        // Update tag filter
        const tagFilterContainer = document.getElementById('libraryTagFilter');
        if (tagFilterContainer) {
            tagFilterContainer.innerHTML = this.renderTagFilter();
        }
        
        // Update tree
        const treeContainer = document.getElementById('libraryTree');
        if (treeContainer) {
            treeContainer.innerHTML = this.renderFolderTree();
        }
    }
    
    renderTagFilter() {
        const tags = this.libraryManager.getAllTags(); // Get both folder and file tags
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
    
    folderMatchesSearch(folder, query) {
        const library = this.libraryManager.library;
        
        // Check folder itself
        const matchesFolderName = folder.name.toLowerCase().includes(query);
        const matchesFolderTags = folder.tags && folder.tags.some(tag => {
            const tagName = typeof tag === 'string' ? tag : tag.name;
            return tagName.toLowerCase().includes(query);
        });
        
        // Check files in this folder
        const hasMatchingFiles = folder.files && folder.files.some(filePath => {
            const file = library.files[filePath];
            if (!file) return false;
            const matchesFileName = file.name.toLowerCase().includes(query);
            const matchesFileTags = file.tags && file.tags.some(tag => {
                const tagName = typeof tag === 'string' ? tag : tag.name;
                return tagName.toLowerCase().includes(query);
            });
            return matchesFileName || matchesFileTags;
        });
        
        // Check children recursively
        const hasMatchingChildren = folder.children && folder.children.some(childId => {
            const child = library.folders[childId];
            return child ? this.folderMatchesSearch(child, query) : false;
        });
        
        return matchesFolderName || matchesFolderTags || hasMatchingFiles || hasMatchingChildren;
    }
    
    renderFolderTree() {
        const library = this.libraryManager.library;
        
        // Render in order
        return library.folderOrder.map(folderId => {
            const folder = library.folders[folderId];
            if (!folder) return '';
            
            // Apply search filter (takes priority over tag filter)
            if (this.searchQuery && this.searchQuery.trim()) {
                const query = this.searchQuery.toLowerCase().trim();
                
                // Use recursive helper to check if folder or any descendants match
                const matches = this.folderMatchesSearch(folder, query);
                
                console.log(`Folder "${folder.name}": matches=${matches}, query="${query}"`);
                
                if (!matches) return '';
            }
            // Apply tag filter only when NOT searching
            else if (this.activeTagFilter) {
                const folderTagNames = folder.tags ? folder.tags.map(t => this.libraryManager.getTagName(t).toLowerCase()) : [];
                const hasFolderTag = folderTagNames.includes(this.activeTagFilter);
                
                // Check if any files in this folder have the tag
                const hasFileWithTag = folder.files && folder.files.some(filePath => {
                    const file = library.files[filePath];
                    if (!file || !file.tags) return false;
                    const fileTagNames = file.tags.map(t => {
                        const tagName = typeof t === 'string' ? t : t.name;
                        return tagName.toLowerCase();
                    });
                    return fileTagNames.includes(this.activeTagFilter);
                });
                
                if (!hasFolderTag && !hasFileWithTag) {
                    return '';
                }
            }
            
            return this.renderFolder(folder, 0);
        }).join('');
    }
    
    renderFolder(folder, depth) {
        const library = this.libraryManager.library;
        const indent = depth * 20;
        const hasChildren = folder.children && folder.children.length > 0;
        
        // When searching, auto-expand folders that have matching descendants
        let shouldExpand = folder.expanded;
        if (this.searchQuery && this.searchQuery.trim() && hasChildren) {
            const query = this.searchQuery.toLowerCase().trim();
            // Check if any children match
            const hasMatchingDescendants = folder.children.some(childId => {
                const child = library.folders[childId];
                return child ? this.folderMatchesSearch(child, query) : false;
            });
            if (hasMatchingDescendants) {
                shouldExpand = true;
            }
        }
        
        const expandIcon = hasChildren ? (shouldExpand ? '▼' : '▶') : '';
        const fileCount = folder.files ? folder.files.length : 0;
        
        let html = `
            <div class="library-folder ${shouldExpand ? 'expanded' : ''}" 
                 data-folder-id="${folder.id}"
                 style="padding-left: ${indent}px;">
                <div class="folder-header folder-drop-target" 
                     data-folder-id="${folder.id}"
                     onclick="libraryUI.toggleFolder('${folder.id}')"
                     oncontextmenu="libraryUI.showFolderContextMenu(event, '${folder.id}')"
                     ondragover="libraryUI.handleDragOver(event)"
                     ondragleave="libraryUI.handleDragLeave(event)"
                     ondrop="libraryUI.handleDrop(event, '${folder.id}')">
                    ${hasChildren ? `<span class="folder-expand-icon">${expandIcon}</span>` : '<span class="folder-expand-icon" style="width: 12px;"></span>'}
                    <span class="folder-icon">${folder.icon}</span>
                    <span class="folder-name">${this.escapeHtml(folder.name)}</span>
                    <span class="folder-count">${fileCount}</span>
                    ${folder.tags && folder.tags.length > 0 ? (() => {
                        const allTagNames = folder.tags.map(t => this.libraryManager.getTagName(t));
                        const tooltipText = `Tags: ${allTagNames.join(', ')}`;
                        return `
                            <div class="folder-tags-inline" title="${this.escapeHtml(tooltipText)}">
                                ${folder.tags.slice(0, 2).map(tag => {
                                    const tagName = this.libraryManager.getTagName(tag);
                                    const tagColor = this.libraryManager.getTagColor(tag);
                                    return `<span class="folder-tag-mini tag-${tagColor}">${this.escapeHtml(tagName)}</span>`;
                                }).join('')}
                                ${folder.tags.length > 2 ? `<span class="folder-tag-mini" title="${this.escapeHtml(tooltipText)}">+${folder.tags.length - 2}</span>` : ''}
                            </div>
                        `;
                    })() : ''}
                </div>
                
                ${shouldExpand ? `
                    <div class="folder-content">
                        ${this.renderFolderFiles(folder)}
                        ${hasChildren ? folder.children.map(childId => {
                            const child = library.folders[childId];
                            if (!child) return '';
                            
                            // When searching, only show children that match
                            if (this.searchQuery && this.searchQuery.trim()) {
                                const query = this.searchQuery.toLowerCase().trim();
                                if (!this.folderMatchesSearch(child, query)) {
                                    return '';
                                }
                            }
                            
                            return this.renderFolder(child, depth + 1);
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
        
        // Filter files based on search OR tag filter (not both)
        const filesToShow = folder.files.filter(filePath => {
            const file = library.files[filePath];
            if (!file) return false;
            
            // If searching, apply search filter only
            if (this.searchQuery && this.searchQuery.trim()) {
                const query = this.searchQuery.toLowerCase().trim();
                const matchesFileName = file.name.toLowerCase().includes(query);
                const matchesFileTags = file.tags && file.tags.some(tag => {
                    const tagName = typeof tag === 'string' ? tag : tag.name;
                    return tagName.toLowerCase().includes(query);
                });
                
                console.log(`  File "${file.name}": name=${matchesFileName}, tags=${matchesFileTags}, query="${query}"`);
                
                return matchesFileName || matchesFileTags;
            }
            // If tag filter is active (and not searching), apply tag filter
            else if (this.activeTagFilter) {
                const fileTagNames = file.tags ? file.tags.map(t => {
                    const tagName = typeof t === 'string' ? t : t.name;
                    return tagName.toLowerCase();
                }) : [];
                
                return fileTagNames.includes(this.activeTagFilter);
            }
            // No filters active, show all files
            else {
                return true;
            }
        });
        
        // If no files to show, return empty
        if (filesToShow.length === 0) return '';
        
        return `<div class="folder-files-container">${filesToShow.map(filePath => {
            const file = library.files[filePath];
            
            const fileExt = file.name.split('.').pop().toLowerCase();
            const fileIcon = this.getFileIcon(fileExt);
            
            return `
                <div class="library-file" 
                     data-file-path="${this.escapeHtml(file.path)}"
                     draggable="true"
                     ondragstart="libraryUI.handleFileDragStart(event)"
                     ondragend="libraryUI.handleFileDragEnd(event)"
                     onclick="libraryUI.handleFileClick(event)"
                     ondblclick="libraryUI.handleFileDoubleClick(event)"
                     oncontextmenu="libraryUI.handleFileContextMenu(event)"
                     title="${this.escapeHtml(file.name)}">
                    <span class="file-icon">${fileIcon}</span>
                    <div class="file-info">
                        <div class="file-name">${this.escapeHtml(file.name)}</div>
                        ${file.tags && file.tags.length > 0 ? `
                            <div class="file-meta">
                                ${file.tags.slice(0, 2).map(tag => `<span class="file-tag-mini">${this.escapeHtml(tag)}</span>`).join(' ')}
                                ${file.tags.length > 2 ? `<span class="file-tag-mini">+${file.tags.length - 2}</span>` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('')}</div>`;
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
        // Remove any existing dialogs first
        document.querySelectorAll('.note-dialog-overlay').forEach(d => d.remove());
        
        const dialog = document.createElement('div');
        dialog.id = 'createFolderDialog';
        dialog.className = 'note-dialog-overlay';
        dialog.innerHTML = `
            <div class="note-dialog" style="max-width: 400px;">
                <div class="note-dialog-header">
                    <h3>➕ Create New Folder</h3>
                    <button class="note-dialog-close" onclick="document.getElementById('createFolderDialog').remove()">×</button>
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
                                <button type="button" class="icon-option" data-icon="${icon}" onclick="libraryUI.selectIcon(this)">${icon}</button>
                            `).join('')}
                        </div>
                        <input type="hidden" id="selectedIcon" value="📁">
                    </div>
                </div>
                <div class="note-dialog-footer">
                    <button type="button" class="btn-secondary" onclick="document.getElementById('createFolderDialog').remove()">Cancel</button>
                    <button type="button" class="btn-primary" id="createFolderBtn">Create</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
        
        // Setup Create button event listener
        const createBtn = document.getElementById('createFolderBtn');
        if (createBtn) {
            createBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.createFolder(parentId);
            });
        }
        
        // Allow Enter key to create folder
        const nameInput = document.getElementById('newFolderName');
        if (nameInput) {
            nameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.createFolder(parentId);
                }
            });
        }
        
        setTimeout(() => {
            if (nameInput) nameInput.focus();
        }, 100);
    }
    
    selectIcon(button) {
        event.preventDefault(); // Prevent any form submission
        event.stopPropagation();
        
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
        
        const newFolder = this.libraryManager.createFolder(name, parentId, icon);
        
        // Expand parent folder to show the new subfolder
        if (parentId && parentId !== 'root') {
            const parentFolder = this.libraryManager.getFolder(parentId);
            if (parentFolder && !parentFolder.expanded) {
                this.libraryManager.toggleFolderExpanded(parentId);
            }
        }
        
        // Also expand the root "My Library" if creating at root level
        if (parentId === 'root') {
            const rootFolder = this.libraryManager.getFolder('root');
            if (rootFolder && !rootFolder.expanded) {
                this.libraryManager.toggleFolderExpanded('root');
            }
        }
        
        // Close dialog
        const dialog = document.getElementById('createFolderDialog');
        if (dialog) {
            dialog.remove();
        }
    }
    
    showFolderContextMenu(event, folderId) {
        event.preventDefault();
        event.stopPropagation();
        
        this.contextMenuTarget = { type: 'folder', id: folderId };
        const folder = this.libraryManager.getFolder(folderId);
        
        const menu = document.getElementById('libraryContextMenu');
        if (!menu) return;
        
        // Special menu for Trash folder
        if (folderId === 'trash') {
            const fileCount = folder.files ? folder.files.length : 0;
            menu.innerHTML = `
                <div class="context-menu-item ${fileCount === 0 ? 'disabled' : ''}" data-action="emptytrash">
                    🗑️ Empty Trash (${fileCount} ${fileCount === 1 ? 'item' : 'items'})
                </div>
            `;
        } else {
            menu.innerHTML = `
                <div class="context-menu-item" data-action="newfolder">
                    ➕ New Subfolder
                </div>
                <div class="context-menu-item" data-action="rename">
                    ✏️ Rename
                </div>
                <div class="context-menu-item" data-action="tags">
                    🏷️ Manage Tags
                </div>
                ${folder.type !== 'library' && folder.type !== 'special' ? `
                    <div class="context-menu-divider"></div>
                    <div class="context-menu-item danger" data-action="delete">
                        🗑️ Delete Folder
                    </div>
                ` : ''}
            `;
        }
        
        // Add event listeners to menu items
        menu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                this.handleFolderContextAction(action, folderId);
                this.hideContextMenu();
            });
        });
        
        menu.classList.remove('hidden');
        menu.style.left = event.clientX + 'px';
        menu.style.top = event.clientY + 'px';
    }
    
    handleFolderContextAction(action, folderId) {
        switch (action) {
            case 'newfolder':
                this.showCreateFolderDialog(folderId);
                break;
            case 'rename':
                this.showRenameFolderDialog(folderId);
                break;
            case 'tags':
                this.showFolderTagsDialog(folderId);
                break;
            case 'delete':
                this.deleteFolder(folderId);
                break;
            case 'emptytrash':
                this.emptyTrash();
                break;
        }
    }
    
    showFileContextMenu(event, filePath) {
        event.preventDefault();
        event.stopPropagation();
        
        // Store the unescaped path for use in context menu actions
        this.contextMenuTarget = { type: 'file', path: filePath };
        
        const menu = document.getElementById('libraryContextMenu');
        if (!menu) return;
        
        // Use data attributes instead of inline onclick to avoid escaping issues
        menu.innerHTML = `
            <div class="context-menu-item" data-action="open">
                📂 Open
            </div>
            <div class="context-menu-item" data-action="move">
                📁 Move to Folder
            </div>
            <div class="context-menu-item" data-action="tags">
                🏷️ Manage Tags
            </div>
            <div class="context-menu-divider"></div>
            <div class="context-menu-item danger" data-action="trash">
                🗑️ Move to Trash
            </div>
        `;
        
        // Add event listeners to menu items
        menu.querySelectorAll('.context-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                this.handleFileContextAction(action, filePath);
                this.hideContextMenu();
            });
        });
        
        menu.classList.remove('hidden');
        menu.style.left = event.clientX + 'px';
        menu.style.top = event.clientY + 'px';
    }
    
    handleFileContextAction(action, filePath) {
        switch (action) {
            case 'open':
                this.openFile(filePath);
                break;
            case 'move':
                this.showMoveFileDialog(filePath);
                break;
            case 'tags':
                this.showFileTagsDialog(filePath);
                break;
            case 'trash':
                this.moveFileToTrash(filePath);
                break;
        }
    }
    
    hideContextMenu() {
        const menu = document.getElementById('libraryContextMenu');
        if (menu) menu.classList.add('hidden');
    }
    
    showRenameFolderDialog(folderId) {
        const folder = this.libraryManager.getFolder(folderId);
        if (!folder) return;
        
        // Close any existing dialogs first
        const existingDialogs = document.querySelectorAll('.note-dialog-overlay');
        existingDialogs.forEach(d => d.remove());
        
        const dialog = document.createElement('div');
        dialog.id = 'renameFolderDialog';
        dialog.className = 'note-dialog-overlay';
        dialog.innerHTML = `
            <div class="note-dialog">
                <div class="note-dialog-header">
                    <h3>✏️ Rename Folder</h3>
                    <button class="note-dialog-close" onclick="this.closest('.note-dialog-overlay').remove()">×</button>
                </div>
                <div class="note-dialog-body">
                    <label for="renameFolderInput">New Name:</label>
                    <input type="text" id="renameFolderInput" class="note-dialog-input" value="${this.escapeHtml(folder.name)}">
                </div>
                <div class="note-dialog-footer">
                    <button class="btn-secondary" onclick="this.closest('.note-dialog-overlay').remove()">Cancel</button>
                    <button class="btn-primary" id="confirmRenameBtn">Rename</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        const input = document.getElementById('renameFolderInput');
        input.select();
        input.focus();
        
        const handleRename = () => {
            const newName = input.value.trim();
            if (newName && newName !== folder.name) {
                this.libraryManager.renameFolder(folderId, newName);
                dialog.remove();
            } else if (newName === folder.name) {
                dialog.remove();
            }
        };
        
        document.getElementById('confirmRenameBtn').addEventListener('click', handleRename);
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleRename();
            } else if (e.key === 'Escape') {
                dialog.remove();
            }
        });
    }
    
    deleteFolder(folderId) {
        const folder = this.libraryManager.getFolder(folderId);
        if (!folder) return;
        
        if (confirm(`Delete folder "${folder.name}"? Files will be moved to Unfiled Items.`)) {
            this.libraryManager.deleteFolder(folderId);
        }
    }
    
    emptyTrash() {
        const trashFolder = this.libraryManager.getFolder('trash');
        if (!trashFolder) return;
        
        const fileCount = trashFolder.files ? trashFolder.files.length : 0;
        
        if (fileCount === 0) {
            alert('Trash is already empty');
            return;
        }
        
        if (confirm(`Permanently delete ${fileCount} ${fileCount === 1 ? 'file' : 'files'} from trash? This cannot be undone.`)) {
            const result = this.libraryManager.emptyTrash();
            
            if (result.errors.length > 0) {
                alert(`Deleted ${result.deleted} files. ${result.errors.length} errors occurred.`);
                console.error('Errors emptying trash:', result.errors);
            } else {
                console.log(`Successfully deleted ${result.deleted} files from trash`);
            }
        }
    }
    
    showFolderTagsDialog(folderId) {
        const folder = this.libraryManager.getFolder(folderId);
        if (!folder) return;
        
        const existingTags = folder.tags || [];
        const existingTagNames = existingTags.map(t => this.libraryManager.getTagName(t));
        const allTagsWithColors = this.libraryManager.getAllFolderTagsWithColors();
        const suggestedTags = allTagsWithColors.filter(t => !existingTagNames.includes(t.name));
        
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
                        <input type="text" id="folderTagInput" class="tag-input" placeholder="Type a tag name...">
                        <div class="tag-color-selector" style="margin-top: 10px;">
                            <label style="display: block; margin-bottom: 5px; font-size: 12px; color: #666;">Tag Color:</label>
                            <div class="color-options" style="display: flex; gap: 8px; flex-wrap: wrap;">
                                <button type="button" class="color-option selected" data-color="green" style="background: #4caf50;" title="Green">✓</button>
                                <button type="button" class="color-option" data-color="blue" style="background: #2196f3;" title="Blue"></button>
                                <button type="button" class="color-option" data-color="purple" style="background: #9c27b0;" title="Purple"></button>
                                <button type="button" class="color-option" data-color="orange" style="background: #ff9800;" title="Orange"></button>
                                <button type="button" class="color-option" data-color="red" style="background: #f44336;" title="Red"></button>
                                <button type="button" class="color-option" data-color="teal" style="background: #009688;" title="Teal"></button>
                                <button type="button" class="color-option" data-color="pink" style="background: #e91e63;" title="Pink"></button>
                                <button type="button" class="color-option" data-color="gray" style="background: #9e9e9e;" title="Gray"></button>
                            </div>
                        </div>
                        <button id="saveFolderTagBtn" class="btn-primary" style="margin-top: 10px; width: 100%;">💾 Save Tag</button>
                    </div>
                    ${existingTags.length > 0 ? `
                        <div class="current-tags-section">
                            <label>Current tags:</label>
                            <div class="current-tags-list" id="currentFolderTags">
                                ${existingTags.map(tag => {
                                    const tagName = this.libraryManager.getTagName(tag);
                                    const tagColor = this.libraryManager.getTagColor(tag);
                                    return `
                                        <span class="tag-badge tag-${tagColor}">
                                            ${this.escapeHtml(tagName)}
                                            <button class="tag-remove-btn" onclick="libraryUI.removeFolderTag('${folderId}', '${this.escapeHtml(tagName)}', this)">×</button>
                                        </span>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    ` : '<div id="currentFolderTags"></div>'}
                    ${suggestedTags.length > 0 ? `
                        <div class="suggested-tags-section">
                            <label>Suggested:</label>
                            <div class="suggested-tags-list">
                                ${suggestedTags.map(tag => `
                                    <span class="tag-badge tag-${tag.color} suggested" onclick="libraryUI.addFolderTag('${folderId}', '${this.escapeHtml(tag.name)}', this, '${tag.color}')">${this.escapeHtml(tag.name)}</span>
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
        
        // Color selector logic
        let selectedColor = 'green';
        const colorOptions = dialog.querySelectorAll('.color-option');
        colorOptions.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                colorOptions.forEach(b => {
                    b.classList.remove('selected');
                    b.textContent = '';
                });
                btn.classList.add('selected');
                btn.textContent = '✓';
                selectedColor = btn.dataset.color;
            });
        });
        
        // Save tag function
        const saveTag = () => {
            const tag = input.value.trim();
            if (tag) {
                this.addFolderTag(folderId, tag, null, selectedColor);
                input.value = '';
                // Reset color to default
                selectedColor = 'green';
                colorOptions.forEach(b => {
                    b.classList.remove('selected');
                    b.textContent = '';
                });
                colorOptions[0].classList.add('selected');
                colorOptions[0].textContent = '✓';
            }
        };
        
        // Save button click
        const saveBtn = document.getElementById('saveFolderTagBtn');
        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            saveTag();
        });
        
        // Enter key to save
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveTag();
            }
        });
        
        setTimeout(() => input.focus(), 100);
    }
    
    addFolderTag(folderId, tag, element, color = 'green') {
        if (this.libraryManager.addTagToFolder(folderId, tag, color)) {
            // Remove from suggestions if present
            if (element) element.remove();
            
            // Add to current tags
            const container = document.getElementById('currentFolderTags');
            if (container) {
                const badge = document.createElement('span');
                badge.className = `tag-badge tag-${color}`;
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
    
    openFileInNewTab(filePath) {
        // Prevent single click from firing
        event.stopPropagation();
        
        this.libraryManager.updateFileLastOpened(filePath);
        
        // Open in new tab using tab manager
        if (window.openFileInNewTab) {
            window.openFileInNewTab(filePath);
        } else {
            // Fallback to regular open
            this.openFile(filePath);
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
        const file = this.libraryManager.getFile(filePath);
        if (!file) {
            console.error('File not found:', filePath);
            return;
        }
        
        if (confirm(`Move "${file.name}" to trash?`)) {
            const success = this.libraryManager.moveFileToFolder(filePath, 'trash');
            if (success) {
                console.log('File moved to trash:', filePath);
                // UI will auto-update via library-updated event
            } else {
                console.error('Failed to move file to trash');
                alert('Failed to move file to trash');
            }
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
            this.activeTagFilter = tag ? tag.toLowerCase() : null;
        }
        this.updateTreeAndFilters();
    }
    
    handleFileClick(event) {
        event.stopPropagation();
        const fileElement = event.currentTarget;
        const filePath = fileElement.getAttribute('data-file-path');
        if (filePath) {
            // getAttribute returns the decoded value, so we don't need to unescape HTML entities
            // unless they were double-escaped. But escapeHtml matches unescapeHtml logic.
            // However, escapeHtml escapes & to &amp;. getAttribute decodes &amp; to &.
            // So we effectively get the raw path back.
            this.openFile(filePath);
        }
    }

    handleFileDoubleClick(event) {
        event.stopPropagation();
        const fileElement = event.currentTarget;
        const filePath = fileElement.getAttribute('data-file-path');
        if (filePath) {
            this.openFileInNewTab(filePath);
        }
    }

    handleFileContextMenu(event) {
        event.preventDefault();
        event.stopPropagation();
        const fileElement = event.currentTarget;
        const filePath = fileElement.getAttribute('data-file-path');
        if (filePath) {
            this.showFileContextMenu(event, filePath);
        }
    }

    // ========== DRAG AND DROP ==========
    
    handleFileDragStart(event) {
        event.stopPropagation();
        
        // Get file path from data attribute
        const fileElement = event.target.closest('.library-file');
        if (!fileElement) return;
        
        // Get the raw path and unescape HTML entities
        const escapedPath = fileElement.getAttribute('data-file-path');
        const filePath = this.unescapeHtml(escapedPath);
        this.draggedFilePath = filePath;
        
        fileElement.classList.add('dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', filePath);
        
        console.log('Drag started for file:', filePath);
    }
    
    handleFileDragEnd(event) {
        const fileElement = event.target.closest('.library-file');
        if (fileElement) {
            fileElement.classList.remove('dragging');
        }
        
        console.log('Drag ended');
        
        // Remove all drag-over classes
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
    }
    
    handleDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'move';
        
        const folderHeader = event.currentTarget;
        if (!folderHeader.classList.contains('drag-over')) {
            folderHeader.classList.add('drag-over');
        }
    }
    
    handleDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const folderHeader = event.currentTarget;
        // Only remove if we're actually leaving the element (not entering a child)
        const rect = folderHeader.getBoundingClientRect();
        const x = event.clientX;
        const y = event.clientY;
        
        if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
            folderHeader.classList.remove('drag-over');
        }
    }
    
    handleDrop(event, targetFolderId) {
        event.preventDefault();
        event.stopPropagation();
        
        const folderHeader = event.currentTarget;
        folderHeader.classList.remove('drag-over');
        
        console.log('Drop event - draggedFilePath:', this.draggedFilePath, 'targetFolder:', targetFolderId);
        
        if (!this.draggedFilePath) {
            console.log('No dragged file path');
            return;
        }
        
        const file = this.libraryManager.getFile(this.draggedFilePath);
        console.log('File data:', file);
        
        if (!file) {
            console.log('File not found in library');
            return;
        }
        
        // Don't do anything if dropping in same folder
        if (file.folder === targetFolderId) {
            console.log('Already in target folder');
            return;
        }
        
        // Move the file
        console.log('Moving file from', file.folder, 'to', targetFolderId);
        const success = this.libraryManager.moveFileToFolder(this.draggedFilePath, targetFolderId);
        console.log('Move result:', success);
        
        if (success) {
            // Show success feedback
            const targetFolder = this.libraryManager.getFolder(targetFolderId);
            if (targetFolder) {
                // Expand target folder to show the file
                if (!targetFolder.expanded) {
                    this.libraryManager.toggleFolderExpanded(targetFolderId);
                }
            }
        }
        
        this.draggedFilePath = null;
    }
    
    // ========== UTILITIES ==========
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    unescapeHtml(text) {
        const div = document.createElement('div');
        div.innerHTML = text;
        return div.textContent;
    }
}

// Initialize Library UI (will be called after DOM is ready)
let libraryUI;

