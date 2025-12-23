# AI Code Analysis Feature Guide

## Overview

The AI Code Analysis feature uses advanced language models (OpenAI GPT-4, Google Gemini, or Local Ollama) to intelligently analyze source code and provide architectural insights, helping you understand:

- 🏗️ **Architecture patterns** and design principles
- 🔗 **Code connections** and dependencies
- ⚡ **Key functions** and their importance
- 🎨 **Design patterns** in use
- ⭐ **Code quality** assessment
- 💡 **Improvement suggestions**

This powerful feature helps you quickly understand unfamiliar codebases, identify architectural patterns, and see how different parts of your project connect together.

## Getting Started

### 1. Choose Your AI Provider

You have three options:

#### Option A: Local Ollama (Recommended ⭐)
**Best for privacy and unlimited use!**

1. Install Ollama from [ollama.com](https://ollama.com)
2. Open terminal and run: `ollama pull llama3.2`
3. Start Ollama: `ollama serve`
4. In the app, select "Local Ollama" - Done!

See `OLLAMA_SETUP_GUIDE.md` for detailed instructions.

#### Option B: Google Gemini (Free Online)
1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Paste it in the AI Analysis section
3. Click Save

**Free Tier**: 15 requests/min, 1,500/day - No credit card required!

#### Option C: OpenAI GPT-4
1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Paste it in the AI Analysis section
3. Click Save

**Note**: OpenAI requires billing setup.

### 2. Open a Source Code File

Open any supported code file:
- JavaScript/TypeScript (`.js`, `.jsx`, `.ts`, `.tsx`)
- Python (`.py`)
- Java (`.java`)
- C/C++ (`.c`, `.cpp`, `.h`, `.hpp`)
- C# (`.cs`)
- Go (`.go`)
- Rust (`.rs`)
- PHP (`.php`)
- Ruby (`.rb`)
- Swift (`.swift`)
- Kotlin (`.kt`)
- GDScript (`.gd`)
- And 50+ more languages!

### 3. Run Code Analysis

#### Single File Analysis
1. Open a code file
2. Navigate to the **Analyze** tab
3. Scroll down to **🤖 AI Semantic Analysis**
4. Click **🚀 Analyze Current File**
5. Wait 10-30 seconds while the AI analyzes your code
6. View results in the AI Analysis tab

#### Folder Analysis (Recommended for Projects) ⭐
1. Import your project folder (File → Open Folder...)
2. Open any file in that project
3. Navigate to the **Analyze** tab  
4. Scroll down to **🤖 AI Semantic Analysis**
5. Click **📁 Analyze Current Folder**
6. Confirm the folder analysis
7. Wait while the AI analyzes all code files in that folder (progress shown)
8. View **folder-level insights** showing:
   - Architecture patterns across the folder
   - Critical functions across all files
   - Code quality distribution
   - Design patterns used
   - Individual file results

**Benefits**: 
- Only analyzes the specific project you're working on
- Faster than analyzing the entire library
- More focused insights

#### Full Library Analysis
1. Navigate to the **Analyze** tab  
2. Scroll down to **🤖 AI Semantic Analysis**
3. Click **📊 Analyze All Files in Library**
4. Confirm (this will analyze ALL code files in your library)
5. Wait while the AI analyzes everything

**Use when**: You want insights across multiple projects in your library

## Features

### 🏗️ Architecture Pattern Detection

The AI automatically identifies common architectural patterns in your code:

- **MVC** (Model-View-Controller)
- **MVVM** (Model-View-ViewModel)
- **Observer Pattern**
- **Factory Pattern**
- **Singleton Pattern**
- **Repository Pattern**
- **Service Layer**
- **Dependency Injection**
- And many more!

**Example Result:**
```
Architecture: MVC Pattern
Description: This file implements a Controller component that handles 
user requests and coordinates between Model and View layers.
Components: UserController, ValidationMiddleware, ResponseHandler
```

### ⚡ Key Functions Analysis

Identifies the most important functions in your code with:
- **Function name** and signature
- **Purpose** - What it does
- **Importance level** - High/Medium/Low

**Example:**
```
Function: processUserData
Purpose: Validates and transforms user input before database storage
Importance: HIGH
```

This helps you quickly understand which functions are critical to the codebase.

### 📦 Dependencies & Connections

Maps out all dependencies and connections:

- **Imports** - What external modules this file uses
- **Exports** - What this file provides to others
- **External APIs** - Third-party services called
- **Related Files** - Other files this connects to
- **Used By** - Potential consumers of this code
- **Extends** - Parent classes or base modules

**Example:**
```
IMPORTS:
  - express
  - mongoose
  - authMiddleware

EXPORTS:
  - UserController
  - validateUser

EXTERNAL APIs:
  - Stripe Payment API
  - SendGrid Email API
```

This visualization helps you understand how code fits into the larger project.

### 🎨 Design Pattern Detection

Identifies specific design patterns used in the code:

```
Pattern: Observer Pattern
Description: Event listener system for user actions
Examples: addEventListener, notifyListeners, eventEmitter

Pattern: Factory Pattern
Description: UserFactory creates different types of user objects
Examples: createAdminUser, createGuestUser, createPremiumUser
```

### ⭐ Code Quality Assessment

Provides metrics and suggestions:

- **Complexity** - Low/Medium/High
- **Maintainability** - Good/Fair/Needs Improvement
- **Suggestions** - Specific improvements

**Example:**
```
Complexity: MEDIUM
Maintainability: GOOD

Suggestions:
1. Consider extracting the validation logic into a separate validator class
2. Add error handling for network requests
3. Document the expected input format for processData()
```

### 🔗 Code Relationships Visualization

Shows how your code connects to the rest of the project:

```
RELATES TO:
  - UserModel.js
  - AuthService.js
  - Database.js

USED BY:
  - API Routes
  - Admin Dashboard
  - User Profile Page

EXTENDS:
  - BaseController
  - EventEmitter
```

## Use Cases

### 1. Understanding Unfamiliar Codebases ⭐ NEW!

**Scenario**: You've joined a new project and need to understand the architecture.

**Solution** (Using Folder Analysis):
1. Import the project folder (File → Open Folder)
2. Open any file in the project
3. Click **📁 Analyze Current Folder**
4. Wait for folder analysis to complete
5. Review the **Folder Analysis Summary**:
   - See all architecture patterns used
   - Identify critical functions across the project
   - Understand code quality distribution
   - View design patterns
6. Click on individual files for detailed analysis

**Result**: Get a complete project overview in minutes without reading every file!

**Alternative** (Full Library):
If you have multiple projects imported and want insights across all of them, use **📊 Analyze All Files in Library** instead.

**Manual Approach** (Single File):
1. Import the entire project folder
2. Analyze key files one by one (start with main entry points)
3. Review architecture patterns and connections
4. Build a mental map of how components interact

### 2. Code Review Preparation

**Scenario**: Reviewing a pull request with significant changes.

**Solution**:
1. Open the modified files
2. Run code analysis on each
3. Review suggested improvements
4. Check if new code follows existing patterns

**Result**: More thorough and informed code reviews.

### 3. Refactoring Planning

**Scenario**: Need to refactor legacy code but unsure where to start.

**Solution**:
1. Analyze the legacy code
2. Identify high-complexity functions
3. Review suggested improvements
4. Check dependencies before making changes

**Result**: Safer refactoring with clear understanding of impact.

### 4. Learning New Languages/Frameworks

**Scenario**: Exploring code in an unfamiliar language.

**Solution**:
1. Open example files in that language
2. Run code analysis
3. Learn about common patterns and idioms
4. Understand typical project structure

**Result**: Accelerated learning through AI-assisted code explanation.

### 5. Documentation Generation

**Scenario**: Need to document a complex codebase.

**Solution**:
1. Analyze all major files
2. Extract architecture insights
3. Document key functions and patterns
4. Create dependency diagrams based on connections

**Result**: Comprehensive documentation with less manual effort.

## Tips for Best Results

### Analyze the Right Files

**✅ Good candidates:**
- Main entry points (index.js, main.py, App.tsx)
- Controllers and services
- Core business logic
- Complex algorithms
- Files with many dependencies

**❌ Not ideal:**
- Configuration files
- Simple utility functions
- Auto-generated code
- Third-party libraries

### Folder Analysis (Recommended) ⭐

**Best approach for analyzing specific projects:**

1. **Import Project**: File → Open Folder → Select your project root
2. **Open Any File**: From that project
3. **Folder Analyze**: Click "📁 Analyze Current Folder"
4. **Review Summary**: See project-wide patterns, critical functions, and quality metrics
5. **Drill Down**: Open individual files for detailed analysis

**Benefits**:
- Analyzes only the specific project/folder you're working on
- Much faster than full library analysis
- More focused and relevant insights
- Perfect for single-project analysis

**Full Library Analysis:**

Use **"📊 Analyze All Files in Library"** when:
- You want insights across multiple projects
- You have imported several codebases
- You want to compare patterns across different projects

**Manual Single-File Approach:**

1. Start with the main entry point
2. Then analyze key controllers/services
3. Review model/data layer files
4. Check utility and helper files
5. Note connection patterns across files

**Recommendation**: Use folder analysis for focused project insights, then dive into specific files for details.

### Code Length

- **Optimal**: 100-500 lines of code
- **Acceptable**: Up to 1000 lines
- **Limited**: Over 1000 lines (truncated to first 8000 characters)

Larger files are automatically truncated to fit API limits.

### Language Support

Works best with:
- ✅ Strongly typed languages (TypeScript, Java, C#)
- ✅ Well-structured code with clear patterns
- ✅ Code with good naming conventions
- ⚠️ Minified or obfuscated code (limited results)
- ⚠️ Very domain-specific code (may miss nuances)

## Understanding the Results

### Architecture Section
Shows the overall design pattern and main components. Use this to understand the high-level structure.

### Purpose Section
A concise summary of what the file does. Great for quick orientation.

### Key Functions Section
Focus on HIGH importance functions first - these are critical to understanding the code.

### Dependencies Section
Useful for understanding external requirements and what this code provides to others.

### Connections Section
Helps you navigate to related files. When files "relate to" each other, they're working together.

### Code Quality Section
Use suggestions to guide refactoring and improvements.

## Privacy & Security

### Data Handling
- Code is sent to the AI provider for analysis
- Results are cached locally only
- No code is permanently stored on external servers
- API keys are stored locally in your browser

### Best Practices
- Don't analyze files containing API keys or secrets
- Review code before analysis if it contains sensitive logic
- Use Local Ollama for maximum privacy (100% local processing)
- Be cautious with proprietary algorithms

## Batch Analysis Options

### Three Analysis Modes

| Mode | Button | Scope | Best For |
|------|--------|-------|----------|
| **Single File** | 🚀 Analyze Current File | One file | Deep analysis |
| **Folder** ⭐ | 📁 Analyze Current Folder | Current project folder + subfolders | Most common use |
| **Full Library** | 📊 Analyze All Files in Library | All code files in library | Multi-project insights |

### Folder Analysis Details

**What Gets Analyzed:**
- All code files in the folder of the currently open file
- All subdirectories are included
- All 60+ supported languages
- Excludes: PDFs, EPUBs, DOCX, plain text, and markdown files

**How It Works:**
1. Open any file in your project
2. Click "Analyze Current Folder"
3. The app detects which folder that file belongs to
4. Analyzes all code files in that folder and its subfolders

### Analysis Speed
- **Per file**: ~15-30 seconds
- **10 files**: ~3-5 minutes
- **50 files**: ~15-25 minutes
- **100 files**: ~30-50 minutes

**Tips for faster analysis:**
- Use Ollama (local) for no rate limits
- Analyze during breaks or overnight
- Start with important directories first

### Project Summary Shows
- **Architecture Patterns**: Which patterns are used and where
- **Critical Functions**: High-importance functions across all files
- **Quality Distribution**: How many files have low/medium/high complexity
- **Design Patterns**: All patterns detected with their locations
- **Individual Results**: Status of each file analyzed

### Caching
- Each file's analysis is cached automatically
- Re-opening a file shows cached results instantly
- Re-running batch analysis skips previously analyzed files (coming soon)

## Troubleshooting

### "No code files found in library"
**Solution**: Import a project folder first using File → Open Folder...

### "No API key configured"
**Solution**: Set up your AI provider (see Getting Started section)

### "Analysis failed"
**Possible causes:**
- File is too large (try analyzing smaller portions)
- Code is in an unsupported or rare language
- Network issues (for cloud providers)
- API rate limit reached

**Solutions:**
- Try with Ollama for local processing
- Split large files into logical sections
- Wait a few minutes if rate limited
- Check your internet connection

### "No patterns detected"
**Possible causes:**
- Code is very simple
- File is mostly configuration
- Language-specific patterns not recognized

**This is normal for**: Config files, simple utilities, data files

### Poor Results
**Improve by:**
- Ensuring code has clear function/class names
- Analyzing well-structured code
- Trying a different AI provider
- Analyzing longer, more complex files

## Keyboard Shortcuts

Currently no dedicated shortcuts. Use:
- Mouse/touch to run analysis
- Tab key to navigate results
- Scroll to view full insights

## Features Comparison

| Feature | Single File | Folder Analysis | Full Library |
|---------|-------------|-----------------|--------------|
| **Speed** | Fast (30s) | Medium (minutes) | Slow (many minutes) |
| **Scope** | One file | Current project | All projects |
| **Detail Level** | Very detailed | Summary + details | High-level summary |
| **Best For** | Deep dive | Project overview | Multi-project insights |
| **Architecture View** | Single file | Folder-wide patterns | Library-wide patterns |
| **Function Analysis** | All functions | Critical functions | Critical functions |
| **Use When** | Reviewing specific code | Understanding a project | Comparing projects |

## Future Enhancements

Completed ✅:
- ✅ **Project-wide analysis** (multi-file insights) - NOW AVAILABLE!
- ✅ **Batch processing** with progress tracking
- ✅ **Architecture pattern detection** across files

Planned features:
- 📊 Visual architecture diagrams
- 🗺️ Interactive dependency graphs with clickable nodes
- 🔄 Compare analysis across versions
- 📝 Export analysis reports (PDF/Markdown)
- 🌐 Cross-file relationship mapping visualization
- 🎯 Security vulnerability detection
- 💾 Code smell detection
- ⚡ Smart caching (skip already-analyzed files in batch mode)
- 📈 Trend analysis (track quality over time)

## API Costs

### Ollama (Local)
- **Cost**: $0 - Completely free!
- **Privacy**: 100% local, no data sent externally
- **Speed**: Depends on your hardware
- **Best for**: Unlimited use, privacy-sensitive code

### Google Gemini (Cloud)
- **Free Tier**: 1,500 requests/day
- **Cost per analysis**: ~$0.001-0.003 (very affordable)
- **Best for**: Fast results, occasional use

### OpenAI GPT-4 (Cloud)
- **Cost per analysis**: ~$0.01-0.03
- **Best for**: Highest quality insights
- **Note**: Requires billing setup

## Support

### Need Help?
- Check this guide first
- Review troubleshooting section
- Check AI provider status
- Submit an issue on GitHub

### Provide Feedback
Help improve code analysis:
- Report patterns not detected
- Share successful use cases
- Suggest new features
- Report bugs

## Credits

- **AI Models**: OpenAI GPT-4, Google Gemini, Ollama (Llama)
- **Integration**: Grammar Highlighter Team
- **Supported Languages**: 60+ programming languages

---

**Last Updated**: December 2024
**Version**: 1.0.0

**Happy Code Exploring!** 💻✨
