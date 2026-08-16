'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/useAuthStore';
import { Lock, Mail, User, AlertTriangle, GraduationCap, Eye, EyeOff, Shield } from 'lucide-react';

export default function AuthForm({ mode = 'login', role = 'STUDENT' }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login, adminLogin, register, loading, error } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    useAuthStore.setState({ error: null });
  }, []);

  const config = {
    STUDENT: {
      title: 'Student',
      icon: GraduationCap,
      color: 'emerald',
      redirect: '/',
      desc: 'Start your exam preparation journey',
      loginLink: '/login',
      signupLink: '/signup'
    },
    SUPER_ADMIN: {
      title: 'Super Admin',
      icon: Shield,
      color: 'purple',
      redirect: '/admin',
      desc: 'System administration and moderation',
      loginLink: '/admin/login',
      signupLink: null
    }
  }[role] || {
    title: 'Student',
    icon: GraduationCap,
    color: 'emerald',
    redirect: '/',
    desc: 'Start your exam preparation journey',
    loginLink: '/login',
    signupLink: '/signup'
  };

  const Icon = config.icon;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'signup') {
      if (password !== confirmPassword) {
        useAuthStore.setState({ error: 'Passwords do not match.' });
        return;
      }
      if (password.length < 6) {
        useAuthStore.setState({ error: 'Password must be at least 6 characters.' });
        return;
      }
      try {
        await register(name, email, password, role);
        router.push(config.redirect);
      } catch (err) {
        console.error('Signup Error:', err);
      }
    } else {
      try {
        if (role === 'SUPER_ADMIN') {
          await adminLogin(email, password);
        } else {
          await login(email, password, role);
        }
        router.push(config.redirect);
      } catch (err) {
        console.error('Login Error:', err);
      }
    }
  };

  const getThemeClasses = () => {
    switch(config.color) {
      case 'indigo': return {
        bg: 'bg-indigo-600/20', border: 'border-indigo-500/30', text: 'text-indigo-400',
        btn: 'bg-indigo-600 hover:bg-indigo-700', link: 'text-indigo-400 hover:text-indigo-300',
        focus: 'focus:ring-indigo-500'
      };
      case 'purple': return {
        bg: 'bg-purple-600/20', border: 'border-purple-500/30', text: 'text-purple-400',
        btn: 'bg-purple-600 hover:bg-purple-700', link: 'text-purple-400 hover:text-purple-300',
        focus: 'focus:ring-purple-500'
      };
      case 'emerald':
      default: return {
        bg: 'bg-emerald-600/20', border: 'border-emerald-500/30', text: 'text-emerald-400',
        btn: 'bg-emerald-600 hover:bg-emerald-700', link: 'text-emerald-400 hover:text-emerald-300',
        focus: 'focus:ring-emerald-500'
      };
    }
  };

  const theme = getThemeClasses();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className={`w-14 h-14 ${theme.bg} border ${theme.border} rounded-2xl flex items-center justify-center mx-auto ${theme.text}`}>
            <Icon className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {mode === 'login' ? `${config.title} Portal` : `Create ${config.title} Account`}
          </h1>
          <p className="text-slate-400 text-xs">{config.desc}</p>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-900/50 text-red-300 p-3 rounded-xl text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'signup' && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className={`w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl outline-none focus:ring-2 ${theme.focus}`}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl outline-none focus:ring-2 ${theme.focus}`}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? "Min 6 characters" : "••••••••"}
                className={`w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl outline-none focus:ring-2 ${theme.focus}`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className={`w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl outline-none focus:ring-2 ${theme.focus}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full ${theme.btn} text-white font-bold py-3 rounded-xl text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span>{mode === 'login' ? `Sign In as ${config.title}` : `Create ${config.title} Account`}</span>
            )}
          </button>
        </form>

        {config.signupLink && (
          <div className="text-center text-xs text-slate-500">
            {mode === 'login' ? (
              <>Don't have an account? <Link href={config.signupLink} className={`${theme.link} font-semibold transition-colors`}>Sign Up</Link></>
            ) : (
              <>Already have an account? <Link href={config.loginLink} className={`${theme.link} font-semibold transition-colors`}>Sign In</Link></>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
