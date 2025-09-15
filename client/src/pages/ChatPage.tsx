import React, { useState, useEffect, useRef } from 'react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatId) {
      loadChat(chatId);
    } else {
      setChatLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
          
          // Get AI response using cascading service
          const aiResponse = await aiService.sendMessage({
            message: firstMessage,
            model: 'nexus-ai' // Use our cascading service
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
          
          // Get AI response using cascading service
          const aiResponse = await aiService.sendMessage({
            message: userMessage,
            model: 'nexus-ai' // Use our cascading service
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* iask.ai inspired minimal header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-xs">N</span>
              </div>
              <h1 className="text-lg font-medium text-gray-900">Nexus AI</h1>
            </div>
            
            <a
              href="https://t.me/NexusAiProbot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:text-blue-600 font-medium transition-colors"
            >
              Try on Telegram →
            </a>
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4">
          {messages.length === 0 ? (
            <div className="text-center py-20">
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">N</span>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                  Ask me anything
                </h2>
                <p className="text-gray-500 text-base max-w-md mx-auto">
                  I'm Nexus AI, your intelligent assistant. I can help with questions, writing, analysis, and more.
                </p>
              </div>
              
              {/* iask.ai style example questions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {[
                  "Explain quantum computing in simple terms",
                  "Write a professional email template",
                  "What are the latest trends in AI?",
                  "Help me plan a vacation to Japan"
                ].map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(prompt)}
                    className="p-4 text-left bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-sm text-gray-700 border border-gray-200"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 space-y-8">
              {messages.map((message) => (
                <div key={message.id} className="max-w-none">
                  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-3xl ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white ml-16 px-4 py-3 rounded-2xl'
                          : 'text-gray-900 mr-16'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                      {message.metadata && message.role === 'assistant' && (
                        <div className="text-xs mt-4 pt-3 border-t border-gray-100 text-gray-400">
                          Powered by Nexus AI
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="mr-16">
                    <div className="flex items-center space-x-2 text-gray-500 text-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* iask.ai inspired input area */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything..."
                rows={1}
                className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm bg-white"
                style={{ minHeight: '48px', maxHeight: '120px' }}
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || loading}
                className="absolute right-3 bottom-3 p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-400">
                Nexus AI can make mistakes. Consider checking important information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};