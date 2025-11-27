import React from 'react';
import { Layout, Grid, Save } from 'lucide-react';

export default function HeaderTabs({ 
  activeTab, 
  onTabChange, 
  showSaveButton, 
  onSave 
}) {
  return (
    <div className="h-16 border-b border-gray-200 bg-white px-6 flex justify-between items-center shadow-sm z-20 flex-none">
      <div className="flex space-x-1 p-1 bg-gray-100/80 rounded-lg border border-gray-200/50">
        <button
          onClick={() => onTabChange('canvas')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md flex items-center gap-2 transition-all duration-200 ${
            activeTab === 'canvas' 
              ? 'bg-white text-red-600 shadow-sm ring-1 ring-black/5' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          Canvas
        </button>
        <button
          onClick={() => onTabChange('saved')}
          className={`px-4 py-1.5 text-xs font-semibold rounded-md flex items-center gap-2 transition-all duration-200 ${
            activeTab === 'saved' 
              ? 'bg-white text-red-600 shadow-sm ring-1 ring-black/5' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          Gallery
        </button>
      </div>
      
      {showSaveButton && (
        <button 
          onClick={onSave}
          className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 border border-red-200/50 flex items-center gap-2 transition-all"
        >
          <Save className="w-3.5 h-3.5" />
          Save to Cloud
        </button>
      )}
    </div>
  );
}