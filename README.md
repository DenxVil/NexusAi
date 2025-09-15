# NEXUS AI - Advanced AI Application Platform

<p align="center">
  <img src="libs/IMG_6596.jpeg" alt="Nexus AI Logo" width="120" height="120"/>
</p>

*Created by ◉Ɗєиνιℓ*

A cutting-edge AI-powered application platform featuring multi-model support, Telegram bot integration, and stunning 3D-enhanced user interface with custom three.js elements.

🌐 **Website**: [https://denx.me](https://denx.me)  
🤖 **Telegram Bot**: [https://t.me/NexusAiProbot](https://t.me/NexusAiProbot)

## 🚀 Features

- **🤖 Multi-AI Integration** - Support for Gemini, Perplexity, and HuggingFace models
- **💬 Telegram Bot** - Seamless interaction through Telegram messenger  
- **🎨 Custom 3D Elements** - Stunning three.js powered 3D logo and particle effects
- **✨ Modern Minimal UI** - Clean, iask.ai-inspired design with glass morphism
- **🌐 Multi-language Support** - English and Hindi language support
- **🎤 Voice Input** - Voice-to-text capability for hands-free interaction
- **📱 Responsive Design** - Mobile-first responsive UI optimized for all devices
- **💾 Chat History** - Persistent conversation storage and export/import
- **🔐 Secure API Management** - Safe storage and management of API keys
- **⚡ Real-time Processing** - Fast response times with multiple AI backends

## 📸 Screenshots

### NEXUS AI Interface
![NEXUS AI Interface](https://github.com/user-attachments/assets/ebabe458-12d4-4548-83f8-5974fb52ac01)

*The modern, minimal interface featuring custom 3D elements, glassmorphism design, and clean typography inspired by iask.ai*

## 🏗️ Architecture

```
nexus-ai/
├── 📱 Frontend (Vanilla JS + Three.js)
│   ├── index.html          # Main web interface
│   ├── js/                 # Core application logic
│   │   ├── 3d/             # Three.js 3D rendering components
│   │   ├── services/       # AI services and utilities
│   │   └── ui/             # UI management
│   ├── styles.css          # Modern minimal styling with 3D effects
│   ├── libs/               # Three.js library
│   └── client/             # React-based admin interface
├── 🔧 Backend (Node.js + TypeScript)
│   ├── server/             # Express.js API server
│   ├── bot/                # Telegram bot integration
│   └── services/           # AI service integrations
└── 📋 Deployment
    ├── Procfile            # Heroku deployment configuration
    └── package.json        # Production-ready scripts
```

## 🛠️ Tech Stack

### Frontend
- **Vanilla JavaScript** - Core application with ES6 modules
- **Three.js** - Custom 3D graphics, animations, and particle systems
- **React** - Admin interface and advanced components  
- **CSS3** - Modern minimal styling with glassmorphism and 3D effects
- **Web APIs** - Speech Recognition, Local Storage, File API, WebGL

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety and modern JavaScript
- **Socket.io** - Real-time communication
- **Telegram Bot API** - Bot integration

### AI Services
- **Google Gemini** - Advanced language model
- **Perplexity AI** - Research-focused AI
- **HuggingFace** - Open-source AI models

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/DenxVil/NexusAi.git
cd NexusAi
```

2. **Install dependencies:**
```bash
npm run install-all
```

3. **Configure environment variables:**
```bash
# Copy example environment file
cp server/.env.example server/.env

# Edit with your configuration
nano server/.env
```

Add your API keys and configuration:
```env
# AI Service API Keys
GEMINI_API_KEY=your_gemini_key_here
PERPLEXITY_API_KEY=your_perplexity_key_here
HUGGINGFACE_API_KEY=your_huggingface_key_here

# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend API Configuration (for production deployment)
REACT_APP_API_URL=http://localhost:5000/api
```

4. **Start the development environment:**
```bash
npm run dev
```

The application will be available at:
- **Web Interface:** http://localhost:3000
- **API Server:** http://localhost:5000

## 🤖 Telegram Bot Setup

1. **Create a Telegram bot:**
   - Message [@BotFather](https://t.me/botfather) on Telegram
   - Use `/newbot` command to create your bot
   - Save the bot token

2. **Configure the bot:**
   - Add your bot token to the `.env` file
   - Start the server: `npm run server`
   - Your bot will automatically be available for interactions

3. **Bot Commands:**
   - `/start` - Initialize the bot
   - `/help` - Show available commands
   - `/clear` - Clear chat history
   - Simply send a message to chat with AI

## 🎨 UI Features

### 3D Elements Powered by Three.js
- **Custom 3D Logo** - Animated NEXUS AI logo with dynamic lighting
- **Particle System** - Beautiful floating particles with color gradients  
- **3D Background** - Immersive full-screen 3D canvas background
- **Smooth Animations** - Hardware-accelerated 3D transformations
- **Interactive Elements** - 3D hover effects and depth layering

### Modern Minimal Design (iask.ai Inspired)
- **Clean Interface** - Minimal, distraction-free chat experience
- **Glassmorphism Effects** - Subtle transparency and backdrop blur
- **Centered Layout** - Focused 800px max-width for optimal reading
- **Modern Typography** - Inter font family for excellent readability
- **Dark/Light Themes** - Seamless theme switching with animations
- **Mobile-First Responsive** - Optimized for all screen sizes

### Performance & Accessibility  
- **Fast Loading** - Optimized assets and minimal dependencies
- **WebGL Acceleration** - Hardware-accelerated 3D rendering
- **Reduced Motion** - Respects user accessibility preferences
- **Cross-Browser** - Compatible with modern browsers

## 📱 Usage

### Web Interface
1. Open the application in your browser
2. Configure your AI service API keys in Settings ⚙️
3. Select your preferred AI service from the dropdown
4. Start chatting with the AI assistant
5. Use voice input 🎤 for hands-free interaction

### Telegram Bot
1. Find your bot on Telegram using the username you created
2. Send `/start` to begin
3. Chat naturally - the bot will respond using your configured AI services
4. Use `/help` for additional commands

## 🔧 Configuration

### AI Services Setup

#### Google Gemini
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to your environment variables or settings panel

#### Perplexity AI
1. Go to [Perplexity Settings](https://www.perplexity.ai/settings/api)
2. Generate an API key
3. Add to your configuration

#### HuggingFace
1. Visit [HuggingFace Tokens](https://huggingface.co/settings/tokens)
2. Create a new token with read permissions
3. Configure in your application

## 🚀 Deployment

### Heroku Deployment
1. **Prepare for deployment:**
```bash
# Heroku CLI required
heroku create your-nexus-ai-app
```

2. **Set environment variables:**
```bash
heroku config:set TELEGRAM_BOT_TOKEN=your_token_here
heroku config:set GEMINI_API_KEY=your_key_here
heroku config:set REACT_APP_API_URL=https://your-nexus-ai-app.herokuapp.com/api
# Add other environment variables as needed
```

3. **Deploy:**
```bash
git push heroku main
```

### Other Platforms
- **Vercel** - Perfect for frontend deployment
- **Railway** - Excellent for full-stack deployment  
- **DigitalOcean App Platform** - Scalable container deployment
- **Render** - Full-stack deployment (see `render.yaml` configuration)

**Important:** For all deployment platforms, make sure to set the `REACT_APP_API_URL` environment variable to point to your deployed backend API URL (e.g., `https://your-app.onrender.com/api`).

## 📞 Support

Need help? Reach out through our support channels:

- **Telegram:** [@xDenvil_bot](https://t.me/xDenvil_bot)
- **Email:** [NexusAisupport@gmail.com](mailto:NexusAisupport@gmail.com)

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **AI Service Providers** - Google, Perplexity, HuggingFace for powerful AI capabilities
- **Open Source Community** - For the amazing libraries and tools
- **Telegram** - For providing an excellent bot platform
- **Contributors** - Everyone who helps make Nexus Ai better

---

**Made with ❤️ by ◉Ɗєиνιℓ**

*Nexus Ai - Where artificial intelligence meets exceptional user experience*
