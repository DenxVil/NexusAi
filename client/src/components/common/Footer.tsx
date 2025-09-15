import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-6 mb-4">
            <a 
              href="https://t.me/NexusAiProbot" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-500 hover:text-blue-500 text-sm transition-colors"
            >
              Telegram Bot
            </a>
            <a 
              href="https://denx.me/Nexusai" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-500 hover:text-blue-500 text-sm transition-colors"
            >
              Website
            </a>
            <span className="text-gray-500 text-sm">
              Privacy
            </span>
            <span className="text-gray-500 text-sm">
              Terms
            </span>
          </div>
          
          <p className="text-xs text-gray-400">
            © 2024 Nexus AI. Made with ❤️ by ◉Ɗєиνιℓ
          </p>
        </div>
      </div>
    </footer>
  );
};