import React from 'react';
import { Send, Activity, Loader2 } from 'lucide-react';
import ProgressTimeline from './ProgressTimeline';

export default function Sidebar({ 
  prompt, 
  setPrompt, 
  handleSubmit, 
  isProcessing, 
  steps, 
  error 
}) {
  return (
    <div className="w-1/3 min-w-[400px] flex flex-col border-r border-gray-800 bg-[#0a0a0c] z-20 shadow-2xl">
      
      {/* Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            DiaFlow <span className="text-red-500">AI</span>
          </h1>
        </div>
        <p className="text-xs text-gray-500 font-medium pl-1">Automated Architecture Diagrams</p>
      </div>

      {/* Prompt Area */}
      <div className="p-6 flex-none">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 ml-1">
          Your Requirement
        </label>
        <form onSubmit={handleSubmit} className="relative group">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Design a scalable microservices architecture for an e-commerce platform with load balancers..."
            className="w-full h-40 p-4 pr-14 rounded-xl bg-[#141418] border border-gray-800 text-sm text-gray-200 placeholder-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:bg-[#18181c] transition-all resize-none outline-none leading-relaxed scrollbar-none"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={isProcessing || !prompt.trim()}
            className="absolute bottom-3 right-3 p-2 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-600 transition-all shadow-lg shadow-red-900/20 hover:shadow-red-600/30 hover:-translate-y-0.5"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>

      {/* Progress Timeline */}
      <ProgressTimeline 
        steps={steps} 
        isProcessing={isProcessing} 
        error={error} 
      />
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-800 bg-[#0e0e11]">
        <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity cursor-default">
          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-300 border border-gray-700">U</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-300 truncate">User Workspace</p>
            <p className="text-[10px] text-gray-600 truncate">Free Plan</p>
          </div>
        </div>
      </div>
    </div>
  );
}