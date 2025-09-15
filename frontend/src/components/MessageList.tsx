import React, { useEffect, useRef } from 'react';
import { User, Bot, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Message } from '../types';

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 nexus-gradient rounded-full flex items-center justify-center mx-auto mb-6">
            <Bot className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-semibold mb-3 nexus-text-gradient">
            Welcome to NEXUS AI
          </h3>
          <p className="text-gray-400 mb-6">
            Start a conversation with our advanced AI assistant. Ask anything - from simple questions to complex problems.
          </p>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
              💡 Ask about any topic or subject
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
              🔍 Get research assistance and explanations
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
              💻 Request help with coding or technical tasks
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-4 ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          {message.role === 'assistant' && (
            <div className="flex-shrink-0">
              <div className="w-8 h-8 nexus-gradient rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
            </div>
          )}
          
          <div
            className={`max-w-3xl ${
              message.role === 'user'
                ? 'chat-bubble-user'
                : 'chat-bubble-ai'
            } p-4 shadow-lg`}
          >
            {message.isTyping ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">NEXUS AI is thinking</span>
                <div className="typing-dots"></div>
              </div>
            ) : (
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    code: ({ children }) => (
                      <code className="bg-slate-700/50 px-1.5 py-0.5 rounded text-sm font-mono">
                        {children}
                      </code>
                    ),
                    pre: ({ children }) => (
                      <pre className="bg-slate-700/50 p-3 rounded-lg overflow-x-auto">
                        {children}
                      </pre>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
            
            <div className="mt-2 text-xs opacity-60">
              {message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
          
          {message.role === 'user' && (
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-300" />
              </div>
            </div>
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;