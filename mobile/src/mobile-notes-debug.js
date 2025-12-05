/**
 * Mobile Notes Debug Helper
 * Shows what's stored in localStorage and allows manual inspection/sync
 */

(function() {
  'use strict';

  // Create debug UI
  function createDebugUI() {
    const debugBtn = document.createElement('button');
    debugBtn.id = 'mobileNotesDebugBtn';
    debugBtn.innerHTML = '🐛';
    debugBtn.title = 'Notes Debug';
    debugBtn.style.cssText = `
      position: fixed;
      top: 60px;
      right: 16px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #e91e63;
      color: white;
      border: none;
      font-size: 18px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 99998;
      cursor: pointer;
    `;
    
    debugBtn.addEventListener('click', showDebugModal);
    document.body.appendChild(debugBtn);
    
    console.log('🐛 Debug button added');
  }

  function showDebugModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 20px;
      max-width: 90vw;
      max-height: 80vh;
      overflow: auto;
      position: relative;
    `;
    
    // Get storage info
    const storageKey = 'grammar-highlighter-notes';
    const allNotesData = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const allKeys = Object.keys(allNotesData);
    
    // Check legacy storage
    const legacyHighlights = JSON.parse(localStorage.getItem('userHighlights') || '[]');
    
    // Current file info
    const currentFilePath = window.currentFilePath || 'Not set';
    const currentFileName = window.currentFileName || 'Not set';
    const notesManagerPath = window.notesManager ? window.notesManager.currentFilePath : 'NotesManager not initialized';
    const notesManagerExists = !!window.notesManager;
    
    // Current notes count
    let currentNotes = 0;
    let currentHighlights = 0;
    if (window.notesManager) {
      currentNotes = window.notesManager.notes.length;
      currentHighlights = window.notesManager.highlights.length;
    }
    
    content.innerHTML = `
      <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #333;">📝 Notes Debug Info</h2>
      
      <div style="background: ${notesManagerExists ? '#e8f5e9' : '#ffebee'}; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 13px; font-family: monospace;">
        <strong>NotesManager Status:</strong><br>
        ${notesManagerExists ? '✅ Initialized' : '❌ NOT INITIALIZED'}<br>
        <br>
        <strong>Current File:</strong><br>
        Path: ${currentFilePath}<br>
        Name: ${currentFileName}<br>
        NotesManager Path: ${notesManagerPath}<br>
        <br>
        <strong>In Memory:</strong><br>
        Notes: ${currentNotes}<br>
        Highlights: ${currentHighlights}
      </div>
      
      ${legacyHighlights.length > 0 ? `
        <div style="background: #fff3cd; padding: 12px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid #ffc107;">
          <strong>⚠️ Legacy Highlights Found:</strong><br>
          ${legacyHighlights.length} highlights in old format<br>
          <button onclick="window.notesDebugHelper.migrateLegacyHighlights()" style="margin-top: 8px; padding: 8px 12px; background: #ffc107; border: none; border-radius: 4px; font-size: 12px; font-weight: 600;">
            Migrate to New Format
          </button>
        </div>
      ` : ''}
      
      <div style="background: #e3f2fd; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
        <strong>📦 Storage Keys (${allKeys.length} total):</strong>
        <div style="margin-top: 8px; max-height: 200px; overflow: auto; font-size: 12px;">
          ${allKeys.length === 0 ? '<em>No notes stored yet</em>' : allKeys.map((key, idx) => {
            const data = allNotesData[key];
            const noteCount = (data.notes || []).length;
            const highlightCount = (data.highlights || []).length;
            const isCurrentFile = (key === currentFilePath || key === currentFileName);
            
            return `
              <div style="padding: 8px; background: ${isCurrentFile ? '#c8e6c9' : 'white'}; margin: 4px 0; border-radius: 4px; border-left: 3px solid ${isCurrentFile ? '#4caf50' : '#999'};">
                <strong>${idx + 1}. ${key}</strong><br>
                ${noteCount} notes, ${highlightCount} highlights
                ${isCurrentFile ? ' <span style="color: #4caf50;">✓ CURRENT</span>' : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
      
      <div style="margin-top: 16px; display: flex; gap: 8px; flex-direction: column;">
        ${notesManagerExists ? `
          <button onclick="window.notesDebugHelper.refreshNotes()" style="padding: 12px; background: #4caf50; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
            🔄 Force Reload Notes
          </button>
        ` : `
          <button onclick="window.notesDebugHelper.initNotesManager()" style="padding: 12px; background: #e91e63; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
            ⚡ Initialize NotesManager
          </button>
        `}
        
        <button onclick="window.notesDebugHelper.showAllNotes()" style="padding: 12px; background: #2196f3; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
          📋 View All Stored Notes
        </button>
        
        <button onclick="window.notesDebugHelper.exportToConsole()" style="padding: 12px; background: #ff9800; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
          💾 Export to Console
        </button>
        
        <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" style="padding: 12px; background: #9e9e9e; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
          Close
        </button>
      </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }
  
  // Helper functions
  window.notesDebugHelper = {
    initNotesManager: function() {
      console.log('⚡ Attempting to initialize NotesManager...');
      
      // Check if NotesManager class is available
      if (typeof NotesManager === 'undefined') {
        alert('❌ NotesManager class not loaded! Make sure notes-manager.js is included in the page.');
        console.error('NotesManager class not found');
        return;
      }
      
      // Create instance if it doesn't exist
      if (!window.notesManager) {
        try {
          window.notesManager = new NotesManager();
          console.log('✅ NotesManager initialized successfully');
          
          // Load notes for current file if available
          if (window.currentFilePath) {
            window.notesManager.loadNotesForFile(window.currentFilePath);
          }
          
          alert('✅ NotesManager initialized!\n\nPlease close this dialog and try highlighting again.');
          
          // Refresh the debug modal
          document.querySelector('div[style*="position: fixed"]')?.remove();
          setTimeout(showDebugModal, 100);
        } catch (error) {
          console.error('Error initializing NotesManager:', error);
          alert('❌ Failed to initialize NotesManager: ' + error.message);
        }
      } else {
        alert('NotesManager is already initialized!');
      }
    },
    
    migrateLegacyHighlights: function() {
      const legacyHighlights = JSON.parse(localStorage.getItem('userHighlights') || '[]');
      
      if (legacyHighlights.length === 0) {
        alert('No legacy highlights to migrate.');
        return;
      }
      
      if (!window.notesManager) {
        alert('❌ NotesManager not initialized! Please initialize it first.');
        return;
      }
      
      const filePath = window.currentFilePath || window.currentFileName || 'mobile-imported-file';
      
      console.log('🔄 Migrating', legacyHighlights.length, 'legacy highlights to file:', filePath);
      
      // Ensure notesManager has the right file path
      window.notesManager.currentFilePath = filePath;
      
      // Convert and add each highlight
      let migrated = 0;
      legacyHighlights.forEach(legacy => {
        const highlight = {
          id: 'migrated-' + (legacy.timestamp || Date.now()),
          type: 'highlight',
          text: legacy.text,
          note: legacy.note || legacy.text,
          color: legacy.color || 'yellow',
          page: legacy.page || 1,
          createdAt: legacy.timestamp ? new Date(legacy.timestamp).toISOString() : new Date().toISOString(),
          filePath: filePath,
          fileName: legacy.document || window.currentFileName || 'Mobile Document',
          sourceView: 'raw'
        };
        
        // Check if it already exists
        const exists = window.notesManager.highlights.some(h => h.text === highlight.text);
        if (!exists) {
          window.notesManager.highlights.push(highlight);
          migrated++;
        }
      });
      
      // Save to storage
      window.notesManager.saveToStorage();
      
      // Clear legacy storage
      localStorage.removeItem('userHighlights');
      
      // Render
      window.notesManager.render(true);
      
      alert(`✅ Migrated ${migrated} highlights!\n\n${legacyHighlights.length - migrated} were already present.`);
      
      // Refresh debug modal
      document.querySelector('div[style*="position: fixed"]')?.remove();
      setTimeout(showDebugModal, 100);
    },
    
    refreshNotes: function() {
      if (!window.notesManager) {
        alert('NotesManager not initialized!');
        return;
      }
      
      const filePath = window.currentFilePath || window.currentFileName;
      if (!filePath) {
        alert('No file loaded!');
        return;
      }
      
      console.log('🔄 Reloading notes for:', filePath);
      window.notesManager.loadNotesForFile(filePath);
      
      // Force render with force=true
      setTimeout(() => {
        window.notesManager.render(true);
        alert(`Reloaded!\n\nNotes: ${window.notesManager.notes.length}\nHighlights: ${window.notesManager.highlights.length}`);
      }, 100);
    },
    
    showAllNotes: function() {
      const storageKey = 'grammar-highlighter-notes';
      const allData = JSON.parse(localStorage.getItem(storageKey) || '{}');
      const legacyHighlights = JSON.parse(localStorage.getItem('userHighlights') || '[]');
      
      let output = '📝 ALL STORED NOTES:\n\n';
      
      // Show legacy highlights first if any
      if (legacyHighlights.length > 0) {
        output += '⚠️ LEGACY HIGHLIGHTS (userHighlights key):\n';
        output += `   Count: ${legacyHighlights.length}\n`;
        legacyHighlights.forEach((h, idx) => {
          output += `   ${idx + 1}. "${(h.text || '').substring(0, 50)}..." (${h.color || 'unknown'})\n`;
        });
        output += '\n';
      }
      
      // Show new format
      Object.keys(allData).forEach(filePath => {
        const fileData = allData[filePath];
        output += `\n📁 FILE: ${filePath}\n`;
        output += `   Notes: ${fileData.notes.length}\n`;
        output += `   Highlights: ${fileData.highlights.length}\n`;
        
        fileData.highlights.forEach((h, idx) => {
          output += `   🖍️ ${idx + 1}. "${h.text.substring(0, 50)}..." (${h.color})\n`;
        });
        
        fileData.notes.forEach((n, idx) => {
          output += `   📝 ${idx + 1}. "${n.text.substring(0, 50)}..."\n`;
        });
      });
      
      console.log(output);
      alert('All notes logged to console! Open DevTools to view.');
    },
    
    exportToConsole: function() {
      const storageKey = 'grammar-highlighter-notes';
      const allData = localStorage.getItem(storageKey);
      const legacyData = localStorage.getItem('userHighlights');
      
      console.log('=== FULL NOTES DATA (grammar-highlighter-notes) ===');
      console.log(allData);
      console.log('=== PARSED ===');
      console.log(JSON.parse(allData || '{}'));
      
      console.log('\n=== LEGACY HIGHLIGHTS (userHighlights) ===');
      console.log(legacyData);
      console.log('=== PARSED ===');
      console.log(JSON.parse(legacyData || '[]'));
      
      alert('Full data exported to console!');
    }
  };
  
  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createDebugUI);
  } else {
    setTimeout(createDebugUI, 1000);
  }
  
})();

