class TranslationCache {
    constructor() {
        this.storageKey = 'grammar-highlighter-translation-cache';
        this.maxCacheSize = 50; // Maximum number of translations to cache
    }
    
    getCacheKey(filePath, targetLanguage) {
        return `${filePath}:${targetLanguage}`;
    }
    
    saveTranslation(filePath, targetLanguage, translatedContent) {
        try {
            const cache = this.loadAllTranslations();
            const key = this.getCacheKey(filePath, targetLanguage);
            
            cache[key] = {
                filePath,
                targetLanguage,
                translatedContent,
                timestamp: Date.now(),
                languageName: translationService?.languages[targetLanguage] || targetLanguage
            };
            
            // Manage cache size
            this.pruneCache(cache);
            
            localStorage.setItem(this.storageKey, JSON.stringify(cache));
            console.log(`Translation cached: ${filePath} -> ${targetLanguage}`);
        } catch (e) {
            console.error('Error saving translation to cache:', e);
        }
    }
    
    loadTranslation(filePath, targetLanguage) {
        try {
            const cache = this.loadAllTranslations();
            const key = this.getCacheKey(filePath, targetLanguage);
            return cache[key] || null;
        } catch (e) {
            console.error('Error loading translation from cache:', e);
            return null;
        }
    }
    
    loadAllTranslations() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.error('Error loading translation cache:', e);
            return {};
        }
    }
    
    getAvailableTranslations(filePath) {
        try {
            const cache = this.loadAllTranslations();
            const available = [];
            
            for (const [key, value] of Object.entries(cache)) {
                if (value.filePath === filePath) {
                    available.push({
                        language: value.targetLanguage,
                        languageName: value.languageName,
                        timestamp: value.timestamp
                    });
                }
            }
            
            return available;
        } catch (e) {
            console.error('Error getting available translations:', e);
            return [];
        }
    }
    
    removeTranslation(filePath, targetLanguage) {
        try {
            const cache = this.loadAllTranslations();
            const key = this.getCacheKey(filePath, targetLanguage);
            delete cache[key];
            localStorage.setItem(this.storageKey, JSON.stringify(cache));
        } catch (e) {
            console.error('Error removing translation from cache:', e);
        }
    }
    
    clearAllTranslations() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (e) {
            console.error('Error clearing translation cache:', e);
        }
    }
    
    pruneCache(cache) {
        const entries = Object.entries(cache);
        
        // If cache is too large, remove oldest entries
        if (entries.length > this.maxCacheSize) {
            // Sort by timestamp (oldest first)
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            
            // Keep only the most recent entries
            const toKeep = entries.slice(-this.maxCacheSize);
            
            // Rebuild cache with only recent entries
            const newCache = {};
            for (const [key, value] of toKeep) {
                newCache[key] = value;
            }
            
            // Replace old cache
            Object.keys(cache).forEach(key => delete cache[key]);
            Object.assign(cache, newCache);
        }
    }
    
    getCacheStats() {
        try {
            const cache = this.loadAllTranslations();
            const entries = Object.values(cache);
            
            return {
                totalTranslations: entries.length,
                languages: [...new Set(entries.map(e => e.targetLanguage))],
                oldestTimestamp: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : null,
                newestTimestamp: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : null
            };
        } catch (e) {
            console.error('Error getting cache stats:', e);
            return { totalTranslations: 0, languages: [] };
        }
    }
}

// Initialize global instance
const translationCache = new TranslationCache();

