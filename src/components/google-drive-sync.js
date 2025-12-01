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
}

module.exports = GoogleDriveSync;

