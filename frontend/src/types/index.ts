export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
}

export interface ChatContextType {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

export interface ApiConfig {
  baseUrl: string;
  apiKey?: string;
}