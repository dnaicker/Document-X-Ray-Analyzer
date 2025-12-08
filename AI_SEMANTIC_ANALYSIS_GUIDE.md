# AI Semantic Analysis Feature Guide

## Overview

The AI Semantic Analysis feature uses Google's Gemini AI to intelligently analyze your documents and identify patterns of sentences that convey similar meanings, even when written differently. This powerful feature helps you:

- 🔍 **Discover hidden patterns** in your documents
- 📊 **Identify recurring themes** across different sections
- 🎨 **Auto-highlight** semantically similar content
- 🧠 **Visualize relationships** in the mindmap

## Getting Started

### 1. Obtain a Free Gemini API Key

Google Gemini API offers a generous **free tier** that's perfect for document analysis:

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

**Free Tier Limits:**
- 60 requests per minute
- 1,500 requests per day
- Perfect for analyzing multiple documents

### 2. Configure Your API Key

You have two options to add your API key:

#### Option A: Through the App UI (Recommended)
1. Open a document in Grammar Highlighter
2. In the Analysis panel, expand the **🤖 AI Semantic Analysis** section
3. Paste your API key in the input field
4. Click the 💾 Save button

Your key will be securely stored locally in your browser.

#### Option B: Via Configuration File
1. Open `config.js` in the project root
2. Add your API key to the `gemini` section:
```javascript
gemini: {
    apiKey: 'YOUR_API_KEY_HERE'
}
```

## How to Use

### Step 1: Load a Document
Open any supported document format (PDF, EPUB, DOCX, TXT, MD)

### Step 2: Run Analysis
1. Navigate to the **Analyze** tab
2. Scroll down to the **🤖 AI Semantic Analysis** section
3. Click **🚀 Analyze Document**

The AI will analyze your document and identify semantic patterns. This typically takes 10-30 seconds depending on document length.

### Step 3: Review Results
Once analysis is complete, you'll see:
- Number of patterns found
- Number of semantic groups discovered
- Total sentences analyzed

### Step 4: Apply Highlights
Click **✨ Apply Pattern Highlights** to automatically highlight all semantically similar sentences in your document. Each pattern group will be assigned a different color.

### Step 5: View Pattern Details
Click **📋 View Pattern Details** to see:
- Each pattern's theme/topic
- Number of similar sentences
- Significance level (high/medium/low)

### Step 6: Visualize in Mindmap
Click **🧠 Add to Mindmap** to create a visual representation:
- Each pattern becomes a parent node
- Similar sentences become child nodes
- Color-coded by pattern group

## Example Use Cases

### Academic Research
**Scenario:** Analyzing a research paper to find recurring methodological approaches

**Result:** The AI identifies sentences discussing "data collection methods" across different sections, even when phrased differently:
- "We gathered information through surveys"
- "Data was collected via questionnaire distribution"
- "Information acquisition utilized survey methodology"

### Legal Documents
**Scenario:** Reviewing a contract for similar obligations or clauses

**Result:** Identifies liability clauses scattered throughout the document that express the same legal concept with different wording.

### Technical Documentation
**Scenario:** Finding inconsistent descriptions of the same feature

**Result:** Highlights where the same functionality is described differently, helping you standardize terminology.

### Literature Analysis
**Scenario:** Identifying thematic patterns in a novel

**Result:** Groups sentences expressing similar themes (e.g., "hope," "redemption," "loss") across chapters.

## Understanding the Results

### Pattern Significance Levels

- **🟢 High:** Strong semantic similarity, clear pattern
- **🟡 Medium:** Moderate similarity, possible pattern
- **⚫ Low:** Weak similarity, potential pattern

### Pattern Grouping

The AI groups sentences based on:
1. **Semantic meaning** - What the sentence conveys
2. **Conceptual similarity** - Related ideas and themes
3. **Contextual relevance** - How sentences relate to the topic

## Features

### Auto-Highlighting
- Each pattern group gets a unique color
- Highlights appear in the Analyze tab
- Click any highlight to see its note
- Notes include the pattern theme

### Mindmap Integration
- Pattern themes become parent nodes
- Similar sentences become child nodes
- Visual connections show relationships
- Interactive nodes for exploration

### Notes Integration
- AI-generated highlights appear in the Notes tab
- Searchable by pattern theme
- Can be edited, tagged, and linked
- Export alongside manual notes

## Tips for Best Results

### Document Length
- **Optimal:** 500-5000 words
- **Minimum:** 5 sentences required
- **Maximum:** First 100 sentences analyzed (API limit)

### Document Type
Works best with:
- ✅ Narrative text (articles, essays, stories)
- ✅ Technical documentation
- ✅ Academic papers
- ✅ Legal documents
- ⚠️ Lists and bullet points (limited)
- ⚠️ Tables and forms (not supported)

### Language
- Supports all languages supported by Gemini
- Best results with English content
- Multilingual documents may have mixed results

## Privacy & Security

### Data Privacy
- Your API key is stored **locally** in your browser
- Document text is sent to Google's Gemini API for analysis
- No data is stored on external servers beyond API processing
- Analysis results are stored locally only

### API Key Security
- Never share your API key publicly
- Don't commit API keys to version control
- Regenerate your key if compromised
- Use environment-specific keys for development vs production

## Troubleshooting

### "No API key configured"
**Solution:** Add your Gemini API key in the AI Analysis section or config file

### "Document too short"
**Solution:** The document must have at least 5 sentences for meaningful analysis

### "API call failed"
**Possible causes:**
- Invalid API key
- Rate limit exceeded (free tier: 60/min, 1500/day)
- Network connectivity issues
- API service temporarily unavailable

**Solutions:**
- Verify your API key is correct
- Wait a few minutes if you hit rate limits
- Check your internet connection
- Try again later if Google's service is down

### "No patterns found"
**Possible causes:**
- Document is too technical/specialized
- Very short document
- Highly unique content with no repetition

**Solutions:**
- Try a longer document
- Analyze narrative or descriptive text
- Adjust your expectations for highly technical content

## API Costs

### Free Tier
- **Cost:** $0
- **Requests:** 1,500/day, 60/minute
- **Perfect for:** Individual use, small projects

### If You Need More
If you exceed free tier limits:
1. Wait for the daily reset (midnight Pacific Time)
2. Consider upgrading to Google AI's paid tier (pay-as-you-go)
3. Typical cost: $0.00025 per request (very affordable)

## Technical Details

### How It Works
1. Document text is split into sentences
2. Sentences are sent to Gemini AI via API
3. AI analyzes semantic meaning and patterns
4. Results are structured as pattern groups
5. Highlights are created based on patterns
6. Mindmap nodes are generated for visualization

### API Model
- **Model:** Gemini 1.5 Flash
- **Why:** Fast, efficient, and cost-effective
- **Context window:** Up to 1M tokens
- **Response time:** Typically 2-5 seconds

### Data Processing
- Sentence splitting uses simple regex patterns
- Minimum sentence length: 10 characters
- Whitespace normalization applied
- First 100 sentences analyzed (API optimization)

## Keyboard Shortcuts

Currently no dedicated shortcuts. Use mouse/touch to interact with:
- API key input
- Analysis button
- Results panels

## Future Enhancements

Planned features:
- 🔄 Batch analysis for multiple documents
- 📈 Trend analysis over time
- 🎯 Custom pattern detection rules
- 💾 Export analysis reports
- 🌐 Multi-language pattern detection
- 🔗 Cross-document pattern comparison

## Support

### Need Help?
- Check this guide first
- Review the troubleshooting section
- Check Google Gemini API status
- Submit an issue on GitHub

### Provide Feedback
Your feedback helps improve this feature:
- Report bugs
- Suggest improvements
- Share use cases
- Request new features

## Credits

- **AI Model:** Google Gemini 1.5 Flash
- **Integration:** Grammar Highlighter Team
- **Free API:** Provided by Google AI

---

**Last Updated:** December 2025
**Version:** 1.0.0

