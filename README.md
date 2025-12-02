# Document X-Ray Analyzer

> A powerful desktop application for deep document analysis with advanced NLP, multi-language translation, and intelligent highlighting.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/dnaicker/Document-X-Ray-Analyzer)

[Download](https://dnaicker.github.io/Document-X-Ray-Analyzer) | [Features](#-key-features) | [Quick Start](#-quick-start) | [Google Drive Setup](GOOGLE_DRIVE_SETUP.md)

---

## 📸 Application Preview

### 🎥 Video Demo
[![Watch Demo Video](https://img.youtube.com/vi/F_y1S7vodgY/maxresdefault.jpg)](https://youtu.be/F_y1S7vodgY)

*Click to watch the full demo on YouTube*

### 📷 Screenshots
![Document X-Ray Analyzer](assets/img/Application%20Image.png)

---

## 🌟 Key Features

### 📚 Multi-Format Document Support
- **PDF** - Full support with text extraction and OCR for scanned documents
- **EPUB** - Read and analyze e-books
- **DOCX** - Microsoft Word document analysis
- **Text Files** - Direct text analysis

### 🎨 Advanced Parts of Speech Highlighting
Visualize linguistic structure with intelligent highlighting:
- **Core Grammar**: Nouns, Verbs, Adjectives, Adverbs, Conjunctions, Prepositions
- **Named Entities**: People, Places, Organizations
- **Specialized**: Numbers, Dates, Currencies (USD, EUR, ZAR, etc.)
- **Financial**: Crypto currencies (BTC, ETH), Currency pairs, Currency symbols ($, €, £)
- **Technical**: Abbreviations, Acronyms

Toggle any category on/off to focus on what matters to you.

### 🌍 Smart Translation with Linguistic Analysis
- Translate documents into **multiple languages** (powered by Google Translate API)
- **Automatic POS analysis** of translated text
- **Side-by-side comparison** with original tooltips on hover
- **Cached translations** for instant re-loading
- Analyze grammar patterns across languages

### 🔗 Note Linking Across Documents
- **Create highlights** in any document
- **Add notes** with rich context
- **Link notes across multiple documents** - reference related content
- **Persistent storage** - your notes sync across sessions
- **Quick navigation** - jump to any note or highlight instantly

### 🗺️ Visual Document Mapping
- **Interactive map view** showing document structure
- **Thumbnail previews** with POS highlighting
- **Entity distribution** visualization
- **Click to navigate** to any section
- **Search highlighting** on map thumbnails

### 📊 Deep Statistics & Insights
- **Word frequency analysis** with interactive charts
- **Entity extraction**: People, Places, Organizations, Dates, Numbers
- **Top words** ranked by significance
- **Unique insights** - rare words that reveal document themes
- **Click any word** to navigate directly to its location in the text
- **Cross-language statistics** for translations

### 🔍 Powerful Search & Navigation
- **Instant search** across large documents
- **Jump to results** from statistics panel
- **Map-based navigation** with visual context
- **Linked notes** for cross-document references

### 🔒 Privacy First
- **100% local processing** - no data sent to cloud for analysis
- **Offline NLP** using compromise.js
- **Optional cloud features** (translation, sync) are clearly marked

---

## 🚀 Quick Start

### Download Pre-Built App
👉 **[Download for Windows/Mac/Linux](https://dnaicker.github.io/Document-X-Ray-Analyzer)**

### Build From Source

**Linux:**
`Docker/WSL2 for Linux builds`

**Prerequisites:**
- Node.js 16+ installed
- npm package manager

**Installation:**
```bash
# Clone the repository
git clone https://github.com/dnaicker/Document-X-Ray-Analyzer.git
cd Document-X-Ray-Analyzer

# Install dependencies
npm install

# Copy configuration template
cp config.example.js config.js
# (Edit config.js if you want to use Google Drive sync or translation)

# Run the app
npm start
```

**Build Executables:**
```bash
# Windows
npm run build:win

# macOS (requires Mac hardware)
npm run build:mac

# Linux
npm run build:linux
```

Executables will be created in the `dist/` folder.

---

## 📖 How to Use

### 1️⃣ Open a Document
Click **"📂 Open File"** and select:
- PDF files (including scanned documents)
- EPUB e-books
- DOCX Word documents
- Text files

### 2️⃣ Analyze Text
- **Automatic extraction** for text-based files
- **OCR Scan** button for scanned/image-based PDFs
- Click **"✨ Analyze Text"** to run NLP analysis

### 3️⃣ Explore Views

**📝 Analyse Tab**
- See your document with **Parts of Speech highlighting**
- Toggle categories using checkboxes (Nouns, Verbs, etc.)
- **Create highlights** by selecting text
- **Add notes** with context and links

**🗺️ Map Tab**
- Visual overview of document structure
- **Thumbnail previews** with POS highlighting
- **Click thumbnails** to navigate
- **Search results** highlighted on map

**🌍 Translate Tab**
- Select target language from dropdown
- Click **"Translate"** to process
- **Hover over text** to see original
- **POS analysis** applied to translation
- **Cached translations** load instantly

**📊 Stats Tab**
- **Overview**: Word count, unique words, sentences, pages
- **Entities**: People, Places, Organizations, Numbers, Dates
- **Top Words**: Most frequent meaningful terms
- **Click any word** to jump to its location
- **Language-specific stats** for translations

### 4️⃣ Create Linked Notes
1. Select text in any view
2. Click **"Add Note"** or right-click
3. Write your note
4. **Link to other documents** using the link button
5. Access all notes from the Notes panel

### 5️⃣ Navigate with Insights
- Click **any word** in Statistics to highlight it in the document
- Use **Top Words** to quickly find key concepts
- **Unique Insights** reveal rare but significant terms
- **Map view** shows distribution visually

---

## 🎨 Parts of Speech Categories

| Category | Examples | Use Case |
|----------|----------|----------|
| **Nouns** | book, city, idea | Identify key concepts and subjects |
| **Verbs** | run, analyze, create | Understand actions and processes |
| **Adjectives** | beautiful, complex, fast | Find descriptive language |
| **Adverbs** | quickly, very, often | Analyze modifiers and intensity |
| **People** | John Smith, Dr. Lee | Extract names and individuals |
| **Places** | New York, Europe | Identify locations |
| **Organizations** | Microsoft, UN | Find institutions |
| **Numbers** | 42, 1,000 | Quantitative data |
| **Dates** | 2025, Jan 1st | Temporal information |
| **Currencies** | USD, EUR, ZAR | Financial mentions |
| **Crypto** | BTC, ETH | Cryptocurrency references |
| **Abbreviations** | PhD, USA | Shortened forms |
| **Acronyms** | NASA, API | Initialisms |

---

## 🔧 Technical Details

### Technology Stack
- **Electron** - Cross-platform desktop framework
- **PDF.js** - PDF rendering and text extraction
- **Tesseract.js** - OCR engine for scanned documents
- **EPUBjs** - EPUB e-book reader
- **Mammoth.js** - DOCX document processing
- **Compromise.js** - Natural language processing
- **Google Translate API** - Multi-language translation (optional)

### Architecture
```
electron-main.js              # Main process (file system, dialogs)
├── src/
│   ├── index.html            # Main window structure
│   ├── styles.css            # Responsive styling
│   ├── renderer.js           # UI coordination and state management
│   └── components/
│       ├── pdf-viewer.js         # PDF display and extraction
│       ├── epub-reader.js        # EPUB processing
│       ├── docx-reader.js        # Word document processing
│       ├── text-analyzer.js      # NLP analysis engine
│       ├── stats-panel.js        # Statistics rendering
│       ├── notes-manager.js      # Highlight and note management
│       ├── translation-service.js # Translation integration
│       ├── translation-cache.js   # Translation storage
│       ├── dictionary-service.js  # Multi-language POS lookup
│       └── google-drive-sync.js   # Cloud sync (optional)
├── lib/
│   └── compromise.js         # NLP library
└── config.js                 # Configuration (API keys)
```

---

## 🐛 Troubleshooting

### Document won't load
- Ensure the file is not corrupted
- Check file format is supported (PDF, EPUB, DOCX, TXT)
- Try a different file
- Check console (Ctrl+Shift+I) for error messages

### OCR is slow
- OCR can take several minutes for long scanned documents
- Progress is shown during processing
- Consider using text-based PDFs when possible

### Translation not working
- Ensure you have internet connection
- Check `config.js` has valid Google API credentials
- See [Google Translate API setup](https://cloud.google.com/translate/docs/setup)

### Highlights disappearing
- Highlights are saved per document
- Ensure you're viewing the same document
- Check Notes panel to verify saved highlights

### Parts of Speech not accurate
- POS tagging works best for English
- Other languages use dictionary lookup + fallback
- Accuracy varies by language complexity

---

## 📝 Configuration

### Google API Setup (Optional)
For translation and cloud sync features:

1. Copy `config.example.js` to `config.js`
2. Get Google OAuth credentials:
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create a project
   - Enable Google Translate API and Google Drive API
   - Create OAuth 2.0 credentials
3. Add credentials to `config.js`:
```javascript
module.exports = {
    google: {
        clientId: 'YOUR_CLIENT_ID',
        clientSecret: 'YOUR_CLIENT_SECRET',
        redirectUri: 'http://localhost/callback'
    }
};
```

---

## 📄 License

MIT License - Feel free to use, modify, and distribute!

---

## 🤝 Contributing

Contributions are welcome! Please feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

---

## 🌐 Links

- **Website**: [dnaicker.github.io/Document-X-Ray-Analyzer](https://dnaicker.github.io/Document-X-Ray-Analyzer)
- **Repository**: [github.com/dnaicker/Document-X-Ray-Analyzer](https://github.com/dnaicker/Document-X-Ray-Analyzer)
- **Issues**: [Report a bug](https://github.com/dnaicker/Document-X-Ray-Analyzer/issues)

---

**Unlock the hidden structure of your documents! 📚✨**
