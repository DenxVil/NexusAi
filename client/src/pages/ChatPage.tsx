import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { chatService } from '../services/chat';
import { aiService } from '../services/ai';
import { Chat, Message } from '../types';
import Nexus3D from '../components/common/Nexus3D';

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 relative">
      {/* Floating Telegram Button */}
      <a
        href="https://t.me/NexusAiProbot"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
        <span className="text-sm font-medium">Try me on Telegram</span>
      </a>

      {/* Main Content Container - Centered Layout like iask.ai */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header with 3D Logo */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center space-y-4">
            <Nexus3D width={400} height={120} className="mx-auto" />
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Nexus AI
              </h1>
              <p className="text-gray-600 text-lg">Advanced Intelligence Platform</p>
              {chat && (
                <p className="text-sm text-gray-500">
                  {chat.title} • {messages.length} messages
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          {/* Messages */}
          <div className="min-h-[400px] max-h-[600px] overflow-y-auto px-6 py-6 space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">Start your conversation</h3>
                <p className="text-gray-600 max-w-md mx-auto">Ask me anything! I'm powered by advanced AI models and ready to provide perfect, powerful, and accurate responses.</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-2xl px-6 py-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white ml-auto'
                        : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                    {message.metadata && (
                      <div className={`text-xs mt-3 ${message.role === 'user' ? 'text-purple-200' : 'text-gray-500'}`}>
                        {message.metadata.tokens} tokens • {message.metadata.responseTime}ms
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4 shadow-sm">
                  <div className="flex items-center space-x-3">
                    <div className="loading-spinner"></div>
                    <span className="text-gray-600">Nexus AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 px-6 py-4 bg-white/50">
            <div className="flex space-x-4 items-end">
              <div className="flex-1">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything..."
                  rows={1}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white/80 backdrop-blur-sm"
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || loading}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center mt-8 space-y-2">
          <p className="text-gray-500 text-sm">
            Experience advanced AI intelligence with our sequential provider chain
          </p>
          <div className="flex justify-center space-x-6 text-sm">
            <a href="https://denx.me/NexusAi" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-700">
              🌐 Website
            </a>
            <a href="https://t.me/NexusAiProbot" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
              📱 Telegram Bot
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};