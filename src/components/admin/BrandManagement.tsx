import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Brand {
  id: string;
  brand_name: string;
  category: string;
  priority: number;
  is_active: boolean;
  geographies: any[];
  global_url: string | null;
  affiliate_url: string | null;
  scrape_frequency_hours: number;
  last_scraped_at: string | null;
}

interface Geography {
  country: string;
  url: string;
  affiliate_url: string;
}

export const BrandManagement = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    brand_name: '',
    category: 'General',
    priority: 5,
    is_active: true,
    global_url: '',
    affiliate_url: '',
    scrape_frequency_hours: 6,
  });
  const [geographies, setGeographies] = useState<Geography[]>([]);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    const { data } = await supabase
      .from('brands')
      .select('*')
      .order('priority', { ascending: false });
    setBrands(data || []);
  };

  const addGeography = () => {
    setGeographies([...geographies, { country: '', url: '', affiliate_url: '' }]);
  };

  const updateGeography = (index: number, field: keyof Geography, value: string) => {
    const updated = [...geographies];
    updated[index][field] = value;
    setGeographies(updated);
  };

  const removeGeography = (index: number) => {
    setGeographies(geographies.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const brandData = {
        ...formData,
        geographies: geographies.filter(g => g.country && g.url),
      };

      if (editingBrand) {
        const { error } = await supabase
          .from('brands')
          .update(brandData)
          .eq('id', editingBrand);
        if (error) throw error;
        setMessage('Brand updated successfully!');
      } else {
        const { error } = await supabase.from('brands').insert(brandData);
        if (error) throw error;
        setMessage('Brand created successfully!');
      }

      resetForm();
      fetchBrands();
    } catch (error: any) {
      setMessage(error.message || 'Failed to save brand');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand.id);
    setFormData({
      brand_name: brand.brand_name,
      category: brand.category,
      priority: brand.priority,
      is_active: brand.is_active,
      global_url: brand.global_url || '',
      affiliate_url: brand.affiliate_url || '',
      scrape_frequency_hours: brand.scrape_frequency_hours,
    });
    setGeographies(brand.geographies || []);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand?')) return;

    try {
      const { error } = await supabase.from('brands').delete().eq('id', id);
      if (error) throw error;
      setMessage('Brand deleted successfully!');
      fetchBrands();
    } catch (error: any) {
      setMessage(error.message || 'Failed to delete brand');
    }
  };

  const resetForm = () => {
    setFormData({
      brand_name: '',
      category: 'General',
      priority: 5,
      is_active: true,
      global_url: '',
      affiliate_url: '',
      scrape_frequency_hours: 6,
    });
    setGeographies([]);
    setEditingBrand(null);
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Brand Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
        >
          {showForm ? 'View Brands' : '+ New Brand'}
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
                Brand Name *
              </label>
              <input
                type="text"
                value={formData.brand_name}
                onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                <option value="General">General</option>
                <option value="Food">Food</option>
                <option value="Fashion">Fashion</option>
                <option value="Electronics">Electronics</option>
                <option value="Travel">Travel</option>
                <option value="Health">Health</option>
                <option value="Entertainment">Entertainment</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Priority (1-10) *
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="1"
                max="10"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Scrape Frequency (hours) *
              </label>
              <input
                type="number"
                value={formData.scrape_frequency_hours}
                onChange={(e) => setFormData({ ...formData, scrape_frequency_hours: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Status
              </label>
              <select
                value={formData.is_active ? 'active' : 'inactive'}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Global URL
            </label>
            <input
              type="url"
              value={formData.global_url}
              onChange={(e) => setFormData({ ...formData, global_url: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Global Affiliate URL
            </label>
            <input
              type="url"
              value={formData.affiliate_url}
              onChange={(e) => setFormData({ ...formData, affiliate_url: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-gray-700 text-sm font-semibold">
                Geography-Specific URLs
              </label>
              <button
                type="button"
                onClick={addGeography}
                className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 font-semibold"
              >
                + Add Geography
              </button>
            </div>
            {geographies.map((geo, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
                <input
                  type="text"
                  placeholder="Country"
                  value={geo.country}
                  onChange={(e) => updateGeography(index, 'country', e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="url"
                  placeholder="URL"
                  value={geo.url}
                  onChange={(e) => updateGeography(index, 'url', e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Affiliate URL"
                    value={geo.affiliate_url}
                    onChange={(e) => updateGeography(index, 'affiliate_url', e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeGeography(index)}
                    className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? 'Saving...' : editingBrand ? 'Update Brand' : 'Create Brand'}
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
        <div className="space-y-4">
          {brands.length === 0 ? (
            <p className="text-center text-gray-500 py-12">No brands yet. Add your first brand!</p>
          ) : (
            brands.map((brand) => (
              <div
                key={brand.id}
                className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{brand.brand_name}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        brand.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {brand.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700">
                        Priority: {brand.priority}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{brand.category}</p>
                    <div className="text-sm text-gray-500">
                      <p>Scrape every {brand.scrape_frequency_hours} hours</p>
                      {brand.geographies && brand.geographies.length > 0 && (
                        <p>{brand.geographies.length} geographic configurations</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(brand)}
                      className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 font-semibold"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(brand.id)}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-semibold"
                    >
                      Delete
                    </button>
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
