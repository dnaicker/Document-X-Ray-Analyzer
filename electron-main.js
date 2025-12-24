const { app, BrowserWindow, ipcMain, dialog, Menu, session } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

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
          label: 'Open Folder...',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => {
            if (mainWindow) mainWindow.webContents.send('menu-open-folder');
          }
        },
        { type: 'separator' },
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
app.whenReady().then(async () => {
  // Clear cache on startup to fix Chromium disk cache errors
  try {
    await session.defaultSession.clearCache();
    console.log('✓ Cache cleared successfully');
  } catch (error) {
    console.log('Cache clear warning (non-critical):', error.message);
  }
  
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

// Clean up cache before quitting to prevent corruption
app.on('before-quit', async (event) => {
  try {
    await session.defaultSession.clearCache();
    console.log('✓ Cache cleared on exit');
  } catch (error) {
    // Non-critical, allow app to quit
    console.log('Cache clear on exit warning:', error.message);
  }
});

// IPC Handlers
ipcMain.handle('open-file-dialog', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile'],
      filters: [
        { name: 'Supported Documents', extensions: ['pdf', 'epub', 'docx', 'md', 'txt'] },
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'EPUB Files', extensions: ['epub'] },
        { name: 'Word Documents', extensions: ['docx'] },
        { name: 'Markdown Files', extensions: ['md'] },
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'JavaScript/TypeScript', extensions: ['js', 'jsx', 'ts', 'tsx', 'mjs'] },
        { name: 'Python', extensions: ['py', 'pyw'] },
        { name: 'Java', extensions: ['java'] },
        { name: 'C/C++', extensions: ['c', 'cpp', 'cc', 'cxx', 'h', 'hpp', 'hh', 'hxx'] },
        { name: 'C#', extensions: ['cs'] },
        { name: 'Web', extensions: ['html', 'htm', 'css', 'scss', 'sass', 'less'] },
        { name: 'Data', extensions: ['json', 'xml', 'yaml', 'yml', 'toml'] },
        { name: 'Shell Scripts', extensions: ['sh', 'bash', 'zsh', 'bat', 'cmd', 'ps1'] },
        { name: 'Godot Engine', extensions: ['gd', 'gdscript', 'gdshader', 'tscn', 'tres'] },
        { name: 'Other Languages', extensions: ['go', 'rs', 'php', 'rb', 'swift', 'kt', 'sql', 'r', 'scala', 'lua', 'perl', 'pl', 'dart', 'ex', 'exs', 'erl', 'clj', 'lisp'] },
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

// Read Text file
ipcMain.handle('read-txt-file', async (event, filePath) => {
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

// Read Source Code file
ipcMain.handle('read-code-file', async (event, filePath) => {
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

// Open folder dialog
ipcMain.handle('open-folder-dialog', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return {
        canceled: false,
        folderPath: result.filePaths[0],
        folderName: path.basename(result.filePaths[0])
      };
    }

    return { canceled: true };
  } catch (error) {
    console.error('Error in open-folder-dialog handler:', error);
    return { canceled: true, error: error.message };
  }
});

// Scan folder for supported files
ipcMain.handle('scan-folder', async (event, folderPath) => {
  try {
    // Document formats
    const supportedExtensions = ['.pdf', '.epub', '.docx', '.md', '.txt'];
    
    // Source code extensions
    const codeExtensions = [
      // JavaScript/TypeScript
      '.js', '.jsx', '.ts', '.tsx', '.mjs',
      // Python
      '.py', '.pyw',
      // Java
      '.java',
      // C/C++
      '.c', '.cpp', '.cc', '.cxx', '.h', '.hpp', '.hh', '.hxx',
      // C#
      '.cs',
      // Web
      '.html', '.htm', '.css', '.scss', '.sass', '.less',
      // Data formats
      '.json', '.xml', '.yaml', '.yml', '.toml',
      // Shell scripts
      '.sh', '.bash', '.zsh', '.bat', '.cmd', '.ps1',
      // Godot Engine
      '.gd', '.gdscript', '.gdshader', '.tscn', '.tres',
      // Other languages
      '.go', '.rs', '.php', '.rb', '.swift', '.kt', '.kts',
      '.sql', '.r', '.scala', '.lua', '.perl', '.pl',
      '.vim', '.gradle', '.groovy', '.dart', '.ex', '.exs',
      '.erl', '.hrl', '.clj', '.cljs', '.lisp', '.scm'
    ];
    
    const allExtensions = [...supportedExtensions, ...codeExtensions];
    const files = [];

    function scanDirectory(dirPath, relativePath = '', visitedPaths = new Set()) {
      // Prevent circular references by tracking visited paths
      const realPath = fs.realpathSync(dirPath);
      if (visitedPaths.has(realPath)) {
        console.warn(`Skipping already visited directory (circular reference): ${dirPath}`);
        return;
      }
      visitedPaths.add(realPath);
      
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relPath = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
          // Skip common directories that shouldn't be scanned
          const skipDirs = [
            'node_modules', '.git', '.svn', '.hg', 'dist', 'build', 
            '__pycache__', '.venv', 'venv', '.godot', '.import', 
            'target', 'bin', 'obj', '.vs', '.idea', '.vscode',
            '.cursor', 'out', 'Debug', 'Release', 'x64', 'x86'
          ];
          if (skipDirs.includes(entry.name)) {
            continue;
          }
          
          // Skip symbolic links to prevent circular references
          try {
            const stats = fs.lstatSync(fullPath);
            if (stats.isSymbolicLink()) {
              console.warn(`Skipping symbolic link: ${fullPath}`);
              continue;
            }
          } catch (error) {
            console.warn(`Error checking path ${fullPath}:`, error.message);
            continue;
          }
          
          // Recursively scan subdirectories with visited paths tracking
          scanDirectory(fullPath, relPath, visitedPaths);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (allExtensions.includes(ext)) {
            let fileType = 'pdf';
            if (ext === '.epub') fileType = 'epub';
            else if (ext === '.docx') fileType = 'docx';
            else if (ext === '.md') fileType = 'md';
            else if (ext === '.txt') fileType = 'txt';
            else if (codeExtensions.includes(ext)) {
              // Use the extension without the dot as the file type for code files
              fileType = ext.substring(1);
            }

            // Get the folder path (directory containing the file)
            let folderPath = path.dirname(relPath);
            // Handle root-level files (path.dirname returns '.' for root files)
            if (folderPath === '.') folderPath = '';
            
            files.push({
              fileName: entry.name,
              filePath: fullPath,
              relativePath: relPath,
              folderPath: folderPath,
              fileType: fileType
            });
          }
        }
      }
    }

    scanDirectory(folderPath);

    return {
      success: true,
      files: files,
      totalFiles: files.length
    };
  } catch (error) {
    console.error('Error scanning folder:', error);
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
    else if (ext === '.txt') fileType = 'txt';
    
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

// Fetch URL Content Handler
ipcMain.handle('fetch-url-content', async (event, url) => {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;
      
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      };
      
      const request = protocol.get(url, options, (response) => {
        // Handle redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          const redirectUrl = new URL(response.headers.location, url).toString();
          console.log('Following redirect to:', redirectUrl);
          
          // Recursively handle redirect
          ipcMain.handle('fetch-url-content', async (event, url) => {
            return fetchUrlContent(url);
          });
          
          return resolve(fetchUrlContent(redirectUrl));
        }
        
        if (response.statusCode !== 200) {
          return resolve({
            success: false,
            error: `HTTP ${response.statusCode}: ${response.statusMessage}`
          });
        }
        
        let data = '';
        response.setEncoding('utf8');
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          try {
            // Extract title from HTML
            const titleMatch = data.match(/<title[^>]*>([^<]+)<\/title>/i);
            const title = titleMatch ? titleMatch[1].trim() : 'Web Page';
            
            resolve({
              success: true,
              content: data,
              title: title,
              url: url
            });
          } catch (error) {
            resolve({
              success: false,
              error: 'Failed to parse response: ' + error.message
            });
          }
        });
      });
      
      request.on('error', (error) => {
        resolve({
          success: false,
          error: error.message
        });
      });
      
      request.setTimeout(30000, () => {
        request.destroy();
        resolve({
          success: false,
          error: 'Request timeout'
        });
      });
      
    } catch (error) {
      resolve({
        success: false,
        error: error.message
      });
    }
  });
});

// Helper function for recursive redirect handling
function fetchUrlContent(url) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(url);
      const protocol = urlObj.protocol === 'https:' ? https : http;
      
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      };
      
      const request = protocol.get(url, options, (response) => {
        // Handle redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          const redirectUrl = new URL(response.headers.location, url).toString();
          console.log('Following redirect to:', redirectUrl);
          return resolve(fetchUrlContent(redirectUrl));
        }
        
        if (response.statusCode !== 200) {
          return resolve({
            success: false,
            error: `HTTP ${response.statusCode}: ${response.statusMessage}`
          });
        }
        
        let data = '';
        response.setEncoding('utf8');
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          try {
            // Extract title from HTML
            const titleMatch = data.match(/<title[^>]*>([^<]+)<\/title>/i);
            const title = titleMatch ? titleMatch[1].trim() : 'Web Page';
            
            resolve({
              success: true,
              content: data,
              title: title,
              url: url
            });
          } catch (error) {
            resolve({
              success: false,
              error: 'Failed to parse response: ' + error.message
            });
          }
        });
      });
      
      request.on('error', (error) => {
        resolve({
          success: false,
          error: error.message
        });
      });
      
      request.setTimeout(30000, () => {
        request.destroy();
        resolve({
          success: false,
          error: 'Request timeout'
        });
      });
      
    } catch (error) {
      resolve({
        success: false,
        error: error.message
      });
    }
  });
}

// YouTube Transcript Handler (direct approach)
ipcMain.handle('fetch-youtube-transcript', async (event, { url, language = 'en' }) => {
  return new Promise(async (resolve) => {
    try {
      // Extract video ID from URL
      const extractVideoId = (url) => {
        if (!url) return null;
        url = url.trim();
        if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
        
        let match = url.match(/[?&]v=([^&]+)/);
        if (match) return match[1];
        
        match = url.match(/youtu\.be\/([^?]+)/);
        if (match) return match[1];
        
        match = url.match(/youtube\.com\/embed\/([^?]+)/);
        if (match) return match[1];
        
        match = url.match(/m\.youtube\.com\/watch\?v=([^&]+)/);
        if (match) return match[1];
        
        return null;
      };

      const videoId = extractVideoId(url);
      if (!videoId) {
        resolve({
          success: false,
          error: 'Invalid YouTube URL. Please provide a valid YouTube video link.'
        });
        return;
      }

      console.log('Fetching transcript for video:', videoId, 'language:', language);

      // Step 1: Fetch video page to get caption tracks
      const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
      console.log('Fetching video page:', videoPageUrl);
      
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        }
      };
      
      https.get(videoPageUrl, options, (response) => {
        console.log('Response status:', response.statusCode);
        
        let htmlData = '';
        
        response.on('data', (chunk) => {
          htmlData += chunk;
        });
        
        response.on('end', async () => {
          console.log('HTML received, length:', htmlData.length);
          try {
            console.log('Parsing HTML response, length:', htmlData.length);
            
            // Try to extract caption tracks first
            const captionsData = htmlData.match(/"captionTracks":\[([^\]]+)\]/);
            
            if (!captionsData) {
              console.log('No captionTracks found, trying transcript panels...');
              
              // Try multiple patterns to find transcript data
              const segments = [];
              let fullText = '';
              
              // Pattern 1: Try transcriptSegmentRenderer with various formats
              const patterns = [
                /"transcriptSegmentRenderer":\{[^}]*"startMs":"(\d+)"[^}]*"snippet":\{"runs":\[\{"text":"([^"]+)"\}\]\}/g,
                /"transcriptSegmentRenderer":\{[^}]*"startMs":"(\d+)"[^}]*"simpleText":"([^"]+)"/g,
                /"startMs":"(\d+)"[^}]*"snippet":\{"runs":\[\{"text":"([^"]+)"\}\]\}/g
              ];
              
              let foundSegments = false;
              
              for (const pattern of patterns) {
                console.log('Trying pattern:', pattern.source.substring(0, 50) + '...');
                const matches = Array.from(htmlData.matchAll(pattern));
                
                if (matches.length > 0) {
                  console.log('Found', matches.length, 'segments with this pattern');
                  foundSegments = true;
                  
                  for (const match of matches) {
                    const start = parseInt(match[1]) / 1000; // Convert ms to seconds
                    const text = match[2]
                      .replace(/\\n/g, ' ')
                      .replace(/\\"/g, '"')
                      .replace(/\\\\/g, '\\')
                      .replace(/\\u0026/g, '&')
                      .trim();
                    
                    if (text && text.length > 0) {
                      segments.push({ 
                        start, 
                        duration: 3, // Default duration since we don't always have endMs
                        text 
                      });
                      fullText += text + ' ';
                    }
                  }
                  
                  break; // Found segments, stop trying other patterns
                }
              }
              
              if (!foundSegments || segments.length === 0) {
                console.log('No transcript segments found with any pattern');
                console.log('HTML sample:', htmlData.substring(0, 1000));
                resolve({
                  success: false,
                  error: 'No captions or transcripts available for this video. The video may not have any text content enabled.'
                });
                return;
              }
              
              console.log('Transcript extracted successfully:', segments.length, 'segments');
              console.log('Sample text:', fullText.substring(0, 100) + '...');
              
              resolve({
                success: true,
                segments: segments,
                fullText: fullText.trim(),
                isAutoGenerated: true,
                videoId: videoId,
                wordCount: fullText.trim().split(/\s+/).filter(w => w.length > 0).length
              });
              return;
            }

            console.log('Caption tracks data found');
            
            // FIRST: Try to extract transcripts directly from the HTML (more reliable!)
            console.log('Attempting to extract transcript from HTML first...');
            const transcriptSegments = [];
            let transcriptText = '';
            
            // Check if transcript data exists at all
            const hasTranscript = htmlData.includes('transcriptSegmentRenderer') || 
                                 htmlData.includes('"transcript"') ||
                                 htmlData.includes('engagementPanels');
            
            console.log('HTML contains transcript indicators:', hasTranscript);
            
            if (hasTranscript) {
              // Try to find and log a sample of the transcript section
              const transcriptIndex = htmlData.indexOf('transcriptSegmentRenderer');
              if (transcriptIndex !== -1) {
                const sample = htmlData.substring(transcriptIndex, transcriptIndex + 500);
                console.log('Found transcriptSegmentRenderer at index:', transcriptIndex);
                console.log('Transcript section sample:', sample);
              } else {
                console.log('transcriptSegmentRenderer not found, checking for other transcript markers...');
                const altIndex = htmlData.indexOf('"transcript"');
                if (altIndex !== -1) {
                  const sample = htmlData.substring(altIndex, altIndex + 500);
                  console.log('Found transcript marker at index:', altIndex);
                  console.log('Transcript marker sample:', sample);
                }
              }
            }
            
            // Try multiple patterns
            const patterns = [
              /"transcriptSegmentRenderer":\{"startMs":"(\d+)"[^}]*"snippet":\{"runs":\[\{"text":"([^"]+)"\}\]\}/g,
              /"startMs":"(\d+)"[^}]*"snippet":\{"runs":\[\{"text":"([^"]+)"\}\]\}/g,
              /"transcriptSegmentRenderer".*?"startMs":"(\d+)".*?"text":"([^"]+)"/g
            ];
            
            let transcriptMatches = [];
            
            for (let i = 0; i < patterns.length; i++) {
              console.log('Trying transcript pattern', i + 1);
              transcriptMatches = Array.from(htmlData.matchAll(patterns[i]));
              if (transcriptMatches.length > 0) {
                console.log('Found matches with pattern', i + 1);
                break;
              }
            }
            
            if (transcriptMatches.length > 0) {
              console.log('Found', transcriptMatches.length, 'transcript segments in HTML!');
              
              for (const match of transcriptMatches) {
                const start = parseInt(match[1]) / 1000;
                const text = match[2]
                  .replace(/\\n/g, ' ')
                  .replace(/\\"/g, '"')
                  .replace(/\\\\/g, '\\')
                  .replace(/\\u0026/g, '&')
                  .replace(/&#39;/g, "'")
                  .trim();
                
                if (text) {
                  transcriptSegments.push({ start, duration: 3, text });
                  transcriptText += text + ' ';
                }
              }
              
              if (transcriptSegments.length > 0) {
                console.log('Successfully extracted transcript from HTML!');
                console.log('Sample:', transcriptText.substring(0, 150));
                
                resolve({
                  success: true,
                  segments: transcriptSegments,
                  fullText: transcriptText.trim(),
                  isAutoGenerated: true,
                  videoId: videoId,
                  wordCount: transcriptText.trim().split(/\s+/).filter(w => w.length > 0).length
                });
                return;
              }
            }
            
            console.log('No transcript found in HTML, trying caption URL method...');

            // Parse caption tracks to find the requested language
            const baseUrlMatch = captionsData[1].match(/"baseUrl":"([^"]+)"/);
            if (!baseUrlMatch) {
              console.log('No baseUrl found in caption tracks');
              resolve({
                success: false,
                error: 'Could not extract caption URL.'
              });
              return;
            }

            const captionUrl = baseUrlMatch[1]
              .replace(/\\u0026/g, '&')
              .replace(/\\\//g, '/')
              .replace(/\\/g, '');
            console.log('Caption URL found:', captionUrl.substring(0, 100) + '...');

            // Step 2: Fetch the captions XML
            console.log('Fetching captions from URL...');
            console.log('Full caption URL:', captionUrl);
            
            const captionOptions = {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/xml,application/xml,application/xhtml+xml,text/html;q=0.9,*/*;q=0.8',
                'Accept-Encoding': 'identity',
                'Referer': `https://www.youtube.com/watch?v=${videoId}`
              }
            };
            
            https.get(captionUrl, captionOptions, (captionResponse) => {
              console.log('Caption response status:', captionResponse.statusCode);
              console.log('Caption response headers:', captionResponse.headers);
              
              let xmlData = '';
              
              captionResponse.setEncoding('utf8');
              
              captionResponse.on('data', (chunk) => {
                console.log('Received chunk, length:', chunk.length);
                xmlData += chunk;
              });
              
              captionResponse.on('end', () => {
                console.log('Caption XML received, total length:', xmlData.length);
                console.log('XML sample (first 500 chars):', xmlData.substring(0, 500));
                
                try {
                  // Parse XML captions - try multiple patterns
                  let textMatches = Array.from(xmlData.matchAll(/<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g));
                  
                  if (textMatches.length === 0) {
                    console.log('No matches with standard pattern, trying alternate...');
                    // Try without dur attribute
                    textMatches = Array.from(xmlData.matchAll(/<text start="([^"]*)"[^>]*>([^<]*)<\/text>/g));
                  }
                  
                  console.log('Found', textMatches.length, 'text matches');
                  
                  const segments = [];
                  let fullText = '';

                  for (const match of textMatches) {
                    const start = parseFloat(match[1]);
                    const duration = match[2] ? parseFloat(match[2]) : 3; // Default duration if not present
                    const textIndex = match[2] ? 3 : 2; // Adjust index based on whether dur was matched
                    const text = match[textIndex]
                      .replace(/&amp;/g, '&')
                      .replace(/&lt;/g, '<')
                      .replace(/&gt;/g, '>')
                      .replace(/&quot;/g, '"')
                      .replace(/&#39;/g, "'")
                      .replace(/\n/g, ' ')
                      .trim();

                    if (text) {
                      segments.push({ start, duration, text });
                      fullText += text + ' ';
                    }
                  }

                  console.log('Parsed', segments.length, 'segments');
                  console.log('Sample text:', fullText.substring(0, 200));

                  if (segments.length === 0) {
                    resolve({
                      success: false,
                      error: 'No transcript content found in captions XML.'
                    });
                    return;
                  }

                  console.log('Successfully parsed captions!');
                  resolve({
                    success: true,
                    segments: segments,
                    fullText: fullText.trim(),
                    isAutoGenerated: true,
                    videoId: videoId,
                    wordCount: fullText.trim().split(/\s+/).filter(w => w.length > 0).length
                  });

                } catch (parseError) {
                  console.error('XML parsing error:', parseError);
                  console.error('Error stack:', parseError.stack);
                  resolve({
                    success: false,
                    error: 'Failed to parse caption data: ' + parseError.message
                  });
                }
              });
            }).on('error', (error) => {
              console.error('Caption fetch error:', error);
              resolve({
                success: false,
                error: 'Failed to download captions: ' + error.message
              });
            });

          } catch (error) {
            console.error('HTML parsing error:', error);
            console.error('Error stack:', error.stack);
            resolve({
              success: false,
              error: 'Failed to extract caption information from video page: ' + error.message
            });
          }
        });
      }).on('error', (error) => {
        console.error('Video page fetch error:', error);
        console.error('Error details:', error);
        resolve({
          success: false,
          error: 'Failed to access video page: ' + error.message
        });
      });

    } catch (error) {
      console.error('YouTube transcript error:', error);
      resolve({
        success: false,
        error: error.message || 'An unexpected error occurred.'
      });
    }
  });
});

// Fetch YouTube video metadata
ipcMain.handle('fetch-youtube-metadata', async (event, { videoId, apiKey }) => {
  return new Promise((resolve) => {
    try {
      if (!apiKey) {
        resolve({
          success: false,
          error: 'YouTube API key not configured'
        });
        return;
      }

      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`;
      
      https.get(url, (response) => {
        let data = '';
        
        response.setEncoding('utf8');
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          try {
            const result = JSON.parse(data);
            
            if (result.error) {
              resolve({
                success: false,
                error: result.error.message || 'Failed to fetch video metadata'
              });
              return;
            }
            
            if (!result.items || result.items.length === 0) {
              resolve({
                success: false,
                error: 'Video not found'
              });
              return;
            }
            
            resolve({
              success: true,
              metadata: result.items[0]
            });
          } catch (error) {
            resolve({
              success: false,
              error: 'Failed to parse metadata: ' + error.message
            });
          }
        });
      }).on('error', (error) => {
        resolve({
          success: false,
          error: 'Failed to fetch metadata: ' + error.message
        });
      });
      
    } catch (error) {
      resolve({
        success: false,
        error: error.message
      });
    }
  });
});

console.log('Grammar Highlighter Desktop started');

