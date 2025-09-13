import api from './api';
import { ApiResponse, AIModel } from '../types';

export const aiService = {
  sendMessage: async (data: {
    message: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<ApiResponse<{
    response: string;
    metadata: {
      model: string;
      tokens: number;
      responseTime: number;
      timestamp: string;
    };
  }>> => {
    const response = await api.post('/ai/chat', data);
    return response.data;
  },

  getModels: async (): Promise<ApiResponse<{ models: AIModel[] }>> => {
    const response = await api.get('/ai/models');
    return response.data;
  },

  generateContent: async (data: {
    prompt: string;
    type?: 'text' | 'code' | 'summary' | 'creative';
    model?: string;
  }): Promise<ApiResponse<{
    content: string;
    type: string;
    metadata: {
      model: string;
      tokens: number;
      responseTime: number;
      timestamp: string;
    };
  }>> => {
    const response = await api.post('/ai/generate', data);
    return response.data;
  },

  generateImage: async (data: {
    prompt: string;
    size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
    style?: 'vivid' | 'natural';
    quality?: 'standard' | 'hd';
  }): Promise<ApiResponse<{
    imageUrl: string;
    prompt: string;
    size: string;
    style: string;
    quality: string;
    metadata: {
      processingTime: number;
      timestamp: string;
      model: string;
    };
  }>> => {
    const response = await api.post('/ai/generate-image', data);
    return response.data;
  },
};