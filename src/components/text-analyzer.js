// Text Analyzer Component (NLP)
class TextAnalyzer {
    constructor() {
        // Stop words to filter out
        this.stopWords = new Set([
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
            'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
            'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
            'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
            'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
            'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
            'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
            'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
            'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work',
            'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
            'give', 'day', 'most', 'us', 'is', 'was', 'are', 'been', 'has', 'had',
            'were', 'said', 'did', 'having', 'may', 'should', 'am', 'being'
        ]);
    }
    
    async analyze(text, langCode = 'en') {
        const startTime = performance.now();
        
        // Load dictionary if available
        if (typeof dictionaryService !== 'undefined') {
            await dictionaryService.loadDictionary(langCode);
        }
        
        // Use compromise.js for NLP
        const doc = nlp(text);
        
        // Initialize POS buckets
        const posCounts = {
            noun: new Map(),
            verb: new Map(),
            adjective: new Map(),
            adverb: new Map(),
            preposition: new Map(),
            conjunction: new Map(),
            interjection: new Map(),
            determiner: new Map()
        };

        // Get all terms from doc
        const terms = doc.termList();
        
        terms.forEach(term => {
            const word = term.text.toLowerCase().trim();
            // Skip short words and stop words (unless they are in dictionary)
            const inDict = typeof dictionaryService !== 'undefined' && dictionaryService.getPOS(word, langCode);
            if ((word.length < 2 && !inDict) || (this.stopWords.has(word) && !inDict)) return;
            
            let type = null;
            
            // 1. Check Dictionary
            if (inDict) {
                type = inDict;
            }
            
            // 2. Fallback to Compromise tags if no dictionary match
            if (!type) {
                const tags = new Set(term.tags);
                if (tags.has('Noun')) type = 'noun';
                else if (tags.has('Verb')) type = 'verb';
                else if (tags.has('Adjective')) type = 'adjective';
                else if (tags.has('Adverb')) type = 'adverb';
                else if (tags.has('Preposition')) type = 'preposition';
                else if (tags.has('Conjunction')) type = 'conjunction';
                else if (tags.has('Determiner')) type = 'determiner';
                else if (tags.has('Expression') || tags.has('Interjection')) type = 'interjection';
                
                // REMOVED: Broad Noun Fallback for non-English
                // Previously, any unknown word in non-English was assumed to be a noun.
                // This caused inflation of noun counts (counting verbs/adjectives as nouns).
                // Now we only count what we can positively identify via dictionary or NLP.
            }
            
            // Add to appropriate bucket
            if (type && posCounts[type]) {
                posCounts[type].set(word, (posCounts[type].get(word) || 0) + 1);
            }
        });
        
        // Helper to convert Map to sorted Array
        const toArray = (map, type) => Array.from(map.entries())
            .map(([word, count]) => ({ word, count, type }))
            .sort((a, b) => b.count - a.count);

        const nouns = toArray(posCounts.noun, 'noun');
        const verbs = toArray(posCounts.verb, 'verb');
        const adjectives = toArray(posCounts.adjective, 'adjective');
        const adverbs = toArray(posCounts.adverb, 'adverb');
        const prepositions = toArray(posCounts.preposition, 'preposition');
        const conjunctions = toArray(posCounts.conjunction, 'conjunction');
        const interjections = toArray(posCounts.interjection, 'interjection');
        const determiners = toArray(posCounts.determiner, 'determiner');
        
        // Extract entities (keep existing logic as it's distinct)
        const people = this.extractEntities(doc.people(), 'person');
        const places = this.extractEntities(doc.places(), 'place');
        const organizations = this.extractEntities(doc.organizations(), 'organization');
        
        // Extract specific categories with custom fallback
        let abbreviations = this.extractPOS(doc.abbreviations(), 'abbreviation');
        let acronyms = this.extractPOS(doc.acronyms(), 'acronym');
        let numbers = this.extractPOS(doc.numbers(), 'number');
        
        // Enhance with custom extraction (compromise may miss some)
        const customAcronyms = this.extractAcronymsCustom(text);
        const customNumbers = this.extractNumbersCustom(text);
        
        // Merge acronyms
        const acronymMap = new Map();
        acronyms.forEach(a => acronymMap.set(a.word, (acronymMap.get(a.word) || 0) + a.count));
        customAcronyms.forEach(a => acronymMap.set(a.word, (acronymMap.get(a.word) || 0) + a.count));
        acronyms = this.mapToSortedArray(acronymMap, 'acronym');
        
        // Merge numbers
        const numberMap = new Map();
        numbers.forEach(n => numberMap.set(n.word, (numberMap.get(n.word) || 0) + n.count));
        customNumbers.forEach(n => numberMap.set(n.word, (numberMap.get(n.word) || 0) + n.count));
        numbers = this.mapToSortedArray(numberMap, 'number');
        
        // Enhanced Currency Extraction
        let currencies = this.extractPOS(doc.money(), 'currency');
        const currencyCodes = this.extractCurrencyCodes(text);
        
        // Merge currency results
        const currencyMap = new Map();
        currencies.forEach(c => currencyMap.set(c.word, (currencyMap.get(c.word) || 0) + c.count));
        currencyCodes.forEach(c => currencyMap.set(c.word, (currencyMap.get(c.word) || 0) + c.count));
        currencies = this.mapToSortedArray(currencyMap, 'currency');
        
        // Custom Extractions for specific financial/other terms
        const dates = this.extractDates(text);
        const crypto = this.extractCrypto(text);
        const currencyPairs = this.extractCurrencyPairs(text);
        const currencySymbols = this.extractCurrencySymbols(text);
        
        // Get word frequency
        const wordFreq = this.getWordFrequency(text);
        
        // Get top words (excluding stop words)
        const topWords = this.getTopWords(wordFreq, 20);
        
        // Get unique insights (Smart AI Insights)
        const uniqueInsights = this.getSmartInsights(doc);
        
        // Calculate statistics
        const words = text.split(/\s+/).filter(w => w.length > 0);
        const totalSentences = doc.sentences().length;
        const uniqueWords = new Set(words.map(w => w.toLowerCase())).size;
        
        // Calculate Writing Style Stats
        const writingStyle = this.calculateWritingStats(words, totalSentences, uniqueWords);

        const elapsed = performance.now() - startTime;
        
        return {
            pos: {
                nouns,
                verbs,
                adjectives,
                adverbs,
                prepositions,
                conjunctions,
                interjections,
                determiners
            },
            entities: {
                people,
                places,
                organizations,
                abbreviations
            },
            topWords,
            uniqueInsights,
            stats: {
                totalWords: words.length,
                uniqueWords,
                sentences: totalSentences,
                processingTime: elapsed
            },
            writingStyle,
            wordFreq
        };
    }

    calculateWritingStats(wordsArray, totalSentences, uniqueWords) {
        const totalWords = wordsArray.length;
        if (totalWords === 0) return {};

        // Syllable count (approximate)
        let totalSyllables = 0;
        wordsArray.forEach(w => {
            totalSyllables += this.countSyllables(w);
        });

        // Flesch-Kincaid Grade Level
        // 0.39 * (total words / total sentences) + 11.8 * (total syllables / total words) - 15.59
        const wordsPerSentence = totalSentences > 0 ? totalWords / totalSentences : 0;
        const syllablesPerWord = totalWords > 0 ? totalSyllables / totalWords : 0;
        
        let gradeLevel = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
        gradeLevel = Math.max(0, Math.round(gradeLevel * 10) / 10);

        // Reading Time (avg 200 words per minute)
        const readingTimeMinutes = Math.ceil(totalWords / 200);

        // Lexical Diversity (Type-Token Ratio)
        const lexicalDiversity = totalWords > 0 ? (uniqueWords / totalWords * 100).toFixed(1) : 0;

        return {
            gradeLevel,
            readingTimeMinutes,
            lexicalDiversity,
            avgSentenceLength: Math.round(wordsPerSentence),
            syllablesPerWord: syllablesPerWord.toFixed(2)
        };
    }

    countSyllables(word) {
        word = word.toLowerCase().replace(/[^a-z]/g, '');
        if (word.length <= 3) return 1;
        word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
        word = word.replace(/^y/, '');
        const matches = word.match(/[aeiouy]{1,2}/g);
        return matches ? matches.length : 1;
    }
    
    extractPOS(terms, type) {
        const results = new Map();
        
        terms.forEach(term => {
            const text = term.text().toLowerCase().trim();
            // Allow numbers, currencies, abbreviations, acronyms to be short
            const minLength = (type === 'number' || type === 'currency' || type === 'symbol' || type === 'acronym' || type === 'abbreviation') ? 0 : 2;
            
            if (text.length > minLength && !this.stopWords.has(text)) {
                results.set(text, (results.get(text) || 0) + 1);
            }
        });
        
        return Array.from(results.entries())
            .map(([word, count]) => ({ word, count, type }))
            .sort((a, b) => b.count - a.count);
    }
    
    extractEntities(terms, type) {
        const results = new Map();
        
        terms.forEach(term => {
            const text = term.text().trim();
            if (text.length > 1) {
                results.set(text, (results.get(text) || 0) + 1);
            }
        });
        
        return Array.from(results.entries())
            .map(([word, count]) => ({ word, count, type }))
            .sort((a, b) => b.count - a.count);
    }
    
    extractCurrencyCodes(text) {
        const codes = new Set(['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD', 'ZAR', 'INR', 'RUB', 'BRL', 'SGD', 'HKD', 'KRW', 'MXN', 'TRY', 'NOK', 'DKK', 'PLN', 'THB', 'IDR', 'HUF', 'CZK', 'ILS', 'CLP', 'PHP', 'AED', 'SAR', 'MYR', 'RON']);
        const results = new Map();
        // Match 3-letter uppercase currency codes with word boundaries
        const regex = /\b([A-Z]{3})\b/g;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            const code = match[1];
            if (codes.has(code)) {
                results.set(code.toLowerCase(), (results.get(code.toLowerCase()) || 0) + 1);
            }
        }
        
        return this.mapToSortedArray(results, 'currency');
    }
    
    extractAbbreviations(doc) {
        // Replaced by direct doc.abbreviations() call in analyze()
        return [];
    }
    
    extractCrypto(text) {
        // Top 20 crypto tickers + common names
        const tickers = new Set(['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'XRP', 'USDC', 'ADA', 'AVAX', 'DOGE', 'DOT', 'TRX', 'LINK', 'MATIC', 'WBTC', 'UNI', 'LTC', 'DAI', 'BCH', 'ATOM']);
        const names = new Set(['bitcoin', 'ethereum', 'tether', 'bnb', 'solana', 'ripple', 'cardano', 'avalanche', 'dogecoin', 'polkadot', 'tron', 'chainlink', 'polygon', 'litecoin', 'bitcoin cash', 'cosmos']);
        
        const results = new Map();
        const words = text.split(/[\s,.]+/);
        
        words.forEach(w => {
            const clean = w.replace(/[^\w]/g, '');
            if (clean && (tickers.has(clean) || names.has(clean.toLowerCase()))) {
                 results.set(clean, (results.get(clean) || 0) + 1);
            }
        });
        
        return this.mapToSortedArray(results, 'crypto');
    }
    
    extractCurrencyPairs(text) {
        const results = new Map();
        // Match AAA/BBB pattern (e.g. USD/EUR)
        const matches = text.match(/\b[A-Z]{3}\/[A-Z]{3}\b/g) || [];
        matches.forEach(m => results.set(m, (results.get(m) || 0) + 1));
        return this.mapToSortedArray(results, 'currency-pair');
    }
    
    extractCurrencySymbols(text) {
        const results = new Map();
        // Common currency symbols
        const matches = text.match(/[$€£¥₹₽₪₩₫₿]/g) || [];
        matches.forEach(m => results.set(m, (results.get(m) || 0) + 1));
        return this.mapToSortedArray(results, 'currency-symbol');
    }
    
    extractDates(text) {
        const results = new Map();
        // Match common date patterns
        const patterns = [
            /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g,  // 12/31/2023, 31-12-23
            /\b\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}\b/g,    // 2023-12-31
            /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b/gi,  // January 1, 2023
            /\b\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\b/gi  // 1 January 2023
        ];
        
        patterns.forEach(pattern => {
            const matches = text.match(pattern) || [];
            matches.forEach(m => {
                const normalized = m.toLowerCase();
                results.set(normalized, (results.get(normalized) || 0) + 1);
            });
        });
        
        return this.mapToSortedArray(results, 'date');
    }
    
    extractAcronymsCustom(text) {
        const results = new Map();
        // Match 2+ consecutive uppercase letters (acronyms like FATF, EBA, USD, EU, etc.)
        // But exclude common currency codes (handled separately) and single letters
        const currencyCodes = new Set(['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NZD', 'ZAR', 'INR', 'RUB', 'BRL', 'SGD', 'HKD', 'KRW', 'MXN', 'TRY', 'NOK', 'DKK', 'PLN', 'THB', 'IDR', 'HUF', 'CZK', 'ILS', 'CLP', 'PHP', 'AED', 'SAR', 'MYR', 'RON']);
        const cryptoCodes = new Set(['BTC', 'ETH', 'USDT', 'BNB', 'SOL', 'XRP', 'USDC', 'ADA', 'AVAX', 'DOGE', 'DOT', 'TRX', 'LINK', 'MATIC', 'WBTC', 'UNI', 'LTC', 'DAI', 'BCH', 'ATOM']);
        
        // Match acronyms: 2+ uppercase letters, optionally followed by lowercase (e.g., FICs)
        const regex = /\b([A-Z]{2,}(?:[a-z])?)\b/g;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            const acronym = match[1];
            // Skip if it's a currency or crypto code (handled elsewhere)
            if (!currencyCodes.has(acronym) && !cryptoCodes.has(acronym)) {
                results.set(acronym.toLowerCase(), (results.get(acronym.toLowerCase()) || 0) + 1);
            }
        }
        
        return this.mapToSortedArray(results, 'acronym');
    }
    
    extractNumbersCustom(text) {
        const results = new Map();
        // Match various number formats:
        // - Plain numbers: 16, 1000
        // - Numbers with commas: 1,000 or 5,000
        // - Numbers with decimals: 3.14, 0.5
        // - Percentages are excluded (handled separately if needed)
        // - Years in isolation: 2023, 2022
        const regex = /\b(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\b/g;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
            const number = match[1];
            // Normalize by removing commas for storage
            const normalized = number.replace(/,/g, '');
            results.set(normalized, (results.get(normalized) || 0) + 1);
        }
        
        return this.mapToSortedArray(results, 'number');
    }

    mapToSortedArray(map, type) {
         return Array.from(map.entries())
            .map(([word, count]) => ({ word, count, type }))
            .sort((a, b) => b.count - a.count);
    }
    
    getWordFrequency(text) {
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const freq = new Map();
        
        words.forEach(word => {
            if (word.length > 2 && !this.stopWords.has(word)) {
                freq.set(word, (freq.get(word) || 0) + 1);
            }
        });
        
        return freq;
    }
    
    getTopWords(wordFreq, limit = 20) {
        return Array.from(wordFreq.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([word, count]) => ({ word, count, type: 'word' }));
    }
    
    getSmartInsights(doc) {
        const insights = [];
        const seen = new Set();

        const add = (items, type) => {
            items.forEach(item => {
                const lower = item.word.toLowerCase();
                if (!seen.has(lower) && item.word.length > 2 && !this.stopWords.has(lower)) {
                    seen.add(lower);
                    insights.push({ word: item.word, count: item.count, type });
                }
            });
        };

        // 1. People & Characters (High Priority)
        add(this.extractEntities(doc.people(), 'character'), 'character');

        // 2. Places
        add(this.extractEntities(doc.places(), 'location'), 'location');

        // 3. Organizations
        add(this.extractEntities(doc.organizations(), 'organization'), 'organization');

        // 4. Important Concepts (Topics)
        let topics = [];
        try {
            if (typeof doc.topics === 'function') {
                topics = this.extractEntities(doc.topics(), 'topic');
            } else {
                topics = this.extractEntities(doc.match('#TitleCase'), 'topic');
            }
        } catch (e) {
            topics = this.extractEntities(doc.match('#TitleCase'), 'topic');
        }
        add(topics, 'topic');

        // 5. Key Terms (Frequent Nouns)
        const nouns = this.extractPOS(doc.nouns(), 'concept');
        add(nouns.filter(n => n.count > 1).slice(0, 20), 'concept');

        return insights.sort((a, b) => b.count - a.count).slice(0, 50);
    }
    
    renderHighlightedText(text, analysis, options) {
        let html = text;
        
        // Create a map of words to highlight
        const highlightMap = new Map();
        
        if (options.nouns) {
            analysis.pos.nouns.forEach(item => {
                highlightMap.set(item.word, 'noun');
            });
        }
        
        if (options.verbs) {
            analysis.pos.verbs.forEach(item => {
                highlightMap.set(item.word, 'verb');
            });
        }
        
        if (options.adjectives) {
            analysis.pos.adjectives.forEach(item => {
                highlightMap.set(item.word, 'adjective');
            });
        }
        
        if (options.adverbs) {
            analysis.pos.adverbs.forEach(item => {
                highlightMap.set(item.word, 'adverb');
            });
        }
        
        if (options.prepositions) {
            analysis.pos.prepositions.forEach(item => {
                highlightMap.set(item.word, 'preposition');
            });
        }
        
        if (options.conjunctions) {
            analysis.pos.conjunctions.forEach(item => {
                highlightMap.set(item.word, 'conjunction');
            });
        }
        
        if (options.interjections) {
            analysis.pos.interjections.forEach(item => {
                highlightMap.set(item.word, 'interjection');
            });
        }
        
        if (options.determiners) {
            analysis.pos.determiners.forEach(item => {
                highlightMap.set(item.word, 'determiner');
            });
        }
        
        if (options.people) {
            analysis.entities.people.forEach(item => {
                highlightMap.set(item.word.toLowerCase(), 'person');
            });
        }
        
        if (options.places) {
            analysis.entities.places.forEach(item => {
                highlightMap.set(item.word.toLowerCase(), 'place');
            });
        }
        
        // New Categories
        if (options.abbreviations && analysis.entities.abbreviations) {
            analysis.entities.abbreviations.forEach(item => highlightMap.set(item.word.toLowerCase(), 'abbreviation'));
        }
        if (options.acronyms && analysis.entities.acronyms) {
            analysis.entities.acronyms.forEach(item => highlightMap.set(item.word.toLowerCase(), 'acronym'));
        }
        if (options.numbers && analysis.entities.numbers) {
            analysis.entities.numbers.forEach(item => {
                const numWord = item.word.toLowerCase();
                highlightMap.set(numWord, 'number');
                
                // Also add comma-formatted versions for numbers >= 1000
                const num = parseInt(numWord);
                if (!isNaN(num) && num >= 1000) {
                    // Add with comma formatting: 1000 -> "1,000"
                    const formatted = num.toLocaleString('en-US');
                    highlightMap.set(formatted.toLowerCase(), 'number');
                }
            });
        }
        if (options.currencies && analysis.entities.currencies) {
            analysis.entities.currencies.forEach(item => highlightMap.set(item.word.toLowerCase(), 'currency'));
        }
        if (options.dates && analysis.entities.dates) {
            analysis.entities.dates.forEach(item => {
                const dateWord = item.word.toLowerCase();
                highlightMap.set(dateWord, 'date');
                // Also add without punctuation for better matching
                const cleanDate = dateWord.replace(/[\/\-\.]/g, '');
                if (cleanDate !== dateWord) {
                    highlightMap.set(cleanDate, 'date');
                }
            });
        }
        if (options.crypto && analysis.entities.crypto) {
            analysis.entities.crypto.forEach(item => highlightMap.set(item.word.toLowerCase(), 'crypto'));
        }
        if (options.currencyPairs && analysis.entities.currencyPairs) {
            analysis.entities.currencyPairs.forEach(item => highlightMap.set(item.word, 'currency-pair'));
        }
        if (options.currencySymbols && analysis.entities.currencySymbols) {
            analysis.entities.currencySymbols.forEach(item => highlightMap.set(item.word, 'currency-symbol'));
        }
        
        // Apply highlights - split by whitespace AND currency symbols, but keep numbers/dates intact
        const words = html.split(/([$€£¥₹₽₪₩₫₿]|\s+)/);
        const highlightedWords = words.map(word => {
            // Try exact match first (for symbols, currency pairs etc)
            let highlightType = highlightMap.get(word);
            
            if (!highlightType) {
                // Try lowercase match
                highlightType = highlightMap.get(word.toLowerCase());
            }
            
            if (!highlightType) {
                // Try normalized match (remove commas for numbers like "1,000" -> "1000")
                const normalized = word.replace(/,/g, '');
                highlightType = highlightMap.get(normalized.toLowerCase());
            }
            
            if (!highlightType) {
                // Try clean word (stripped of punctuation except commas/periods for numbers)
                const cleanWord = word.toLowerCase().replace(/[^\w,.\-\/]/g, '');
                if (cleanWord.length > 0) {
                    highlightType = highlightMap.get(cleanWord);
                }
            }
            
            if (highlightType) {
                return `<span class="highlight-${highlightType}">${this.escapeHtml(word)}</span>`;
            }
            
            return this.escapeHtml(word);
        });
        
        return `<div style="white-space: pre-wrap;">${highlightedWords.join('')}</div>`;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize Text Analyzer
const textAnalyzer = new TextAnalyzer();

