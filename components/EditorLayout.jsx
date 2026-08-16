'use client';
import { useState } from 'react';
import { useLocation, useRouter } from 'next/navigation';
import Link from 'next/link';;
import useAuthStore from '@/store/useAuthStore';
import {
  LogOut, LayoutDashboard, BookOpen, HelpCircle, Menu, X,
  Database, User, Upload
} from 'lucide-react';

export default function EditorLayout({ children }) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/editor/login');
  };

  const isActive = (path, exact = false) =>
    exact
      ? location.pathname === path || location.pathname === path + '/'
      : location.pathname.startsWith(path);

  const linkClass = (active) =>
    `flex items-center px-4 py-3 rounded-xl transition-all font-medium text-sm gap-3 ${
      active
        ? 'bg-amber-900/40 text-amber-400 font-semibold border border-amber-800/30'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  const NavLinks = ({ onClose }) => (
    <>
      <Link href="/editor" onClick={onClose} className={linkClass(isActive('/editor', true))}>
        <LayoutDashboard className="w-5 h-5 shrink-0" /> My Workspace
      </Link>
      <Link href="/editor/subjects" onClick={onClose} className={linkClass(isActive('/editor/subjects'))}>
        <Database className="w-5 h-5 shrink-0" /> Subjects
      </Link>
      <Link href="/editor/quizzes" onClick={onClose} className={linkClass(isActive('/editor/quizzes'))}>
        <BookOpen className="w-5 h-5 shrink-0" /> Quizzes
      </Link>
      <Link href="/editor/questions" onClick={onClose} className={linkClass(isActive('/editor/questions'))}>
        <HelpCircle className="w-5 h-5 shrink-0" /> Question Bank
      </Link>
      <Link href="/editor/import" onClick={onClose} className={linkClass(isActive('/editor/import'))}>
        <Upload className="w-5 h-5 shrink-0" /> Bulk Import
      </Link>
      <Link href="/editor/profile" onClick={onClose} className={linkClass(isActive('/editor/profile'))}>
        <User className="w-5 h-5 shrink-0" /> My Profile
      </Link>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col shrink-0">
        {/* Brand */}
        <div className="p-6 border-b border-slate-800 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-amber-900/40 border border-amber-700/30 text-amber-400 rounded-2xl flex items-center justify-center mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-white leading-tight">Content Editor</h2>
          <span className="text-xs font-semibold px-2.5 py-1 bg-amber-900/40 text-amber-400 border border-amber-800/30 rounded-full mt-2 uppercase tracking-wider">
            Editor Portal
          </span>
        </div>

        {/* User Info */}
        <div className="px-4 py-3 border-b border-slate-800/50 flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-900/30 rounded-full flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() || 'E'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.name || 'Editor'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavLinks onClose={() => {}} />
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-400 hover:bg-red-950/30 rounded-xl transition-colors font-semibold text-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative flex flex-col w-64 bg-slate-900 h-full shadow-2xl border-r border-slate-800">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-white text-base">Editor Portal</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white p-1.5 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              <NavLinks onClose={() => setIsMobileMenuOpen(false)} />
            </nav>
            <div className="p-4 border-t border-slate-800">
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-400 hover:bg-red-950/30 rounded-xl transition-colors font-semibold text-sm cursor-pointer">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Header */}
        <header className="bg-slate-900 h-14 border-b border-slate-800 flex items-center px-4 md:hidden justify-between shrink-0">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-400 hover:text-white p-1.5 rounded-lg cursor-pointer">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-white text-base">Editor Portal</span>
          <button onClick={handleLogout} className="text-red-400 p-1.5 rounded-lg cursor-pointer">
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
