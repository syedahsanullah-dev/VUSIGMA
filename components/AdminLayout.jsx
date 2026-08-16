'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import useAuthStore from '@/store/useAuthStore';
import api, { RAW_BASE_URL } from '@/lib/api';
import { Toaster } from 'react-hot-toast';
import {
  LogOut, LayoutDashboard, Database, Settings, BookOpen, HelpCircle,
  Menu, X, BarChart3, Users, ShieldCheck, Activity, CheckCircle2, Sparkles,
  Wifi, Server, Cpu, RefreshCw, FileCode2, FileText
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const { user, role, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [backendHealth, setBackendHealth] = useState({
    status: 'idle',
    latency: null,
    dbStatus: 'UNTESTED'
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentRole = role || user?.role;
      if (!user || (currentRole !== 'SUPER_ADMIN' && currentRole !== 'admin')) {
        router.push('/admin/login');
      } else {
        setCheckingAuth(false);
      }
    }
  }, [user, role, router]);

  const checkBackend = async () => {
    setBackendHealth(prev => ({ ...prev, status: 'checking' }));
    const start = Date.now();
    try {
      const res = await api.get('/subjects');
      const end = Date.now();
      const isOK = Array.isArray(res) || (res && res.success !== false && !res.error);
      setBackendHealth({
        status: isOK ? 'healthy' : 'degraded',
        latency: end - start,
        dbStatus: isOK ? 'HEALTHY' : 'DEGRADED'
      });
    } catch (err) {
      setBackendHealth({
        status: 'error',
        latency: null,
        dbStatus: 'ERROR'
      });
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      if (!checkingAuth) {
        checkBackend();
      }

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [checkingAuth]);

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  const currentRole = role || user?.role || 'SUPER_ADMIN';

  const navLinks = (
    <>
      <Link href="/admin"
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
          pathname === '/admin' || pathname === '/admin/'
            ? 'bg-blue-950/40 text-blue-400 font-semibold'
            : 'text-slate-300 hover:bg-slate-800'
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
      </Link>

      <Link href="/admin/analytics"
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
          pathname?.startsWith('/admin/analytics')
            ? 'bg-blue-950/40 text-blue-400 font-semibold'
            : 'text-slate-300 hover:bg-slate-800'
        }`}
      >
        <BarChart3 className="w-5 h-5 mr-3" /> Analytics
      </Link>

      <Link href="/admin/blogs"
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
          pathname?.startsWith('/admin/blogs')
            ? 'bg-blue-950/40 text-blue-400 font-semibold'
            : 'text-slate-300 hover:bg-slate-800'
        }`}
      >
        <FileText className="w-5 h-5 mr-3 text-purple-400" /> Blog Articles
      </Link>

      <Link href="/admin/subjects"
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
          pathname?.startsWith('/admin/subjects')
            ? 'bg-blue-950/40 text-blue-400 font-semibold'
            : 'text-slate-300 hover:bg-slate-800'
        }`}
      >
        <Database className="w-5 h-5 mr-3" /> Subjects
      </Link>

      <Link href="/admin/quizzes"
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
          pathname?.startsWith('/admin/quizzes')
            ? 'bg-blue-950/40 text-blue-400 font-semibold'
            : 'text-slate-300 hover:bg-slate-800'
        }`}
      >
        <BookOpen className="w-5 h-5 mr-3" /> Quizzes
      </Link>

      <Link href="/admin/questions"
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
          pathname?.startsWith('/admin/questions')
            ? 'bg-blue-950/40 text-blue-400 font-semibold'
            : 'text-slate-300 hover:bg-slate-800'
        }`}
      >
        <HelpCircle className="w-5 h-5 mr-3" /> Question Bank
      </Link>

      <Link href="/admin/quiz-format"
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
          pathname?.startsWith('/admin/quiz-format')
            ? 'bg-blue-950/40 text-blue-400 font-semibold'
            : 'text-slate-300 hover:bg-slate-800'
        }`}
      >
        <Sparkles className="w-5 h-5 mr-3 text-indigo-400" /> Quiz AI Processing
      </Link>

      <Link href="/admin/database-view"
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
          pathname?.startsWith('/admin/database-view')
            ? 'bg-blue-950/40 text-blue-400 font-semibold'
            : 'text-slate-300 hover:bg-slate-800'
        }`}
      >
        <Database className="w-5 h-5 mr-3 text-cyan-400" /> Database Inspector
      </Link>

      <Link href="/admin/schema-viewer"
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
          pathname?.startsWith('/admin/schema-viewer')
            ? 'bg-blue-950/40 text-blue-400 font-semibold'
            : 'text-slate-300 hover:bg-slate-800'
        }`}
      >
        <FileCode2 className="w-5 h-5 mr-3 text-purple-400" /> Schema Docs
      </Link>

      <Link href="/admin/users"
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
          pathname?.startsWith('/admin/users')
            ? 'bg-blue-950/40 text-blue-400 font-semibold'
            : 'text-slate-300 hover:bg-slate-800'
        }`}
      >
        <Users className="w-5 h-5 mr-3" /> User Accounts
      </Link>

      <Link href="/admin/content-audit"
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
          pathname?.startsWith('/admin/content-audit')
            ? 'bg-blue-950/40 text-blue-400 font-semibold'
            : 'text-slate-300 hover:bg-slate-800'
        }`}
      >
        <ShieldCheck className="w-5 h-5 mr-3" /> Content Audit
      </Link>

      <Link href="/admin/publish-approvals"
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
          pathname?.startsWith('/admin/publish-approvals')
            ? 'bg-blue-950/40 text-blue-400 font-semibold'
            : 'text-slate-300 hover:bg-slate-800'
        }`}
      >
        <CheckCircle2 className="w-5 h-5 mr-3" /> Publish Approvals
      </Link>

      <Link href="/admin/activity-log"
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
          pathname?.startsWith('/admin/activity-log')
            ? 'bg-blue-950/40 text-blue-400 font-semibold'
            : 'text-slate-300 hover:bg-slate-800'
        }`}
      >
        <Activity className="w-5 h-5 mr-3" /> Activity Log
      </Link>

      {currentRole === 'SUPER_ADMIN' && (
        <Link href="/admin/settings"
          onClick={() => setIsMobileMenuOpen(false)}
          className={`flex items-center px-4 py-3 rounded-xl transition-colors font-medium text-sm ${
            pathname === '/admin/settings'
              ? 'bg-blue-950/40 text-blue-400 font-semibold'
              : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          <Settings className="w-5 h-5 mr-3" /> System Settings
        </Link>
      )}
    </>
  );

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 text-sm font-semibold">Verifying Admin Access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex transition-colors duration-200">
      <Toaster position="top-right" toastOptions={{ style: { background: '#0f172a', color: '#f8fafc', border: '1px solid #334155', borderRadius: '0.75rem', fontSize: '0.8rem', fontWeight: 'bold' } }} />
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-950 text-blue-400 rounded-xl flex items-center justify-center mb-3">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">VU Admin</h2>
          <span className="text-xs font-semibold px-2.5 py-1 bg-green-950/50 text-green-400 border border-green-900 rounded-full mt-2 uppercase tracking-wider">
            {currentRole.replace('_', ' ')}
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navLinks}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="p-3 bg-slate-950/80 border border-slate-800/90 rounded-2xl space-y-2 text-[11px] font-mono shadow-inner">
            <div className="flex items-center justify-between font-bold text-slate-400 pb-1 border-b border-slate-800/80">
              <span className="flex items-center gap-1 text-[10px] tracking-wider uppercase text-blue-400 font-sans">
                <Cpu className="w-3 h-3 text-blue-400" /> System Monitor
              </span>
              <button 
                onClick={checkBackend}
                disabled={backendHealth.status === 'checking'}
                className="flex items-center justify-center p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                title="Run Health Check"
              >
                <RefreshCw className={`w-3 h-3 ${backendHealth.status === 'checking' ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500 flex items-center gap-1 font-sans font-medium">
                <Wifi className="w-3 h-3 text-cyan-400" /> Internet
              </span>
              {isOnline ? (
                <span className="text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900/50">🌐 Online</span>
              ) : (
                <span className="text-red-400 font-bold bg-red-950/60 px-1.5 py-0.5 rounded border border-red-900/50">⚠️ Offline</span>
              )}
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500 flex items-center gap-1 font-sans font-medium">
                <Server className="w-3 h-3 text-indigo-400" /> Backend API
              </span>
              {backendHealth.status === 'healthy' ? (
                <span className="text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-900/50">
                  🟢 {backendHealth.latency}ms
                </span>
              ) : backendHealth.status === 'checking' ? (
                <span className="text-amber-400 font-bold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-900/50">🔄 Checking</span>
              ) : backendHealth.status === 'idle' ? (
                <span className="text-slate-400 font-bold bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">⏸️ Manual Check</span>
              ) : (
                <span className="text-red-400 font-bold bg-red-950/60 px-1.5 py-0.5 rounded border border-red-900/50">🔴 Offline</span>
              )}
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500 flex items-center gap-1 font-sans font-medium">
                <Database className="w-3 h-3 text-cyan-400" /> Database
              </span>
              <span className={`font-bold px-1.5 py-0.5 rounded border ${
                backendHealth.dbStatus === 'HEALTHY'
                  ? 'text-emerald-400 bg-emerald-950/60 border-emerald-900/50'
                  : backendHealth.dbStatus === 'DEGRADED'
                  ? 'text-amber-400 bg-amber-950/60 border-amber-900/50'
                  : 'text-red-400 bg-red-950/60 border-red-900/50'
              }`}>
                {backendHealth.dbStatus === 'HEALTHY' ? '🟢 HEALTHY' : backendHealth.dbStatus === 'DEGRADED' ? '🟡 DEGRADED' : '🔴 ERROR'}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2.5 text-red-400 hover:bg-red-950/30 rounded-xl transition-colors font-semibold text-xs cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          ></div>

          <div className="relative flex flex-col w-64 max-w-xs bg-slate-900 h-full shadow-2xl p-6 border-r border-slate-800">
            <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
              <div className="flex items-center space-x-2">
                <LayoutDashboard className="w-6 h-6 text-blue-400" />
                <span className="font-extrabold text-white text-lg">VU Admin</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <span className="inline-block self-start text-xs font-semibold px-2.5 py-1 bg-green-950/50 text-green-400 border border-green-900 rounded-full mb-6 uppercase tracking-wider">
              {currentRole.replace('_', ' ')}
            </span>

            <nav className="flex-1 space-y-2 overflow-y-auto">
              {navLinks}
            </nav>

            <div className="pt-4 border-t border-slate-800 mt-6 space-y-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-3 text-red-400 hover:bg-red-950/30 rounded-xl transition-colors font-semibold text-sm cursor-pointer"
              >
                <LogOut className="w-5 h-5 mr-2" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className="bg-slate-900 h-16 border-b border-slate-800 flex items-center px-6 md:hidden justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800 rounded-lg cursor-pointer shrink-0"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-extrabold text-white tracking-tight text-lg">VU Admin</h1>
          </div>

          <button
            onClick={handleLogout}
            className="text-red-400 hover:bg-red-950/30 p-2 rounded-lg cursor-pointer shrink-0 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
