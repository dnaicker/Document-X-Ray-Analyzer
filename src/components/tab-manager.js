class TabManager {
    constructor() {
        this.tabs = []; // Array of { filePath, fileName, fileType }
        this.activeFilePath = null;
        this.container = document.getElementById('documentTabs');
        this.storageKey = 'grammar-highlighter-workspace-tabs';
        
        // Restore tabs from localStorage
        this.restoreTabs();
        
        this.render();
    }
    
    saveToStorage() {
        try {
            const workspace = {
                tabs: this.tabs.filter(t => t.fileType !== 'new'), // Don't save "New Tab" placeholders
                activeFilePath: this.activeFilePath
            };
            localStorage.setItem(this.storageKey, JSON.stringify(workspace));
        } catch (e) {
            console.error('Error saving workspace tabs:', e);
        }
    }
    
    restoreTabs() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const workspace = JSON.parse(saved);
                if (workspace.tabs && workspace.tabs.length > 0) {
                    this.tabs = workspace.tabs;
                    this.activeFilePath = workspace.activeFilePath;
                    
                    // Show tabs immediately
                    this.container.style.display = 'flex';
                    
                    // Mark that we're restoring from workspace
                    this.isRestoring = true;
                }
            }
        } catch (e) {
            console.error('Error restoring workspace tabs:', e);
        }
    }
    
    // Call this after renderer.js is fully loaded
    finishRestore() {
        if (!this.isRestoring) return;
        this.isRestoring = false;
        
        // Restore the active tab's document
        if (this.activeFilePath && window.openFileFromPath) {
            const activeTab = this.tabs.find(t => t.filePath === this.activeFilePath);
            if (activeTab) {
                // Delay to ensure all components are ready
                setTimeout(() => {
                    window.openFileFromPath(this.activeFilePath);
                }, 100);
            }
        }
    }
    
    clearWorkspace() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (e) {
            console.error('Error clearing workspace:', e);
        }
    }

    addTab(filePath, fileName, fileType) {
        if (!filePath) return;

        // Check if tab already exists
        const existingIndex = this.tabs.findIndex(t => t.filePath === filePath);
        
        if (existingIndex === -1) {
            // Check if current active tab is a 'new' tab (placeholder)
            // If so, replace it instead of adding a new one
            const activeIndex = this.tabs.findIndex(t => t.filePath === this.activeFilePath);
            if (activeIndex !== -1 && this.tabs[activeIndex].fileType === 'new') {
                this.tabs[activeIndex] = { filePath, fileName, fileType };
            } else {
                // Add new tab
                this.tabs.push({ filePath, fileName, fileType });
            }
        }
        
        this.activeFilePath = filePath;
        this.saveToStorage();
        this.render();
        this.container.style.display = 'flex';
    }
    
    openNewTab() {
        // Create a unique ID for the new tab
        const newTabId = 'new-tab-' + Date.now();
        
        // Save current state before switching
        if (window.saveCurrentState) {
            window.saveCurrentState().then(() => {
                this.tabs.push({ filePath: newTabId, fileName: 'New Tab', fileType: 'new' });
                this.activeFilePath = newTabId;
                this.render();
                this.container.style.display = 'flex';
                
                if (window.showNewTabScreen) {
                    window.showNewTabScreen();
                }
            });
        } else {
            this.tabs.push({ filePath: newTabId, fileName: 'New Tab', fileType: 'new' });
            this.activeFilePath = newTabId;
            this.render();
            this.container.style.display = 'flex';
            
            if (window.showNewTabScreen) {
                window.showNewTabScreen();
            }
        }
    }

    removeTab(filePath) {
        const index = this.tabs.findIndex(t => t.filePath === filePath);
        if (index === -1) return;

        // Remove tab
        this.tabs.splice(index, 1);

        // If closing active tab, switch to another
        if (this.activeFilePath === filePath) {
            if (this.tabs.length > 0) {
                // Switch to the last used tab (or just the previous one in list)
                const newActive = this.tabs[Math.max(0, index - 1)];
                this.switchTab(newActive.filePath);
            } else {
                // No tabs left
                this.activeFilePath = null;
                this.container.style.display = 'none';
                
                // Clear workspace since no tabs are open
                this.clearWorkspace();
                
                // Trigger close file logic in renderer
                if (window.closeCurrentFile) window.closeCurrentFile();
            }
        } else {
            // Just re-render if we closed a background tab
            this.render();
        }
        
        // Save updated tabs
        this.saveToStorage();
    }

    setActive(filePath) {
        if (this.activeFilePath === filePath) return;
        this.activeFilePath = filePath;
        this.saveToStorage();
        this.render();
    }

    updateTabState(filePath, state) {
        const tab = this.tabs.find(t => t.filePath === filePath);
        if (tab) {
            // Merge state
            tab.cachedState = { ...(tab.cachedState || {}), ...state };
        }
    }

    getTabState(filePath) {
        const tab = this.tabs.find(t => t.filePath === filePath);
        return tab ? tab.cachedState : null;
    }

    switchTab(filePath) {
        if (this.activeFilePath === filePath) return;
        
        // Check if target is a "new tab"
        const tab = this.tabs.find(t => t.filePath === filePath);
        const isNewTab = tab && tab.fileType === 'new';
        
        const switchAction = () => {
            this.activeFilePath = filePath;
            this.saveToStorage();
            this.render();
            
            if (isNewTab) {
                if (window.showNewTabScreen) window.showNewTabScreen();
            } else {
                // Retrieve cached state
                const cachedState = this.getTabState(filePath);
                
                // Trigger file open in renderer
                if (window.openFileFromPath) {
                    window.openFileFromPath(filePath, null, cachedState);
                }
            }
        };

        // Save current state before switching
        if (window.saveCurrentState) {
            window.saveCurrentState().then(switchAction);
        } else {
            switchAction();
        }
    }

    render() {
        let html = this.tabs.map(tab => {
            const isActive = tab.filePath === this.activeFilePath;
            let icon = '📄';
            if (tab.fileType === 'pdf') icon = '📕';
            else if (tab.fileType === 'epub') icon = '📘';
            else if (tab.fileType === 'docx') icon = '📝';
            else if (tab.fileType === 'new') icon = '✨';

            // Handle backslashes for JS string escaping
            const safePath = tab.filePath.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            const safeName = this.escapeHtml(tab.fileName);

            return `
                <div class="doc-tab ${isActive ? 'active' : ''}" onclick="tabManager.switchTab('${safePath}')">
                    <span class="doc-tab-icon">${icon}</span>
                    <span class="doc-tab-title" title="${safeName}">${safeName}</span>
                    <span class="doc-tab-close" onclick="event.stopPropagation(); tabManager.removeTab('${safePath}')">×</span>
                </div>
            `;
        }).join('');
        
        // Add New Tab Button
        html += `
            <div class="doc-tab new-tab-btn" onclick="tabManager.openNewTab()" title="Open New Tab" style="min-width: 40px; max-width: 40px; justify-content: center; padding: 8px;">
                <span class="doc-tab-icon" style="font-size: 16px; font-weight: bold;">+</span>
            </div>
        `;

        this.container.innerHTML = html;
        
        // Ensure container is visible if we have tabs or just the + button (always visible if we want to allow adding tabs)
        // But typically tabs are only shown if there's content? 
        // User wants to open new tab. If no files open, where is the + button?
        // If no files open, we are on welcome screen.
        // If user wants tabs always visible:
        this.container.style.display = 'flex';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize global instance
const tabManager = new TabManager();

