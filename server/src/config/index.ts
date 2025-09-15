// Created with love 🩶 by Denvil 🧑‍💻
// Nexus AI Configuration

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server Configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Database Configuration
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/nexusai',

  // AI Service API Keys
  perplexityApiKey: process.env.PERPLEXITY_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY || '',

  // Telegram Bot Configuration
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramAdminUid: parseInt(process.env.TELEGRAM_ADMIN_UID || '0'),

  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'nexus-ai-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),

  // File Upload Configuration
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['image/jpeg', 'image/png', 'image/gif'],

  // AI Service Configuration
  defaultModel: process.env.DEFAULT_AI_MODEL || 'perplexity',
  maxTokensPerRequest: parseInt(process.env.MAX_TOKENS_PER_REQUEST || '2048'),
  requestTimeoutMs: parseInt(process.env.REQUEST_TIMEOUT_MS || '30000'),

  // Website Configuration
  websiteUrl: process.env.WEBSITE_URL || 'https://denx.me/NexusAi',
  telegramBotUrl: process.env.TELEGRAM_BOT_URL || 'https://t.me/NexusAiProbot',

  // Security Configuration
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  sessionSecret: process.env.SESSION_SECRET || 'nexus-ai-session-secret',

  // Feature Flags
  enableTelegramBot: process.env.ENABLE_TELEGRAM_BOT !== 'false',
  enableFileUploads: process.env.ENABLE_FILE_UPLOADS !== 'false',
  enableRateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
  enableSocketIO: process.env.ENABLE_SOCKET_IO !== 'false',

  // Validation
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test'
};

// Validate required configuration
export const validateConfig = (): void => {
  const required = ['jwtSecret'];
  const missing = required.filter(key => !config[key as keyof typeof config]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }

  // Warn about missing AI API keys
  const aiKeys = ['perplexityApiKey', 'geminiApiKey', 'huggingfaceApiKey'];
  const missingAiKeys = aiKeys.filter(key => !config[key as keyof typeof config]);
  
  if (missingAiKeys.length === aiKeys.length) {
    console.warn('⚠️ Warning: No AI API keys configured. AI features will not work.');
  } else if (missingAiKeys.length > 0) {
    console.warn(`⚠️ Warning: Missing AI API keys: ${missingAiKeys.join(', ')}`);
  }

  // Warn about missing Telegram bot token
  if (!config.telegramBotToken && config.enableTelegramBot) {
    console.warn('⚠️ Warning: Telegram bot token not configured. Bot features will be disabled.');
  }
};

export default config;