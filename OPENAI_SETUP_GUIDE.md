# OpenAI GPT-4 Setup Guide

## Why OpenAI GPT-4?

OpenAI GPT-4 provides **superior semantic analysis** compared to free alternatives:

✅ **Better Results**
- More accurate pattern detection
- Better at understanding context
- More reliable JSON output

✅ **Higher Limits**
- Analyze 100+ sentences at once (vs 15 with Gemini)
- 128K token context window
- No strict rate limits

✅ **Very Affordable**
- ~$0.01-0.05 per document analysis
- Pay only for what you use
- No monthly fees

## Getting Started

### Step 1: Get an API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Give it a name (e.g., "Grammar Highlighter")
5. Copy the key (starts with `sk-...`)

**Important:** Save this key securely - you can't view it again!

### Step 2: Add Credits (if needed)

1. Go to [Billing](https://platform.openai.com/account/billing)
2. Add payment method
3. Add initial credit (e.g., $10)
   - This will last for 200-1000 document analyses
   - Credits don't expire

### Step 3: Configure in the App

**Option A: In the UI** (Recommended)
1. Open a document in Grammar Highlighter
2. Go to **Analyze** tab
3. Expand **🤖 AI Semantic Analysis**
4. Select **OpenAI GPT-4** from dropdown
5. Paste your API key
6. Click **💾 Save**
7. Click **🔍 Test** to verify

**Option B: In Config File**
1. Open `config.js` in project root
2. Add your key:
```javascript
ai: {
    openai: {
        apiKey: 'sk-your-key-here'
    }
}
```

## Usage

### Running Analysis

1. **Load a document** (PDF, EPUB, DOCX, etc.)
2. Go to **Analyze** tab
3. Make sure **OpenAI GPT-4** is selected
4. Click **🚀 Analyze Document**
5. Wait 5-15 seconds for results

### Understanding Results

The AI will find:
- **Semantic Groups**: Sentences with similar meanings
- **Patterns**: Common themes and concepts
- **Significance Levels**: high/medium/low importance

### Applying Results

After analysis:
- **✨ Apply Pattern Highlights**: Auto-highlight all patterns
- **📋 View Pattern Details**: See all groups and themes
- **🧠 Add to Mindmap**: Visualize relationships

## Cost Examples

Based on GPT-4 Turbo pricing (as of Dec 2024):

| Document Size | Approx. Cost |
|---------------|--------------|
| 5-10 pages    | $0.01-0.02   |
| 10-20 pages   | $0.02-0.04   |
| 20-50 pages   | $0.04-0.10   |
| 50-100 pages  | $0.10-0.20   |

**Note:** Actual costs may vary based on document complexity

## Cost Savings Tips

1. **Analyze specific sections** instead of entire long documents
2. **Use Gemini for quick tests** (free) before using OpenAI
3. **Set usage limits** in OpenAI dashboard
4. **Monitor usage** at https://platform.openai.com/usage

## Troubleshooting

### "Invalid API Key"
- Make sure key starts with `sk-`
- Check if key was copied correctly (no extra spaces)
- Verify key hasn't been revoked
- Get a new key if needed

### "Insufficient Credits"
- Add credits at https://platform.openai.com/account/billing
- Check usage at https://platform.openai.com/usage
- Minimum $5 initial credit usually required

### "Rate Limit Exceeded"
- OpenAI has generous limits (10,000+ req/day for paid tier)
- Wait a minute and try again
- Unlikely to hit this limit with document analysis

### Analysis Takes Too Long
- Normal: 5-15 seconds for most documents
- Longer documents (50+ pages) may take 20-30 seconds
- Check your internet connection
- Try a smaller document section first

## Comparison: OpenAI vs Gemini

| Feature | OpenAI GPT-4 ⭐ | Google Gemini |
|---------|----------------|---------------|
| **Cost** | ~$0.03/doc | Free |
| **Quality** | Excellent | Good |
| **Reliability** | Very High | Medium |
| **Doc Length** | 100+ sentences | 15 sentences |
| **Rate Limits** | Very High | 15/min |
| **JSON Output** | Perfect | Sometimes fails |
| **Best For** | Production use | Testing/learning |

## Privacy & Security

### What Data is Sent?
- Only the text you analyze
- No personal information
- No document metadata

### OpenAI's Data Policy
- API data is NOT used for training (as of March 2023)
- Data is not stored long-term
- GDPR compliant
- See: https://openai.com/policies/api-data-usage-policies

### Best Practices
- Don't analyze confidential documents with sensitive data
- Don't include personal information in analyzed text
- Review OpenAI's terms of service
- Consider using your own API key (not shared)

## API Models Used

The app uses `gpt-4-turbo-preview`:
- Latest GPT-4 model
- Optimized for speed and cost
- 128K context window
- JSON mode support

## Support

### Need Help?
- Check [OpenAI Documentation](https://platform.openai.com/docs)
- Visit [OpenAI Community Forum](https://community.openai.com)
- Check [Status Page](https://status.openai.com)

### Report Issues
- App issues: Submit GitHub issue
- API issues: Contact OpenAI support
- Billing issues: https://help.openai.com

## Alternative: Keep Using Gemini

If you prefer the free option:
1. Select **Google Gemini** from dropdown
2. Get free key at https://aistudio.google.com/app/apikey
3. Limited to 15 sentences per analysis
4. Free tier: 1,500 analyses per day

## FAQ

**Q: Is there a free trial?**
A: OpenAI offers $5 free credit for new accounts (as of Dec 2024). Check their website for current offers.

**Q: Can I set a spending limit?**
A: Yes! Set "Hard limit" in billing settings to prevent overspending.

**Q: What happens if I run out of credits?**
A: Analysis will fail with "insufficient credits" error. Add more credits to continue.

**Q: Can multiple people use the same key?**
A: Yes, but you'll pay for all usage. Better to have separate keys for tracking.

**Q: How do I cancel/delete my API key?**
A: Go to https://platform.openai.com/api-keys and click "Revoke" on the key.

---

**Last Updated:** December 2024  
**Version:** 1.0.0

