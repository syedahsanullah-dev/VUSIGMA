'use client';
import React from 'react';
import { X, Settings2, RotateCcw } from 'lucide-react';
import useSettingsStore from '@/store/useSettingsStore';

export default function SettingsModal() {
  const {
    questionSize,
    optionSize,
    explanationSize,
    urduSize,
    setQuestionSize,
    setOptionSize,
    setExplanationSize,
    setUrduSize,
    resetSettings,
    isSettingsOpen,
    closeSettingsModal
  } = useSettingsStore();

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
              <Settings2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Display Settings</h2>
          </div>
          <button 
            onClick={closeSettingsModal}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-8 scrollbar-none">
          
          {/* Question Text Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Question Text Size</label>
              <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">{questionSize}px</span>
            </div>
            <input 
              type="range" 
              min="14" max="32" step="1" 
              value={questionSize} 
              onChange={(e) => setQuestionSize(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
              <p style={{ fontSize: `${questionSize}px` }} className="text-slate-900 dark:text-white font-semibold leading-relaxed">
                Preview: What is the capital of France?
              </p>
            </div>
          </div>

          {/* Options Text Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Options / Answers Size</label>
              <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">{optionSize}px</span>
            </div>
            <input 
              type="range" 
              min="12" max="24" step="1" 
              value={optionSize} 
              onChange={(e) => setOptionSize(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-xl flex items-center gap-3">
               <span className="w-6 h-6 rounded flex items-center justify-center bg-emerald-200 dark:bg-emerald-800 text-xs font-bold shrink-0">A</span>
               <span style={{ fontSize: `${optionSize}px` }} className="text-emerald-900 dark:text-emerald-300 font-medium leading-relaxed">
                 Preview: Paris is the correct option.
               </span>
            </div>
          </div>

          {/* Explanation Text Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Explanation & Solution Size</label>
              <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">{explanationSize}px</span>
            </div>
            <input 
              type="range" 
              min="12" max="24" step="1" 
              value={explanationSize} 
              onChange={(e) => setExplanationSize(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl">
               <span style={{ fontSize: `${explanationSize}px` }} className="text-indigo-900 dark:text-indigo-300 font-medium leading-relaxed">
                 Preview: Detailed breakdown of the solution steps and core concepts.
               </span>
            </div>
          </div>

          {/* Urdu Text Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nastaliq (Urdu) Font Size</label>
              <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400">{urduSize}px</span>
            </div>
            <input 
              type="range" 
              min="16" max="40" step="1" 
              value={urduSize} 
              onChange={(e) => setUrduSize(Number(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl">
              <p style={{ fontSize: `${urduSize}px` }} className="font-urdu text-purple-900 dark:text-purple-300 leading-relaxed text-right">
                یہ ایک نمونہ ہے (Preview)
              </p>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <button 
            onClick={resetSettings}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset to Defaults
          </button>
          
          <button 
            onClick={closeSettingsModal}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
