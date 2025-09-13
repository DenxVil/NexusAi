import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { chatService } from '../services/chat';
import { aiService } from '../services/ai';
import { Chat, Message } from '../types';

export const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId?: string }>();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(true);

  useEffect(() => {
    if (chatId) {
      loadChat(chatId);
    } else {
      setChatLoading(false);
    }
  }, [chatId]);

  const loadChat = async (id: string) => {
    try {
      const response = await chatService.getChat(id);
      if (response.success) {
        setChat(response.data.chat);
        setMessages(response.data.chat.messages);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    } finally {
      setChatLoading(false);
    }
  };

  const createNewChat = async (firstMessage: string) => {
    try {
      const chatResponse = await chatService.createChat({
        title: firstMessage.length > 50 ? firstMessage.substring(0, 50) + '...' : firstMessage
      });
      
      if (chatResponse.success) {
        const newChat = chatResponse.data.chat;
        setChat(newChat);
        
        // Add the user message
        const messageResponse = await chatService.addMessage(newChat._id, {
          content: firstMessage,
          role: 'user'
        });
        
        if (messageResponse.success) {
          setMessages([messageResponse.data.message]);
          
          // Get AI response
          const aiResponse = await aiService.sendMessage({
            message: firstMessage,
            model: newChat.settings.model
          });
          
          if (aiResponse.success) {
            const assistantMessage: Message = {
              id: Date.now().toString(),
              content: aiResponse.data.response,
              role: 'assistant',
              timestamp: new Date().toISOString(),
              metadata: aiResponse.data.metadata
            };
            
            await chatService.addMessage(newChat._id, {
              content: assistantMessage.content,
              role: 'assistant'
            });
            
            setMessages(prev => [...prev, assistantMessage]);
          }
        }
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setLoading(true);

    try {
      if (!chat) {
        await createNewChat(userMessage);
      } else {
        // Add user message
        const messageResponse = await chatService.addMessage(chat._id, {
          content: userMessage,
          role: 'user'
        });
        
        if (messageResponse.success) {
          setMessages(prev => [...prev, messageResponse.data.message]);
          
          // Get AI response
          const aiResponse = await aiService.sendMessage({
            message: userMessage,
            model: chat.settings.model
          });
          
          if (aiResponse.success) {
            const assistantMessage: Message = {
              id: Date.now().toString(),
              content: aiResponse.data.response,
              role: 'assistant',
              timestamp: new Date().toISOString(),
              metadata: aiResponse.data.metadata
            };
            
            await chatService.addMessage(chat._id, {
              content: assistantMessage.content,
              role: 'assistant'
            });
            
            setMessages(prev => [...prev, assistantMessage]);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (chatLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">
          {chat ? chat.title : 'New Conversation'}
        </h1>
        {chat && (
          <p className="text-sm text-gray-500">
            Model: {chat.settings.model} • {messages.length} messages
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
            <p className="text-gray-500">Ask me anything! I'm here to help you with various tasks and questions.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl px-4 py-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.metadata && (
                  <div className="text-xs mt-2 opacity-70">
                    {message.metadata.tokens} tokens • {message.metadata.responseTime}ms
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <div className="flex items-center space-x-2">
                <div className="loading-spinner"></div>
                <span className="text-gray-500">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex space-x-4">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              rows={1}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};