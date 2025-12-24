# YouTube Transcript Import Setup Guide

> Learn how to import YouTube video transcripts for grammar analysis

---

## 🎥 Overview

The Grammar Highlighter now supports importing YouTube video transcripts directly! This feature allows you to:

- ✅ Import transcripts from any YouTube video URL
- ✅ Support for multiple languages
- ✅ Include timestamps (optional)
- ✅ Auto-generated and manual captions
- ✅ Full grammar analysis on video content
- ✅ Statistics, highlighting, and translation support

---

## 🚀 Quick Start (No API Key Required!)

The YouTube transcript import works **without an API key** for most videos using YouTube's public timedtext API!

### Basic Usage

1. Click **"File"** → **"🎥 Import YouTube Transcript..."**
2. Paste a YouTube video URL:
   - `https://www.youtube.com/watch?v=VIDEO_ID`
   - `https://youtu.be/VIDEO_ID`
   - Or just the video ID: `VIDEO_ID`
3. Select your preferred language (default: English)
4. Optionally check "Include timestamps in transcript"
5. Click **"Import Transcript"**

The transcript will be automatically loaded and analyzed!

---

## 🔑 Optional: YouTube Data API Setup (For Enhanced Features)

While the basic transcript import works without an API key, adding a YouTube Data API v3 key provides enhanced features:

- ✅ More reliable metadata fetching
- ✅ Access to video statistics (views, likes)
- ✅ Better error messages
- ✅ Higher rate limits

### Step 1: Get a YouTube Data API Key

1. **Go to Google Cloud Console**
   - Visit: [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create a New Project** (or select existing)
   - Click the project dropdown at the top
   - Click "New Project"
   - Name it (e.g., "Grammar Highlighter")
   - Click "Create"

3. **Enable YouTube Data API v3**
   - Go to "APIs & Services" → "Library"
   - Search for "YouTube Data API v3"
   - Click on it and click "Enable"

4. **Create API Credentials**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Your API key will be generated
   - **Copy the API key** (you'll need it next)

5. **Secure Your API Key** (Optional but Recommended)
   - Click on the API key you just created
   - Under "API restrictions", select "Restrict key"
   - Choose "YouTube Data API v3" from the dropdown
   - Under "Application restrictions", you can restrict by:
     - IP addresses (if using on specific machines)
     - Or leave unrestricted for desktop use
   - Click "Save"

### Step 2: Add API Key to Grammar Highlighter

#### Option A: Via Configuration File (Recommended)

1. Open your Grammar Highlighter installation folder
2. Find the `config.js` file
3. Add your API key:

```javascript
module.exports = {
    google: {
        clientId: 'YOUR_GOOGLE_CLIENT_ID',
        clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET',
        redirectUri: 'http://localhost/callback'
    },
    // YouTube Data API v3
    youtube: {
        apiKey: 'YOUR_YOUTUBE_API_KEY_HERE' // ← Paste your key here
    },
    // ... rest of config
};
```

4. Save the file
5. Restart Grammar Highlighter

#### Option B: Set in Environment (Advanced)

You can also set the API key as an environment variable:

**Windows:**
```bash
setx YOUTUBE_API_KEY "your_api_key_here"
```

**Mac/Linux:**
```bash
export YOUTUBE_API_KEY="your_api_key_here"
```

---

## 📖 How to Use

### 1. Import a Transcript

**From the Menu:**
1. Click **"File"** in the toolbar
2. Select **"🎥 Import YouTube Transcript..."**
3. The import dialog will appear

**Supported URL Formats:**
- Standard: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- Short: `https://youtu.be/dQw4w9WgXcQ`
- Embed: `https://www.youtube.com/embed/dQw4w9WgXcQ`
- Mobile: `https://m.youtube.com/watch?v=dQw4w9WgXcQ`
- Video ID only: `dQw4w9WgXcQ`

### 2. Configure Options

**Language Selection:**
- Choose from 12+ supported languages
- Default: English
- If the selected language isn't available, the import will show an error

**Include Timestamps:**
- ☑️ Check to include timestamps like `[0:45] This is the text...`
- ☐ Uncheck for plain text transcript (recommended for analysis)

### 3. Import Process

The import happens in stages:
1. **Fetching video information** - Validates URL and gets video details
2. **Fetching video metadata** - Gets title, channel, views, etc. (if API key configured)
3. **Fetching transcript** - Downloads the captions
4. **Processing transcript** - Formats and prepares for analysis
5. **Adding to library** - Saves to your document library
6. **Loading transcript** - Displays in the viewer

Progress is shown in real-time with a progress bar.

### 4. Analyze the Transcript

Once imported:
- The transcript appears in the **Document Viewer** with video metadata
- Automatically switches to the **Analyze** tab
- Click **"✨ Analyze Text"** to run grammar analysis
- Use all standard features: highlighting, statistics, translation, notes

---

## 🎨 Features

### Video Metadata Display

When you import a transcript, you'll see:
- 🖼️ **Video thumbnail** (if available)
- 📺 **Video title**
- 👤 **Channel name**
- 📅 **Publication date**
- 📊 **Word count**
- ⚠️ **Auto-generated caption indicator**
- 🔗 **Link to view on YouTube**

### Grammar Analysis

Apply all Grammar Highlighter features to the transcript:
- **Parts of Speech Highlighting**: Nouns, Verbs, Adjectives, etc.
- **Named Entity Recognition**: People, Places, Organizations
- **Statistics**: Word frequency, unique insights, top words
- **Translation**: Translate transcript to other languages
- **Notes & Highlights**: Add annotations to specific parts
- **Search**: Find words or phrases in the transcript

### Library Integration

Imported transcripts are saved in your library:
- 📁 Appears in the **Library** panel
- 💾 Stored with full metadata
- 🔄 Syncs with Google Drive (if enabled)
- 📝 Notes and highlights persist across sessions

---

## 🌍 Supported Languages

The following languages are available in the language selector:

| Language | Code | Language | Code |
|----------|------|----------|------|
| English | `en` | Spanish | `es` |
| French | `fr` | German | `de` |
| Italian | `it` | Portuguese | `pt` |
| Russian | `ru` | Japanese | `ja` |
| Korean | `ko` | Chinese | `zh` |
| Arabic | `ar` | Hindi | `hi` |

**Note:** Language availability depends on the video. Not all videos have captions in all languages.

---

## 📝 Use Cases

### 1. Educational Content Analysis
- Import lecture transcripts
- Analyze teaching vocabulary and grammar patterns
- Identify key concepts through entity extraction
- Create study notes with highlights

### 2. Content Creation
- Analyze successful videos in your niche
- Study vocabulary and phrasing patterns
- Extract quotes and key points
- Compare grammar patterns across videos

### 3. Language Learning
- Import videos in your target language
- Analyze grammar structures
- Extract vocabulary lists from statistics
- Translate and compare with original

### 4. Research & Documentation
- Import interview transcripts
- Extract named entities (people, places, organizations)
- Analyze word frequency and patterns
- Create comprehensive notes with cross-references

### 5. Accessibility
- Convert video content to text for easier consumption
- Search through video content
- Create permanent text records of video information

---

## ❓ Troubleshooting

### "Invalid YouTube URL"
**Problem:** The URL you entered is not recognized.

**Solution:**
- Make sure you're using a valid YouTube URL format
- Try copying the URL directly from your browser's address bar
- If using a playlist URL, extract the individual video URL instead

### "No captions available for this video"
**Problem:** The video doesn't have captions in the selected language.

**Solution:**
- Try selecting a different language (especially English)
- Check if the video has captions by visiting it on YouTube
- Some videos don't have captions at all (creator's choice)
- Private or age-restricted videos may not be accessible

### "Failed to fetch video metadata"
**Problem:** Can't retrieve video information.

**Solution:**
- Check your internet connection
- If using an API key, verify it's correct and has proper permissions
- The video might be private, deleted, or region-restricted
- Try again in a few moments (might be a temporary issue)

### "YouTube API key not configured"
**Problem:** You're seeing this warning but the import still works.

**Solution:**
- This is just a notice - the import works without an API key!
- If you want enhanced features, follow the API setup steps above
- You can safely ignore this message for basic usage

### "Request timeout"
**Problem:** The import is taking too long.

**Solution:**
- Check your internet connection
- Try a shorter video first
- The transcript might be very long - be patient
- Try again later if YouTube's servers are slow

### Import Succeeds But Text is Garbled
**Problem:** The transcript text looks incorrect or has encoding issues.

**Solution:**
- This is usually due to auto-generated captions being imperfect
- Try looking for the same content from a channel with manual captions
- The grammar analysis will still work, but accuracy may be lower

---

## 🔒 Privacy & Data

### What Gets Sent to YouTube?
When you import a transcript:
- Your IP address (standard web request)
- The video ID you're requesting
- Language preference

**No personal data** from the Grammar Highlighter app is sent to YouTube.

### What Gets Stored Locally?
- The full transcript text
- Video metadata (title, channel, date, etc.)
- Your notes and highlights on the transcript
- Timestamp information (if you chose to include it)

### Google Drive Sync
If you have Google Drive sync enabled:
- Transcripts are saved to your private Drive storage
- Only metadata and your notes are synced
- You have full control over this data

---

## 🎯 Tips & Best Practices

### 1. Choose the Right Language
- Always select the language the video is spoken in
- Auto-generated captions work best for popular languages (English, Spanish, etc.)
- Manual captions are more accurate than auto-generated

### 2. Timestamps vs. Plain Text
- **With timestamps**: Better for referencing specific moments
- **Without timestamps**: Better for grammar analysis and reading flow
- You can always view the original video alongside for context

### 3. Video Length
- Short videos (< 10 minutes): Import instantly
- Medium videos (10-30 minutes): Take a few seconds
- Long videos (30+ minutes): May take 10-30 seconds
- Very long videos (1+ hour): Be patient, grab a coffee ☕

### 4. Caption Quality
- Professionally captioned videos = best accuracy
- Auto-generated captions = good enough for most analysis
- Heavy accents or technical jargon = lower accuracy in auto-generated
- Music videos = often poor or no captions

### 5. Analysis Workflow
- Import transcript → Analyze grammar → View statistics → Create notes
- Use the **Map** view to see the structure of longer transcripts
- **Search** feature is great for finding specific topics
- Export statistics to compare multiple videos

---

## 🆘 Getting Help

### Still Having Issues?

1. **Check the Console**
   - Press `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
   - Look at the Console tab for error messages
   - Share these errors when reporting issues

2. **Report a Bug**
   - Visit: [GitHub Issues](https://github.com/dnaicker/Document-X-Ray-Analyzer/issues)
   - Include:
     - Error message (if any)
     - Video URL (if not private)
     - Language selected
     - Whether you have an API key configured

3. **Community Support**
   - Check existing documentation
   - Search GitHub Issues for similar problems
   - Create a new issue with details

---

## 🚀 Advanced Usage

### Batch Import (Coming Soon)
- Import multiple videos at once
- Create playlists of transcripts
- Bulk analysis of video series

### Custom Language Models (Future)
- Support for more language providers
- Better accuracy for technical content
- Domain-specific vocabulary recognition

### Integration Ideas
- Create highlights at specific timestamps
- Link notes between multiple video transcripts
- Compare grammar patterns across videos
- Extract and organize quotes by topic

---

## 📚 Related Documentation

- [Google Drive Setup Guide](GOOGLE_DRIVE_SETUP.md) - Sync your transcripts
- [Features Guide](FEATURES.md) - All available features
- [Quick Start Guide](QUICK_START.md) - Get started quickly
- [Setup Guide](SETUP_GUIDE.md) - General setup instructions

---

## 🎉 Success!

You're now ready to import and analyze YouTube transcripts! This opens up a whole new world of content analysis - from educational videos to podcasts, interviews, and more.

**Happy analyzing! 📚✨**

---

**Last Updated:** December 2025  
**Version:** 3.3.0

