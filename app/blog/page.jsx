'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import RealisticPageLoader from '@/components/RealisticPageLoader';
import {
  BookOpen,
  FileText,
  Clock,
  User,
  Search,
  ArrowRight,
  Sparkles,
  Calendar,
  Tag
} from 'lucide-react';

export default function PublicBlogPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        const res = await api.get('/blogs');
        setBlogs(res.data || []);
      } catch (err) {
        console.error('Error fetching public blogs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const categories = ['ALL', 'Exam Preparation', 'Subject Handouts Summary', 'VU Study Tips', 'CGPA & Grading'];

  const filteredBlogs = blogs.filter(b => {
    const matchesCategory = selectedCategory === 'ALL' || b.category === selectedCategory;
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.excerpt.toLowerCase().includes(search.toLowerCase()) ||
      (b.relatedSubjectCode && b.relatedSubjectCode.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-10">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-blue-900/40 border border-purple-500/20 rounded-3xl p-8 sm:p-12 text-center space-y-4 relative overflow-hidden">
        <div className="w-16 h-16 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-2xl flex items-center justify-center mx-auto mb-2">
          <BookOpen className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          VU Academic Blog &amp; Exam Guides
        </h1>
        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          In-depth Virtual University study strategies, subject handouts summaries, midterm &amp; final term exam tips, and academic advice written by top VU rankers.
        </p>
      </div>

      {/* Controls: Search & Category Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                selectedCategory === cat
                  ? 'bg-purple-600 border-purple-500 text-white shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat === 'ALL' ? 'All Articles' : cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search articles & guides..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Blog Cards Grid */}
      {loading ? (
        <RealisticPageLoader
          title="Loading Academic Blog Articles..."
          subtitle="Fetching VU study guides and exam strategies..."
          steps={[
            "Connecting to Editorial API...",
            "Loading blog posts catalog...",
            "Preparing study guides..."
          ]}
        />
      ) : filteredBlogs.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/60 border border-slate-800 rounded-3xl text-slate-400 space-y-3">
          <FileText className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="text-xl font-bold text-white">No Articles Found</h3>
          <p className="text-xs">Try selecting a different category or refining your search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBlogs.map(blog => (
            <article
              key={blog.id || blog.slug}
              className="bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-3xl p-6 flex flex-col justify-between space-y-6 transition-all hover:shadow-xl hover:shadow-purple-500/5 group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-3 py-1 bg-purple-950/60 text-purple-300 border border-purple-900 rounded-xl text-[10px] font-bold uppercase tracking-wide">
                    {blog.category}
                  </span>
                  {blog.relatedSubjectCode && (
                    <span className="px-2.5 py-1 bg-blue-950/60 text-blue-300 border border-blue-900 rounded-lg text-[10px] font-bold">
                      {blog.relatedSubjectCode}
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors leading-snug">
                  <Link href={`/blog/${blog.slug}`}>{blog.title}</Link>
                </h2>

                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                  {blog.excerpt}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{blog.author || 'VU SIGMA Team'}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>{blog.readTime || '5 min read'}</span>
                  </span>
                </div>

                <Link
                  href={`/blog/${blog.slug}`}
                  className="p-2 rounded-xl text-purple-400 group-hover:bg-purple-950/50 transition-colors flex items-center gap-1 font-bold text-xs"
                >
                  <span>Read</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
