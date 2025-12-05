/**
 * Capacitor Bridge
 * Replaces Electron IPC calls with Capacitor equivalents
 * This allows the same codebase to work on both desktop and mobile
 */

import { Filesystem, Directory } from '@capacitor/filesystem';
import { Browser } from '@capacitor/browser';
import { Share } from '@capacitor/share';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Network } from '@capacitor/network';

// Platform detection
export const isMobile = !window.require;
export const isDesktop = !!window.require;

/**
 * File System Operations
 */
export const fileSystem = {
  /**
   * Show file picker dialog
   */
  async openFile(options = {}) {
    if (isDesktop) {
      // Electron IPC call
      const { ipcRenderer } = window.require('electron');
      return await ipcRenderer.invoke('dialog:openFile', options);
    } else {
      // On mobile, we'll use a file input element
      return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = options.filters?.map(f => f.extensions.map(e => '.' + e).join(',')).join(',') || '*/*';
        
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) {
            resolve({ canceled: true });
            return;
          }
          
          try {
            // Read file as base64
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                canceled: false,
                filePaths: [file.name],
                fileData: reader.result,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          } catch (error) {
            reject(error);
          }
        };
        
        input.click();
      });
    }
  },

  /**
   * Open folder picker (mobile will use file picker)
   */
  async openFolder(options = {}) {
    if (isDesktop) {
      const { ipcRenderer } = window.require('electron');
      return await ipcRenderer.invoke('dialog:openDirectory', options);
    } else {
      // Mobile: Use file picker with multiple files
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.webkitdirectory = true; // May not work on all browsers
        
        input.onchange = async (e) => {
          const files = Array.from(e.target.files);
          if (files.length === 0) {
            resolve({ canceled: true });
            return;
          }
          
          resolve({
            canceled: false,
            filePaths: files.map(f => f.name),
            files: files
          });
        };
        
        input.click();
      });
    }
  },

  /**
   * Read file from path
   */
  async readFile(filePath, encoding = 'utf8') {
    if (isDesktop) {
      const { ipcRenderer } = window.require('electron');
      return await ipcRenderer.invoke('read-file', filePath, encoding);
    } else {
      try {
        const result = await Filesystem.readFile({
          path: filePath,
          directory: Directory.Data
        });
        return result.data;
      } catch (error) {
        console.error('Error reading file:', error);
        throw error;
      }
    }
  },

  /**
   * Write file to path
   */
  async writeFile(filePath, content) {
    if (isDesktop) {
      const { ipcRenderer } = window.require('electron');
      return await ipcRenderer.invoke('write-file', { filePath, content });
    } else {
      try {
        await Filesystem.writeFile({
          path: filePath,
          data: content,
          directory: Directory.Data,
          encoding: 'utf8'
        });
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  },

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    if (isDesktop) {
      const { ipcRenderer } = window.require('electron');
      return await ipcRenderer.invoke('file-exists', filePath);
    } else {
      try {
        await Filesystem.stat({
          path: filePath,
          directory: Directory.Data
        });
        return { exists: true };
      } catch (error) {
        return { exists: false };
      }
    }
  },

  /**
   * Get app data directory
   */
  getAppDataPath() {
    if (isDesktop) {
      const { ipcRenderer } = window.require('electron');
      return ipcRenderer.sendSync('get-app-data-path');
    } else {
      // On mobile, we use Capacitor's data directory
      return Directory.Data;
    }
  }
};

/**
 * Browser/OAuth Operations
 */
export const browser = {
  /**
   * Open external URL
   */
  async openExternal(url) {
    if (isDesktop) {
      const { shell } = window.require('electron');
      return await shell.openExternal(url);
    } else {
      await Browser.open({ url });
    }
  },

  /**
   * Google OAuth (for Drive sync)
   */
  async googleOAuthStart(authUrl) {
    if (isDesktop) {
      const { ipcRenderer } = window.require('electron');
      return await ipcRenderer.invoke('google-oauth-start', authUrl);
    } else {
      // On mobile, use in-app browser and listen for callback
      return new Promise(async (resolve, reject) => {
        const listener = await Browser.addListener('browserFinished', () => {
          // Handle callback URL parsing
          // This requires custom URL scheme handling in Android
          Browser.removeAllListeners();
        });

        await Browser.open({
          url: authUrl,
          windowName: '_self'
        });

        // Timeout after 5 minutes
        setTimeout(() => {
          Browser.removeAllListeners();
          reject(new Error('OAuth timeout'));
        }, 300000);
      });
    }
  }
};

/**
 * Share functionality (mobile-specific)
 */
export const share = {
  async shareFile(title, text, url) {
    if (isMobile) {
      await Share.share({
        title: title,
        text: text,
        url: url,
        dialogTitle: 'Share via'
      });
    } else {
      // Desktop: Copy to clipboard or show message
      console.log('Share not available on desktop');
    }
  }
};

/**
 * Haptic feedback (mobile-only)
 */
export const haptics = {
  async light() {
    if (isMobile) {
      await Haptics.impact({ style: ImpactStyle.Light });
    }
  },
  
  async medium() {
    if (isMobile) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    }
  },
  
  async heavy() {
    if (isMobile) {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    }
  }
};

/**
 * Network status
 */
export const network = {
  async getStatus() {
    if (isDesktop) {
      return { connected: true, connectionType: 'unknown' };
    } else {
      return await Network.getStatus();
    }
  },

  addListener(callback) {
    if (isMobile) {
      Network.addListener('networkStatusChange', callback);
    }
  }
};

/**
 * Storage (unified interface)
 */
export const storage = {
  async get(key) {
    return localStorage.getItem(key);
  },
  
  async set(key, value) {
    localStorage.setItem(key, value);
  },
  
  async remove(key) {
    localStorage.removeItem(key);
  },
  
  async clear() {
    localStorage.clear();
  }
};

// Export default object with all APIs
export default {
  fileSystem,
  browser,
  share,
  haptics,
  network,
  storage,
  isMobile,
  isDesktop
};

