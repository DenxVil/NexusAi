import React from 'react';
import { RotateCcw, Github, MessageCircle } from 'lucide-react';
import { useChatContext } from '../context/ChatContext';

const Footer: React.FC = () => {
  const { clearMessages, messages } = useChatContext();

  const handleClearChat = () => {
    if (messages.length > 0) {
      if (window.confirm('Are you sure you want to clear all messages?')) {
        clearMessages();
      }
    }
  };

  return (
    <footer className="border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleClearChat}
              disabled={messages.length === 0}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                messages.length > 0
                  ? 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                  : 'text-gray-600 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              Clear Chat
            </button>
            
            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
              <span>Powered by</span>
              <span className="nexus-text-gradient font-semibold">NEXUS AI</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/DenxVil/NexusAi"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50"
              title="GitHub Repository"
            >
              <Github className="w-5 h-5" />
            </a>
            
            <a
              href="https://t.me/NexusAiProbot"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50"
              title="Telegram Bot"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
            
            <div className="text-xs text-gray-500 hidden sm:block">
              v1.0.0
            </div>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-slate-800/30 text-center">
          <p className="text-xs text-gray-500">
            Made with ❤️ by{' '}
            <span className="text-purple-400 font-medium">◉Ɗєиνιℓ</span>
            {' '}- Where artificial intelligence meets exceptional user experience
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;