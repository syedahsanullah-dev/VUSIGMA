'use client';
import React, { useState } from 'react';
import { Sparkles, FileText, Download, Copy, Check, Terminal, FileCode } from 'lucide-react';
import { extractAllJson } from '@/utils/quizformat/jsonCleaner';

export function CleanerTab({ onDataCleaned, initialRawText }) {
  const [rawText, setRawText] = useState(initialRawText);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleClean = () => {
    if (!rawText.trim()) return;
    const res = extractAllJson(rawText);
    setResult(res);
    onDataCleaned(res.extractedData);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      setRawText(content);
    };
    reader.readAsText(file);
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.rawCleanJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result.rawCleanJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'clean_data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Messy Text & JSON Cleaner
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Extract valid JSON blocks from messy copy-pastes, LLM chat logs, or unformatted text files.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="btn-secondary text-sm cursor-pointer">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Upload File (.txt/.json)</span>
              <input type="file" accept=".txt,.json,.md" onChange={handleFileUpload} className="hidden" />
            </label>
            <button onClick={handleClean} className="btn-primary text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Clean & Extract JSON</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-5 flex flex-col h-[520px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-indigo-400" />
              Raw Input Text / Messy Data
            </span>
            <span className="text-xs text-slate-500">{rawText.length} characters</span>
          </div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste your messy text or LLM chat output here... (e.g. text containing JSON blocks)"
            className="code-editor flex-1 font-mono text-xs leading-relaxed"
          />
        </div>

        <div className="glass-panel p-5 flex flex-col h-[520px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Extracted Clean JSON Output
            </span>
            {result && result.extractedData.length > 0 && (
              <div className="flex items-center gap-2">
                <button onClick={handleCopy} className="btn-secondary text-xs py-1 px-2.5">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
                <button onClick={handleDownload} className="btn-success text-xs py-1 px-2.5">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            )}
          </div>

          {result ? (
            <textarea
              readOnly
              value={result.rawCleanJson}
              className="code-editor flex-1 font-mono text-xs leading-relaxed bg-slate-950/80 text-emerald-300"
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-700/60 rounded-xl">
              <Sparkles className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-sm">Click "Clean & Extract JSON" to view extracted items.</p>
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="glass-panel p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-cyan-400" />
            Extraction Log Output
          </h3>
          <div className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-slate-300 space-y-1.5 max-h-40 overflow-y-auto border border-slate-800">
            {result.logs.map((log, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-cyan-400">&gt;</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
