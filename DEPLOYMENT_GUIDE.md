# 🚀 Nexus AI Deployment Guide

## 📋 Architecture Overview

Nexus AI features a **dual-frontend architecture** designed for maximum flexibility:

### 🌐 Frontend Applications

1. **Vanilla JS Frontend** (`/` root directory)
   - **Purpose**: Public-facing AI chat interface
   - **Technology**: Vanilla JavaScript + Three.js
   - **Deployment**: GitHub Pages, static hosting
   - **Mode**: Direct AI API integration (client-side)

2. **React Admin Interface** (`/client/` directory) 
   - **Purpose**: Admin dashboard and management
   - **Technology**: React + TypeScript
   - **Deployment**: With backend server
   - **Mode**: Backend API integration

### 🔧 Backend Server (`/server/` directory)
- **Purpose**: API server, Telegram bot, database management
- **Technology**: Node.js + TypeScript + Express
- **Deployment**: Azure, Render, Heroku, etc.

---

## 🌍 Deployment Options

### Option 1: GitHub Pages (Recommended for Public Demo)

**What it does**: Deploys the vanilla JS frontend as a static site that works entirely in the browser.

#### Setup Steps:
1. Enable GitHub Pages in repository settings
2. Set source to `/ (root)` branch
3. Users configure their own API keys via the Settings panel ⚙️

#### Features Available:
- ✅ Full AI chat functionality
- ✅ Multiple AI service support (Gemini, Perplexity, HuggingFace)
- ✅ 3D animated interface
- ✅ Voice input
- ✅ Theme switching
- ✅ Local chat history
- ❌ Telegram bot integration
- ❌ User accounts/authentication
- ❌ Server-side features

#### User Instructions:
1. Visit the GitHub Pages URL
2. Click Settings ⚙️ button
3. Add API keys from:
   - [Google AI Studio](https://makersuite.google.com/app/apikey) for Gemini
   - [Perplexity Settings](https://www.perplexity.ai/settings/api) for Perplexity
   - [HuggingFace Tokens](https://huggingface.co/settings/tokens) for HuggingFace
4. Start chatting!

---

### Option 2: Full-Stack Deployment (Azure/Render/Heroku)

**What it does**: Deploys both frontend and backend for complete functionality.

#### Platforms Supported:
- **Azure App Service** (primary, see `.github/workflows/azure-deploy.yml`)
- **Render** (see `render.yaml`)
- **Heroku** (see deployment docs)

#### Setup Steps:
1. Deploy backend server with environment variables
2. Deploy React admin interface
3. Configure vanilla JS frontend to use backend (optional)

#### Environment Variables Required:
```bash
# Database
MONGO_URI=mongodb://your-mongodb-uri

# AI Services
GEMINI_API_KEY=your_gemini_key
PERPLEXITY_API_KEY=your_perplexity_key
HUGGINGFACE_API_KEY=your_huggingface_key

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_ADMIN_UID=your_admin_id

# Security
JWT_SECRET=your_secure_secret

# URLs
REACT_APP_API_URL=https://your-deployed-backend.com/api
CORS_ORIGIN=https://your-frontend-domain.com
```

#### Features Available:
- ✅ Everything from GitHub Pages
- ✅ Telegram bot integration
- ✅ User accounts and authentication
- ✅ Chat history sync
- ✅ Admin dashboard
- ✅ Rate limiting and security features

---

## 🔧 Development Setup

### Local Development
```bash
# Install all dependencies
npm run install-all

# Terminal 1: Start backend server
cd server && npm run dev

# Terminal 2: Start React admin interface
cd client && npm start

# Terminal 3: Serve vanilla JS frontend (optional)
python3 -m http.server 8000
```

### Testing
```bash
# Test backend
cd server && npm test

# Test React client
cd client && npm test

# Build for production
npm run build
```

---

## 🔍 Troubleshooting

### Issue: "Website structure appearing same on GitHub Pages"

**Root Cause**: This indicates the GitHub Pages deployment is working correctly! The vanilla JS frontend is designed to look and function the same whether served from GitHub Pages or locally.

**Solutions**:
1. **For end users**: Add API keys via Settings ⚙️ to enable AI functionality
2. **For developers**: This is expected behavior - the frontend is designed to be consistent

### Issue: CORS errors when using API keys

**Root Cause**: AI services may block browser requests from certain domains.

**Solutions**:
1. Use the backend server deployment instead of direct API calls
2. Configure CORS properly on your domain
3. Some AI services work better from certain domains

### Issue: Backend not connecting to database

**Root Cause**: MongoDB connection issues.

**Solutions**:
1. Install MongoDB locally: `brew install mongodb` (macOS) or use MongoDB Atlas
2. Set correct `MONGO_URI` environment variable
3. The server will continue running without database (limited functionality)

### Issue: Telegram bot not working

**Root Cause**: Missing bot token or webhook configuration.

**Solutions**:
1. Get bot token from [@BotFather](https://t.me/botfather)
2. Set `TELEGRAM_BOT_TOKEN` environment variable
3. Configure webhook URL in deployment

---

## 📚 API Documentation

### Vanilla JS Frontend Config

The frontend automatically detects deployment environment:
- **Development**: `localhost` - shows debug info
- **GitHub Pages**: `*.github.io` - direct API mode with user instructions
- **Production**: custom domains - direct API mode

### React Admin Interface

Uses environment variable `REACT_APP_API_URL` to connect to backend:
- Development: `http://localhost:5000/api`
- Production: Set to your deployed backend URL

---

## 🛡️ Security Notes

### API Key Security
- **GitHub Pages**: API keys stored locally in user's browser (client-side)
- **Backend Deployment**: API keys stored securely on server (server-side)

### Best Practices
1. Never commit API keys to git
2. Use environment variables for all secrets
3. Enable rate limiting in production
4. Use HTTPS in production
5. Configure CORS properly

---

## 🎯 Quick Deployment Commands

### GitHub Pages Only
```bash
# No setup needed - just enable in repository settings
# Users add their own API keys via Settings panel
```

### Azure Deployment
```bash
# Uses GitHub Actions workflow
git push origin main
# Automatically deploys via .github/workflows/azure-deploy.yml
```

### Render Deployment
```bash
# Connect repository to Render
# Uses render.yaml configuration
# Set environment variables in Render dashboard
```

### Manual Server Deployment
```bash
npm run build
cd server
npm start
```

---

## 🤝 Support

- **Documentation**: See README.md for general info
- **Issues**: Create GitHub issue for bugs
- **Features**: Submit feature requests
- **Discord**: Join our community (link in README)

---

*Created with love 🩶 by [Denvil](https://github.com/DenxVil) 🧑‍💻*