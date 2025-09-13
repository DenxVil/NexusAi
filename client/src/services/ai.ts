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
};