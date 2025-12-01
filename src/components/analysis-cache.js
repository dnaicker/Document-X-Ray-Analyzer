// Analysis Cache Manager - Persists NLP analysis to localStorage
class AnalysisCache {
    constructor() {
        this.storageKey = 'grammar-highlighter-analysis-cache';
    }

    // Generate a cache key based on file path and file modification time (if available)
    getCacheKey(filePath) {
        // Use file path as key (could add file size/mtime for invalidation)
        return filePath;
    }

    // Save analysis data to localStorage
    saveAnalysis(filePath, data) {
        try {
            const cache = this.loadAll();
            const key = this.getCacheKey(filePath);
            
            cache[key] = {
                timestamp: Date.now(),
                analysis: data.analysis,
                // Store compressed/serialized HTML
                rawTextHTML: data.rawTextHTML,
                highlightedTextHTML: data.highlightedTextHTML,
                figuresHTML: data.figuresHTML || '',
                figuresCount: data.figuresCount || '0 found'
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(cache));
            console.log(`Cached analysis for: ${filePath}`);
        } catch (e) {
            console.error('Error saving analysis cache:', e);
            // If quota exceeded, clear old entries
            if (e.name === 'QuotaExceededError') {
                this.clearOldEntries();
                // Try again
                try {
                    const cache = this.loadAll();
                    cache[this.getCacheKey(filePath)] = {
                        timestamp: Date.now(),
                        analysis: data.analysis,
                        rawTextHTML: data.rawTextHTML,
                        highlightedTextHTML: data.highlightedTextHTML,
                        figuresHTML: data.figuresHTML || '',
                        figuresCount: data.figuresCount || '0 found'
                    };
                    localStorage.setItem(this.storageKey, JSON.stringify(cache));
                } catch (e2) {
                    console.error('Failed to save analysis cache even after cleanup:', e2);
                }
            }
        }
    }

    // Load analysis data from localStorage
    loadAnalysis(filePath) {
        try {
            const cache = this.loadAll();
            const key = this.getCacheKey(filePath);
            return cache[key] || null;
        } catch (e) {
            console.error('Error loading analysis cache:', e);
            return null;
        }
    }

    // Load all cached analyses
    loadAll() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Error parsing analysis cache:', e);
            return {};
        }
    }

    // Clear old entries (keep only last 10 documents)
    clearOldEntries() {
        try {
            const cache = this.loadAll();
            const entries = Object.entries(cache);
            
            // Sort by timestamp (newest first)
            entries.sort((a, b) => (b[1].timestamp || 0) - (a[1].timestamp || 0));
            
            // Keep only the 10 most recent
            const kept = entries.slice(0, 10);
            const newCache = {};
            kept.forEach(([key, value]) => {
                newCache[key] = value;
            });
            
            localStorage.setItem(this.storageKey, JSON.stringify(newCache));
            console.log(`Cleared old analysis cache entries. Kept ${kept.length} entries.`);
        } catch (e) {
            console.error('Error clearing old cache entries:', e);
        }
    }

    // Clear cache for a specific file
    clearFile(filePath) {
        try {
            const cache = this.loadAll();
            const key = this.getCacheKey(filePath);
            delete cache[key];
            localStorage.setItem(this.storageKey, JSON.stringify(cache));
        } catch (e) {
            console.error('Error clearing file cache:', e);
        }
    }

    // Clear all cache
    clearAll() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('Cleared all analysis cache');
        } catch (e) {
            console.error('Error clearing cache:', e);
        }
    }
}

// Initialize global instance
const analysisCache = new AnalysisCache();

