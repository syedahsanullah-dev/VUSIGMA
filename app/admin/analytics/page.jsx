'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { BarChart3, HelpCircle, Layers, BookOpen, Users } from 'lucide-react';

export default function AnalyticsAdmin() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics');
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
          <BarChart3 className="w-6 h-6 text-indigo-400" />
          <span>System Analytics & Reports</span>
        </h1>
        <p className="text-slate-400 text-xs mt-1">Analytics breakdown of database question categories and difficulties.</p>
      </div>

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Category Distribution */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-white text-sm">Question Category Distribution</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span>Multiple Choice Questions (MCQ)</span>
                  <span>{data.categories.MCQ || 0}</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, (data.categories.MCQ / (data.summary.questions || 1)) * 100)}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span>Short Answer Questions (SHORT)</span>
                  <span>{data.categories.SHORT || 0}</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${Math.min(100, (data.categories.SHORT / (data.summary.questions || 1)) * 100)}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span>Long Essay Questions (LONG)</span>
                  <span>{data.categories.LONG || 0}</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.min(100, (data.categories.LONG / (data.summary.questions || 1)) * 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Difficulty Distribution */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 className="font-bold text-white text-sm">Question Difficulty Distribution</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span>Easy</span>
                  <span>{data.difficulties.Easy || 0}</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-green-500 h-full rounded-full" style={{ width: `${Math.min(100, (data.difficulties.Easy / (data.summary.questions || 1)) * 100)}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span>Medium</span>
                  <span>{data.difficulties.Medium || 0}</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, (data.difficulties.Medium / (data.summary.questions || 1)) * 100)}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 font-semibold mb-1">
                  <span>Hard</span>
                  <span>{data.difficulties.Hard || 0}</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-red-500 h-full rounded-full" style={{ width: `${Math.min(100, (data.difficulties.Hard / (data.summary.questions || 1)) * 100)}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
