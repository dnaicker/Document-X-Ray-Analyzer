# Grammar Highlighter Desktop

A powerful desktop application for analyzing PDFs and documents with advanced NLP-powered grammar highlighting and entity extraction.

## ✨ Features

- 📄 **PDF Viewing** - Built-in PDF viewer with zoom and navigation
- 🔍 **Text Extraction** - Automatic text extraction from PDFs
- 🤖 **OCR Support** - Extract text from image-based PDFs using Tesseract.js
- 🎨 **Smart Highlighting** - Highlight nouns, verbs, adjectives, adverbs, people, and places
- 📊 **Grammar Analysis** - Detailed statistics and insights
- 👥 **Entity Recognition** - Identify people, places, organizations, and abbreviations
- 💡 **Unique Insights** - Discover unique words that reveal content themes
- 💾 **Save Analysis** - Export analysis results to JSON
- 🖥️ **Cross-Platform** - Works on Windows, macOS, and Linux

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ installed
- npm or yarn package manager

### Installation

1. **Navigate to the project directory:**
```bash
cd C:\Users\denver\Git\grammar-highlighter-desktop
```

2. **Install dependencies:**
```bash
npm install
```

3. **Copy compromise.js library:**
   - Copy `compromise.js` from your extension project:
     - From: `C:\Users\denver\Git\pos-highlighter-click\lib\compromise.js`
     - To: `C:\Users\denver\Git\grammar-highlighter-desktop\lib\compromise.js`

### Running the App

**Development mode:**
```bash
npm start
```

### Building Executables

**Windows:**
```bash
npm run build:win
```

**macOS:**
```bash
npm run build:mac
```

**Linux:**
```bash
npm run build:linux
```

**All platforms:**
```bash
npm run build
```

Executables will be created in the `dist/` folder.

## 📖 How to Use

### 1. Open a PDF
- Click the **"📂 Open PDF"** button
- Select a PDF file from your computer
- The PDF will load in the left panel

### 2. Extract Text
- **For text-based PDFs:** Text is automatically extracted
- **For image-based PDFs:** Click **"🔍 OCR Scan"** to extract text using OCR

### 3. Analyze
- Click **"✨ Analyze Text"** to perform NLP analysis
- Switch between views using the buttons:
  - **Raw Text** - View extracted text
  - **Highlighted** - See grammar highlighting
  - **Statistics** - View detailed analysis

### 4. Customize Highlighting
- Check/uncheck categories in the highlighted view:
  - 🔵 Nouns
  - 🟢 Verbs
  - 🟡 Adjectives
  - 🟠 Adverbs
  - 👤 People
  - 📍 Places

### 5. Explore Statistics
- **Overview** - Total words, unique words, sentences
- **People** - Names mentioned in the document
- **Places** - Locations referenced
- **Abbreviations** - Acronyms and abbreviations
- **Top Words** - Most frequent meaningful words
- **Unique Insights** - Rare words that reveal themes

### 6. Save Analysis
- Click **"💾 Save Analysis"** to export results to JSON

## 🎨 Views

### PDF Viewer (Left Panel)
- View original PDF
- Navigate pages (◀ ▶)
- Zoom in/out (🔍+ 🔍-)
- Page counter

### Text Panel (Right Panel)
Three view modes:
1. **Raw Text** - Extracted text in plain format
2. **Highlighted** - Color-coded grammar highlighting
3. **Statistics** - Comprehensive analysis dashboard

## 🔧 Technical Details

### Technology Stack
- **Electron** - Desktop framework
- **PDF.js** - PDF rendering and text extraction
- **Tesseract.js** - OCR engine
- **Compromise.js** - Natural language processing
- **HTML/CSS/JavaScript** - UI and logic

### Architecture
```
electron-main.js          # Main process (file system, dialogs)
├── src/
│   ├── index.html        # Main window structure
│   ├── styles.css        # Styling
│   ├── renderer.js       # UI logic and coordination
│   └── components/
│       ├── pdf-viewer.js     # PDF display and extraction
│       ├── text-analyzer.js  # NLP analysis engine
│       └── stats-panel.js    # Statistics rendering
└── lib/
    └── compromise.js     # NLP library
```

## 🐛 Troubleshooting

### PDF won't load
- Ensure the PDF is not corrupted
- Try a different PDF file
- Check console for error messages

### OCR is slow
- OCR processing can take several minutes for long documents
- Progress is shown during processing
- Consider using text-based PDFs when possible

### Text extraction is empty
- The PDF might be image-based - use OCR
- Some PDFs have security restrictions
- Check if text is selectable in other PDF viewers

## 📝 License

MIT License - Feel free to use and modify!

## 🤝 Contributing

This is a personal project, but suggestions are welcome!

## 📧 Support

For issues or questions, please check the documentation or open an issue.

---

**Enjoy analyzing your documents! 📚✨**

