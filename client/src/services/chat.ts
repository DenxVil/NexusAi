import api from './api';
import { ApiResponse, Chat, Message } from '../types';

export const chatService = {
  getChats: async (page: number = 1, limit: number = 10): Promise<ApiResponse<{
    chats: Chat[];
    pagination: {
      current: number;
      pages: number;
      total: number;
    };
  }>> => {
    const response = await api.get(`/chats?page=${page}&limit=${limit}`);
    return response.data;
  },

  getChat: async (chatId: string): Promise<ApiResponse<{ chat: Chat }>> => {
    const response = await api.get(`/chats/${chatId}`);
    return response.data;
  },

  createChat: async (data: {
    title: string;
    systemPrompt?: string;
  }): Promise<ApiResponse<{ chat: Chat }>> => {
    const response = await api.post('/chats', data);
    return response.data;
  },

  addMessage: async (chatId: string, data: {
    content: string;
    role?: 'user' | 'assistant' | 'system';
  }): Promise<ApiResponse<{ message: Message; chat: Chat }>> => {
    const response = await api.post(`/chats/${chatId}/messages`, data);
    return response.data;
  },

  deleteChat: async (chatId: string): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/chats/${chatId}`);
    return response.data;
  },
};