# Document X-Ray Analyzer

> A powerful desktop application for deep document analysis with advanced NLP, multi-language translation, and intelligent highlighting.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)](https://github.com/dnaicker/Document-X-Ray-Analyzer)

[Download](https://github.com/dnaicker/Document-X-Ray-Analyzer/releases) | [Features](#-key-features) | [Quick Start](#-quick-start) | [Google Drive Setup](GOOGLE_DRIVE_SETUP.md)

---

## 📸 Application Preview

### 📷 Screenshots
![Document X-Ray Analyzer](assets/img/Application%20Image.png)
### 🎥 Video Demo
[[Watch Demo Video]](https://youtu.be/F_y1S7vodgY)

---

## 🌟 Key Features

### 📚 Multi-Format Document Support
- **PDF** - Full support with text extraction and OCR for scanned documents
- **EPUB** - Read and analyze e-books
- **DOCX** - Microsoft Word document analysis
- **Markdown** - Formatted markdown files with preview
- **Text Files** - Direct text analysis
- **60+ Source Code Languages** - JavaScript, Python, Java, C/C++, C#, Go, Rust, PHP, Ruby, Swift, Kotlin, GDScript, and more with syntax highlighting

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

### 💻 AI-Powered Code Analysis (NEW!)
Understand unfamiliar codebases in seconds:
- **Architecture Detection** - Identifies patterns like MVC, MVVM, Observer, Factory, etc.
- **Key Functions Analysis** - Highlights the most important functions with importance levels
- **Dependency Mapping** - Shows imports, exports, and external API connections
- **Code Relationships** - Visualizes how files connect and interact
- **Design Patterns** - Detects specific patterns used in your code
- **Quality Assessment** - Complexity metrics and improvement suggestions
- **60+ Languages Supported** - Works with JavaScript, Python, Java, C++, GDScript, and more!

**Powered by**: OpenAI GPT-4, Google Gemini, or Local Ollama (free & private)

> **See [CODE_ANALYSIS_GUIDE.md](CODE_ANALYSIS_GUIDE.md) for detailed documentation**

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
👉 **[Download for Windows/Mac/Linux](https://github.com/dnaicker/Document-X-Ray-Analyzer/releases)
**

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

## 🎯 Features in Detail

### 📚 Multi-Format Document Support

Document X-Ray Analyzer seamlessly handles multiple document formats, making it your all-in-one document analysis tool. Whether you're working with research papers, e-books, business reports, or plain text files, the application intelligently processes each format to extract meaningful content.

**Supported Formats:**
- **PDF Files**: Advanced text extraction engine handles both digital and scanned PDFs. For scanned documents, the built-in OCR (Optical Character Recognition) engine powered by Tesseract.js converts images to searchable text with high accuracy.
- **EPUB E-books**: Full support for EPUB format including chapter navigation, metadata extraction, and proper text flow handling across multiple files within the EPUB structure.
- **DOCX Documents**: Microsoft Word documents are processed using Mammoth.js, preserving formatting context while extracting clean text for analysis.
- **Text Files**: Direct support for .txt, .md, and other plain text formats with automatic encoding detection.

**Key Benefits:**
- No need to convert documents between formats
- Automatic format detection
- Consistent analysis experience across all formats
- Preserves document structure and metadata

![Multi-Format Support - Image Placeholder: Screenshot showing the file picker with multiple document types (PDF, EPUB, DOCX, TXT) and the interface displaying an opened document of each type]

---

### 🎨 Advanced Parts of Speech Highlighting

Transform any document into a color-coded linguistic map. The intelligent highlighting system uses natural language processing to identify and categorize every word, helping you understand the grammatical structure and semantic patterns at a glance.

**Grammar Categories:**
- **Nouns** (Purple): Identify subjects, objects, and key concepts
- **Verbs** (Green): Spot actions, states, and processes
- **Adjectives** (Yellow): Find descriptive and qualitative language
- **Adverbs** (Orange): Locate intensity modifiers and manner descriptions
- **Conjunctions** (Cyan): Track logical connections and sentence flow
- **Prepositions** (Magenta): Understand spatial and temporal relationships

**Named Entity Recognition:**
- **People** (Red): Automatic detection of person names
- **Places** (Blue): Identify cities, countries, and locations
- **Organizations** (Brown): Spot companies, institutions, and groups
- **Dates** (Teal): Recognize temporal expressions and dates
- **Numbers** (Navy): Highlight quantitative data
- **Currencies** (Gold): Track monetary values including USD, EUR, ZAR, GBP, and more

**Specialized Detection:**
- **Cryptocurrencies**: Bitcoin, Ethereum, and other digital currencies
- **Abbreviations & Acronyms**: PhD, USA, NASA, API, etc.
- **Currency Symbols**: $, €, £, ¥, and more

**Interactive Controls:**
Each category can be toggled on/off individually, allowing you to focus on specific linguistic patterns. Perfect for writers analyzing their work, students studying grammar, or researchers examining document patterns.

![POS Highlighting - Image Placeholder: Side-by-side comparison showing plain text on left and the same text with colorful POS highlighting on right, with a checkbox panel showing toggle controls for each category]

---

### 🌍 Smart Translation with Linguistic Analysis

Break language barriers while maintaining linguistic insights. The translation system not only converts documents into multiple languages but also preserves the grammatical analysis, allowing you to study language patterns across different linguistic structures.

**Translation Features:**
- **50+ Languages**: Support for all major world languages via Google Translate API
- **Sentence-Level Translation**: Each sentence is translated individually for better accuracy
- **Context Preservation**: Original text appears in tooltips when hovering over translations
- **Automatic POS Analysis**: Translated text is immediately analyzed with parts of speech highlighting
- **Smart Caching**: Translations are saved locally for instant re-loading without API calls

**Cross-Language Analysis:**
- Compare grammatical structures between languages
- Study how concepts are expressed differently across cultures
- Identify translation patterns and linguistic transformations
- Track entity preservation (names, places, dates) across languages

**Workflow:**
1. Open any document in your native language
2. Select target language from the dropdown
3. Click "Translate" and watch real-time progress
4. Explore the translated document with full POS highlighting
5. Hover over any text to see the original phrasing
6. Run statistics to compare vocabulary between versions

**Use Cases:**
- Language learners studying grammatical structures
- Translators comparing source and target texts
- Researchers analyzing multilingual documents
- Content creators localizing materials

![Translation Feature - Image Placeholder: Split screen showing original English text on left and Spanish translation on right, both with POS highlighting. Show a tooltip appearing when hovering over Spanish text revealing the English original. Include language selector dropdown.]

---

### 🔗 Note Linking Across Documents

Create a web of knowledge that connects insights across your entire document library. This powerful annotation system lets you highlight important passages, add contextual notes, and create links between related content in different documents.

**Core Features:**
- **Text Highlighting**: Select any passage and create a persistent highlight
- **Rich Notes**: Add detailed annotations with formatting support
- **Cross-Document Links**: Reference related passages in other documents
- **Tag System**: Organize notes with custom tags
- **Search & Filter**: Find notes by content, tag, or document
- **Export Options**: Save your notes separately or embed them

**How It Works:**
1. **Highlight**: Select text in any document to create a highlight
2. **Annotate**: Add your thoughts, observations, or questions
3. **Link**: Connect to related highlights in other documents
4. **Navigate**: Click on linked notes to jump between documents
5. **Review**: Access all your notes in the centralized notes panel

**Storage & Sync:**
- Local storage ensures notes persist across sessions
- Optional Google Drive sync keeps notes across devices
- JSON export for backup and portability
- Document fingerprinting ensures notes stay attached to correct content

**Perfect For:**
- Researchers connecting ideas across papers
- Students linking lecture notes to textbook content
- Writers tracking themes and references
- Legal professionals cross-referencing documents

![Note Linking - Image Placeholder: Main view showing a document with several highlighted passages in different colors. Side panel displaying list of notes with preview text. Show a note card with link icons indicating connections to other documents. Include a visualization or diagram showing how notes connect between 3 different documents.]

---

### 🗺️ Visual Document Mapping

Navigate large documents with ease using the intelligent map view. This bird's-eye perspective shows your entire document as a series of interactive thumbnails, each displaying the linguistic patterns and search results for quick visual scanning.

**Map Features:**
- **Page Thumbnails**: Miniature views of each page with readable text
- **POS Visualization**: All highlighting categories displayed on thumbnails
- **Search Results**: Visual indicators show which pages contain search terms
- **Entity Distribution**: See at a glance where people, places, and dates appear
- **Click Navigation**: Jump directly to any page by clicking its thumbnail

**Visual Indicators:**
- **Heat mapping** shows linguistic density
- **Color coding** reveals document sections by topic
- **Highlight markers** indicate your notes and annotations
- **Search pins** mark locations of matching text

**Use Cases:**
- **Long Documents**: Navigate 100+ page PDFs quickly
- **Research Papers**: Find methodology, results, and conclusion sections visually
- **Legal Documents**: Locate specific clauses and references
- **E-books**: Jump to chapters and sections of interest
- **Scanned Documents**: Visual overview before committing to full OCR

**Performance:**
- Efficient rendering handles documents of any size
- Lazy loading ensures smooth scrolling
- Thumbnails cached for instant re-display
- Works seamlessly with all document formats

![Document Map - Image Placeholder: Grid layout showing 20+ page thumbnails from a document. Each thumbnail shows miniature text with colorful POS highlighting. Some thumbnails have search result markers (yellow pins) and annotation markers (red dots). Include a sidebar showing zoom controls and filter options. Highlight one thumbnail with a selection border to show which page is currently active.]

---

### 📊 Deep Statistics & Insights

Unlock hidden patterns in your documents with comprehensive statistical analysis. The statistics engine processes your text to reveal word frequencies, entity distributions, and linguistic insights that would be impossible to spot by reading alone.

**Overview Metrics:**
- **Total Word Count**: Including and excluding stopwords
- **Unique Words**: Vocabulary richness indicator
- **Sentence Count**: Average sentence length calculation
- **Page Count**: Document length tracking
- **Reading Time**: Estimated time based on average reading speed
- **Complexity Score**: Lexical diversity measurement

**Entity Extraction:**
- **People**: All named individuals with frequency counts
- **Places**: Geographic locations ranked by mentions
- **Organizations**: Companies and institutions
- **Numbers**: Quantitative data points
- **Dates**: Temporal references and timelines
- **Currencies**: Financial data extraction

**Word Analysis:**
- **Top Words**: Most frequent meaningful terms (stopwords excluded)
- **Unique Insights**: Rare but significant words (TF-IDF scoring)
- **Frequency Distribution**: Visual charts showing word usage patterns
- **Contextual Ranking**: Importance scoring based on document position

**Interactive Features:**
- **Click any word** to highlight all occurrences in the document
- **Jump to location** from word list
- **Export data** as CSV or JSON
- **Compare statistics** across translations
- **Filter by category** (nouns, verbs, entities, etc.)

**Advanced Insights:**
- Discover the "fingerprint" of your document
- Identify over-used words and repetitive patterns
- Find technical terms and specialized vocabulary
- Track topic evolution throughout long documents
- Compare vocabulary between original and translated versions

![Statistics Panel - Image Placeholder: Dashboard showing multiple visualization panels: 1) Overview cards with key metrics (word count, unique words, etc.), 2) Top 10 words bar chart, 3) Entity lists showing people, places, organizations with counts, 4) Unique insights word cloud, 5) Interactive word frequency graph. Show cursor hovering over a word with a tooltip indicating "Click to jump to location".]

---

### 🔍 Powerful Search & Navigation

Never lose your place or struggle to find information again. The intelligent search system provides instant results across documents of any size, with smart navigation that understands context and relationships.

**Search Capabilities:**
- **Instant Results**: Real-time search as you type
- **Case Sensitivity Options**: Toggle case-sensitive matching
- **Whole Word Matching**: Find exact words vs. partial matches
- **Regular Expression Support**: Advanced pattern matching
- **Multi-language Search**: Works in original and translated documents
- **Fuzzy Matching**: Find similar words (optional)

**Navigation Features:**
- **Result Counter**: "3 of 47 matches" with next/previous buttons
- **Result Preview**: See surrounding context for each match
- **Map Integration**: Search results appear on document map
- **Jump to Result**: Click any result to navigate instantly
- **Persistent Highlighting**: Search terms stay highlighted while browsing

**Smart Context:**
- **POS-Aware Search**: Filter results by word type (find only noun forms)
- **Entity Search**: Find all mentions of people, places, or organizations
- **Statistical Navigation**: Click words in stats panel to find them in text
- **Note Navigation**: Jump between your linked annotations
- **Bookmark System**: Save locations for quick return

**Keyboard Shortcuts:**
- `Ctrl+F`: Open search
- `F3` / `Shift+F3`: Next/previous result
- `Ctrl+G`: Jump to page number
- `Esc`: Clear search and highlighting

**Performance:**
- Indexes large documents for instant search
- Handles 1000+ page documents smoothly
- Background indexing doesn't block UI
- Efficient memory usage

![Search & Navigation - Image Placeholder: Main document view with search bar at top showing "climate change" with "12 of 45" results indicator. Yellow highlighting on all matching text in visible area. Side panel showing list of all 45 search results with context preview. Mini document map in corner with search results marked as yellow dots. Include prev/next navigation buttons and options checkboxes.]

---

### 🔒 Privacy First

Your documents, your data, your control. Document X-Ray Analyzer is built with privacy as a core principle, ensuring your sensitive information never leaves your computer unless you explicitly choose cloud features.

**Local Processing:**
- **Offline NLP**: All text analysis runs entirely on your machine using Compromise.js
- **No Telemetry**: Zero analytics or usage tracking
- **No External Calls**: Document processing requires no internet connection
- **Local Storage**: All highlights, notes, and preferences saved on your device
- **Secure File Handling**: Documents never uploaded to servers

**Optional Cloud Features** (Clearly Marked):
- **Translation**: Uses Google Translate API (requires internet and API key)
  - Only sends sentences to be translated
  - Original document never uploaded
  - Translations cached locally
  - Can be disabled completely
  
- **Google Drive Sync**: Optional note synchronization (requires authentication)
  - Only syncs your notes and highlights, not documents
  - Uses OAuth 2.0 secure authentication
  - Fully reversible - can disable anytime
  - Encrypted transfer

**Data Control:**
- **Export Your Data**: JSON export of all notes and settings
- **Delete Anytime**: Clear cache and data with one click
- **No Vendor Lock-in**: Standard file formats (JSON, CSV)
- **Transparent Configuration**: All API keys stored in readable config.js

**Security Features:**
- No embedded trackers or third-party scripts
- No remote code execution
- Sandboxed document processing
- Regular security updates
- Open source code for transparency

**Compare with Cloud-Based Tools:**
| Feature | Document X-Ray | Cloud Services |
|---------|---------------|----------------|
| Document Processing | Local (Private) | Cloud (Uploaded) |
| Internet Required | No (except translate) | Yes (always) |
| Data Retention | You control | Service controls |
| Privacy | 100% Private | Terms dependent |
| Offline Use | Full features | Limited/none |

![Privacy Architecture - Image Placeholder: Diagram showing computer icon in center with bidirectional arrows. Left side shows "LOCAL PROCESSING" with icons for NLP, highlighting, statistics, search all contained within computer. Right side shows "OPTIONAL CLOUD" with Google Translate and Google Drive icons with a clear toggle switch in OFF position. Include lock icons and "Your Data Stays Local" badge.]

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
