

import React, { memo, useRef } from 'react';
import { Layout, Download } from 'lucide-react';
import { Graphviz } from 'graphviz-react';

const CanvasView = memo(({ dotCode }) => {
  const graphRef = useRef(null);

  const downloadImage = (format) => {
    if (!graphRef.current) return;

    try {
      const svgElement = graphRef.current.querySelector('svg');
      if (!svgElement) return;

      const svgData = new XMLSerializer().serializeToString(svgElement);

      if (format === "svg") {
        const blob = new Blob([svgData], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `diagram-${Date.now()}.svg`;
        link.href = url;
        link.click();
        return;
      }

      // PNG Export
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          const link = document.createElement('a');
          link.download = `diagram-${Date.now()}.${format}`;
          link.href = URL.createObjectURL(blob);
          link.click();
          URL.revokeObjectURL(url);
        }, `image/${format}`);
      };

      img.src = url;
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  if (!dotCode) {
    return (
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="text-center max-w-sm mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Layout className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-gray-900 font-semibold mb-1">Empty Canvas</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Use the panel on the left to describe a system, and your AI-generated diagram will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <div className="w-full h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">

        {/* Toolbar */}
        <div className="h-10 border-b border-gray-100 flex items-center px-4 bg-white flex-none justify-between">

          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/30" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/30" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400/30" />
          </div>

          <span className="ml-4 text-[10px] font-mono text-gray-400">preview.dot</span>

          {/* -------- NEW DOWNLOAD BUTTON -------- */}
          <div className="flex gap-2">
            <button
              onClick={() => downloadImage("png")}
              className="px-2 py-1 flex items-center gap-1 text-[10px] bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 text-gray-700"
            >
              <Download className="w-3 h-3" /> PNG
            </button>

            <button
              onClick={() => downloadImage("svg")}
              className="px-2 py-1 flex items-center gap-1 text-[10px] bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 text-gray-700"
            >
              <Download className="w-3 h-3" /> SVG
            </button>
          </div>
        </div>

        {/* Diagram */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-400">
          <div ref={graphRef} className="transform transition-transform duration-200 min-w-full min-h-full flex items-center justify-center will-change-transform">
            <Graphviz
              dot={dotCode}
              options={{
                zoom: true,
                fit: true,
                height: '100%',
                width: '100%',
                engine: 'dot'
              }}
              className="w-full h-full"
            />
          </div>
        </div>

      </div>
    </div>
  );
});

CanvasView.displayName = 'CanvasView';

export default CanvasView;



