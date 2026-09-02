/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Storyboard } from './components/Storyboard';
import { Chat } from './components/Chat';
import { Scene } from './types';
import { Film, MessageCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'storyboard' | 'chat'>('storyboard');
  const [scenes, setScenes] = useState<Scene[]>([]);

  const handleGenerateImages = async (size: string) => {
    // Generate images sequentially for all scenes that don't have one
    const updatedScenes = [...scenes];
    for (let i = 0; i < updatedScenes.length; i++) {
      if (!updatedScenes[i].imageUrl) {
        updatedScenes[i].isGeneratingImage = true;
        updatedScenes[i].imageError = undefined;
        setScenes([...updatedScenes]); // Trigger re-render to show loading

        try {
          const res = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: updatedScenes[i].description, size }),
          });
          
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Failed to generate');
          }
          
          const data = await res.json();
          updatedScenes[i].imageUrl = data.imageUrl;
        } catch (error: any) {
          updatedScenes[i].imageError = error.message;
        } finally {
          updatedScenes[i].isGeneratingImage = false;
          setScenes([...updatedScenes]);
        }
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl z-10 shrink-0">
        <div className="p-6">
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Film className="w-7 h-7 text-indigo-400" />
            StoryCanvas
          </h1>
          <p className="text-xs text-slate-500 mt-2 uppercase tracking-wider font-semibold">AI Pre-production</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button
            onClick={() => setActiveTab('storyboard')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors font-medium ${
              activeTab === 'storyboard' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Film className="w-5 h-5 mr-3" />
            Storyboard
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors font-medium ${
              activeTab === 'chat' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <MessageCircle className="w-5 h-5 mr-3" />
            Character Chat
          </button>
        </nav>
        
        <div className="p-4 text-xs text-slate-500 text-center border-t border-slate-800">
          Powered by Gemini AI
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <div 
          className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
            activeTab === 'storyboard' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          <Storyboard 
            scenes={scenes} 
            onStoryboardGenerated={setScenes} 
            onGenerateImages={handleGenerateImages} 
          />
        </div>
        
        <div 
          className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${
            activeTab === 'chat' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          <Chat />
        </div>
      </div>
    </div>
  );
}

