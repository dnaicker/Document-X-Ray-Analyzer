// Copy this file to config.js and add your own credentials
module.exports = {
    google: {
        clientId: 'YOUR_GOOGLE_CLIENT_ID',
        clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET',
        redirectUri: 'http://localhost/callback'
    },
    // AI Semantic Analysis APIs
    // Note: API keys can also be entered directly in the app UI
    ai: {
        // OpenAI API (Recommended - better results, paid)
        // Get key at: https://platform.openai.com/api-keys
        // Cost: ~$0.03 per document analysis
        openai: {
            apiKey: 'YOUR_OPENAI_API_KEY' // Optional: Add your OpenAI API key here, or configure in the app
        },
        
        // Google Gemini API (Free tier available, limited)
        // Get key at: https://aistudio.google.com/app/apikey
        // Free: 15 requests/min, 1500/day
        gemini: {
            apiKey: 'YOUR_GEMINI_API_KEY' // Optional: Add your Gemini API key here, or configure in the app
        }
    }
};

