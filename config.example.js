// Copy this file to config.js and add your own credentials
module.exports = {
    google: {
        clientId: 'YOUR_GOOGLE_CLIENT_ID',
        clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET',
        redirectUri: 'http://localhost/callback'
    },
    // Google Gemini API (for AI semantic analysis)
    // Get your free API key at: https://makersuite.google.com/app/apikey
    // Note: API key can also be entered directly in the app UI
    gemini: {
        apiKey: 'YOUR_GEMINI_API_KEY' // Optional: Add your Gemini API key here, or configure in the app
    }
};

