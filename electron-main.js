const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false // Allow loading local PDFs
    },
    icon: path.join(__dirname, 'assets', 'icons', 'icon.png'),
    title: 'Grammar Highlighter'
  });

  // Create Application Menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            if (mainWindow) mainWindow.webContents.send('menu-open-file');
          }
        },
        {
          label: 'Sync with Drive',
          click: () => {
            if (mainWindow) mainWindow.webContents.send('menu-sync-drive');
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
    {
      role: 'help',
      submenu: [
        {
          label: 'Learn More',
          click: async () => {
            const { shell } = require('electron');
            await shell.openExternal('https://github.com');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  mainWindow.loadFile('src/index.html');

  // Open DevTools in development only
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App ready
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('open-file-dialog', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Supported Documents', extensions: ['pdf', 'epub', 'docx', 'md'] },
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'EPUB Files', extensions: ['epub'] },
        { name: 'Word Documents', extensions: ['docx'] },
        { name: 'Markdown Files', extensions: ['md'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const ext = path.extname(filePath).toLowerCase();
      return {
        canceled: false,
        filePath: filePath,
        fileName: path.basename(filePath),
        fileType: ext.substring(1) // Remove the dot
      };
    }

    return { canceled: true };
  } catch (error) {
    console.error('Error in open-file-dialog handler:', error);
    return { canceled: true, error: error.message };
  }
});

ipcMain.handle('read-pdf-file', async (event, filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    return {
      success: true,
      data: Array.from(new Uint8Array(buffer))
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Read EPUB file
ipcMain.handle('read-epub-file', async (event, filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    return {
      success: true,
      data: Array.from(new Uint8Array(buffer))
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Read DOCX file
ipcMain.handle('read-docx-file', async (event, filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    return {
      success: true,
      data: Array.from(new Uint8Array(buffer))
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

// Read Markdown file
ipcMain.handle('read-markdown-file', async (event, filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    return {
      success: true,
      data: Array.from(new Uint8Array(buffer))
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
});

ipcMain.handle('save-analysis', async (event, data) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: 'grammar-analysis.json',
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'Text Files', extensions: ['txt'] }
    ]
  });

  if (!result.canceled && result.filePath) {
    try {
      fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  return { canceled: true };
});

ipcMain.handle('save-file-dialog', async (event, options) => {
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('write-file', async (event, { filePath, content }) => {
  try {
    fs.writeFileSync(filePath, content);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Generic file reader for uploads
ipcMain.handle('read-file-buffer', async (event, filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    return { success: true, data: Array.from(new Uint8Array(buffer)) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get File Info Handler (for cross-document navigation)
ipcMain.handle('get-file-info', async (event, filePath) => {
  try {
    const exists = fs.existsSync(filePath);
    if (!exists) {
      return { exists: false };
    }
    
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();
    let fileType = 'pdf';
    
    if (ext === '.epub') fileType = 'epub';
    else if (ext === '.docx') fileType = 'docx';
    else if (ext === '.md') fileType = 'md';
    
    return {
      exists: true,
      fileName: fileName,
      filePath: filePath,
      fileType: fileType
    };
  } catch (error) {
    return { exists: false, error: error.message };
  }
});

// Google OAuth Handler
ipcMain.handle('google-oauth-start', async (event, authUrl) => {
  return new Promise((resolve, reject) => {
    const authWindow = new BrowserWindow({
      width: 600,
      height: 700,
      show: true,
      title: 'Google Login',
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    let resolved = false;

    const handleUrl = (url) => {
      if (url.startsWith('http://localhost/callback')) {
        resolved = true;
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code');
        const error = urlObj.searchParams.get('error');

        if (code) {
          resolve(code);
        } else if (error) {
          reject(new Error(error));
        } else {
          reject(new Error('No code found'));
        }
        
        authWindow.close();
      }
    };

    authWindow.webContents.on('will-navigate', (event, url) => {
      handleUrl(url);
    });

    authWindow.webContents.on('will-redirect', (event, url) => {
      handleUrl(url);
    });

    authWindow.loadURL(authUrl);

    authWindow.on('closed', () => {
      if (!resolved) {
        reject(new Error('Window closed'));
      }
    });
  });
});

console.log('Grammar Highlighter Desktop started');

