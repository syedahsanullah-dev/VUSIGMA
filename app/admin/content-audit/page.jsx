'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import RealisticPageLoader from '@/components/RealisticPageLoader';
import {
  ShieldAlert, Trash2, CheckCircle2, Search, Filter, HelpCircle,
  XCircle, FileEdit, Ban, Check, RefreshCw
} from 'lucide-react';

export default function ContentAuditAdmin() {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [updating, setUpdating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [qData, sData] = await Promise.all([
        api.get('/questions'),
        api.get('/subjects')
      ]);
      setQuestions(Array.isArray(qData) ? qData : (qData?.data || []));
      setSubjects(sData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (questionId, newStatus) => {
    try {
      const q = questions.find(item => item.id === questionId);
      if (!q) return;
      await api.put(`/questions/${questionId}`, {
        ...q,
        status: newStatus
      });
      setQuestions(prev => prev.map(item => item.id === questionId ? { ...item, status: newStatus } : item));
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Admin Action: Are you sure you want to delete this question from the database?')) {
      try {
        await api.delete(`/questions/${id}`);
        setQuestions(prev => prev.filter(q => q.id !== id));
        setSelectedIds(prev => prev.filter(item => item !== id));
      } catch (err) {
        alert('Delete Failed: ' + err.message);
      }
    }
  };

  // Bulk Actions
  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(q => q.id));
    }
  };

  const toggleSelectId = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to mark ${selectedIds.length} questions as '${newStatus.toUpperCase()}'?`)) return;

    setUpdating(true);
    try {
      for (const id of selectedIds) {
        const q = questions.find(item => item.id === id);
        if (q) {
          await api.put(`/questions/${id}`, { ...q, status: newStatus });
        }
      }
      setQuestions(prev => prev.map(q => selectedIds.includes(q.id) ? { ...q, status: newStatus } : q));
      setSelectedIds([]);
    } catch (err) {
      alert("Bulk Update Failed: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`DANGER: Are you sure you want to PERMANENTLY DELETE ${selectedIds.length} selected questions?`)) return;

    setUpdating(true);
    try {
      for (const id of selectedIds) {
        await api.delete(`/questions/${id}`);
      }
      setQuestions(prev => prev.filter(q => !selectedIds.includes(q.id)));
      setSelectedIds([]);
    } catch (err) {
      alert("Bulk Delete Failed: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const safeQuestions = Array.isArray(questions) ? questions : [];
  const filtered = safeQuestions.filter(q => {
    const matchesSearch = !searchTerm || q.questionText?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = !filterCategory || q.category === filterCategory;
    const matchesSubject = !filterSubject || String(q.subjectId) === String(filterSubject);
    const qStatus = q.status || 'published';
    const matchesStatus = !filterStatus || (filterStatus === 'approved' ? (qStatus === 'approved' || qStatus === 'published') : qStatus === filterStatus);

    return matchesSearch && matchesCat && matchesSubject && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const current = status || 'published';
    switch (current) {
      case 'disabled':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            <Ban className="w-3 h-3 mr-1 text-slate-400" /> Disabled
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-950/80 text-red-400 border border-red-900">
            <XCircle className="w-3 h-3 mr-1 text-red-400" /> Rejected
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-900">
            <FileEdit className="w-3 h-3 mr-1 text-amber-400" /> Drafted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-900">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" /> Approved
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Content Audit &amp; Control Panel</h1>
          <p className="text-slate-400 text-xs mt-1">
            Quality control &amp; content moderation for MCQs, Short, and Long Questions.
          </p>
        </div>
        <div className="bg-blue-950/60 text-blue-400 border border-blue-900 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-blue-400" />
          <span>Super Admin Control</span>
        </div>
      </div>

      {/* Expanded Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400 pb-2 border-b border-slate-800">
          <span className="flex items-center gap-1.5 text-blue-400">
            <Filter className="w-4 h-4" /> Audit Search &amp; Filters
          </span>
          <span>
            Matches: <strong className="text-white">{filtered.length}</strong> / {questions.length} total
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search text or keywords..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={filterSubject}
              onChange={e => setFilterSubject(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-700 text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              <option value="">All Subjects</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>({s.code}) {s.name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-700 text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              <option value="">All Question Types</option>
              <option value="MCQ font-bold">MCQs Only</option>
              <option value="SHORT">Short Questions Only</option>
              <option value="LONG">Long Questions Only</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full p-2 bg-slate-950 border border-slate-700 text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
            >
              <option value="">All Audit Statuses</option>
              <option value="approved">✅ Approved / Published</option>
              <option value="draft">🟡 Drafted</option>
              <option value="disabled">⚪ Disabled</option>
              <option value="rejected">🔴 Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Audit Control Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-950/80 border border-blue-900 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
          <span className="font-bold text-blue-200">
            Selected <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full">{selectedIds.length}</span> questions for bulk action:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleBulkStatusChange('approved')}
              disabled={updating}
              className="px-3 py-1.5 bg-emerald-950 text-emerald-400 border border-emerald-900 hover:bg-emerald-900 font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" /> Approve
            </button>
            <button
              onClick={() => handleBulkStatusChange('draft')}
              disabled={updating}
              className="px-3 py-1.5 bg-amber-950 text-amber-400 border border-amber-900 hover:bg-amber-900 font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            >
              <FileEdit className="w-3.5 h-3.5" /> Draft
            </button>
            <button
              onClick={() => handleBulkStatusChange('disabled')}
              disabled={updating}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            >
              <Ban className="w-3.5 h-3.5" /> Disable
            </button>
            <button
              onClick={() => handleBulkStatusChange('rejected')}
              disabled={updating}
              className="px-3 py-1.5 bg-red-950 text-red-400 border border-red-900 hover:bg-red-900 font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            >
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={updating}
              className="px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Audit Table */}
      {loading ? (
        <RealisticPageLoader
          title="Loading Audit Content Records..."
          subtitle="Filtering questions, audit flags, and status queue..."
          steps={[
            "Connecting to audit service...",
            "Fetching questions audit queue...",
            "Checking status flags...",
            "Rendering audit records table..."
          ]}
        />
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 rounded-2xl p-12 border border-slate-800 text-center text-slate-500">
          <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
          <p className="font-semibold text-sm text-slate-300">No questions match the audit filter parameters.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filtered.length && filtered.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-700 bg-slate-900 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-3">#</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Question Text</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4 text-center">Audit Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((q, idx) => {
                  const subject = subjects.find(s => String(s.id) === String(q.subjectId));
                  const isSelected = selectedIds.includes(q.id);

                  return (
                    <tr key={q.id || idx} className={`hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-blue-950/30' : ''}`}>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectId(q.id)}
                          className="rounded border-slate-700 bg-slate-900 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          q.category === 'MCQ' ? 'bg-blue-950 text-blue-400 border border-blue-900' :
                          q.category === 'SHORT' ? 'bg-purple-950 text-purple-400 border border-purple-900' :
                          'bg-rose-950 text-rose-400 border border-rose-900'
                        }`}>
                          {q.category || 'MCQ'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(q.status)}
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        <p className="font-medium text-white line-clamp-2">{q.questionText}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {((q.hasCode || q.codeSnippet) && !q.solutionCode) && (
                            <span className="text-[9px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60 px-1.5 py-0.5 rounded">
                              ⚠️ Missing Code Solution
                            </span>
                          )}
                          {((q.category === 'MCQ' && !q.explanation) || ((q.category === 'SHORT' || q.category === 'LONG') && !q.solution)) && (
                            <span className="text-[9px] font-bold bg-red-950/80 text-red-300 border border-red-800/60 px-1.5 py-0.5 rounded">
                              🚨 Missing Explanation
                            </span>
                          )}
                          {((q.imagesBase64 && q.imagesBase64.length > 0) || q.imageBase64) && (
                            <span className="text-[9px] font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 px-1.5 py-0.5 rounded">
                              🖼️ Image Attached ({q.imagesBase64?.length || 1})
                            </span>
                          )}
                          {!q.questionTextUrdu && (
                            <span className="text-[9px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 px-1.5 py-0.5 rounded">
                              🌍 Missing Urdu
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-blue-400 font-mono font-medium">
                        {subject ? subject.code : 'General'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {/* Quick Action Selector */}
                          <select
                            value={q.status || 'published'}
                            onChange={(e) => handleUpdateStatus(q.id, e.target.value)}
                            className="bg-slate-950 border border-slate-700 text-slate-200 text-[11px] font-bold py-1 px-2 rounded-lg cursor-pointer outline-none"
                          >
                            <option value="approved">Approved</option>
                            <option value="draft">Draft</option>
                            <option value="disabled">Disabled</option>
                            <option value="rejected">Rejected</option>
                          </select>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(q.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Permanent Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
