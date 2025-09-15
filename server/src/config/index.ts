// Configuration for Nexus AI - Created with love 🩶 by Denvil 🧑‍💻

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface Config {
  // Server configuration
  PORT: number;
  NODE_ENV: string;
  
  // Database configuration
  MONGODB_URI: string;
  
  // AI Service API Keys
  PERPLEXITY_API_KEY?: string;
  GEMINI_API_KEY?: string;
  HUGGINGFACE_API_KEY?: string;
  
  // Telegram Bot configuration
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_ADMIN_UID?: number;
  
  // CORS and Security
  ALLOWED_ORIGINS: string[];
}

export const config: Config = {
  PORT: parseInt(process.env.PORT || '3001'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/nexusai',
  
  // AI Service API Keys
  PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  HUGGINGFACE_API_KEY: process.env.HUGGINGFACE_API_KEY,
  
  // Telegram Bot
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_ADMIN_UID: parseInt(process.env.TELEGRAM_ADMIN_UID || '0'),
  
  // CORS
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'https://denx.me']
};

// Validate required configuration
export const validateConfig = (): void => {
  const requiredEnvVars = ['TELEGRAM_BOT_TOKEN'];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.warn(`⚠️ Warning: ${envVar} environment variable is not set`);
    }
  }
  
  // Check if at least one AI service is configured
  const aiServices = [config.PERPLEXITY_API_KEY, config.GEMINI_API_KEY, config.HUGGINGFACE_API_KEY];
  if (!aiServices.some(key => key)) {
    console.warn('⚠️ Warning: No AI service API keys are configured. Please set PERPLEXITY_API_KEY, GEMINI_API_KEY, or HUGGINGFACE_API_KEY');
  } else {
    console.log('✅ AI service configuration validated');
    if (config.PERPLEXITY_API_KEY) console.log('  - Perplexity API configured');
    if (config.GEMINI_API_KEY) console.log('  - Gemini API configured');
    if (config.HUGGINGFACE_API_KEY) console.log('  - HuggingFace API configured');
  }
};

export default config;