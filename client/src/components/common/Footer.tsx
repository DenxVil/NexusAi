import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';

export const Footer: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">🔮</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">{t('appName')}</span>
                <span className="text-xs text-gray-400">{t('tagline')}</span>
              </div>
            </div>
            <p className="text-gray-300 mb-4">
              {t('description')}
            </p>
            <div className="flex space-x-4">
              <a href="https://t.me/NexusAiProbot" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                <span className="sr-only">Telegram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </a>
              <a href="https://denx.me/NexusAi" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white">
                <span className="sr-only">Website</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.09 0 2-.89 2-2 0-.55-.22-1.05-.59-1.41-.36-.36-.86-.59-1.41-.59H8c-2.21 0-4-1.79-4-4s1.79-4 4-4h8c2.21 0 4 1.79 4 4 0 5.52-4.48 10-10 10z" clipRule="evenodd" />
                </svg>
              </a>
              <button type="button" className="text-gray-300 hover:text-white">
                <span className="sr-only">GitHub</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">
              Product
            </h3>
            <ul className="space-y-2">
              <li><button type="button" className="text-gray-300 hover:text-white">Features</button></li>
              <li><button type="button" className="text-gray-300 hover:text-white">Pricing</button></li>
              <li><button type="button" className="text-gray-300 hover:text-white">API</button></li>
              <li><button type="button" className="text-gray-300 hover:text-white">Documentation</button></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">
              Support
            </h3>
            <ul className="space-y-2">
              <li><button type="button" className="text-gray-300 hover:text-white">Help Center</button></li>
              <li><button type="button" className="text-gray-300 hover:text-white">Contact</button></li>
              <li><button type="button" className="text-gray-300 hover:text-white">Privacy</button></li>
              <li><button type="button" className="text-gray-300 hover:text-white">Terms</button></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-700">
          <p className="text-center text-gray-400">
            © 2024 {t('appName')}. All rights reserved. {t('tagline')} with ❤️ for the AI community.
          </p>
        </div>
      </div>
    </footer>
  );
};