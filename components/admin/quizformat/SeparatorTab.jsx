'use client';
import React, { useState } from 'react';
import { Split, Download, Copy, Check, Search, CheckCircle2, FileText, Layers, AlertCircle, Package } from 'lucide-react';
import { separateQuestionTypes, generateScheme2Payload } from '@/utils/quizformat/questionSeparator';

export function SeparatorTab({ items }) {
  const separated = separateQuestionTypes(items);
  const [activeCategory, setActiveCategory] = useState('mcqs');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCat, setCopiedCat] = useState(null);

  const categories = [
    { id: 'mcqs', label: 'MCQs (MCQ)', count: separated.mcqs.length, icon: CheckCircle2, filename: 'mcqs.json' },
    { id: 'qnas', label: 'All Q&A', count: separated.qnas.length, icon: FileText, filename: 'qna.json' },
    { id: 'short', label: 'Short Qs (SHORT)', count: separated.short.length, icon: Layers, filename: 'short.json' },
    { id: 'long', label: 'Long Qs (LONG)', count: separated.long.length, icon: Layers, filename: 'long.json' },
    { id: 'unrecognized', label: 'Unrecognized', count: separated.unrecognized.length, icon: AlertCircle, filename: 'unrecognized.json' },
  ];

  const getActiveDataset = () => {
    switch (activeCategory) {
      case 'mcqs': return separated.mcqs;
      case 'qnas': return separated.qnas;
      case 'short': return separated.short;
      case 'long': return separated.long;
      case 'unrecognized': return separated.unrecognized;
      default: return [];
    }
  };

  const currentItems = getActiveDataset();

  const filteredItems = currentItems.filter((item) => {
    if (!searchQuery.trim()) return true;
    const qText = String(item.questionText || item.question || '').toLowerCase();
    const solText = String(item.solution || item.answer || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return qText.includes(query) || solText.includes(query);
  });

  const handleDownloadCategory = () => {
    const cat = categories.find((c) => c.id === activeCategory);
    if (!cat) return;
    const blob = new Blob([JSON.stringify(currentItems, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = cat.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadScheme2Payload = () => {
    const payload = generateScheme2Payload(items);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'full_subject_import.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCategory = () => {
    navigator.clipboard.writeText(JSON.stringify(currentItems, null, 2));
    setCopiedCat(activeCategory);
    setTimeout(() => setCopiedCat(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Split className="w-5 h-5 text-indigo-400" />
              Categorical Dataset Separator
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Supports Scheme 1 (MCQ, SHORT, LONG arrays) and Scheme 2 (Full Subject Import payload).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleDownloadScheme2Payload} className="btn-secondary text-xs py-2 px-3">
              <Package className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Scheme 2 Full Subject payload</span>
            </button>

            <button onClick={handleCopyCategory} className="btn-secondary text-xs py-2 px-3">
              {copiedCat === activeCategory ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCat === activeCategory ? 'Copied!' : 'Copy Category JSON'}</span>
            </button>

            <button onClick={handleDownloadCategory} className="btn-primary text-xs py-2 px-3">
              <Download className="w-3.5 h-3.5" />
              <span>Download {categories.find((c) => c.id === activeCategory)?.filename}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills Nav & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-inner'
                    : 'bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                <span>{cat.label}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${isActive ? 'bg-indigo-500/30 text-indigo-200' : 'bg-slate-700/50 text-slate-400'}`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            className="w-full bg-slate-900/80 text-xs text-slate-200 pl-9 pr-3 py-2 rounded-xl border border-slate-700/60 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Questions Item List */}
      <div className="space-y-3">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, idx) => (
            <div key={idx} className="glass-panel p-5 glass-panel-hover flex flex-col gap-3 text-left">
              {/* Question Header & Meta */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-slate-500">#{idx + 1}</span>
                  {item.category && <span className="badge badge-indigo text-[11px] font-bold">[{item.category}]</span>}
                  {item.difficulty && (
                    <span
                      className={`badge text-[11px] ${
                        item.difficulty === 'Easy'
                          ? 'badge-emerald'
                          : item.difficulty === 'Hard'
                          ? 'badge-rose'
                          : 'badge-amber'
                      }`}
                    >
                      {item.difficulty}
                    </span>
                  )}
                  {item.chapter && <span className="badge badge-indigo text-[11px]">{item.chapter}</span>}
                  {item.topic && <span className="badge badge-cyan text-[11px]">{item.topic}</span>}
                </div>
              </div>

              {/* Question Text */}
              <p className="text-sm font-medium text-slate-100 leading-relaxed">
                {item.questionText || item.question || 'No question text string provided'}
              </p>

              {/* MCQ Options Rendering */}
              {Array.isArray(item.options) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                  {item.options.map((opt, optIdx) => {
                    const isCorrect = item.correctOption === optIdx;
                    return (
                      <div
                        key={optIdx}
                        className={`p-2.5 rounded-lg text-xs flex items-center justify-between border ${
                          isCorrect
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 font-medium'
                            : 'bg-slate-900/40 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="truncate max-w-[85%]">{optIdx + 1}. {opt}</span>
                        {isCorrect && <span className="badge badge-emerald text-[10px]">Correct</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Subjective Solution Rendering */}
              {item.solution && (
                <div className="mt-1 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-sans">Solution:</div>
                  {item.solution}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="glass-panel p-12 text-center text-slate-500 text-sm">
            No items found for category "{activeCategory}" matching query "{searchQuery}".
          </div>
        )}
      </div>
    </div>
  );
}
