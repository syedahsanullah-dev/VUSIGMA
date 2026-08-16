'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/useAuthStore';
import useThemeStore from '@/store/useThemeStore';
import useLanguageStore from '@/store/useLanguageStore';
import useSettingsStore from '@/store/useSettingsStore';
import {
  BookOpen,
  LogOut,
  User as UserIcon,
  Info,
  Sun,
  Moon,
  Menu,
  X,
  Mail,
  GraduationCap,
  Sparkles,
  FileText,
  Languages,
  SlidersHorizontal
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { languageMode, setLanguageMode } = useLanguageStore();
  const { toggleSettingsModal } = useSettingsStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const toggleLanguage = () => {
    setLanguageMode(languageMode === 'english' ? 'bilingual' : 'english');
  };

  // Safe client hydration check
  const currentUser = mounted ? user : null;
  // Only display student user profile on public navbar (hide SUPER_ADMIN status from public header)
  const showStudentProfile = currentUser && currentUser.role === 'STUDENT';

  const isActive = (path) => pathname === path;

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-40 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo & Title */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="font-black text-lg sm:text-xl tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-300 bg-clip-text text-transparent block">
                VU SIGMA
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block -mt-1 tracking-wider uppercase">
                VU Exam Prep Portal v3.0
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2 bg-slate-100/60 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold">
            <Link
              href="/"
              className={`px-4 py-2 rounded-xl transition-all ${
                isActive('/')
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Subjects
            </Link>

            <Link
              href="/blog"
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                isActive('/blog') || pathname?.startsWith('/blog/')
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-purple-500" />
              <span>Blog Guides</span>
            </Link>

            <Link
              href="/about"
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                isActive('/about')
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Info className="w-3.5 h-3.5 text-blue-500" />
              <span>About</span>
            </Link>

            <Link
              href="/contact"
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                isActive('/contact')
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-indigo-500" />
              <span>Contact</span>
            </Link>
          </nav>

          {/* Right Action Bar */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Language Toggle Button */}
            <button
              onClick={toggleLanguage}
              className="p-2.5 rounded-2xl flex items-center space-x-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
              title="Toggle Language (English / Urdu)"
              aria-label="Toggle language"
            >
              <Languages className="w-4 h-4 text-indigo-500" />
              {mounted && <span className="text-[10px] font-bold uppercase">{languageMode === 'english' ? 'EN' : 'EN+UR'}</span>}
            </button>

            {/* Settings Modal Toggle Button */}
            <button
              onClick={toggleSettingsModal}
              className="p-2.5 rounded-2xl flex items-center space-x-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
              title="Display Settings"
              aria-label="Open display settings"
            >
              <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800"
              title={`Switch to ${mounted ? (theme === 'dark' ? 'Light' : 'Dark') : 'Light'} Mode`}
              aria-label="Toggle theme"
            >
              {mounted && theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              )}
            </button>

            {/* Student Auth Profile or Sign In Button */}
            {showStudentProfile ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-800 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700/80">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white flex items-center justify-center text-xs font-bold">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{currentUser.name}</span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-2xl transition-colors cursor-pointer border border-transparent hover:border-red-200 dark:hover:border-red-900/50"
                  title="Logout student account"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-slate-800"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02]"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger Toggle */}
          <div className="flex items-center space-x-2 md:hidden">
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-xl flex items-center space-x-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer"
              title="Toggle Language"
            >
              <Languages className="w-4 h-4 text-indigo-500" />
              {mounted && <span className="text-[10px] font-bold uppercase">{languageMode === 'english' ? 'EN' : 'EN+UR'}</span>}
            </button>

            <button
              onClick={toggleSettingsModal}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer"
              title="Display Settings"
            >
              <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800"
              title={`Switch to ${mounted ? (theme === 'dark' ? 'Light' : 'Dark') : 'Light'} Mode`}
              aria-label="Toggle theme"
            >
              {mounted && theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur-xl px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1 font-bold text-xs">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl transition-all ${
                isActive('/')
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Subjects Catalog
            </Link>

            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl transition-all ${
                isActive('/blog')
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Blog Guides
            </Link>

            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl transition-all ${
                isActive('/about')
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              About VU SIGMA
            </Link>

            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-3 rounded-xl transition-all ${
                isActive('/contact')
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Contact Support
            </Link>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
            {showStudentProfile ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 px-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-500">{currentUser.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold text-xs rounded-xl border border-red-200 dark:border-red-900/50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center font-bold text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center font-bold text-xs rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
