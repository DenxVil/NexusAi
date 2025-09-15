import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Message, ChatContextType } from '../types';
import { ChatService } from '../services/chatService';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatService = new ChatService();

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: content.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Add typing indicator
    const typingMessage: Message = {
      id: `typing-${Date.now()}`,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      isTyping: true,
    };

    setMessages(prev => [...prev, typingMessage]);

    try {
      const response = await chatService.sendMessage(content);
      
      setMessages(prev => {
        const withoutTyping = prev.filter(msg => !msg.isTyping);
        const aiMessage: Message = {
          id: Date.now().toString(),
          content: response,
          role: 'assistant',
          timestamp: new Date(),
        };
        return [...withoutTyping, aiMessage];
      });
    } catch (error) {
      setMessages(prev => {
        const withoutTyping = prev.filter(msg => !msg.isTyping);
        const errorMessage: Message = {
          id: Date.now().toString(),
          content: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
          role: 'assistant',
          timestamp: new Date(),
        };
        return [...withoutTyping, errorMessage];
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, chatService]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const value: ChatContextType = {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};