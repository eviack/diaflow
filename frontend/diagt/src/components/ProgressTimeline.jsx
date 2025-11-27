

import React, { useRef, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

const extractTags = (message) => {
  // Check if message contains concepts pattern
  const conceptMatch = message.match(/identified concepts?:\s*(.+?)(?:\.|$)/i);
  if (conceptMatch) {
    const conceptsText = conceptMatch[1];
    const concepts = conceptsText.split(',').map(c => c.trim()).filter(Boolean);
    const beforeText = message.substring(0, conceptMatch.index + conceptMatch[0].indexOf(':') + 1);
    return { beforeText, concepts, hasConcepts: true };
  }
  return { beforeText: message, concepts: [], hasConcepts: false };
};

export default function ProgressTimeline({ steps, isProcessing, error }) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [steps]);

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="space-y-0 relative ml-2">
        {/* Timeline Track */}
        {steps.length > 0 && (
          <div className="absolute left-[7px] top-3 bottom-3 w-px bg-gray-800/50"></div>
        )}

        {steps.map((step, index) => {
          const { beforeText, concepts, hasConcepts } = extractTags(step.message);
          
          return (
            <div key={index} className="group flex gap-4 items-start py-3 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="relative z-10 flex-shrink-0 mt-1">
                <div className="w-4 h-4 rounded-full bg-[#0a0a0c] border border-green-500/30 flex items-center justify-center group-hover:border-green-500 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-gray-400 group-hover:text-gray-200 transition-colors truncate">
                    {step.node}
                  </span>
                  <span className="text-[10px] text-gray-600 font-mono">{step.timestamp}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed break-words group-hover:text-gray-400 transition-colors">
                  {beforeText}
                </p>
                {hasConcepts && concepts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {concepts.map((concept, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-[10px] font-medium text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-colors"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex gap-4 items-center py-4">
            <div className="relative z-10 flex-shrink-0">
              <div className="w-4 h-4 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin" />
            </div>
            <span className="text-xs text-red-500/80 font-medium animate-pulse">Processing request...</span>
          </div>
        )}
        
        {error && (
          <div className="flex gap-4 items-start py-4">
            <div className="flex-shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
            <div className="flex-1 bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-red-400 text-xs">
              {error}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}