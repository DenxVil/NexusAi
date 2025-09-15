// Created with love 🩶 by Denvil 🧑‍💻
// Main landing page inspired by iask.ai design

import React, { useState } from 'react';
import { Nexus3D } from '../components/common/Nexus3D';
import { TelegramFloat } from '../components/common/TelegramFloat';

export const MainPage: React.FC = () => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    setLoading(true);
    
    // Simulate chat response
    try {
      // TODO: Connect to actual AI service
      setTimeout(() => {
        console.log('Message sent:', message);
        setLoading(false);
        setMessage('');
      }, 2000);
    } catch (error) {
      console.error('Error sending message:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        
        {/* 3D Logo Section */}
        <div className="mb-8">
          <Nexus3D width={400} height={300} className="rounded-lg" />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            NEXUS AI
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-2">
            Advanced Intelligence Platform
          </p>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Powered by multiple AI services including Perplexity, Gemini, and HuggingFace with intelligent fallback systems.
          </p>
        </div>

        {/* Chat Input - iask.ai inspired */}
        <div className="w-full max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-2 focus-within:border-blue-400/50 transition-colors">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask me anything..."
                className="w-full bg-transparent text-white placeholder-slate-400 border-0 outline-none resize-none px-4 py-3 text-lg leading-relaxed"
                rows={1}
                style={{ 
                  minHeight: '60px',
                  maxHeight: '200px',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as any);
                  }
                }}
              />
              
              {/* Send Button */}
              <div className="flex items-center justify-between mt-2 px-2">
                <div className="text-xs text-slate-400">
                  Press Enter to send, Shift+Enter for new line
                </div>
                <button
                  type="submit"
                  disabled={!message.trim() || loading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Thinking...</span>
                    </>
                  ) : (
                    <>
                      <span>Send</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
            <p className="text-slate-400 text-sm">Sequential AI provider chain ensures fast and reliable responses</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Multi-AI Powered</h3>
            <p className="text-slate-400 text-sm">Harnesses the power of multiple AI services for optimal results</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Mobile Ready</h3>
            <p className="text-slate-400 text-sm">Available on Telegram bot for seamless mobile experience</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-slate-400 text-sm">
            Created with love 🩶 by <span className="text-blue-400 font-medium">Denvil</span> 🧑‍💻
          </p>
          <div className="mt-4 flex justify-center space-x-6 text-sm">
            <a href="https://denx.me" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
              Website
            </a>
            <a href="https://t.me/NexusAiProbot" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
              Telegram Bot
            </a>
          </div>
        </div>
      </div>

      {/* Floating Telegram Link */}
      <TelegramFloat />
    </div>
  );
};

export default MainPage;