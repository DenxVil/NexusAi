# 🚀 Nexus AI Deployment Guide

This guide covers the specialized deployment setup for Nexus AI with frontend on GitHub Pages and backend on Render.

## 🏗️ Architecture Overview

```
Frontend (GitHub Pages) ← → Backend (Render) ← → Telegram Bot
     ↓                           ↓
Client-side AI Services    Server-side AI Services
                              ↓
                         MongoDB Atlas
```

## 🌐 Frontend Deployment (GitHub Pages)

### Features
- ✅ Static hosting on GitHub Pages
- ✅ Client-side AI service integration
- ✅ Offline functionality with fallbacks
- ✅ iask.ai inspired design
- ✅ Floating Telegram integration
- ✅ Progressive Web App capabilities

### Deployment Steps

1. **Automatic Deployment**
   - Push to `main` branch automatically triggers GitHub Pages deployment
   - Workflow located at `.github/workflows/deploy-pages.yml`

2. **Manual Deployment**
   ```bash
   cd client
   npm run deploy
   ```

3. **Configuration**
   - Frontend automatically detects GitHub Pages environment
   - API calls route to Render backend: `https://nexus-ai-backend.onrender.com`
   - Client-side API keys stored in browser localStorage

### Environment Variables (Build Time)
```bash
REACT_APP_API_URL=https://nexus-ai-backend.onrender.com/api
REACT_APP_WEBSITE_URL=https://denxvil.github.io/NexusAi/
REACT_APP_TELEGRAM_BOT_URL=https://t.me/NexusAiProbot
REACT_APP_ENVIRONMENT=github-pages
REACT_APP_ENABLE_CLIENT_SIDE_API_KEYS=true
REACT_APP_ENABLE_OFFLINE_MODE=true
```

## 🚀 Backend Deployment (Render)

### Features
- ✅ Optimized for Render platform
- ✅ CORS configured for GitHub Pages
- ✅ Health check endpoints
- ✅ AI service fallback chain
- ✅ Telegram bot integration
- ✅ MongoDB Atlas connection

### Deployment Steps

1. **Render Dashboard Setup**
   - Connect your GitHub repository
   - Select `server` as root directory
   - Use the provided `render.yaml` configuration

2. **Environment Variables**
   Copy from `server/.env.render-template` and set in Render dashboard:

   **Required Variables:**
   ```bash
   NODE_ENV=production
   PORT=10000
   CORS_ORIGIN=https://denxvil.github.io
   WEBSITE_URL=https://denxvil.github.io/NexusAi/
   
   # AI Service API Keys
   PERPLEXITY_API_KEY=your_key_here
   GEMINI_API_KEY=your_key_here
   HUGGINGFACE_API_KEY=your_key_here
   
   # Telegram Bot
   TELEGRAM_BOT_TOKEN=your_token_here
   TELEGRAM_ADMIN_UID=your_user_id
   
   # Database
   MONGO_URI=mongodb+srv://...
   
   # Security
   JWT_SECRET=your_secure_secret
   SESSION_SECRET=your_secure_secret
   ```

3. **Health Check**
   - Endpoint: `https://your-render-app.onrender.com/health`
   - Should return status 200 with service information

## 🔑 API Key Configuration

### Client-Side (GitHub Pages)
Users can configure API keys directly in the frontend:
1. Click "⚙️ API Config" button
2. Enter API keys for desired services
3. Keys stored in browser localStorage
4. Direct API calls to AI services

### Server-Side (Render)
Admin configures API keys in Render dashboard:
1. Go to Render dashboard → Environment
2. Add API keys as secure environment variables
3. Restart service after configuration

## 🤖 AI Service Integration

### Supported Services
1. **Google Gemini** - Primary service
2. **Perplexity** - Research and web search
3. **HuggingFace** - Fallback and specialized models

### Fallback Chain
```
User Request → Backend (if available) → Gemini → Perplexity → HuggingFace → Fallback Response
              ↓
              Client-side (if backend unavailable) → Gemini → HuggingFace → Fallback Response
```

## 📱 Telegram Bot

### Setup
1. Create bot with [@BotFather](https://t.me/BotFather)
2. Get bot token and set in Render environment
3. Set admin UID for administrative commands
4. Bot automatically starts with backend deployment

### Features
- AI conversation with same fallback chain
- Administrative commands for monitoring
- Usage analytics and rate limiting
- Error reporting and health checks

## 🔒 Security & CORS

### CORS Configuration
Backend automatically configures CORS for:
- `https://denxvil.github.io` (GitHub Pages)
- `http://localhost:3000` (Development)
- Environment-specific origins

### API Key Security
- **Frontend**: Keys stored in browser localStorage
- **Backend**: Keys stored as secure environment variables
- **Telegram**: Bot token secured in Render dashboard

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Verify Render backend has correct CORS_ORIGIN
   - Check GitHub Pages URL matches exactly

2. **API Key Issues**
   - Verify keys are correctly set in respective platforms
   - Check service-specific requirements and quotas

3. **Build Failures**
   - Check GitHub Actions logs for frontend
   - Check Render build logs for backend

4. **Telegram Bot Not Responding**
   - Verify bot token in Render environment
   - Check backend health endpoint
   - Ensure MongoDB connection is working

### Health Check URLs
1. **Frontend**: `https://denxvil.github.io/NexusAi/`
2. **Backend**: `https://nexus-ai-backend.onrender.com/health`
3. **Telegram Bot**: Send `/start` to [@NexusAiProbot](https://t.me/NexusAiProbot)

## 🚀 Performance Optimization

### Frontend (GitHub Pages)
- Static asset optimization
- Code splitting and lazy loading
- Service worker for offline functionality
- Aggressive caching strategies

### Backend (Render)
- Connection pooling for MongoDB
- Response caching for AI services
- Rate limiting to prevent abuse
- Health monitoring and auto-restart

## 📊 Monitoring & Analytics

### Backend Monitoring
- Health check endpoint with system metrics
- Error reporting and logging
- Usage analytics per AI service
- Performance metrics

### Frontend Monitoring
- Client-side error reporting
- Usage analytics (if enabled)
- Performance monitoring
- Offline usage tracking

## 🔄 Deployment Workflow

1. **Development**
   ```bash
   git checkout -b feature/your-feature
   # Make changes
   git commit -m "Your changes"
   git push origin feature/your-feature
   ```

2. **Testing**
   ```bash
   npm test              # Run tests
   npm run build         # Test build
   ```

3. **Production**
   ```bash
   git checkout main
   git merge feature/your-feature
   git push origin main  # Triggers auto-deployment
   ```

## 📝 Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Render Documentation](https://render.com/docs)
- [React Deployment Guide](https://create-react-app.dev/docs/deployment/)
- [Telegram Bot API](https://core.telegram.org/bots/api)

---

Created with love 🩶 by **Denvil** 🧑‍💻