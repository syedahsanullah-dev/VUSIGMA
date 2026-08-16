'use client';
import { useState, useEffect } from 'react';
import { Loader2, Sparkles, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

export default function RealisticPageLoader({
  title = 'Loading Application...',
  subtitle = 'Fetching latest data & initializing content...',
  steps = [
    'Connecting to database API...',
    'Fetching question bank modules...',
    'Analyzing chapter references...',
    'Rendering interface...'
  ]
}) {
  const [progress, setProgress] = useState(12);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(timer);
          return 95;
        }
        const diff = Math.floor(Math.random() * 18) + 8;
        const next = Math.min(95, prev + diff);

        // Update step index based on progress
        if (next > 70) setCurrentStepIdx(3);
        else if (next > 45) setCurrentStepIdx(2);
        else if (next > 25) setCurrentStepIdx(1);

        return next;
      });
    }, 280);

    return () => clearInterval(timer);
  }, []);

  const currentStepText = steps[currentStepIdx] || steps[steps.length - 1];

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
        {/* Animated Icon Header */}
        <div className="relative w-16 h-16 mx-auto">
          <div className="w-16 h-16 bg-blue-950/80 border border-blue-800 text-blue-400 rounded-2xl flex items-center justify-center shadow-lg">
            <BookOpen className="w-8 h-8 animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-md">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1.5">
          <h2 className="text-xl font-extrabold text-white">{title}</h2>
          <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
        </div>

        {/* Real-time Percentage & Step Display */}
        <div className="space-y-3 bg-slate-950/70 border border-slate-800/80 p-4 rounded-2xl">
          <div className="flex justify-between items-center text-xs font-bold px-1">
            <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
              {currentStepText}
            </span>
            <span className="text-blue-400 font-mono text-sm">{progress}%</span>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>Live Data Sync</span>
        </div>
      </div>
    </div>
  );
}
