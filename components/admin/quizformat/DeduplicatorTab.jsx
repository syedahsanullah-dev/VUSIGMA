'use client';
import React, { useState } from 'react';
import { CopyX, Sparkles, Check, Download, AlertTriangle, Eye } from 'lucide-react';
import { deduplicateMCQs, deduplicateQNA, ultraDeduplicateQNA } from '@/utils/quizformat/deduplicator';

export function DeduplicatorTab({ items, onApplyDeduplicated }) {
  const [mode, setMode] = useState('mcq');
  const [result, setResult] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);

  const handleRunDeduplication = () => {
    let res;
    if (mode === 'mcq') {
      res = deduplicateMCQs(items);
    } else if (mode === 'qna') {
      res = deduplicateQNA(items);
    } else {
      res = ultraDeduplicateQNA(items);
    }
    setResult(res);
  };

  const handleApply = () => {
    if (!result) return;
    onApplyDeduplicated(result.unique);
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result.unique, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deduplicated_${mode}_data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <CopyX className="w-5 h-5 text-indigo-400" />
              Multi-Mode Deduplication Engine
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Identify and eliminate duplicate questions with signature matching and deep punctuation/whitespace normalization.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleRunDeduplication} className="btn-primary text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Run Deduplication</span>
            </button>

            {result && result.removedCount > 0 && (
              <button onClick={handleApply} className="btn-success text-sm">
                <Check className="w-4 h-4" />
                <span>Apply to Master Dataset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setMode('mcq')}
          className={`glass-panel p-5 text-left transition-all ${
            mode === 'mcq' ? 'border-indigo-500/80 bg-indigo-950/20' : 'hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-200">MCQ Deduplication</span>
            <span className="badge badge-indigo text-[10px]">Strict</span>
          </div>
          <p className="text-xs text-slate-400">
            Matches questions using normalized Question Text + Options list. Perfect for MCQ datasets.
          </p>
        </button>

        <button
          onClick={() => setMode('qna')}
          className={`glass-panel p-5 text-left transition-all ${
            mode === 'qna' ? 'border-cyan-500/80 bg-cyan-950/20' : 'hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-200">Standard Q&A Match</span>
            <span className="badge badge-cyan text-[10px]">Question Text</span>
          </div>
          <p className="text-xs text-slate-400">
            Matches questions based on exact Question Text string. Keeps the first occurrence.
          </p>
        </button>

        <button
          onClick={() => setMode('ultra')}
          className={`glass-panel p-5 text-left transition-all ${
            mode === 'ultra' ? 'border-emerald-500/80 bg-emerald-950/20' : 'hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-200">Ultra Deep Deduplication</span>
            <span className="badge badge-emerald text-[10px]">Indestructible</span>
          </div>
          <p className="text-xs text-slate-400">
            Deep normalization: strips punctuation, collapses whitespace & ignores case for Question + Solution.
          </p>
        </button>
      </div>

      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-panel p-5 text-center">
              <span className="text-xs text-slate-400 uppercase font-medium">Original Count</span>
              <div className="text-3xl font-bold text-slate-200 mt-1">{result.originalCount}</div>
            </div>
            <div className="glass-panel p-5 text-center">
              <span className="text-xs text-slate-400 uppercase font-medium">Duplicates Removed</span>
              <div className="text-3xl font-bold text-rose-400 mt-1">{result.removedCount}</div>
            </div>
            <div className="glass-panel p-5 text-center">
              <span className="text-xs text-slate-400 uppercase font-medium">Final Unique Items</span>
              <div className="text-3xl font-bold text-emerald-400 mt-1">{result.unique.length}</div>
            </div>
          </div>

          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Detected Duplicate Clusters ({result.clusters.length})
              </h3>
              <button onClick={handleDownload} className="btn-secondary text-xs py-1.5 px-3">
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download Unique JSON</span>
              </button>
            </div>

            {result.clusters.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {result.clusters.map((cluster) => (
                  <div
                    key={cluster.id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="badge badge-amber text-[10px]">{cluster.reason}</span>
                        <span className="text-[11px] font-mono text-slate-500 truncate max-w-md">
                          Sig: {cluster.signature}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-200 truncate">
                        {cluster.kept.questionText || cluster.kept.question}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedCluster(cluster)}
                      className="btn-secondary text-xs py-1.5 px-3 self-start md:self-auto"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Inspect Pair ({cluster.duplicates.length + 1} items)</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                No duplicates detected using selected mode ({mode.toUpperCase()}). Your dataset is clean!
              </div>
            )}
          </div>
        </div>
      )}

      {selectedCluster && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Duplicate Pair Inspection
              </h3>
              <button
                onClick={() => setSelectedCluster(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                <span className="badge badge-emerald text-xs">Kept Version (Primary)</span>
                <p className="text-xs font-semibold text-slate-200">
                  {selectedCluster.kept.questionText || selectedCluster.kept.question}
                </p>
                {selectedCluster.kept.options && (
                  <div className="space-y-1 text-xs text-slate-300">
                    <div className="text-[10px] text-slate-500">Options:</div>
                    {selectedCluster.kept.options.map((opt, i) => (
                      <div key={i} className="p-1 rounded bg-slate-900/60">{i + 1}. {opt}</div>
                    ))}
                  </div>
                )}
                {selectedCluster.kept.solution && (
                  <div className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded font-mono">
                    {selectedCluster.kept.solution}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                <span className="badge badge-rose text-xs">Removed Duplicate</span>
                <p className="text-xs font-semibold text-slate-200">
                  {selectedCluster.duplicates[0].questionText || selectedCluster.duplicates[0].question}
                </p>
                {selectedCluster.duplicates[0].options && (
                  <div className="space-y-1 text-xs text-slate-300">
                    <div className="text-[10px] text-slate-500">Options:</div>
                    {selectedCluster.duplicates[0].options.map((opt, i) => (
                      <div key={i} className="p-1 rounded bg-slate-900/60">{i + 1}. {opt}</div>
                    ))}
                  </div>
                )}
                {selectedCluster.duplicates[0].solution && (
                  <div className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded font-mono">
                    {selectedCluster.duplicates[0].solution}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
