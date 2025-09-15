import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { chatService } from '../services/chat';
import { aiService } from '../services/ai';
import { Chat, Message } from '../types';
import { Nexus3D } from '../components/common/Nexus3D';

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading Nexus AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Nexus AI</h1>
                <p className="text-sm text-gray-500">Advanced AI Assistant</p>
              </div>
            </div>
            
            {/* Floating Telegram Link */}
            <a
              href="https://t.me/NexusAiProbot"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.626 0 12 0zm5.568 8.16c-.166 1.58-.896 5.442-1.267 7.222-.157.75-.468 1.002-.769 1.027-.652.06-1.148-.43-1.78-.843-1.482-.97-2.32-1.573-3.757-2.52-1.66-1.094-.584-1.696.36-2.68.248-.259 4.531-4.16 4.61-4.525.011-.046.02-.219-.08-.31-.1-.092-.249-.06-.356-.036-.153.035-2.591 1.648-7.312 4.84-.692.475-1.32.708-1.882.696-.62-.013-1.81-.35-2.697-.638-.89-.297-1.6-.457-1.538-.963.032-.26.376-.526 1.032-.796 4.032-1.76 6.726-2.923 8.08-3.487 3.856-1.596 4.653-1.876 5.173-1.885.115-.002.37.027.535.166.138.117.177.27.196.378.02.108.043.354.024.546z"/>
              </svg>
              Try me on Telegram
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto h-screen flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              {/* 3D Nexus AI Logo */}
              <div className="mb-8">
                <Nexus3D className="mx-auto" />
              </div>
              
              <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Welcome to Nexus AI
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Your advanced AI assistant powered by cutting-edge technology. 
                  Ask me anything, and I'll provide intelligent, helpful responses.
                </p>
                
                {/* Example Prompts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {[
                    "🧠 Explain quantum computing",
                    "📝 Help me write an email",
                    "🎨 Generate a creative story",
                    "💡 Brainstorm startup ideas"
                  ].map((prompt, index) => (
                    <button
                      key={index}
                      onClick={() => setInputMessage(prompt.slice(2).trim())}
                      className="p-4 text-left bg-white hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors duration-200 shadow-sm hover:shadow-md"
                    >
                      <span className="text-gray-700">{prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl px-6 py-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white ml-8'
                        : 'bg-white text-gray-900 mr-8 border border-gray-200 shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                      {message.content}
                    </div>
                    {message.metadata && message.role === 'assistant' && (
                      <div className="text-xs mt-3 pt-3 border-t border-gray-100 text-gray-500">
                        {message.metadata.tokens} tokens • {message.metadata.responseTime}ms • Powered by Nexus AI
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl px-6 py-4 mr-8 shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-gray-500 text-sm">Nexus AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-gray-200/50 px-6 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Nexus AI anything..."
                rows={1}
                className="w-full px-6 py-4 pr-16 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white shadow-sm text-[15px] leading-relaxed"
                style={{ minHeight: '56px', maxHeight: '120px' }}
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || loading}
                className="absolute right-3 bottom-3 p-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-500">
                Nexus AI can make mistakes. Consider checking important information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};