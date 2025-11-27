
import React, { useState, useEffect, useCallback, useMemo, useTransition } from 'react';
import { Client, Databases, ID, Query } from 'appwrite';
import Sidebar from './components/Sidebar';
import HeaderTabs from './components/HeaderTabs';
import CanvasView from './components/CanvasView';
import GalleryView from './components/GalleryView';
import DiagramModal from './components/DiagramModal';
import SuccessNotification from './components/SuccessNotification';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const TABLE_ID = import.meta.env.VITE_APPWRITE_TABLE_ID;

const client = new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [steps, setSteps] = useState([]);
  const [dotCode, setDotCode] = useState('');
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('canvas');
  const [savedDiagrams, setSavedDiagrams] = useState([]);
  const [selectedDiagram, setSelectedDiagram] = useState(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isLoadingGallery, setIsLoadingGallery] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Fetch saved diagrams on tab change
  useEffect(() => {
    if (activeTab === 'saved') {
      fetchSavedDiagrams();
    }
  }, [activeTab]);

  // Auto-hide save notification
  useEffect(() => {
    if (showSaveSuccess) {
      const timer = setTimeout(() => setShowSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSaveSuccess]);

  // --- Appwrite Functions ---
  const saveDiagramToDb = useCallback(async (code) => {
    try {
      if (!code) return;
      await databases.createDocument(
        DATABASE_ID,
        TABLE_ID,
        ID.unique(),
        {
          diagram: code,
          prompt: prompt,
        }
      );
      setShowSaveSuccess(true);
      fetchSavedDiagrams(); 
    } catch (err) {
      console.error("Appwrite Save Error (Check config):", err);
      // Fallback
      const localSave = JSON.parse(localStorage.getItem('saved_diagrams') || '[]');
      localSave.push({
        $id: Date.now().toString(),
        diagram: code,
        $createdAt: new Date().toISOString(),
        prompt: prompt || "Generated Diagram"
      });
      localStorage.setItem('saved_diagrams', JSON.stringify(localSave));
      setShowSaveSuccess(true);
    }
  }, [prompt]);

  const fetchSavedDiagrams = useCallback(async () => {
    setIsLoadingGallery(true);
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        TABLE_ID,
        [Query.orderDesc('$createdAt')]
      );
      setSavedDiagrams(response.documents);
    } catch (err) {
      console.error("Appwrite Fetch Error (Check config):", err);
      // Fallback
      const localSave = JSON.parse(localStorage.getItem('saved_diagrams') || '[]');
      setSavedDiagrams(localSave.reverse());
    } finally {
      setIsLoadingGallery(false);
    }
  }, []);

  const handleLoadToCanvas = useCallback((diagram) => {
    startTransition(() => {
      setDotCode(diagram.diagram);
      setPrompt(diagram.prompt || ""); 
      setActiveTab('canvas');
    });
  }, []);

  const handleTabChange = useCallback((tab) => {
    startTransition(() => {
      setActiveTab(tab);
    });
  }, []);

  // --- Main Logic ---
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsProcessing(true);
    startTransition(() => {
      setActiveTab('canvas');
    });
    setSteps([]);
    setDotCode('');
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/draw/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) throw new Error('Failed to connect to server');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'progress') {
                setSteps(prev => [...prev, {
                  node: data.node,
                  message: data.message,
                  status: 'complete',
                  timestamp: new Date().toLocaleTimeString()
                }]);
              } else if (data.type === 'result') {
                if (data.status === 'success') {
                  setDotCode(data.dot_code);
                } else {
                  setError(data.final_message || "Failed to generate diagram");
                }
                setIsProcessing(false);
              }
            } catch (e) {
              console.error("Error parsing SSE message", e);
            }
          }
        }
      }
    } catch (err) {
      setError(err.message);
      setIsProcessing(false);
    }
  }, [prompt]);

  const showSaveButton = useMemo(() => 
    activeTab === 'canvas' && dotCode, 
    [activeTab, dotCode]
  );

  return (
    <div className="flex h-screen bg-[#0f0f12] text-white font-sans overflow-hidden antialiased selection:bg-red-500 selection:text-white">
      
      {/* Left Sidebar */}
      <Sidebar 
        prompt={prompt}
        setPrompt={setPrompt}
        handleSubmit={handleSubmit}
        isProcessing={isProcessing}
        steps={steps}
        error={error}
      />

      {/* Right Panel */}
      <div className="flex-1 flex flex-col bg-white h-full relative overflow-hidden">
        
        {/* Header Tabs */}
        <HeaderTabs 
          activeTab={activeTab}
          onTabChange={handleTabChange}
          showSaveButton={showSaveButton}
          onSave={() => saveDiagramToDb(dotCode)}
        />

        {/* Main Content */}
        <div className="flex-1 relative bg-gray-50/50 overflow-hidden">
          <div className={`absolute inset-0 transition-opacity duration-200 ${activeTab === 'canvas' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <CanvasView dotCode={dotCode} />
          </div>
          <div className={`absolute inset-0 transition-opacity duration-200 ${activeTab === 'saved' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            <GalleryView 
              savedDiagrams={savedDiagrams}
              onSelectDiagram={setSelectedDiagram}
              isLoading={isLoadingGallery}
            />
          </div>
        </div>
      </div>

      {/* Success Notification */}
      <SuccessNotification 
        show={showSaveSuccess}
        onClose={() => setShowSaveSuccess(false)}
      />

      {/* Full Screen Modal */}
      <DiagramModal 
        diagram={selectedDiagram}
        onClose={() => setSelectedDiagram(null)}
        onLoadToCanvas={handleLoadToCanvas}
      />

    </div>
  );
}