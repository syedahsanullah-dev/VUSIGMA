'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Activity, ShieldCheck, Database, Server, RefreshCw, Cpu } from 'lucide-react';

export default function ActivityLogAdmin() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const [stats, auditRes] = await Promise.all([
        api.get('/dashboard'),
        api.get('/audit')
      ]);
      setLogs(auditRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Activity & Audit Log</h1>
          <p className="text-slate-400 text-sm mt-0.5">Real-time System Security & Admin Activity Trail</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-2 rounded-xl border border-slate-700 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Logs
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-950 text-blue-400 rounded-xl flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Server Engine</p>
            <p className="text-sm font-bold text-white">Express.js (Node.js)</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-950 text-emerald-400 rounded-xl flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Database Cluster</p>
            <p className="text-sm font-bold text-white">MongoDB Atlas Cloud</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-950 text-purple-400 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Security Hardening</p>
            <p className="text-sm font-bold text-emerald-400">Helmet + RateLimit + XSS</p>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-white text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" /> Recent Activity Log
          </h2>
          <span className="text-xs text-slate-500">Auto-updating</span>
        </div>

        <div className="divide-y divide-slate-800/60 text-xs">
          {logs.map(log => (
            <div key={log._id || log.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                  log.action === 'DELETE' ? 'bg-red-950 text-red-400 border border-red-900' :
                  log.action === 'CREATE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                  'bg-blue-950 text-blue-400 border border-blue-900'
                }`}>
                  {log.action} {log.resource}
                </span>
                <span className="text-slate-200 font-medium">{log.resourceId ? `ID: ${log.resourceId}` : 'Bulk Action'}</span>
              </div>
              <div className="flex items-center gap-4 text-slate-500 font-mono">
                <span>By: {log.adminId?.name || log.adminId?.email || 'SYSTEM'}</span>
                <span>{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
