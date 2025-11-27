import React from 'react';
import { CheckCircle, X } from 'lucide-react';

export default function SuccessNotification({ show, onClose }) {
  if (!show) return null;

  return (
    <div className="fixed top-6 right-6 z-[60] animate-in slide-in-from-top-2 fade-in duration-300">
      <div className="bg-white border border-green-100 rounded-xl shadow-xl p-4 flex items-center gap-3 pr-8 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
        <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center text-green-600 flex-shrink-0">
          <CheckCircle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-gray-800">Saved Successfully</h4>
          <p className="text-xs text-gray-500">Your diagram has been saved to the cloud.</p>
        </div>
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}