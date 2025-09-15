# NEXUS AI Frontend

A modern, responsive web interface for the NEXUS AI assistant built with React, TypeScript, and Tailwind CSS.

## 🌟 Features

- **Modern UI/UX** - Clean, professional design with NEXUS AI branding
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Real-time Chat** - Seamless chat interface with typing indicators
- **Markdown Support** - Rich text formatting for AI responses
- **Dark Theme** - Beautiful dark gradient theme
- **Error Handling** - Graceful error handling and user feedback
- **GitHub Pages Ready** - Optimized for deployment to GitHub Pages

## 🚀 Tech Stack

- **React 19** - Latest React with modern features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **React Markdown** - Markdown rendering for AI responses
- **Axios** - HTTP client for API calls

## 🛠️ Development

### Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create a `.env.local` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_AI_API_KEY=your_api_key_here
VITE_APP_NAME=NEXUS AI
VITE_APP_VERSION=1.0.0
```

## 🚀 Deployment

### GitHub Pages

The frontend is automatically deployed to GitHub Pages when changes are pushed to the main branch.

The deployment workflow:
1. Builds the React application
2. Configures environment variables from GitHub secrets
3. Deploys to GitHub Pages

### Environment Configuration

Set these secrets in your GitHub repository:
- `AI_API_KEY` - Your AI service API key

## 🎨 Customization

### Branding

The NEXUS AI branding can be customized in:
- `src/index.css` - Color scheme and theme
- `tailwind.config.js` - Custom colors and design tokens
- `src/components/Header.tsx` - Logo and header branding

### API Integration

The frontend communicates with the NEXUS AI backend through:
- `src/services/chatService.ts` - API service layer
- Environment variables for configuration

## 📱 Features

### Chat Interface
- Real-time messaging with the AI
- Typing indicators and loading states
- Message history and timestamps
- Error handling with user-friendly messages

### Responsive Design
- Mobile-first design approach
- Adaptive layout for all screen sizes
- Touch-friendly interface elements

### Accessibility
- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly
- High contrast design

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the main repository LICENSE file for details.

---

**Made with ❤️ by ◉Ɗєиνιℓ**
