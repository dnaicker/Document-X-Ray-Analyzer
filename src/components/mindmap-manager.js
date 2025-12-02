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
        this.canvas.addEventListener('contextmenu', this.handleContextMenu);
        window.addEventListener('mousemove', this.handleMouseMove);
        window.addEventListener('mouseup', this.handleMouseUp);
        this.canvas.addEventListener('wheel', this.handleWheel);
        window.addEventListener('resize', this.handleResize);

        // Initial resize
        this.handleResize();
        
        // Load data
        this.refreshData();
    }

    createContextMenu() {
        this.contextMenu = document.createElement('div');
        this.contextMenu.className = 'context-menu hidden';
        document.body.appendChild(this.contextMenu);
        
        // Close context menu on click elsewhere
        document.addEventListener('click', (e) => {
            if (!this.contextMenu.contains(e.target)) {
                this.contextMenu.classList.add('hidden');
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
        
        this.nodes = allItems.map((item, index) => {
            const existing = existingNodesMap.get(item.id) || layoutMap.get(item.id);
            
            // Calculate height based on text content roughly
            const text = item.text || item.note || '';
            const lines = Math.ceil(text.length / 25); // Approx chars per line
            const height = this.HEADER_HEIGHT + (lines * this.LINE_HEIGHT) + (this.NODE_PADDING * 2);
            
            // Basic grid layout for new nodes
            const col = index % 5;
            const row = Math.floor(index / 5);
            
            return {
                id: item.id,
                data: item,
                x: existing ? existing.x : 100 + (col * (this.NODE_WIDTH + 50)),
                y: existing ? existing.y : 100 + (row * 200),
                width: this.NODE_WIDTH,
                height: Math.max(height, 100),
                color: item.color || 'yellow',
                isSelected: false
            };
        });

        // Build connections
        this.connections = [];
        this.nodes.forEach(sourceNode => {
            if (sourceNode.data.links) {
                console.log(`Node ${sourceNode.id} has ${sourceNode.data.links.length} links:`, sourceNode.data.links);
                sourceNode.data.links.forEach(link => {
                    const linkId = typeof link === 'string' ? link : link.id;
                    const targetNode = this.nodes.find(n => n.id === linkId);
                    if (targetNode) {
                        console.log(`Creating connection: ${sourceNode.id} -> ${targetNode.id}`);
                        this.connections.push({
                            source: sourceNode,
                            target: targetNode
                        });
                    } else {
                        console.log(`Target node not found for link: ${linkId}`);
                    }
                });
            }
        });

        console.log(`Total connections built: ${this.connections.length}`);
        this.render();
    }

    saveLayout() {
        const layout = this.nodes.map(n => ({ id: n.id, x: n.x, y: n.y }));
        localStorage.setItem('mindmap_layout', JSON.stringify(layout));
    }

    loadLayout() {
        try {
            const stored = localStorage.getItem('mindmap_layout');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading mindmap layout:', e);
            return [];
        }
    }

    handleResize() {
        if (!this.container || !this.canvas) return;
        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.container.clientHeight;
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
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const worldPos = this.screenToWorld(mouseX, mouseY);

        this.lastMouseX = mouseX;
        this.lastMouseY = mouseY;

        // Check if clicking on a connection arrow (before checking nodes)
        if (e.button === 0) { // Left click only
            const clickedConnection = this.getConnectionAtPoint(worldPos.x, worldPos.y);
            if (clickedConnection) {
                this.promptDeleteConnection(clickedConnection);
                return;
            }
        }

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
            const isHovered = this.hoveredConnection === conn;
            this.ctx.strokeStyle = isHovered ? '#2196F3' : '#ccc';
            this.ctx.lineWidth = isHovered ? 3 : 2;
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

    drawNode(node) {
        const x = node.x;
        const y = node.y;
        const w = node.width;
        const h = node.height;
        const radius = 8;

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
        this.ctx.fillStyle = '#444';
        this.ctx.font = `${this.FONT_SIZE}px Arial`;
        const text = node.data.text || node.data.note || '';
        this.wrapText(text, x + 15, y + 50, w - 30, 18);
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

        this.showContextMenu(e.clientX, e.clientY, clickedNode, worldPos);
    }

    showContextMenu(x, y, node, worldPos) {
        this.contextMenu.innerHTML = '';
        this.contextMenu.style.left = x + 'px';
        this.contextMenu.style.top = y + 'px';
        this.contextMenu.classList.remove('hidden');

        if (node) {
            // Node options
            this.addMenuItem('🔗 Link to...', () => this.showLinkDialog(node));
            this.addMenuItem('🗑️ Delete Note', () => this.deleteNode(node), true);
        } else {
            // Background options
            this.addMenuItem('📝 Add Note', () => this.addNote(worldPos.x, worldPos.y));
        }
    }

    addMenuItem(text, onClick, isDanger = false) {
        const item = document.createElement('div');
        item.className = 'context-menu-item' + (isDanger ? ' delete-item' : '');
        item.textContent = text;
        item.addEventListener('click', onClick);
        this.contextMenu.appendChild(item);
    }

    getConnectionAtPoint(x, y) {
        const threshold = 10; // Click detection threshold in world units
        
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
            for (let t = 0; t <= 1; t += 0.05) {
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
            this.notesManager.toggleLink(
                connection.source.id,
                connection.target.id,
                connection.target.data.filePath
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
