import React from 'react';

const TelegramFloat: React.FC = () => {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <a
        href="https://t.me/NexusAiProbot"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center bg-[#0088cc] hover:bg-[#006ba3] text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
      >
        <svg
          className="w-6 h-6 mr-2"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16l-1.58 7.44c-.12.532-.432.66-.876.41l-2.42-1.784-1.168 1.124c-.128.128-.24.24-.492.24l.176-2.492L15.424 9.6c.188-.168-.04-.26-.292-.092L11.644 12.2l-2.432-.76c-.528-.164-.54-.528.108-.78l9.5-3.656c.44-.164.828.108.688.756z"/>
        </svg>
        <span className="font-medium">Chat on Telegram</span>
      </a>
    </div>
  );
};

export default TelegramFloat;