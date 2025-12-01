import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string | null;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  status: string;
  published_at: string | null;
  created_at: string;
}

interface BlogFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  status: string;
}

export const BlogManagement = () => {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingBlog, setEditingBlog] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content');
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    status: 'draft',
  });

  useEffect(() => {
    fetchBlogs();
  }, []);

  useEffect(() => {
    if (!formData.meta_title && formData.title) {
      setFormData(prev => ({ ...prev, meta_title: formData.title }));
    }
    if (!formData.meta_description && formData.excerpt) {
      setFormData(prev => ({ ...prev, meta_description: formData.excerpt }));
    }
  }, [formData.title, formData.excerpt]);

  const fetchBlogs = async () => {
    const { data } = await supabase
      .from('blogs')
      .select('*')
      .order('created_at', { ascending: false });
    setBlogs(data || []);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: editingBlog ? formData.slug : generateSlug(title),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const blogData = {
        ...formData,
        author_id: user?.id,
        published_at: formData.status === 'published' ? new Date().toISOString() : null,
      };

      if (editingBlog) {
        const { error } = await supabase
          .from('blogs')
          .update(blogData)
          .eq('id', editingBlog);
        if (error) throw error;
        setMessage('Blog updated successfully!');
      } else {
        const { error } = await supabase.from('blogs').insert(blogData);
        if (error) throw error;
        setMessage('Blog created successfully!');
      }

      resetForm();
      fetchBlogs();
    } catch (error: any) {
      setMessage(error.message || 'Failed to save blog');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (blog: Blog) => {
    setEditingBlog(blog.id);
    setFormData({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt,
      content: blog.content,
      featured_image: blog.featured_image || '',
      meta_title: blog.meta_title || '',
      meta_description: blog.meta_description || '',
      meta_keywords: blog.meta_keywords || '',
      status: blog.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog?')) return;

    try {
      const { error } = await supabase.from('blogs').delete().eq('id', id);
      if (error) throw error;
      setMessage('Blog deleted successfully!');
      fetchBlogs();
    } catch (error: any) {
      setMessage(error.message || 'Failed to delete blog');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featured_image: '',
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      status: 'draft',
    });
    setEditingBlog(null);
    setShowForm(false);
    setShowPreview(false);
    setActiveTab('content');
  };

  const wordCount = formData.content.trim().split(/\s+/).filter(w => w.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Blog Management</h2>
          <p className="text-gray-600 text-sm mt-1">{blogs.length} total articles</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
        >
          {showForm ? 'View Blogs' : '+ New Blog'}
        </button>
      </div>

      {message && (
        <div
          className={`mb-6 px-4 py-3 rounded-xl ${
            message.includes('success')
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message}
        </div>
      )}

      {showForm ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => { setActiveTab('content'); setShowPreview(false); }}
                  className={`px-4 py-2 font-semibold transition-all ${
                    activeTab === 'content' && !showPreview
                      ? 'border-b-2 border-purple-600 text-purple-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Content
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('seo'); setShowPreview(false); }}
                  className={`px-4 py-2 font-semibold transition-all ${
                    activeTab === 'seo' && !showPreview
                      ? 'border-b-2 border-purple-600 text-purple-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  SEO
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className={`px-4 py-2 font-semibold transition-all ${
                    showPreview
                      ? 'border-b-2 border-purple-600 text-purple-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Preview
                </button>
              </div>

              {!showPreview && activeTab === 'content' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Enter blog title..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Slug *
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">URL: /blog/{formData.slug}</p>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Featured Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.featured_image}
                      onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="https://example.com/image.jpg"
                    />
                    {formData.featured_image && (
                      <img
                        src={formData.featured_image}
                        alt="Preview"
                        className="mt-3 w-full h-48 object-cover rounded-xl"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Excerpt
                    </label>
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      rows={3}
                      maxLength={200}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Brief summary for preview cards..."
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.excerpt.length}/200 characters</p>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Content *
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={20}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                      placeholder="Write your blog content here... Supports markdown formatting."
                      required
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{wordCount} words • {readingTime} min read</span>
                      <span>{formData.content.length} characters</span>
                    </div>
                  </div>
                </div>
              )}

              {!showPreview && activeTab === 'seo' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      value={formData.meta_title}
                      onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                      maxLength={60}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="SEO title for search engines"
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.meta_title.length}/60 characters</p>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Meta Description
                    </label>
                    <textarea
                      value={formData.meta_description}
                      onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                      rows={3}
                      maxLength={160}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Description for search engine results"
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.meta_description.length}/160 characters</p>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Keywords (comma separated)
                    </label>
                    <input
                      type="text"
                      value={formData.meta_keywords}
                      onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="coupons, deals, savings, discounts"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">SEO Preview</h4>
                    <div className="text-sm">
                      <p className="text-blue-600 font-medium">{formData.meta_title || formData.title || 'Blog Title'}</p>
                      <p className="text-green-700 text-xs mt-1">yoursite.com/blog/{formData.slug || 'post-slug'}</p>
                      <p className="text-gray-700 mt-1">{formData.meta_description || formData.excerpt || 'Blog description will appear here...'}</p>
                    </div>
                  </div>
                </div>
              )}

              {showPreview && (
                <div className="prose prose-lg max-w-none">
                  {formData.featured_image && (
                    <img
                      src={formData.featured_image}
                      alt={formData.title}
                      className="w-full h-64 object-cover rounded-xl mb-6"
                    />
                  )}
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">{formData.title || 'Blog Title'}</h1>
                  {formData.excerpt && (
                    <p className="text-xl text-gray-600 mb-6">{formData.excerpt}</p>
                  )}
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {formData.content || 'Your blog content will appear here...'}
                  </div>
                </div>
              )}

              <div className="flex gap-4 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingBlog ? 'Update Blog' : 'Create Blog'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-4 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold text-gray-900 mb-4">Publishing</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div className="text-sm text-gray-600">
                  <p className="font-semibold mb-2">Quick Stats:</p>
                  <ul className="space-y-1">
                    <li>• {wordCount} words</li>
                    <li>• {readingTime} min read time</li>
                    <li>• {formData.content.length} characters</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
              <h3 className="font-bold mb-2">Writing Tips</h3>
              <ul className="text-sm space-y-2 opacity-90">
                <li>• Aim for 800-1200 words</li>
                <li>• Use clear headings</li>
                <li>• Include actionable tips</li>
                <li>• Add relevant examples</li>
                <li>• Optimize for SEO</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {blogs.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No blogs yet. Create your first blog post!</p>
          ) : (
            blogs.map((blog) => (
              <div
                key={blog.id}
                className="bg-white rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-6">
                  {blog.featured_image && (
                    <img
                      src={blog.featured_image}
                      alt={blog.title}
                      className="w-32 h-32 object-cover rounded-xl flex-shrink-0"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{blog.title}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(blog)}
                          className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(blog.id)}
                          className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2">{blog.excerpt}</p>
                    <div className="flex gap-4 text-sm">
                      <span className={`px-3 py-1 rounded-full font-semibold ${
                        blog.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {blog.status}
                      </span>
                      <span className="text-gray-500">{new Date(blog.created_at).toLocaleDateString()}</span>
                      <span className="text-gray-500">/{blog.slug}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
