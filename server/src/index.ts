// Created with love 🩶 by Denvil 🧑‍💻
// Nexus AI Server

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';

import config, { validateConfig } from './config';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// Import services
import { AIService } from './services/aiService';
import { TelegramBotService } from './services/telegramBot';
import { ErrorMonitoringService } from './services/errorMonitoringService';
import { CacheManagementService } from './services/cacheManagementService';

// Import routes
import authRoutes from './routes/auth';
import chatRoutes from './routes/chat';
import aiRoutes from './routes/ai';
import userRoutes from './routes/user';

// Validate configuration
validateConfig();

// Global error handlers for production safety
process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  try {
    const errorMonitor = ErrorMonitoringService.getInstance();
    await errorMonitor.reportError(error, {
      endpoint: 'uncaught-exception',
      method: 'GLOBAL'
    });
  } catch (reportError) {
    console.error('Failed to report uncaught exception:', reportError);
  }
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  try {
    const errorMonitor = ErrorMonitoringService.getInstance();
    const error = reason instanceof Error ? reason : new Error(String(reason));
    await errorMonitor.reportError(error, {
      endpoint: 'unhandled-rejection',
      method: 'GLOBAL'
    });
  } catch (reportError) {
    console.error('Failed to report unhandled rejection:', reportError);
  }
});

const app: Application = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.corsOrigin,
    methods: ["GET", "POST"]
  }
});

// Initialize services
const aiService = new AIService();
let telegramBot: TelegramBotService | null = null;
const errorMonitor = ErrorMonitoringService.getInstance();
const cacheManager = CacheManagementService.getInstance();

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.',
  skip: () => !config.enableRateLimiting
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Add cache management middleware
app.use(cacheManager.getCacheHeadersMiddleware());

if (config.enableRateLimiting) {
  app.use(limiter);
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  const providersStatus = aiService.getProvidersStatus();
  const activeProviders = Object.entries(providersStatus).filter(([_, isActive]) => isActive);
  const errorSummary = errorMonitor.getErrorSummary();
  const buildInfo = cacheManager.getBuildInfo();
  const memUsage = process.memoryUsage();
  
  res.status(200).json({
    status: 'OK',
    service: 'Nexus AI',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    version: buildInfo.version,
    buildInfo,
    services: {
      telegramBot: telegramBot?.isActive() || false,
      activeUsers: telegramBot?.getActiveUsers() || 0,
      aiProviders: providersStatus,
      availableProviders: activeProviders.length,
      errorMonitoring: {
        totalErrors: errorSummary.totalErrors,
        systemHealth: errorSummary.systemHealth
      }
    },
    system: {
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      },
      cpu: process.cpuUsage(),
      uptime: process.uptime()
    },
    features: {
      cascadingAI: true,
      telegramBot: config.enableTelegramBot,
      rateLimiting: config.enableRateLimiting,
      socketIO: config.enableSocketIO,
      errorMonitoring: true,
      cacheManagement: true
    },
    deployment: {
      platform: 'Azure App Service',
      region: process.env.REGION_NAME || 'Unknown',
      cacheBusting: cacheManager.getCacheBustingParams()
    }
  });
});

// Add cache management middleware
app.use(cacheManager.getCacheHeadersMiddleware());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', userRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join_chat', (chatId: string) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat ${chatId}`);
  });

  socket.on('leave_chat', (chatId: string) => {
    socket.leave(chatId);
    console.log(`User ${socket.id} left chat ${chatId}`);
  });

  socket.on('send_message', (data) => {
    // Broadcast message to all users in the chat room
    socket.to(data.chatId).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    console.log('🚀 Starting Nexus AI Server...');
    
    // Connect to database
    await connectDatabase();
    
    // Initialize Telegram bot
    if (config.telegramBotToken && config.enableTelegramBot) {
      telegramBot = new TelegramBotService(aiService);
      console.log('🤖 Nexus AI Telegram bot service initialized');
    } else {
      console.log('⚠️ Telegram bot disabled - Token not provided or feature disabled');
    }
    
    server.listen(config.port, async () => {
      console.log(`🚀 Nexus AI Server running on port ${config.port}`);
      console.log(`📊 Health check: http://localhost:${config.port}/health`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`🔮 Website: ${config.websiteUrl}`);
      console.log(`📱 Telegram Bot: ${config.telegramBotUrl}`);
      console.log(`💫 Created with love by ◉Ɗєиνιℓ`);
      
      // Send startup notification to admin
      try {
        await errorMonitor.sendStartupNotification();
      } catch (error) {
        console.error('Failed to send startup notification:', error);
      }
    });
  } catch (error) {
    console.error('Failed to start Nexus AI server:', error);
    
    // Report startup error to monitoring
    try {
      await errorMonitor.reportError(error as Error, {
        endpoint: 'server-startup',
        method: 'STARTUP'
      });
    } catch (reportError) {
      console.error('Failed to report startup error:', reportError);
    }
    
    process.exit(1);
  }
};

startServer();

export { app, io };