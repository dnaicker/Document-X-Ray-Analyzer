// Notes and Highlights Manager
class NotesManager {
    constructor() {
        this.notes = [];
        this.highlights = [];
        this.currentFilePath = '';
        this.storageKey = 'grammar-highlighter-notes';
        this.currentColor = 'yellow'; // Default color
        
        // DOM elements
        this.notesContent = document.getElementById('notesContent');
        this.addNoteBtn = document.getElementById('addNoteBtn');
        this.notesCount = document.querySelector('.notes-count');
        this.rawTextContent = document.getElementById('rawTextContent');
        this.highlightedTextContent = document.getElementById('highlightedTextContent');
        this.translatedTextContent = document.getElementById('translatedTextContent');
        
        // Context menu elements
        this.contextMenu = document.getElementById('contextMenu');
        this.contextDefaultGroup = document.getElementById('contextDefaultGroup');
        this.contextHighlightGroup = document.getElementById('contextHighlightGroup');
        
        this.contextHighlight = document.getElementById('contextHighlight');
        this.contextAddNote = document.getElementById('contextAddNote');
        
        this.contextEditNote = document.getElementById('contextEditNote');
        this.contextDeleteHighlight = document.getElementById('contextDeleteHighlight');
        
        this.contextTranslateGroup = document.getElementById('contextTranslateGroup');
        this.contextSpeak = document.getElementById('contextSpeak');
        
        // Continuous Mode and Color Picker
        this.continuousModeToggles = document.querySelectorAll('.continuous-mode-checkbox');
        this.notesHelpBanner = document.getElementById('notesHelpBanner');
        this.isContinuousMode = false;
        
        // Search and Tags
        this.notesSearchInput = document.getElementById('notesSearchInput');
        this.searchQuery = '';
        this.activeTagFilter = null; // Currently selected tag filter
        this.allTags = new Set(); // All unique tags across notes
        
        this.selectedText = '';
        this.targetHighlightId = null;
        
        // Dialog elements
        this.noteDialog = document.getElementById('noteDialog');
        this.noteDialogTitle = document.getElementById('noteDialogTitle');
        this.noteDialogInput = document.getElementById('noteDialogInput');
        this.noteDialogHighlightedText = document.getElementById('noteDialogHighlightedText');
        this.noteDialogClose = document.getElementById('noteDialogClose');
        this.noteDialogSave = document.getElementById('noteDialogSave');
        
        // Selection Controls
        this.selectAllCheckbox = document.getElementById('selectAllNotes');
        this.deleteSelectedBtn = document.getElementById('deleteSelectedNotesBtn');
        this.selectedNoteIds = new Set();

        // Tooltip elements
        this.tooltip = document.getElementById('customTooltip');
        this.tooltipContent = document.getElementById('tooltipContent');

        this.dialogCallback = null;
        
        this.setupEventListeners();
        this.setupColorPicker();
        this.setupDialog();
        
        // Create debounced methods to prevent UI lag
        this._renderTimeout = null;
        this._applyHighlightsTimeout = null;
    }
    
    // Debounced render to batch updates
    renderDebounced() {
        if (this._renderTimeout) {
            clearTimeout(this._renderTimeout);
        }
        this._renderTimeout = setTimeout(() => {
            this.render();
        }, 150); // 150ms delay to batch rapid updates
    }
    
    // Debounced applyHighlights to batch highlight updates
    applyHighlightsDebounced() {
        if (this._applyHighlightsTimeout) {
            clearTimeout(this._applyHighlightsTimeout);
        }
        this._applyHighlightsTimeout = setTimeout(() => {
            this.applyHighlights();
        }, 100); // 100ms delay to batch rapid highlight updates
    }
    
    setupDialog() {
        // Check if dialog elements exist (defensive programming for mobile)
        if (!this.noteDialog || !this.noteDialogClose || !this.noteDialogSave || !this.noteDialogInput) {
            console.warn('⚠️ Note dialog elements not found, skipping dialog setup');
            return;
        }
        
        const closeDialog = () => {
            this.noteDialog.classList.add('hidden');
            this.dialogCallback = null;
        };
        
        const saveDialog = () => {
            const text = this.noteDialogInput.value.trim();
            if (this.dialogCallback) {
                this.dialogCallback(text);
            }
            closeDialog();
        };
        
        this.noteDialogClose.addEventListener('click', closeDialog);
        this.noteDialogSave.addEventListener('click', saveDialog);
        
        // Save on Ctrl+Enter in textarea
        this.noteDialogInput.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                saveDialog();
            }
        });
        
        // Close on background click
        this.noteDialog.addEventListener('click', (e) => {
            if (e.target === this.noteDialog) {
                closeDialog();
            }
        });
    }
    
    showTooltip(e, text) {
        if (!text || !text.trim() || !this.tooltip) return;
        
        this.tooltipContent.innerHTML = text.replace(/\n/g, '<br>'); // Simple format
        this.tooltip.classList.remove('hidden');
        
        // Position
        const target = e.target;
        const rect = target.getBoundingClientRect();
        // Must show to measure? Yes, but we removed hidden so it has dimensions.
        const tooltipRect = this.tooltip.getBoundingClientRect();
        
        // Default: centered above
        let top = rect.top - tooltipRect.height - 12;
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        
        // Keep in viewport
        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }
        
        // If top overflow (too high), show below
        if (top < 10) {
            top = rect.bottom + 12;
            this.tooltip.classList.add('bottom');
        } else {
            this.tooltip.classList.remove('bottom');
        }
        
        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.left = `${left}px`;
    }
    
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.classList.add('hidden');
        }
    }

    openDialog(title, initialText, callback, highlightedText = null) {
        this.noteDialogTitle.textContent = title;
        this.noteDialogInput.value = initialText || '';
        this.dialogCallback = callback;
        
        // Show/hide and populate the highlighted text area
        if (highlightedText && this.noteDialogHighlightedText) {
            this.noteDialogHighlightedText.textContent = highlightedText;
            this.noteDialogHighlightedText.classList.remove('hidden');
        } else if (this.noteDialogHighlightedText) {
            this.noteDialogHighlightedText.classList.add('hidden');
        }
        
        this.noteDialog.classList.remove('hidden');
        this.noteDialogInput.focus();
    }
    
    setContinuousMode(active) {
        this.isContinuousMode = active;
        
        // Sync all toggles
        this.continuousModeToggles.forEach(toggle => {
            toggle.checked = active;
        });
        
        if (this.isContinuousMode) {
            if (this.notesHelpBanner) {
                this.notesHelpBanner.innerHTML = '✨ <strong>Continuous Mode Active:</strong> Just select text to highlight it instantly!';
                this.notesHelpBanner.classList.add('active-mode');
            }
        } else {
            if (this.notesHelpBanner) {
                this.notesHelpBanner.innerHTML = '💡 <strong>Tip:</strong> Right-click on any selected text to highlight or add notes!';
                this.notesHelpBanner.classList.remove('active-mode');
            }
        }
    }
    
    setupColorPicker() {
        const containers = document.querySelectorAll('.color-picker-container');
        
        // Make visible by default
        containers.forEach(container => container.classList.remove('hidden'));
        
        const swatches = document.querySelectorAll('.color-option');
        swatches.forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                // Get color
                const hexColor = e.target.getAttribute('data-color');
                
                // Update UI across all pickers
                swatches.forEach(s => {
                    if (s.getAttribute('data-color') === hexColor) {
                        s.classList.add('selected');
                    } else {
                        s.classList.remove('selected');
                    }
                });
                
                // Update state
                this.currentColor = this.getColorName(hexColor);
            });
        });
        
        // Set default selected
        const defaultSwatches = document.querySelectorAll('.color-option[data-color="#FFC107"]');
        defaultSwatches.forEach(s => s.classList.add('selected'));
        this.currentColor = 'yellow';
        
        // Helper to convert hex to name
        this.getColorName = (hex) => {
            const map = {
                '#FFC107': 'yellow',
                '#4CAF50': 'green',
                '#2196F3': 'blue',
                '#E91E63': 'pink',
                '#9C27B0': 'purple'
            };
            return map[hex] || 'yellow';
        };
    }
    
    setupEventListeners() {
        // Defensive: Check if elements exist before adding listeners
        if (this.addNoteBtn) {
            this.addNoteBtn.addEventListener('click', () => {
                this.showAddNoteDialog();
            });
        }
        
        // Setup all continuous mode toggles
        this.continuousModeToggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                this.setContinuousMode(isChecked);
            });
        });
        
        // Setup search
        if (this.notesSearchInput) {
            this.notesSearchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.trim().toLowerCase();
                this.renderDebounced(); // Use debounced to prevent lag while typing
            });
        }
        
        // Setup tag filter container click listener (for tag badges)
        this.setupTagFilterListeners();
        
        // Setup selection controls
        if (this.selectAllCheckbox) {
            this.selectAllCheckbox.addEventListener('change', (e) => {
                this.toggleSelectAll(e.target.checked);
            });
        }

        if (this.deleteSelectedBtn) {
            this.deleteSelectedBtn.addEventListener('click', () => {
                this.deleteSelectedNotes();
            });
        }

        // Enable text selection highlighting
        this.setupTextSelection();
        
        // Setup context menu (containers + button listeners)
        this.setupContextMenu();
        this.setupContextMenuButtons();
    }
    
    setupTextSelection() {
        // Listen for text selection in all text views
        const containers = [this.rawTextContent, this.highlightedTextContent, this.translatedTextContent].filter(c => c);
        
        console.log('Setting up text selection for containers:', containers.length);
        
        containers.forEach((container, index) => {
            if (!container) return;
            
            console.log(`Setting up container ${index}:`, container.id);
            
            container.addEventListener('mouseup', (e) => {
                const selection = window.getSelection();
                const selectedText = selection.toString().trim();
                
                console.log('Mouseup in container:', container.id, 'Selected text:', selectedText, 'Continuous mode:', this.isContinuousMode);
                
                if (selectedText.length > 0) {
                    this.selectedText = selectedText;
                    
                    // Continuous Highlight Mode
                    if (this.isContinuousMode && this.currentFilePath) {
                        console.log('Triggering continuous highlight');
                        this.highlightSelectionFromContext();
                    }
                }
            });
        });
    }
    
    setupContextMenu(targetContainer = null) {
        // Show context menu on right-click
        const containers = targetContainer ? [targetContainer] : [this.rawTextContent, this.highlightedTextContent, this.translatedTextContent].filter(c => c);
        
        containers.forEach(container => {
            // Ensure text is selectable
            container.style.userSelect = 'text';
            container.style.cursor = 'text';
            
            // Remove old listener if it exists to prevent duplicates
            if (container._contextMenuListener) {
                container.removeEventListener('contextmenu', container._contextMenuListener);
            }
            
            // Create and store the listener
            container._contextMenuListener = (e) => {
                this.lastContextTarget = e.target;
                
                // Check if clicked on a user highlight
                const clickedHighlight = e.target.closest('.user-highlight') || e.target.closest('.map-user-highlight');
                
                if (clickedHighlight) {
                    // Right-clicked on existing highlight
                    e.preventDefault();
                    e.stopPropagation();
                    
                    this.targetHighlightId = clickedHighlight.getAttribute('data-highlight-id');
                    this.showContextMenu(e.clientX, e.clientY, true);
                } else {
                    // Standard text selection
                    const selection = window.getSelection();
                    this.selectedText = selection.toString().trim();
                    
                    // Allow context menu if text selected OR if in translated text content
                    const isTranslatedView = this.translatedTextContent && this.translatedTextContent.contains(e.target);
                    
                    if ((this.selectedText.length > 0 && this.currentFilePath) || isTranslatedView) {
                        e.preventDefault();
                        e.stopPropagation();
                        this.showContextMenu(e.clientX, e.clientY, false);
                    }
                }
            };
            
            container.addEventListener('contextmenu', container._contextMenuListener);
            
            // Also listen for text selection to enable/disable highlight button
            if (!container._mouseupListener) {
                container._mouseupListener = (e) => {
                    const selection = window.getSelection();
                    const selectedText = selection.toString().trim();
                    
                    if (selectedText.length > 0) {
                        console.log('Text selected:', selectedText);
                    }
                };
                container.addEventListener('mouseup', container._mouseupListener);
            }
        });
    }
    
    setupContextMenuButtons() {
        // Set up context menu button listeners ONCE (called only from constructor)
        // Defensive: Check if context menu elements exist
        if (!this.contextMenu || !this.contextHighlight) {
            console.warn('⚠️ Context menu elements not found, skipping context menu setup');
            return;
        }
        
        // Hide context menu on click anywhere else
        document.addEventListener('click', () => {
            this.hideContextMenu();
        });
        
        // Hide context menu on scroll
        document.addEventListener('scroll', () => {
            this.hideContextMenu();
        }, true);
        
        // Context menu actions - Creation
        this.contextHighlight.addEventListener('click', (e) => {
            e.stopPropagation();
            this.highlightSelectionFromContext();
            this.hideContextMenu();
        });

        if (this.contextAddNote) {
            this.contextAddNote.addEventListener('click', (e) => {
                e.stopPropagation();
                this.addNoteFromContext();
                this.hideContextMenu();
            });
        }

        if (this.contextSpeak) {
            this.contextSpeak.addEventListener('click', (e) => {
                e.stopPropagation();
                this.speakText();
                this.hideContextMenu();
            });
        }
        
        // Context menu actions - Management
        if (this.contextEditNote && this.contextDeleteHighlight) {
            this.contextEditNote.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.targetHighlightId) {
                    this.editNote(this.targetHighlightId);
                }
                this.hideContextMenu();
            });
            
            this.contextDeleteHighlight.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.targetHighlightId) {
                    this.deleteNote(this.targetHighlightId, true);
                }
                this.hideContextMenu();
            });
        }
    }
    
    showContextMenu(x, y, isExistingHighlight) {
        this.contextMenu.classList.remove('hidden');
        
        const isTranslatedView = this.lastContextTarget && this.translatedTextContent && this.translatedTextContent.contains(this.lastContextTarget);
        
        // Toggle groups based on context
        if (isExistingHighlight) {
            this.contextDefaultGroup.classList.add('hidden');
            this.contextHighlightGroup.classList.remove('hidden');
            if (this.contextTranslateGroup) this.contextTranslateGroup.classList.add('hidden');
        } else {
            this.contextDefaultGroup.classList.remove('hidden');
            this.contextHighlightGroup.classList.add('hidden');
            
            if (this.contextTranslateGroup) {
                if (isTranslatedView) {
                    this.contextTranslateGroup.classList.remove('hidden');
                } else {
                    this.contextTranslateGroup.classList.add('hidden');
                }
            }
        }
        
        // Position the menu
        this.contextMenu.style.left = x + 'px';
        this.contextMenu.style.top = y + 'px';
        
        // Adjust if menu would go off screen
        const rect = this.contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            this.contextMenu.style.left = (x - rect.width) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            this.contextMenu.style.top = (y - rect.height) + 'px';
        }
    }
    
    hideContextMenu() {
        this.contextMenu.classList.add('hidden');
    }

    speakText() {
        let textToSpeak = '';
        
        // 1. Selected text
        if (this.selectedText && this.selectedText.trim().length > 0) {
            textToSpeak = this.selectedText;
        } 
        // 2. Clicked element (sentence/chunk)
        else if (this.lastContextTarget) {
             // Find closest translated text span or just use the text content of the target if it's a text node
             const translatedSpan = this.lastContextTarget.closest('.translated-text');
             if (translatedSpan) {
                 textToSpeak = translatedSpan.textContent;
             } else if (this.lastContextTarget.nodeType === 3) { // Text node
                 textToSpeak = this.lastContextTarget.textContent;
             } else {
                 textToSpeak = this.lastContextTarget.textContent;
             }
        }
        
        if (!textToSpeak || textToSpeak.trim().length === 0) return;
        
        // Get language
        const langSelect = document.getElementById('translateLanguageSelect');
        // Get translation service language map if available to map short codes
        const langCode = langSelect ? langSelect.value : 'en';
        
        // Speak
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop current
            
            // Get available voices
            let voices = window.speechSynthesis.getVoices();
            
            // If voices haven't loaded yet, wait for them
            if (voices.length === 0) {
                window.speechSynthesis.onvoiceschanged = () => {
                    this.performSpeak(textToSpeak, langCode);
                };
            } else {
                this.performSpeak(textToSpeak, langCode);
            }
        } else {
            alert('Text-to-speech not supported in this browser.');
        }
    }
    
    performSpeak(text, langCode) {
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Ensure full locale for certain languages to help browser fallback
        const localeMap = {
            'ru': 'ru-RU',
            'zh': 'zh-CN',
            'zh-cn': 'zh-CN',
            'zh-tw': 'zh-TW',
            'pt': 'pt-BR',
            'en': 'en-US'
        };
        
        const targetLang = localeMap[langCode.toLowerCase()] || langCode;
        utterance.lang = targetLang;
        
        const voices = window.speechSynthesis.getVoices();
        
        // Enhanced voice selection strategy
        // 1. Try exact language match (e.g. 'fr-FR')
        // 2. Try base language match (e.g. 'fr')
        // 3. Search by name if lang match fails
        // 4. Prefer 'Google' or 'Microsoft' voices
        
        const baseLang = targetLang.split('-')[0].toLowerCase();
        
        // Helper to score voice quality
        const getVoiceScore = (voice) => {
            let s = 0;
            const name = voice.name.toLowerCase();
            if (name.includes('google')) s += 2;
            if (name.includes('microsoft')) s += 1;
            if (name.includes('enhanced')) s += 1;
            return s;
        };

        // Filter for matching language
        let matchingVoices = voices.filter(voice => {
            return voice.lang.toLowerCase().startsWith(baseLang) || 
                   voice.lang.replace('_', '-').toLowerCase().startsWith(baseLang);
        });
        
        // Fallback: Search by name if no lang match
        if (matchingVoices.length === 0) {
            const langNameMap = {
                'ru': 'russian',
                'zh': 'chinese',
                'ja': 'japanese',
                'ko': 'korean',
                'de': 'german',
                'fr': 'french',
                'es': 'spanish',
                'it': 'italian',
                'pt': 'portuguese'
            };
            
            const langName = langNameMap[baseLang];
            if (langName) {
                matchingVoices = voices.filter(voice => 
                    voice.name.toLowerCase().includes(langName)
                );
            }
        }
        
        if (matchingVoices.length > 0) {
            // Sort to prefer premium voices
            matchingVoices.sort((a, b) => {
                return getVoiceScore(b) - getVoiceScore(a);
            });
            
            utterance.voice = matchingVoices[0];
            console.log(`Using voice: ${utterance.voice.name} (${utterance.voice.lang}) for ${langCode}`);
        } else {
            console.warn(`No voice found for language: ${langCode} (base: ${baseLang}). Available voices:`, voices.map(v => `${v.name} (${v.lang})`));
        }
        
        window.speechSynthesis.speak(utterance);
    }
    
    getPageNumberFromSelection() {
        const selection = window.getSelection();
        if (!selection.rangeCount) return (typeof pdfViewer !== 'undefined' ? pdfViewer.currentPage : 1);
        
        let node = selection.anchorNode;
        
        // Traverse up to find a page container
        while (node && node !== document.body) {
            if (node.nodeType === 1) {
                if (node.id && node.id.startsWith('text-page-')) {
                    const pageNum = parseInt(node.id.replace('text-page-', ''));
                    if (!isNaN(pageNum)) return pageNum;
                }
                // Handle Map View page cards
                if (node.classList.contains('page-card') && node.dataset.page) {
                    const pageNum = parseInt(node.dataset.page);
                    if (!isNaN(pageNum)) return pageNum;
                }
            }
            node = node.parentNode;
        }
        
        // Fallback to current PDF page if not found (e.g. highlighted view or no selection context)
        return (typeof pdfViewer !== 'undefined' ? pdfViewer.currentPage : 1);
    }

    getSelectionOffset(container) {
        const selection = window.getSelection();
        if (!selection.rangeCount) return null;
        const range = selection.getRangeAt(0);
        
        // Ensure range is inside container
        if (!container.contains(range.commonAncestorContainer)) return null;
        
        // Create range from container start to selection start
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(container);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        
        const start = preCaretRange.toString().length;
        const end = start + range.toString().length;
        
        return { start, end };
    }

    highlightSelectionFromContext() {
        console.log('highlightSelectionFromContext called. Selected text:', this.selectedText);
        
        if (!this.selectedText) {
            console.warn('No text selected for highlight');
            return;
        }
        
        // Determine offsets and source view
        let offsets = null;
        let sourceView = 'raw';
        let translationLanguage = null;
        
        try {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const node = selection.anchorNode;
                
                // Check text views and determine source
                if (this.rawTextContent && this.rawTextContent.contains(node)) {
                    offsets = this.getSelectionOffset(this.rawTextContent);
                    sourceView = 'raw';
                } else if (this.highlightedTextContent && this.highlightedTextContent.contains(node)) {
                    offsets = this.getSelectionOffset(this.highlightedTextContent);
                    sourceView = 'highlighted';
                } else if (this.translatedTextContent && this.translatedTextContent.contains(node)) {
                    offsets = this.getSelectionOffset(this.translatedTextContent);
                    sourceView = 'translate';
                    
                    // Get the current translation language from the UI
                    const translateLangSelect = document.getElementById('translateLanguageSelect');
                    if (translateLangSelect && translateLangSelect.value) {
                        translationLanguage = translateLangSelect.value;
                    }
                }
                // Check Map View
                else {
                     const mapGrid = document.getElementById('mapGrid');
                     if (mapGrid && mapGrid.contains(node)) {
                         const card = node.nodeType === 1 ? node.closest('.page-card') : (node.parentElement ? node.parentElement.closest('.page-card') : null);
                         if (card && card.dataset.startOffset) {
                             const cardStart = parseInt(card.dataset.startOffset);
                             const body = card.querySelector('.page-card-body');
                             if (body && body.contains(node)) {
                                 const range = selection.getRangeAt(0);
                                 const selectedText = range.toString().trim();
                                 
                                 // Method: Reconstruct plain text position by walking only content nodes
                                 // Create a helper to get text position excluding overlay/badge
                                 function getTextPosition(targetNode, targetOffset) {
                                     let position = 0;
                                     const walker = document.createTreeWalker(
                                         body,
                                         NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
                                         {
                                             acceptNode: function(n) {
                                                 // Skip overlay and badge entirely
                                                 if (n.nodeType === Node.ELEMENT_NODE) {
                                                     if (n.classList && (n.classList.contains('highlight-overlay') || n.classList.contains('highlight-count-badge'))) {
                                                         return NodeFilter.FILTER_REJECT;
                                                     }
                                                     return NodeFilter.FILTER_SKIP;
                                                 }
                                                 // For text nodes, reject if inside overlay/badge
                                                 if (n.nodeType === Node.TEXT_NODE) {
                                                     let parent = n.parentElement;
                                                     while (parent && parent !== body) {
                                                         if (parent.classList && (parent.classList.contains('highlight-overlay') || parent.classList.contains('highlight-count-badge'))) {
                                                             return NodeFilter.FILTER_REJECT;
                                                         }
                                                         parent = parent.parentElement;
                                                     }
                                                     return NodeFilter.FILTER_ACCEPT;
                                                 }
                                                 return NodeFilter.FILTER_SKIP;
                                             }
                                         }
                                     );
                                     
                                     let currentNode;
                                     while (currentNode = walker.nextNode()) {
                                         if (currentNode === targetNode) {
                                             return position + targetOffset;
                                         }
                                         position += currentNode.textContent.length;
                                     }
                                     
                                     return position;
                                 }
                                 
                                 const localStart = getTextPosition(range.startContainer, range.startOffset);
                                 
                                 offsets = {
                                     start: cardStart + localStart,
                                     end: cardStart + localStart + selectedText.length
                                 };
                                 
                                 // Explicitly set sourceView to 'raw' for map highlights
                                 sourceView = 'raw';
                             }
                         }
                     }
                }
            }
        } catch (e) {
            console.error('Error calculating highlight offsets:', e);
        }
        
        const highlight = {
            id: Date.now().toString(),
            type: 'highlight',
            text: this.selectedText,
            note: this.selectedText, // Auto-fill note with selected text
            color: this.currentColor,
            page: this.getPageNumberFromSelection(),
            createdAt: new Date().toISOString(),
            links: [], // Array of linked note/highlight IDs (format: {id, filePath, fileName})
            startOffset: offsets ? offsets.start : undefined,
            endOffset: offsets ? offsets.end : undefined,
            filePath: this.currentFilePath,
            fileName: this.getFileName(this.currentFilePath),
            sourceView: sourceView, // Track which view this was created in
            translationLanguage: translationLanguage // Track translation language if applicable
        };
        
        console.log('Adding highlight:', highlight);
        
        this.highlights.push(highlight);
        this.saveToStorage();
        
        // Force render next time (bypass debounce immediate check if needed)
        this.renderDebounced(); 
        this.applyHighlightsDebounced(); 
        
        // Clear selection
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }
    }
    
    addNoteFromContext() {
        if (!this.selectedText) return;
        const selectedTextBackup = this.selectedText; // Store it before dialog opens
        const page = this.getPageNumberFromSelection();
        
        // Calculate offsets BEFORE opening dialog (selection might be cleared)
        let offsets = null;
        let sourceView = 'raw';
        let translationLanguage = null;
        
        try {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const node = selection.anchorNode;
                
                // Check text views and determine source
                if (this.rawTextContent && this.rawTextContent.contains(node)) {
                    offsets = this.getSelectionOffset(this.rawTextContent);
                    sourceView = 'raw';
                } else if (this.highlightedTextContent && this.highlightedTextContent.contains(node)) {
                    offsets = this.getSelectionOffset(this.highlightedTextContent);
                    sourceView = 'highlighted';
                } else if (this.translatedTextContent && this.translatedTextContent.contains(node)) {
                    offsets = this.getSelectionOffset(this.translatedTextContent);
                    sourceView = 'translate';
                    
                    // Get the current translation language from the UI
                    const translateLangSelect = document.getElementById('translateLanguageSelect');
                    if (translateLangSelect && translateLangSelect.value) {
                        translationLanguage = translateLangSelect.value;
                    }
                }
                // Check Map View
                else {
                    const mapGrid = document.getElementById('mapGrid');
                    if (mapGrid && mapGrid.contains(node)) {
                        const card = node.nodeType === 1 ? node.closest('.page-card') : (node.parentElement ? node.parentElement.closest('.page-card') : null);
                        if (card && card.dataset.startOffset) {
                            const cardStart = parseInt(card.dataset.startOffset);
                            const body = card.querySelector('.page-card-body');
                            if (body && body.contains(node)) {
                                const range = selection.getRangeAt(0);
                                const selectedText = range.toString().trim();
                                
                                function getTextPosition(targetNode, targetOffset) {
                                    let position = 0;
                                    const walker = document.createTreeWalker(
                                        body,
                                        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
                                        {
                                            acceptNode: function(n) {
                                                if (n.nodeType === Node.ELEMENT_NODE) {
                                                    if (n.classList && (n.classList.contains('highlight-overlay') || n.classList.contains('highlight-count-badge'))) {
                                                        return NodeFilter.FILTER_REJECT;
                                                    }
                                                    return NodeFilter.FILTER_SKIP;
                                                }
                                                if (n.nodeType === Node.TEXT_NODE) {
                                                    let parent = n.parentElement;
                                                    while (parent && parent !== body) {
                                                        if (parent.classList && (parent.classList.contains('highlight-overlay') || parent.classList.contains('highlight-count-badge'))) {
                                                            return NodeFilter.FILTER_REJECT;
                                                        }
                                                        parent = parent.parentElement;
                                                    }
                                                    return NodeFilter.FILTER_ACCEPT;
                                                }
                                                return NodeFilter.FILTER_SKIP;
                                            }
                                        }
                                    );
                                    
                                    let currentNode;
                                    while (currentNode = walker.nextNode()) {
                                        if (currentNode === targetNode) {
                                            return position + targetOffset;
                                        }
                                        position += currentNode.textContent.length;
                                    }
                                    
                                    return position;
                                }
                                
                                const localStart = getTextPosition(range.startContainer, range.startOffset);
                                
                                offsets = {
                                    start: cardStart + localStart,
                                    end: cardStart + localStart + selectedText.length
                                };
                                
                                sourceView = 'raw';
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Error calculating highlight offsets:', e);
        }
        
        // Show selected text separately, keep note input empty
        this.openDialog('Add Note', '', (noteText) => {
            if (noteText) {
                // Create a highlight with the user's note
                const highlight = {
                    id: Date.now().toString(),
                    type: 'highlight',
                    text: selectedTextBackup, // The highlighted text
                    note: noteText, // The user's note about the highlighted text
                    color: this.currentColor,
                    page: page,
                    createdAt: new Date().toISOString(),
                    links: [],
                    startOffset: offsets ? offsets.start : undefined,
                    endOffset: offsets ? offsets.end : undefined,
                    filePath: this.currentFilePath,
                    fileName: this.getFileName(this.currentFilePath),
                    sourceView: sourceView,
                    translationLanguage: translationLanguage
                };
                
                this.highlights.push(highlight);
                this.saveToStorage();
                
                // Force render immediately so it appears in the tab
                setTimeout(() => {
                    this.render(true);
                    this.applyHighlightsDebounced();
                }, 50);
            }
            // Clear selection
            window.getSelection().removeAllRanges();
        }, selectedTextBackup);
    }
    
    highlightAndNoteFromContext() {
        // Same behavior as highlightSelectionFromContext now (immediate save with text as note)
        // This method is kept for backward compatibility with context menu handlers
        this.highlightSelectionFromContext();
    }
    
    loadNotesForFileSync(filePath) {
        // Synchronous version that just returns the notes without setting state
        const allData = this.loadFromStorage();
        return allData[filePath] || [];
    }
    
    getNotesForFile(filePath) {
        // Get notes and highlights for a specific file without changing state
        // Used by mindmap to load external highlights
        const allData = this.loadFromStorage();
        let fileData = allData[filePath];
        
        // Fallback: Match by filename if exact path not found
        if (!fileData) {
            try {
                const targetFileName = filePath.split(/[\\/]/).pop();
                const matchedPath = Object.keys(allData).find(storedPath => {
                    const storedFileName = storedPath.split(/[\\/]/).pop();
                    return storedFileName === targetFileName;
                });
                
                if (matchedPath) {
                    fileData = allData[matchedPath];
                }
            } catch (e) {
                console.error('Error finding file data:', e);
            }
        }
        
        return fileData || { notes: [], highlights: [] };
    }
    
    loadNotesForFile(filePath) {
        this.currentFilePath = filePath;
        const allData = this.loadFromStorage();
        let fileData = allData[filePath];

        // Fallback: Match by filename if exact path not found (Sync across devices support)
        if (!fileData) {
            try {
                const currentFileName = filePath.split(/[\\/]/).pop();
                const matchedPath = Object.keys(allData).find(storedPath => {
                    const storedFileName = storedPath.split(/[\\/]/).pop();
                    return storedFileName === currentFileName;
                });
                
                if (matchedPath) {
                    console.log(`Found notes for "${currentFileName}" at old path: "${matchedPath}". Using these notes.`);
                    fileData = allData[matchedPath];
                }
            } catch (e) {
                console.error('Error linking notes by filename:', e);
            }
        }

        fileData = fileData || { notes: [], highlights: [] };
        
        // Ensure all notes and highlights have a links array (migration for old data)
        this.notes = (fileData.notes || []).map(note => ({
            ...note,
            links: note.links || []
        }));
        this.highlights = (fileData.highlights || []).map(highlight => ({
            ...highlight,
            links: highlight.links || []
        }));
        
        this.render(true); // Force render when loading from file
        this.applyHighlights();
        this.updateButtonStates();
        
        // Ensure text selection is enabled on both containers
        if (this.rawTextContent) {
            this.rawTextContent.style.userSelect = 'text';
            this.rawTextContent.style.cursor = 'text';
        }
        if (this.highlightedTextContent) {
            this.highlightedTextContent.style.userSelect = 'text';
            this.highlightedTextContent.style.cursor = 'text';
        }
    }
    
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.error('Error loading notes:', e);
            return {};
        }
    }
    
    saveToStorage() {
        try {
            // Fallback for empty path
            const path = this.currentFilePath || '';
            
            const allData = this.loadFromStorage();
            allData[path] = {
                notes: this.notes,
                highlights: this.highlights
            };
            localStorage.setItem(this.storageKey, JSON.stringify(allData));
        } catch (e) {
            console.error('Error saving notes:', e);
        }
    }
    
    showAddNoteDialog() {
        this.openDialog('Add New Note', '', (noteText) => {
            if (noteText) {
                this.addNote(noteText);
            }
        });
    }
    
    addNote(text, page = null) {
        const note = {
            id: Date.now().toString(),
            type: 'note',
            text: text,
            page: page || (typeof pdfViewer !== 'undefined' ? pdfViewer.currentPage : 1),
            createdAt: new Date().toISOString(),
            links: [], // Array of linked note IDs (format: {id, filePath, fileName})
            filePath: this.currentFilePath,
            fileName: this.getFileName(this.currentFilePath)
        };
        
        this.notes.push(note);
        this.saveToStorage();
        this.renderDebounced(); // Use debounced to prevent lag
        return note;
    }
    
    applyHighlights() {
        // Apply highlights to highlighted text view (only non-translated highlights)
        setTimeout(() => {
            // Mobile-friendly: Don't check visibility, always apply if element exists
            if (this.highlightedTextContent) {
                const analysisHighlights = this.highlights.filter(h => !h.sourceView || h.sourceView === 'raw' || h.sourceView === 'highlighted');
                this.applyHighlightsToContainer(this.highlightedTextContent, analysisHighlights);
            }
        }, 50);
        
        // Apply highlights to translated text view (only matching language highlights)
        setTimeout(() => {
            // Check if translated view is visible before applying
            if (this.translatedTextContent && this.translatedTextContent.offsetParent) {
                const translateLangSelect = document.getElementById('translateLanguageSelect');
                const currentLang = translateLangSelect ? translateLangSelect.value : null;
                
                // Filter highlights for current translation language
                const translatedHighlights = this.highlights.filter(h => 
                    h.sourceView === 'translate' && h.translationLanguage === currentLang
                );
                
                this.applyHighlightsToContainer(this.translatedTextContent, translatedHighlights);
            }
        }, 50);
    }
    
    applyHighlightsToContainer(container, highlightsToApply = null) {
        // Use provided highlights or all highlights
        const highlights = highlightsToApply || this.highlights;
        
        if (!container || highlights.length === 0) return;
        
        // Remove old user highlights
        const oldHighlights = container.querySelectorAll('.user-highlight');
        oldHighlights.forEach(el => {
            const parent = el.parentNode;
            if (parent) {
                parent.replaceChild(document.createTextNode(el.textContent), el);
                parent.normalize();
            }
        });
        
        // Apply new highlights
        highlights.forEach(highlight => {
            this.wrapTextWithHighlight(container, highlight.text, highlight.id, highlight.color, highlight.note);
        });
    }
    
    wrapTextWithHighlight(container, searchText, highlightId, color = 'yellow', note = '') {
        // Simple case: try to find exact match in single text node first
        const simpleWalker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let simpleNode;
        while (simpleNode = simpleWalker.nextNode()) {
            const text = simpleNode.textContent;
            const index = text.indexOf(searchText);
            
            if (index !== -1) {
                const parent = simpleNode.parentNode;
                if (parent.classList && parent.classList.contains('user-highlight')) {
                    continue;
                }
                
                const fragment = document.createDocumentFragment();
                
                // Text before
                if (index > 0) {
                    fragment.appendChild(document.createTextNode(text.substring(0, index)));
                }
                
                // Highlighted text
                const mark = document.createElement('mark');
                mark.className = `user-highlight color-${color}`;
                mark.setAttribute('data-highlight-id', highlightId);
                mark.textContent = searchText;
                
                // Custom Tooltip (using global TooltipManager)
                mark.dataset.tooltip = note && note.trim() ? note : 'Click to view/edit highlight';
                
                mark.addEventListener('click', () => {
                    this.showHighlightDetails(highlightId);
                });
                fragment.appendChild(mark);
                
                // Text after
                if (index + searchText.length < text.length) {
                    fragment.appendChild(document.createTextNode(text.substring(index + searchText.length)));
                }
                
                parent.replaceChild(fragment, simpleNode);
                return; // Highlighting done for this occurrence
            }
        }
        
        // Complex case: text might be split across multiple elements (spans)
        this.wrapFragmentedText(container, searchText, highlightId, color, note);
    }
    
    wrapFragmentedText(container, searchText, highlightId, color = 'yellow', note = '') {
        // Get all text nodes in order
        const walker = document.createTreeWalker(
            container,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }
        
        // Optimization: Instead of char-by-char map, use range map
        // nodeRanges = [{ node, start: 0, end: 5 }, { node, start: 5, end: 12 }, ...]
        let fullText = '';
        const nodeRanges = [];
        
        textNodes.forEach(node => {
            const text = node.textContent;
            const start = fullText.length;
            fullText += text;
            const end = fullText.length;
            
            nodeRanges.push({
                node: node,
                start: start,
                end: end
            });
        });
        
        // Find match in full text
        let searchIndex = 0;
        let matchIndex = fullText.indexOf(searchText, searchIndex);
        
        while (matchIndex !== -1) {
            const start = matchIndex;
            const end = matchIndex + searchText.length;
            
            // Identify start and end nodes efficiently
            // Since nodeRanges is sorted by start index, we could use binary search,
            // but linear scan is likely fast enough for N < 10000 nodes.
            
            let startNodeInfo = null;
            let endNodeInfo = null;
            let startIndexInRanges = -1;
            let endIndexInRanges = -1;
            
            // Find start node
            for (let i = 0; i < nodeRanges.length; i++) {
                if (start >= nodeRanges[i].start && start < nodeRanges[i].end) {
                    startNodeInfo = nodeRanges[i];
                    startIndexInRanges = i;
                    break;
                }
            }
            
            // Find end node
            if (startNodeInfo) {
                for (let i = startIndexInRanges; i < nodeRanges.length; i++) {
                    if (end > nodeRanges[i].start && end <= nodeRanges[i].end) {
                        endNodeInfo = nodeRanges[i];
                        endIndexInRanges = i;
                        break;
                    }
                }
            }
            
            if (!startNodeInfo || !endNodeInfo) {
                // Should not happen if text exists, but safe fallback
                matchIndex = fullText.indexOf(searchText, matchIndex + 1);
                continue;
            }
            
            // Wrap nodes from start to end
            for (let i = startIndexInRanges; i <= endIndexInRanges; i++) {
                const range = nodeRanges[i];
                const currentNode = range.node;
                const text = currentNode.textContent;
                
                let localStart = 0;
                let localEnd = text.length;
                
                // Adjust start for first node
                if (i === startIndexInRanges) {
                    localStart = start - range.start;
                }
                
                // Adjust end for last node
                if (i === endIndexInRanges) {
                    localEnd = end - range.start;
                }
                
                // Skip if parent is already a user highlight
                if (currentNode.parentNode && currentNode.parentNode.classList && currentNode.parentNode.classList.contains('user-highlight')) continue;
                
                // Apply highlight
                const fragment = document.createDocumentFragment();
                
                // Text before
                if (localStart > 0) {
                    fragment.appendChild(document.createTextNode(text.substring(0, localStart)));
                }
                
                // Highlighted portion
                const mark = document.createElement('mark');
                mark.className = `user-highlight color-${color}`;
                mark.setAttribute('data-highlight-id', highlightId);
                mark.textContent = text.substring(localStart, localEnd);
                
                mark.dataset.tooltip = note && note.trim() ? note : 'Click to view/edit highlight';
                
                mark.addEventListener('click', () => {
                    this.showHighlightDetails(highlightId);
                });
                fragment.appendChild(mark);
                
                // Text after
                if (localEnd < text.length) {
                    fragment.appendChild(document.createTextNode(text.substring(localEnd)));
                }
                
                if (currentNode.parentNode) {
                    currentNode.parentNode.replaceChild(fragment, currentNode);
                }
            }
            
            // Only highlight the first occurrence for now (matches previous logic)
            return;
        }
    }
    
    showHighlightDetails(highlightId) {
        const highlight = this.highlights.find(h => h.id === highlightId);
        if (highlight) {
            // Switch to notes view
            document.getElementById('notesBtn').click();
            
            // Scroll to the highlight item
            setTimeout(() => {
                const noteItem = document.querySelector(`[data-note-id="${highlightId}"]`);
                if (noteItem) {
                    noteItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    noteItem.style.background = '#e3f2fd';
                    setTimeout(() => {
                        noteItem.style.background = 'white';
                    }, 1000);
                }
            }, 100);
        }
    }
    
    deleteNote(id, skipConfirm = false) {
        if (skipConfirm || confirm('Are you sure you want to delete this item?')) {
            this.notes = this.notes.filter(n => n.id !== id);
            this.highlights = this.highlights.filter(h => h.id !== id);
            this.saveToStorage();
            this.renderDebounced(); // Use debounced to prevent lag
            
            // Force re-application of highlights to remove the deleted one
            // First clear all user highlights
            const containers = [this.rawTextContent, this.highlightedTextContent];
            containers.forEach(container => {
                if (!container) return;
                const oldHighlights = container.querySelectorAll('.user-highlight');
                oldHighlights.forEach(el => {
                    const parent = el.parentNode;
                    if (parent) {
                        parent.replaceChild(document.createTextNode(el.textContent), el);
                        parent.normalize();
                    }
                });
            });
            
            // Then apply remaining highlights
            this.applyHighlights();
        }
    }
    
    editNote(id) {
        console.log('Editing note/highlight with ID:', id);
        console.log('Current notes:', this.notes.length, 'highlights:', this.highlights.length);
        console.log('All IDs:', [...this.notes, ...this.highlights].map(i => i.id));
        
        const item = [...this.notes, ...this.highlights].find(i => i.id === id);
        
        if (!item) {
            console.error('Item not found for editing:', id);
            console.error('Searched in notes:', this.notes.map(n => n.id));
            console.error('Searched in highlights:', this.highlights.map(h => h.id));
            
            // Try reloading from storage
            this.loadNotesForFile(this.currentFilePath);
            const itemAfterReload = [...this.notes, ...this.highlights].find(i => i.id === id);
            
            if (itemAfterReload) {
                console.log('Found item after reloading from storage');
                this.editNoteInternal(itemAfterReload);
                return;
            }
            
            alert('Highlight not found. Please try again.');
            return;
        }
        
        this.editNoteInternal(item);
    }
    
    editNoteInternal(item) {
        // Close any existing dialogs first
        const existingDialogs = document.querySelectorAll('.note-dialog-overlay');
        existingDialogs.forEach(d => d.remove());
        
        // Determine current text and title based on type
        let currentText, title;
        if (item.type === 'note') {
            currentText = item.text;
            title = 'Edit Note';
        } else {
            // For highlights, we edit the note attached to the highlight, not the highlight text itself
            currentText = item.note || '';
            title = 'Edit Highlight Note';
        }
        
        // Collect existing tags for suggestions
        const existingTags = item.tags || [];
        const existingTagNames = existingTags.map(t => this.getTagName(t).toLowerCase());
        const allTagsWithColors = this.collectAllTagsWithColors();
        const suggestedTags = allTagsWithColors.filter(t => !existingTagNames.includes(t.name));
        
        // Create enhanced edit dialog with tags
        const dialog = document.createElement('div');
        dialog.className = 'note-dialog-overlay';
        dialog.innerHTML = `
            <div class="note-dialog" style="max-width: 500px;">
                <div class="note-dialog-header">
                    <h3>${title}</h3>
                    <button class="note-dialog-close" id="editDialogClose">×</button>
                </div>
                <div class="note-dialog-body">
                    ${item.type === 'highlight' && item.text ? `
                        <div class="note-dialog-highlighted-text" style="font-style: italic; color: #888; background: #f5f5f5; padding: 12px; border-radius: 6px; margin-bottom: 12px; font-size: 14px; line-height: 1.5; border-left: 3px solid #ccc;">
                            ${this.escapeHtml(item.text)}
                        </div>
                    ` : ''}
                    <div class="edit-note-section">
                        <label style="display: block; font-size: 12px; color: #666; margin-bottom: 6px; font-weight: 500;">
                            ${item.type === 'note' ? 'Note text:' : 'Note (optional):'}
                        </label>
                        <textarea id="editNoteTextarea" class="note-dialog-input" placeholder="${item.type === 'note' ? 'Enter note text...' : 'Add a note to this highlight...'}">${this.escapeHtml(currentText)}</textarea>
                    </div>
                    
                    <div class="edit-tags-section" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
                        <label style="display: block; font-size: 12px; color: #666; margin-bottom: 6px; font-weight: 500;">🏷️ Tags:</label>
                        <div class="tag-input-container" style="margin-bottom: 10px;">
                            <input type="text" id="editTagInput" class="tag-input" placeholder="Type a tag name..." autocomplete="off">
                            <div class="tag-color-selector" style="margin-top: 10px;">
                                <label style="display: block; margin-bottom: 5px; font-size: 11px; color: #666;">Tag Color:</label>
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
                            <button id="saveEditTagBtn" class="btn-primary" style="margin-top: 10px; width: 100%; font-size: 13px;">💾 Add Tag</button>
                        </div>
                        <div class="current-tags-list" id="editCurrentTags" style="display: flex; flex-wrap: wrap; gap: 8px; min-height: 30px;">
                            ${existingTags.map(tag => {
                                const tagName = this.getTagName(tag);
                                const tagColor = this.getTagColor(tag);
                                return `
                                    <span class="tag-badge tag-${tagColor}" data-tag="${this.escapeHtml(tagName)}">
                                        ${this.escapeHtml(tagName)}
                                        <button class="tag-remove-btn" data-remove-tag="${this.escapeHtml(tagName)}">×</button>
                                    </span>
                                `;
                            }).join('')}
                        </div>
                        ${suggestedTags.length > 0 ? `
                            <div class="suggested-tags-section" style="margin-top: 10px;">
                                <label style="display: block; font-size: 11px; color: #999; margin-bottom: 6px;">Click to add:</label>
                                <div class="suggested-tags-list" id="editSuggestedTags" style="display: flex; flex-wrap: wrap; gap: 6px;">
                                    ${suggestedTags.slice(0, 8).map(tag => `
                                        <span class="tag-badge tag-${tag.color} suggested" data-suggest-tag="${this.escapeHtml(tag.name)}" data-suggest-color="${tag.color}">${this.escapeHtml(tag.name)}</span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="note-dialog-footer">
                    <button class="btn-secondary" id="editDialogCancel" style="background: #9e9e9e;">Cancel</button>
                    <button class="btn-primary" id="editDialogSave">Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
        
        // Track current tags state
        let currentTags = [...existingTags];
        
        // Get elements
        const textarea = dialog.querySelector('#editNoteTextarea');
        const tagInput = dialog.querySelector('#editTagInput');
        const currentTagsList = dialog.querySelector('#editCurrentTags');
        const suggestedTagsList = dialog.querySelector('#editSuggestedTags');
        
        // Focus textarea
        textarea.focus();
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        
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
        
        // Helper to render current tags
        const renderCurrentTags = () => {
            currentTagsList.innerHTML = currentTags.map(tag => {
                const tagName = this.getTagName(tag);
                const tagColor = this.getTagColor(tag);
                return `
                    <span class="tag-badge tag-${tagColor}" data-tag="${this.escapeHtml(tagName)}">
                        ${this.escapeHtml(tagName)}
                        <button class="tag-remove-btn" data-remove-tag="${this.escapeHtml(tagName)}">×</button>
                    </span>
                `;
            }).join('');
        };
        
        // Helper to add a tag
        const addTag = (tag, color = 'green') => {
            const normalizedTag = tag.trim().toLowerCase();
            if (!normalizedTag) return;
            
            // Check if tag already exists
            const existingIndex = currentTags.findIndex(t => this.getTagName(t) === normalizedTag);
            if (existingIndex > -1) return;
            
            currentTags.push({ name: normalizedTag, color: color });
            renderCurrentTags();
            
            // Remove from suggestions if present
            if (suggestedTagsList) {
                const suggestedBadge = suggestedTagsList.querySelector(`[data-suggest-tag="${normalizedTag}"]`);
                if (suggestedBadge) suggestedBadge.remove();
            }
        };
        
        // Helper to remove a tag
        const removeTag = (tag) => {
            const index = currentTags.findIndex(t => this.getTagName(t) === tag);
            if (index > -1) {
                currentTags.splice(index, 1);
                renderCurrentTags();
            }
        };
        
        // Save tag button click
        const saveTagBtn = dialog.querySelector('#saveEditTagBtn');
        const saveTagHandler = () => {
            const tag = tagInput.value.trim();
            if (tag) {
                addTag(tag, selectedColor);
                tagInput.value = '';
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
        
        saveTagBtn.addEventListener('click', (e) => {
            e.preventDefault();
            saveTagHandler();
        });
        
        // Event: Add tag on Enter
        tagInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveTagHandler();
            }
        });
        
        // Event: Remove tag button clicks
        currentTagsList.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('[data-remove-tag]');
            if (removeBtn) {
                removeTag(removeBtn.dataset.removeTag);
            }
        });
        
        // Event: Suggested tag clicks
        if (suggestedTagsList) {
            suggestedTagsList.addEventListener('click', (e) => {
                const suggestBadge = e.target.closest('[data-suggest-tag]');
                if (suggestBadge) {
                    const tagName = suggestBadge.dataset.suggestTag;
                    const tagColor = suggestBadge.dataset.suggestColor || 'green';
                    addTag(tagName, tagColor);
                }
            });
        }
        
        // Event: Save
        const saveHandler = () => {
            const newText = textarea.value;
            
            if (item.type === 'note') {
                if (newText.trim() === '') {
                    alert('Note text cannot be empty.');
                    return;
                }
                item.text = newText.trim();
            } else {
                item.note = newText.trim();
            }
            
            // Update tags
            item.tags = currentTags.length > 0 ? currentTags : undefined;
            
            this.saveToStorage();
            this.renderDebounced(); // Use debounced to prevent lag
            this.applyHighlightsDebounced(); // Use debounced to prevent lag
            dialog.remove();
        };
        
        dialog.querySelector('#editDialogSave').addEventListener('click', saveHandler);
        
        // Event: Save on Ctrl+Enter in textarea
        textarea.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                saveHandler();
            }
        });
        
        // Event: Close/Cancel
        const closeDialog = () => dialog.remove();
        dialog.querySelector('#editDialogClose').addEventListener('click', closeDialog);
        dialog.querySelector('#editDialogCancel').addEventListener('click', closeDialog);
        // Disabled click-outside-to-close to prevent accidental closures while editing
        // dialog.addEventListener('click', (e) => {
        //     if (e.target === dialog) closeDialog();
        // });
    }
    
    updateButtonStates() {
        const hasFile = !!this.currentFilePath;
        if (this.addNoteBtn) {
            this.addNoteBtn.disabled = !hasFile;
        }
    }
    
    toggleSelectAll(checked) {
        if (checked) {
            const allItems = [...this.notes, ...this.highlights];
            // Only select items currently visible if filtered? 
            // For now select all loaded for this file.
            allItems.forEach(i => this.selectedNoteIds.add(i.id));
        } else {
            this.selectedNoteIds.clear();
        }
        this.render();
        this.updateSelectionUI();
    }

    toggleNoteSelection(id, checked) {
        if (checked) {
            this.selectedNoteIds.add(id);
        } else {
            this.selectedNoteIds.delete(id);
        }
        this.updateSelectionUI();
    }

    updateSelectionUI() {
        // Update select all checkbox state
        const totalItems = this.notes.length + this.highlights.length;
        if (this.selectAllCheckbox) {
            if (totalItems > 0) {
                this.selectAllCheckbox.checked = this.selectedNoteIds.size === totalItems;
                this.selectAllCheckbox.indeterminate = this.selectedNoteIds.size > 0 && this.selectedNoteIds.size < totalItems;
            } else {
                this.selectAllCheckbox.checked = false;
                this.selectAllCheckbox.indeterminate = false;
            }
        }

        // Update delete button visibility
        if (this.deleteSelectedBtn) {
            if (this.selectedNoteIds.size > 0) {
                this.deleteSelectedBtn.style.display = 'block';
                this.deleteSelectedBtn.textContent = `🗑️ Delete (${this.selectedNoteIds.size})`;
            } else {
                this.deleteSelectedBtn.style.display = 'none';
            }
        }
    }

    deleteSelectedNotes() {
        if (confirm(`Are you sure you want to delete ${this.selectedNoteIds.size} selected items?`)) {
            this.selectedNoteIds.forEach(id => {
                this.deleteNote(id, true); // true = skip confirm for individual
            });
            this.selectedNoteIds.clear();
            this.updateSelectionUI();
        }
    }
    
    scrollToNote(id) {
        // Get the item to check if it's from translate view
        const item = [...this.notes, ...this.highlights].find(i => i.id === id);
        
        // If highlight was created in translate view, switch to translate tab and load language
        if (item && item.sourceView === 'translate' && item.translationLanguage) {
            // Switch to translate view
            if (window.switchView) {
                window.switchView('translate');
            }
            
            // Load the translation if not already loaded
            setTimeout(() => {
                const translateLangSelect = document.getElementById('translateLanguageSelect');
                const currentLang = translateLangSelect ? translateLangSelect.value : null;
                
                // If translation language is different or not loaded, load it
                if (currentLang !== item.translationLanguage) {
                    if (translateLangSelect) {
                        translateLangSelect.value = item.translationLanguage;
                        translateLangSelect.dispatchEvent(new Event('change'));
                    }
                    
                    // Load cached translation
                    if (window.loadCachedTranslation) {
                        window.loadCachedTranslation(item.translationLanguage);
                        
                        // Wait for translation to load, then scroll
                        setTimeout(() => {
                            this.scrollToHighlightInView(id, 'translatedTextContent');
                        }, 500);
                    }
                } else {
                    // Translation already loaded, just scroll
                    this.scrollToHighlightInView(id, 'translatedTextContent');
                }
            }, 100);
            return;
        }
        
        // Find highlight element in appropriate view
        let highlightEl = null;
        const isAnalyseView = document.getElementById('highlightedTextView').classList.contains('active');
        
        if (isAnalyseView && this.highlightedTextContent) {
            highlightEl = this.highlightedTextContent.querySelector(`.user-highlight[data-highlight-id="${id}"]`);
        }
        
        if (!highlightEl && this.rawTextContent) {
            highlightEl = this.rawTextContent.querySelector(`.user-highlight[data-highlight-id="${id}"]`);
        }
        
        if (highlightEl) {
            // Ensure we are in the correct view
            const isInHighlighted = this.highlightedTextContent && this.highlightedTextContent.contains(highlightEl);
            
            if (isInHighlighted && !document.getElementById('highlightedTextView').classList.contains('active')) {
                 if (window.switchView) window.switchView('highlighted');
            }
            
            highlightEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Flash effect
            highlightEl.classList.add('flash-highlight');
            setTimeout(() => highlightEl.classList.remove('flash-highlight'), 2000);
        } else {
            // Fallback to page navigation
            if (item && item.page && window.goToPage) {
                window.goToPage(item.page, true);
            }
        }
    }
    
    scrollToHighlightInView(id, containerName) {
        const container = document.getElementById(containerName);
        if (!container) return;
        
        const highlightEl = container.querySelector(`.user-highlight[data-highlight-id="${id}"]`);
        if (highlightEl) {
            highlightEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Flash effect
            highlightEl.classList.add('flash-highlight');
            setTimeout(() => highlightEl.classList.remove('flash-highlight'), 2000);
        }
    }

    linkNotes(sourceId) {
        const sourceItem = this.getItemById(sourceId);
        if (!sourceItem) return;
        
        // Get all items from ALL documents
        const allData = this.loadFromStorage();
        const allItems = [];
        
        Object.keys(allData).forEach(filePath => {
            const fileData = allData[filePath];
            const fileName = this.getFileName(filePath);
            const isCurrentDoc = filePath === this.currentFilePath;
            
            if (fileData.notes) {
                fileData.notes.forEach(n => {
                    if (n.id !== sourceId) {
                        allItems.push({
                            ...n,
                            displayType: 'Note',
                            filePath: filePath,
                            fileName: fileName,
                            isCurrentDoc: isCurrentDoc
                        });
                    }
                });
            }
            
            if (fileData.highlights) {
                fileData.highlights.forEach(h => {
                    if (h.id !== sourceId) {
                        allItems.push({
                            ...h,
                            displayType: 'Highlight',
                            filePath: filePath,
                            fileName: fileName,
                            isCurrentDoc: isCurrentDoc
                        });
                    }
                });
            }
        });
        
        if (allItems.length === 0) {
            alert('No other notes or highlights to link to. Create notes in other documents to link across files.');
            return;
        }
        
        // Sort: current document first, then by date
        allItems.sort((a, b) => {
            if (a.isCurrentDoc && !b.isCurrentDoc) return -1;
            if (!a.isCurrentDoc && b.isCurrentDoc) return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        // Create a dialog to select which note to link
        this.showLinkDialog(sourceId, allItems, sourceItem);
    }
    
    showLinkDialog(sourceId, availableItems, sourceItem) {
        const dialog = document.createElement('div');
        dialog.className = 'note-dialog-overlay';
        
        const renderItems = (searchQuery = '') => {
            const filteredItems = searchQuery 
                ? availableItems.filter(item => {
                    const text = item.type === 'highlight' ? item.text : item.text;
                    const note = item.note || '';
                    const fileName = item.fileName || '';
                    return text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           note.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           fileName.toLowerCase().includes(searchQuery.toLowerCase());
                  })
                : availableItems;
            
            if (filteredItems.length === 0) {
                return '<div class="placeholder-text" style="padding: 20px; text-align: center; color: #999;">No matching notes found</div>';
            }
            
            // Group items by document
            const groupedByDoc = {};
            filteredItems.forEach(item => {
                const key = item.filePath;
                if (!groupedByDoc[key]) {
                    groupedByDoc[key] = {
                        fileName: item.fileName,
                        filePath: item.filePath,
                        isCurrentDoc: item.isCurrentDoc,
                        items: []
                    };
                }
                groupedByDoc[key].items.push(item);
            });
            
            // Sort groups: current document first
            const sortedGroups = Object.values(groupedByDoc).sort((a, b) => {
                if (a.isCurrentDoc && !b.isCurrentDoc) return -1;
                if (!a.isCurrentDoc && b.isCurrentDoc) return 1;
                return a.fileName.localeCompare(b.fileName);
            });
            
            // Render accordion
            return sortedGroups.map((group, groupIndex) => {
                const docLabel = group.isCurrentDoc ? '📄 This document' : `📚 ${this.escapeHtml(group.fileName)}`;
                const itemCount = group.items.length;
                const linkedCount = group.items.filter(item => 
                    sourceItem.links && sourceItem.links.some(link => 
                        (typeof link === 'string' ? link === item.id : link.id === item.id)
                    )
                ).length;
                const countBadge = linkedCount > 0 ? ` <span class="link-count-badge">${linkedCount} linked</span>` : '';
                
                const itemsHtml = group.items.map(item => {
                    const isLinked = sourceItem.links && sourceItem.links.some(link => 
                        (typeof link === 'string' ? link === item.id : link.id === item.id)
                    );
                    const preview = item.type === 'highlight' ? item.text : item.text;
                    const truncated = preview.length > 80 ? preview.substring(0, 80) + '...' : preview;
                    
                    return `
                        <div class="link-item ${isLinked ? 'linked' : ''}" data-item-id="${item.id}" data-file-path="${this.escapeHtml(item.filePath)}" onclick="notesManager.toggleLink('${sourceId}', '${item.id}', null, this)">
                            <div class="link-item-header">
                                <span class="link-item-type">${item.type === 'highlight' ? '🖍️' : '📝'} ${item.displayType}</span>
                                <span class="link-item-page">Page ${item.page}</span>
                            </div>
                            <div class="link-item-preview">${this.escapeHtml(truncated)}</div>
                            <div class="link-item-status">${isLinked ? '✓ Linked' : 'Click to link'}</div>
                        </div>
                    `;
                }).join('');
                
                // Current document is expanded by default
                const isExpanded = group.isCurrentDoc;
                
                return `
                    <div class="link-accordion-group">
                        <div class="link-accordion-header ${isExpanded ? 'expanded' : ''}" onclick="notesManager.toggleAccordion(this)">
                            <span class="accordion-icon">${isExpanded ? '▼' : '▶'}</span>
                            <span class="accordion-title">${docLabel}</span>
                            <span class="accordion-count">${itemCount} ${itemCount === 1 ? 'item' : 'items'}${countBadge}</span>
                        </div>
                        <div class="link-accordion-content" style="display: ${isExpanded ? 'block' : 'none'};">
                            ${itemsHtml}
                        </div>
                    </div>
                `;
            }).join('');
        };
        
        dialog.innerHTML = `
            <div class="note-dialog">
                <div class="note-dialog-header">
                    <h3>🔗 Link to Another Note</h3>
                    <button class="note-dialog-close" onclick="this.closest('.note-dialog-overlay').remove()">×</button>
                </div>
                <div class="note-dialog-body">
                    <p style="margin-bottom: 10px; color: #666; font-size: 14px;">Select a note or highlight to link:</p>
                    <div class="link-search-container">
                        <input type="text" class="link-search-input" placeholder="🔍 Search notes or documents..." id="linkSearchInput">
                    </div>
                    <div class="link-items-list" id="linkItemsList">
                        ${renderItems()}
                    </div>
                </div>
                <div class="note-dialog-footer">
                    <button class="btn-secondary" onclick="this.closest('.note-dialog-overlay').remove()">Done</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
        
        // Add search functionality
        const searchInput = dialog.querySelector('#linkSearchInput');
        const itemsList = dialog.querySelector('#linkItemsList');
        
        searchInput.addEventListener('input', (e) => {
            itemsList.innerHTML = renderItems(e.target.value);
        });
        
        // Focus search input
        setTimeout(() => searchInput.focus(), 100);
    }
    
    toggleAccordion(headerElement) {
        const content = headerElement.nextElementSibling;
        const icon = headerElement.querySelector('.accordion-icon');
        const isExpanded = headerElement.classList.contains('expanded');
        
        if (isExpanded) {
            headerElement.classList.remove('expanded');
            content.style.display = 'none';
            icon.textContent = '▶';
        } else {
            headerElement.classList.add('expanded');
            content.style.display = 'block';
            icon.textContent = '▼';
        }
    }
    
    toggleLink(sourceId, targetId, targetFilePath, element) {
        const sourceItem = this.getItemById(sourceId);
        if (!sourceItem) return;
        
        // Get file path from element dataset if not provided (prevents backslash escaping issues in onclick)
        const filePath = targetFilePath || (element && element.dataset.filePath);
        
        if (!sourceItem.links) sourceItem.links = [];
        
        // Create link object with document reference
        const linkObj = {
            id: targetId,
            filePath: filePath,
            fileName: this.getFileName(filePath)
        };
        
        // Check if link already exists (support both old string format and new object format)
        const linkIndex = sourceItem.links.findIndex(link => 
            (typeof link === 'string' ? link === targetId : link.id === targetId)
        );
        
        if (linkIndex > -1) {
            // Remove link
            sourceItem.links.splice(linkIndex, 1);
            if (element) {
                element.classList.remove('linked');
                element.querySelector('.link-item-status').textContent = 'Click to link';
            }
        } else {
            // Add link
            sourceItem.links.push(linkObj);
            if (element) {
                element.classList.add('linked');
                element.querySelector('.link-item-status').textContent = '✓ Linked';
            }
        }
        
        this.saveToStorage();
        this.render();
    }
    
    removeLink(sourceId, targetId, targetFilePath) {
        const sourceItem = this.getItemById(sourceId);
        if (!sourceItem || !sourceItem.links) return;
        
        // Get the linked item for confirmation message
        const linkedItem = this.getItemById(targetId, targetFilePath);
        const linkedPreview = linkedItem ? (linkedItem.type === 'highlight' ? linkedItem.text : linkedItem.text) : 'this note';
        const truncated = linkedPreview.length > 50 ? linkedPreview.substring(0, 50) + '...' : linkedPreview;
        
        // Show confirmation dialog
        if (!confirm(`Remove link to:\n\n"${truncated}"\n\nThis will not delete the note itself, only the link.`)) {
            return;
        }
        
        // Find and remove the link
        const linkIndex = sourceItem.links.findIndex(l => {
            const lId = typeof l === 'string' ? l : l.id;
            const lPath = typeof l === 'string' ? this.currentFilePath : l.filePath;
            return lId === targetId && lPath === targetFilePath;
        });
        
        if (linkIndex > -1) {
            sourceItem.links.splice(linkIndex, 1);
            this.saveToStorage();
            this.render();
        }
    }
    
    getItemById(id, filePath = null) {
        // If filePath is specified, search in that document's data
        if (filePath && filePath !== this.currentFilePath) {
            const allData = this.loadFromStorage();
            let fileData = allData[filePath];
            
            // Fallback: Match by filename if exact path not found
            if (!fileData) {
                try {
                    const targetFileName = this.getFileName(filePath);
                    const matchedPath = Object.keys(allData).find(storedPath => {
                        return this.getFileName(storedPath) === targetFileName;
                    });
                    
                    if (matchedPath) {
                        fileData = allData[matchedPath];
                    }
                } catch (e) {
                    console.error('Error finding linked file data:', e);
                }
            }

            if (fileData) {
                return fileData.notes?.find(n => n.id === id) || fileData.highlights?.find(h => h.id === id);
            }
            return null;
        }
        // Otherwise search in current document
        return this.notes.find(n => n.id === id) || this.highlights.find(h => h.id === id);
    }
    
    getFileName(filePath) {
        if (!filePath) return 'Unknown';
        return filePath.split(/[\\/]/).pop() || filePath;
    }
    
    getLanguageName(langCode) {
        const languageNames = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'ja': 'Japanese',
            'ko': 'Korean',
            'zh-CN': 'Chinese (Simplified)',
            'zh-TW': 'Chinese (Traditional)',
            'ar': 'Arabic',
            'hi': 'Hindi',
            'nl': 'Dutch',
            'pl': 'Polish',
            'tr': 'Turkish',
            'sv': 'Swedish',
            'da': 'Danish',
            'no': 'Norwegian',
            'fi': 'Finnish',
            'el': 'Greek',
            'cs': 'Czech',
            'hu': 'Hungarian',
            'ro': 'Romanian',
            'th': 'Thai',
            'vi': 'Vietnamese',
            'id': 'Indonesian',
            'ms': 'Malay',
            'uk': 'Ukrainian',
            'he': 'Hebrew',
            'fa': 'Persian',
            // South African Languages
            'af': 'Afrikaans',
            'zu': 'Zulu',
            'xh': 'Xhosa',
            'nso': 'Northern Sotho',
            'st': 'Southern Sotho',
            'tn': 'Tswana',
            'ts': 'Tsonga',
            'ss': 'Swati',
            've': 'Venda',
            'nr': 'Southern Ndebele'
        };
        return languageNames[langCode] || langCode.toUpperCase();
    }
    
    navigateToLinkedNote(noteId, filePath = null) {
        // Check if this is a cross-document link
        if (filePath && filePath !== this.currentFilePath) {
            // Trigger file open event directly (opens in new tab)
            if (window.openFileFromPath) {
                window.openFileFromPath(filePath, noteId);
            } else {
                alert('Cross-document navigation is not available. Please open the file manually:\n' + filePath);
            }
            return;
        }
        
        // Same document navigation
        const item = this.getItemById(noteId);
        if (!item) return;
        
        // Scroll to the note in the notes tab
        this.scrollToNote(noteId);
    }
    
    render(force = false) {
        // Optimization: Don't re-render if notes panel is not visible, unless forced
        if (!force && (!this.notesContent || !this.notesContent.offsetParent)) return;
        
        try {
            // ... rendering logic ...

        let allItems = [
            ...this.notes.map(n => ({ ...n, sortDate: n.createdAt })),
            ...this.highlights.map(h => ({ ...h, sortDate: h.createdAt }))
        ].sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate));
        
        // Filter based on search query
        if (this.searchQuery) {
            allItems = allItems.filter(item => {
                const textMatch = item.text && item.text.toLowerCase().includes(this.searchQuery);
                const noteMatch = item.note && item.note.toLowerCase().includes(this.searchQuery);
                // Also search in tags (tags can be strings or objects with {name, color})
                const tagMatch = item.tags && item.tags.some(tag => {
                    const tagName = this.getTagName(tag);
                    return tagName.toLowerCase().includes(this.searchQuery);
                });
                return textMatch || noteMatch || tagMatch;
            });
        }
        
        // Filter based on active tag filter
        if (this.activeTagFilter) {
            allItems = allItems.filter(item => {
                if (!item.tags) return false;
                // Tags can be strings or objects, normalize for comparison
                return item.tags.some(tag => {
                    const tagName = this.getTagName(tag);
                    return tagName.toLowerCase() === this.activeTagFilter.toLowerCase();
                });
            });
        }
        
        // Update count
        if (this.notesCount) {
            this.notesCount.textContent = `${this.notes.length} notes, ${this.highlights.length} highlights`;
        }
        
        if (allItems.length === 0) {
            if (this.searchQuery) {
                this.notesContent.innerHTML = `
                    <div class="placeholder-text">
                        <p>🔍 No results found</p>
                        <p style="font-size: 14px; color: #666;">Try a different search term</p>
                    </div>
                `;
            } else {
                this.notesContent.innerHTML = `
                    <div class="placeholder-text">
                        <p>📌 No notes yet</p>
                        <p style="font-size: 14px; color: #666;">Select text and click "Highlight Selection" or add notes manually</p>
                    </div>
                `;
            }
            return;
        }
        
        const html = allItems.map(item => {
            // ... (rest of mapping code) ...
            const isHighlight = item.type === 'highlight';
            const date = new Date(item.createdAt).toLocaleString();
            const highlightColor = item.color || 'yellow';
            const itemTags = item.tags || [];
            
            return `
                <div class="note-item ${isHighlight ? 'highlight-item' : ''} highlight-${highlightColor}" data-note-id="${item.id}" style="display: flex; align-items: flex-start;">
                    <div class="note-checkbox-container" style="padding: 10px 10px 0 0;">
                        <input type="checkbox" class="note-checkbox" onchange="notesManager.toggleNoteSelection('${item.id}', this.checked)" ${this.selectedNoteIds.has(item.id) ? 'checked' : ''}>
                    </div>
                    <div class="note-content-wrapper" style="flex: 1; cursor: pointer;" onclick="notesManager.scrollToNote('${item.id}')">
                        <div class="note-header">
                            <span class="note-type">${isHighlight ? '🖍️ Highlight' : '📝 Note'}</span>
                            <div class="note-actions">
                                <button class="note-action-btn" onclick="event.stopPropagation(); notesManager.showAddTagDialog('${item.id}')" title="Add tags">🏷️</button>
                                <button class="note-action-btn" onclick="event.stopPropagation(); notesManager.linkNotes('${item.id}')" title="Link to another note">🔗</button>
                                <button class="note-action-btn" onclick="event.stopPropagation(); notesManager.editNote('${item.id}')" title="Edit">✏️</button>
                                <button class="note-action-btn" onclick="event.stopPropagation(); notesManager.deleteNote('${item.id}')" title="Delete">🗑️</button>
                            </div>
                        </div>
                        ${isHighlight ? `
                            <div class="note-highlight-preview color-${highlightColor}">"${this.escapeHtml(item.text || '')}"</div>
                            ${item.note && item.note !== item.text ? `<div class="note-text">${this.escapeHtml(item.note)}</div>` : ''}
                        ` : `
                            <div class="note-text">${this.escapeHtml(item.text || '')}</div>
                        `}
                        ${itemTags.length > 0 ? `
                            <div class="note-tags">
                                ${itemTags.map(tag => {
                                    const tagName = this.getTagName(tag);
                                    const tagColor = this.getTagColor(tag);
                                    return `
                                        <span class="note-tag-badge tag-${tagColor}" onclick="event.stopPropagation(); notesManager.setTagFilter('${this.escapeHtml(tagName)}')" title="Filter by this tag">
                                            🏷️ ${this.escapeHtml(tagName)}
                                        </span>
                                    `;
                                }).join('')}
                            </div>
                        ` : ''}
                        <div class="note-meta">
                            <span class="note-page">Page ${item.page}</span>
                            <span class="note-date">${date}</span>
                            ${item.sourceView === 'translate' && item.translationLanguage ? `
                                <span class="translation-badge" title="Highlight from translated text">
                                    🌐 ${this.getLanguageName(item.translationLanguage)}
                                </span>
                            ` : ''}
                        </div>
                        ${item.links && item.links.length > 0 ? `
                            <div class="note-links">
                                <div class="note-links-header">🔗 Linked to ${item.links.length} ${item.links.length === 1 ? 'note' : 'notes'}:</div>
                                <div class="note-links-list">
                                    ${item.links.map(link => {
                                        // Support both old string format and new object format
                                        const linkId = typeof link === 'string' ? link : link.id;
                                        const linkFilePath = typeof link === 'string' ? this.currentFilePath : link.filePath;
                                        const linkFileName = typeof link === 'string' ? null : link.fileName;
                                        
                                        const linkedItem = this.getItemById(linkId, linkFilePath);
                                        
                                        // Handle broken links
                                        if (!linkedItem) {
                                            return `
                                                <div class="linked-note-badge broken-link" title="Note not found (File may have been moved or deleted)">
                                                    ⚠️ Note not found <span class="linked-note-doc">in ${this.escapeHtml(linkFileName || 'unknown file')}</span>
                                                </div>
                                            `;
                                        }
                                        
                                        const linkPreview = linkedItem.type === 'highlight' ? linkedItem.text : linkedItem.text;
                                        const truncated = (linkPreview || '').length > 50 ? (linkPreview || '').substring(0, 50) + '...' : (linkPreview || '');
                                        const isCrossDoc = linkFilePath !== this.currentFilePath;
                                        const docLabel = isCrossDoc ? `<span class="linked-note-doc">📚 ${this.escapeHtml(linkFileName || 'unknown file')}</span>` : '';
                                        
                                        // Escape backslashes for JS string in onclick
                                        const safeLinkFilePath = (linkFilePath || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                                        
                                        return `
                                            <div class="linked-note-badge ${isCrossDoc ? 'cross-doc' : ''}" title="${isCrossDoc ? 'Cross-document link' : 'Same document link'}">
                                                <span class="linked-note-content" onclick="event.stopPropagation(); notesManager.navigateToLinkedNote('${linkId}', '${safeLinkFilePath}')">
                                                    ${linkedItem.type === 'highlight' ? '🖍️' : '📝'} ${this.escapeHtml(truncated)} <span class="linked-note-page">(Page ${linkedItem.page})</span>
                                                    ${docLabel}
                                                </span>
                                                <button class="linked-note-delete" onclick="event.stopPropagation(); notesManager.removeLink('${item.id}', '${linkId}', '${safeLinkFilePath}')" title="Remove link">×</button>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        // Render tag filter bar + notes
        const tagFilterHtml = this.renderTagFilterBar();
        this.notesContent.innerHTML = tagFilterHtml + html;
        
        document.dispatchEvent(new CustomEvent('notes-updated'));
        
        } catch (e) {
            console.error('Error in notesManager.render:', e);
        }
    }
    
    escapeHtml(text) {
        if (text == null) return ''; // Handle null or undefined
        const div = document.createElement('div');
        div.textContent = String(text); // Convert to string to be safe
        return div.innerHTML;
    }
    
    // ========== TAG MANAGEMENT ==========
    
    setupTagFilterListeners() {
        // Will be called after render to attach listeners to tag badges
    }
    
    collectAllTags() {
        this.allTags = new Set();
        [...this.notes, ...this.highlights].forEach(item => {
            if (item.tags && Array.isArray(item.tags)) {
                item.tags.forEach(tag => {
                    const tagName = this.getTagName(tag);
                    this.allTags.add(tagName.toLowerCase());
                });
            }
        });
        return this.allTags;
    }
    
    collectAllTagsWithColors() {
        const tagsMap = new Map(); // Map<tagName, tagObject>
        [...this.notes, ...this.highlights].forEach(item => {
            if (item.tags && Array.isArray(item.tags)) {
                item.tags.forEach(tag => {
                    const tagName = this.getTagName(tag).toLowerCase();
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
    
    addTagToItem(itemId, tag, color = 'green') {
        const item = this.getItemById(itemId);
        if (!item) return false;
        
        const normalizedTag = tag.trim().toLowerCase();
        if (!normalizedTag) return false;
        
        if (!item.tags) item.tags = [];
        
        // Check if tag already exists (by name only)
        const existingTag = item.tags.find(t => {
            const tagName = typeof t === 'string' ? t : t.name;
            return tagName === normalizedTag;
        });
        
        if (existingTag) return false;
        
        // Store tag as object with name and color
        item.tags.push({ name: normalizedTag, color: color });
        this.saveToStorage();
        this.render();
        return true;
    }
    
    removeTagFromItem(itemId, tag) {
        const item = this.getItemById(itemId);
        if (!item || !item.tags) return false;
        
        const normalizedTag = tag.toLowerCase();
        const index = item.tags.findIndex(t => {
            const tagName = typeof t === 'string' ? t : t.name;
            return tagName === normalizedTag;
        });
        
        if (index > -1) {
            item.tags.splice(index, 1);
            this.saveToStorage();
            this.render();
            return true;
        }
        return false;
    }
    
    getTagName(tag) {
        return typeof tag === 'string' ? tag : tag.name;
    }
    
    getTagColor(tag) {
        return typeof tag === 'string' ? 'green' : (tag.color || 'green');
    }
    
    showAddTagDialog(itemId) {
        // Close any existing dialogs first
        const existingDialogs = document.querySelectorAll('.note-dialog-overlay');
        existingDialogs.forEach(d => d.remove());
        
        const item = this.getItemById(itemId);
        if (!item) return;
        
        // Collect existing tags for suggestions
        const existingTags = item.tags || [];
        const existingTagNames = existingTags.map(t => this.getTagName(t).toLowerCase());
        const allTagsWithColors = this.collectAllTagsWithColors();
        const suggestedTags = allTagsWithColors.filter(t => !existingTagNames.includes(t.name));
        
        // Create dialog
        const dialog = document.createElement('div');
        dialog.className = 'note-dialog-overlay';
        dialog.innerHTML = `
            <div class="note-dialog" style="max-width: 450px;">
                <div class="note-dialog-header">
                    <h3>🏷️ Add Tags</h3>
                    <button class="note-dialog-close" onclick="this.closest('.note-dialog-overlay').remove()">×</button>
                </div>
                <div class="note-dialog-body">
                    <div class="tag-input-container">
                        <input type="text" id="tagInput" class="tag-input" placeholder="Type a tag name..." autocomplete="off">
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
                        <button id="saveTagBtn" class="btn-primary" style="margin-top: 10px; width: 100%;">💾 Save Tag</button>
                    </div>
                    ${existingTags.length > 0 ? `
                        <div class="current-tags-section">
                            <label>Current tags:</label>
                            <div class="current-tags-list">
                                ${existingTags.map(tag => {
                                    const tagName = this.getTagName(tag);
                                    const tagColor = this.getTagColor(tag);
                                    return `
                                        <span class="tag-badge tag-${tagColor}" data-tag="${this.escapeHtml(tagName)}">
                                            ${this.escapeHtml(tagName)}
                                            <button class="tag-remove-btn" onclick="notesManager.removeTagFromItem('${itemId}', '${this.escapeHtml(tagName)}'); this.closest('.tag-badge').remove();">×</button>
                                        </span>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    ` : ''}
                    ${suggestedTags.length > 0 ? `
                        <div class="suggested-tags-section">
                            <label>Suggested tags (click to add):</label>
                            <div class="suggested-tags-list">
                                ${suggestedTags.slice(0, 10).map(tag => `
                                    <span class="tag-badge tag-${tag.color} suggested" onclick="notesManager.addTagFromSuggestion('${itemId}', '${this.escapeHtml(tag.name)}', this, '${tag.color}')">${this.escapeHtml(tag.name)}</span>
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
        
        // Focus input
        const input = dialog.querySelector('#tagInput');
        input.focus();
        
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
                if (this.addTagToItem(itemId, tag, selectedColor)) {
                    // Add tag badge to current tags section
                    let currentTagsList = dialog.querySelector('.current-tags-list');
                    if (!currentTagsList) {
                        // Create section if it doesn't exist
                        const section = document.createElement('div');
                        section.className = 'current-tags-section';
                        section.innerHTML = `<label>Current tags:</label><div class="current-tags-list"></div>`;
                        dialog.querySelector('.tag-input-container').after(section);
                        currentTagsList = section.querySelector('.current-tags-list');
                    }
                    
                    const badge = document.createElement('span');
                    badge.className = `tag-badge tag-${selectedColor}`;
                    badge.dataset.tag = tag.toLowerCase();
                    badge.innerHTML = `${this.escapeHtml(tag.toLowerCase())} <button class="tag-remove-btn" onclick="notesManager.removeTagFromItem('${itemId}', '${this.escapeHtml(tag.toLowerCase())}'); this.closest('.tag-badge').remove();">×</button>`;
                    currentTagsList.appendChild(badge);
                    
                    // Remove from suggestions if present
                    const suggestedBadge = dialog.querySelector(`.suggested-tags-list .tag-badge[onclick*="'${tag.toLowerCase()}'"]`);
                    if (suggestedBadge) suggestedBadge.remove();
                    
                    input.value = '';
                    selectedColor = 'green'; // Reset to default
                    colorOptions.forEach(b => {
                        b.classList.remove('selected');
                        b.textContent = '';
                    });
                    colorOptions[0].classList.add('selected');
                    colorOptions[0].textContent = '✓';
                }
            }
        };
        
        // Save button click
        const saveBtn = dialog.querySelector('#saveTagBtn');
        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            saveTag();
        });
        
        // Enter key to save tag
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveTag();
            }
        });
    }
    
    addTagFromSuggestion(itemId, tag, element, color = 'green') {
        if (this.addTagToItem(itemId, tag, color)) {
            // Remove from suggestions
            element.remove();
            
            // Find dialog and add to current tags
            const dialog = document.querySelector('.note-dialog-overlay');
            if (dialog) {
                let currentTagsList = dialog.querySelector('.current-tags-list');
                if (!currentTagsList) {
                    const section = document.createElement('div');
                    section.className = 'current-tags-section';
                    section.innerHTML = `<label>Current tags:</label><div class="current-tags-list"></div>`;
                    dialog.querySelector('.tag-input-container').after(section);
                    currentTagsList = section.querySelector('.current-tags-list');
                }
                
                const badge = document.createElement('span');
                badge.className = `tag-badge tag-${color}`;
                badge.dataset.tag = tag;
                badge.innerHTML = `${this.escapeHtml(tag)} <button class="tag-remove-btn" onclick="notesManager.removeTagFromItem('${itemId}', '${this.escapeHtml(tag)}'); this.closest('.tag-badge').remove();">×</button>`;
                currentTagsList.appendChild(badge);
            }
        }
    }
    
    setTagFilter(tag) {
        if (this.activeTagFilter === tag) {
            // Clicking same tag clears filter
            this.activeTagFilter = null;
        } else {
            this.activeTagFilter = tag ? tag.toLowerCase() : null;
        }
        this.render();
    }
    
    renderTagFilterBar() {
        this.collectAllTags();
        
        if (this.allTags.size === 0) return '';
        
        const tagsArray = [...this.allTags].sort();
        
        return `
            <div class="tag-filter-bar">
                <span class="tag-filter-label">🏷️ Filter by tag:</span>
                <div class="tag-filter-list">
                    ${tagsArray.map(tag => `
                        <span class="tag-filter-badge ${this.activeTagFilter === tag ? 'active' : ''}" 
                              onclick="notesManager.setTagFilter('${this.escapeHtml(tag)}')"
                              data-tag="${this.escapeHtml(tag)}">
                            ${this.escapeHtml(tag)}
                        </span>
                    `).join('')}
                    ${this.activeTagFilter ? `
                        <span class="tag-filter-clear" onclick="notesManager.setTagFilter(null)">✕ Clear</span>
                    ` : ''}
                </div>
            </div>
        `;
    }
}

// Initialize Notes Manager
const notesManager = new NotesManager();

// Expose to window for mobile compatibility
if (typeof window !== 'undefined') {
    window.notesManager = notesManager;
}
