'use client';
import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Wrench, RefreshCw, Check } from 'lucide-react';
import { validateSchema, autoRepairItems } from '@/utils/quizformat/schemaValidator';

export function ValidatorTab({ items, onApplyRepaired }) {
  const [report, setReport] = useState(null);
  const [repairCount, setRepairCount] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('all');

  const runValidation = () => {
    const rep = validateSchema(items);
    setReport(rep);
  };

  useEffect(() => {
    runValidation();
  }, [items]);

  const handleAutoRepair = () => {
    const { repairedItems, fixCount } = autoRepairItems(items);
    setRepairCount(fixCount);
    onApplyRepaired(repairedItems);
    setTimeout(() => setRepairCount(null), 3000);
  };

  const filteredErrors = report?.errors.filter((e) => {
    if (severityFilter === 'all') return true;
    return e.severity === severityFilter;
  });

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-400" />
              VU Exam Schema Compliance Validator
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Verify compliance against BULK_IMPORT_GUIDE specifications and auto-repair formatting defects.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={runValidation} className="btn-secondary text-sm">
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              <span>Re-Validate</span>
            </button>

            <button onClick={handleAutoRepair} className="btn-primary text-sm">
              <Wrench className="w-4 h-4" />
              <span>Auto-Repair Issues</span>
            </button>
          </div>
        </div>
      </div>

      {repairCount !== null && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Auto-repair complete! Successfully fixed {repairCount} field issue(s).</span>
        </div>
      )}

      {report && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="glass-panel p-5 text-center">
            <span className="text-xs text-slate-400 uppercase font-medium">Total Validated</span>
            <div className="text-3xl font-bold text-slate-200 mt-1">{report.totalChecked}</div>
          </div>

          <div className="glass-panel p-5 text-center">
            <span className="text-xs text-slate-400 uppercase font-medium">Valid Items</span>
            <div className="text-3xl font-bold text-emerald-400 mt-1">{report.validCount}</div>
          </div>

          <div className="glass-panel p-5 text-center">
            <span className="text-xs text-slate-400 uppercase font-medium">Schema Errors</span>
            <div className="text-3xl font-bold text-rose-400 mt-1">{report.errorCount}</div>
          </div>

          <div className="glass-panel p-5 text-center">
            <span className="text-xs text-slate-400 uppercase font-medium">Warnings</span>
            <div className="text-3xl font-bold text-amber-400 mt-1">{report.warningCount}</div>
          </div>
        </div>
      )}

      {report && (
        <div className="glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              Compliance Log & Warnings ({filteredErrors?.length})
            </h3>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSeverityFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs ${
                  severityFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSeverityFilter('error')}
                className={`px-2.5 py-1 rounded-lg text-xs ${
                  severityFilter === 'error' ? 'bg-rose-950 text-rose-300' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                Errors
              </button>
              <button
                onClick={() => setSeverityFilter('warning')}
                className={`px-2.5 py-1 rounded-lg text-xs ${
                  severityFilter === 'warning' ? 'bg-amber-950 text-amber-300' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                Warnings
              </button>
            </div>
          </div>

          {filteredErrors && filteredErrors.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {filteredErrors.map((err, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs flex items-start gap-3 ${
                    err.severity === 'error'
                      ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                      : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                  }`}
                >
                  {err.severity === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold uppercase text-[10px] tracking-wider opacity-80">
                        Item #{err.index + 1} &bull; Field: {err.field}
                      </span>
                      <span className={`badge ${err.severity === 'error' ? 'badge-rose' : 'badge-amber'} text-[9px]`}>
                        {err.severity}
                      </span>
                    </div>
                    <p className="mt-1">{err.message}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-500">
              No validation issues found matching selected filter. All items meet BULK_IMPORT_GUIDE specifications!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
