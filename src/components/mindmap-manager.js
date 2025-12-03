class MindmapManager {
    constructor(notesManager) {
        this.notesManager = notesManager;
        this.container = null;
        this.canvas = null;
        this.ctx = null;
        
        // State
        this.nodes = [];
        this.connections = [];
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
        this.isDragging = false;
        this.isPanning = false;
        this.draggedNode = null;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Link dragging state
        this.isLinkDragging = false;
        this.linkDragSource = null;
        this.linkDragX = 0;
        this.linkDragY = 0;
        this.hoveredConnection = null;
        this.selectedConnection = null; // Connection with open context menu
        
        // Constants
        this.NODE_WIDTH = 200;
        this.NODE_PADDING = 15;
        this.HEADER_HEIGHT = 30;
        this.FONT_SIZE = 14;
        this.LINE_HEIGHT = 20;
        
        // Bind methods
        this.render = this.render.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleWheel = this.handleWheel.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleContextMenu = this.handleContextMenu.bind(this);
    }

    initialize(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'mindmap-canvas';
        this.container.innerHTML = '';
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        // Create context menu
        this.createContextMenu();

        // Setup events
        this.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        this.canvas.addEventListener('contextmenu', this.handleContextMenu);
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mouseup', this.handleMouseUp);
        this.canvas.addEventListener('wheel', this.handleWheel);
        window.addEventListener('resize', this.handleResize);

        // Watch for container size changes (when panels are toggled)
        this.resizeObserver = new ResizeObserver(() => {
            this.handleResize();
        });
        this.resizeObserver.observe(this.container);

        // Initial resize
        this.handleResize();
        
        // Load data
        this.refreshData();
    }

    createContextMenu() {
        this.contextMenu = document.createElement('div');
        this.contextMenu.className = 'context-menu hidden';
        document.body.appendChild(this.contextMenu);
        
        // Prevent context menu from triggering canvas interactions
        this.contextMenu.addEventListener('mousedown', (e) => {
            e.stopPropagation();
        });
        
        this.contextMenu.addEventListener('mouseup', (e) => {
            e.stopPropagation();
        });
        
        // Close context menu on click elsewhere
        document.addEventListener('click', (e) => {
            if (!this.contextMenu.contains(e.target)) {
                this.contextMenu.classList.add('hidden');
                // Clear selected connection when menu closes
                if (this.selectedConnection) {
                    this.selectedConnection = null;
                    this.render();
                }
            }
        });
    }

    refreshData() {
        if (!this.notesManager) {
            console.error('MindmapManager: No notesManager instance found');
            return;
        }

        const allItems = [...this.notesManager.notes, ...this.notesManager.highlights];
        console.log(`MindmapManager: Refreshing data. Found ${allItems.length} items (${this.notesManager.notes.length} notes, ${this.notesManager.highlights.length} highlights)`);
        
        if (allItems.length === 0) {
            // If no items, maybe try to reload from storage directly as fallback?
            // Or just render empty
        }
        
        // Load saved layout
        const savedLayout = this.loadLayout();
        const layoutMap = new Map(Array.isArray(savedLayout) ? savedLayout.map(n => [n.id, n]) : []);
        
        // Reuse existing positions if available, or create new nodes
        const existingNodesMap = new Map(this.nodes.map(n => [n.id, n]));
        
        // Collect all external document references and load their highlights
        const documentRefs = new Map(); // Map<filePath, {fileName, linkedFrom: [noteIds]}>
        const potentialExternalHighlights = new Map(); // Map<uniqueId, highlightData>
        
        allItems.forEach(item => {
            if (item.links && Array.isArray(item.links)) {
                item.links.forEach(link => {
                    // Check if this is an external document link (has filePath)
                    if (typeof link === 'object' && link.filePath && link.fileName) {
                        const docId = `doc-ref-${link.filePath}`;
                        if (!documentRefs.has(docId)) {
                            documentRefs.set(docId, {
                                id: docId,
                                fileName: link.fileName,
                                filePath: link.filePath,
                                linkedFrom: []
                            });
                            
                            // Load highlights from this external document
                            const externalData = this.notesManager.getNotesForFile(link.filePath);
                            if (externalData && externalData.highlights) {
                                externalData.highlights.forEach(highlight => {
                                    // Create a unique ID for the external highlight
                                    const extHighlightId = `ext-${link.filePath}-${highlight.id}`;
                                    
                                    potentialExternalHighlights.set(extHighlightId, {
                                        id: extHighlightId,
                                        type: 'external-highlight',
                                        text: highlight.text,
                                        comment: highlight.comment,
                                        color: highlight.color || 'blue',
                                        sourceFile: link.filePath,
                                        sourceFileName: link.fileName,
                                        originalId: highlight.id,
                                        linkedFrom: [] // Will be populated below
                                    });
                                });
                            }
                        }
                        documentRefs.get(docId).linkedFrom.push(item.id);
                    }
                });
            }
        });
        
        // Identify which external highlights are actually linked
        const usedExternalHighlightIds = new Set();
        allItems.forEach(item => {
            if (item.links && Array.isArray(item.links)) {
                item.links.forEach(link => {
                    if (typeof link === 'object' && link.filePath && link.id) {
                        // Construct expected ID
                        const extId = `ext-${link.filePath}-${link.id}`;
                        if (potentialExternalHighlights.has(extId)) {
                            usedExternalHighlightIds.add(extId);
                            // Add linkage info
                            const extHighlight = potentialExternalHighlights.get(extId);
                            extHighlight.linkedFrom.push(item.id);
                        }
                    }
                });
            }
        });

        // Only use the external highlights that are actually linked
        const externalHighlights = Array.from(usedExternalHighlightIds).map(id => potentialExternalHighlights.get(id));
        
        // Create nodes for notes/highlights
        this.nodes = allItems.map((item, index) => {
            const existing = existingNodesMap.get(item.id) || layoutMap.get(item.id);
            
            // Calculate height based on text content
            let estimatedLines = 0;
            const charsPerLine = 22; // Approximate characters per line (more conservative)
            
            if (item.type === 'highlight') {
                const highlightedText = item.text || '';
                const comment = item.comment || '';
                
                // Highlighted text (max 3 lines, smaller font)
                const highlightLines = Math.min(Math.ceil(highlightedText.length / charsPerLine), 3);
                estimatedLines += highlightLines;
                
                // If there's a comment, add separator space + comment lines
                if (comment) {
                    estimatedLines += 1; // Separator space
                    const commentLines = Math.ceil(comment.length / charsPerLine);
                    estimatedLines += Math.min(commentLines, 10); // Max 10 lines for comment
                }
            } else {
                // Regular note
                const text = item.text || item.note || '';
                const noteLines = Math.ceil(text.length / charsPerLine);
                estimatedLines = Math.min(noteLines, 10); // Max 10 lines for notes
            }
            
            const height = this.HEADER_HEIGHT + (estimatedLines * this.LINE_HEIGHT) + (this.NODE_PADDING * 3);
            
            // Basic grid layout for new nodes
            const col = index % 5;
            const row = Math.floor(index / 5);
            
            return {
                id: item.id,
                data: item,
                x: existing ? existing.x : 100 + (col * (this.NODE_WIDTH + 50)),
                y: existing ? existing.y : 100 + (row * 200),
                width: this.NODE_WIDTH,
                height: Math.max(height, 120),
                color: item.color || 'yellow',
                isSelected: false
            };
        });

        // Add external highlight nodes
        let extHighlightIndex = 0;
        externalHighlights.forEach(extHighlight => {
            const existing = existingNodesMap.get(extHighlight.id) || layoutMap.get(extHighlight.id);
            
            // Calculate height for external highlight
            let estimatedLines = 0;
            const charsPerLine = 22;
            const highlightedText = extHighlight.text || '';
            const comment = extHighlight.comment || '';
            
            const highlightLines = Math.min(Math.ceil(highlightedText.length / charsPerLine), 3);
            estimatedLines += highlightLines;
            
            if (comment) {
                estimatedLines += 1;
                const commentLines = Math.ceil(comment.length / charsPerLine);
                estimatedLines += Math.min(commentLines, 10);
            }
            
            const height = this.HEADER_HEIGHT + (estimatedLines * this.LINE_HEIGHT) + (this.NODE_PADDING * 3);
            
            // Position external highlights in the middle area (between source notes and doc refs)
            const col = extHighlightIndex % 3;
            const row = Math.floor(extHighlightIndex / 3);
            
            this.nodes.push({
                id: extHighlight.id,
                data: extHighlight,
                x: existing ? existing.x : 500 + (col * (this.NODE_WIDTH + 30)),
                y: existing ? existing.y : 100 + (row * 180),
                width: this.NODE_WIDTH,
                height: Math.max(height, 120),
                color: extHighlight.color || 'blue',
                isSelected: false,
                isExternalHighlight: true
            });
            extHighlightIndex++;
        });

        // Add document reference nodes
        let docRefIndex = 0;
        documentRefs.forEach((docRef, docId) => {
            const existing = existingNodesMap.get(docId) || layoutMap.get(docId);
            
            // Position document refs to the right of the canvas
            const col = docRefIndex % 3;
            const row = Math.floor(docRefIndex / 3);
            
            this.nodes.push({
                id: docId,
                data: {
                    type: 'document-reference',
                    fileName: docRef.fileName,
                    filePath: docRef.filePath,
                    linkedFrom: docRef.linkedFrom
                },
                x: existing ? existing.x : 800 + (col * 250),
                y: existing ? existing.y : 100 + (row * 150),
                width: 220,
                height: 100,
                color: 'lightblue',
                isSelected: false,
                isDocumentRef: true
            });
            docRefIndex++;
        });

        // Build connections
        this.connections = [];
        
        // 1. Connect source notes to external highlights and document refs
        this.nodes.forEach(sourceNode => {
            if (sourceNode.data.links) {
                console.log(`Node ${sourceNode.id} has ${sourceNode.data.links.length} links:`, sourceNode.data.links);
                sourceNode.data.links.forEach(link => {
                    const linkId = typeof link === 'string' ? link : link.id;
                    
                    // Check if it's a document reference
                    if (typeof link === 'object' && link.filePath) {
                        // Try to find specific external highlight matching this link ID
                        const specificExternalHighlight = this.nodes.find(n => 
                            n.isExternalHighlight && 
                            n.data.sourceFile === link.filePath && 
                            n.data.originalId === link.id
                        );

                        if (specificExternalHighlight) {
                             // Match found! Connect to specific external highlight
                             console.log(`Creating connection to specific external highlight: ${sourceNode.id} -> ${specificExternalHighlight.id}`);
                             this.connections.push({
                                 source: sourceNode,
                                 target: specificExternalHighlight,
                                 isDocumentLink: true,
                                 linkId: link.id // Store original link ID for deletion
                             });
                        } else {
                            // No specific highlight found, check for generic document connection
                            // This happens if the link points to a file but not a specific loaded highlight, or if highlights are missing
                            const docRefId = `doc-ref-${link.filePath}`;
                            const targetNode = this.nodes.find(n => n.id === docRefId);
                            
                            if (targetNode) {
                                console.log(`Creating connection to document: ${sourceNode.id} -> ${targetNode.id}`);
                                this.connections.push({
                                    source: sourceNode,
                                    target: targetNode,
                                    isDocumentLink: true,
                                    linkId: link.id // Store original link ID for deletion
                                });
                            }
                        }
                    } else {
                        // Regular note-to-note link
                        const targetNode = this.nodes.find(n => n.id === linkId);
                        if (targetNode) {
                            console.log(`Creating connection: ${sourceNode.id} -> ${targetNode.id}`);
                            this.connections.push({
                                source: sourceNode,
                                target: targetNode,
                                linkId: linkId
                            });
                        } else {
                            console.log(`Target node not found for link: ${linkId}`);
                        }
                    }
                });
            }
        });
        
        // 2. Connect external highlights to their document references
        this.nodes.forEach(extHighlightNode => {
            if (extHighlightNode.isExternalHighlight) {
                const docRefId = `doc-ref-${extHighlightNode.data.sourceFile}`;
                const docRefNode = this.nodes.find(n => n.id === docRefId);
                if (docRefNode) {
                    console.log(`Creating connection from external highlight to document: ${extHighlightNode.id} -> ${docRefNode.id}`);
                    this.connections.push({
                        source: extHighlightNode,
                        target: docRefNode,
                        isDocumentLink: true
                    });
                }
            }
        });

        console.log(`Total connections built: ${this.connections.length}`);
        this.render();
    }

    saveLayout() {
        if (!this.notesManager || !this.notesManager.currentFilePath) return;
        const layout = this.nodes.map(n => ({ id: n.id, x: n.x, y: n.y }));
        // Use file-specific key to prevent layout sharing between documents
        const key = `mindmap_layout_${this.notesManager.currentFilePath}`;
        console.log(`Saving mindmap layout to key: ${key}`);
        localStorage.setItem(key, JSON.stringify(layout));
    }

    loadLayout() {
        if (!this.notesManager || !this.notesManager.currentFilePath) return [];
        try {
            // Try loading file-specific layout
            const key = `mindmap_layout_${this.notesManager.currentFilePath}`;
            console.log(`Loading mindmap layout from key: ${key}`);
            let stored = localStorage.getItem(key);
            
            // Fallback to legacy global layout ONLY if no specific layout exists
            if (!stored) {
                console.log('No specific layout found, falling back to global layout.');
                stored = localStorage.getItem('mindmap_layout');
            }
            
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading mindmap layout:', e);
            return [];
        }
    }

    handleResize() {
        if (!this.container || !this.canvas) return;
        
        // Get the actual display size
        const displayWidth = this.container.clientWidth;
        const displayHeight = this.container.clientHeight;
        
        // Get device pixel ratio for crisp rendering on high-DPI displays
        const dpr = window.devicePixelRatio || 1;
        
        // Set the canvas internal size (accounting for device pixel ratio)
        this.canvas.width = displayWidth * dpr;
        this.canvas.height = displayHeight * dpr;
        
        // Set the canvas display size
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';
        
        // Scale the context to account for device pixel ratio
        this.ctx.scale(dpr, dpr);
        
        this.render();
    }

    // Coordinate conversion
    screenToWorld(x, y) {
        return {
            x: (x - this.offsetX) / this.scale,
            y: (y - this.offsetY) / this.scale
        };
    }

    worldToScreen(x, y) {
        return {
            x: (x * this.scale) + this.offsetX,
            y: (y * this.scale) + this.offsetY
        };
    }

    // Interaction Handlers
    handleMouseDown(e) {
        // Don't process canvas clicks if context menu is open
        if (this.contextMenu && !this.contextMenu.classList.contains('hidden')) {
            return;
        }
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldPos = this.screenToWorld(mouseX, mouseY);

        this.lastMouseX = mouseX;
        this.lastMouseY = mouseY;

        // Check if clicking a node (reverse order to check top nodes first)
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            const node = this.nodes[i];
            if (worldPos.x >= node.x && worldPos.x <= node.x + node.width &&
                worldPos.y >= node.y && worldPos.y <= node.y + node.height) {
                
                if (e.button === 0) { // Left click
                    // Check if clicking on link handle (small circle on right edge)
                    const handleX = node.x + node.width - 10;
                    const handleY = node.y + node.height / 2;
                    const handleRadius = 8;
                    const distToHandle = Math.sqrt(Math.pow(worldPos.x - handleX, 2) + Math.pow(worldPos.y - handleY, 2));
                    
                    if (distToHandle <= handleRadius) {
                        // Start link dragging
                        this.isLinkDragging = true;
                        this.linkDragSource = node;
                        this.linkDragX = worldPos.x;
                        this.linkDragY = worldPos.y;
                        this.canvas.style.cursor = 'crosshair';
                        return;
                    }
                    
                    // Otherwise, drag the node
                    this.isDragging = true;
                    this.draggedNode = node;
                    // Bring to front
                    this.nodes.splice(i, 1);
                    this.nodes.push(node);
                    this.render();
                    return;
                }
            }
        }

        // If background clicked
        if (e.button === 0 || e.button === 1 || e.button === 2) {
            this.isPanning = true;
            this.canvas.style.cursor = 'grabbing';
        }
    }

    handleMouseMove(e) {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldPos = this.screenToWorld(mouseX, mouseY);

        if (this.isLinkDragging) {
            // Update link drag position
            this.linkDragX = worldPos.x;
            this.linkDragY = worldPos.y;
            
            // Check if hovering over a node
            let hoverNode = null;
            for (let i = this.nodes.length - 1; i >= 0; i--) {
                const node = this.nodes[i];
                if (node !== this.linkDragSource &&
                    worldPos.x >= node.x && worldPos.x <= node.x + node.width &&
                    worldPos.y >= node.y && worldPos.y <= node.y + node.height) {
                    hoverNode = node;
                    break;
                }
            }
            
            this.linkDragTarget = hoverNode;
            
            // Check if this would remove an existing link
            if (hoverNode) {
                const sourceItem = this.notesManager.getItemById(this.linkDragSource.id);
                this.linkWillRemove = sourceItem?.links?.some(link => 
                    (typeof link === 'string' ? link === hoverNode.id : link.id === hoverNode.id)
                );
            } else {
                this.linkWillRemove = false;
            }
            
            this.render();
        } else if (this.isDragging && this.draggedNode) {
            const dx = (mouseX - this.lastMouseX) / this.scale;
            const dy = (mouseY - this.lastMouseY) / this.scale;
            
            this.draggedNode.x += dx;
            this.draggedNode.y += dy;
            
            this.render();
        } else if (this.isPanning) {
            const dx = mouseX - this.lastMouseX;
            const dy = mouseY - this.lastMouseY;
            
            this.offsetX += dx;
            this.offsetY += dy;
            
            this.render();
        } else {
            // Check if hovering over a connection
            const hoveredConnection = this.getConnectionAtPoint(worldPos.x, worldPos.y);
            if (hoveredConnection !== this.hoveredConnection) {
                this.hoveredConnection = hoveredConnection;
                this.canvas.style.cursor = hoveredConnection ? 'pointer' : 'default';
                this.render();
            }
        }

        this.lastMouseX = mouseX;
        this.lastMouseY = mouseY;
    }

    handleMouseUp(e) {
        if (this.isLinkDragging) {
            console.log('Link drag ended. Source:', this.linkDragSource?.id, 'Target:', this.linkDragTarget?.id);
            
            // Check if released over a valid target node
            if (this.linkDragTarget && this.linkDragSource) {
                console.log('Toggling link between', this.linkDragSource.id, 'and', this.linkDragTarget.id);
                
                // Check if link already exists
                const sourceItem = this.notesManager.getItemById(this.linkDragSource.id);
                const linkExists = sourceItem?.links?.some(link => 
                    (typeof link === 'string' ? link === this.linkDragTarget.id : link.id === this.linkDragTarget.id)
                );
                
                // Toggle the link (create or remove)
                this.notesManager.toggleLink(
                    this.linkDragSource.id,
                    this.linkDragTarget.id,
                    this.linkDragTarget.data.filePath
                );
                
                // Show feedback
                if (linkExists) {
                    console.log('✓ Link removed');
                } else {
                    console.log('✓ Link created');
                }
                
                this.notesManager.render();
                
                // Small delay to ensure notesManager has updated
                setTimeout(() => {
                    this.refreshData();
                }, 100);
            } else {
                console.log('No valid target found');
            }
            
            // Reset link dragging state
            this.isLinkDragging = false;
            this.linkDragSource = null;
            this.linkDragTarget = null;
            this.canvas.style.cursor = 'default';
            this.render();
            return;
        }
        
        if (this.isDragging) {
            this.saveLayout();
        }
        this.isDragging = false;
        this.draggedNode = null;
        this.isPanning = false;
        this.canvas.style.cursor = 'default';
    }

    handleDoubleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldPos = this.screenToWorld(mouseX, mouseY);

        // Check if double-clicking a node
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            const node = this.nodes[i];
            if (worldPos.x >= node.x && worldPos.x <= node.x + node.width &&
                worldPos.y >= node.y && worldPos.y <= node.y + node.height) {
                
                // If it's a document reference node, open the document
                if (node.isDocumentRef && node.data.type === 'document-reference') {
                    this.openDocumentReference(node);
                } else {
                    this.editNode(node);
                }
                return;
            }
        }
    }
    
    openDocumentReference(node) {
        if (!node.data.filePath) {
            console.error('Document reference has no file path');
            return;
        }
        
        // Open the referenced document
        if (typeof window.openFileFromPath === 'function') {
            console.log(`Opening document from mindmap: ${node.data.filePath}`);
            window.openFileFromPath(node.data.filePath, null, null);
        } else {
            alert('Cannot open document: openFileFromPath function not available');
        }
    }

    handleWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Zoom towards mouse
        const worldBefore = this.screenToWorld(mouseX, mouseY);
        
        const zoomIntensity = 0.1;
        if (e.deltaY < 0) {
            this.scale *= (1 + zoomIntensity);
        } else {
            this.scale *= (1 - zoomIntensity);
        }
        
        // Clamp scale
        this.scale = Math.min(Math.max(0.1, this.scale), 5);
        
        // Adjust offset to keep mouse point stable
        const worldAfter = this.screenToWorld(mouseX, mouseY);
        this.offsetX += (worldAfter.x - worldBefore.x) * this.scale;
        this.offsetY += (worldAfter.y - worldBefore.y) * this.scale;
        
        this.render();
    }

    // Rendering
    render() {
        if (!this.ctx) return;
        
        // console.log('MindmapManager: Rendering', this.nodes.length, 'nodes');

        // Clear background
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.drawGrid();

        this.ctx.save();
        // Apply transform
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);

        // Draw connections
        this.connections.forEach(conn => {
            const isHovered = this.hoveredConnection === conn || this.selectedConnection === conn;
            
            // Different styling for document links
            if (conn.isDocumentLink) {
                this.ctx.strokeStyle = isHovered ? '#1976d2' : '#64b5f6';
                this.ctx.lineWidth = isHovered ? 3 : 2;
                this.ctx.setLineDash([8, 4]); // Dashed line for document links
            } else {
                this.ctx.strokeStyle = isHovered ? '#2196F3' : '#ccc';
                this.ctx.lineWidth = isHovered ? 3 : 2;
                this.ctx.setLineDash([]); // Solid line for regular links
            }
            
            this.drawBezierCurve(conn.source, conn.target, isHovered);
        });

        // Draw temporary link arrow if dragging
        if (this.isLinkDragging && this.linkDragSource) {
            // Color: Red if removing, Green if creating, Gray if no target
            let color = '#999';
            if (this.linkDragTarget) {
                color = this.linkWillRemove ? '#f44336' : '#4CAF50';
            }
            
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            
            const handleX = this.linkDragSource.x + this.linkDragSource.width - 10;
            const handleY = this.linkDragSource.y + this.linkDragSource.height / 2;
            
            this.ctx.beginPath();
            this.ctx.moveTo(handleX, handleY);
            this.ctx.lineTo(this.linkDragX, this.linkDragY);
            this.ctx.stroke();
            
            // Draw arrow at cursor
            const dx = this.linkDragX - handleX;
            const dy = this.linkDragY - handleY;
            const angle = Math.atan2(dy, dx);
            this.drawArrow(this.linkDragX, this.linkDragY, angle);
            
            this.ctx.setLineDash([]);
        }

        // Draw nodes
        this.nodes.forEach(node => {
            this.drawNode(node);
        });
        
        // Draw link handles on nodes
        this.nodes.forEach(node => {
            this.drawLinkHandle(node);
        });

        this.ctx.restore();
    }

    drawGrid() {
        const gridSize = 50 * this.scale;
        const offsetX = this.offsetX % gridSize;
        const offsetY = this.offsetY % gridSize;

        this.ctx.beginPath();
        this.ctx.strokeStyle = '#f0f0f0';
        this.ctx.lineWidth = 1;

        for (let x = offsetX; x < this.canvas.width; x += gridSize) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
        }
        for (let y = offsetY; y < this.canvas.height; y += gridSize) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
        }
        this.ctx.stroke();
    }

    drawBezierCurve(source, target, isHovered = false) {
        // Calculate attachment points
        const { start, end, dir } = this.getConnectionPoints(source, target);

        // Calculate control points for smooth curve
        let cp1, cp2;
        const curvature = 0.5;
        const dist = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        const offset = Math.min(dist * curvature, 100); // Cap offset

        if (dir === 'horizontal') {
            cp1 = { x: start.x + (start.x < end.x ? offset : -offset), y: start.y };
            cp2 = { x: end.x + (start.x < end.x ? -offset : offset), y: end.y };
        } else {
            cp1 = { x: start.x, y: start.y + (start.y < end.y ? offset : -offset) };
            cp2 = { x: end.x, y: end.y + (start.y < end.y ? -offset : offset) };
        }
        
        // Draw line
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y);
        this.ctx.stroke();

        // Draw arrow at end
        // Calculate angle at the very end of the bezier curve
        // Derivative of cubic bezier at t=1 is 3*(P3-P2)
        const dx = end.x - cp2.x;
        const dy = end.y - cp2.y;
        const angle = Math.atan2(dy, dx);
        
        this.drawArrow(end.x, end.y, angle);
    }

    getConnectionPoints(source, target) {
        const sourceCenter = { x: source.x + source.width / 2, y: source.y + source.height / 2 };
        const targetCenter = { x: target.x + target.width / 2, y: target.y + target.height / 2 };
        
        const dx = targetCenter.x - sourceCenter.x;
        const dy = targetCenter.y - sourceCenter.y;
        
        // Determine dominant direction based on overlap
        // If mostly aligned horizontally, use vertical connections
        // If mostly aligned vertically, use horizontal connections
        
        const overlapX = Math.max(0, Math.min(source.x + source.width, target.x + target.width) - Math.max(source.x, target.x));
        const overlapY = Math.max(0, Math.min(source.y + source.height, target.y + target.height) - Math.max(source.y, target.y));
        
        let start, end, dir;

        if (overlapY > 0 || Math.abs(dx) > Math.abs(dy)) {
            // Horizontal connection
            dir = 'horizontal';
            if (dx > 0) { // Target is right
                start = { x: source.x + source.width, y: sourceCenter.y };
                end = { x: target.x, y: targetCenter.y };
            } else { // Target is left
                start = { x: source.x, y: sourceCenter.y };
                end = { x: target.x + target.width, y: targetCenter.y };
            }
        } else {
            // Vertical connection
            dir = 'vertical';
            if (dy > 0) { // Target is below
                start = { x: sourceCenter.x, y: source.y + source.height };
                end = { x: targetCenter.x, y: target.y };
            } else { // Target is above
                start = { x: sourceCenter.x, y: source.y };
                end = { x: targetCenter.x, y: target.y + target.height };
            }
        }
        return { start, end, dir };
    }

    drawArrow(x, y, angle) {
        const headLength = 12;
        const headWidth = 10;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);
        
        this.ctx.fillStyle = '#999'; // Darker arrow
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(-headLength, headWidth / 2);
        this.ctx.lineTo(-headLength, -headWidth / 2);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawExternalHighlightNode(node) {
        const x = node.x;
        const y = node.y;
        const w = node.width;
        const h = node.height;
        const radius = 8;
        
        // Shadow with a teal tint
        this.ctx.shadowColor = 'rgba(0, 150, 136, 0.3)';
        this.ctx.shadowBlur = 12;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        // Background with subtle gradient
        const gradient = this.ctx.createLinearGradient(x, y, x, y + h);
        gradient.addColorStop(0, '#e0f2f1');
        gradient.addColorStop(1, '#ffffff');
        this.ctx.fillStyle = gradient;
        this.drawRoundedRect(x, y, w, h, radius);
        this.ctx.fill();
        
        // Remove shadow for content
        this.ctx.shadowColor = 'transparent';
        
        // Teal border (thicker to distinguish)
        this.ctx.strokeStyle = '#00897b';
        this.ctx.lineWidth = 2;
        this.drawRoundedRect(x, y, w, h, radius);
        this.ctx.stroke();
        
        // Color strip on left (same as regular highlights)
        const colors = {
            'yellow': '#ffd54f',
            'green': '#81c784',
            'blue': '#64b5f6',
            'pink': '#f06292',
            'purple': '#ba68c8',
            'orange': '#ffb74d'
        };
        this.ctx.fillStyle = colors[node.color] || colors['blue'];
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + 5, y);
        this.ctx.lineTo(x + 5, y + h);
        this.ctx.lineTo(x + radius, y + h);
        this.ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.fill();
        
        // Header with external indicator
        this.ctx.fillStyle = '#00695c';
        this.ctx.font = `bold ${this.FONT_SIZE}px Arial`;
        this.ctx.fillText('📎 External Highlight', x + 15, y + 20);
        
        // Source file name (smaller, on right)
        this.ctx.fillStyle = '#00897b';
        this.ctx.font = '9px Arial';
        const sourceFileName = node.data.sourceFileName || 'Unknown';
        const maxFileNameWidth = 80;
        const fileNameText = this.truncateText(sourceFileName, maxFileNameWidth);
        this.ctx.fillText(fileNameText, x + w - maxFileNameWidth - 5, y + 20);
        
        // Divider
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + 30);
        this.ctx.lineTo(x + w, y + 30);
        this.ctx.strokeStyle = '#b2dfdb';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // Body Text
        let currentY = y + 50;
        const comment = node.data.comment || '';
        const highlightedText = node.data.text || '';
        
        // Always show the highlighted text first (in italic, lighter color)
        this.ctx.fillStyle = '#00695c';
        this.ctx.font = `italic ${this.FONT_SIZE - 1}px Arial`;
        const highlightLines = this.wrapTextWithReturn(highlightedText, x + 15, currentY, w - 30, 16, 3);
        currentY += highlightLines * 16;
        
        // If there's a comment, show it below with a separator
        if (comment) {
            currentY += 8; // Spacing
            
            // Small separator line
            this.ctx.beginPath();
            this.ctx.moveTo(x + 15, currentY);
            this.ctx.lineTo(x + w - 15, currentY);
            this.ctx.strokeStyle = '#b2dfdb';
            this.ctx.stroke();
            
            currentY += 12;
            
            // Comment text
            this.ctx.fillStyle = '#333';
            this.ctx.font = `${this.FONT_SIZE}px Arial`;
            this.wrapTextWithReturn(comment, x + 15, currentY, w - 30, this.LINE_HEIGHT, 10);
        }
    }

    drawDocumentReferenceNode(node) {
        const x = node.x;
        const y = node.y;
        const w = node.width;
        const h = node.height;
        const radius = 8;
        
        // Shadow
        this.ctx.shadowColor = 'rgba(33, 150, 243, 0.2)';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        // Background with gradient
        const gradient = this.ctx.createLinearGradient(x, y, x, y + h);
        gradient.addColorStop(0, '#e3f2fd');
        gradient.addColorStop(1, '#bbdefb');
        this.ctx.fillStyle = gradient;
        this.drawRoundedRect(x, y, w, h, radius);
        this.ctx.fill();
        
        // Remove shadow for content
        this.ctx.shadowColor = 'transparent';
        
        // Border
        this.ctx.strokeStyle = '#2196f3';
        this.ctx.lineWidth = 2;
        this.drawRoundedRect(x, y, w, h, radius);
        this.ctx.stroke();
        
        // Document icon strip on left
        this.ctx.fillStyle = '#1976d2';
        this.ctx.fillRect(x, y + radius, 5, h - radius * 2);
        
        // Header
        this.ctx.fillStyle = '#1565c0';
        this.ctx.font = `bold ${this.FONT_SIZE}px Arial`;
        this.ctx.fillText('📄 Document', x + 15, y + 22);
        
        // Divider
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + 32);
        this.ctx.lineTo(x + w, y + 32);
        this.ctx.strokeStyle = '#2196f3';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        // File name
        this.ctx.fillStyle = '#0d47a1';
        this.ctx.font = `${this.FONT_SIZE}px Arial`;
        const fileName = node.data.fileName || 'Unknown';
        this.wrapTextWithReturn(fileName, x + 15, y + 50, w - 30, this.LINE_HEIGHT, 2);
        
        // Connection count
        const linkCount = node.data.linkedFrom ? node.data.linkedFrom.length : 0;
        this.ctx.fillStyle = '#666';
        this.ctx.font = '11px Arial';
        this.ctx.fillText(`🔗 ${linkCount} linked note${linkCount !== 1 ? 's' : ''}`, x + 15, y + h - 10);
        
        // Clickable indicator
        this.ctx.fillStyle = '#1976d2';
        this.ctx.font = 'bold 11px Arial';
        this.ctx.fillText('(double-click to open)', x + w - 130, y + h - 10);
    }

    drawNode(node) {
        const x = node.x;
        const y = node.y;
        const w = node.width;
        const h = node.height;
        const radius = 8;

        // Check if this is a document reference node
        if (node.isDocumentRef && node.data.type === 'document-reference') {
            this.drawDocumentReferenceNode(node);
            return;
        }
        
        // Check if this is an external highlight node
        if (node.isExternalHighlight && node.data.type === 'external-highlight') {
            this.drawExternalHighlightNode(node);
            return;
        }

        // Highlight if this is a valid link target
        const isLinkTarget = this.isLinkDragging && this.linkDragTarget === node;
        
        // Shadow (green for create, red for remove)
        let shadowColor = 'rgba(0, 0, 0, 0.1)';
        let bgColor = '#ffffff';
        
        if (isLinkTarget) {
            if (this.linkWillRemove) {
                shadowColor = 'rgba(244, 67, 54, 0.4)';
                bgColor = '#ffebee';
            } else {
                shadowColor = 'rgba(76, 175, 80, 0.4)';
                bgColor = '#e8f5e9';
            }
        }
        
        this.ctx.shadowColor = shadowColor;
        this.ctx.shadowBlur = isLinkTarget ? 20 : 10;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;

        // Background
        this.ctx.fillStyle = bgColor;
        this.drawRoundedRect(x, y, w, h, radius);
        this.ctx.fill();
        
        // Remove shadow for content
        this.ctx.shadowColor = 'transparent';

        // Color strip on left
        const colors = {
            'yellow': '#ffd54f',
            'green': '#81c784',
            'blue': '#64b5f6',
            'pink': '#f06292',
            'purple': '#ba68c8',
            'orange': '#ffb74d'
        };
        this.ctx.fillStyle = colors[node.color] || colors['yellow'];
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + 5, y);
        this.ctx.lineTo(x + 5, y + h);
        this.ctx.lineTo(x + radius, y + h);
        this.ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.fill();

        // Border
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        this.drawRoundedRect(x, y, w, h, radius);
        this.ctx.stroke();

        // Content
        this.ctx.fillStyle = '#333';
        this.ctx.font = `bold ${this.FONT_SIZE}px Arial`;
        
        // Title/Header
        const type = node.data.type === 'highlight' ? 'Highlight' : 'Note';
        this.ctx.fillText(type, x + 15, y + 20);
        
        // Date
        this.ctx.fillStyle = '#999';
        this.ctx.font = '10px Arial';
        const date = new Date(node.data.createdAt).toLocaleDateString();
        this.ctx.fillText(date, x + w - 60, y + 20);

        // Divider
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + 30);
        this.ctx.lineTo(x + w, y + 30);
        this.ctx.strokeStyle = '#f5f5f5';
        this.ctx.stroke();

        // Body Text
        const isHighlight = node.data.type === 'highlight';
        let currentY = y + 50;
        
        if (isHighlight) {
            const comment = node.data.comment || '';
            const highlightedText = node.data.text || '';
            
            // Always show the highlighted text first (in italic, lighter color)
            this.ctx.fillStyle = '#888';
            this.ctx.font = `italic ${this.FONT_SIZE - 1}px Arial`;
            const highlightLines = this.wrapTextWithReturn(highlightedText, x + 15, currentY, w - 30, 16, 3);
            currentY += highlightLines * 16;
            
            // If there's a comment, show it below with a separator
            if (comment) {
                // Add a small visual separator
                currentY += 8;
                this.ctx.strokeStyle = '#e0e0e0';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(x + 15, currentY);
                this.ctx.lineTo(x + w - 15, currentY);
                this.ctx.stroke();
                currentY += 12;
                
                // Show comment in regular style
                this.ctx.fillStyle = '#444';
                this.ctx.font = `${this.FONT_SIZE}px Arial`;
                this.wrapTextWithReturn(comment, x + 15, currentY, w - 30, 18, 10);
            }
        } else {
            // For notes, show the note text
            this.ctx.fillStyle = '#444';
            this.ctx.font = `${this.FONT_SIZE}px Arial`;
            const text = node.data.text || node.data.note || '';
            this.wrapTextWithReturn(text, x + 15, currentY, w - 30, 18, 10);
        }
    }

    drawRoundedRect(x, y, w, h, r) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.lineTo(x + w - r, y);
        this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        this.ctx.lineTo(x + w, y + h - r);
        this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.ctx.lineTo(x + r, y + h);
        this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        this.ctx.lineTo(x, y + r);
        this.ctx.quadraticCurveTo(x, y, x + r, y);
        this.ctx.closePath();
    }

    wrapText(text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let testLine = '';
        let lineCount = 0;
        const maxLines = 5; // Limit visible text

        for (let n = 0; n < words.length; n++) {
            testLine = line + words[n] + ' ';
            const metrics = this.ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
                this.ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
                lineCount++;
                if (lineCount >= maxLines) {
                    this.ctx.fillText('...', x, y);
                    return;
                }
            } else {
                line = testLine;
            }
        }
        this.ctx.fillText(line, x, y);
    }

    wrapTextWithReturn(text, x, y, maxWidth, lineHeight, maxLines = 5) {
        const words = text.split(' ');
        let line = '';
        let testLine = '';
        let lineCount = 0;

        for (let n = 0; n < words.length; n++) {
            testLine = line + words[n] + ' ';
            const metrics = this.ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth && n > 0) {
                this.ctx.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
                lineCount++;
                if (lineCount >= maxLines) {
                    this.ctx.fillText('...', x, y);
                    return lineCount + 1;
                }
            } else {
                line = testLine;
            }
        }
        this.ctx.fillText(line, x, y);
        return lineCount + 1;
    }

    truncateText(text, maxWidth) {
        const metrics = this.ctx.measureText(text);
        if (metrics.width <= maxWidth) {
            return text;
        }
        
        // Binary search for the right length
        let left = 0;
        let right = text.length;
        let result = '';
        
        while (left < right) {
            const mid = Math.floor((left + right + 1) / 2);
            const testText = text.substring(0, mid) + '...';
            const testMetrics = this.ctx.measureText(testText);
            
            if (testMetrics.width <= maxWidth) {
                result = testText;
                left = mid;
            } else {
                right = mid - 1;
            }
        }
        
        return result || text.substring(0, 3) + '...';
    }

    drawLinkHandle(node) {
        const handleX = node.x + node.width - 10;
        const handleY = node.y + node.height / 2;
        const handleRadius = 8;
        
        // Draw outer circle (background)
        this.ctx.fillStyle = '#fff';
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(handleX, handleY, handleRadius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Draw link icon (small arrow or plus)
        this.ctx.fillStyle = '#666';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('→', handleX, handleY);
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'alphabetic';
    }

    handleContextMenu(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldPos = this.screenToWorld(mouseX, mouseY);

        // Check if clicked on a node
        let clickedNode = null;
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            const node = this.nodes[i];
            if (worldPos.x >= node.x && worldPos.x <= node.x + node.width &&
                worldPos.y >= node.y && worldPos.y <= node.y + node.height) {
                clickedNode = node;
                break;
            }
        }

        // Check if clicked on a connection (if no node was clicked)
        if (!clickedNode) {
            const clickedConnection = this.getConnectionAtPoint(worldPos.x, worldPos.y);
            if (clickedConnection) {
                this.selectedConnection = clickedConnection;
                this.showConnectionContextMenu(clickedConnection, e.clientX, e.clientY);
                this.render();
                return;
            }
        }

        this.showContextMenu(e.clientX, e.clientY, clickedNode, worldPos);
    }

    showContextMenu(x, y, node, worldPos) {
        this.contextMenu.innerHTML = '';
        this.contextMenu.style.left = x + 'px';
        this.contextMenu.style.top = y + 'px';
        this.contextMenu.classList.remove('hidden');

        if (node) {
            // Check if it's a document reference or external highlight (read-only)
            if (node.isDocumentRef && node.data.type === 'document-reference') {
                // Document reference options (read-only)
                const header = document.createElement('div');
                header.className = 'context-menu-header';
                header.style.cssText = 'padding: 10px 12px; border-bottom: 1px solid #e0e0e0; font-size: 11px; color: #666; background: #f9f9f9;';
                header.innerHTML = `
                    <div style="margin-bottom: 4px; font-weight: 600;">📄 Document Reference</div>
                    <div style="font-size: 10px; color: #555;">${this.escapeHtml(node.data.fileName || 'Unknown')}</div>
                    <div style="font-size: 9px; color: #999; margin-top: 4px;">Read-only - cannot be edited</div>
                `;
                this.contextMenu.appendChild(header);
                
                this.addMenuItem('📂 Open Document', () => {
                    this.contextMenu.classList.add('hidden');
                    this.openDocumentReference(node);
                });
                
                this.addMenuItem('❌ Cancel', () => {
                    this.contextMenu.classList.add('hidden');
                });
            } else if (node.isExternalHighlight && node.data.type === 'external-highlight') {
                // External highlight options (read-only)
                const header = document.createElement('div');
                header.className = 'context-menu-header';
                header.style.cssText = 'padding: 10px 12px; border-bottom: 1px solid #e0e0e0; font-size: 11px; color: #666; background: #f9f9f9;';
                const displayText = (node.data.text || node.data.comment || 'External Highlight').substring(0, 30);
                header.innerHTML = `
                    <div style="margin-bottom: 4px; font-weight: 600;">📎 External Highlight</div>
                    <div style="font-size: 10px; color: #555;">"${this.escapeHtml(displayText)}${displayText.length >= 30 ? '...' : ''}"</div>
                    <div style="font-size: 9px; color: #999; margin-top: 4px;">From: ${this.escapeHtml(node.data.sourceFileName || 'Unknown')}</div>
                    <div style="font-size: 9px; color: #999; margin-top: 2px;">Read-only - cannot be edited</div>
                `;
                this.contextMenu.appendChild(header);
                
                this.addMenuItem('📂 Open Source Document', () => {
                    this.contextMenu.classList.add('hidden');
                    if (node.data.sourceFile && typeof window.openFileFromPath === 'function') {
                        window.openFileFromPath(node.data.sourceFile, null, null);
                    }
                });
                
                this.addMenuItem('❌ Cancel', () => {
                    this.contextMenu.classList.add('hidden');
                });
            } else {
                // Regular note/highlight options (editable)
                this.addMenuItem('✏️ Edit Note', () => this.editNode(node));
                this.addMenuItem('🎨 Change Color', () => this.showColorPicker(node));
                this.addMenuItem('🔗 Link to...', () => this.showLinkDialog(node));
                this.addMenuItem('🗑️ Delete Note', () => this.deleteNode(node), true);
            }
        } else {
            // Background options
            this.addMenuItem('📝 Add Note', () => this.addNote(worldPos.x, worldPos.y));
        }
    }

    showConnectionContextMenu(connection, x, y) {
        this.contextMenu.innerHTML = '';
        this.contextMenu.style.left = x + 'px';
        this.contextMenu.style.top = y + 'px';
        this.contextMenu.classList.remove('hidden');

        // Connection options
        // Get display text for source
        let sourceText = '';
        let sourceIcon = '📝';
        if (connection.source.data.type === 'document-reference') {
            sourceText = connection.source.data.fileName || 'Document';
            sourceIcon = '📄';
        } else if (connection.source.data.type === 'external-highlight') {
            sourceText = connection.source.data.text || connection.source.data.comment || 'External Highlight';
            sourceIcon = '📎';
        } else if (connection.source.data.type === 'highlight') {
            sourceText = connection.source.data.text || connection.source.data.comment || 'Highlight';
            sourceIcon = '🖍️';
        } else {
            sourceText = connection.source.data.note || connection.source.data.text || 'Note';
            sourceIcon = '📝';
        }
        
        // Get display text for target
        let targetText = '';
        let targetIcon = '📝';
        if (connection.target.data.type === 'document-reference') {
            targetText = connection.target.data.fileName || 'Document';
            targetIcon = '📄';
        } else if (connection.target.data.type === 'external-highlight') {
            targetText = connection.target.data.text || connection.target.data.comment || 'External Highlight';
            targetIcon = '📎';
        } else if (connection.target.data.type === 'highlight') {
            targetText = connection.target.data.text || connection.target.data.comment || 'Highlight';
            targetIcon = '🖍️';
        } else {
            targetText = connection.target.data.note || connection.target.data.text || 'Note';
            targetIcon = '📝';
        }
        
        sourceText = sourceText.substring(0, 35);
        targetText = targetText.substring(0, 35);
        
        // Add header showing what's connected
        const header = document.createElement('div');
        header.className = 'context-menu-header';
        header.style.cssText = 'padding: 10px 12px; border-bottom: 1px solid #e0e0e0; font-size: 11px; color: #666; background: #f9f9f9; pointer-events: none; user-select: none;';
        header.innerHTML = `
            <div style="margin-bottom: 6px; font-weight: 600;">🔗 Link Options</div>
            <div style="font-size: 10px; color: #555; margin-bottom: 2px;">${sourceIcon} "${this.escapeHtml(sourceText)}${sourceText.length >= 35 ? '...' : ''}"</div>
            <div style="font-size: 10px; color: #999; margin: 3px 0;">↓</div>
            <div style="font-size: 10px; color: #555;">${targetIcon} "${this.escapeHtml(targetText)}${targetText.length >= 35 ? '...' : ''}"</div>
        `;
        this.contextMenu.appendChild(header);
        
        // Add menu options
        this.addMenuItem('🗑️ Delete Link', () => {
            this.contextMenu.classList.add('hidden');
            this.selectedConnection = null;
            this.promptDeleteConnection(connection);
            this.render();
        }, true);
        
        this.addMenuItem('❌ Cancel', () => {
            this.contextMenu.classList.add('hidden');
            this.selectedConnection = null;
            this.render();
        });
    }

    addMenuItem(text, onClick, isDanger = false) {
        const item = document.createElement('div');
        item.className = 'context-menu-item' + (isDanger ? ' delete-item' : '');
        item.textContent = text;
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            onClick();
        });
        // Prevent mousedown from triggering canvas interactions
        item.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        this.contextMenu.appendChild(item);
    }

    getConnectionAtPoint(x, y) {
        const threshold = 20; // Click detection threshold in world units (increased for easier selection)
        
        for (const conn of this.connections) {
            // Get connection points
            const { start, end } = this.getConnectionPoints(conn.source, conn.target);
            
            // Calculate control points for bezier curve
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const curvature = 0.5;
            const offset = Math.min(dist * curvature, 100);
            
            // Determine direction
            const overlapX = Math.max(0, Math.min(conn.source.x + conn.source.width, conn.target.x + conn.target.width) - Math.max(conn.source.x, conn.target.x));
            const overlapY = Math.max(0, Math.min(conn.source.y + conn.source.height, conn.target.y + conn.target.height) - Math.max(conn.source.y, conn.target.y));
            const dir = (overlapY > 0 || Math.abs(dx) > Math.abs(dy)) ? 'horizontal' : 'vertical';
            
            let cp1, cp2;
            if (dir === 'horizontal') {
                cp1 = { x: start.x + (start.x < end.x ? offset : -offset), y: start.y };
                cp2 = { x: end.x + (start.x < end.x ? -offset : offset), y: end.y };
            } else {
                cp1 = { x: start.x, y: start.y + (start.y < end.y ? offset : -offset) };
                cp2 = { x: end.x, y: end.y + (start.y < end.y ? -offset : offset) };
            }
            
            // Sample points along the bezier curve and check distance
            // Use finer sampling (0.04 instead of 0.05) for more accurate detection
            for (let t = 0; t <= 1; t += 0.04) {
                const point = this.getBezierPoint(start, cp1, cp2, end, t);
                const distToPoint = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2));
                
                if (distToPoint <= threshold) {
                    return conn;
                }
            }
        }
        
        return null;
    }

    getBezierPoint(p0, p1, p2, p3, t) {
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;
        const t2 = t * t;
        const t3 = t2 * t;
        
        return {
            x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
            y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
        };
    }

    promptDeleteConnection(connection) {
        const sourceText = (connection.source.data.text || connection.source.data.note || '').substring(0, 80);
        const targetText = (connection.target.data.text || connection.target.data.note || '').substring(0, 80);
        const sourceType = connection.source.data.type === 'highlight' ? '🖍️ Highlight' : '📝 Note';
        const targetType = connection.target.data.type === 'highlight' ? '🖍️ Highlight' : '📝 Note';
        
        // Create custom dialog
        const dialog = document.createElement('div');
        dialog.className = 'note-dialog-overlay';
        dialog.innerHTML = `
            <div class="note-dialog" style="max-width: 500px;">
                <div class="note-dialog-header" style="background: linear-gradient(135deg, #f44336 0%, #e91e63 100%);">
                    <h3>🔗 Delete Link</h3>
                    <button class="note-dialog-close" onclick="this.closest('.note-dialog-overlay').remove()">×</button>
                </div>
                <div class="note-dialog-body">
                    <p style="margin-bottom: 20px; color: #666; font-size: 14px;">Are you sure you want to remove the connection between these items?</p>
                    
                    <div style="background: #f5f5f5; border-radius: 8px; padding: 15px; margin-bottom: 15px; border-left: 4px solid ${connection.source.color === 'yellow' ? '#ffd54f' : connection.source.color === 'green' ? '#81c784' : connection.source.color === 'blue' ? '#64b5f6' : connection.source.color === 'pink' ? '#f06292' : connection.source.color === 'purple' ? '#ba68c8' : '#ffb74d'};">
                        <div style="font-size: 12px; color: #999; margin-bottom: 5px;">${sourceType}</div>
                        <div style="color: #333; line-height: 1.4;">"${this.escapeHtml(sourceText)}${sourceText.length >= 80 ? '...' : ''}"</div>
                    </div>
                    
                    <div style="text-align: center; margin: 15px 0; color: #999; font-size: 20px;">↓</div>
                    
                    <div style="background: #f5f5f5; border-radius: 8px; padding: 15px; border-left: 4px solid ${connection.target.color === 'yellow' ? '#ffd54f' : connection.target.color === 'green' ? '#81c784' : connection.target.color === 'blue' ? '#64b5f6' : connection.target.color === 'pink' ? '#f06292' : connection.target.color === 'purple' ? '#ba68c8' : '#ffb74d'};">
                        <div style="font-size: 12px; color: #999; margin-bottom: 5px;">${targetType}</div>
                        <div style="color: #333; line-height: 1.4;">"${this.escapeHtml(targetText)}${targetText.length >= 80 ? '...' : ''}"</div>
                    </div>
                </div>
                <div class="note-dialog-footer">
                    <button class="btn-secondary" onclick="this.closest('.note-dialog-overlay').remove()">Cancel</button>
                    <button class="btn-primary" id="confirmDeleteLinkBtn" style="background: #f44336;">Delete Link</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Handle confirm button
        document.getElementById('confirmDeleteLinkBtn').addEventListener('click', () => {
            // Remove the link
            
            // Determine the correct target ID to pass to toggleLink
            // If it's an external link, we might need the stored linkId or originalId
            let targetId = connection.target.id;
            let targetFilePath = connection.target.data.filePath;

            if (connection.isDocumentLink) {
                if (connection.linkId) {
                    // If we stored the specific link ID (best case)
                    targetId = connection.linkId;
                } else if (connection.target.isExternalHighlight && connection.target.data.originalId) {
                    // If it's an external highlight node, use its original ID
                    targetId = connection.target.data.originalId;
                    targetFilePath = connection.target.data.sourceFile;
                } else if (connection.target.isDocumentRef) {
                    // If it's a generic document ref without a stored linkId, 
                    // it might be a direct link to the document (not a highlight)
                    // In this case targetId is likely just the doc ref ID, which might not match stored link.
                    // But usually buildConnections will now store linkId.
                    targetFilePath = connection.target.data.filePath;
                }
            }

            this.notesManager.toggleLink(
                connection.source.id,
                targetId,
                targetFilePath
            );
            this.notesManager.render();
            
            setTimeout(() => {
                this.refreshData();
            }, 100);
            
            console.log('✓ Link deleted');
            dialog.remove();
        });
        
        // Close on background click
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.remove();
            }
        });
    }

    addNote(x, y) {
        // Open add note dialog
        const dialog = document.createElement('div');
        dialog.className = 'note-dialog-overlay';
        dialog.innerHTML = `
            <div class="note-dialog" style="max-width: 400px; max-height: auto; height: auto;">
                <div class="note-dialog-header">
                    <h3>📝 Add Note to Mindmap</h3>
                    <button class="note-dialog-close" onclick="this.closest('.note-dialog-overlay').remove()">×</button>
                </div>
                <div class="note-dialog-body">
                    <textarea id="mindmapNoteInput" class="note-dialog-textarea" placeholder="Type your note here..." style="min-height: 100px;"></textarea>
                </div>
                <div class="note-dialog-footer">
                    <button class="btn-secondary" onclick="this.closest('.note-dialog-overlay').remove()">Cancel</button>
                    <button class="btn-primary" id="confirmAddNoteBtn">Add Note</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);

        const input = dialog.querySelector('#mindmapNoteInput');
        input.focus();

        const handleAdd = () => {
            const text = input.value.trim();
            if (text) {
                // Add to notesManager
                const newNote = this.notesManager.addNote(text);
                
                if (newNote) {
                    // Add to layout cache
                    const layout = this.loadLayout();
                    layout.push({ id: newNote.id, x: x, y: y });
                    localStorage.setItem('mindmap_layout', JSON.stringify(layout));
                    
                    this.refreshData(); // Update canvas
                }
                
                dialog.remove();
            }
        };

        dialog.querySelector('#confirmAddNoteBtn').addEventListener('click', handleAdd);
    }

    editNode(node) {
        const currentText = node.data.text || node.data.note || '';
        const currentComment = node.data.comment || '';
        const isHighlight = node.data.type === 'highlight';
        
        // Create edit dialog
        const dialog = document.createElement('div');
        dialog.className = 'note-dialog-overlay';
        dialog.innerHTML = `
            <div class="note-dialog" style="max-width: 500px;">
                <div class="note-dialog-header">
                    <h3>${isHighlight ? '✏️ Edit Highlight' : '✏️ Edit Note'}</h3>
                    <button class="note-dialog-close" onclick="this.closest('.note-dialog-overlay').remove()">×</button>
                </div>
                <div class="note-dialog-body">
                    ${isHighlight ? `
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #666;">Highlighted Text:</label>
                            <div style="background: #f5f5f5; padding: 10px; border-radius: 4px; color: #333; font-style: italic;">
                                "${this.escapeHtml(currentText)}"
                            </div>
                        </div>
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #666;">Your Comment:</label>
                        <textarea id="editNoteTextarea" class="note-dialog-textarea" placeholder="Add your comment about this highlight..." style="min-height: 120px;">${this.escapeHtml(currentComment)}</textarea>
                    ` : `
                        <label style="display: block; margin-bottom: 5px; font-weight: 500; color: #666;">Note Text:</label>
                        <textarea id="editNoteTextarea" class="note-dialog-textarea" placeholder="Type your note here..." style="min-height: 150px;">${this.escapeHtml(currentText)}</textarea>
                    `}
                    
                    <div style="margin-top: 15px;">
                        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #666;">Color:</label>
                        <div class="mindmap-color-picker" id="editColorPicker">
                            <div class="color-option ${node.color === 'yellow' ? 'selected' : ''}" data-color="yellow" style="background: #ffd54f;"></div>
                            <div class="color-option ${node.color === 'green' ? 'selected' : ''}" data-color="green" style="background: #81c784;"></div>
                            <div class="color-option ${node.color === 'blue' ? 'selected' : ''}" data-color="blue" style="background: #64b5f6;"></div>
                            <div class="color-option ${node.color === 'pink' ? 'selected' : ''}" data-color="pink" style="background: #f06292;"></div>
                            <div class="color-option ${node.color === 'purple' ? 'selected' : ''}" data-color="purple" style="background: #ba68c8;"></div>
                            <div class="color-option ${node.color === 'orange' ? 'selected' : ''}" data-color="orange" style="background: #ffb74d;"></div>
                        </div>
                    </div>
                </div>
                <div class="note-dialog-footer">
                    <button class="btn-secondary" onclick="this.closest('.note-dialog-overlay').remove()">Cancel</button>
                    <button class="btn-primary" id="confirmEditBtn">Save Changes</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        const textarea = document.getElementById('editNoteTextarea');
        textarea.focus();
        
        // Handle color picker
        let selectedColor = node.color || 'yellow';
        const colorPicker = document.getElementById('editColorPicker');
        colorPicker.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', () => {
                colorPicker.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                selectedColor = option.dataset.color;
            });
        });
        
        // Handle save button
        const handleSave = () => {
            const newText = textarea.value.trim();
            
            if (newText || !isHighlight) { // Allow empty for notes to just change color
                // Update the note/highlight
                const item = this.notesManager.getItemById(node.id);
                if (item) {
                    if (isHighlight) {
                        item.comment = newText;
                    } else {
                        item.text = newText;
                        item.note = newText; // Some notes use 'note' property
                    }
                    
                    // Update color
                    item.color = selectedColor;
                    
                    this.notesManager.saveToStorage();
                    this.notesManager.render();
                    this.refreshData();
                    console.log('✓ Note updated');
                }
                dialog.remove();
            }
        };
        
        document.getElementById('confirmEditBtn').addEventListener('click', handleSave);
        
        // Handle Enter key (Ctrl+Enter to save)
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                handleSave();
            }
        });
        
        // Close on background click
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.remove();
            }
        });
    }

    showColorPicker(node) {
        const currentColor = node.color || 'yellow';
        
        // Create color picker dialog
        const dialog = document.createElement('div');
        dialog.className = 'note-dialog-overlay';
        dialog.innerHTML = `
            <div class="note-dialog" style="max-width: 350px;">
                <div class="note-dialog-header">
                    <h3>🎨 Change Color</h3>
                    <button class="note-dialog-close" onclick="this.closest('.note-dialog-overlay').remove()">×</button>
                </div>
                <div class="note-dialog-body">
                    <p style="margin-bottom: 15px; color: #666; font-size: 14px;">Choose a color for this note:</p>
                    <div class="mindmap-color-picker" id="colorPickerOptions" style="justify-content: center;">
                        <div class="color-option-large ${currentColor === 'yellow' ? 'selected' : ''}" data-color="yellow" style="background: #ffd54f;"></div>
                        <div class="color-option-large ${currentColor === 'green' ? 'selected' : ''}" data-color="green" style="background: #81c784;"></div>
                        <div class="color-option-large ${currentColor === 'blue' ? 'selected' : ''}" data-color="blue" style="background: #64b5f6;"></div>
                        <div class="color-option-large ${currentColor === 'pink' ? 'selected' : ''}" data-color="pink" style="background: #f06292;"></div>
                        <div class="color-option-large ${currentColor === 'purple' ? 'selected' : ''}" data-color="purple" style="background: #ba68c8;"></div>
                        <div class="color-option-large ${currentColor === 'orange' ? 'selected' : ''}" data-color="orange" style="background: #ffb74d;"></div>
                    </div>
                </div>
                <div class="note-dialog-footer">
                    <button class="btn-secondary" onclick="this.closest('.note-dialog-overlay').remove()">Cancel</button>
                    <button class="btn-primary" id="confirmColorBtn">Apply Color</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Handle color selection
        let selectedColor = currentColor;
        const colorOptions = document.querySelectorAll('#colorPickerOptions .color-option-large');
        colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                colorOptions.forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                selectedColor = option.dataset.color;
            });
        });
        
        // Handle confirm button
        document.getElementById('confirmColorBtn').addEventListener('click', () => {
            const item = this.notesManager.getItemById(node.id);
            if (item) {
                item.color = selectedColor;
                this.notesManager.saveToStorage();
                this.notesManager.render();
                this.refreshData();
                console.log('✓ Color changed to', selectedColor);
            }
            dialog.remove();
        });
        
        // Close on background click
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.remove();
            }
        });
    }

    deleteNode(node) {
        if (confirm('Delete this note?')) {
            this.notesManager.deleteNote(node.id); // Assuming this method exists
            this.notesManager.render();
            this.refreshData();
        }
    }

    showLinkDialog(sourceNode) {
        // Simple dialog to choose a target note to link to
        const potentialTargets = this.nodes.filter(n => n.id !== sourceNode.id);
        
        const dialog = document.createElement('div');
        dialog.className = 'note-dialog-overlay';
        dialog.innerHTML = `
            <div class="note-dialog" style="max-width: 500px; height: 600px;">
                <div class="note-dialog-header">
                    <h3>🔗 Link to Note</h3>
                    <button class="note-dialog-close" onclick="this.closest('.note-dialog-overlay').remove()">×</button>
                </div>
                <div class="note-dialog-body">
                    <div class="link-search-container">
                        <input type="text" id="linkSearchInput" class="link-search-input" placeholder="Search notes...">
                    </div>
                    <div class="link-items-list" id="linkItemsList">
                        <!-- Items will be populated here -->
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
        
        const list = dialog.querySelector('#linkItemsList');
        const searchInput = dialog.querySelector('#linkSearchInput');
        
        const renderList = (filter = '') => {
            list.innerHTML = '';
            const filtered = potentialTargets.filter(n => {
                const text = (n.data.text || n.data.note || '').toLowerCase();
                return text.includes(filter.toLowerCase());
            });
            
            filtered.forEach(target => {
                const item = document.createElement('div');
                item.className = 'link-item';
                const text = target.data.text || target.data.note || 'Empty Note';
                const truncated = text.length > 100 ? text.substring(0, 100) + '...' : text;
                item.innerHTML = `
                    <div class="link-item-type">${target.data.type === 'highlight' ? '🖍️ Highlight' : '📝 Note'}</div>
                    <div class="link-item-preview">${this.escapeHtml(truncated)}</div>
                `;
                item.addEventListener('click', () => {
                    this.notesManager.toggleLink(sourceNode.id, target.id, target.data.filePath);
                    this.refreshData(); // Refresh to show new line
                    dialog.remove();
                });
                list.appendChild(item);
            });
        };
        
        renderList();
        
        searchInput.addEventListener('input', (e) => renderList(e.target.value));
    }

    escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}
