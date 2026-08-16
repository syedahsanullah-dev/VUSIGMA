'use client';
import React, { useState } from 'react';
import { Workflow, Play, CheckCircle2, Download, Sparkles, CopyX, Split, Wrench } from 'lucide-react';
import { extractAllJson } from '@/utils/quizformat/jsonCleaner';
import { autoRepairItems } from '@/utils/quizformat/schemaValidator';
import { ultraDeduplicateQNA, deduplicateMCQs } from '@/utils/quizformat/deduplicator';
import { separateQuestionTypes, generateScheme2Payload } from '@/utils/quizformat/questionSeparator';
import JSZip from 'jszip';

export function PipelineTab({ rawText, onPipelineCompleted }) {
  const [running, setRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [pipelineLogs, setPipelineLogs] = useState([]);
  const [finalStats, setFinalStats] = useState(null);

  const runFullPipeline = async () => {
    setRunning(true);
    setPipelineLogs([]);
    setCurrentStep(1);

    const addLog = (msg) => {
      setPipelineLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    addLog('Starting Step 1: Cleaning & Extracting JSON blocks from raw text...');
    const cleanResult = extractAllJson(rawText);
    addLog(`Extracted ${cleanResult.extractedData.length} total items from ${cleanResult.blockCount} JSON block(s).`);
    await new Promise((r) => setTimeout(r, 400));

    setCurrentStep(2);
    addLog('Starting Step 2: Running VU SIGMA Schema Auto-Repair (Categories & Difficulties)...');
    const { repairedItems, fixCount } = autoRepairItems(cleanResult.extractedData);
    addLog(`Auto-repaired ${fixCount} formatting, indexing, and category/difficulty field issues.`);
    await new Promise((r) => setTimeout(r, 400));

    setCurrentStep(3);
    addLog('Starting Step 3: Stream-Specific Deduplication (MCQs, Shorts & Longs)...');
    const prelimMCQs = repairedItems.filter(i => i.category === 'MCQ' || (Array.isArray(i.options) && i.options.length > 0));
    const prelimQNA = repairedItems.filter(i => i.category !== 'MCQ' && (!Array.isArray(i.options) || i.options.length === 0));

    const mcqDedup = deduplicateMCQs(prelimMCQs, 'exact');
    const qnaDedup = ultraDeduplicateQNA(prelimQNA, 'exact');

    const totalRemoved = mcqDedup.removedCount + qnaDedup.removedCount;
    const finalUniqueItems = [...mcqDedup.unique, ...qnaDedup.unique];
    addLog(`Deduplication complete: Removed ${totalRemoved} duplicates (${mcqDedup.removedCount} MCQs, ${qnaDedup.removedCount} QNAs). ${finalUniqueItems.length} total items remaining.`);
    await new Promise((r) => setTimeout(r, 400));

    setCurrentStep(4);
    addLog('Starting Step 4: Partitioning into MCQs, SHORT, and LONG questions...');
    const separated = separateQuestionTypes(finalUniqueItems);
    const scheme2 = generateScheme2Payload(finalUniqueItems);
    addLog(`Separation complete: ${separated.mcqs.length} MCQs, ${separated.short.length} SHORT Qs, ${separated.long.length} LONG Qs.`);
    await new Promise((r) => setTimeout(r, 400));

    setCurrentStep(5);
    addLog('Step 5: Pipeline execution complete! Scheme 1 & Scheme 2 packages ready for download.');
    setFinalStats({
      totalExtracted: cleanResult.extractedData.length,
      repaired: fixCount,
      duplicatesRemoved: totalRemoved,
      finalUnique: finalUniqueItems.length,
      mcqs: separated.mcqs.length,
      qnas: separated.qnas.length,
      short: separated.short.length,
      long: separated.long.length,
      unrecognized: separated.unrecognized.length,
      separatedData: separated,
      scheme2Payload: scheme2,
      finalItems: finalUniqueItems,
    });

    onPipelineCompleted(finalUniqueItems);
    setRunning(false);
  };

  const handleDownloadZip = async () => {
    if (!finalStats) return;
    const zip = new JSZip();

    zip.file('clean_data.json', JSON.stringify(finalStats.finalItems, null, 2));
    zip.file('mcqs.json', JSON.stringify(finalStats.separatedData.mcqs, null, 2));
    zip.file('qna.json', JSON.stringify(finalStats.separatedData.qnas, null, 2));
    zip.file('short.json', JSON.stringify(finalStats.separatedData.short, null, 2));
    zip.file('long.json', JSON.stringify(finalStats.separatedData.long, null, 2));
    zip.file('full_subject_import.json', JSON.stringify(finalStats.scheme2Payload, null, 2));
    zip.file('unrecognized.json', JSON.stringify(finalStats.separatedData.unrecognized, null, 2));

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'VU_SIGMA_Exam_Cleaned_Package.zip';
    a.click();
    URL.revokeObjectURL(url);
  };

  const steps = [
    { num: 1, name: 'Extract & Clean JSON', icon: Sparkles },
    { num: 2, name: 'VU SIGMA Schema Auto-Repair', icon: Wrench },
    { num: 3, name: 'Multi-level Deduplication', icon: CopyX },
    { num: 4, name: 'Categorical Separation', icon: Split },
    { num: 5, name: 'Scheme 1 & 2 ZIP Package Generation', icon: Download },
  ];

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Workflow className="w-5 h-5 text-indigo-400" />
              Automated 1-Click Processing Pipeline
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Executes Clean &rarr; Auto-Repair &rarr; Deduplicate &rarr; Separate &rarr; Package Scheme 1 & 2 ZIP in a single click.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runFullPipeline}
              disabled={running}
              className="btn-primary text-sm disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{running ? 'Processing Pipeline...' : 'Run Automated Pipeline'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {steps.map((step) => {
          const isDone = currentStep > step.num;
          const isCurrent = currentStep === step.num;

          return (
            <div
              key={step.num}
              className={`glass-panel p-4 flex flex-col items-center text-center transition-all ${
                isCurrent
                  ? 'border-indigo-500 bg-indigo-950/30 shadow-lg shadow-indigo-500/20'
                  : isDone
                  ? 'border-emerald-500/50 bg-emerald-950/20'
                  : 'opacity-60'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 font-bold text-xs ${
                  isDone
                    ? 'bg-emerald-500 text-slate-950'
                    : isCurrent
                    ? 'bg-indigo-500 text-white animate-pulse'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isDone ? <CheckCircle2 className="w-5 h-5 text-slate-950" /> : step.num}
              </div>
              <span className="text-xs font-semibold text-slate-200">{step.name}</span>
            </div>
          );
        })}
      </div>

      {finalStats && (
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Pipeline Execution Completed Successfully!
            </h3>
            <button onClick={handleDownloadZip} className="btn-success text-sm py-2 px-4">
              <Download className="w-4 h-4" />
              <span>Download Cleaned Package (.ZIP)</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <span className="text-slate-400">Total Extracted:</span>
              <div className="text-lg font-bold text-indigo-300 mt-0.5">{finalStats.totalExtracted}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <span className="text-slate-400">Duplicates Removed:</span>
              <div className="text-lg font-bold text-rose-400 mt-0.5">{finalStats.duplicatesRemoved}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <span className="text-slate-400">Final Unique MCQs:</span>
              <div className="text-lg font-bold text-cyan-300 mt-0.5">{finalStats.mcqs}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <span className="text-slate-400">Final Unique SHORT/LONG:</span>
              <div className="text-lg font-bold text-emerald-300 mt-0.5">{finalStats.qnas}</div>
            </div>
          </div>
        </div>
      )}

      <div className="glass-panel p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Pipeline Output Logs
        </h3>
        <div className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-slate-300 space-y-1.5 max-h-48 overflow-y-auto border border-slate-800">
          {pipelineLogs.length > 0 ? (
            pipelineLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-indigo-400">&gt;</span>
                <span>{log}</span>
              </div>
            ))
          ) : (
            <div className="text-slate-600">Click "Run Automated Pipeline" to start processing...</div>
          )}
        </div>
      </div>
    </div>
  );
}
