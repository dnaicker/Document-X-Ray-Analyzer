class MarkdownReader {
    constructor() {
        this.currentMarkdown = null;
        this.currentHTML = null;
    }

    /**
     * Load and parse a Markdown file from buffer
     * @param {ArrayBuffer} arrayBuffer - The file data
     * @returns {Promise<{success: boolean, text: string, html: string}>}
     */
    async loadFromBuffer(arrayBuffer) {
        try {
            // Convert ArrayBuffer to text
            const decoder = new TextDecoder('utf-8');
            const markdownText = decoder.decode(arrayBuffer);
            
            if (!markdownText || markdownText.trim().length === 0) {
                throw new Error('Markdown file is empty');
            }

            this.currentMarkdown = markdownText;
            
            // Convert Markdown to HTML
            this.currentHTML = this.parseMarkdown(markdownText);
            
            return {
                success: true,
                text: markdownText,
                html: this.currentHTML
            };
        } catch (error) {
            console.error('Error loading Markdown:', error);
            return {
                success: false,
                text: '',
                html: '',
                error: error.message
            };
        }
    }

    /**
     * Parse Markdown to HTML
     * @param {string} markdown - The markdown text
     * @returns {string} HTML string
     */
    parseMarkdown(markdown) {
        let html = markdown;

        // Escape HTML entities first
        html = html.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;');

        // Headers (must be done before other formatting)
        html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
        html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
        html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
        html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

        // Code blocks (fenced with ```)
        html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
            const language = lang || '';
            return `<pre><code class="language-${language}">${code.trim()}</code></pre>`;
        });

        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Bold and italic
        html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
        html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
        html = html.replace(/_(.+?)_/g, '<em>$1</em>');

        // Strikethrough
        html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

        // Images
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;">');

        // Horizontal rules
        html = html.replace(/^---$/gm, '<hr>');
        html = html.replace(/^\*\*\*$/gm, '<hr>');
        html = html.replace(/^___$/gm, '<hr>');

        // Unordered lists
        html = html.replace(/^\*\s+(.+)$/gm, '<li>$1</li>');
        html = html.replace(/^-\s+(.+)$/gm, '<li>$1</li>');
        html = html.replace(/^\+\s+(.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

        // Ordered lists
        html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
            // Check if it's already wrapped in ul
            if (!match.includes('<ul>')) {
                return '<ol>' + match + '</ol>';
            }
            return match;
        });

        // Blockquotes
        html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>');
        html = html.replace(/(<blockquote>.*<\/blockquote>\n?)+/g, '<blockquote>$&</blockquote>');

        // Line breaks (two spaces at end of line or two newlines)
        html = html.replace(/  \n/g, '<br>\n');
        html = html.replace(/\n\n/g, '</p><p>');

        // Wrap in paragraphs
        html = '<p>' + html + '</p>';

        // Clean up empty paragraphs
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p>\s*<\/p>/g, '');

        // Clean up paragraphs around block elements
        html = html.replace(/<p>(<h[1-6]>)/g, '$1');
        html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
        html = html.replace(/<p>(<pre>)/g, '$1');
        html = html.replace(/(<\/pre>)<\/p>/g, '$1');
        html = html.replace(/<p>(<ul>)/g, '$1');
        html = html.replace(/(<\/ul>)<\/p>/g, '$1');
        html = html.replace(/<p>(<ol>)/g, '$1');
        html = html.replace(/(<\/ol>)<\/p>/g, '$1');
        html = html.replace(/<p>(<blockquote>)/g, '$1');
        html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
        html = html.replace(/<p>(<hr>)<\/p>/g, '$1');

        return html;
    }

    /**
     * Get the current Markdown text
     * @returns {string|null}
     */
    getCurrentMarkdown() {
        return this.currentMarkdown;
    }

    /**
     * Get the current HTML
     * @returns {string|null}
     */
    getCurrentHTML() {
        return this.currentHTML;
    }

    /**
     * Clear the current document
     */
    clear() {
        this.currentMarkdown = null;
        this.currentHTML = null;
    }
}

// Initialize Markdown Reader
const markdownReader = new MarkdownReader();

