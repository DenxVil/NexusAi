import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://nexus-ai-backend.onrender.com';
const API_KEY = import.meta.env.VITE_AI_API_KEY;

export class ChatService {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || API_BASE_URL;
    this.apiKey = apiKey || API_KEY;
  }

  async sendMessage(message: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/chat`,
        {
          message,
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      if (response.data && response.data.response) {
        return response.data.response;
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Chat service error:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response && error.response.status === 401) {
          throw new Error('Authentication failed. Please check your API key.');
        }
        if (error.response && error.response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (error.response && error.response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout. Please try again.');
        }
      }
      
      throw new Error('Failed to send message. Please try again.');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }
}