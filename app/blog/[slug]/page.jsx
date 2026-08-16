'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import RealisticPageLoader from '@/components/RealisticPageLoader';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Share2,
  BookOpen,
  Tag,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function PublicBlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBlogDetail = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/blogs/${slug}`);
        setBlog(res.data);
        setError(null);
      } catch (err) {
        setError('Article not found or moved.');
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchBlogDetail();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <RealisticPageLoader
          title="Loading Article..."
          subtitle="Fetching full study guide content..."
          steps={[
            "Resolving article slug...",
            "Loading content and metadata...",
            "Formatting guide..."
          ]}
        />
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center space-y-6">
        <div className="bg-red-950/40 border border-red-900 text-red-300 p-6 rounded-3xl">
          <h2 className="text-xl font-bold mb-2">Article Not Found</h2>
          <p className="text-xs">{error || 'The requested article could not be loaded.'}</p>
        </div>
        <button
          onClick={() => router.push('/blog')}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl inline-flex items-center space-x-2 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Blog Catalog</span>
        </button>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* Back Button */}
      <button
        onClick={() => router.push('/blog')}
        className="text-slate-400 hover:text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Blog Catalog</span>
      </button>

      {/* Article Header */}
      <header className="space-y-4 border-b border-slate-800 pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1 bg-purple-950/60 text-purple-300 border border-purple-900 rounded-xl text-xs font-bold uppercase">
            {blog.category}
          </span>
          {blog.relatedSubjectCode && (
            <Link
              href={`/subjects/${blog.relatedSubjectCode}`}
              className="px-3 py-1 bg-blue-950/60 text-blue-300 border border-blue-900 hover:bg-blue-900/60 rounded-xl text-xs font-bold transition-colors"
            >
              Practice {blog.relatedSubjectCode} &rarr;
            </Link>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
          {blog.title}
        </h1>

        <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-medium">
          {blog.excerpt}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 pt-4 border-t border-slate-800/80">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1.5 font-semibold text-slate-200">
              <User className="w-4 h-4 text-purple-400" />
              <span>{blog.author || 'VU SIGMA Academic Team'}</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>{new Date(blog.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>{blog.readTime || '5 min read'}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Article Body */}
      <div className="prose prose-invert max-w-none text-slate-200 text-sm sm:text-base leading-relaxed space-y-6 whitespace-pre-line bg-slate-900/50 p-6 sm:p-10 rounded-3xl border border-slate-800 shadow-sm">
        {blog.content}
      </div>

      {/* Author Bio Box (AdSense E-E-A-T Compliance) */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center space-x-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
          VU
        </div>
        <div>
          <h4 className="font-bold text-white text-sm">{blog.author || 'VU SIGMA Academic Team'}</h4>
          <p className="text-slate-400 text-xs mt-0.5">
            Verified study content &amp; past paper preparation guides reviewed for 2026 Virtual University examinations.
          </p>
        </div>
      </div>
    </article>
  );
}
