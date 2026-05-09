# FactCheck AI — PDF Fact Verification Agent

A deployed web app that automatically extracts and fact-checks claims from uploaded PDF documents using the Anthropic Claude API with live web search.

## 🚀 Live Demo

> Deploy to Vercel by following the instructions below — the app will be live at your Vercel URL.

## 🔍 How It Works

1. **Upload** any PDF (marketing reports, press releases, research docs)
2. **Extract** — Claude reads the PDF and identifies all specific, verifiable claims (stats, dates, figures)
3. **Verify** — Claude searches the live web for each claim independently
4. **Report** — Each claim is flagged as:
   - ✅ **Verified** — matches current data
   - ⚠️ **Inaccurate** — outdated or partially wrong (with correction)
   - ❌ **False / No Evidence** — no supporting evidence found

## 🛠 Tech Stack

- **Frontend**: React + Vite (no backend required)
- **AI**: Anthropic Claude `claude-sonnet-4-20250514` via direct API calls
- **Live Search**: Anthropic web_search tool (built-in, no extra API key)
- **Deployment**: Vercel (static hosting)

## 📦 Setup & Local Dev

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/factcheck-ai
cd factcheck-ai

# Install dependencies
npm install

# Run locally
npm run dev
```

Open http://localhost:5173

> **Note**: The app calls the Anthropic API directly from the browser. You must allow the API key via a proxy or use a backend in production. For the deployed demo, the Anthropic API is called directly (ensure CORS is handled).

## 🚀 Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Or connect your GitHub repo to [vercel.com](https://vercel.com) for automatic deployments.

## 📁 Project Structure

```
factcheck-ai/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx        # React entry point
    └── App.jsx         # Main application component
```

## ⚙️ Environment

No `.env` file needed for the demo — the Anthropic API key is injected by the claude.ai artifact environment. For your own deployment, add a backend proxy.

## 📋 Evaluation

This app was built to handle "Trap Documents" — PDFs containing intentional lies and outdated statistics. The verification agent:
- Searches the web for each claim individually
- Provides the correct current data when a claim is wrong
- Cites sources for every verdict

---
Built for CogCulture Product Management Trainee Assessment
