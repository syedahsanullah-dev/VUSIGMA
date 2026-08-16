'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X, Layers, ArrowRight, RefreshCw, Clock, BookOpen, Sparkles, Award } from 'lucide-react';
import StatusBadge, { STATUS_OPTIONS } from '@/components/StatusBadge';
import ConfirmationModal from '@/components/ConfirmationModal';

function parseChapters(str) {
  if (!str || typeof str !== 'string') return [];
  const trimmed = str.trim();
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-').map(p => parseInt(p.trim(), 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const start = Math.min(parts[0], parts[1]);
      const end = Math.max(parts[0], parts[1]);
      const res = [];
      for (let i = start; i <= end; i++) res.push(i);
      return res;
    }
  }
  return trimmed.split(',')
    .map(p => parseInt(p.trim(), 10))
    .filter(n => !isNaN(n));
}

function formatChaptersDisplay(chapters) {
  if (!Array.isArray(chapters) || chapters.length === 0) return null;
  const sorted = [...chapters].sort((a, b) => a - b);
  if (sorted.length === 1) return `Ch ${sorted[0]}`;
  const isSequential = sorted.every((val, i) => i === 0 || val === sorted[i - 1] + 1);
  if (isSequential) {
    return `Ch ${sorted[0]}-${sorted[sorted.length - 1]}`;
  }
  return `Ch ${sorted.join(', ')}`;
}

export default function QuizzesAdmin() {
  const [subjects, setSubjects] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');
  const [error, setError] = useState(null);

  // Confirmation Modal State
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [formData, setFormData] = useState({
    subjectId: '',
    title: '',
    quizType: 'CHAPTER_QUIZ',
    category: 'MCQ',
    chapterInput: '',
    timeLimitMinutes: 15,
    status: 'Draft',
    isActive: true
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subjectsData, quizzesData] = await Promise.all([
        api.get('/subjects'),
        api.get('/quizzes')
      ]);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : (subjectsData?.data || []));
      setQuizzes(Array.isArray(quizzesData) ? quizzesData : (quizzesData?.data || []));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); 
  }, []);

  const openModal = (quiz = null) => {
    if (quiz) {
      setCurrentQuiz(quiz);
      setFormData({
        subjectId: quiz.subjectId,
        title: quiz.title,
        quizType: quiz.quizType || 'CHAPTER_QUIZ',
        category: quiz.category || 'MCQ',
        chapterInput: Array.isArray(quiz.chapters) ? quiz.chapters.join(', ') : '',
        timeLimitMinutes: quiz.timeLimitMinutes || 15,
        status: quiz.status || 'Draft',
        isActive: quiz.isActive !== undefined ? quiz.isActive : true
      });
    } else {
      setCurrentQuiz(null);
      setFormData({
        subjectId: (selectedSubjectFilter !== 'ALL' ? selectedSubjectFilter : null) || (subjects[0]?.id || ''),
        title: '',
        quizType: 'CHAPTER_QUIZ',
        category: 'MCQ',
        chapterInput: '',
        timeLimitMinutes: 15,
        status: 'Draft',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        chapters: parseChapters(formData.chapterInput),
        timeLimitMinutes: parseInt(formData.timeLimitMinutes, 10) || 15
      };

      if (currentQuiz) {
        await api.put(`/quizzes/${currentQuiz.id}`, payload);
        toast.success('Quiz updated successfully!');
      } else {
        await api.post('/quizzes', payload);
        toast.success('Quiz created successfully!');
      }
      await fetchData();
      setIsModalOpen(false);
    } catch (err) {
      toast.error('Failed to save quiz: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmationModal({
      isOpen: true,
      title: 'Delete Quiz Module',
      message: 'Are you sure you want to delete this quiz module? This action is permanent.',
      onConfirm: async () => {
        try {
          await api.delete(`/quizzes/${id}`);
          toast.success('Quiz module deleted successfully!');
          await fetchData();
        } catch (err) {
          toast.error('Failed to delete quiz: ' + err.message);
        } finally {
          setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        }
      }
    });
  };

  const safeQuizzes = Array.isArray(quizzes) ? quizzes : [];
  const filteredQuizzes = selectedSubjectFilter === 'ALL'
    ? safeQuizzes
    : safeQuizzes.filter(q => String(q.subjectId) === String(selectedSubjectFilter));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Layers className="w-6 h-6 text-indigo-400" />
            <span>Quiz & Exam Modules Management</span>
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Create chapter practice quizzes, past papers, midterms, and finalterm exam modules.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer border border-slate-700 transition-all disabled:opacity-50"
            title="Refresh quizzes"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-lg flex items-center cursor-pointer transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Create Quiz / Exam
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center gap-3">
        <label className="text-xs font-bold text-slate-400">Filter by Subject:</label>
        <select
          value={selectedSubjectFilter}
          onChange={(e) => setSelectedSubjectFilter(e.target.value)}
          className="bg-slate-950 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 py-2 outline-none"
        >
          <option value="ALL">All Subjects ({subjects.length})</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>({s.code}) {s.name}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-900 text-red-400 p-4 rounded-2xl text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Quizzes List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredQuizzes.map((quiz) => {
          const sub = subjects.find(s => String(s.id) === String(quiz.subjectId));
          const chaptersLabel = formatChaptersDisplay(quiz.chapters);

          return (
            <div key={quiz.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-md">
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800 rounded-md uppercase">
                      {quiz.quizType ? quiz.quizType.replace('_', ' ') : 'QUIZ'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-800 rounded-md">
                      {quiz.category || 'MCQ'}
                    </span>
                    {chaptersLabel && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded-md flex items-center">
                        <BookOpen className="w-2.5 h-2.5 mr-1 text-amber-400" /> {chaptersLabel}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => openModal(quiz)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Edit quiz metadata"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(quiz.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Delete quiz"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-white text-sm line-clamp-1">{quiz.title}</h3>
                  <p className="text-slate-400 text-xs font-semibold mt-0.5">
                    Subject: {sub ? `(${sub.code}) ${sub.name}` : 'Unknown'}
                  </p>
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-400 font-semibold pt-1">
                  <span className="text-slate-300 font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                    {quiz.questionCount || 0} Questions
                  </span>
                  <span className="flex items-center text-slate-400">
                    <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" /> {quiz.timeLimitMinutes || 15} mins
                  </span>
                  <StatusBadge status={quiz.status} />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <Link
                  href={`/admin/quizzes/${quiz.id}`}
                  className="w-full py-2 bg-slate-950 hover:bg-slate-800 text-blue-400 hover:text-blue-300 font-bold rounded-xl text-xs flex items-center justify-center space-x-1 border border-slate-800 transition-colors"
                >
                  <span>Manage Questions & Assembly</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </div>
          );
        })}
        {filteredQuizzes.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 text-xs">
            No quiz modules found for this subject. Click "Create Quiz / Exam" to add one.
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-white">{currentQuiz ? 'Edit Quiz / Exam Module' : 'Create Quiz / Exam Module'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Subject</label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl"
                  required
                >
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>({s.code}) {s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Module / Exam Type</label>
                <select
                  value={formData.quizType}
                  onChange={(e) => setFormData({ ...formData, quizType: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl font-bold"
                >
                  <option value="CHAPTER_QUIZ">Chapter Practice Quiz</option>
                  <option value="MIDTERM_EXAM">Midterm Exam Paper</option>
                  <option value="FINALTERM_EXAM">Finalterm Exam Paper</option>
                  <option value="PAST_PAPER">Past Paper Quiz</option>
                  <option value="CUSTOM">Custom Assessment</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Question Category / Format</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl"
                  >
                    <option value="MCQ">Quizzes (MCQs)</option>
                    <option value="SHORT">Short Questions</option>
                    <option value="LONG">Long Questions</option>
                    <option value="MIXED">Mixed Exam (MCQs + Short + Long)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Time Limit (Minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={formData.timeLimitMinutes}
                    onChange={(e) => setFormData({ ...formData, timeLimitMinutes: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Quiz Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Chapter 1-5 Practice Quiz or Final Term Past Paper"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Chapter Range / Selection (Optional)</label>
                <input
                  type="text"
                  value={formData.chapterInput}
                  onChange={(e) => setFormData({ ...formData, chapterInput: e.target.value })}
                  placeholder="e.g. 1-5 (for Ch 1 to 5) or 1, 3, 5 or 1-22 (Midterm)"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl"
                />
                <p className="text-[11px] text-slate-500 mt-1">Enter ranges like 1-5 or comma-separated numbers like 1, 3, 5.</p>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Status Options</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl font-bold"
                >
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-md"
                >
                  {saving ? 'Saving...' : 'Save Quiz / Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        title={confirmationModal.title}
        message={confirmationModal.message}
        onConfirm={confirmationModal.onConfirm}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
