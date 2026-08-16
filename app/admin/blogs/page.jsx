'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  FileText,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  BookOpen,
  Tag,
  X
} from 'lucide-react';

export default function AdminBlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'Exam Preparation',
    author: 'VU SIGMA Academic Team',
    readTime: '5 min read',
    coverImage: '',
    status: 'published',
    tags: '',
    relatedSubjectCode: ''
  });

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/blogs');
      setBlogs(res.data || []);
    } catch (err) {
      console.error('Error fetching blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const openCreateModal = () => {
    setEditingBlog(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      category: 'Exam Preparation',
      author: 'VU SIGMA Academic Team',
      readTime: '5 min read',
      coverImage: '',
      status: 'published',
      tags: '',
      relatedSubjectCode: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title || '',
      slug: blog.slug || '',
      excerpt: blog.excerpt || '',
      content: blog.content || '',
      category: blog.category || 'Exam Preparation',
      author: blog.author || 'VU SIGMA Academic Team',
      readTime: blog.readTime || '5 min read',
      coverImage: blog.coverImage || '',
      status: blog.status || 'published',
      tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : (blog.tags || ''),
      relatedSubjectCode: blog.relatedSubjectCode || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };

      if (editingBlog) {
        await api.put(`/blogs/${editingBlog.slug || editingBlog.id}`, payload);
      } else {
        await api.post('/blogs', payload);
      }

      setIsModalOpen(false);
      fetchBlogs();
    } catch (err) {
      alert('Error saving blog post: ' + err.message);
    }
  };

  const handleDelete = async (blog) => {
    if (!confirm(`Are you sure you want to delete "${blog.title}"?`)) return;
    try {
      await api.delete(`/blogs/${blog.slug || blog.id}`);
      fetchBlogs();
    } catch (err) {
      alert('Error deleting blog: ' + err.message);
    }
  };

  const toggleStatus = async (blog) => {
    const newStatus = blog.status === 'published' ? 'draft' : 'published';
    try {
      await api.put(`/blogs/${blog.slug || blog.id}`, { status: newStatus });
      fetchBlogs();
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  const filteredBlogs = blogs.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase()) ||
    (b.relatedSubjectCode && b.relatedSubjectCode.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-400" />
            Blog Posts &amp; Editorial Guides
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Create high-value study guides and articles for Virtual University students (Boosts AdSense approval).
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create Blog Post
        </button>
      </div>

      {/* Search & Counter */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search articles by title, category, or subject code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <span className="text-xs font-semibold text-slate-400">
          Total Articles: <strong className="text-white">{filteredBlogs.length}</strong>
        </span>
      </div>

      {/* Blog Cards List */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-3xl text-slate-400">
          <BookOpen className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Blog Articles Found</h3>
          <p className="text-xs">Click "Create Blog Post" to add your first article.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map(blog => (
            <div key={blog.id || blog.slug} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 bg-purple-950/60 text-purple-300 border border-purple-900 rounded-lg text-[10px] font-bold uppercase">
                    {blog.category}
                  </span>
                  <button
                    onClick={() => toggleStatus(blog)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 cursor-pointer border ${
                      blog.status === 'published'
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-900'
                        : 'bg-amber-950/60 text-amber-400 border-amber-900'
                    }`}
                  >
                    {blog.status === 'published' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {blog.status}
                  </button>
                </div>

                <h3 className="text-lg font-bold text-white line-clamp-2">{blog.title}</h3>
                <p className="text-slate-400 text-xs line-clamp-3">{blog.excerpt}</p>

                {blog.relatedSubjectCode && (
                  <span className="inline-block bg-blue-950/60 text-blue-300 border border-blue-900 px-2 py-0.5 rounded text-[10px] font-bold">
                    Subject: {blog.relatedSubjectCode}
                  </span>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">{blog.readTime || '5 min read'}</span>
                <div className="flex items-center space-x-2">
                  <a
                    href={`/blog/${blog.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="Preview Public Article"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => openEditModal(blog)}
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                    title="Edit Article"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(blog)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Article"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-6 my-auto shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Article Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. CS101 Midterm Preparation Guide & Handouts Summary 2026"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Exam Preparation">Exam Preparation</option>
                    <option value="Subject Handouts Summary">Subject Handouts Summary</option>
                    <option value="VU Study Tips">VU Study Tips</option>
                    <option value="CGPA & Grading">CGPA &amp; Grading</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Related Subject Code (Optional)</label>
                  <input
                    type="text"
                    value={formData.relatedSubjectCode}
                    onChange={(e) => setFormData({ ...formData, relatedSubjectCode: e.target.value })}
                    placeholder="e.g. CS101, MTH101"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Short Excerpt (Preview Text) *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="A brief summary of the article that appears in preview cards..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Content (Markdown or HTML supported) *</label>
                <textarea
                  required
                  rows={10}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write the full study guide content (1,000+ words recommended for AdSense)..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Author Name</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl cursor-pointer shadow-md"
                >
                  {editingBlog ? 'Save Changes' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
