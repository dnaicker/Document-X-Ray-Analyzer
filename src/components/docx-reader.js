/**
 * DOCX Reader Component
 * Handles loading and rendering DOCX files
 */

class DOCXReader {
    constructor() {
        this.extractedText = '';
        this.htmlContent = '';
        this.metadata = {};
    }

    /**
     * Load a DOCX file from a buffer
     * @param {ArrayBuffer} arrayBuffer - The DOCX file data
     * @returns {Promise<Object>}
     */
    async loadFromBuffer(arrayBuffer) {
        try {
            const mammoth = window.mammoth;
            
            if (!mammoth) {
                throw new Error('Mammoth library not loaded');
            }

            // Extract HTML and text
            const htmlResult = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
            const textResult = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
            
            this.htmlContent = htmlResult.value;
            this.extractedText = textResult.value;
            
            // Log any warnings
            if (htmlResult.messages && htmlResult.messages.length > 0) {
                console.warn('DOCX conversion warnings:', htmlResult.messages);
            }

            return {
                success: true,
                text: this.extractedText,
                html: this.htmlContent,
                metadata: this.extractMetadata()
            };
        } catch (error) {
            console.error('Error loading DOCX:', error);
            throw error;
        }
    }

    /**
     * Extract basic metadata from the document
     * @returns {Object}
     */
    extractMetadata() {
        // Count basic statistics
        const words = this.extractedText.split(/\s+/).filter(w => w.length > 0);
        const lines = this.extractedText.split('\n').filter(l => l.trim().length > 0);
        
        return {
            wordCount: words.length,
            lineCount: lines.length,
            charCount: this.extractedText.length
        };
    }

    /**
     * Render DOCX content in a container
     * @param {HTMLElement} container - The container element
     */
    render(container) {
        try {
            if (!this.htmlContent) {
                throw new Error('No document loaded');
            }

            // Clear container
            container.innerHTML = '';

            // Create a styled wrapper for the content
            const wrapper = document.createElement('div');
            wrapper.className = 'docx-content';
            
            wrapper.innerHTML = this.htmlContent;
            container.appendChild(wrapper);

            return { success: true };
        } catch (error) {
            console.error('Error rendering DOCX:', error);
            throw error;
        }
    }

    /**
     * Get extracted text
     * @returns {string}
     */
    getText() {
        return this.extractedText;
    }

    /**
     * Get HTML content
     * @returns {string}
     */
    getHTML() {
        return this.htmlContent;
    }

    /**
     * Clean up resources
     */
    destroy() {
        this.extractedText = '';
        this.htmlContent = '';
        this.metadata = {};
    }
}

// Export for use in renderer
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DOCXReader;
}

// Initialize DOCX Reader
const docxReader = new DOCXReader();

