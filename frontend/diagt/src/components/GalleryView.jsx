// import React from 'react';
// import { Grid, Maximize2, Clock, FileText, Loader2 } from 'lucide-react';
// import { Graphviz } from 'graphviz-react';

// export default function GalleryView({ savedDiagrams, onSelectDiagram, isLoading }) {
//   if (isLoading) {
//     return (
//       <div className="absolute inset-0 overflow-y-auto p-8">
//         <div className="flex flex-col items-center justify-center h-full text-gray-400">
//           <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
//             <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
//           </div>
//           <p className="text-sm font-medium text-gray-600">Loading diagrams...</p>
//         </div>
//       </div>
//     );
//   }

//   if (savedDiagrams.length === 0) {
//     return (
//       <div className="absolute inset-0 overflow-y-auto p-8">
//         <div className="flex flex-col items-center justify-center h-full text-gray-400">
//           <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
//             <Grid className="w-8 h-8 opacity-30" />
//           </div>
//           <p className="text-sm font-medium">No saved diagrams yet</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="absolute inset-0 overflow-y-auto p-8">
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//         {savedDiagrams.map((item) => (
//           <div 
//             key={item.$id} 
//             onClick={() => onSelectDiagram(item)}
//             className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-red-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-[280px]"
//           >
//             {/* Preview */}
//             <div className="flex-1 bg-gray-50 relative overflow-hidden p-4 flex items-center justify-center border-b border-gray-100">
//               <div className="opacity-70 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100 duration-500">
//                 <Graphviz 
//                   dot={item.diagram} 
//                   options={{ fit: true, height: 150, width: 250, zoom: false }} 
//                 />
//               </div>
              
//               {/* Hover Overlay */}
//               <div className="absolute inset-0 bg-red-900/0 group-hover:bg-red-900/5 transition-colors flex items-start justify-end p-3">
//                 <div className="opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
//                   <span className="bg-white shadow-md p-2 rounded-lg text-red-600 inline-flex">
//                     <Maximize2 className="w-4 h-4" />
//                   </span>
//                 </div>
//               </div>
//             </div>
            
//             {/* Meta */}
//             <div className="p-4 bg-white flex flex-col gap-2">
//               <div className="flex items-start gap-2">
//                 <FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
//                 <h3 className="text-xs font-semibold text-gray-700 line-clamp-2 leading-relaxed" title={item.prompt}>
//                   {item.prompt || "Untitled Architecture"}
//                 </h3>
//               </div>
//               <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-auto pt-2 border-t border-gray-50">
//                 <Clock className="w-3 h-3" />
//                 <span>{new Date(item.$createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

import React, { memo, useState } from 'react';
import { Grid, Maximize2, Clock, FileText, Loader2 } from 'lucide-react';
import { Graphviz } from 'graphviz-react';

const DiagramCard = memo(({ item, onSelectDiagram }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div 
      onClick={() => onSelectDiagram(item)}
      className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-red-200 hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col h-[280px] will-change-transform"
    >
      {/* Preview */}
      <div className="flex-1 bg-gray-50 relative overflow-hidden p-4 flex items-center justify-center border-b border-gray-100">
        {!imageError ? (
          <div className="opacity-70 group-hover:opacity-100 transition-opacity duration-200 scale-90 group-hover:scale-100 transform will-change-transform">
            <Graphviz 
              dot={item.diagram} 
              options={{ fit: true, height: 150, width: 250, zoom: false, engine: 'dot' }} 
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="text-gray-400 text-xs">Preview unavailable</div>
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-red-900/0 group-hover:bg-red-900/5 transition-colors duration-200 flex items-start justify-end p-3 pointer-events-none">
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0">
            <span className="bg-white shadow-md p-2 rounded-lg text-red-600 inline-flex">
              <Maximize2 className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>
      
      {/* Meta */}
      <div className="p-4 bg-white flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
          <h3 className="text-xs font-semibold text-gray-700 line-clamp-2 leading-relaxed" title={item.prompt}>
            {item.prompt || "Untitled Architecture"}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-auto pt-2 border-t border-gray-50">
          <Clock className="w-3 h-3" />
          <span>{new Date(item.$createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.item.$id === nextProps.item.$id;
});

DiagramCard.displayName = 'DiagramCard';

export default function GalleryView({ savedDiagrams, onSelectDiagram, isLoading }) {
  if (isLoading) {
    return (
      <div className="absolute inset-0 overflow-y-auto p-8">
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
          </div>
          <p className="text-sm font-medium text-gray-600">Loading diagrams...</p>
        </div>
      </div>
    );
  }

  if (savedDiagrams.length === 0) {
    return (
      <div className="absolute inset-0 overflow-y-auto p-8">
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Grid className="w-8 h-8 opacity-30" />
          </div>
          <p className="text-sm font-medium">No saved diagrams yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {savedDiagrams.map((item) => (
          <DiagramCard 
            key={item.$id}
            item={item}
            onSelectDiagram={onSelectDiagram}
          />
        ))}
      </div>
    </div>
  );
}