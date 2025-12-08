# Ollama Local AI Setup Guide

## 🏠 Why Use Ollama?

Ollama is the **BEST option** for semantic analysis in Grammar Highlighter:

✅ **100% FREE**
- No API keys
- No usage limits
- No billing or payment needed
- No credit card required

✅ **PRIVATE**
- All processing happens on YOUR computer
- Your documents never leave your machine
- No data sent to cloud services
- Perfect for confidential documents

✅ **POWERFUL**
- Can analyze 50+ sentences at once
- Multiple model options (Llama, Mistral, etc.)
- Works offline
- Fast on modern computers

✅ **EASY TO USE**
- Simple installation
- Works on Windows, Mac, Linux
- One command to start

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Ollama

**Windows:**
1. Download from https://ollama.com/download/windows
2. Run the installer
3. Done!

**Mac:**
1. Download from https://ollama.com/download/mac
2. Run the installer
3. Done!

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Step 2: Pull a Model

Open terminal/command prompt and run:

```bash
ollama pull llama3.2
```

This downloads Llama 3.2 (best for semantic analysis, ~2GB)

**Other good models:**
```bash
ollama pull mistral     # Alternative, ~4GB
ollama pull phi3        # Smaller, faster ~2GB
ollama pull gemma2      # Google's model ~3GB
```

### Step 3: Start Ollama

```bash
ollama serve
```

Leave this terminal window open while using the app.

**Windows**: Ollama usually starts automatically. If not, run the command above.

### Step 4: Use in Grammar Highlighter

1. Open a document
2. Go to **Analyze** tab
3. **🤖 AI Semantic Analysis** section
4. Select **🏠 Local Ollama** from dropdown
5. Click **🔍 Test Connection** - should show your installed models
6. Click **🚀 Analyze Document**

Done! 🎉

## 💡 Recommended Models for Semantic Analysis

| Model | Size | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| **llama3.2** ⭐ | 2GB | Fast | Excellent | General use (Recommended) |
| **mistral** | 4GB | Medium | Excellent | Detailed analysis |
| **phi3** | 2GB | Very Fast | Good | Quick analysis |
| **llama3.1** | 4.7GB | Medium | Excellent | Long documents |
| **gemma2** | 3GB | Fast | Very Good | Balanced option |

### How to Choose?

- **Start with llama3.2** - Best balance of size, speed, and quality
- **Limited RAM/Storage?** Use phi3 (smallest)
- **Want best quality?** Use mistral or llama3.1 (bigger)
- **Analyzing long docs?** Use llama3.1 (larger context)

## 🔧 Configuration in the App

### Endpoint
- **Default:** `http://localhost:11434`
- **Change only if:** You're running Ollama on a different port or remote machine

### Model Selection
1. Choose from dropdown in the app
2. Or type a custom model name if you've installed others
3. Click **💾 Save Config**

## 🛠️ Common Commands

### List installed models:
```bash
ollama list
```

### Pull/download a model:
```bash
ollama pull llama3.2
```

### Remove a model:
```bash
ollama rm llama3.2
```

### Update a model:
```bash
ollama pull llama3.2
```

### Check if Ollama is running:
```bash
ollama list
```

If you see a list of models, it's running!

## 📊 System Requirements

### Minimum:
- **RAM:** 8GB
- **Storage:** 4GB free
- **CPU:** Modern processor (2020+)

### Recommended:
- **RAM:** 16GB+
- **Storage:** 10GB+ free
- **CPU:** Multi-core processor
- **GPU:** Optional (NVIDIA for faster inference)

### Model Size vs RAM:
- **2GB model** → 8GB RAM minimum
- **4GB model** → 12GB RAM minimum  
- **8GB model** → 16GB RAM minimum

## 🐛 Troubleshooting

### "Cannot connect to Ollama"

**Solution 1: Start Ollama**
```bash
ollama serve
```

**Solution 2: Check if it's running**
```bash
ollama list
```

**Solution 3: Restart Ollama**
- Close the terminal running `ollama serve`
- Run `ollama serve` again

### "Model not found"

**Solution: Pull the model**
```bash
ollama pull llama3.2
```

### "Out of memory" / Crashes

**Solutions:**
1. Use a smaller model (phi3)
2. Close other applications
3. Analyze shorter documents (20-30 sentences at a time)

### Slow Analysis (takes >30 seconds)

**Solutions:**
1. Use a faster model (phi3)
2. Close other applications
3. Upgrade RAM if possible
4. Consider using a smaller model

### Windows: "Command not found"

**Solution:**
1. Restart terminal after installation
2. Or reinstall Ollama from https://ollama.com/download

## ⚡ Performance Tips

1. **Keep Ollama running** - Don't stop/start between analyses
2. **First analysis is slower** - Model needs to load, subsequent analyses are faster
3. **Close heavy apps** - Free up RAM for better performance
4. **Use SSD** - Models load faster from SSD vs HDD
5. **GPU acceleration** - If you have NVIDIA GPU, Ollama will use it automatically

## 🔒 Privacy & Security

### What data is processed locally?
- **Everything!** Your documents never leave your computer
- No internet connection needed (after downloading models)
- Perfect for:
  - Confidential business documents
  - Personal notes
  - Legal documents
  - Medical records
  - Any sensitive content

### Is my data stored?
- **No.** Ollama doesn't store your analysis requests
- Models are stored on your drive
- No logs of your documents

## 🆚 Ollama vs Cloud APIs

| Feature | Ollama (Local) | OpenAI/Gemini (Cloud) |
|---------|----------------|----------------------|
| **Cost** | FREE | Paid |
| **Privacy** | 100% Private | Data sent to cloud |
| **Speed** | Depends on PC | Usually fast |
| **Internet** | Not needed* | Required |
| **Quality** | Very Good | Excellent |
| **Limits** | None | Rate limits |
| **Setup** | 5 minutes | Instant (just API key) |

*Internet needed only for downloading models initially

## 📱 Using Ollama Remotely

### Access from Another Computer

If you want to run Ollama on one powerful computer and access it from another:

**On the Ollama computer:**
```bash
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

**In the app:**
- Change endpoint to: `http://<ollama-computer-ip>:11434`
- Example: `http://192.168.1.100:11434`

## 🎯 Best Practices

1. **Download models on good internet** - Models are 2-8GB
2. **Keep Ollama updated** - Run installer again to update
3. **Test connection first** - Use 🔍 Test button before analyzing
4. **Start with small documents** - Test with 10-20 sentences first
5. **Experiment with models** - Try different models to find your favorite

## 💰 Cost Comparison

| Provider | Cost per 1000 docs |
|----------|-------------------|
| **Ollama** | $0 |
| OpenAI GPT-4 | ~$30-50 |
| Google Gemini | $0 (limited) or ~$10 |

**Annual savings with Ollama:** $360+ if you analyze 30 docs/week!

## 🆘 Need More Help?

- **Ollama Docs:** https://github.com/ollama/ollama/tree/main/docs
- **Model Library:** https://ollama.com/library
- **Discord Community:** https://discord.gg/ollama
- **GitHub Issues:** https://github.com/ollama/ollama/issues

## 📚 Advanced: Custom Models

You can use any model from the Ollama library:

```bash
# Browse models at: https://ollama.com/library

# Examples:
ollama pull deepseek-r1:7b      # DeepSeek
ollama pull qwen2.5:7b          # Qwen
ollama pull mixtral:8x7b        # Mixtral (large)
```

Then select the model name in the app dropdown or type it in.

## ✅ Success Checklist

Before analyzing:
- [ ] Ollama installed
- [ ] At least one model downloaded (`ollama pull llama3.2`)
- [ ] Ollama is running (`ollama serve`)
- [ ] Test connection passes (🔍 button shows models)
- [ ] Document is loaded in app

Ready to analyze! 🚀

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Recommended Model:** llama3.2

