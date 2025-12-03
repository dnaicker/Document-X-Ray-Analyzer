class TxtReader {
    constructor() {
        this.currentText = null;
    }

    /**
     * Load and parse a text file from buffer
     * @param {ArrayBuffer} arrayBuffer - The file data
     * @returns {Promise<{success: boolean, text: string}>}
     */
    async loadFromBuffer(arrayBuffer) {
        try {
            // Convert ArrayBuffer to text
            const decoder = new TextDecoder('utf-8');
            const text = decoder.decode(arrayBuffer);
            
            if (!text || text.trim().length === 0) {
                throw new Error('Text file is empty');
            }

            this.currentText = text;
            
            return {
                success: true,
                text: text
            };
        } catch (error) {
            console.error('Error loading text file:', error);
            return {
                success: false,
                text: '',
                error: error.message
            };
        }
    }

    /**
     * Get the current text
     * @returns {string|null}
     */
    getCurrentText() {
        return this.currentText;
    }

    /**
     * Clear the current document
     */
    clear() {
        this.currentText = null;
    }
}

// Initialize Text Reader
const txtReader = new TxtReader();

