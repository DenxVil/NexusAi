import React from 'react';
import Header from './Header';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import Footer from './Footer';
import { useChatContext } from '../context/ChatContext';

const Chat: React.FC = () => {
  const { messages } = useChatContext();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex flex-col relative">
        <MessageList messages={messages} />
        <ChatInput />
      </main>
      
      <Footer />
      
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 nexus-gradient rounded-full opacity-5 blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-5 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default Chat;