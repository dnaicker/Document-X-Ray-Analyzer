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
                const library = JSON.parse(stored);
                // Auto-cleanup on load
                this.cleanupFolderStructure(library);
                return library;
            }
        } catch (e) {
            console.error('Error loading library:', e);
        }
        return { folders: {}, files: {}, folderOrder: [] };
    }
    
    /**
     * Clean up corrupted folder structures (circular references, invalid children)
     */
    cleanupFolderStructure(library) {
        if (!library || !library.folders) return;
        
        const folders = library.folders;
        let cleanupCount = 0;
        
        // Helper to detect circular references using depth-first search
        const hasCircularRef = (folderId, visited = new Set(), path = []) => {
            if (visited.has(folderId)) {
                console.warn(`Circular reference detected in path: ${path.join(' -> ')} -> ${folderId}`);
                return true;
            }
            
            visited.add(folderId);
            path.push(folderId);
            
            const folder = folders[folderId];
            if (!folder || !folder.children) return false;
            
            for (const childId of folder.children) {
                if (hasCircularRef(childId, new Set(visited), [...path])) {
                    return true;
                }
            }
            
            return false;
        };
        
        // Remove circular references and invalid children
        Object.keys(folders).forEach(folderId => {
            const folder = folders[folderId];
            if (!folder || !folder.children) return;
            
            const originalLength = folder.children.length;
            // Filter out self-references, non-existent folders, and circular references
            folder.children = folder.children.filter(childId => {
                // Check self-reference
                if (childId === folderId) {
                    console.warn(`Removing self-reference in folder ${folderId} (${folder.name})`);
                    cleanupCount++;
                    return false;
                }
                
                // Check if child exists
                if (!folders[childId]) {
                    console.warn(`Removing invalid child reference ${childId} from folder ${folderId}`);
                    cleanupCount++;
                    return false;
                }
                
                // Check for circular reference
                const child = folders[childId];
                if (child && child.children && child.children.includes(folderId)) {
                    console.warn(`Removing circular reference: ${folderId} <-> ${childId}`);
                    cleanupCount++;
                    return false;
                }
                
                return true;
            });
            
            // Remove duplicate children
            const uniqueChildren = [...new Set(folder.children)];
            if (uniqueChildren.length !== folder.children.length) {
                console.warn(`Removing duplicate children from folder ${folderId}`);
                cleanupCount += folder.children.length - uniqueChildren.length;
                folder.children = uniqueChildren;
            }
            
            if (folder.children.length !== originalLength) {
                console.log(`Cleaned up folder ${folderId} (${folder.name}): removed ${originalLength - folder.children.length} invalid references`);
            }
        });
        
        if (cleanupCount > 0) {
            console.log(`Total cleanup: removed ${cleanupCount} corrupted references`);
            // Save the cleaned library
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(library));
            } catch (e) {
                console.error('Error saving cleaned library:', e);
            }
        }
    }
    
    /**
     * Manually trigger cleanup of corrupted library structure
     * @returns {Object} Cleanup results
     */
    manualCleanup() {
        console.log('Starting manual library cleanup...');
        const beforeCount = JSON.stringify(this.library).length;
        
        this.cleanupFolderStructure(this.library);
        
        const afterCount = JSON.stringify(this.library).length;
        const saved = beforeCount - afterCount;
        
        this.saveLibrary();
        
        return {
            success: true,
            bytesReclaimed: saved,
            message: `Cleanup complete. Reclaimed ${saved} bytes.`
        };
    }
    
    /**
     * Get all code files from library (supports 60+ languages)
     */
    getAllCodeFiles() {
        const codeExtensions = [
            'js', 'jsx', 'ts', 'tsx', 'mjs',
            'py', 'pyw',
            'java',
            'c', 'cpp', 'cc', 'cxx', 'h', 'hpp', 'hh', 'hxx',
            'cs',
            'go', 'rs', 'php', 'rb', 'swift', 'kt', 'kts',
            'gd', 'gdscript', 'gdshader',
            'html', 'htm', 'css', 'scss', 'sass', 'less',
            'json', 'xml', 'yaml', 'yml', 'toml',
            'sh', 'bash', 'zsh', 'bat', 'cmd', 'ps1',
            'sql', 'r', 'scala', 'lua', 'perl', 'pl',
            'dart', 'ex', 'exs', 'erl', 'hrl', 'clj', 'cljs', 'lisp', 'scm'
        ];
        
        const codeFiles = [];
        
        Object.values(this.library.files).forEach(file => {
            const ext = file.name.split('.').pop().toLowerCase();
            if (codeExtensions.includes(ext)) {
                codeFiles.push({
                    path: file.path,
                    name: file.name,
                    folder: file.folder,
                    ext: ext
                });
            }
        });
        
        return codeFiles;
    }
    
    /**
     * Get files from a specific folder (including subfolders)
     */
    getFilesInFolder(folderId, includeSubfolders = true) {
        const folder = this.library.folders[folderId];
        if (!folder) return [];
        
        const files = [];
        
        // Add files from this folder
        folder.files.forEach(filePath => {
            if (this.library.files[filePath]) {
                const file = this.library.files[filePath];
                files.push({
                    path: file.path,
                    name: file.name,
                    folder: file.folder,
                    ext: file.name.split('.').pop().toLowerCase()
                });
            }
        });
        
        // Recursively get files from subfolders
        if (includeSubfolders) {
            folder.children.forEach(childId => {
                files.push(...this.getFilesInFolder(childId, true));
            });
        }
        
        return files;
    }
    
    /**
     * Get the folder ID for a given file path
     */
    getFolderForFile(filePath) {
        const file = this.library.files[filePath];
        return file ? file.folder : null;
    }
    
    /**
     * Get folder name by ID
     */
    getFolderName(folderId) {
        const folder = this.library.folders[folderId];
        return folder ? folder.name : null;
    }
    
    /**
     * Get code files from a specific folder (including subfolders)
     */
    getCodeFilesInFolder(folderId, includeSubfolders = true) {
        const codeExtensions = [
            'js', 'jsx', 'ts', 'tsx', 'mjs',
            'py', 'pyw',
            'java',
            'c', 'cpp', 'cc', 'cxx', 'h', 'hpp', 'hh', 'hxx',
            'cs',
            'go', 'rs', 'php', 'rb', 'swift', 'kt', 'kts',
            'gd', 'gdscript', 'gdshader',
            'html', 'htm', 'css', 'scss', 'sass', 'less',
            'json', 'xml', 'yaml', 'yml', 'toml',
            'sh', 'bash', 'zsh', 'bat', 'cmd', 'ps1',
            'sql', 'r', 'scala', 'lua', 'perl', 'pl',
            'dart', 'ex', 'exs', 'erl', 'hrl', 'clj', 'cljs', 'lisp', 'scm'
        ];
        
        const allFiles = this.getFilesInFolder(folderId, includeSubfolders);
        return allFiles.filter(file => codeExtensions.includes(file.ext));
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
        if (!folder || folder.type === 'library' || folder.type === 'special') return false;
        
        // Three-stage deletion process:
        // 1. Regular folder → Move to Unfiled Items
        // 2. Folder in Unfiled → Move to Trash
        // 3. Folder in Trash → Permanently delete
        
        if (folder.parent === 'trash') {
            // Stage 3: Permanently delete
            return this.permanentlyDeleteFolder(folderId);
        } else if (folder.parent === 'unfiled') {
            // Stage 2: Move to trash
            return this.moveFolder(folderId, 'trash');
        } else {
            // Stage 1: Move to unfiled
            return this.moveFolder(folderId, 'unfiled');
        }
    }
    
    permanentlyDeleteFolder(folderId, _deletingSet = null) {
        // Initialize tracking set on first call to prevent circular references
        const isTopLevel = _deletingSet === null;
        const deletingSet = _deletingSet || new Set();
        
        // Check if we're already deleting this folder (circular reference)
        if (deletingSet.has(folderId)) {
            console.warn(`Circular reference detected: folder ${folderId} already being deleted`);
            return false;
        }
        
        // Mark this folder as being deleted BEFORE any other operations
        deletingSet.add(folderId);
        
        const folder = this.library.folders[folderId];
        if (!folder) {
            console.warn(`Folder ${folderId} not found`);
            return false;
        }
        
        if (folder.type === 'library' || folder.type === 'special') {
            console.warn(`Cannot delete special folder: ${folderId}`);
            return false;
        }
        
        // Recursively delete all child folders first
        if (folder.children && folder.children.length > 0) {
            // Filter out self-references and invalid children
            const validChildren = [...folder.children].filter(childId => {
                if (childId === folderId) {
                    console.warn(`Self-reference detected in folder ${folderId}`);
                    return false;
                }
                if (!this.library.folders[childId]) {
                    console.warn(`Invalid child reference: ${childId} in folder ${folderId}`);
                    return false;
                }
                return true;
            });
            
            validChildren.forEach(childId => {
                try {
                    this.permanentlyDeleteFolder(childId, deletingSet);
                } catch (error) {
                    console.error(`Error deleting child folder ${childId}:`, error);
                }
            });
        }
        
        // Delete all files in this folder
        if (folder.files && folder.files.length > 0) {
            folder.files.forEach(filePath => {
                if (this.library.files[filePath]) {
                    delete this.library.files[filePath];
                }
            });
        }
        
        // Remove from parent's children
        if (folder.parent && this.library.folders[folder.parent]) {
            const parent = this.library.folders[folder.parent];
            if (parent.children) {
                parent.children = parent.children.filter(id => id !== folderId);
            }
        }
        
        // Permanently delete the folder
        delete this.library.folders[folderId];
        
        // Only save once at the top level (not on every recursive call)
        if (isTopLevel) {
            this.saveLibrary();
        }
        
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
    
    addFile(filePath, fileName, folderId = 'root') {
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
        if (!trashFolder) return { deleted: 0, folders: 0, errors: [] };
        
        const filesToDelete = [...trashFolder.files]; // Copy array
        const foldersToDelete = [...trashFolder.children]; // Copy array
        let deleted = 0;
        let foldersDeleted = 0;
        const errors = [];
        
        // Delete all files in trash
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
        
        // Delete all folders in trash
        foldersToDelete.forEach(folderId => {
            try {
                if (this.permanentlyDeleteFolder(folderId)) {
                    foldersDeleted++;
                }
            } catch (error) {
                console.error('Error deleting folder:', folderId, error);
                errors.push({ folderId, error: error.message });
            }
        });
        
        return { deleted, folders: foldersDeleted, errors };
    }
    
    moveAllFilesToTrash(folderId) {
        const folder = this.library.folders[folderId];
        if (!folder) return { moved: 0, folders: 0, errors: [] };
        
        const filesToMove = [...folder.files]; // Copy array to avoid modification during iteration
        const foldersToMove = [...folder.children]; // Copy array to avoid modification during iteration
        let moved = 0;
        let foldersMoved = 0;
        const errors = [];
        
        // Move all files to trash
        filesToMove.forEach(filePath => {
            try {
                if (this.moveFileToFolder(filePath, 'trash')) {
                    moved++;
                }
            } catch (error) {
                console.error('Error moving file to trash:', filePath, error);
                errors.push({ filePath, error: error.message });
            }
        });
        
        // Move all subfolders to trash
        foldersToMove.forEach(childFolderId => {
            try {
                if (this.moveFolder(childFolderId, 'trash')) {
                    foldersMoved++;
                }
            } catch (error) {
                console.error('Error moving folder to trash:', childFolderId, error);
                errors.push({ folderId: childFolderId, error: error.message });
            }
        });
        
        return { moved, folders: foldersMoved, errors };
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
    
    addTagToFile(filePath, tag, color = 'green') {
        const fileData = this.library.files[filePath];
        if (!fileData) return false;
        
        const normalizedTag = tag.trim().toLowerCase();
        if (!normalizedTag) return false;
        
        // Check if tag already exists (by name only)
        const existingTag = fileData.tags.find(t => {
            const tagName = typeof t === 'string' ? t : t.name;
            return tagName === normalizedTag;
        });
        
        if (existingTag) return false;
        
        // Store tag as object with name and color
        fileData.tags.push({ name: normalizedTag, color: color });
        this.saveLibrary();
        return true;
    }
    
    removeTagFromFile(filePath, tag) {
        const fileData = this.library.files[filePath];
        if (!fileData) return false;
        
        const normalizedTag = tag.toLowerCase();
        const index = fileData.tags.findIndex(t => {
            const tagName = this.getTagName(t);
            return tagName === normalizedTag;
        });
        
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

