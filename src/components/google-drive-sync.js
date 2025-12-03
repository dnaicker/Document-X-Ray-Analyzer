const { ipcRenderer } = require('electron');
const config = require('../../config');

class GoogleDriveSync {
    constructor() {
        this.clientId = config.google.clientId;
        this.clientSecret = config.google.clientSecret;
        this.redirectUri = config.google.redirectUri;
        this.scope = 'https://www.googleapis.com/auth/drive.file';
        
        this.accessToken = localStorage.getItem('gdrive_access_token');
        this.refreshToken = localStorage.getItem('gdrive_refresh_token');
        this.tokenExpiry = parseInt(localStorage.getItem('gdrive_token_expiry') || '0');
        
        this.folderName = 'Grammar Highlighter Data';
        this.folderId = localStorage.getItem('gdrive_folder_id');
    }

    isAuthenticated() {
        return !!this.refreshToken;
    }

    async login() {
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${this.clientId}&` +
            `redirect_uri=${encodeURIComponent(this.redirectUri)}&` +
            `response_type=code&` +
            `scope=${encodeURIComponent(this.scope)}&` +
            `access_type=offline&` +
            `prompt=consent`;

        try {
            const code = await ipcRenderer.invoke('google-oauth-start', authUrl);
            if (code) {
                await this.exchangeCodeForToken(code);
                return true;
            }
        } catch (error) {
            console.error('Auth failed:', error);
            throw error;
        }
        return false;
    }

    async logout() {
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = 0;
        this.folderId = null;
        
        localStorage.removeItem('gdrive_access_token');
        localStorage.removeItem('gdrive_refresh_token');
        localStorage.removeItem('gdrive_token_expiry');
        localStorage.removeItem('gdrive_folder_id');
    }

    async exchangeCodeForToken(code) {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: this.clientId,
                client_secret: this.clientSecret,
                redirect_uri: this.redirectUri,
                grant_type: 'authorization_code'
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error_description || data.error);

        this.saveTokens(data);
    }

    async refreshAccessToken() {
        if (!this.refreshToken) throw new Error('No refresh token');

        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                refresh_token: this.refreshToken,
                client_id: this.clientId,
                client_secret: this.clientSecret,
                grant_type: 'refresh_token'
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error_description || data.error);

        this.saveTokens(data);
    }

    saveTokens(data) {
        this.accessToken = data.access_token;
        localStorage.setItem('gdrive_access_token', this.accessToken);
        
        if (data.refresh_token) {
            this.refreshToken = data.refresh_token;
            localStorage.setItem('gdrive_refresh_token', this.refreshToken);
        }
        
        if (data.expires_in) {
            this.tokenExpiry = Date.now() + (data.expires_in * 1000);
            localStorage.setItem('gdrive_token_expiry', this.tokenExpiry);
        }
    }

    async getAccessToken() {
        if (Date.now() >= this.tokenExpiry - 60000) {
            await this.refreshAccessToken();
        }
        return this.accessToken;
    }

    // Drive API Helper
    async callApi(endpoint, method = 'GET', body = null, contentType = 'application/json') {
        const token = await this.getAccessToken();
        const headers = {
            'Authorization': `Bearer ${token}`
        };
        
        if (contentType) {
            headers['Content-Type'] = contentType;
        }

        const options = { method, headers };
        if (body) options.body = body;

        const response = await fetch(`https://www.googleapis.com/drive/v3${endpoint}`, options);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        return response.json();
    }

    // --- Sync Logic ---

    async ensureFolder() {
        if (this.folderId) return this.folderId;

        // Search for folder
        const query = `mimeType='application/vnd.google-apps.folder' and name='${this.folderName}' and trashed=false`;
        const search = await this.callApi(`/files?q=${encodeURIComponent(query)}`);

        if (search.files && search.files.length > 0) {
            this.folderId = search.files[0].id;
        } else {
            // Create folder
            const create = await this.callApi('/files', 'POST', JSON.stringify({
                name: this.folderName,
                mimeType: 'application/vnd.google-apps.folder'
            }));
            this.folderId = create.id;
        }
        
        localStorage.setItem('gdrive_folder_id', this.folderId);
        return this.folderId;
    }

    async uploadJson(filename, data) {
        const folderId = await this.ensureFolder();
        
        // Check if file exists
        const query = `name='${filename}' and '${folderId}' in parents and trashed=false`;
        const search = await this.callApi(`/files?q=${encodeURIComponent(query)}`);

        const fileContent = JSON.stringify(data, null, 2);
        const metadata = {
            name: filename,
            mimeType: 'application/json',
            parents: [folderId]
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([fileContent], { type: 'application/json' }));

        const token = await this.getAccessToken();
        
        let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        let method = 'POST';

        if (search.files && search.files.length > 0) {
            // Update existing
            const fileId = search.files[0].id;
            url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
            method = 'PATCH';
            // For update, we don't send parents
            delete metadata.parents;
             form.set('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        }

        const response = await fetch(url, {
            method: method,
            headers: { 'Authorization': `Bearer ${token}` },
            body: form
        });

        if (!response.ok) throw new Error('Upload failed');
        return response.json();
    }

    async downloadJson(filename) {
        const folderId = await this.ensureFolder();
        const query = `name='${filename}' and '${folderId}' in parents and trashed=false`;
        const search = await this.callApi(`/files?q=${encodeURIComponent(query)}`);

        if (!search.files || search.files.length === 0) return null;

        const fileId = search.files[0].id;
        const token = await this.getAccessToken();
        
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Download failed');
        return response.json();
    }

    async downloadFile(fileId) {
        const token = await this.getAccessToken();
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Download failed');
        return await response.arrayBuffer();
    }

    // Upload current document (PDF/EPUB/DOCX)
    // This requires reading the file from disk first
    async uploadDocument(filePath, fileName, mimeType) {
        const folderId = await this.ensureFolder();

        // Check existence
        const query = `name='${fileName}' and '${folderId}' in parents and trashed=false`;
        const search = await this.callApi(`/files?q=${encodeURIComponent(query)}`);

        if (search.files && search.files.length > 0) {
            // Already exists, return its ID
            return search.files[0].id;
        }

        // Need to read file in renderer process or pass buffer
        const fileData = await ipcRenderer.invoke('read-file-buffer', filePath);
        if (!fileData.success) throw new Error('Could not read local file');

        const metadata = {
            name: fileName,
            parents: [folderId]
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([new Uint8Array(fileData.data)], { type: mimeType || 'application/octet-stream' }));

        const token = await this.getAccessToken();
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: form
        });

        if (!response.ok) throw new Error('Document upload failed');
        return response.json();
    }

    /**
     * Create a folder in Google Drive
     * @param {string} folderName - Name of the folder
     * @param {string} parentId - Parent folder ID (or root if not specified)
     * @returns {string} The created folder ID
     */
    async createDriveFolder(folderName, parentId = null) {
        const actualParentId = parentId || await this.ensureFolder();
        
        // Check if folder already exists
        const query = `name='${folderName}' and '${actualParentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
        const search = await this.callApi(`/files?q=${encodeURIComponent(query)}`);
        
        if (search.files && search.files.length > 0) {
            return search.files[0].id;
        }
        
        // Create new folder
        const metadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [actualParentId]
        };
        
        const result = await this.callApi('/files', 'POST', JSON.stringify(metadata));
        return result.id;
    }

    /**
     * Upload a file to a specific folder in Google Drive
     * @param {string} filePath - Local file path
     * @param {string} fileName - File name
     * @param {string} driveFolderId - Google Drive folder ID
     * @param {string} mimeType - MIME type
     * @returns {object} Upload result
     */
    async uploadFileToFolder(filePath, fileName, driveFolderId, mimeType) {
        // Check if file already exists in this folder
        const query = `name='${fileName}' and '${driveFolderId}' in parents and trashed=false`;
        const search = await this.callApi(`/files?q=${encodeURIComponent(query)}`);
        
        if (search.files && search.files.length > 0) {
            return { id: search.files[0].id, existed: true };
        }
        
        // Read file data
        const fileData = await ipcRenderer.invoke('read-file-buffer', filePath);
        if (!fileData.success) throw new Error('Could not read local file');
        
        const metadata = {
            name: fileName,
            parents: [driveFolderId]
        };
        
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([new Uint8Array(fileData.data)], { type: mimeType || 'application/octet-stream' }));
        
        const token = await this.getAccessToken();
        const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: form
        });
        
        if (!response.ok) throw new Error('File upload failed');
        const result = await response.json();
        return { id: result.id, existed: false };
    }

    /**
     * Complete backup: Sync entire library structure + all notes/highlights/analysis to Google Drive
     * @param {object} library - Library object from LibraryManager
     * @param {object} allNotes - All notes from NotesManager
     * @param {object} allAnalysis - All analysis cache data
     * @param {function} progressCallback - Progress callback(current, total, message)
     * @returns {object} Sync result
     */
    async syncLibraryStructure(library, allNotes = null, allAnalysis = null, progressCallback = null) {
        const rootFolderId = await this.ensureFolder();
        const folderMap = new Map(); // Maps library folder IDs to Drive folder IDs
        const results = {
            foldersCreated: 0,
            filesUploaded: 0,
            filesSkipped: 0,
            notesBackedUp: 0,
            analysisBackedUp: 0,
            errors: []
        };
        
        try {
            // Map root to Drive root
            folderMap.set('root', rootFolderId);
            
            // Get all folders sorted by hierarchy (parents before children)
            const folders = Object.values(library.folders || {})
                .filter(f => f.type === 'folder')
                .sort((a, b) => {
                    // Sort by depth (root first, then children)
                    const depthA = this.getFolderDepth(a, library.folders);
                    const depthB = this.getFolderDepth(b, library.folders);
                    return depthA - depthB;
                });
            
            // Create folders
            for (const folder of folders) {
                try {
                    const parentDriveId = folderMap.get(folder.parent || 'root');
                    if (!parentDriveId) {
                        results.errors.push(`Parent not found for folder: ${folder.name}`);
                        continue;
                    }
                    
                    const driveFolderId = await this.createDriveFolder(folder.name, parentDriveId);
                    folderMap.set(folder.id, driveFolderId);
                    results.foldersCreated++;
                    
                    if (progressCallback) {
                        progressCallback(results.foldersCreated, folders.length, `Creating folder: ${folder.name}`);
                    }
                } catch (error) {
                    results.errors.push(`Error creating folder ${folder.name}: ${error.message}`);
                }
            }
            
            // Upload files
            const files = Object.values(library.files || {});
            let fileIndex = 0;
            
            for (const file of files) {
                try {
                    fileIndex++;
                    const folderDriveId = folderMap.get(file.folder) || rootFolderId;
                    
                    // Determine MIME type
                    const ext = file.path.split('.').pop().toLowerCase();
                    const mimeTypes = {
                        'pdf': 'application/pdf',
                        'epub': 'application/epub+zip',
                        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                        'md': 'text/markdown',
                        'txt': 'text/plain'
                    };
                    const mimeType = mimeTypes[ext] || 'application/octet-stream';
                    
                    const result = await this.uploadFileToFolder(file.path, file.name, folderDriveId, mimeType);
                    
                    if (result.existed) {
                        results.filesSkipped++;
                    } else {
                        results.filesUploaded++;
                    }
                    
                    if (progressCallback) {
                        progressCallback(fileIndex, files.length, `Uploading: ${file.name}`);
                    }
                } catch (error) {
                    results.errors.push(`Error uploading ${file.name}: ${error.message}`);
                    results.filesSkipped++;
                }
            }
            
            // Backup notes for all files
            if (allNotes) {
                if (progressCallback) {
                    progressCallback(0, Object.keys(allNotes).length, 'Backing up notes and highlights...');
                }
                
                const notesData = {};
                Object.keys(allNotes).forEach(filePath => {
                    if (allNotes[filePath] && allNotes[filePath].length > 0) {
                        notesData[filePath] = allNotes[filePath];
                        results.notesBackedUp++;
                    }
                });
                
                if (Object.keys(notesData).length > 0) {
                    await this.uploadJson('all-notes.json', notesData);
                }
            }
            
            // Backup analysis cache for all files
            if (allAnalysis) {
                if (progressCallback) {
                    progressCallback(0, Object.keys(allAnalysis).length, 'Backing up analysis cache...');
                }
                
                const analysisData = {};
                Object.keys(allAnalysis).forEach(filePath => {
                    if (allAnalysis[filePath]) {
                        analysisData[filePath] = allAnalysis[filePath];
                        results.analysisBackedUp++;
                    }
                });
                
                if (Object.keys(analysisData).length > 0) {
                    await this.uploadJson('all-analysis.json', analysisData);
                }
            }
            
            // Upload complete backup metadata
            await this.uploadJson('library-complete-backup.json', {
                library: library,
                syncDate: new Date().toISOString(),
                folderMap: Array.from(folderMap.entries()),
                stats: {
                    folders: results.foldersCreated,
                    files: results.filesUploaded,
                    notes: results.notesBackedUp,
                    analysis: results.analysisBackedUp
                }
            });
            
            return results;
        } catch (error) {
            results.errors.push(`Sync failed: ${error.message}`);
            return results;
        }
    }

    /**
     * Helper to calculate folder depth
     */
    getFolderDepth(folder, allFolders, depth = 0) {
        if (!folder.parent || folder.parent === 'root') return depth;
        const parent = allFolders[folder.parent];
        if (!parent) return depth;
        return this.getFolderDepth(parent, allFolders, depth + 1);
    }

    /**
     * Download and restore complete backup from Google Drive
     * @returns {object} Complete backup data (library + notes + analysis)
     */
    async downloadCompleteBackup() {
        try {
            const backup = await this.downloadJson('library-complete-backup.json');
            
            if (!backup) {
                // Fallback to old structure for backwards compatibility
                return await this.downloadJson('library-structure.json');
            }
            
            // Download notes
            try {
                const notes = await this.downloadJson('all-notes.json');
                if (notes) backup.notes = notes;
            } catch (e) {
                console.log('No notes backup found');
            }
            
            // Download analysis cache
            try {
                const analysis = await this.downloadJson('all-analysis.json');
                if (analysis) backup.analysis = analysis;
            } catch (e) {
                console.log('No analysis backup found');
            }
            
            return backup;
        } catch (error) {
            console.error('Error downloading backup:', error);
            return null;
        }
    }
}


module.exports = GoogleDriveSync;

