'use client';
import { useState } from 'react';
import { Copy, Check, Code2, Terminal } from 'lucide-react';

const LANGUAGE_MAP = {
  cpp: { name: 'C++', icon: '⚡', color: 'text-blue-400 bg-blue-950/80 border-blue-800' },
  python: { name: 'Python', icon: '🐍', color: 'text-amber-300 bg-amber-950/80 border-amber-800' },
  java: { name: 'Java', icon: '☕', color: 'text-orange-400 bg-orange-950/80 border-orange-800' },
  javascript: { name: 'JavaScript', icon: '🟨', color: 'text-yellow-300 bg-yellow-950/80 border-yellow-800' },
  sql: { name: 'SQL', icon: '🗄️', color: 'text-cyan-400 bg-cyan-950/80 border-cyan-800' },
  mongoose: { name: 'Mongoose / MongoDB', icon: '🍃', color: 'text-emerald-400 bg-emerald-950/80 border-emerald-800' },
  csharp: { name: 'C#', icon: '🔷', color: 'text-purple-400 bg-purple-950/80 border-purple-800' },
  html: { name: 'HTML5', icon: '🌐', color: 'text-rose-400 bg-rose-950/80 border-rose-800' },
  css: { name: 'CSS3', icon: '🎨', color: 'text-indigo-400 bg-indigo-950/80 border-indigo-800' },
  rust: { name: 'Rust', icon: '⚙️', color: 'text-stone-300 bg-stone-900 border-stone-700' },
  php: { name: 'PHP', icon: '🐘', color: 'text-indigo-300 bg-indigo-950/80 border-indigo-800' }
};

export default function CodeBlock({ code, language = 'cpp', title = '' }) {
  const [copied, setCopied] = useState(false);

  if (!code || typeof code !== 'string' || !code.trim()) return null;

  const langConfig = LANGUAGE_MAP[language?.toLowerCase()] || {
    name: language?.toUpperCase() || 'CODE',
    icon: '💻',
    color: 'text-slate-300 bg-slate-900 border-slate-700'
  };

  const lines = code.trim().split('\n');

  const handleCopy = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-2xl border border-slate-800/90 bg-slate-950 overflow-hidden shadow-xl text-left">
      {/* Code Header Bar */}
      <div className="bg-slate-900/90 px-4 py-2.5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-extrabold flex items-center gap-1 ${langConfig.color}`}>
            <span>{langConfig.icon}</span>
            <span>{langConfig.name}</span>
          </span>
          {title && <span className="text-xs font-bold text-slate-300">{title}</span>}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="text-xs font-bold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700/80 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Container with Line Numbers */}
      <div className="p-4 overflow-x-auto font-mono text-xs text-slate-200 leading-relaxed flex">
        <div className="select-none text-slate-600 border-r border-slate-800/80 pr-3 mr-3 text-right shrink-0">
          {lines.map((_, idx) => (
            <div key={idx}>{idx + 1}</div>
          ))}
        </div>
        <pre className="font-mono text-xs text-emerald-300/90 flex-1 whitespace-pre">
          <code>{code.trim()}</code>
        </pre>
      </div>
    </div>
  );
}
