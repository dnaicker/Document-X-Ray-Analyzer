class CodeReader {
    constructor() {
        this.currentCode = null;
        this.currentLanguage = null;
        this.languageMap = {
            // JavaScript/TypeScript
            'js': 'javascript',
            'jsx': 'jsx',
            'ts': 'typescript',
            'tsx': 'tsx',
            'mjs': 'javascript',
            // Python
            'py': 'python',
            'pyw': 'python',
            // Java
            'java': 'java',
            // C/C++
            'c': 'c',
            'cpp': 'cpp',
            'cc': 'cpp',
            'cxx': 'cpp',
            'h': 'c',
            'hpp': 'cpp',
            'hh': 'cpp',
            'hxx': 'cpp',
            // C#
            'cs': 'csharp',
            // Go
            'go': 'go',
            // Rust
            'rs': 'rust',
            // PHP
            'php': 'php',
            'phtml': 'php',
            // Ruby
            'rb': 'ruby',
            // Swift
            'swift': 'swift',
            // Kotlin
            'kt': 'kotlin',
            'kts': 'kotlin',
            // Web
            'html': 'html',
            'htm': 'html',
            'css': 'css',
            'scss': 'scss',
            'sass': 'sass',
            'less': 'less',
            // Data formats
            'json': 'json',
            'xml': 'xml',
            'yaml': 'yaml',
            'yml': 'yaml',
            'toml': 'toml',
            // Shell scripts
            'sh': 'bash',
            'bash': 'bash',
            'zsh': 'bash',
            'bat': 'batch',
            'cmd': 'batch',
            'ps1': 'powershell',
            // SQL
            'sql': 'sql',
            // Godot Engine
            'gd': 'gdscript',
            'gdscript': 'gdscript',
            'gdshader': 'glsl',
            'tscn': 'markup',
            'tres': 'markup',
            // Other
            'r': 'r',
            'scala': 'scala',
            'lua': 'lua',
            'perl': 'perl',
            'pl': 'perl',
            'vim': 'vim',
            'dockerfile': 'docker',
            'makefile': 'makefile',
            'cmake': 'cmake',
            'gradle': 'gradle',
            'groovy': 'groovy',
            'dart': 'dart',
            'ex': 'elixir',
            'exs': 'elixir',
            'erl': 'erlang',
            'hrl': 'erlang',
            'clj': 'clojure',
            'cljs': 'clojure',
            'lisp': 'lisp',
            'scm': 'scheme'
        };
    }

    /**
     * Load and parse a source code file from buffer
     * @param {ArrayBuffer} arrayBuffer - The file data
     * @param {string} fileExtension - The file extension (e.g., 'js', 'py')
     * @returns {Promise<{success: boolean, text: string, language: string, html: string}>}
     */
    async loadFromBuffer(arrayBuffer, fileExtension) {
        try {
            // Convert ArrayBuffer to text
            const decoder = new TextDecoder('utf-8');
            const code = decoder.decode(arrayBuffer);
            
            if (!code || code.trim().length === 0) {
                throw new Error('Source file is empty');
            }

            this.currentCode = code;
            
            // Determine language from extension
            const ext = fileExtension.toLowerCase().replace('.', '');
            this.currentLanguage = this.languageMap[ext] || 'plaintext';
            
            // Generate highlighted HTML
            const html = this.highlightCode(code, this.currentLanguage);
            
            return {
                success: true,
                text: code,
                language: this.currentLanguage,
                html: html
            };
        } catch (error) {
            console.error('Error loading source code file:', error);
            return {
                success: false,
                text: '',
                language: 'plaintext',
                html: '',
                error: error.message
            };
        }
    }

    /**
     * Highlight code using Prism.js
     * @param {string} code - The source code
     * @param {string} language - The programming language
     * @returns {string} Highlighted HTML
     */
    highlightCode(code, language) {
        // Escape HTML entities
        const escaped = this.escapeHtml(code);
        
        // If Prism is available, use it for syntax highlighting
        if (typeof Prism !== 'undefined' && Prism.languages[language]) {
            try {
                const highlighted = Prism.highlight(code, Prism.languages[language], language);
                return `<pre class="language-${language}" style="margin: 0; tab-size: 4;"><code class="language-${language}">${highlighted}</code></pre>`;
            } catch (error) {
                console.warn('Prism highlighting failed, falling back to plain:', error);
                return `<pre style="margin: 0; tab-size: 4;"><code>${escaped}</code></pre>`;
            }
        }
        
        // Fallback to plain formatting
        return `<pre style="margin: 0; tab-size: 4;"><code>${escaped}</code></pre>`;
    }

    /**
     * Escape HTML entities
     * @param {string} text - The text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Get the current code
     * @returns {string|null}
     */
    getCurrentCode() {
        return this.currentCode;
    }

    /**
     * Get the current language
     * @returns {string|null}
     */
    getCurrentLanguage() {
        return this.currentLanguage;
    }

    /**
     * Get language display name
     * @param {string} language - The language identifier
     * @returns {string} Display name
     */
    getLanguageDisplayName(language) {
        const displayNames = {
            'javascript': 'JavaScript',
            'jsx': 'React JSX',
            'typescript': 'TypeScript',
            'tsx': 'React TSX',
            'python': 'Python',
            'java': 'Java',
            'c': 'C',
            'cpp': 'C++',
            'csharp': 'C#',
            'go': 'Go',
            'rust': 'Rust',
            'php': 'PHP',
            'ruby': 'Ruby',
            'swift': 'Swift',
            'kotlin': 'Kotlin',
            'html': 'HTML',
            'css': 'CSS',
            'scss': 'SCSS',
            'sass': 'Sass',
            'less': 'Less',
            'json': 'JSON',
            'xml': 'XML',
            'yaml': 'YAML',
            'toml': 'TOML',
            'bash': 'Bash',
            'batch': 'Batch',
            'powershell': 'PowerShell',
            'sql': 'SQL',
            'gdscript': 'GDScript',
            'glsl': 'GLSL Shader',
            'markup': 'Markup',
            'r': 'R',
            'scala': 'Scala',
            'lua': 'Lua',
            'perl': 'Perl',
            'vim': 'VimScript',
            'docker': 'Dockerfile',
            'makefile': 'Makefile',
            'cmake': 'CMake',
            'gradle': 'Gradle',
            'groovy': 'Groovy',
            'dart': 'Dart',
            'elixir': 'Elixir',
            'erlang': 'Erlang',
            'clojure': 'Clojure',
            'lisp': 'Lisp',
            'scheme': 'Scheme',
            'plaintext': 'Plain Text'
        };
        return displayNames[language] || language.toUpperCase();
    }

    /**
     * Check if a file extension is a supported code file
     * @param {string} extension - File extension (with or without dot)
     * @returns {boolean}
     */
    isSupportedExtension(extension) {
        const ext = extension.toLowerCase().replace('.', '');
        return this.languageMap.hasOwnProperty(ext);
    }

    /**
     * Get all supported extensions
     * @returns {Array<string>}
     */
    getSupportedExtensions() {
        return Object.keys(this.languageMap);
    }

    /**
     * Clear the current document
     */
    clear() {
        this.currentCode = null;
        this.currentLanguage = null;
    }
}

// Initialize Code Reader
const codeReader = new CodeReader();
