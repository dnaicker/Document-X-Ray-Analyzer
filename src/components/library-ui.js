// Library UI Component
class LibraryUI {
    constructor(libraryManager) {
        this.libraryManager = libraryManager;
        this.container = null;
        this.searchQuery = '';
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
                            <div style="display: flex; align-items: center;">
                                <button id="collapseLibraryBtn" class="panel-collapse-btn" title="Collapse Library" style="margin-right: 4px;">☰</button>
                                <h2 style="margin: 0;">📚 My Library</h2>
                            </div>
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
                               placeholder="🔍 Search files, folders, and tags..."
                               value="">
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
            
            // Setup collapse button listener (only once)
            this.setupCollapseButton();
        } else {
            // Just update the tree and filters without re-rendering search input
            this.updateTreeAndFilters();
        }
    }
    
    updateTreeAndFilters() {
        // Update tree
        const treeContainer = document.getElementById('libraryTree');
        if (treeContainer) {
            treeContainer.innerHTML = this.renderFolderTree();
        }
    }
    
    folderMatchesSearch(folder, query, visited = new Set()) {
        // Prevent circular references
        if (visited.has(folder.id)) {
            return false;
        }
        
        visited.add(folder.id);
        
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
            // Skip self-references and already visited folders
            if (childId === folder.id || visited.has(childId)) {
                return false;
            }
            const child = library.folders[childId];
            return child ? this.folderMatchesSearch(child, query, visited) : false;
        });
        
        return matchesFolderName || matchesFolderTags || hasMatchingFiles || hasMatchingChildren;
    }
    
    renderFolderTree() {
        const library = this.libraryManager.library;
        
        // Create visited tracking to prevent circular references
        const visited = new Set();
        
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
            
            return this.renderFolder(folder, 0, visited);
        }).join('');
    }
    
    renderFolder(folder, depth, visited = new Set()) {
        // Prevent circular references and infinite recursion
        if (visited.has(folder.id)) {
            console.warn(`Circular reference detected: folder ${folder.id} (${folder.name}) already being rendered`);
            return '';
        }
        
        // Add this folder to visited set
        visited.add(folder.id);
        
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
                            
                            // Skip if child references itself or has already been visited
                            if (childId === folder.id || visited.has(childId)) {
                                console.warn(`Skipping circular reference: ${childId} in folder ${folder.id}`);
                                return '';
                            }
                            
                            // When searching, only show children that match
                            if (this.searchQuery && this.searchQuery.trim()) {
                                const query = this.searchQuery.toLowerCase().trim();
                                if (!this.folderMatchesSearch(child, query)) {
                                    return '';
                                }
                            }
                            
                            return this.renderFolder(child, depth + 1, visited);
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
            // No search active, show all files
            return true;
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
                                ${file.tags.slice(0, 2).map(tag => {
                                    const tagName = this.libraryManager.getTagName(tag);
                                    const tagColor = this.libraryManager.getTagColor(tag);
                                    return `<span class="file-tag-mini tag-${tagColor}">${this.escapeHtml(tagName)}</span>`;
                                }).join(' ')}
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
            const folderCount = folder.children ? folder.children.length : 0;
            const totalCount = fileCount + folderCount;
            menu.innerHTML = `
                <div class="context-menu-item ${totalCount === 0 ? 'disabled' : ''}" data-action="emptytrash">
                    🗑️ Empty Trash (${totalCount} ${totalCount === 1 ? 'item' : 'items'})
                </div>
            `;
        } 
        // Special menu for Unfiled folder
        else if (folderId === 'unfiled') {
            const fileCount = folder.files ? folder.files.length : 0;
            const folderCount = folder.children ? folder.children.length : 0;
            const totalCount = fileCount + folderCount;
            menu.innerHTML = `
                <div class="context-menu-item ${totalCount === 0 ? 'disabled' : ''}" data-action="movealltotrash">
                    🗑️ Move All to Trash (${totalCount} ${totalCount === 1 ? 'item' : 'items'})
                </div>
            `;
        } 
        else {
            menu.innerHTML = `
                <div class="context-menu-item" data-action="newfolder">
                    ➕ New Subfolder
                </div>
                <div class="context-menu-item" data-action="rename">
                    ✏️ Rename
                </div>
                <div class="context-menu-item" data-action="tags">
                    🏷️ Add Tags
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
            case 'movealltotrash':
                this.moveAllToTrash(folderId);
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
                📁 Move
            </div>
            <div class="context-menu-item" data-action="tags">
                🏷️ Add Tags
            </div>
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
        
        let message;
        if (folder.parent === 'trash') {
            // Permanently delete from trash
            message = `Permanently delete folder "${folder.name}" and all its contents? This cannot be undone.`;
        } else if (folder.parent === 'unfiled') {
            // Move to trash
            message = `Move folder "${folder.name}" to Trash?`;
        } else {
            // Move to unfiled
            message = `Move folder "${folder.name}" to Unfiled Items? The folder and all its contents will be preserved.`;
        }
        
        if (confirm(message)) {
            this.libraryManager.deleteFolder(folderId);
            this.render(); // Refresh the library view
        }
    }
    
    emptyTrash() {
        const trashFolder = this.libraryManager.getFolder('trash');
        if (!trashFolder) return;
        
        const fileCount = trashFolder.files ? trashFolder.files.length : 0;
        const folderCount = trashFolder.children ? trashFolder.children.length : 0;
        const totalCount = fileCount + folderCount;
        
        if (totalCount === 0) {
            alert('Trash is already empty');
            return;
        }
        
        let itemsText = [];
        if (fileCount > 0) itemsText.push(`${fileCount} ${fileCount === 1 ? 'file' : 'files'}`);
        if (folderCount > 0) itemsText.push(`${folderCount} ${folderCount === 1 ? 'folder' : 'folders'}`);
        const itemsString = itemsText.join(' and ');
        
        if (confirm(`Permanently delete ${itemsString} from trash? This cannot be undone.`)) {
            const result = this.libraryManager.emptyTrash();
            
            if (result.errors.length > 0) {
                alert(`Deleted ${result.deleted} files and ${result.folders} folders. ${result.errors.length} errors occurred.`);
                console.error('Errors emptying trash:', result.errors);
            } else {
                console.log(`Successfully deleted ${result.deleted} files and ${result.folders} folders from trash`);
            }
            
            this.render(); // Refresh the library view
        }
    }
    
    moveAllToTrash(folderId) {
        const folder = this.libraryManager.getFolder(folderId);
        if (!folder) return;
        
        const fileCount = folder.files ? folder.files.length : 0;
        const folderCount = folder.children ? folder.children.length : 0;
        const totalCount = fileCount + folderCount;
        
        if (totalCount === 0) {
            alert('This folder is already empty');
            return;
        }
        
        const folderName = folder.name;
        const itemsText = [];
        if (fileCount > 0) itemsText.push(`${fileCount} ${fileCount === 1 ? 'file' : 'files'}`);
        if (folderCount > 0) itemsText.push(`${folderCount} ${folderCount === 1 ? 'folder' : 'folders'}`);
        
        if (confirm(`Move all ${itemsText.join(' and ')} from "${folderName}" to trash?`)) {
            const result = this.libraryManager.moveAllFilesToTrash(folderId);
            
            if (result.errors.length > 0) {
                const movedText = [];
                if (result.moved > 0) movedText.push(`${result.moved} ${result.moved === 1 ? 'file' : 'files'}`);
                if (result.folders > 0) movedText.push(`${result.folders} ${result.folders === 1 ? 'folder' : 'folders'}`);
                alert(`Moved ${movedText.join(' and ')} to trash. ${result.errors.length} ${result.errors.length === 1 ? 'error' : 'errors'} occurred.`);
                console.error('Errors moving items to trash:', result.errors);
            } else {
                const movedText = [];
                if (result.moved > 0) movedText.push(`${result.moved} ${result.moved === 1 ? 'file' : 'files'}`);
                if (result.folders > 0) movedText.push(`${result.folders} ${result.folders === 1 ? 'folder' : 'folders'}`);
                console.log(`Successfully moved ${movedText.join(' and ')} to trash`);
            }
            
            this.render(); // Refresh the library view
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
                        <input type="text" id="fileTagInput" class="tag-input" placeholder="Type a tag name...">
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
                        <button id="saveFileTagBtn" class="btn-primary" style="margin-top: 10px; width: 100%;">💾 Save Tag</button>
                    </div>
                    ${existingTags.length > 0 ? `
                        <div class="current-tags-section">
                            <label>Current tags:</label>
                            <div class="current-tags-list" id="currentFileTags">
                                ${existingTags.map(tag => {
                                    const tagName = this.libraryManager.getTagName(tag);
                                    const tagColor = this.libraryManager.getTagColor(tag);
                                    return `
                                        <span class="tag-badge tag-${tagColor}">
                                            ${this.escapeHtml(tagName)}
                                            <button class="tag-remove-btn" onclick="libraryUI.removeFileTag('${this.escapeHtml(filePath)}', '${this.escapeHtml(tagName)}', this)">×</button>
                                        </span>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    ` : '<div id="currentFileTags"></div>'}
                </div>
                <div class="note-dialog-footer">
                    <button class="btn-secondary" onclick="this.closest('.note-dialog-overlay').remove()">Done</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
        
        const input = document.getElementById('fileTagInput');
        
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
                this.addFileTag(filePath, tag, selectedColor);
                input.value = '';
                // Reset to default color
                colorOptions.forEach(b => {
                    b.classList.remove('selected');
                    b.textContent = '';
                });
                colorOptions[0].classList.add('selected');
                colorOptions[0].textContent = '✓';
                selectedColor = 'green';
            }
        };
        
        // Save button click
        const saveBtn = document.getElementById('saveFileTagBtn');
        saveBtn.addEventListener('click', saveTag);
        
        // Enter key in input
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveTag();
            }
        });
        
        setTimeout(() => input.focus(), 100);
    }
    
    addFileTag(filePath, tag, color = 'green') {
        if (this.libraryManager.addTagToFile(filePath, tag, color)) {
            const container = document.getElementById('currentFileTags');
            if (container) {
                const badge = document.createElement('span');
                badge.className = `tag-badge tag-${color}`;
                badge.innerHTML = `${this.escapeHtml(tag)} <button class="tag-remove-btn" onclick="libraryUI.removeFileTag('${this.escapeHtml(filePath)}', '${this.escapeHtml(tag)}', this.parentElement)">×</button>`;
                container.appendChild(badge);
            }
            // Refresh the library view to show updated tags
            this.render();
        }
    }
    
    removeFileTag(filePath, tag, element) {
        if (this.libraryManager.removeTagFromFile(filePath, tag)) {
            if (element) element.remove();
        }
    }
    
    showImportDialog() {
        // Show centered modal dialog with options
        const dialog = document.createElement('div');
        dialog.className = 'modal-overlay';
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(2px);
        `;
        
        dialog.innerHTML = `
            <div class="modal-content" style="
                max-width: 400px;
                background: white;
                border-radius: 12px;
                padding: 24px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                animation: modalFadeIn 0.2s ease-out;
            ">
                <h3 style="margin: 0 0 8px 0; font-size: 20px; color: #333;">📥 Import to Library</h3>
                <p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">Choose what to import:</p>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <button class="btn-primary" onclick="libraryUI.importSingleFile(); this.closest('.modal-overlay').remove();" style="
                        padding: 14px 20px;
                        font-size: 15px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: transform 0.2s, box-shadow 0.2s;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.4)';" onmouseout="this.style.transform=''; this.style.boxShadow='';">
                        📄 Import Single File
                    </button>
                    <button class="btn-primary" onclick="libraryUI.importFolder(); this.closest('.modal-overlay').remove();" style="
                        padding: 14px 20px;
                        font-size: 15px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: transform 0.2s, box-shadow 0.2s;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.4)';" onmouseout="this.style.transform=''; this.style.boxShadow='';">
                        📁 Import Folder
                    </button>
                    <button class="btn-primary" onclick="libraryUI.importFromUrl(); this.closest('.modal-overlay').remove();" style="
                        padding: 14px 20px;
                        font-size: 15px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: transform 0.2s, box-shadow 0.2s;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.4)';" onmouseout="this.style.transform=''; this.style.boxShadow='';">
                        🌐 Import from URL
                    </button>
                    
                </div>
                <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove();" style="
                    margin-top: 16px;
                    width: 100%;
                    padding: 12px;
                    background: #f5f5f5;
                    color: #666;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background 0.2s;
                " onmouseover="this.style.background='#e0e0e0';" onmouseout="this.style.background='#f5f5f5';">
                    Cancel
                </button>
            </div>
        `;
        
        // Close on overlay click
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.remove();
            }
        });
        
        document.body.appendChild(dialog);
    }
    
    importSingleFile() {
        // Trigger file picker
        if (window.openFileBtn) {
            window.openFileBtn.click();
        }
    }
    
    async importFolder() {
        // Trigger folder import - call the global function exposed by renderer.js
        if (typeof window.triggerFolderImport === 'function') {
            window.triggerFolderImport();
        } else {
            console.error('triggerFolderImport function not available');
            alert('Folder import is not available. Please restart the application.');
        }
    }
    
    async importFromUrl() {
        // Show URL input dialog
        const urlDialog = document.createElement('div');
        urlDialog.className = 'modal-overlay';
        urlDialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            backdrop-filter: blur(2px);
        `;
        
        urlDialog.innerHTML = `
            <div class="modal-content" style="
                max-width: 500px;
                background: white;
                border-radius: 12px;
                padding: 24px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                animation: modalFadeIn 0.2s ease-out;
            ">
                <h3 style="margin: 0 0 8px 0; font-size: 20px; color: #333;">🌐 Import from URL</h3>
                <p style="margin: 0 0 16px 0; color: #666; font-size: 14px;">Enter the URL of the web page to import:</p>
                <input type="text" id="urlInput" placeholder="https://example.com/article" style="
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    font-size: 15px;
                    margin-bottom: 16px;
                    box-sizing: border-box;
                    transition: border-color 0.2s;
                " onfocus="this.style.borderColor='#667eea';" onblur="this.style.borderColor='#e0e0e0';">
                <div style="display: flex; gap: 12px;">
                    <button id="importUrlBtn" class="btn-primary" style="
                        flex: 1;
                        padding: 12px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 15px;
                        transition: transform 0.2s, box-shadow 0.2s;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.4)';" onmouseout="this.style.transform=''; this.style.boxShadow='';">
                        Import
                    </button>
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove();" style="
                        flex: 1;
                        padding: 12px;
                        background: #f5f5f5;
                        color: #666;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 15px;
                        transition: background 0.2s;
                    " onmouseover="this.style.background='#e0e0e0';" onmouseout="this.style.background='#f5f5f5';">
                        Cancel
                    </button>
                </div>
                <div id="urlImportStatus" style="margin-top: 12px; color: #666; font-size: 13px; min-height: 20px;"></div>
            </div>
        `;
        
        document.body.appendChild(urlDialog);
        
        const urlInput = document.getElementById('urlInput');
        const importBtn = document.getElementById('importUrlBtn');
        const statusDiv = document.getElementById('urlImportStatus');
        
        // Focus input
        urlInput.focus();
        
        // Handle import
        const handleImport = async () => {
            const url = urlInput.value.trim();
            if (!url) {
                statusDiv.textContent = '⚠️ Please enter a URL';
                statusDiv.style.color = '#f44336';
                return;
            }
            
            // Basic URL validation
            try {
                new URL(url);
            } catch (e) {
                statusDiv.textContent = '⚠️ Invalid URL format';
                statusDiv.style.color = '#f44336';
                return;
            }
            
            // Show loading
            importBtn.disabled = true;
            importBtn.textContent = 'Fetching...';
            statusDiv.textContent = '⏳ Downloading content...';
            statusDiv.style.color = '#667eea';
            
            try {
                // Fetch URL content via IPC
                const { ipcRenderer } = require('electron');
                const result = await ipcRenderer.invoke('fetch-url-content', url);
                
                if (result.success) {
                    statusDiv.textContent = '✅ Processing content...';
                    
                    // Create a temporary file from the content
                    if (typeof window.processUrlContent === 'function') {
                        await window.processUrlContent(result.content, result.title, url);
                        statusDiv.textContent = '✅ Imported successfully!';
                        statusDiv.style.color = '#4caf50';
                        
                        // Close dialog after delay
                        setTimeout(() => {
                            urlDialog.remove();
                        }, 1000);
                    } else {
                        throw new Error('URL processing function not available');
                    }
                } else {
                    throw new Error(result.error || 'Failed to fetch URL');
                }
            } catch (error) {
                console.error('URL import error:', error);
                statusDiv.textContent = `❌ Error: ${error.message}`;
                statusDiv.style.color = '#f44336';
                importBtn.disabled = false;
                importBtn.textContent = 'Import';
            }
        };
        
        importBtn.addEventListener('click', handleImport);
        urlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleImport();
            }
        });
        
        // Close on overlay click
        urlDialog.addEventListener('click', (e) => {
            if (e.target === urlDialog) {
                urlDialog.remove();
            }
        });
        
        document.body.appendChild(urlDialog);
    }
    
    importFromYoutube() {
        // Show the YouTube import modal
        const youtubeModal = document.getElementById('youtubeImportModal');
        if (youtubeModal) {
            // Reset modal state
            const urlInput = document.getElementById('youtubeUrlInput');
            const langSelect = document.getElementById('youtubeLangSelect');
            const timestampsCheck = document.getElementById('includeTimestampsCheck');
            const progress = document.getElementById('youtubeImportProgress');
            const error = document.getElementById('youtubeImportError');
            const progressBar = document.getElementById('youtubeImportProgressBar');
            
            if (urlInput) urlInput.value = '';
            if (langSelect) langSelect.value = 'en';
            if (timestampsCheck) timestampsCheck.checked = false;
            if (progress) progress.classList.add('hidden');
            if (error) error.classList.add('hidden');
            if (progressBar) progressBar.style.width = '0%';
            
            // Show modal
            youtubeModal.style.display = 'flex';
            if (urlInput) urlInput.focus();
        } else {
            console.error('YouTube import modal not found');
            alert('YouTube import feature is not available. Please restart the application.');
        }
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
    
    setupCollapseButton() {
        const collapseBtn = document.getElementById('collapseLibraryBtn');
        const expandBtn = document.getElementById('expandLibraryBtn');
        const libraryPanel = document.getElementById('libraryPanel');
        const libraryResizer = document.getElementById('libraryResizer');
        
        if (collapseBtn && expandBtn && libraryPanel) {
            collapseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                libraryPanel.style.display = 'none';
                if (libraryResizer) libraryResizer.style.display = 'none';
                expandBtn.classList.remove('hidden');
                expandBtn.style.left = '0px';
            });
        }
    }
    
    repairLibrary() {
        if (confirm('This will attempt to fix circular references and corrupted folder structures in your library. Continue?')) {
            try {
                const result = this.libraryManager.manualCleanup();
                if (result.success) {
                    alert(`✅ Library repaired successfully!\n\n${result.message}`);
                    // Refresh the UI
                    this.render();
                } else {
                    alert('❌ Repair failed. Please check the console for details.');
                }
            } catch (error) {
                console.error('Error during library repair:', error);
                alert(`❌ Repair failed with error: ${error.message}`);
            }
        }
    }
}

// Initialize Library UI (will be called after DOM is ready)
let libraryUI;

