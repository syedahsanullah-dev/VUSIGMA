'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import useAuthStore from '@/store/useAuthStore';
import RealisticPageLoader from '@/components/RealisticPageLoader';
import { Plus, BookOpen, Layers, Edit2, Trash2, X, AlertTriangle, ShieldAlert, UploadCloud, Download, CheckCircle2, RefreshCw } from 'lucide-react';
import StatusBadge, { STATUS_OPTIONS } from '@/components/StatusBadge';

export default function SubjectsAdmin() {
  const { user, role } = useAuthStore();
  const isSuperAdmin = (role || user?.role) === 'SUPER_ADMIN';

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importing, setImporting] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editSubjectId, setEditSubjectId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', description: '', status: 'active', totalChapters: 0, chaptersConfigText: '' });

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const data = await api.get('/subjects');
      const list = Array.isArray(data) ? data : (data?.data || []);
      setSubjects(list);
      setError(null);
    } catch (err) {
      setError('Failed to fetch subjects. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleImportJsonFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImportJsonText(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importJsonText.trim()) return;
    setImporting(true);
    try {
      const parsedData = JSON.parse(importJsonText);
      const result = await api.post('/subjects/import', parsedData);

      alert(`Successfully imported subject containing modules and questions!`);

      fetchSubjects();
      setIsImportModalOpen(false);
      setImportJsonText('');
    } catch (err) {
      alert("Import Failed: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleStatusChange = async (subject, newStatus) => {
    if (!isSuperAdmin) {
      alert('Forbidden: Only Super Admins can modify status.');
      return;
    }
    const isAct = newStatus !== 'disabled';
    try {
      await api.put(`/subjects/${subject.id}`, {
        ...subject,
        status: newStatus,
        isActive: isAct
      });
      setSubjects(prev => prev.map(s => s.id === subject.id ? { ...s, status: newStatus, isActive: isAct } : s));
    } catch (error) {
      alert("Failed to update status: " + error.message);
    }
  };

  const openModal = (subject = null) => {
    if (subject) {
      setEditSubjectId(subject.id);
      setFormData({
        name: subject.name,
        code: subject.code,
        description: subject.description || '',
        status: subject.status || 'active',
        totalChapters: subject.totalChapters || 0,
        chaptersConfigText: subject.chaptersConfig ? JSON.stringify(subject.chaptersConfig, null, 2) : ''
      });
    } else {
      setEditSubjectId(null);
      setFormData({ name: '', code: '', description: '', status: 'active', totalChapters: 0, chaptersConfigText: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      alert('Forbidden: Only Super Admins can modify subjects.');
      return;
    }

    setIsSubmitting(true);
    let parsedChaptersConfig = [];
    if (formData.chaptersConfigText?.trim()) {
      try {
        parsedChaptersConfig = JSON.parse(formData.chaptersConfigText);
      } catch (err) {
        alert("Invalid Chapter Config JSON format. Please format as valid JSON.");
        setIsSubmitting(false);
        return;
      }
    }

    const bodyObj = {
      name: formData.name,
      code: formData.code,
      description: formData.description,
      status: formData.status,
      totalChapters: parseInt(formData.totalChapters, 10) || 0,
      chaptersConfig: parsedChaptersConfig,
      isActive: formData.status !== 'disabled'
    };

    try {
      if (editSubjectId) {
        await api.put(`/subjects/${editSubjectId}`, bodyObj);
      } else {
        await api.post('/subjects', bodyObj);
      }
      fetchSubjects();
      closeModal();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!isSuperAdmin) return;
    if (confirm('Are you sure you want to delete this subject? Doing so is permanent.')) {
      try {
        await api.delete(`/subjects/${id}`);
        fetchSubjects();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Subjects Management</h1>
          <p className="text-slate-400 mt-1 text-xs">Configure subjects, course codes, status tags, and module counts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSubjects}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-4 rounded-xl border border-slate-700 shadow-sm transition-all flex items-center space-x-2 cursor-pointer text-xs disabled:opacity-50"
            title="Refresh subjects"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {isSuperAdmin && (
            <>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-400 font-bold py-3 px-5 rounded-xl border border-indigo-900 shadow-sm transition-all flex items-center space-x-2 cursor-pointer text-xs"
              >
                <UploadCloud className="w-5 h-5" />
                <span>Import Subject (JSON)</span>
              </button>

              <button
                onClick={() => openModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-5 rounded-xl shadow-md transition-all flex items-center space-x-2 cursor-pointer text-xs"
              >
                <Plus className="w-5 h-5" />
                <span>Add Subject</span>
              </button>
            </>
          )}
        </div>
      </div>

      {!isSuperAdmin && (
        <div className="bg-amber-950/30 border border-amber-900/40 text-amber-300 p-4 rounded-xl flex items-center space-x-3 text-xs">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
          <p>You have <strong>Content Editor</strong> access. You can view subjects but cannot modify or delete them.</p>
        </div>
      )}

      {error && (
        <div className="bg-red-950/40 text-red-300 p-4 rounded-xl border border-red-900/40 flex items-center space-x-2 text-xs">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <RealisticPageLoader
          title="Loading Subjects & Modules..."
          subtitle="Fetching courses, question tallies, and module breakdown..."
          steps={[
            "Connecting to admin API...",
            "Loading active subjects list...",
            "Computing question tally metrics...",
            "Rendering subject cards..."
          ]}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(Array.isArray(subjects) ? subjects : []).map((subject) => (
            <div
              key={subject.id}
              className={`bg-slate-900 rounded-2xl border p-6 flex flex-col justify-between shadow-sm transition-all hover:shadow-md ${
                subject.status !== 'disabled' ? 'border-slate-800' : 'border-dashed border-slate-700 opacity-70'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-blue-950/60 text-blue-400 rounded-xl">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">{subject.code}</h3>
                      <p className="text-xs text-slate-400 line-clamp-1">{subject.name}</p>
                    </div>
                  </div>

                  {isSuperAdmin ? (
                    <div className="flex items-center space-x-2">
                      <select
                        value={subject.status || 'active'}
                        onChange={(e) => handleStatusChange(subject, e.target.value)}
                        className="text-xs font-bold px-2 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-200 focus:outline-none cursor-pointer"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => openModal(subject)}
                        className="text-slate-400 hover:text-blue-400 transition-colors cursor-pointer p-1"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(subject.id)}
                        className="text-slate-400 hover:text-red-400 transition-colors cursor-pointer p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <StatusBadge status={subject.status || 'active'} />
                  )}
                </div>

                <div className="flex flex-col gap-2 mt-4 flex-1 text-xs">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Quizzes (MCQ)</span>
                    <span className="font-bold text-blue-400">
                      {subject.mcqQuestionsCount || 0} Questions
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                    <span className="text-slate-400">Short Questions</span>
                    <span className="font-bold text-purple-400">
                      {subject.shortQuestionsCount || 0} Questions
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-1">
                    <span className="text-slate-400">Long Questions</span>
                    <span className="font-bold text-rose-400">
                      {subject.longQuestionsCount || 0} Questions
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800">
                <Link href={`/admin/subjects/${subject.id}`} className="text-blue-400 text-xs font-bold hover:underline flex items-center justify-between">
                  <span>Manage Subject</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>
          ))}

          {subjects.length === 0 && (
            <div className="col-span-full bg-slate-900 py-16 text-center text-slate-400 rounded-2xl border border-dashed border-slate-800 text-xs">
              No subjects defined. Click "Add Subject" to begin.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-800">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h2 className="text-xl font-bold text-white">
                {editSubjectId ? 'Edit Subject' : 'Add New Subject'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-200">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1 font-bold">Subject Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. CS603"
                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1 font-bold">Subject Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Software Architecture"
                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1 font-bold">Status Tag</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white outline-none cursor-pointer font-semibold"
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1 font-bold">Total Chapters (e.g. 45 or 250)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.totalChapters}
                  onChange={(e) => setFormData({ ...formData, totalChapters: e.target.value })}
                  placeholder="e.g. 45 or 250"
                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1 font-bold">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summary of the course content..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1 font-bold">Chapter &amp; Topic Config (JSON Array)</label>
                <textarea
                  value={formData.chaptersConfigText}
                  onChange={(e) => setFormData({ ...formData, chaptersConfigText: e.target.value })}
                  placeholder={`[\n  {\n    "chapterNumber": 1,\n    "chapterName": "Lecture 1: DBMS",\n    "topics": [{ "topicName": "Data Dictionary", "isImportant": true }]\n  }\n]`}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-75 flex items-center space-x-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Save Subject</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Subject Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-800">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
              <h2 className="text-xl font-bold text-white">Import Subject (JSON)</h2>
              <button onClick={() => { setIsImportModalOpen(false); setImportJsonText(''); }} className="text-slate-400 hover:text-slate-200">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1 font-bold">Upload Subject Export File (.json)</label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJsonFile}
                  className="block w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-950 file:text-blue-400 hover:file:bg-blue-900 cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1 font-bold">Or Paste JSON Data</label>
                <textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder="Paste JSON subject data payload..."
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono resize-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsImportModalOpen(false); setImportJsonText(''); }}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md disabled:opacity-75 flex items-center space-x-2 cursor-pointer"
                >
                  {importing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Import Subject</span>
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
