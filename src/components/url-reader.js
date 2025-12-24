// URL Reader Component
// Converts HTML content from web pages to readable text for analysis

class UrlReader {
    constructor() {
        this.name = 'UrlReader';
    }

    /**
     * Extract readable text from HTML content
     * @param {string} html - The HTML content
     * @param {string} title - The page title
     * @param {string} url - The source URL
     * @returns {object} - Processed content with text and metadata
     */
    async extractContent(html, title, url) {
        try {
            // Create a temporary DOM parser
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Remove script, style, and other non-content tags
            this.removeUnwantedElements(doc);
            
            // Try to find the main content area
            const mainContent = this.findMainContent(doc);
            
            // Extract text with some formatting
            const text = this.extractText(mainContent);
            
            // Clean up the text
            const cleanText = this.cleanText(text);
            
            return {
                success: true,
                text: cleanText,
                title: title,
                url: url,
                wordCount: cleanText.split(/\s+/).filter(w => w.length > 0).length,
                metadata: {
                    source: url,
                    imported: new Date().toISOString(),
                    type: 'web-page'
                }
            };
        } catch (error) {
            console.error('Error extracting content:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Remove unwanted HTML elements
     */
    removeUnwantedElements(doc) {
        const unwantedSelectors = [
            'script', 'style', 'noscript', 'iframe',
            'nav', 'header', 'footer', 'aside',
            '.advertisement', '.ads', '.comments',
            '#comments', '.sidebar', '.menu',
            '.navigation', '.footer', '.header',
            '[role="navigation"]', '[role="banner"]',
            '[role="contentinfo"]', '[role="complementary"]'
        ];

        unwantedSelectors.forEach(selector => {
            try {
                const elements = doc.querySelectorAll(selector);
                elements.forEach(el => el.remove());
            } catch (e) {
                // Ignore selector errors
            }
        });
    }

    /**
     * Find the main content area of the page
     */
    findMainContent(doc) {
        // Try common content selectors in order of priority
        const contentSelectors = [
            'article',
            '[role="main"]',
            'main',
            '.article',
            '.post',
            '.content',
            '.entry-content',
            '.post-content',
            '.article-content',
            '#content',
            '#main',
            '.main-content'
        ];

        for (const selector of contentSelectors) {
            try {
                const element = doc.querySelector(selector);
                if (element && this.hasSignificantContent(element)) {
                    return element;
                }
            } catch (e) {
                // Ignore selector errors
            }
        }

        // If no main content found, use body
        return doc.body || doc;
    }

    /**
     * Check if an element has significant text content
     */
    hasSignificantContent(element) {
        const text = element.textContent || '';
        const words = text.split(/\s+/).filter(w => w.length > 0);
        return words.length > 50; // At least 50 words
    }

    /**
     * Extract text from an element with basic formatting
     */
    extractText(element) {
        if (!element) return '';

        let text = '';
        
        const processNode = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tagName = node.tagName.toLowerCase();
                
                // Add line breaks for block elements
                if (['p', 'div', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'pre'].includes(tagName)) {
                    if (text && !text.endsWith('\n')) {
                        text += '\n';
                    }
                }
                
                // Add prefix for headers
                if (tagName.match(/^h[1-6]$/)) {
                    text += '\n';
                }
                
                // Process children
                node.childNodes.forEach(child => processNode(child));
                
                // Add line break after block elements
                if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote', 'pre'].includes(tagName)) {
                    if (text && !text.endsWith('\n')) {
                        text += '\n';
                    }
                }
            }
        };
        
        processNode(element);
        
        return text;
    }

    /**
     * Clean and normalize extracted text
     */
    cleanText(text) {
        if (!text) return '';
        
        return text
            // Normalize whitespace
            .replace(/\t/g, ' ')
            // Remove multiple spaces
            .replace(/ +/g, ' ')
            // Remove multiple newlines (keep max 2)
            .replace(/\n\n\n+/g, '\n\n')
            // Remove spaces at start/end of lines
            .replace(/^ +/gm, '')
            .replace(/ +$/gm, '')
            // Trim overall
            .trim();
    }

    /**
     * Convert HTML to markdown-like format (optional enhancement)
     */
    htmlToMarkdown(html) {
        let text = html;
        
        // Headers
        text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n');
        text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n');
        text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n');
        
        // Paragraphs
        text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, '\n$1\n');
        
        // Line breaks
        text = text.replace(/<br\s*\/?>/gi, '\n');
        
        // Lists
        text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
        
        // Bold
        text = text.replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, '**$2**');
        
        // Italic
        text = text.replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, '*$2*');
        
        // Remove remaining tags
        text = text.replace(/<[^>]+>/g, '');
        
        // Decode HTML entities
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        text = textarea.value;
        
        // Clean up
        return this.cleanText(text);
    }
}

// Create singleton instance
const urlReader = new UrlReader();

// Make available globally
if (typeof window !== 'undefined') {
    window.urlReader = urlReader;
}

