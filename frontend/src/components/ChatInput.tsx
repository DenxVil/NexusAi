import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, Square } from 'lucide-react';
import { useChatContext } from '../context/ChatContext';

const ChatInput: React.FC = () => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage, isLoading } = useChatContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    resetTextareaHeight();
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const maxHeight = 120; // Max height for 4-5 lines
      const newHeight = Math.min(textareaRef.current.scrollHeight, maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Note: Voice recording functionality would be implemented here
    // For now, this is just a UI placeholder
  };

  const handleFileUpload = () => {
    // Note: File upload functionality would be implemented here
    // For now, this is just a UI placeholder
    alert('File upload feature coming soon!');
  };

  return (
    <div className="sticky bottom-0 backdrop-blur-xl bg-slate-900/90 border-t border-slate-800/50 p-4">
      <div className="container mx-auto max-w-4xl">
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-end gap-3 bg-slate-800/50 rounded-2xl border border-slate-700/50 p-3 focus-within:border-nexus-500/50 transition-colors">
            <button
              type="button"
              onClick={handleFileUpload}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700/50"
              disabled={isLoading}
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask NEXUS AI anything..."
              className="flex-1 bg-transparent text-white placeholder-gray-400 resize-none outline-none max-h-[120px] min-h-[24px] py-2"
              rows={1}
              disabled={isLoading}
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleRecording}
                className={`flex-shrink-0 p-2 transition-colors rounded-lg ${
                  isRecording
                    ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                }`}
                disabled={isLoading}
              >
                {isRecording ? (
                  <Square className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                  input.trim() && !isLoading
                    ? 'nexus-button'
                    : 'text-gray-500 bg-gray-700/30 cursor-not-allowed'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Input suggestions */}
          {!input && (
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                'Explain quantum computing',
                'Write a Python function',
                'What is artificial intelligence?',
                'Help me plan a project',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-1.5 text-sm bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 hover:text-white rounded-full border border-slate-700/30 hover:border-slate-600/50 transition-all"
                  disabled={isLoading}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </form>

        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">
            NEXUS AI can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;