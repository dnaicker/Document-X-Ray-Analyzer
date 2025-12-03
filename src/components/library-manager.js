// Library and Folder Management System
class LibraryManager {
    constructor() {
        this.storageKey = 'grammar-highlighter-library';
        this.library = this.loadLibrary();
        this.currentFolder = null;
        this.selectedFiles = new Set();
        
        // Initialize default structure if empty
        if (!this.library.folders || Object.keys(this.library.folders).length === 0) {
            this.initializeDefaultStructure();
        }
    }
    
    initializeDefaultStructure() {
        this.library = {
            folders: {
                'root': {
                    id: 'root',
                    name: 'My Library',
                    type: 'library',
                    icon: '🏛️',
                    parent: null,
                    children: [],
                    tags: [],
                    expanded: true,
                    files: []
                },
                'my-publications': {
                    id: 'my-publications',
                    name: 'My Publications',
                    type: 'special',
                    icon: '📄',
                    parent: null,
                    children: [],
                    tags: [],
                    expanded: false,
                    files: []
                },
                'duplicate-items': {
                    id: 'duplicate-items',
                    name: 'Duplicate Items',
                    type: 'special',
                    icon: '📋',
                    parent: null,
                    children: [],
                    tags: [],
                    expanded: false,
                    files: []
                },
                'unfiled': {
                    id: 'unfiled',
                    name: 'Unfiled Items',
                    type: 'special',
                    icon: '📂',
                    parent: null,
                    children: [],
                    tags: [],
                    expanded: false,
                    files: []
                },
                'trash': {
                    id: 'trash',
                    name: 'Trash',
                    type: 'special',
                    icon: '🗑️',
                    parent: null,
                    children: [],
                    tags: [],
                    expanded: false,
                    files: []
                }
            },
            files: {}, // filePath -> { path, name, folder, addedDate, lastOpened, tags }
            folderOrder: ['root', 'my-publications', 'duplicate-items', 'unfiled', 'trash']
        };
        this.saveLibrary();
    }
    
    loadLibrary() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error loading library:', e);
        }
        return { folders: {}, files: {}, folderOrder: [] };
    }
    
    saveLibrary() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.library));
            this.notifyChange();
        } catch (e) {
            console.error('Error saving library:', e);
        }
    }
    
    notifyChange() {
        document.dispatchEvent(new CustomEvent('library-updated', { 
            detail: { library: this.library } 
        }));
    }
    
    // ========== FOLDER OPERATIONS ==========
    
    createFolder(name, parentId = 'root', icon = '📁') {
        const id = 'folder-' + Date.now();
        const folder = {
            id: id,
            name: name,
            type: 'folder',
            icon: icon,
            parent: parentId,
            children: [],
            tags: [],
            expanded: false,
            files: [],
            createdAt: new Date().toISOString()
        };
        
        this.library.folders[id] = folder;
        
        // Add to parent's children
        if (this.library.folders[parentId]) {
            this.library.folders[parentId].children.push(id);
        }
        
        this.saveLibrary();
        return folder;
    }
    
    renameFolder(folderId, newName) {
        if (this.library.folders[folderId]) {
            this.library.folders[folderId].name = newName;
            this.saveLibrary();
            return true;
        }
        return false;
    }
    
    deleteFolder(folderId) {
        const folder = this.library.folders[folderId];
        if (!folder || folder.type === 'library') return false;
        
        // Move files to unfiled
        folder.files.forEach(filePath => {
            this.moveFileToFolder(filePath, 'unfiled');
        });
        
        // Recursively delete children
        folder.children.forEach(childId => {
            this.deleteFolder(childId);
        });
        
        // Remove from parent's children
        if (folder.parent && this.library.folders[folder.parent]) {
            const parent = this.library.folders[folder.parent];
            parent.children = parent.children.filter(id => id !== folderId);
        }
        
        // Delete folder
        delete this.library.folders[folderId];
        
        this.saveLibrary();
        return true;
    }
    
    moveFolder(folderId, newParentId) {
        const folder = this.library.folders[folderId];
        if (!folder || folder.type === 'library') return false;
        
        // Prevent moving to own descendant
        if (this.isDescendant(newParentId, folderId)) return false;
        
        // Remove from old parent
        if (folder.parent && this.library.folders[folder.parent]) {
            const oldParent = this.library.folders[folder.parent];
            oldParent.children = oldParent.children.filter(id => id !== folderId);
        }
        
        // Add to new parent
        if (this.library.folders[newParentId]) {
            this.library.folders[newParentId].children.push(folderId);
            folder.parent = newParentId;
        }
        
        this.saveLibrary();
        return true;
    }
    
    isDescendant(potentialDescendantId, ancestorId) {
        let current = potentialDescendantId;
        while (current) {
            if (current === ancestorId) return true;
            const folder = this.library.folders[current];
            current = folder ? folder.parent : null;
        }
        return false;
    }
    
    toggleFolderExpanded(folderId) {
        if (this.library.folders[folderId]) {
            this.library.folders[folderId].expanded = !this.library.folders[folderId].expanded;
            this.saveLibrary();
        }
    }
    
    // ========== FOLDER TAGS ==========
    
    addTagToFolder(folderId, tag, color = 'green') {
        const folder = this.library.folders[folderId];
        if (!folder) return false;
        
        const normalizedTag = tag.trim().toLowerCase();
        if (!normalizedTag) return false;
        
        // Check if tag already exists (by name only)
        const existingTag = folder.tags.find(t => {
            const tagName = typeof t === 'string' ? t : t.name;
            return tagName === normalizedTag;
        });
        
        if (existingTag) return false;
        
        // Store tag as object with name and color
        folder.tags.push({ name: normalizedTag, color: color });
        this.saveLibrary();
        return true;
    }
    
    getTagName(tag) {
        return typeof tag === 'string' ? tag : tag.name;
    }
    
    getTagColor(tag) {
        return typeof tag === 'string' ? 'green' : (tag.color || 'green');
    }
    
    removeTagFromFolder(folderId, tag) {
        const folder = this.library.folders[folderId];
        if (!folder) return false;
        
        const normalizedTag = tag.toLowerCase();
        const index = folder.tags.findIndex(t => {
            const tagName = this.getTagName(t);
            return tagName === normalizedTag;
        });
        
        if (index > -1) {
            folder.tags.splice(index, 1);
            this.saveLibrary();
            return true;
        }
        return false;
    }
    
    getAllFolderTags() {
        const tags = new Set();
        Object.values(this.library.folders).forEach(folder => {
            if (folder.tags) {
                folder.tags.forEach(tag => {
                    const tagName = this.getTagName(tag);
                    tags.add(tagName);
                });
            }
        });
        return [...tags].sort();
    }
    
    getAllFolderTagsWithColors() {
        const tagsMap = new Map(); // Map<tagName, tagObject>
        Object.values(this.library.folders).forEach(folder => {
            if (folder.tags) {
                folder.tags.forEach(tag => {
                    const tagName = this.getTagName(tag);
                    const tagColor = this.getTagColor(tag);
                    // Store the tag object (prefer existing color if already seen)
                    if (!tagsMap.has(tagName)) {
                        tagsMap.set(tagName, { name: tagName, color: tagColor });
                    }
                });
            }
        });
        return Array.from(tagsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }
    
    getAllTags() {
        const tags = new Set();
        // Collect folder tags
        Object.values(this.library.folders).forEach(folder => {
            if (folder.tags) {
                folder.tags.forEach(tag => {
                    const tagName = this.getTagName(tag);
                    tags.add(tagName);
                });
            }
        });
        // Collect file tags
        Object.values(this.library.files).forEach(file => {
            if (file.tags) {
                file.tags.forEach(tag => {
                    const tagName = typeof tag === 'string' ? tag : tag.name;
                    tags.add(tagName);
                });
            }
        });
        return [...tags].sort();
    }
    
    // ========== FOLDER IMPORT ==========
    
    /**
     * Import a folder with all its files and subdirectories
     * @param {string} folderName - Name of the root folder
     * @param {Array} files - Array of file objects from scan-folder
     * @param {string} parentId - Parent folder ID (default: 'root')
     * @returns {Object} Import results
     */
    importFolder(folderName, files, parentId = 'root') {
        const folderMap = new Map(); // Maps relative folder paths to folder IDs
        const importedFiles = [];
        const skippedFiles = [];
        
        // Create the root imported folder
        const rootFolder = this.createFolder(folderName, parentId, '📁');
        folderMap.set('', rootFolder.id);
        
        // Group files by their folder paths
        const folderPaths = new Set();
        files.forEach(file => {
            if (file.folderPath) {
                // Add all parent paths
                const parts = file.folderPath.split(/[\\/]/).filter(p => p);
                let currentPath = '';
                parts.forEach(part => {
                    currentPath = currentPath ? `${currentPath}/${part}` : part;
                    folderPaths.add(currentPath);
                });
            }
        });
        
        // Sort folder paths to create parent folders first
        const sortedPaths = Array.from(folderPaths).sort();
        
        // Create all subdirectories
        sortedPaths.forEach(folderPath => {
            const parts = folderPath.split('/');
            const folderName = parts[parts.length - 1];
            const parentPath = parts.slice(0, -1).join('/');
            const parentFolderId = folderMap.get(parentPath) || rootFolder.id;
            
            const newFolder = this.createFolder(folderName, parentFolderId, '📁');
            folderMap.set(folderPath, newFolder.id);
        });
        
        // Add all files to their respective folders
        files.forEach(file => {
            try {
                const targetFolderId = file.folderPath ? 
                    (folderMap.get(file.folderPath) || rootFolder.id) : 
                    rootFolder.id;
                
                this.addFile(file.filePath, file.fileName, targetFolderId);
                importedFiles.push(file.filePath);
            } catch (error) {
                console.error('Error importing file:', file.filePath, error);
                skippedFiles.push({ file: file.filePath, error: error.message });
            }
        });
        
        return {
            success: true,
            rootFolderId: rootFolder.id,
            foldersCreated: folderMap.size,
            filesImported: importedFiles.length,
            filesSkipped: skippedFiles.length,
            skippedFiles: skippedFiles
        };
    }
    
    // ========== FILE OPERATIONS ==========
    
    addFile(filePath, fileName, folderId = 'unfiled') {
        if (!this.library.files[filePath]) {
            this.library.files[filePath] = {
                path: filePath,
                name: fileName || this.getFileNameFromPath(filePath),
                folder: folderId,
                addedDate: new Date().toISOString(),
                lastOpened: null,
                tags: []
            };
        }
        
        // Add to folder's files list
        if (this.library.folders[folderId]) {
            if (!this.library.folders[folderId].files.includes(filePath)) {
                this.library.folders[folderId].files.push(filePath);
            }
        }
        
        this.saveLibrary();
        return this.library.files[filePath];
    }
    
    removeFile(filePath) {
        const fileData = this.library.files[filePath];
        if (!fileData) return false;
        
        // Remove from ALL folders (cleanup in case of inconsistencies)
        Object.values(this.library.folders).forEach(folder => {
            if (folder.files && folder.files.includes(filePath)) {
                folder.files = folder.files.filter(f => f !== filePath);
            }
        });
        
        delete this.library.files[filePath];
        this.saveLibrary();
        return true;
    }
    
    emptyTrash() {
        const trashFolder = this.library.folders['trash'];
        if (!trashFolder) return { deleted: 0, errors: [] };
        
        const filesToDelete = [...trashFolder.files]; // Copy array
        let deleted = 0;
        const errors = [];
        
        filesToDelete.forEach(filePath => {
            try {
                if (this.removeFile(filePath)) {
                    deleted++;
                }
            } catch (error) {
                console.error('Error deleting file:', filePath, error);
                errors.push({ filePath, error: error.message });
            }
        });
        
        return { deleted, errors };
    }
    
    moveFileToFolder(filePath, newFolderId) {
        const fileData = this.library.files[filePath];
        if (!fileData || !this.library.folders[newFolderId]) return false;
        
        // Remove from ALL folders (cleanup in case file appears in multiple folders)
        Object.values(this.library.folders).forEach(folder => {
            if (folder.files && folder.files.includes(filePath)) {
                folder.files = folder.files.filter(f => f !== filePath);
            }
        });
        
        // Add to new folder
        fileData.folder = newFolderId;
        if (!this.library.folders[newFolderId].files.includes(filePath)) {
            this.library.folders[newFolderId].files.push(filePath);
        }
        
        this.saveLibrary();
        return true;
    }
    
    updateFileLastOpened(filePath) {
        if (this.library.files[filePath]) {
            this.library.files[filePath].lastOpened = new Date().toISOString();
            this.saveLibrary();
        }
    }
    
    // ========== FILE TAGS ==========
    
    addTagToFile(filePath, tag) {
        const fileData = this.library.files[filePath];
        if (!fileData) return false;
        
        const normalizedTag = tag.trim().toLowerCase();
        if (!normalizedTag || fileData.tags.includes(normalizedTag)) return false;
        
        fileData.tags.push(normalizedTag);
        this.saveLibrary();
        return true;
    }
    
    removeTagFromFile(filePath, tag) {
        const fileData = this.library.files[filePath];
        if (!fileData) return false;
        
        const index = fileData.tags.indexOf(tag.toLowerCase());
        if (index > -1) {
            fileData.tags.splice(index, 1);
            this.saveLibrary();
            return true;
        }
        return false;
    }
    
    // ========== SEARCH & FILTER ==========
    
    searchFiles(query) {
        const lowerQuery = query.toLowerCase();
        return Object.values(this.library.files).filter(file => {
            return file.name.toLowerCase().includes(lowerQuery) ||
                   file.tags.some(tag => tag.includes(lowerQuery));
        });
    }
    
    getFilesByFolder(folderId) {
        const folder = this.library.folders[folderId];
        if (!folder) return [];
        
        return folder.files.map(filePath => this.library.files[filePath]).filter(f => f);
    }
    
    getFilesByTag(tag) {
        return Object.values(this.library.files).filter(file => 
            file.tags.includes(tag.toLowerCase())
        );
    }
    
    // ========== UTILITIES ==========
    
    getFileNameFromPath(filePath) {
        if (!filePath) return 'Unknown';
        return filePath.split(/[\\/]/).pop() || filePath;
    }
    
    getFolderPath(folderId) {
        const path = [];
        let current = folderId;
        
        while (current) {
            const folder = this.library.folders[current];
            if (!folder) break;
            path.unshift(folder.name);
            current = folder.parent;
        }
        
        return path.join(' / ');
    }
    
    getFolder(folderId) {
        return this.library.folders[folderId];
    }
    
    getFile(filePath) {
        return this.library.files[filePath];
    }
}

// Initialize Library Manager
const libraryManager = new LibraryManager();

