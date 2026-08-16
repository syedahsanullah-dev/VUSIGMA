'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import useAuthStore from '@/store/useAuthStore';
import { Database, BookOpen, HelpCircle, Download, ArrowRight, CheckCircle2, ListChecks, FileText, RefreshCw } from 'lucide-react';

export default function AdminOverview() {
  const { user, role } = useAuthStore();
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalModules: 0,
    totalQuestions: 0,
    mcqCount: 0,
    shortCount: 0,
    longCount: 0,
    recentSubjects: []
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.get('/dashboard');
      setStats(data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDownloadBackup = async () => {
    const loadingToast = toast.loading('Generating JSON backup...');
    try {
      const data = await api.get('/subjects/dump/all');
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', `VU_SIGMA_MERN_Backup_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.dismiss(loadingToast);
      toast.success('Backup downloaded successfully!');
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Backup Download Failed: " + err.message);
    }
  };

  const currentRole = role || user?.role || 'SUPER_ADMIN';

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {currentRole ? currentRole.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ') : 'Admin'}!
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Signed in as <span className="font-semibold text-slate-200">{user?.email}</span></p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl font-bold text-xs cursor-pointer shadow-sm transition-colors disabled:opacity-50"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleDownloadBackup}
            className="flex items-center px-4 py-2.5 bg-blue-950/50 hover:bg-blue-900/60 text-blue-400 border border-blue-900 rounded-xl font-bold text-xs cursor-pointer shadow-sm transition-colors"
          >
            <Download className="w-4 h-4 mr-2" /> Download JSON Backup
          </button>

          <span className="inline-block bg-blue-950/50 text-blue-400 px-4 py-2.5 rounded-xl font-bold text-xs border border-blue-900 uppercase tracking-wide">
            Role: {currentRole.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-slate-400 text-sm font-medium">Total Subjects</h3>
            <p className="text-3xl font-extrabold text-white mt-2">
              {loading ? (
                <span className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
              ) : stats.totalSubjects}
            </p>
          </div>
          <div className="p-4 bg-blue-950/60 text-blue-400 rounded-2xl">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-slate-400 text-sm font-medium">Total Modules</h3>
            <p className="text-3xl font-extrabold text-white mt-2">
              {loading ? (
                <span className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
              ) : stats.totalModules}
            </p>
          </div>
          <div className="p-4 bg-indigo-950/60 text-indigo-400 rounded-2xl">
            <Database className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-slate-400 text-sm font-medium">Total Questions</h3>
            <p className="text-3xl font-extrabold text-white mt-2">
              {loading ? (
                <span className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
              ) : stats.totalQuestions}
            </p>
          </div>
          <div className="p-4 bg-emerald-950/60 text-emerald-400 rounded-2xl">
            <HelpCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Breakdown Section */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
        <h2 className="text-xl font-bold text-white mb-6">Question Type Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-900/40">
            <div className="flex items-center space-x-2 text-purple-400 font-semibold mb-2 text-xs">
              <CheckCircle2 className="w-5 h-5" />
              <span>MCQs</span>
            </div>
            <p className="text-2xl font-bold text-purple-200">
              {loading ? '...' : stats.mcqCount}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-900/40">
            <div className="flex items-center space-x-2 text-teal-400 font-semibold mb-2 text-xs">
              <ListChecks className="w-5 h-5" />
              <span>Short Questions</span>
            </div>
            <p className="text-2xl font-bold text-teal-200">
              {loading ? '...' : stats.shortCount}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-900/40">
            <div className="flex items-center space-x-2 text-amber-400 font-semibold mb-2 text-xs">
              <FileText className="w-5 h-5" />
              <span>Long Questions</span>
            </div>
            <p className="text-2xl font-bold text-amber-200">
              {loading ? '...' : stats.longCount}
            </p>
          </div>
        </div>
      </div>

      {/* Active Subjects Breakdown Table */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Active Subjects Breakdown</h2>
          <Link href="/admin/subjects" className="text-blue-400 text-xs font-medium hover:underline flex items-center">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Quizzes (MCQs)</th>
                <th className="py-3 px-4">Short Questions</th>
                <th className="py-3 px-4">Long Questions</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8">
                    <span className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                  </td>
                </tr>
              ) : (
                stats.recentSubjects.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-800/60 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-bold text-white text-sm">{sub.code}</div>
                      <div className="text-slate-400 text-xs">{sub.name}</div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-purple-950/40 text-purple-300 border border-purple-900">
                        {sub.mcqModules} modules • {sub.mcqQuestions} Qs
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-teal-950/40 text-teal-300 border border-teal-900">
                        {sub.shortModules} modules • {sub.shortQuestions} Qs
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-950/40 text-amber-300 border border-amber-900">
                        {sub.longModules} modules • {sub.longQuestions} Qs
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <Link href={`/admin/subjects/${sub.code || sub.id || sub._id}`} className="text-xs px-3 py-1.5 bg-blue-950/50 text-blue-400 hover:bg-blue-900/60 rounded-lg transition-colors font-semibold border border-blue-900">
                        Manage &rarr;
                      </Link>
                    </td>
                  </tr>
                ))
              )}
              {!loading && stats.recentSubjects.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-slate-400">
                    No subjects found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
