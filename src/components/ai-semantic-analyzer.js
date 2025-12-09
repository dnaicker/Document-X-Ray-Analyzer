// AI Semantic Analyzer - Pattern Detection using OpenAI GPT-4 or Google Gemini API
class AISemanticAnalyzer {
    constructor() {
        this.apiKeys = {
            openai: null,
            gemini: null,
            ollama: null // No key needed, just endpoint
        };
        this.ollamaEndpoint = 'http://localhost:11434';
        this.ollamaModel = 'llama3.2'; // Default model
        this.provider = 'ollama'; // Default to Ollama (free & local)
        this.isAnalyzing = false;
        this.patterns = []; // Stores detected semantic patterns
        this.similarSentences = new Map(); // Map of sentence groups with similar meanings
        
        // Load Ollama settings
        const savedEndpoint = localStorage.getItem('ollama_endpoint');
        const savedModel = localStorage.getItem('ollama_model');
        if (savedEndpoint) this.ollamaEndpoint = savedEndpoint;
        if (savedModel) this.ollamaModel = savedModel;
    }
    
    setApiKey(key, provider = 'openai') {
        this.apiKeys[provider] = key;
        localStorage.setItem(`${provider}_api_key`, key);
        this.provider = provider;
        localStorage.setItem('ai_provider', provider);
    }
    
    getApiKey(provider = null) {
        const activeProvider = provider || this.provider;
        if (!this.apiKeys[activeProvider]) {
            this.apiKeys[activeProvider] = localStorage.getItem(`${activeProvider}_api_key`);
        }
        return this.apiKeys[activeProvider];
    }
    
    setProvider(provider) {
        this.provider = provider;
        localStorage.setItem('ai_provider', provider);
    }
    
    getProvider() {
        if (!this.provider) {
            this.provider = localStorage.getItem('ai_provider') || 'openai';
        }
        return this.provider;
    }
    
    hasApiKey(provider = null) {
        const activeProvider = provider || this.provider;
        // Ollama doesn't need an API key
        if (activeProvider === 'ollama') return true;
        return !!this.getApiKey(provider);
    }
    
    setOllamaConfig(endpoint, model) {
        this.ollamaEndpoint = endpoint;
        this.ollamaModel = model;
        localStorage.setItem('ollama_endpoint', endpoint);
        localStorage.setItem('ollama_model', model);
    }
    
    getOllamaConfig() {
        return {
            endpoint: this.ollamaEndpoint,
            model: this.ollamaModel
        };
    }
    
    /**
     * Analyze document text for semantic patterns
     * @param {string} text - The document text to analyze
     * @param {function} progressCallback - Optional callback for progress updates
     * @returns {Promise<Object>} Analysis results
     */
    async analyzeDocument(text, progressCallback = null) {
        const provider = this.getProvider();
        
        if (!this.hasApiKey(provider)) {
            throw new Error(`${provider === 'openai' ? 'OpenAI' : 'Gemini'} API key not configured. Please set your API key first.`);
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
            
            // Call appropriate API based on provider
            let analysisResult;
            if (provider === 'openai') {
                analysisResult = await this.callOpenAIAPI(sentences);
            } else if (provider === 'ollama') {
                analysisResult = await this.callOllamaAPI(sentences);
            } else {
                analysisResult = await this.callGeminiAPI(sentences);
            }
            
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
                patternsFound: this.patterns.length,
                provider: provider
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
        
        // Try multiple model names (Google AI Studio models - updated for 2.0/2.5)
        const modelNames = [
            'gemini-2.5-flash',      // Latest fast model (Dec 2024)
            'gemini-2.0-flash',      // Stable fast model
            'gemini-2.5-pro',        // Pro model
            'gemini-2.0-flash-001'   // Fallback
        ];
        
        // Limit sentences for API call (to avoid token limits)
        // Gemini has strict limits, start very small
        const maxSentences = 15;
        const analyzeSentences = sentences.slice(0, maxSentences);
        
        if (sentences.length > maxSentences) {
            console.log(`Document has ${sentences.length} sentences, analyzing first ${maxSentences}`);
        }
        
        const prompt = `You are a JSON-only API. Analyze the text and find sentence groups with similar meanings.

Text (${analyzeSentences.length} sentences):
${analyzeSentences.map((s, i) => `[${i}] ${s}`).join('\n')}

Return ONLY this JSON structure (no markdown, no explanation):
{
  "similarGroups": [
    {
      "theme": "brief theme description",
      "sentences": [0, 5],
      "significance": "high"
    }
  ],
  "patterns": [
    {
      "type": "semantic_similarity",
      "description": "brief description",
      "examples": ["example 1", "example 2"]
    }
  ]
}

Empty arrays if no patterns found.`;

        // Try each model until one works
        let lastError = null;
        
        for (const modelName of modelNames) {
            try {
                const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${apiKey}`;
                console.log(`Trying model: ${modelName}`);
                
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
                            temperature: 0.2,
                            topK: 32,
                            topP: 0.9,
                            maxOutputTokens: 4096
                        }
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errorMsg = errorData.error?.message || response.statusText;
                    
                    // If model not found, try next one
                    if (errorMsg.includes('not found') || errorMsg.includes('not supported')) {
                        lastError = new Error(`Model ${modelName} not available: ${errorMsg}`);
                        console.warn(`Trying next model after error with ${modelName}:`, errorMsg);
                        continue;
                    }
                    
                    throw new Error(`Gemini API error: ${errorMsg}`);
                }
                
                const data = await response.json();
                
                // Debug: Log the response structure
                console.log('API Response:', JSON.stringify(data, null, 2));
                
                // Extract the generated text
                const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (!generatedText) {
                    console.error('No text found in response. Full response:', data);
                    
                    // Check if there's a safety block or other issue
                    if (data.candidates?.[0]?.finishReason) {
                        throw new Error(`Gemini blocked response. Reason: ${data.candidates[0].finishReason}. Try with a shorter document.`);
                    }
                    
                    throw new Error('No response from Gemini API. Check console for details.');
                }
                
                // Parse the JSON response (handle markdown wrapping)
                let jsonText = generatedText.trim();
                
                // Remove markdown code blocks if present
                if (jsonText.startsWith('```')) {
                    jsonText = jsonText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
                }
                
                // Extract JSON object
                const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    console.error('Could not find JSON in response:', generatedText);
                    throw new Error('Could not parse API response - no JSON found');
                }
                
                let result;
                try {
                    result = JSON.parse(jsonMatch[0]);
                } catch (parseError) {
                    console.error('JSON parse error:', parseError);
                    console.error('Attempted to parse:', jsonMatch[0]);
                    throw new Error('Invalid JSON in API response');
                }
                
                // Validate result structure
                if (!result.similarGroups || !Array.isArray(result.similarGroups)) {
                    console.warn('No similarGroups in response, initializing empty array');
                    result.similarGroups = [];
                }
                if (!result.patterns || !Array.isArray(result.patterns)) {
                    console.warn('No patterns in response, initializing empty array');
                    result.patterns = [];
                }
                
                // Map sentence indices back to actual sentences
                result.similarGroups = result.similarGroups.map(group => ({
                    ...group,
                    sentences: group.sentences.map(idx => analyzeSentences[idx]).filter(s => s)
                }));
                
                console.log(`✓ Successfully used model: ${modelName}`);
                return result;
                
            } catch (error) {
                lastError = error;
                // If it's a model-not-found error, continue to next model
                if (error.message.includes('not found') || error.message.includes('not supported')) {
                    console.warn(`Model ${modelName} failed, trying next...`);
                    continue;
                }
                // For other errors, break and throw
                break;
            }
        }
        
        // If we get here, all models failed
        console.error('All Gemini models failed:', lastError);
        
        // Check if it's an API key issue
        if (lastError?.message.includes('API_KEY_INVALID') || lastError?.message.includes('invalid') || lastError?.message.includes('403')) {
            throw new Error('Invalid API key. Please get a new key from Google AI Studio: https://aistudio.google.com/app/apikey');
        }
        
        // Provide helpful error message
        const errorMsg = `All models failed. ${lastError?.message || 'Unknown error'}

Troubleshooting:
1. Make sure your API key is from Google AI Studio (https://aistudio.google.com/app/apikey)
2. Check if you have API quota remaining (free tier: 15 requests/min)
3. Try the 🔍 Test button to see which models are available
4. Wait a minute and try again

Models attempted: ${modelNames.join(', ')}`;
        
        throw new Error(errorMsg);
    }
    
    /**
     * Call OpenAI GPT-4 API for semantic analysis
     */
    async callOpenAIAPI(sentences) {
        const apiKey = this.getApiKey('openai');
        const apiUrl = 'https://api.openai.com/v1/chat/completions';
        
        // OpenAI can handle more sentences with its larger context
        const maxSentences = 100;
        const analyzeSentences = sentences.slice(0, maxSentences);
        
        const prompt = `Analyze this text and find groups of sentences with similar meanings.

Text (${analyzeSentences.length} sentences):
${analyzeSentences.map((s, i) => `[${i}] ${s}`).join('\n')}

Find sentence groups that express similar ideas. Return ONLY valid JSON:
{
  "similarGroups": [
    {
      "theme": "theme description",
      "sentences": [0, 5, 12],
      "significance": "high"
    }
  ],
  "patterns": [
    {
      "type": "semantic_similarity",
      "description": "pattern description",
      "examples": ["example 1", "example 2"]
    }
  ]
}

Empty arrays if no patterns found.`;

        try {
            console.log('Calling OpenAI GPT-4 API...');
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4-turbo-preview',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a semantic analysis assistant that returns only valid JSON.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.3,
                    max_tokens: 4096
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = errorData.error?.message || response.statusText;
                
                if (response.status === 401) {
                    throw new Error('Invalid OpenAI API key. Get one at: https://platform.openai.com/api-keys');
                }
                
                throw new Error(`OpenAI API error: ${errorMsg}`);
            }
            
            const data = await response.json();
            console.log('OpenAI Response:', JSON.stringify(data, null, 2));
            
            // Extract the generated text
            const generatedText = data.choices?.[0]?.message?.content;
            
            if (!generatedText) {
                console.error('No content in OpenAI response:', data);
                throw new Error('No response from OpenAI API');
            }
            
            // Parse JSON response
            let result;
            try {
                result = JSON.parse(generatedText);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Response text:', generatedText);
                throw new Error('Invalid JSON in OpenAI response');
            }
            
            // Validate result structure
            if (!result.similarGroups || !Array.isArray(result.similarGroups)) {
                console.warn('No similarGroups in response, initializing empty array');
                result.similarGroups = [];
            }
            if (!result.patterns || !Array.isArray(result.patterns)) {
                console.warn('No patterns in response, initializing empty array');
                result.patterns = [];
            }
            
            // Map sentence indices back to actual sentences
            result.similarGroups = result.similarGroups.map(group => ({
                ...group,
                sentences: group.sentences.map(idx => analyzeSentences[idx]).filter(s => s)
            }));
            
            console.log('✓ Successfully analyzed with OpenAI GPT-4');
            return result;
            
        } catch (error) {
            console.error('OpenAI API call failed:', error);
            throw new Error(`OpenAI API failed: ${error.message}`);
        }
    }
    
    /**
     * Call local Ollama API for semantic analysis
     */
    async callOllamaAPI(sentences) {
        const { endpoint, model } = this.getOllamaConfig();
        const apiUrl = `${endpoint}/api/generate`;
        
        // Ollama can handle decent-sized context
        const maxSentences = 50;
        const analyzeSentences = sentences.slice(0, maxSentences);
        
        const prompt = `Analyze this text and find groups of sentences with similar meanings.

Text (${analyzeSentences.length} sentences):
${analyzeSentences.map((s, i) => `[${i}] ${s}`).join('\n')}

Find sentence groups that express similar ideas. Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "similarGroups": [
    {
      "theme": "theme description",
      "sentences": [0, 5, 12],
      "significance": "high"
    }
  ],
  "patterns": [
    {
      "type": "semantic_similarity",
      "description": "pattern description",
      "examples": ["example 1", "example 2"]
    }
  ]
}

Empty arrays if no patterns found.`;

        try {
            console.log(`Calling local Ollama API at ${endpoint} with model ${model}...`);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    prompt: prompt,
                    stream: false,
                    format: "json",
                    options: {
                        temperature: 0.3,
                        num_predict: 2048
                    }
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                
                if (response.status === 404) {
                    throw new Error(`Ollama not found at ${endpoint}. Is Ollama running? Start it with: ollama serve`);
                }
                
                throw new Error(`Ollama API error: ${errorText || response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Ollama Response received');
            
            // Extract the generated text
            const generatedText = data.response;
            
            if (!generatedText) {
                console.error('No response from Ollama:', data);
                throw new Error('No response from Ollama API');
            }
            
            // Parse JSON response
            let result;
            try {
                // Ollama sometimes wraps in markdown, clean it
                let cleanText = generatedText.trim();
                if (cleanText.startsWith('```')) {
                    cleanText = cleanText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
                }
                
                const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
                if (!jsonMatch) {
                    console.error('No JSON found in response:', generatedText);
                    throw new Error('Could not parse JSON from Ollama response');
                }
                
                result = JSON.parse(jsonMatch[0]);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Response text:', generatedText);
                throw new Error('Invalid JSON in Ollama response. Try a different model or smaller document.');
            }
            
            // Validate result structure
            if (!result.similarGroups || !Array.isArray(result.similarGroups)) {
                console.warn('No similarGroups in response, initializing empty array');
                result.similarGroups = [];
            }
            if (!result.patterns || !Array.isArray(result.patterns)) {
                console.warn('No patterns in response, initializing empty array');
                result.patterns = [];
            }
            
            // Map sentence indices back to actual sentences
            result.similarGroups = result.similarGroups.map(group => ({
                ...group,
                sentences: group.sentences.map(idx => analyzeSentences[idx]).filter(s => s)
            }));
            
            console.log(`✓ Successfully analyzed with Ollama (${model})`);
            return result;
            
        } catch (error) {
            console.error('Ollama API call failed:', error);
            
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                throw new Error(`Cannot connect to Ollama at ${endpoint}. Make sure Ollama is running:\n\n1. Open terminal\n2. Run: ollama serve\n3. Try analysis again`);
            }
            
            throw new Error(`Ollama failed: ${error.message}`);
        }
    }
    
    /**
     * Test API key and list available models
     */
    async testApiKey(provider = null) {
        const activeProvider = provider || this.getProvider();
        
        if (activeProvider === 'ollama') {
            // Test Ollama connection
            const { endpoint, model } = this.getOllamaConfig();
            
            try {
                // First check if Ollama is running
                const response = await fetch(`${endpoint}/api/tags`);
                
                if (!response.ok) {
                    throw new Error(`Cannot connect to Ollama at ${endpoint}`);
                }
                
                const data = await response.json();
                const models = data.models || [];
                
                return {
                    valid: true,
                    provider: 'ollama',
                    endpoint: endpoint,
                    currentModel: model,
                    availableModels: models.map(m => m.name)
                };
            } catch (error) {
                return {
                    valid: false,
                    provider: 'ollama',
                    error: `Ollama not running. Start it with: ollama serve`
                };
            }
        }
        
        const apiKey = this.getApiKey(activeProvider);
        
        if (!apiKey) {
            throw new Error(`No ${activeProvider} API key configured`);
        }
        
        if (activeProvider === 'openai') {
            // Test OpenAI API
            try {
                const response = await fetch('https://api.openai.com/v1/models', {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`
                    }
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`API key test failed: ${errorData.error?.message || response.statusText}`);
                }
                
                const data = await response.json();
                const models = data.data || [];
                
                return {
                    valid: true,
                    provider: 'openai',
                    availableModels: models
                        .filter(m => m.id.includes('gpt-4') || m.id.includes('gpt-3.5'))
                        .map(m => m.id)
                        .slice(0, 10) // Limit to first 10
                };
            } catch (error) {
                return {
                    valid: false,
                    provider: 'openai',
                    error: error.message
                };
            }
        } else {
            // Test Gemini API
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`API key test failed: ${errorData.error?.message || response.statusText}`);
                }
                
                const data = await response.json();
                const models = data.models || [];
                
                return {
                    valid: true,
                    provider: 'gemini',
                    availableModels: models
                        .filter(m => m.name.includes('gemini') && m.supportedGenerationMethods?.includes('generateContent'))
                        .map(m => m.name.replace('models/', ''))
                };
            } catch (error) {
                return {
                    valid: false,
                    provider: 'gemini',
                    error: error.message
                };
            }
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
        const usedPositions = new Set(); // Track which text positions have been highlighted
        
        this.similarSentences.forEach((group, patternId) => {
            const color = colors[highlights.length % colors.length];
            
            // Create a comprehensive note with all related sentences in this pattern
            const patternNote = this.createPatternNote(group, group.sentences.length);
            
            group.sentences.forEach(sentence => {
                // Find ALL occurrences of the sentence in the text
                let searchIndex = 0;
                let foundAny = false;
                
                while (searchIndex < text.length) {
                    const index = text.indexOf(sentence, searchIndex);
                    
                    if (index === -1) break; // No more occurrences
                    
                    // Check if this position is already highlighted
                    const positionKey = `${index}-${index + sentence.length}`;
                    if (!usedPositions.has(positionKey)) {
                        const highlight = {
                            id: `ai_${Date.now()}_${Math.random()}`,
                            type: 'highlight',
                            text: sentence,
                            note: patternNote, // Use comprehensive note with all related sentences
                            color: color,
                            page: 1,
                            createdAt: new Date().toISOString(),
                            links: [],
                            tags: [{ name: 'ai', color: 'purple' }], // Add AI tag
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
                        usedPositions.add(positionKey);
                        foundAny = true;
                    }
                    
                    // Move search position forward
                    searchIndex = index + 1;
                }
                
                // If sentence wasn't found at all, log a warning
                if (!foundAny) {
                    console.warn('AI pattern sentence not found in text:', sentence.substring(0, 50) + '...');
                }
            });
        });
        
        return highlights;
    }
    
    /**
     * Create a comprehensive note showing the pattern theme and all related sentences
     */
    createPatternNote(group, totalCount) {
        let note = `🤖 AI Pattern: ${group.theme}\n`;
        note += `📊 ${totalCount} related sentence${totalCount > 1 ? 's' : ''} found in this pattern:\n\n`;
        
        // Add all sentences with numbering
        group.sentences.forEach((sentence, idx) => {
            const truncated = sentence.length > 150 ? sentence.substring(0, 150) + '...' : sentence;
            note += `${idx + 1}. "${truncated}"\n\n`;
        });
        
        return note.trim();
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

