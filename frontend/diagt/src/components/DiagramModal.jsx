import React, { useCallback } from 'react';
import { X, Clock } from 'lucide-react';
import { Graphviz } from 'graphviz-react';

export default function DiagramModal({ diagram, onClose, onLoadToCanvas }) {
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleLoadClick = useCallback(() => {
    onLoadToCanvas(diagram);
    onClose();
  }, [diagram, onLoadToCanvas, onClose]);

  if (!diagram) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-full max-h-[90vh] flex flex-col overflow-hidden ring-1 ring-gray-900/5">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-start bg-white flex-none">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-gray-400 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs font-mono">{new Date(diagram.$createdAt).toLocaleString()}</span>
            </div>
            <h2 className="text-sm font-medium text-gray-800 leading-relaxed">
              <span className="font-bold text-red-600 mr-2">Prompt:</span> 
              {diagram.prompt}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 p-1 bg-gray-50/50 overflow-hidden flex relative">
          <div className="absolute inset-0 flex items-center justify-center overflow-auto p-8">
            <Graphviz 
              dot={diagram.diagram} 
              options={{ 
                zoom: true, 
                fit: true, 
                height: '100%', 
                width: '100%' 
              }} 
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-gray-100 flex justify-between items-center flex-none">
          <span className="text-[10px] text-gray-300 font-mono">ID: {diagram.$id}</span>
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Close
            </button>
            <button 
              onClick={handleLoadClick} 
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-all shadow-md shadow-red-200"
            >
              Load into Canvas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}