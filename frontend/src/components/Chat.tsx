import React from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import TelegramFloat from './TelegramFloat';
import { useChatContext } from '../context/ChatContext';

const Chat: React.FC = () => {
  const { messages } = useChatContext();

  return (
    <div className="min-h-screen bg-white">
      {/* Simple header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">NEXUS AI</h1>
            </div>
            <div className="text-sm text-gray-500">Advanced AI Assistant</div>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                <span className="text-white font-bold text-xl">AI</span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                What can I help you with?
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Ask me anything - from simple questions to complex problems. I'm here to help with research, coding, explanations, and more.
              </p>
              
              {/* Quick suggestions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
                <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900 mb-1">💡 Explain concepts</div>
                    <div className="text-sm text-gray-600">Get clear explanations on any topic</div>
                  </div>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900 mb-1">💻 Code assistance</div>
                    <div className="text-sm text-gray-600">Help with programming and development</div>
                  </div>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900 mb-1">🔍 Research help</div>
                    <div className="text-sm text-gray-600">Find information and analyze data</div>
                  </div>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer">
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900 mb-1">📝 Writing support</div>
                    <div className="text-sm text-gray-600">Create content and improve text</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <MessageList messages={messages} />
          )}
          
          <ChatInput />
        </div>
      </main>
      
      {/* Floating Telegram button */}
      <TelegramFloat />
    </div>
  );
};

export default Chat;