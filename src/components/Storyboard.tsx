import React, { useState } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, Loader2, Play } from 'lucide-react';
import { Scene } from '../types';

interface StoryboardProps {
  onStoryboardGenerated: (scenes: Scene[]) => void;
  scenes: Scene[];
  onGenerateImages: (size: string) => void;
}

export function Storyboard({ onStoryboardGenerated, scenes, onGenerateImages }: StoryboardProps) {
  const [script, setScript] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageSize, setImageSize] = useState('1K');
  const [error, setError] = useState<string | null>(null);

  const handleGenerateStoryboard = async () => {
    if (!script.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate storyboard');
      }
      const data = await res.json();
      onStoryboardGenerated(data.scenes || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-gray-200 shrink-0">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
          <FileText className="w-6 h-6 mr-2 text-blue-600" />
          Script to Storyboard
        </h2>
        <div className="space-y-4">
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Paste your script or scene description here..."
            className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">Image Size:</span>
              <select
                value={imageSize}
                onChange={(e) => setImageSize(e.target.value)}
                className="block w-24 pl-3 pr-10 py-2 text-base border-gray-300 border rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="1K">1K</option>
                <option value="2K">2K</option>
                <option value="4K">4K</option>
              </select>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleGenerateStoryboard}
                disabled={isGenerating || !script.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <FileText className="w-5 h-5 mr-2" />
                )}
                Breakdown Script
              </button>
              
              <button
                onClick={() => onGenerateImages(imageSize)}
                disabled={scenes.length === 0}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ImageIcon className="w-5 h-5 mr-2" />
                Generate All Images
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {scenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
            <ImageIcon className="w-16 h-16 opacity-20" />
            <p className="text-lg font-medium">No scenes yet. Break down a script first.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {scenes.map((scene) => (
              <div key={scene.sceneNumber} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow">
                <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
                  {scene.imageUrl ? (
                    <img src={scene.imageUrl} alt={`Scene ${scene.sceneNumber}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : scene.isGeneratingImage ? (
                    <div className="flex flex-col items-center justify-center text-blue-600">
                      <Loader2 className="w-8 h-8 animate-spin mb-2" />
                      <span className="text-sm font-medium">Generating image...</span>
                    </div>
                  ) : scene.imageError ? (
                    <div className="text-center p-4">
                      <p className="text-sm text-red-500 mb-2">{scene.imageError}</p>
                      <button 
                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                        onClick={() => {/* Single generation could be added here */}}
                      >
                        Try Again
                      </button>
                    </div>
                  ) : (
                    <ImageIcon className="w-10 h-10 text-gray-300" />
                  )}
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded">
                    Scene {scene.sceneNumber}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <p className="text-sm text-gray-600 mb-4 flex-1">
                    {scene.description}
                  </p>
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-900 italic">
                      "{scene.caption}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
