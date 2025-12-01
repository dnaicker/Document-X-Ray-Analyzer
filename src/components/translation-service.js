class TranslationService {
    constructor() {
        this.apiEndpoint = 'https://translate.googleapis.com/translate_a/single';
        this.cache = new Map();
        this.storageKey = 'grammar-highlighter-translations';
        this.loadCache();
        
        // Common languages
        this.languages = {
            'auto': 'Auto Detect',
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
            'vi': 'Vietnamese',
            'th': 'Thai',
            'id': 'Indonesian',
            'sv': 'Swedish',
            'no': 'Norwegian',
            'da': 'Danish',
            'fi': 'Finnish',
            'el': 'Greek',
            'he': 'Hebrew',
            'cs': 'Czech',
            'ro': 'Romanian',
            'hu': 'Hungarian',
            'uk': 'Ukrainian',
            // South African Languages (11 official languages)
            'af': 'Afrikaans',
            'zu': 'Zulu (isiZulu)',
            'xh': 'Xhosa (isiXhosa)',
            'nso': 'Northern Sotho (Sepedi)',
            'st': 'Southern Sotho (Sesotho)',
            'tn': 'Tswana (Setswana)',
            'ts': 'Tsonga (Xitsonga)',
            'ss': 'Swati (siSwati)',
            've': 'Venda (Tshivenda)',
            'nr': 'Southern Ndebele (isiNdebele)'
        };
    }
    
    loadCache() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const data = JSON.parse(saved);
                this.cache = new Map(Object.entries(data));
            }
        } catch (e) {
            console.error('Error loading translation cache:', e);
        }
    }
    
    saveCache() {
        try {
            const data = Object.fromEntries(this.cache);
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (e) {
            console.error('Error saving translation cache:', e);
        }
    }
    
    getCacheKey(text, targetLang, sourceLang = 'auto') {
        return `${sourceLang}:${targetLang}:${text.substring(0, 100)}`;
    }
    
    async translateText(text, targetLang, sourceLang = 'auto') {
        if (!text || !targetLang) return text;
        
        const cacheKey = this.getCacheKey(text, targetLang, sourceLang);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            // Split text into chunks (Google Translate has limits)
            const chunks = this.splitIntoChunks(text, 4000);
            const translations = [];
            
            for (const chunk of chunks) {
                const chunkKey = this.getCacheKey(chunk, targetLang, sourceLang);
                
                if (this.cache.has(chunkKey)) {
                    translations.push(this.cache.get(chunkKey));
                    continue;
                }
                
                try {
                    // Try multiple translation endpoints
                    let translated = null;
                    
                    // Method 1: Google Translate (unofficial API)
                    try {
                        const params = new URLSearchParams({
                            client: 'gtx',
                            sl: sourceLang,
                            tl: targetLang,
                            dt: 't',
                            q: chunk
                        });
                        
                        const response = await fetch(`${this.apiEndpoint}?${params}`, {
                            method: 'GET',
                            headers: {
                                'User-Agent': 'Mozilla/5.0'
                            }
                        });
                        
                        if (response.ok) {
                            const data = await response.json();
                            if (data && data[0]) {
                                translated = data[0].map(item => item[0]).join('');
                            }
                        }
                    } catch (e) {
                        console.warn('Method 1 failed:', e.message);
                    }
                    
                    // Method 2: Alternative endpoint
                    if (!translated) {
                        try {
                            const altEndpoint = 'https://clients5.google.com/translate_a/t';
                            const params = new URLSearchParams({
                                client: 'dict-chrome-ex',
                                sl: sourceLang,
                                tl: targetLang,
                                q: chunk
                            });
                            
                            const response = await fetch(`${altEndpoint}?${params}`, {
                                method: 'GET',
                                headers: {
                                    'User-Agent': 'Mozilla/5.0'
                                }
                            });
                            
                            if (response.ok) {
                                const data = await response.json();
                                if (data && data[0]) {
                                    translated = data[0];
                                }
                            }
                        } catch (e) {
                            console.warn('Method 2 failed:', e.message);
                        }
                    }
                    
                    // If all methods fail, return original
                    if (!translated) {
                        console.warn('All translation methods failed for chunk, using original');
                        translated = chunk;
                    }
                    
                    translations.push(translated);
                    this.cache.set(chunkKey, translated);
                    
                } catch (chunkError) {
                    console.error('Error translating chunk:', chunkError);
                    translations.push(chunk);
                }
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            const fullTranslation = translations.join('');
            this.cache.set(cacheKey, fullTranslation);
            this.saveCache();
            
            return fullTranslation;
        } catch (error) {
            console.error('Translation error:', error);
            return text; // Return original on error
        }
    }
    
    splitIntoChunks(text, maxLength) {
        if (text.length <= maxLength) return [text];
        
        const chunks = [];
        let currentChunk = '';
        
        // Split by sentences to maintain context
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        
        for (const sentence of sentences) {
            if (currentChunk.length + sentence.length > maxLength) {
                if (currentChunk) chunks.push(currentChunk);
                currentChunk = sentence;
            } else {
                currentChunk += sentence;
            }
        }
        
        if (currentChunk) chunks.push(currentChunk);
        
        return chunks;
    }
    
    async translateDocument(rawText, targetLang, sourceLang = 'auto', progressCallback) {
        if (!rawText || !targetLang) return null;
        
        try {
            // Split document into larger chunks (paragraphs) for faster translation
            const paragraphs = rawText.split(/\n\n+/);
            const translatedParagraphs = [];
            
            // Process in batches for better performance
            const batchSize = 5; // Translate 5 paragraphs at once
            
            for (let i = 0; i < paragraphs.length; i += batchSize) {
                const batch = paragraphs.slice(i, i + batchSize);
                const batchPromises = batch.map(async (paragraph) => {
                    if (!paragraph.trim()) return '';
                    return await this.translateText(paragraph.trim(), targetLang, sourceLang);
                });
                
                const batchResults = await Promise.all(batchPromises);
                translatedParagraphs.push(...batchResults);
                
                if (progressCallback) {
                    progressCallback(Math.min(100, ((i + batchSize) / paragraphs.length) * 100));
                }
            }
            
            return translatedParagraphs.join('\n\n');
        } catch (error) {
            console.error('Document translation error:', error);
            throw error;
        }
    }
    
    async translateSentences(rawText, targetLang, sourceLang = 'auto', progressCallback) {
        if (!rawText || !targetLang) return [];
        
        try {
            // Split into sentences and translate in batches for speed
            const sentences = rawText.match(/[^.!?]+[.!?]+|\n+/g) || [rawText];
            const translations = [];
            
            // Process in larger batches
            const batchSize = 10; // Translate 10 sentences at once
            
            for (let i = 0; i < sentences.length; i += batchSize) {
                const batch = sentences.slice(i, i + batchSize);
                
                const batchPromises = batch.map(async (sentence) => {
                    // Keep newlines as-is
                    if (/^\n+$/.test(sentence)) {
                        return {
                            original: sentence,
                            translated: sentence,
                            isNewline: true
                        };
                    }
                    
                    const trimmed = sentence.trim();
                    if (!trimmed) {
                        return {
                            original: sentence,
                            translated: sentence,
                            isEmpty: true
                        };
                    }
                    
                    const translated = await this.translateText(trimmed, targetLang, sourceLang);
                    return {
                        original: sentence,
                        translated: translated
                    };
                });
                
                const batchResults = await Promise.all(batchPromises);
                translations.push(...batchResults);
                
                if (progressCallback) {
                    progressCallback(Math.min(100, ((i + batchSize) / sentences.length) * 100));
                }
            }
            
            return translations;
        } catch (error) {
            console.error('Sentence translation error:', error);
            throw error;
        }
    }
    
    clearCache() {
        this.cache.clear();
        localStorage.removeItem(this.storageKey);
    }
}

// Initialize global instance
const translationService = new TranslationService();

