


// import React, { useState, useEffect, useRef } from 'react';
// import { Send, Activity, CheckCircle, AlertCircle, Loader2, Save, Layout, Grid, X, Maximize2, Clock, FileText } from 'lucide-react';
// import { Graphviz } from 'graphviz-react';
// import { Client, Databases, ID, Query } from 'appwrite';

// const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
// const TABLE_ID = import.meta.env.VITE_APPWRITE_TABLE_ID;

// const client = new Client()
//     .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
//     .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

// const databases = new Databases(client);



// export default function App() {
//   const [prompt, setPrompt] = useState('');
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [steps, setSteps] = useState([]);
//   const [dotCode, setDotCode] = useState('');
//   const [error, setError] = useState(null);
//   const [activeTab, setActiveTab] = useState('canvas'); // 'canvas' or 'saved'
//   const [savedDiagrams, setSavedDiagrams] = useState([]);
//   const [selectedDiagram, setSelectedDiagram] = useState(null); // For modal
//   const [showSaveSuccess, setShowSaveSuccess] = useState(false); // For save confirmation
//   const messagesEndRef = useRef(null);

//   // Scroll to bottom of progress
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [steps]);

//   // Fetch saved diagrams on tab change
//   useEffect(() => {
//     if (activeTab === 'saved') {
//       fetchSavedDiagrams();
//     }
//   }, [activeTab]);

//   // Auto-hide save notification
//   useEffect(() => {
//     if (showSaveSuccess) {
//       const timer = setTimeout(() => setShowSaveSuccess(false), 3000);
//       return () => clearTimeout(timer);
//     }
//   }, [showSaveSuccess]);

//   // --- Appwrite Functions ---

//   const saveDiagramToDb = async (code) => {
//     try {
//       if (!code) return;
//       await databases.createDocument(
//         DATABASE_ID,
//         TABLE_ID,
//         ID.unique(),
//         {
//           diagram: code,
//           prompt: prompt,
//         }
//       );
//       setShowSaveSuccess(true);
//       fetchSavedDiagrams(); 
//     } catch (err) {
//       console.error("Appwrite Save Error (Check config):", err);
//       // Fallback
//       const localSave = JSON.parse(localStorage.getItem('saved_diagrams') || '[]');
//       localSave.push({
//         $id: Date.now().toString(),
//         diagram: code,
//         $createdAt: new Date().toISOString(),
//         prompt: prompt || "Generated Diagram"
//       });
//       localStorage.setItem('saved_diagrams', JSON.stringify(localSave));
//       setShowSaveSuccess(true);
//     }
//   };

//   const fetchSavedDiagrams = async () => {
//     try {
//       const response = await databases.listDocuments(
//         DATABASE_ID,
//         TABLE_ID,
//         [Query.orderDesc('$createdAt')]
//       );
//       setSavedDiagrams(response.documents);
//     } catch (err) {
//       console.error("Appwrite Fetch Error (Check config):", err);
//        // Fallback
//        const localSave = JSON.parse(localStorage.getItem('saved_diagrams') || '[]');
//        setSavedDiagrams(localSave.reverse());
//     }
//   };

//   // --- Main Logic ---

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!prompt.trim()) return;

//     setIsProcessing(true);
//     setActiveTab('canvas'); 
//     setSteps([]);
//     setDotCode('');
//     setError(null);

//     try {
//       const response = await fetch('http://localhost:8000/draw/stream', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ prompt })
//       });

//       if (!response.ok) throw new Error('Failed to connect to server');

//       const reader = response.body.getReader();
//       const decoder = new TextDecoder();

//       while (true) {
//         const { value, done } = await reader.read();
//         if (done) break;
        
//         const chunk = decoder.decode(value, { stream: true });
//         const lines = chunk.split('\n\n');
        
//         for (const line of lines) {
//           if (line.startsWith('data: ')) {
//             try {
//               const data = JSON.parse(line.slice(6));
              
//               if (data.type === 'progress') {
//                 setSteps(prev => [...prev, {
//                   node: data.node,
//                   message: data.message,
//                   status: 'complete',
//                   timestamp: new Date().toLocaleTimeString()
//                 }]);
//               } else if (data.type === 'result') {
//                 if (data.status === 'success') {
//                   setDotCode(data.dot_code);
//                 } else {
//                   setError(data.final_message || "Failed to generate diagram");
//                 }
//                 setIsProcessing(false);
//               }
//             } catch (e) {
//               console.error("Error parsing SSE message", e);
//             }
//           }
//         }
//       }
//     } catch (err) {
//       setError(err.message);
//       setIsProcessing(false);
//     }
//   };

//   return (
//     <div className="flex h-screen bg-[#0f0f12] text-white font-sans overflow-hidden antialiased selection:bg-red-500 selection:text-white">
      
//       {/* Left Sidebar: Darker & Red Theme */}
//       <div className="w-1/3 min-w-[400px] flex flex-col border-r border-gray-800 bg-[#0a0a0c] z-20 shadow-2xl">
        
//         <div className="p-6 border-b border-gray-800">
//           <div className="flex items-center gap-3 mb-2">
//             <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/20">
//               <Activity className="w-5 h-5 text-white" />
//             </div>
//             <h1 className="text-xl font-bold tracking-tight text-white">
//               DiaFlow <span className="text-red-500">AI</span>
//             </h1>
//           </div>
//           <p className="text-xs text-gray-500 font-medium pl-1">Automated Architecture Diagrams</p>
//         </div>

//         {/* Prompt Area */}
//         <div className="p-6 flex-none">
//           <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 ml-1">
//             Your Requirement
//           </label>
//           <form onSubmit={handleSubmit} className="relative group">
//             <textarea
//               value={prompt}
//               onChange={(e) => setPrompt(e.target.value)}
//               placeholder="e.g. Design a scalable microservices architecture for an e-commerce platform with load balancers..."
//               className="w-full h-40 p-4 pr-14 rounded-xl bg-[#141418] border border-gray-800 text-sm text-gray-200 placeholder-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500 focus:bg-[#18181c] transition-all resize-none outline-none leading-relaxed scrollbar-none"
//               disabled={isProcessing}
//             />
//             <button
//               type="submit"
//               disabled={isProcessing || !prompt.trim()}
//               className="absolute bottom-3 right-3 p-2 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-600 transition-all shadow-lg shadow-red-900/20 hover:shadow-red-600/30 hover:-translate-y-0.5"
//             >
//               {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
//             </button>
//           </form>
//         </div>

//         {/* Progress Timeline - No visible scrollbar */}
//         <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-none">
//           <div className="space-y-0 relative ml-2">
//             {/* Timeline Track */}
//             {steps.length > 0 && (
//               <div className="absolute left-[7px] top-3 bottom-3 w-px bg-gray-800/50"></div>
//             )}

//             {steps.map((step, index) => (
//               <div key={index} className="group flex gap-4 items-start py-3 animate-in fade-in slide-in-from-left-2 duration-300">
//                 <div className="relative z-10 flex-shrink-0 mt-1">
//                   <div className="w-4 h-4 rounded-full bg-[#0a0a0c] border border-green-500/30 flex items-center justify-center group-hover:border-green-500 transition-colors">
//                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
//                   </div>
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <div className="flex justify-between items-center mb-1">
//                     <span className="text-xs font-semibold text-gray-400 group-hover:text-gray-200 transition-colors truncate">
//                       {step.node}
//                     </span>
//                     <span className="text-[10px] text-gray-600 font-mono">{step.timestamp}</span>
//                   </div>
//                   <p className="text-xs text-gray-500 leading-relaxed break-words group-hover:text-gray-400 transition-colors">
//                     {step.message}
//                   </p>
//                 </div>
//               </div>
//             ))}

//             {isProcessing && (
//               <div className="flex gap-4 items-center py-4">
//                 <div className="relative z-10 flex-shrink-0">
//                   <div className="w-4 h-4 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin" />
//                 </div>
//                 <span className="text-xs text-red-500/80 font-medium animate-pulse">Processing request...</span>
//               </div>
//             )}
            
//             {error && (
//                <div className="flex gap-4 items-start py-4">
//                 <div className="flex-shrink-0 mt-0.5">
//                   <AlertCircle className="w-4 h-4 text-red-500" />
//                 </div>
//                 <div className="flex-1 bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-red-400 text-xs">
//                   {error}
//                 </div>
//               </div>
//             )}
//             <div ref={messagesEndRef} />
//           </div>
//         </div>
        
//         {/* Footer */}
//         <div className="p-4 border-t border-gray-800 bg-[#0e0e11]">
//            <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity cursor-default">
//               <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-300 border border-gray-700">U</div>
//               <div className="flex-1 min-w-0">
//                  <p className="text-xs font-medium text-gray-300 truncate">User Workspace</p>
//                  <p className="text-[10px] text-gray-600 truncate">Free Plan</p>
//               </div>
//            </div>
//         </div>
//       </div>

//       {/* Right Panel: Content */}
//       <div className="flex-1 flex flex-col bg-white h-full relative overflow-hidden">
        
//         {/* Header Bar */}
//         <div className="h-16 border-b border-gray-200 bg-white px-6 flex justify-between items-center shadow-sm z-20 flex-none">
//           <div className="flex space-x-1 p-1 bg-gray-100/80 rounded-lg border border-gray-200/50">
//             <button
//               onClick={() => setActiveTab('canvas')}
//               className={`px-4 py-1.5 text-xs font-semibold rounded-md flex items-center gap-2 transition-all duration-200 ${
//                 activeTab === 'canvas' 
//                   ? 'bg-white text-red-600 shadow-sm ring-1 ring-black/5' 
//                   : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
//               }`}
//             >
//               <Layout className="w-3.5 h-3.5" />
//               Canvas
//             </button>
//             <button
//               onClick={() => setActiveTab('saved')}
//               className={`px-4 py-1.5 text-xs font-semibold rounded-md flex items-center gap-2 transition-all duration-200 ${
//                 activeTab === 'saved' 
//                    ? 'bg-white text-red-600 shadow-sm ring-1 ring-black/5' 
//                   : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
//               }`}
//             >
//               <Grid className="w-3.5 h-3.5" />
//               Gallery
//             </button>
//           </div>
          
//           {activeTab === 'canvas' && dotCode && (
//             <button 
//               onClick={() => saveDiagramToDb(dotCode)}
//               className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 border border-red-200/50 flex items-center gap-2 transition-all"
//             >
//               <Save className="w-3.5 h-3.5" />
//               Save to Cloud
//             </button>
//           )}
//         </div>

//         {/* Main Content */}
//         <div className="flex-1 relative bg-gray-50/50 overflow-hidden">
          
//           {/* --- CANVAS VIEW --- */}
//           {activeTab === 'canvas' && (
//             <div className="absolute inset-0 flex items-center justify-center p-4">
//               {dotCode ? (
//                 <div className="w-full h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
//                   {/* Toolbar for Canvas */}
//                   <div className="h-10 border-b border-gray-100 flex items-center px-4 bg-white flex-none">
//                      <div className="flex gap-1.5">
//                         <div className="w-2.5 h-2.5 rounded-full bg-red-400/30" />
//                         <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/30" />
//                         <div className="w-2.5 h-2.5 rounded-full bg-green-400/30" />
//                      </div>
//                      <span className="ml-4 text-[10px] font-mono text-gray-400">preview.dot</span>
//                   </div>
//                   <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">
//                      <div className="transform transition-transform duration-300 min-w-full min-h-full flex items-center justify-center">
//                         <Graphviz 
//                           dot={dotCode} 
//                           options={{ 
//                             zoom: true, 
//                             fit: true, 
//                             height: '100%', 
//                             width: '100%'
//                           }} 
//                           className="w-full h-full"
//                         />
//                      </div>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="text-center max-w-sm mx-auto">
//                   <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
//                     <Layout className="w-8 h-8 text-gray-300" />
//                   </div>
//                   <h3 className="text-gray-900 font-semibold mb-1">Empty Canvas</h3>
//                   <p className="text-xs text-gray-500 leading-relaxed">
//                     Use the panel on the left to describe a system, and your AI-generated diagram will appear here.
//                   </p>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* --- SAVED GALLERY VIEW --- */}
//           {activeTab === 'saved' && (
//             <div className="absolute inset-0 overflow-y-auto p-8">
//               {savedDiagrams.length === 0 ? (
//                 <div className="flex flex-col items-center justify-center h-full text-gray-400">
//                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
//                       <Grid className="w-8 h-8 opacity-30" />
//                    </div>
//                    <p className="text-sm font-medium">No saved diagrams yet</p>
//                 </div>
//               ) : (
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//                   {savedDiagrams.map((item) => (
//                     <div 
//                       key={item.$id} 
//                       onClick={() => setSelectedDiagram(item)}
//                       className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-red-200 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-[280px]"
//                     >
//                       {/* Preview */}
//                       <div className="flex-1 bg-gray-50 relative overflow-hidden p-4 flex items-center justify-center border-b border-gray-100">
//                          <div className="opacity-70 group-hover:opacity-100 transition-opacity scale-90 group-hover:scale-100 duration-500">
//                            {/* Mini Graphviz */}
//                            <Graphviz 
//                               dot={item.diagram} 
//                               options={{ fit: true, height: 150, width: 250, zoom: false }} 
//                            />
//                         </div>
//                         {/* Hover Overlay */}
//                         <div className="absolute inset-0 bg-red-900/0 group-hover:bg-red-900/5 transition-colors flex items-start justify-end p-3">
//                            <div className="opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
//                               <span className="bg-white shadow-md p-2 rounded-lg text-red-600 inline-flex">
//                                  <Maximize2 className="w-4 h-4" />
//                               </span>
//                            </div>
//                         </div>
//                       </div>
                      
//                       {/* Meta */}
//                       <div className="p-4 bg-white flex flex-col gap-2">
//                         <div className="flex items-start gap-2">
//                            <FileText className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
//                            <h3 className="text-xs font-semibold text-gray-700 line-clamp-2 leading-relaxed" title={item.prompt}>
//                              {item.prompt || "Untitled Architecture"}
//                            </h3>
//                         </div>
//                         <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-auto pt-2 border-t border-gray-50">
//                            <Clock className="w-3 h-3" />
//                            <span>{new Date(item.$createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Success Dialog for Save */}
//       {showSaveSuccess && (
//         <div className="fixed top-6 right-6 z-[60] animate-in slide-in-from-top-2 fade-in duration-300">
//           <div className="bg-white border border-green-100 rounded-xl shadow-xl p-4 flex items-center gap-3 pr-8 relative overflow-hidden">
//             <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
//             <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center text-green-600 flex-shrink-0">
//               <Check className="w-5 h-5" />
//             </div>
//             <div>
//               <h4 className="text-sm font-bold text-gray-800">Saved Successfully</h4>
//               <p className="text-xs text-gray-500">Your diagram has been saved to the cloud.</p>
//             </div>
//             <button 
//               onClick={() => setShowSaveSuccess(false)}
//               className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
//             >
//               <X className="w-3 h-3" />
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Full Screen Modal */}
//       {selectedDiagram && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-full max-h-[90vh] flex flex-col overflow-hidden ring-1 ring-gray-900/5">
            
//             {/* Modal Header */}
//             <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-start bg-white flex-none">
//               <div className="max-w-3xl">
//                 <div className="flex items-center gap-2 text-gray-400 mb-1">
//                    <Clock className="w-3.5 h-3.5" />
//                    <span className="text-xs font-mono">{new Date(selectedDiagram.$createdAt).toLocaleString()}</span>
//                 </div>
//                 <h2 className="text-sm font-medium text-gray-800 leading-relaxed">
//                    <span className="font-bold text-red-600 mr-2">Prompt:</span> 
//                    {selectedDiagram.prompt}
//                 </h2>
//               </div>
//               <button 
//                 onClick={() => setSelectedDiagram(null)}
//                 className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             {/* Modal Content */}
//             <div className="flex-1 p-1 bg-gray-50/50 overflow-hidden flex relative">
//               <div className="absolute inset-0 flex items-center justify-center overflow-auto p-8">
//                 <Graphviz 
//                   dot={selectedDiagram.diagram} 
//                   options={{ 
//                     zoom: true, 
//                     fit: true, 
//                     height: '100%', 
//                     width: '100%' 
//                   }} 
//                   className="w-full h-full"
//                 />
//               </div>
//             </div>

//             {/* Modal Footer */}
//             <div className="px-6 py-4 bg-white border-t border-gray-100 flex justify-between items-center flex-none">
//                <span className="text-[10px] text-gray-300 font-mono">ID: {selectedDiagram.$id}</span>
//                <div className="flex gap-3">
//                   <button 
//                     onClick={() => setSelectedDiagram(null)}
//                     className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
//                   >
//                     Close
//                   </button>
//                   <button 
//                      onClick={() => {
//                         setDotCode(selectedDiagram.diagram);
//                         setPrompt(selectedDiagram.prompt || ""); 
//                         setActiveTab('canvas');
//                         setSelectedDiagram(null);
//                      }} 
//                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 transition-all shadow-md shadow-red-200"
//                   >
//                      Load into Canvas
//                   </button>
//                </div>
//             </div>
//           </div>
//         </div>
//       )}

//     </div>
//   );
// }
