'use client';
import React, { useState, useEffect } from 'react';
import {
  Download,
  Copy,
  Check,
  CheckCircle2,
  Layers,
  FileText,
  AlertTriangle,
  Eye,
  Wrench,
  Package,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { processRawInput } from '@/utils/quizformat/pipelineEngine';
import { SAMPLE_MESSY_DATA } from '@/utils/quizformat/sampleData';
import { generateScheme2Payload } from '@/utils/quizformat/questionSeparator';
import JSZip from 'jszip';

export function DashboardView({ onMasterItemsUpdated }) {
  const [rawText, setRawText] = useState(SAMPLE_MESSY_DATA);
  const [result, setResult] = useState(null);

  const [copiedKey, setCopiedKey] = useState(null);
  const [duplicateTab, setDuplicateTab] = useState('mcq');
  const [selectedCluster, setSelectedCluster] = useState(null);

  useEffect(() => {
    handleProcess(SAMPLE_MESSY_DATA);
  }, []);

  const handleProcess = (textToProcess = rawText) => {
    if (!textToProcess.trim()) return;
    const res = processRawInput(textToProcess);
    setResult(res);

    const combinedUnique = [...res.uniqueMCQs, ...res.uniqueShorts, ...res.uniqueLongs];
    onMasterItemsUpdated(combinedUnique);
  };

  const handleLoadSample = () => {
    setRawText(SAMPLE_MESSY_DATA);
    handleProcess(SAMPLE_MESSY_DATA);
  };

  const handleCopy = (jsonStr, key) => {
    navigator.clipboard.writeText(jsonStr);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadSingle = (jsonStr, filename) => {
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllZip = async () => {
    if (!result) return;
    const combinedUnique = [...result.uniqueMCQs, ...result.uniqueShorts, ...result.uniqueLongs];
    const scheme2Payload = generateScheme2Payload(combinedUnique);

    const zip = new JSZip();
    zip.file('mcqs.json', result.mcqsJson);
    zip.file('short.json', result.shortJson);
    zip.file('long.json', result.longJson);
    zip.file('qna.json', JSON.stringify([...result.uniqueShorts, ...result.uniqueLongs], null, 2));
    zip.file('clean_data.json', JSON.stringify(combinedUnique, null, 2));
    zip.file('full_subject_import.json', JSON.stringify(scheme2Payload, null, 2));
    zip.file('unrecognized.json', JSON.stringify(result.unrecognizedItems, null, 2));

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'VU_SIGMA_Exam_Prepared_Package.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeClusters = () => {
    if (!result) return [];
    if (duplicateTab === 'mcq') return result.mcqClusters;
    if (duplicateTab === 'short') return result.shortClusters;
    return result.longClusters;
  };

  return (
    <div className="space-y-8">
      {/* Input Section */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
              <Zap className="w-6 h-6 text-indigo-400 fill-indigo-400/20 animate-pulse" />
              Raw Data Processing Pipeline
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Paste raw text &rarr; Auto Extract & Fix Scheme Syntax &rarr; Remove Duplicates &rarr; Generate 3 JSON Outputs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleLoadSample} className="btn-secondary text-sm">
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              <span>Load Sample Data</span>
            </button>

            <button onClick={() => handleProcess()} className="btn-primary text-sm">
              <Wrench className="w-4 h-4" />
              <span>Process & Fix Data</span>
            </button>
          </div>
        </div>

        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Paste messy text, LLM output, or JSON content here..."
          className="code-editor h-36 font-mono text-xs leading-relaxed"
        />
      </div>

      {/* Pipeline Metrics Summary Bar */}
      {result && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-panel p-5 text-center glass-panel-hover">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Raw Extracted</span>
            <div className="text-3xl font-extrabold text-slate-100 mt-1.5">{result.rawExtractedCount}</div>
          </div>

          <div className="glass-panel p-5 text-center glass-panel-hover">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Syntax & Scheme Fixes</span>
            <div className="text-3xl font-extrabold text-cyan-400 mt-1.5">{result.syntaxFixedCount}</div>
          </div>

          <div className="glass-panel p-5 text-center glass-panel-hover">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Duplicates Removed</span>
            <div className="text-3xl font-extrabold text-rose-400 mt-1.5">{result.duplicatesRemovedCount}</div>
          </div>

          <div className="glass-panel p-5 text-center glass-panel-hover">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Unique Output</span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-1.5">{result.totalUniqueCount}</div>
          </div>
        </div>
      )}

      {/* Global Actions Bar */}
      {result && (
        <div className="flex flex-col sm:flex-row items-center justify-between glass-panel p-4 gap-3">
          <span className="text-sm text-slate-200 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            3 Clean Categorized JSON Datasets Ready for VU SIGMA Import
          </span>

          <button onClick={handleDownloadAllZip} className="btn-success text-sm py-2.5 px-5">
            <Package className="w-4.5 h-4.5" />
            <span>Download All JSONs (.ZIP Package)</span>
          </button>
        </div>
      )}

      {/* 3 JSON Output Divs Grid */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* DIV 1: MCQs JSON Data */}
          <div className="glass-panel card-indigo p-5 flex flex-col h-[580px]">
            <div className="flex items-center justify-between mb-3 border-b border-indigo-500/30 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                <span className="text-base font-bold text-slate-100">1. MCQs JSON Data</span>
              </div>
              <span className="badge badge-indigo text-xs">{result.uniqueMCQs.length} items</span>
            </div>

            <textarea
              readOnly
              value={result.mcqsJson}
              className="code-editor flex-1 font-mono text-xs text-indigo-200 bg-slate-950/90 mb-3 border-indigo-500/30"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(result.mcqsJson, 'mcq')}
                className="btn-secondary text-xs flex-1 justify-center py-2.5"
              >
                {copiedKey === 'mcq' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
                <span>{copiedKey === 'mcq' ? 'Copied!' : 'Copy MCQs'}</span>
              </button>
              <button
                onClick={() => handleDownloadSingle(result.mcqsJson, 'mcqs.json')}
                className="btn-primary text-xs flex-1 justify-center py-2.5"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* DIV 2: Short Questions JSON Data */}
          <div className="glass-panel card-emerald p-5 flex flex-col h-[580px]">
            <div className="flex items-center justify-between mb-3 border-b border-emerald-500/30 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span className="text-base font-bold text-slate-100">2. Short Questions JSON</span>
              </div>
              <span className="badge badge-emerald text-xs">{result.uniqueShorts.length} items</span>
            </div>

            <textarea
              readOnly
              value={result.shortJson}
              className="code-editor flex-1 font-mono text-xs text-emerald-200 bg-slate-950/90 mb-3 border-emerald-500/30"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(result.shortJson, 'short')}
                className="btn-secondary text-xs flex-1 justify-center py-2.5"
              >
                {copiedKey === 'short' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-emerald-400" />}
                <span>{copiedKey === 'short' ? 'Copied!' : 'Copy Shorts'}</span>
              </button>
              <button
                onClick={() => handleDownloadSingle(result.shortJson, 'short.json')}
                className="btn-primary text-xs flex-1 justify-center py-2.5"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* DIV 3: Long Questions JSON Data */}
          <div className="glass-panel card-cyan p-5 flex flex-col h-[580px]">
            <div className="flex items-center justify-between mb-3 border-b border-cyan-500/30 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <span className="text-base font-bold text-slate-100">3. Long Questions JSON</span>
              </div>
              <span className="badge badge-cyan text-xs">{result.uniqueLongs.length} items</span>
            </div>

            <textarea
              readOnly
              value={result.longJson}
              className="code-editor flex-1 font-mono text-xs text-cyan-200 bg-slate-950/90 mb-3 border-cyan-500/30"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(result.longJson, 'long')}
                className="btn-secondary text-xs flex-1 justify-center py-2.5"
              >
                {copiedKey === 'long' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                <span>{copiedKey === 'long' ? 'Copied!' : 'Copy Longs'}</span>
              </button>
              <button
                onClick={() => handleDownloadSingle(result.longJson, 'long.json')}
                className="btn-primary text-xs flex-1 justify-center py-2.5"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Items Inspector ("Duplicate MCQs, Shorts, Longs") */}
      {result && (
        <div className="glass-panel p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Duplicate Items Inspector (MCQs, Shorts, Longs)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect items removed during deduplication to prevent duplicate question uploads.
              </p>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setDuplicateTab('mcq')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  duplicateTab === 'mcq'
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50 shadow-inner'
                    : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Duplicate MCQs ({result.duplicateMCQs.length})
              </button>

              <button
                onClick={() => setDuplicateTab('short')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  duplicateTab === 'short'
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow-inner'
                    : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Duplicate Shorts ({result.duplicateShorts.length})
              </button>

              <button
                onClick={() => setDuplicateTab('long')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  duplicateTab === 'long'
                    ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/50 shadow-inner'
                    : 'bg-slate-800/40 text-slate-400 hover:bg-slate-800'
                }`}
              >
                Duplicate Longs ({result.duplicateLongs.length})
              </button>
            </div>
          </div>

          {/* Clusters List */}
          {activeClusters().length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {activeClusters().map((cluster) => (
                <div
                  key={cluster.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel-hover"
                >
                  <div className="space-y-1 max-w-2xl text-left">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-amber text-[10px]">{cluster.reason}</span>
                      <span className="text-[11px] font-mono text-slate-500 truncate max-w-md">
                        Sig: {cluster.signature}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200 truncate">
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
              No duplicate items detected in category "{duplicateTab.toUpperCase()}". All questions are unique!
            </div>
          )}
        </div>
      )}

      {/* Side-by-Side Modal */}
      {selectedCluster && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto border-indigo-500/40">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Duplicate Pair Inspection
              </h3>
              <button onClick={() => setSelectedCluster(null)} className="text-slate-400 hover:text-white text-sm">
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                <span className="badge badge-emerald text-xs">Kept Version (Primary)</span>
                <p className="text-xs font-semibold text-slate-200">
                  {selectedCluster.kept.questionText || selectedCluster.kept.question}
                </p>
                {selectedCluster.kept.options && (
                  <div className="space-y-1 text-xs text-slate-300">
                    <div className="text-[10px] text-slate-500">Options:</div>
                    {selectedCluster.kept.options.map((opt, i) => (
                      <div key={i} className="p-1.5 rounded bg-slate-900/80 border border-slate-800">{i + 1}. {opt}</div>
                    ))}
                  </div>
                )}
                {selectedCluster.kept.solution && (
                  <div className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded font-mono border border-slate-800">
                    {selectedCluster.kept.solution}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 space-y-2">
                <span className="badge badge-rose text-xs">Removed Duplicate</span>
                <p className="text-xs font-semibold text-slate-200">
                  {selectedCluster.duplicates[0].questionText || selectedCluster.duplicates[0].question}
                </p>
                {selectedCluster.duplicates[0].options && (
                  <div className="space-y-1 text-xs text-slate-300">
                    <div className="text-[10px] text-slate-500">Options:</div>
                    {selectedCluster.duplicates[0].options.map((opt, i) => (
                      <div key={i} className="p-1.5 rounded bg-slate-900/80 border border-slate-800">{i + 1}. {opt}</div>
                    ))}
                  </div>
                )}
                {selectedCluster.duplicates[0].solution && (
                  <div className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded font-mono border border-slate-800">
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
