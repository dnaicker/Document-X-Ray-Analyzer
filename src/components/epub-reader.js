/**
 * EPUB Reader Component
 * Handles loading and rendering EPUB files
 */

class EPUBReader {
    constructor() {
        this.book = null;
        this.rendition = null;
        this.currentLocation = null;
        this.extractedText = '';
    }

    /**
     * Load an EPUB file from a buffer
     * @param {ArrayBuffer} arrayBuffer - The EPUB file data
     * @returns {Promise<void>}
     */
    async loadFromBuffer(arrayBuffer) {
        try {
            // Import ePub library
            const ePub = window.ePub;
            
            if (!ePub) {
                throw new Error('ePub.js library not loaded');
            }

            // Create book from array buffer
            this.book = ePub(arrayBuffer);
            
            // Extract text from all sections
            await this.extractAllText();
            
            return {
                success: true,
                text: this.extractedText,
                metadata: await this.getMetadata()
            };
        } catch (error) {
            console.error('Error loading EPUB:', error);
            throw error;
        }
    }

    /**
     * Extract text from all sections of the EPUB
     * @returns {Promise<void>}
     */
    async extractAllText() {
        try {
            await this.book.ready;
            
            const spine = await this.book.loaded.spine;
            const textParts = [];
            
            // Iterate through all spine items
            for (let i = 0; i < spine.items.length; i++) {
                const item = spine.items[i];
                try {
                    const doc = await this.book.load(item.href);
                    
                    let text = '';
                    
                    // Check if doc is already an HTML document
                    if (doc instanceof Document || doc instanceof HTMLDocument) {
                        text = doc.body ? doc.body.textContent : doc.textContent || '';
                    } 
                    // If it's a string, parse it
                    else if (typeof doc === 'string') {
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = doc;
                        text = tempDiv.textContent || tempDiv.innerText || '';
                    }
                    // If it's an XML document
                    else if (doc && doc.documentElement) {
                        text = doc.documentElement.textContent || '';
                    }
                    
                    if (text && text.trim()) {
                        textParts.push(text.trim());
                    }
                } catch (err) {
                    console.warn(`Error loading section ${i}:`, err);
                }
            }
            
            this.extractedText = textParts.join('\n\n');
        } catch (error) {
            console.error('Error extracting EPUB text:', error);
            throw error;
        }
    }

    /**
     * Get metadata from the EPUB
     * @returns {Promise<Object>}
     */
    async getMetadata() {
        try {
            await this.book.ready;
            const metadata = await this.book.loaded.metadata;
            
            return {
                title: metadata.title || 'Unknown Title',
                author: metadata.creator || 'Unknown Author',
                publisher: metadata.publisher || '',
                language: metadata.language || 'en',
                description: metadata.description || ''
            };
        } catch (error) {
            console.error('Error getting EPUB metadata:', error);
            return {
                title: 'Unknown Title',
                author: 'Unknown Author'
            };
        }
    }

    /**
     * Render EPUB in a container
     * @param {HTMLElement} container - The container element
     * @param {number} width - Width of the rendering area
     * @param {number} height - Height of the rendering area
     */
    async render(container, width, height) {
        try {
            if (!this.book) {
                throw new Error('No book loaded');
            }

            // Clear container
            container.innerHTML = '';

            // Create rendition
            this.rendition = this.book.renderTo(container, {
                width: width,
                height: height,
                spread: 'none',
                flow: 'paginated'
            });

            // Apply default theme
            this.applyTheme({
                background: '#ffffff',
                color: '#333333',
                fontSize: '16px',
                fontFamily: 'Georgia, serif',
                lineHeight: '1.6'
            });

            // Display the book
            await this.rendition.display();

            return { success: true };
        } catch (error) {
            console.error('Error rendering EPUB:', error);
            throw error;
        }
    }

    /**
     * Apply custom theme to EPUB
     * @param {Object} theme - Theme settings
     */
    applyTheme(theme) {
        if (!this.rendition) return;

        const styles = {
            'body': {
                'background-color': theme.background || '#ffffff',
                'color': theme.color || '#333333',
                'font-size': theme.fontSize || '16px',
                'font-family': theme.fontFamily || 'Georgia, serif',
                'line-height': theme.lineHeight || '1.6',
                'padding': '20px !important',
                'margin': '0 auto',
                'max-width': '800px'
            },
            'p': {
                'margin-bottom': '1em'
            },
            'h1, h2, h3, h4, h5, h6': {
                'margin-top': '1.5em',
                'margin-bottom': '0.5em',
                'color': theme.color || '#333333'
            }
        };

        this.rendition.themes.default(styles);
    }

    /**
     * Update EPUB display settings
     * @param {Object} settings - Display settings
     */
    updateSettings(settings) {
        this.applyTheme(settings);
    }

    /**
     * Navigate to next page
     */
    async nextPage() {
        if (this.rendition) {
            await this.rendition.next();
        }
    }

    /**
     * Navigate to previous page
     */
    async prevPage() {
        if (this.rendition) {
            await this.rendition.prev();
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.rendition) {
            this.rendition.destroy();
            this.rendition = null;
        }
        if (this.book) {
            this.book.destroy();
            this.book = null;
        }
        this.extractedText = '';
    }
}

// Export for use in renderer
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EPUBReader;
}

// Initialize EPUB Reader
const epubReader = new EPUBReader();

