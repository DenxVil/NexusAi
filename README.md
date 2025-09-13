# ShanxAi - AI Application Platform

A modern AI-powered application platform inspired by ayesoul.com, providing intelligent conversation and AI services.

## 🚀 Features

- **AI Chat Interface** - Interactive chat with AI models
- **User Authentication** - Secure user registration and login
- **Real-time Communication** - WebSocket-based real-time messaging
- **Responsive Design** - Mobile-first responsive UI
- **API Integration** - RESTful API for AI services
- **User Profiles** - Personalized user experiences
- **Chat History** - Persistent conversation storage
- **Multi-model Support** - Integration with various AI models

## 🏗️ Project Structure

```
shanx-ai/
├── client/                 # React frontend application
│   ├── public/            # Static assets
│   ├── src/               # Source code
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API service functions
│   │   ├── utils/         # Utility functions
│   │   └── styles/        # CSS and styling
│   └── package.json       # Frontend dependencies
├── server/                # Node.js backend application
│   ├── controllers/       # Request handlers
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── services/         # Business logic
│   ├── config/           # Configuration files
│   └── package.json      # Backend dependencies
├── docs/                 # Documentation
├── tests/                # Test files
└── package.json          # Root package.json
```

## 🛠️ Tech Stack

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Socket.io Client** - Real-time communication

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **MongoDB** - Database
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **bcrypt** - Password hashing

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/DenxVil/ShanxAi.git
cd ShanxAi
```

2. Install dependencies:
```bash
npm run install-all
```

3. Set up environment variables:
```bash
cp server/.env.example server/.env
# Edit server/.env with your configuration
```

4. Start the development servers:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📖 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Chat Endpoints
- `GET /api/chats` - Get user's chat history
- `POST /api/chats` - Create new chat
- `GET /api/chats/:id` - Get specific chat
- `POST /api/chats/:id/messages` - Send message to chat

### AI Service Endpoints
- `POST /api/ai/chat` - Send message to AI
- `GET /api/ai/models` - Get available AI models
- `POST /api/ai/generate` - Generate AI content

## 🔧 Configuration

### Environment Variables

#### Server (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/shanxai
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=your_openai_api_key
CORS_ORIGIN=http://localhost:3000
```

## 🧪 Testing

Run tests for both client and server:
```bash
npm test
```

## 📦 Deployment

### Build for production:
```bash
npm run build
```

### Deploy to various platforms:
- **Vercel** - Frontend deployment
- **Railway/Heroku** - Backend deployment
- **MongoDB Atlas** - Database hosting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by ayesoul.com
- Built with modern web technologies
- Powered by AI/ML services
