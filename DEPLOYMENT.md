# Render + GitHub Pages Deployment Guide for Nexus AI

This guide covers the deployment setup for Nexus AI with frontend on GitHub Pages and backend on Render.

## Prerequisites

- GitHub account (for frontend hosting)
- Render account (for backend hosting)
- MongoDB Atlas account (for database)
- Telegram Bot Token (from @BotFather)
- AI Service API Keys (Gemini, Perplexity, HuggingFace)

## Deployment Overview

### Architecture
```
Frontend (GitHub Pages) ← → Backend (Render) ← → Telegram Bot
     ↓                           ↓
Client-side AI Services    Server-side AI Services
                              ↓
                         MongoDB Atlas
```

### Backend Deployment (Render)

1. **Connect Repository to Render:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the branch (main)

2. **Configure the Service:**
   - Name: `nexus-ai-backend`
   - Root Directory: `./server`
   - Environment: `Node`
   - Build Command: `npm ci --production=false && npm run build`
   - Start Command: `NODE_ENV=production npm start`

3. **Set Environment Variables in Render:**
   ```env
   NODE_ENV=production
   PORT=10000
   CORS_ORIGIN=https://denxvil.github.io
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key
   GEMINI_API_KEY=your_gemini_api_key
   PERPLEXITY_API_KEY=your_perplexity_api_key
   HUGGINGFACE_API_KEY=your_huggingface_api_key
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   ENABLE_TELEGRAM_BOT=true
   ENABLE_RATE_LIMITING=true
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=200
   ```

4. **Deploy:**
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Your backend will be available at: `https://nexus-ai-backend.onrender.com`

### Frontend Deployment (GitHub Pages)

1. **Automatic Deployment:**
   - Push to `main` branch automatically triggers GitHub Pages deployment
   - Workflow located at `.github/workflows/deploy-frontend.yml`
   - No manual intervention required

2. **Configuration:**
   - Frontend automatically connects to Render backend
   - API calls route to: `https://nexus-ai-backend.onrender.com`
   - Build environment variables configured in GitHub Actions

3. **Access:**
   - Frontend available at: `https://denxvil.github.io/NexusAi/`
### MongoDB Setup

1. **Create MongoDB Atlas Cluster:**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Create a free cluster
   - Create database user
   - Whitelist IP addresses (0.0.0.0/0 for Render)
   - Get connection string

2. **Database Configuration:**
   - Database name: `nexusai`
   - Collections: `users`, `chats`, `messages`
   - Connection string format: `mongodb+srv://username:password@cluster.mongodb.net/nexusai`

### Telegram Bot Setup

1. **Create Bot:**
   - Message [@BotFather](https://t.me/botfather)
   - Use `/newbot` command
   - Save the bot token

2. **Configure Bot:**
   - Add bot token to Render environment variables
   - Bot will automatically start with backend deployment
   - Test with `/start` command

## Health Checks & Monitoring

### Health Endpoints
- **Backend**: `https://nexus-ai-backend.onrender.com/health`
- **Frontend**: `https://denxvil.github.io/NexusAi/`
- **Telegram Bot**: Send `/start` to your bot

### Common Issues

1. **CORS Errors:**
   - Verify `CORS_ORIGIN` in Render environment
   - Should be: `https://denxvil.github.io`

2. **API Connection Issues:**
   - Check backend health endpoint
   - Verify environment variables in Render
   - Check MongoDB connection string

3. **Build Failures:**
   - Frontend: Check GitHub Actions logs
   - Backend: Check Render build logs

4. **Telegram Bot Not Responding:**
   - Verify bot token in Render environment
   - Check backend logs for errors
   - Ensure MongoDB connection is working

## Environment Variables Reference

### Required for Render Backend
```env
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://denxvil.github.io
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
TELEGRAM_BOT_TOKEN=your_bot_token
GEMINI_API_KEY=your_gemini_key
PERPLEXITY_API_KEY=your_perplexity_key
HUGGINGFACE_API_KEY=your_huggingface_key
```

### Optional Configuration
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200
ENABLE_TELEGRAM_BOT=true
ENABLE_RATE_LIMITING=true
ENABLE_SOCKET_IO=true
```

## Deployment Complete! 🎉

Once deployed:
- **Frontend**: Available at `https://denxvil.github.io/NexusAi/`
- **Backend**: Available at `https://nexus-ai-backend.onrender.com`
- **Telegram Bot**: Available at your bot's username
- **API Health**: `https://nexus-ai-backend.onrender.com/health`

## Support

For deployment issues, contact:
- Telegram: [@xDenvil_bot](https://t.me/xDenvil_bot)
- Email: [NexusAisupport@gmail.com](mailto:NexusAisupport@gmail.com)

---

**Made with ❤️ by ◉Ɗєиνιℓ**

*Created by ◉Ɗєиνιℓ*