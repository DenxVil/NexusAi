// Created with love 🩶 by Denvil 🧑‍💻
// Floating Telegram Link Component

import React from 'react';
import configService from '../../services/config';

interface TelegramFloatProps {
  className?: string;
}

export const TelegramFloat: React.FC<TelegramFloatProps> = ({ className = '' }) => {
  const telegramUrl = configService.getTelegramBotUrl();

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center space-x-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
      >
        {/* Telegram Icon */}
        <svg 
          className="w-6 h-6" 
          viewBox="0 0 24 24" 
          fill="currentColor"
        >
          <path d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.626 0 12 0zm5.568 8.16c-.181 1.858-.513 6.011-.693 8.025-.076.852-.225 1.134-.369 1.161-.313.028-.513-.207-.794-.404-1.109-.771-1.735-1.248-2.815-2.003-1.181-.826-.409-1.277.26-2.019.174-.193 3.306-3.03 3.367-3.287.008-.032.014-.15-.056-.212-.07-.063-.174-.041-.249-.024-.106.024-1.793 1.139-5.062 3.345-.48.329-.913.489-1.302.481-.428-.009-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.324-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.14.121.098.155.228.171.32.016.092.036.301.02.465z"/>
        </svg>
        
        {/* Text */}
        <span className="hidden sm:block font-medium text-sm">
          Try me on Telegram
        </span>
        
        {/* Mobile-only pulse indicator */}
        <div className="sm:hidden absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
      </a>
    </div>
  );
};

export default TelegramFloat;