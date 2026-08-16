'use client';
import React from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProgressModal({
  isOpen,
  title = 'Processing MCQs...',
  current = 0,
  total = 0,
  subtitle = '',
  error = null,
  isFinished = false,
  onClose
}) {
  if (!isOpen) return null;

  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  const remaining = Math.max(0, total - current);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-center">
        {/* Header Icon */}
        <div className="flex justify-center">
          {error ? (
            <div className="w-16 h-16 bg-red-950/60 text-red-400 border border-red-900 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
          ) : isFinished ? (
            <div className="w-16 h-16 bg-emerald-950/60 text-emerald-400 border border-emerald-900 rounded-2xl flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-blue-950/60 text-blue-400 border border-blue-900 rounded-2xl flex items-center justify-center relative">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl text-xs">
          <div className="text-center">
            <span className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider">Completed</span>
            <span className="text-base font-extrabold text-emerald-400">{current}</span>
          </div>
          <div className="text-center border-x border-slate-800">
            <span className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider">Remaining</span>
            <span className="text-base font-extrabold text-amber-400">{remaining}</span>
          </div>
          <div className="text-center">
            <span className="block text-slate-500 font-bold text-[10px] uppercase tracking-wider">Total</span>
            <span className="text-base font-extrabold text-blue-400">{total}</span>
          </div>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold px-1">
            <span className="text-slate-400">{current} out of {total} MCQs</span>
            <span className="text-blue-400 text-sm">{percentage}%</span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-950/40 p-2.5 rounded-xl border border-red-900/50 font-medium">
            {error}
          </p>
        )}

        {(isFinished || error) && onClose && (
          <button
            onClick={onClose}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
