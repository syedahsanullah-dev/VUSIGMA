'use client';
import Link from 'next/link';
import { BookOpen, ShieldCheck, Mail, Info, FileText, Lock, AlertTriangle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-10 transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-1.5 rounded-lg text-white">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">VU SIGMA</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Virtual University solved past papers, interactive MCQ engines, short/long question revision guides, and exam preparation portal for 2026.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-3">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">Exam Portals</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="hover:text-white transition-colors">Course Subjects Catalog</Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">About VU SIGMA</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">Contact Academic Support</Link>
              </li>
            </ul>
          </div>

          {/* AdSense Legal & Policy Pages */}
          <div className="space-y-3">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">Legal &amp; Policy</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy-policy" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Terms &amp; Conditions</span>
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Disclaimer</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Authentication Links Column */}
          <div className="space-y-3">
            <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">Account Access</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="hover:text-white transition-colors">Student Sign In</Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-white transition-colors">Student Sign Up</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} VU SIGMA Exam Portal. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <Link href="/privacy-policy" className="hover:underline">Privacy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:underline">Terms</Link>
            <span>•</span>
            <Link href="/disclaimer" className="hover:underline">Disclaimer</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
