// AI Semantic Analyzer - Pattern Detection using Google Gemini API
class AISemanticAnalyzer {
    constructor() {
        this.apiKey = null;
        this.isAnalyzing = false;
        this.patterns = []; // Stores detected semantic patterns
        this.similarSentences = new Map(); // Map of sentence groups with similar meanings
    }
    
    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('gemini_api_key', key);
    }
    
    getApiKey() {
        if (!this.apiKey) {
            this.apiKey = localStorage.getItem('gemini_api_key');
        }
        return this.apiKey;
    }
    
    hasApiKey() {
        return !!this.getApiKey();
    }
    
    /**
     * Analyze document text for semantic patterns
     * @param {string} text - The document text to analyze
     * @param {function} progressCallback - Optional callback for progress updates
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeDocument(text, progressCallback = null) {
        if (!this.hasApiKey()) {
            throw new Error('Gemini API key not configured. Please set your API key first.');
        }
        
        if (this.isAnalyzing) {
            throw new Error('Analysis already in progress');
        }
        
        this.isAnalyzing = true;
        
        try {
            if (progressCallback) progressCallback('Preparing text...', 10);
            
            // Split text into sentences
            const sentences = this.splitIntoSentences(text);
            
            if (sentences.length < 5) {
                throw new Error('Document too short for meaningful analysis (minimum 5 sentences)');
            }
            
            if (progressCallback) progressCallback('Analyzing semantic patterns...', 30);
            
            // Call Gemini API for pattern analysis
            const analysisResult = await this.callGeminiAPI(sentences);
            
            if (progressCallback) progressCallback('Processing results...', 80);
            
            // Process and structure the results
            this.patterns = analysisResult.patterns || [];
            this.similarSentences = new Map();
            
            // Group similar sentences
            if (analysisResult.similarGroups) {
                analysisResult.similarGroups.forEach((group, index) => {
                    this.similarSentences.set(`pattern_${index}`, {
                        theme: group.theme,
                        sentences: group.sentences,
                        significance: group.significance
                    });
                });
            }
            
            if (progressCallback) progressCallback('Complete!', 100);
            
            return {
                patterns: this.patterns,
                similarGroups: Array.from(this.similarSentences.values()),
                totalSentences: sentences.length,
                patternsFound: this.patterns.length
            };
            
        } catch (error) {
            console.error('AI Analysis Error:', error);
            throw error;
        } finally {
            this.isAnalyzing = false;
        }
    }
    
    /**
     * Call Google Gemini API for semantic analysis
     */
    async callGeminiAPI(sentences) {
        const apiKey = this.getApiKey();
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        // Limit sentences for API call (to avoid token limits)
        const maxSentences = 100;
        const analyzeSentences = sentences.slice(0, maxSentences);
        
        const prompt = `Analyze the following text and identify semantic patterns - sentences or phrases that convey similar meanings but are written differently.

Instructions:
1. Find groups of sentences that express similar ideas, themes, or concepts
2. For each group, identify the common theme
3. Rate the significance of each pattern (high/medium/low)
4. Return results in JSON format

Text to analyze (${analyzeSentences.length} sentences):
${analyzeSentences.map((s, i) => `[${i}] ${s}`).join('\n')}

Return JSON in this exact format:
{
  "similarGroups": [
    {
      "theme": "brief description of the common theme",
      "sentences": [0, 5, 12],
      "significance": "high"
    }
  ],
  "patterns": [
    {
      "type": "semantic_similarity",
      "description": "brief description",
      "examples": ["sentence 1", "sentence 2"]
    }
  ]
}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.3,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    }
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
            }
            
            const data = await response.json();
            
            // Extract the generated text
            const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!generatedText) {
                throw new Error('No response from Gemini API');
            }
            
            // Parse the JSON response
            const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Could not parse API response');
            }
            
            const result = JSON.parse(jsonMatch[0]);
            
            // Map sentence indices back to actual sentences
            result.similarGroups = result.similarGroups.map(group => ({
                ...group,
                sentences: group.sentences.map(idx => analyzeSentences[idx]).filter(s => s)
            }));
            
            return result;
            
        } catch (error) {
            console.error('Gemini API call failed:', error);
            throw new Error(`API call failed: ${error.message}`);
        }
    }
    
    /**
     * Split text into sentences
     */
    splitIntoSentences(text) {
        // Simple sentence splitting (can be improved)
        return text
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => s.length > 10) // Filter out very short fragments
            .map(s => s.replace(/\s+/g, ' ')); // Normalize whitespace
    }
    
    /**
     * Create highlights for detected patterns
     */
    createPatternHighlights(notesManager, text) {
        if (!notesManager || this.similarSentences.size === 0) {
            return [];
        }
        
        const highlights = [];
        const colors = ['yellow', 'green', 'blue', 'purple', 'orange'];
        
        this.similarSentences.forEach((group, patternId) => {
            const color = colors[highlights.length % colors.length];
            
            group.sentences.forEach(sentence => {
                // Find the sentence in the full text
                const index = text.indexOf(sentence);
                if (index !== -1) {
                    const highlight = {
                        id: `ai_${Date.now()}_${Math.random()}`,
                        type: 'highlight',
                        text: sentence,
                        note: `AI Pattern: ${group.theme}`,
                        color: color,
                        page: 1,
                        createdAt: new Date().toISOString(),
                        links: [],
                        startOffset: index,
                        endOffset: index + sentence.length,
                        filePath: notesManager.currentFilePath,
                        fileName: notesManager.getFileName(notesManager.currentFilePath),
                        sourceView: 'raw',
                        aiGenerated: true, // Flag to identify AI-generated highlights
                        patternId: patternId,
                        patternTheme: group.theme
                    };
                    
                    highlights.push(highlight);
                }
            });
        });
        
        return highlights;
    }
    
    /**
     * Get analysis summary
     */
    getSummary() {
        return {
            totalPatterns: this.patterns.length,
            totalGroups: this.similarSentences.size,
            groups: Array.from(this.similarSentences.entries()).map(([id, group]) => ({
                id,
                theme: group.theme,
                count: group.sentences.length,
                significance: group.significance
            }))
        };
    }
    
    /**
     * Clear analysis results
     */
    clear() {
        this.patterns = [];
        this.similarSentences.clear();
    }
}

// Create global instance
window.aiSemanticAnalyzer = new AISemanticAnalyzer();

