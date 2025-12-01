import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Prompt {
  id: string;
  prompt_name: string;
  prompt_text: string;
  description: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

export const AIPromptsManagement = () => {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    prompt_name: '',
    prompt_text: '',
    description: '',
    category: 'general',
    is_active: true,
  });

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    const { data } = await supabase
      .from('ai_prompts')
      .select('*')
      .order('category', { ascending: true });
    setPrompts(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const promptData = {
        ...formData,
        updated_by: user?.id,
      };

      if (editingPrompt) {
        const { error } = await supabase
          .from('ai_prompts')
          .update(promptData)
          .eq('id', editingPrompt);
        if (error) throw error;
        setMessage('Prompt updated successfully!');
      } else {
        const { error } = await supabase.from('ai_prompts').insert(promptData);
        if (error) throw error;
        setMessage('Prompt created successfully!');
      }

      resetForm();
      fetchPrompts();
    } catch (error: any) {
      setMessage(error.message || 'Failed to save prompt');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt.id);
    setFormData({
      prompt_name: prompt.prompt_name,
      prompt_text: prompt.prompt_text,
      description: prompt.description,
      category: prompt.category,
      is_active: prompt.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;

    try {
      const { error } = await supabase.from('ai_prompts').delete().eq('id', id);
      if (error) throw error;
      setMessage('Prompt deleted successfully!');
      fetchPrompts();
    } catch (error: any) {
      setMessage(error.message || 'Failed to delete prompt');
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('ai_prompts')
        .update({ is_active: !currentStatus, updated_by: user?.id })
        .eq('id', id);

      if (error) throw error;
      setMessage('Prompt status updated!');
      fetchPrompts();
    } catch (error: any) {
      setMessage(error.message || 'Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      prompt_name: '',
      prompt_text: '',
      description: '',
      category: 'general',
      is_active: true,
    });
    setEditingPrompt(null);
    setShowForm(false);
  };

  const categories = ['general', 'search', 'scraping', 'content', 'analysis'];

  const groupedPrompts = categories.map(cat => ({
    category: cat,
    prompts: prompts.filter(p => p.category === cat),
  })).filter(g => g.prompts.length > 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">AI Prompts Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
        >
          {showForm ? 'View Prompts' : '+ New Prompt'}
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Prompt Name *
              </label>
              <input
                type="text"
                value={formData.prompt_name}
                onChange={(e) => setFormData({ ...formData, prompt_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., search_enhancement"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Brief description of what this prompt does"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Prompt Text *
            </label>
            <textarea
              value={formData.prompt_text}
              onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              placeholder="Enter your AI prompt template. Use {variable_name} for placeholders."
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              Use curly braces for variables: {'{query}'}, {'{content}'}, {'{topic}'}
            </p>
          </div>

          <div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-gray-700 font-semibold">Active</span>
            </label>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? 'Saving...' : editingPrompt ? 'Update Prompt' : 'Create Prompt'}
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
      ) : (
        <div className="space-y-6">
          {prompts.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No prompts yet. Create your first AI prompt!</p>
          ) : (
            groupedPrompts.map((group) => (
              <div key={group.category} className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 capitalize">
                  {group.category} Prompts
                </h3>
                <div className="space-y-4">
                  {group.prompts.map((prompt) => (
                    <div
                      key={prompt.id}
                      className="bg-white rounded-xl p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-bold text-gray-900">{prompt.prompt_name}</h4>
                            <button
                              onClick={() => toggleActive(prompt.id, prompt.is_active)}
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                prompt.is_active
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {prompt.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">{prompt.description}</p>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm font-mono text-gray-700 whitespace-pre-wrap">
                              {prompt.prompt_text.length > 200
                                ? prompt.prompt_text.substring(0, 200) + '...'
                                : prompt.prompt_text}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEdit(prompt)}
                            className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(prompt.id)}
                            className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
