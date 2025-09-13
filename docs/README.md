# Documentation

This directory contains documentation for the Nexus Ai application.

## API Documentation

### Authentication
- User registration and login
- JWT token-based authentication
- User profile management

### Chat System
- Create and manage conversations
- Real-time messaging with WebSocket support
- Message history and persistence

### AI Integration
- Multiple AI model support
- Customizable AI parameters
- Content generation capabilities

## Development

### Setup
1. Clone the repository
2. Install dependencies: `npm run install-all`
3. Set up environment variables
4. Start development servers: `npm run dev`

### Architecture
- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Node.js with Express, MongoDB
- **Real-time**: Socket.io for live communication
- **Authentication**: JWT with bcrypt password hashing

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

#### Chats
- `GET /api/chats` - Get user's chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/:id` - Get specific chat
- `POST /api/chats/:id/messages` - Add message to chat
- `DELETE /api/chats/:id` - Delete chat

#### AI Services
- `POST /api/ai/chat` - Send message to AI
- `GET /api/ai/models` - Get available models
- `POST /api/ai/generate` - Generate content