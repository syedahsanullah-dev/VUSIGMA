'use client';
import { useState } from 'react';
import api from '@/lib/api';
import RealisticPageLoader from '@/components/RealisticPageLoader';
import ProgressModal from '@/components/ProgressModal';
import { Database, Download, Copy, Check, Search, RefreshCw, Layers, FileText, Users, Settings, UploadCloud, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function DatabaseViewAdmin() {
  const [dbData, setDbData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  // Restore Modal State
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [restoreMode, setRestoreMode] = useState('merge'); // 'merge' or 'overwrite'
  const [restoreJsonText, setRestoreJsonText] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState(null);

  const handleFetchDatabase = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/subjects/dump/all');
      const payload = res?.database ? res : (res?.data || res);
      setDbData(payload);
    } catch (err) {
      console.error('Failed to dump database:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch database dump.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJson = () => {
    if (!dbData) return;
    navigator.clipboard.writeText(JSON.stringify(dbData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadBackup = () => {
    if (!dbData) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dbData, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `full_database_dump_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleRestoreJsonFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setRestoreJsonText(event.target.result);
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = async (e) => {
    e.preventDefault();
    if (!restoreJsonText.trim()) {
      alert('Please provide JSON data or upload a JSON backup file.');
      return;
    }

    try {
      const parsed = JSON.parse(restoreJsonText);
      setRestoring(true);
      setError(null);
      setRestoreResult(null);

      const res = await api.post('/subjects/restore-full-database', {
        database: parsed.database || parsed,
        mode: restoreMode
      });

      const resultPayload = res?.message ? res : (res?.data || res);
      setRestoreResult(resultPayload);
      setIsRestoreOpen(false);
      setRestoreJsonText('');
      handleFetchDatabase(); // Refresh live viewer
    } catch (err) {
      console.error('Database restore error:', err);
      alert(err.response?.data?.error || err.message || 'Invalid JSON backup format.');
    } finally {
      setRestoring(false);
    }
  };

  const getFilteredJsonString = () => {
    if (!dbData) return '';
    if (!searchTerm.trim()) {
      return JSON.stringify(dbData, null, 2);
    }
    const term = searchTerm.trim().toLowerCase();
    const db = dbData.database || dbData;

    const filterList = (arr) => {
      if (!Array.isArray(arr)) return arr;
      return arr.filter(item => JSON.stringify(item).toLowerCase().includes(term));
    };

    const filteredPayload = {
      ...dbData,
      database: {
        subjects: filterList(db.subjects),
        quizzes: filterList(db.quizzes),
        questions: filterList(db.questions),
        users: filterList(db.users),
        settings: filterList(db.settings)
      }
    };

    return JSON.stringify(filteredPayload, null, 2);
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-indigo-950/80 border border-indigo-800/80 text-indigo-400 rounded-2xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Database JSON Inspector</h1>
              <p className="text-xs text-slate-400">
                View, search, and download the entire application database payload in JSON format.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsRestoreOpen(true)}
            className="px-4 py-3 bg-purple-950/80 hover:bg-purple-900 text-purple-300 font-extrabold text-xs rounded-xl border border-purple-800 transition-all flex items-center space-x-2 cursor-pointer shadow-md"
          >
            <UploadCloud className="w-4 h-4 text-purple-400" />
            <span>📥 Restore / Update Database JSON</span>
          </button>

          <button
            onClick={handleFetchDatabase}
            disabled={loading}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{dbData ? 'Re-Fetch Database JSON' : '⚡ Request & Display Full Site JSON'}</span>
          </button>

          {dbData && (
            <>
              <button
                onClick={handleCopyJson}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
              </button>

              <button
                onClick={handleDownloadBackup}
                className="px-4 py-3 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-800 transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download DB Backup (.json)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Realistic Loader state */}
      {loading && (
        <RealisticPageLoader
          title="Querying Complete MongoDB Database..."
          subtitle="Fetching subjects, quizzes, question banks, users, and settings..."
          steps={[
            "Authenticating request credentials...",
            "Fetching subjects & quiz modules...",
            "Loading complete question records...",
            "Formatting full database JSON payload..."
          ]}
        />
      )}

      {error && (
        <div className="bg-red-950/40 border border-red-900/50 text-red-300 p-4 rounded-2xl text-xs">
          <strong>Error loading database:</strong> {error}
        </div>
      )}

      {/* Initial Empty Prompt */}
      {!dbData && !loading && !error && (
        <div className="bg-slate-900/80 border border-dashed border-slate-800 rounded-3xl p-16 text-center space-y-4">
          <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-500">
            <Database className="w-8 h-8 text-indigo-400" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-lg font-bold text-white">No Database Data Loaded Yet</h3>
            <p className="text-xs text-slate-400">
              Click the <strong>"Request &amp; Display Full Site JSON"</strong> button above to load and inspect the entire MongoDB database state.
            </p>
          </div>
        </div>
      )}

      {/* Loaded Database Content */}
      {dbData && !loading && (
        <div className="space-y-6 animate-in fade-in">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center">
              <span className="text-xs text-slate-400 font-bold block mb-1">Subjects</span>
              <span className="text-xl font-extrabold text-blue-400">{dbData.counts?.subjects || 0}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center">
              <span className="text-xs text-slate-400 font-bold block mb-1">Quiz Modules</span>
              <span className="text-xl font-extrabold text-indigo-400">{dbData.counts?.quizzes || 0}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center">
              <span className="text-xs text-slate-400 font-bold block mb-1">Questions</span>
              <span className="text-xl font-extrabold text-emerald-400">{dbData.counts?.questions || 0}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center">
              <span className="text-xs text-slate-400 font-bold block mb-1">Users</span>
              <span className="text-xl font-extrabold text-amber-400">{dbData.counts?.users || 0}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center">
              <span className="text-xs text-slate-400 font-bold block mb-1">System Settings</span>
              <span className="text-xl font-extrabold text-purple-400">{dbData.counts?.settings || 0}</span>
            </div>
          </div>

          {/* Search Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center space-x-3">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search keys, values, subject codes, or question text in JSON payload..."
              className="bg-transparent w-full text-xs text-white outline-none"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-xs text-slate-400 hover:text-white">
                Clear
              </button>
            )}
          </div>

          {/* Formatted JSON Display Code Block */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex justify-between items-center text-xs text-slate-400 font-mono font-bold">
              <span>database_dump.json &bull; {new Date(dbData.timestamp).toLocaleString()}</span>
              <span>{getFilteredJsonString().split('\n').length} lines</span>
            </div>

            <div className="p-6 max-h-[600px] overflow-auto text-xs font-mono text-emerald-400 leading-relaxed whitespace-pre font-medium">
              <code>{getFilteredJsonString()}</code>
            </div>
          </div>
        </div>
      )}
      {/* Restore Success Banner */}
      {restoreResult && (
        <div className="bg-emerald-950/70 border border-emerald-800 text-emerald-300 p-5 rounded-2xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <h4 className="font-extrabold text-sm text-white">{restoreResult.message}</h4>
              <p className="text-xs text-emerald-300/90 mt-0.5">
                Restored: <strong>{restoreResult.restored?.subjects || 0} Subjects</strong>, <strong>{restoreResult.restored?.quizzes || 0} Quizzes</strong>, <strong>{restoreResult.restored?.questions || 0} Questions</strong>, <strong>{restoreResult.restored?.users || 0} Users</strong>, <strong>{restoreResult.restored?.settings || 0} Settings</strong> (Mode: {restoreResult.mode}).
              </p>
            </div>
          </div>
          <button onClick={() => setRestoreResult(null)} className="text-emerald-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Restore Full Database Modal */}
      {isRestoreOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-950 text-purple-400 rounded-xl border border-purple-800">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Restore / Import Database JSON</h3>
                  <p className="text-xs text-slate-400">Populate or update MongoDB with complete site dataset</p>
                </div>
              </div>
              <button onClick={() => setIsRestoreOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteRestore} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Restore Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRestoreMode('merge')}
                    className={`p-3 rounded-xl border font-bold transition-all text-left ${
                      restoreMode === 'merge'
                        ? 'bg-blue-950/80 border-blue-600 text-blue-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-sm text-white">🔄 Merge / Upsert</div>
                    <div className="text-[10px] text-slate-400 font-normal">Add &amp; update records without clearing database</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRestoreMode('overwrite')}
                    className={`p-3 rounded-xl border font-bold transition-all text-left ${
                      restoreMode === 'overwrite'
                        ? 'bg-red-950/80 border-red-600 text-red-300 shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-sm text-white">⚠️ Full Overwrite</div>
                    <div className="text-[10px] text-slate-400 font-normal">Clear existing data and replace completely</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Upload Database Backup File (.json)</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreJsonFile}
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-purple-950 file:text-purple-300 hover:file:bg-purple-900 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Or Paste Full Database JSON Payload</label>
                <textarea
                  value={restoreJsonText}
                  onChange={(e) => setRestoreJsonText(e.target.value)}
                  placeholder={`{\n  "database": {\n    "subjects": [...],\n    "quizzes": [...],\n    "questions": [...]\n  }\n}`}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white focus:ring-2 focus:ring-purple-500 outline-none text-xs font-mono resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRestoreOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={restoring}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
                >
                  {restoring ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Execute Database Restore</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
