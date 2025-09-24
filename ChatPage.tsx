import React from 'react';
import ChatSystem from '@/components/features/ChatSystem';

const ChatPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Community Chat
          </h1>
          <p className="text-slate-400 mt-1">
            Connect with fellow automotive enthusiasts, get help, and share your knowledge
          </p>
        </div>
      </div>

      {/* Chat System */}
      <ChatSystem />
      
      {/* Chat Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-3">💬 General Discussion</h3>
          <p className="text-slate-400 text-sm">
            Ask questions, share experiences, and connect with the community. Perfect for general automotive topics.
          </p>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-3">🔧 Tech Support</h3>
          <p className="text-slate-400 text-sm">
            Get technical help with your builds. Share diagnostic codes, ask for troubleshooting advice.
          </p>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-3">🏪 Buy/Sell/Trade</h3>
          <p className="text-slate-400 text-sm">
            Connect with other members for parts trading, recommendations, and marketplace discussions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;