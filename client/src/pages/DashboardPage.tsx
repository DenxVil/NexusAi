import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { chatService } from '../services/chat';
import { Chat } from '../types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await chatService.getChats(1, 10);
        if (response.success) {
          setChats(response.data.chats);
        }
      } catch (error: any) {
        setError('Failed to load chats');
        console.error('Error fetching chats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* iask.ai inspired minimal header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Welcome back, {user?.firstName || user?.username}
          </h1>
          <p className="text-gray-500">
            Continue your conversations or start a new one
          </p>
        </div>

        {/* Quick start button */}
        <div className="text-center mb-12">
          <Link
            to="/chat"
            className="inline-flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-medium transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </Link>
        </div>

        {/* Recent conversations */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Recent Conversations</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-500 text-sm">Loading conversations...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-base font-medium text-gray-900 mb-2">No conversations yet</h3>
              <p className="text-gray-500 text-sm mb-6">Start your first conversation with Nexus AI</p>
              <Link
                to="/chat"
                className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Start Chatting
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {chats.slice(0, 8).map((chat) => (
                <Link
                  key={chat._id}
                  to={`/chat/${chat._id}`}
                  className="block p-4 hover:bg-gray-50 rounded-xl border border-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate mb-1">
                        {chat.title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {chat.metadata.totalMessages} messages • {formatDate(chat.metadata.lastActivity)}
                      </p>
                    </div>
                    <div className="ml-3 text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
              
              {chats.length > 8 && (
                <div className="text-center pt-4">
                  <span className="text-sm text-gray-500">
                    {chats.length - 8} more conversations
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center mt-16">
          <p className="text-xs text-gray-400">
            Nexus AI • Powered by advanced language models
          </p>
        </div>
      </div>
    </div>
  );
};