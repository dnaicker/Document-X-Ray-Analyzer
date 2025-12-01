// PDF Viewer Component
class PDFViewer {
    constructor() {
        this.pdfDoc = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.scale = 1.5;
        this.canvas = document.getElementById('pdfCanvasElement');
        this.ctx = this.canvas.getContext('2d');
        this.welcomeMessage = document.querySelector('.welcome-message');
        this.pageTextCache = {};
        
        this.initControls();
        
        // Configure PDF.js worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 
            'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    }
    
    initControls() {
        document.getElementById('prevPageBtn').addEventListener('click', () => this.previousPage());
        document.getElementById('nextPageBtn').addEventListener('click', () => this.nextPage());
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomOut());
        
        const pageInput = document.getElementById('pageInput');
        if (pageInput) {
            pageInput.addEventListener('change', (e) => {
                let page = parseInt(e.target.value);
                if (this.totalPages > 0 && page >= 1 && page <= this.totalPages) {
                    // Use window.goToPage if available to sync views, otherwise internal
                    if (window.goToPage) {
                        window.goToPage(page, false);
                    } else {
                        this.currentPage = page;
                        this.renderPage(page);
                        this.updateControls();
                    }
                } else {
                    // Reset to current valid page if invalid
                    if (this.totalPages > 0) e.target.value = this.currentPage;
                }
            });
            
            pageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    pageInput.blur(); // Trigger change event
                }
            });
        }
    }
    
    async loadPDF(data) {
        try {
            // Clear old document cache BEFORE loading new one
            this.pageTextCache = {};
            
            // Load new PDF document
            this.pdfDoc = await pdfjsLib.getDocument({ data }).promise;
            this.totalPages = this.pdfDoc.numPages;
            this.currentPage = 1;
            
            // Hide welcome message, show canvas
            this.welcomeMessage.style.display = 'none';
            this.canvas.style.display = 'block';
            
            await this.renderPage(this.currentPage);
            this.updateControls();
            
            return true;
        } catch (error) {
            console.error('Error loading PDF:', error);
            throw error;
        }
    }
    
    async renderPage(pageNum) {
        try {
            const page = await this.pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: this.scale });
            
            this.canvas.height = viewport.height;
            this.canvas.width = viewport.width;
            
            const renderContext = {
                canvasContext: this.ctx,
                viewport: viewport
            };
            
            await page.render(renderContext).promise;
            
            this.currentPage = pageNum;
            this.updateControls();
        } catch (error) {
            console.error('Error rendering page:', error);
            throw error;
        }
    }
    
    async extractAllText() {
        if (!this.pdfDoc) return '';
        
        let fullText = '';
        this.pageTextCache = {};
        
        for (let i = 1; i <= this.totalPages; i++) {
            try {
                const page = await this.pdfDoc.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                
                this.pageTextCache[i] = pageText;
                fullText += pageText + '\n\n';
            } catch (error) {
                console.error(`Error extracting text from page ${i}:`, error);
            }
        }
        
        return fullText.trim();
    }

    getPageText(pageNum) {
        return this.pageTextCache[pageNum] || '';
    }
    
    async performOCR(progressCallback) {
        if (!this.pdfDoc) return '';
        
        let fullText = '';
        
        for (let i = 1; i <= this.totalPages; i++) {
            try {
                // Render page to canvas
                const page = await this.pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 });
                
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                tempCanvas.height = viewport.height;
                tempCanvas.width = viewport.width;
                
                await page.render({
                    canvasContext: tempCtx,
                    viewport: viewport
                }).promise;
                
                // Convert canvas to image
                const imageData = tempCanvas.toDataURL('image/png');
                
                // Perform OCR
                const result = await Tesseract.recognize(imageData, 'eng', {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            const progress = (i - 1) / this.totalPages + m.progress / this.totalPages;
                            progressCallback(progress);
                        }
                    }
                });
                
                fullText += result.data.text + '\n\n';
                
            } catch (error) {
                console.error(`OCR error on page ${i}:`, error);
            }
        }
        
        return fullText.trim();
    }

    async extractImages(progressCallback) {
        if (!this.pdfDoc) return [];
        
        const images = [];
        const numPages = this.pdfDoc.numPages;
        
        for (let i = 1; i <= numPages; i++) {
            try {
                const page = await this.pdfDoc.getPage(i);
                const opList = await page.getOperatorList();
                
                for (let j = 0; j < opList.fnArray.length; j++) {
                    if (opList.fnArray[j] === pdfjsLib.OPS.paintImageXObject) {
                        const imgName = opList.argsArray[j][0];
                        
                        try {
                            const imgObj = await new Promise((resolve) => {
                                const timeout = setTimeout(() => {
                                    console.warn(`Timeout getting image ${imgName} on page ${i}`);
                                    resolve(null);
                                }, 1000); // 1s timeout

                                try {
                                    page.objs.get(imgName, (img) => {
                                        clearTimeout(timeout);
                                        resolve(img);
                                    });
                                } catch (e) {
                                    clearTimeout(timeout);
                                    console.warn(`Error getting image object ${imgName}:`, e);
                                    resolve(null);
                                }
                            });
                            
                            if (imgObj) {
                            let dataUrl = '';
                            let width = 0;
                            let height = 0;
                            
                            if (imgObj instanceof HTMLCanvasElement) {
                                dataUrl = imgObj.toDataURL();
                                width = imgObj.width;
                                height = imgObj.height;
                            } else if (imgObj instanceof Image || imgObj instanceof HTMLImageElement) {
                                const canvas = document.createElement('canvas');
                                canvas.width = imgObj.naturalWidth;
                                canvas.height = imgObj.naturalHeight;
                                canvas.getContext('2d').drawImage(imgObj, 0, 0);
                                dataUrl = canvas.toDataURL();
                                width = imgObj.naturalWidth;
                                height = imgObj.naturalHeight;
                            }
                            
                            // Filter out small artifacts (likely not figures)
                            if (width > 100 && height > 100) {
                                images.push({
                                    page: i,
                                    src: dataUrl,
                                    width,
                                    height,
                                    id: `${i}_${imgName}`
                                });
                            }
                        }
                    } catch (e) {
                        console.warn(`Skipping image ${imgName} on page ${i}:`, e);
                    }
                }
                }
                
                if (progressCallback) {
                    progressCallback(i / numPages);
                }
                
                page.cleanup(); // Release resources
                
            } catch (e) {
                console.error(`Error extracting images from page ${i}:`, e);
            }
        }
        
        return images;
    }
    
    previousPage() {
        if (this.currentPage > 1) {
            this.renderPage(this.currentPage - 1);
        }
    }
    
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.renderPage(this.currentPage + 1);
        }
    }
    
    zoomIn() {
        this.scale += 0.25;
        this.renderPage(this.currentPage);
        document.getElementById('zoomLevel').textContent = `${Math.round(this.scale * 100)}%`;
    }
    
    zoomOut() {
        if (this.scale > 0.5) {
            this.scale -= 0.25;
            this.renderPage(this.currentPage);
            document.getElementById('zoomLevel').textContent = `${Math.round(this.scale * 100)}%`;
        }
    }
    
    updateControls() {
        const pageInput = document.getElementById('pageInput');
        const totalPagesDisplay = document.getElementById('totalPagesDisplay');
        
        if (pageInput) {
            pageInput.value = this.currentPage;
            if (this.totalPages > 0) pageInput.max = this.totalPages;
        }
        
        if (totalPagesDisplay) {
            totalPagesDisplay.textContent = this.totalPages;
        }
        
        document.getElementById('prevPageBtn').disabled = this.currentPage === 1;
        document.getElementById('nextPageBtn').disabled = this.currentPage === this.totalPages;
    }

    enableSnipping(callback) {
        const container = this.canvas.parentElement;
        container.style.cursor = 'crosshair';
        
        let overlay = document.getElementById('snipOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'snipOverlay';
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            // Match canvas size exactly to ensure full coverage
            overlay.style.width = `${this.canvas.offsetWidth}px`;
            overlay.style.height = `${this.canvas.offsetHeight}px`;
            overlay.style.zIndex = '100';
            container.appendChild(overlay);
        } else {
            // Update dimensions in case zoom changed
            overlay.style.width = `${this.canvas.offsetWidth}px`;
            overlay.style.height = `${this.canvas.offsetHeight}px`;
        }
        overlay.style.display = 'block';
        
        let startX, startY, isDragging = false;
        const selectionBox = document.createElement('div');
        selectionBox.style.border = '2px dashed #667eea';
        selectionBox.style.backgroundColor = 'rgba(102, 126, 234, 0.2)';
        selectionBox.style.position = 'absolute';
        selectionBox.style.display = 'none';
        overlay.appendChild(selectionBox);
        
        const onMouseDown = (e) => {
            e.preventDefault(); // Critical: Prevent native drag/selection
            console.log('Snip: Mouse Down');
            isDragging = true;
            const rect = overlay.getBoundingClientRect();
            startX = e.clientX - rect.left;
            startY = e.clientY - rect.top;
            
            selectionBox.style.left = `${startX}px`;
            selectionBox.style.top = `${startY}px`;
            selectionBox.style.width = '0';
            selectionBox.style.height = '0';
            selectionBox.style.display = 'block';
        };
        
        const onMouseMove = (e) => {
            if (!isDragging) return;
            // console.log('Snip: Mouse Move'); // Uncomment if needed for debugging
            const rect = overlay.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            
            const width = currentX - startX;
            const height = currentY - startY;
            
            selectionBox.style.width = `${Math.abs(width)}px`;
            selectionBox.style.height = `${Math.abs(height)}px`;
            selectionBox.style.left = `${width < 0 ? currentX : startX}px`;
            selectionBox.style.top = `${height < 0 ? currentY : startY}px`;
        };
        
        const onMouseUp = (e) => {
            if (!isDragging) return;
            console.log('Snip: Mouse Up');
            isDragging = false;
            container.style.cursor = 'default';
            
            overlay.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            
            // Measure BEFORE hiding overlay (otherwise dimensions are 0)
            const rect = selectionBox.getBoundingClientRect();
            const canvasRect = this.canvas.getBoundingClientRect();

            // Now hide and clean up
            overlay.style.display = 'none';
            while (overlay.firstChild) overlay.removeChild(overlay.firstChild);
            
            console.log('Selection Rect:', rect);
            console.log('Canvas Rect:', canvasRect);

            const x = rect.left - canvasRect.left;
            const y = rect.top - canvasRect.top;
            const w = rect.width;
            const h = rect.height;
            
            if (w > 5 && h > 5) {
                console.log('Capturing image...');
                const scaleX = this.canvas.width / canvasRect.width;
                const scaleY = this.canvas.height / canvasRect.height;
                
                const sourceX = x * scaleX;
                const sourceY = y * scaleY;
                const sourceW = w * scaleX;
                const sourceH = h * scaleY;
                
                const destCanvas = document.createElement('canvas');
                destCanvas.width = sourceW;
                destCanvas.height = sourceH;
                const ctx = destCanvas.getContext('2d');
                
                ctx.drawImage(this.canvas, sourceX, sourceY, sourceW, sourceH, 0, 0, sourceW, sourceH);
                
                callback(destCanvas.toDataURL());
            } else {
                console.warn('Selection too small, ignoring.');
            }
        };
        
        overlay.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }
}

// Initialize PDF Viewer
const pdfViewer = new PDFViewer();

