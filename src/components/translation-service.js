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
                        
                        const url = `${this.apiEndpoint}?${params}`;
                        console.log(`[Translation] Method 1: Translating ${chunk.length} chars to ${targetLang}`);
                        
                        const response = await fetch(url, {
                            method: 'GET',
                            headers: {
                                'User-Agent': 'Mozilla/5.0'
                            }
                        });
                        
                        console.log(`[Translation] Method 1 response status: ${response.status}`);
                        
                        if (response.ok) {
                            const data = await response.json();
                            console.log('[Translation] Method 1 data structure:', Array.isArray(data), data?.[0] ? 'has data[0]' : 'no data[0]');
                            
                            if (data && data[0]) {
                                translated = data[0].map(item => item[0]).join('');
                                console.log(`[Translation] Method 1 success: ${translated.length} chars translated`);
                            } else {
                                console.warn('[Translation] Method 1: Response OK but invalid data structure');
                            }
                        } else {
                            console.warn(`[Translation] Method 1: HTTP ${response.status} - ${await response.text().catch(() => 'Could not read error')}`);
                        }
                    } catch (e) {
                        console.error('[Translation] Method 1 failed:', e);
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
                            
                            console.log(`[Translation] Method 2: Trying alternative endpoint`);
                            const response = await fetch(`${altEndpoint}?${params}`, {
                                method: 'GET',
                                headers: {
                                    'User-Agent': 'Mozilla/5.0'
                                }
                            });
                            
                            console.log(`[Translation] Method 2 response status: ${response.status}`);
                            
                            if (response.ok) {
                                const data = await response.json();
                                console.log('[Translation] Method 2 data:', typeof data, Array.isArray(data));
                                
                                if (data && data[0]) {
                                    translated = data[0];
                                    console.log(`[Translation] Method 2 success: ${translated.length} chars translated`);
                                } else {
                                    console.warn('[Translation] Method 2: Response OK but invalid data');
                                }
                            } else {
                                console.warn(`[Translation] Method 2: HTTP ${response.status}`);
                            }
                        } catch (e) {
                            console.error('[Translation] Method 2 failed:', e);
                        }
                    }
                    
                    // If all methods fail, return original
                    if (!translated || translated.trim().length === 0) {
                        console.warn('[Translation] All translation methods failed for chunk, using original text');
                        console.warn(`[Translation] Chunk preview: "${chunk.substring(0, 100)}..."`);
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
            // Split by lines and paragraphs, handling text with or without punctuation
            // This is more robust than strict sentence splitting
            const lines = rawText.split('\n');
            const chunks = [];
            
            for (const line of lines) {
                const trimmed = line.trim();
                
                if (!trimmed) {
                    // Empty line - keep as paragraph break
                    chunks.push({
                        text: '\n',
                        isBreak: true
                    });
                } else {
                    // Non-empty line - split by sentence punctuation if present
                    const parts = trimmed.split(/([.!?]+\s+)/);
                    let currentText = '';
                    
                    for (const part of parts) {
                        if (part.match(/^[.!?]+\s+$/)) {
                            currentText += part;
                            if (currentText.trim().length > 1) {
                                chunks.push({
                                    text: currentText,
                                    isBreak: false
                                });
                                currentText = '';
                            }
                        } else if (part.trim()) {
                            currentText += part;
                        }
                    }
                    
                    // Push any remaining text
                    if (currentText.trim().length > 1) {
                        chunks.push({
                            text: currentText + '\n', // Keep line break
                            isBreak: false
                        });
                    }
                }
            }
            
            const translations = [];
            
            console.log(`[Translation] Starting line-by-line translation: ${chunks.length} chunks to ${targetLang}`);
            
            // Process in larger batches
            const batchSize = 10; // Translate 10 chunks at once
            let successCount = 0;
            let failCount = 0;
            
            for (let i = 0; i < chunks.length; i += batchSize) {
                const batch = chunks.slice(i, i + batchSize);
                
                const batchPromises = batch.map(async (chunkObj, idx) => {
                    // Keep paragraph breaks as-is
                    if (chunkObj.isBreak) {
                        return {
                            original: chunkObj.text,
                            translated: chunkObj.text,
                            isNewline: true
                        };
                    }
                    
                    const trimmed = chunkObj.text.trim();
                    if (!trimmed || trimmed.length < 2) {
                        return {
                            original: chunkObj.text,
                            translated: chunkObj.text,
                            isEmpty: true
                        };
                    }
                    
                    try {
                        const translated = await this.translateText(trimmed, targetLang, sourceLang);
                        const wasTranslated = translated && translated !== trimmed;
                        
                        if (wasTranslated) {
                            successCount++;
                        } else {
                            failCount++;
                        }
                        
                        if ((i + idx) < 5) {
                            console.log(`[Translation] Chunk ${i + idx}: "${trimmed.substring(0, 50)}..." => "${translated.substring(0, 50)}..."`);
                        }
                        
                        return {
                            original: chunkObj.text,
                            translated: translated || trimmed
                        };
                    } catch (err) {
                        console.error(`[Translation] Failed to translate chunk ${i + idx}:`, err);
                        failCount++;
                        return {
                            original: chunkObj.text,
                            translated: chunkObj.text
                        };
                    }
                });
                
                const batchResults = await Promise.all(batchPromises);
                translations.push(...batchResults);
                
                if (progressCallback) {
                    progressCallback(Math.min(100, ((i + batchSize) / chunks.length) * 100));
                }
            }
            
            console.log(`[Translation] Complete: ${successCount} translated, ${failCount} failed/unchanged`);
            console.log(`[Translation] Total result items: ${translations.length}`);
            
            if (successCount === 0 && failCount === 0) {
                const nonEmpty = translations.filter(t => !t.isNewline && !t.isEmpty).length;
                console.error(`[Translation] WARNING: No translations attempted! Non-empty chunks: ${nonEmpty}`);
            }
            
            return translations;
        } catch (error) {
            console.error('[Translation] Sentence translation error:', error);
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

