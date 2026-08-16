'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { CheckCircle2, Clock, XCircle, BookOpen, Database, ShieldCheck, RefreshCw } from 'lucide-react';

export default function PublishApprovalsAdmin() {
  const [quizzes, setQuizzes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [qData, sData] = await Promise.all([
        api.get('/quizzes'),
        api.get('/subjects')
      ]);
      setQuizzes(Array.isArray(qData) ? qData : (qData?.data || []));
      setSubjects(Array.isArray(sData) ? sData : (sData?.data || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePublish = async (id) => {
    try {
      await api.put(`/quizzes/${id}`, { status: 'Published' });
      fetchData();
    } catch (err) {
      alert('Failed to publish quiz: ' + err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/quizzes/${id}`, { status: 'Draft' });
      fetchData();
    } catch (err) {
      alert('Failed to send back to draft: ' + err.message);
    }
  };

  const safeQuizzes = Array.isArray(quizzes) ? quizzes : [];
  const pendingQuizzes = safeQuizzes.filter(q => q.status === 'Pending Approval');
  const draftQuizzes = safeQuizzes.filter(q => q.status === 'Draft');
  const publishedQuizzes = safeQuizzes.filter(q => q.status === 'Published');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Publish Approvals Hub</h1>
          <p className="text-slate-400 text-sm mt-0.5">Super Admin Approval Panel for Content Editor Requests</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-2 rounded-xl border border-slate-700 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Requests
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-950/30 border border-amber-900/40 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Pending Review</p>
            <p className="text-3xl font-bold text-white mt-1">{pendingQuizzes.length}</p>
          </div>
          <Clock className="w-8 h-8 text-amber-400 opacity-80" />
        </div>

        <div className="bg-emerald-950/30 border border-emerald-900/40 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Live & Published</p>
            <p className="text-3xl font-bold text-white mt-1">{publishedQuizzes.length}</p>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-400 opacity-80" />
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Editor Drafts</p>
            <p className="text-3xl font-bold text-white mt-1">{draftQuizzes.length}</p>
          </div>
          <BookOpen className="w-8 h-8 text-slate-500 opacity-80" />
        </div>
      </div>

      {/* Pending Approvals Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-white text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" /> Pending Review Requests ({pendingQuizzes.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 animate-pulse text-xs">Loading pending requests...</div>
        ) : pendingQuizzes.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400/40" />
            <p className="font-semibold text-slate-300">All review requests approved!</p>
            <p className="mt-1 text-slate-500">There are currently no quizzes waiting for admin publication.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60 text-xs">
            {pendingQuizzes.map((quiz) => {
              const subject = subjects.find(s => String(s.id) === String(quiz.subjectId));
              return (
                <div key={quiz.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-amber-950 text-amber-400 border border-amber-900">
                        Pending Approval
                      </span>
                      {subject && (
                        <span className="text-amber-500 font-mono text-[11px] font-semibold">
                          {subject.code} — {subject.name}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-white text-sm">{quiz.title}</h3>
                    <p className="text-slate-400 text-xs mt-0.5">{quiz.questionCount || 0} Questions attached</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleReject(quiz.id)}
                      className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5 text-slate-400" /> Send to Draft
                    </button>
                    <button
                      onClick={() => handlePublish(quiz.id)}
                      className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-xl font-bold shadow-md transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Publish
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
