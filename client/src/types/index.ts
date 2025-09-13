export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  preferences: {
    theme: 'light' | 'dark';
    language: string;
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
  lastLogin?: string;
  isVerified: boolean;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: string;
  metadata?: {
    model?: string;
    tokens?: number;
    responseTime?: number;
  };
}

export interface Chat {
  _id: string;
  title: string;
  userId: string;
  messages: Message[];
  isActive: boolean;
  settings: {
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt?: string;
  };
  metadata: {
    totalMessages: number;
    totalTokens: number;
    lastActivity: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    message: string;
    details?: any[];
  };
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  pricing: 'free' | 'standard' | 'premium';
}