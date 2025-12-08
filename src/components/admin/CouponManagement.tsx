import { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface CouponFormData {
  brand_name: string;
  title: string;
  description: string;
  discount_percentage: string;
  discount_amount: string;
  code: string;
  category: string;
  location: string;
  country: string;
  valid_until: string;
  external_url: string;
  brand_logo_url: string;
}

export const CouponManagement = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [fetchingLogos, setFetchingLogos] = useState(false);
  const [logoFetchResults, setLogoFetchResults] = useState<string>('');
  const [formData, setFormData] = useState<CouponFormData>({
    brand_name: '',
    title: '',
    description: '',
    discount_percentage: '',
    discount_amount: '',
    code: '',
    category: 'General',
    location: 'Worldwide',
    country: 'Worldwide',
    valid_until: '',
    external_url: '',
    brand_logo_url: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.from('coupons').insert({
        brand_name: formData.brand_name,
        title: formData.title,
        description: formData.description,
        discount_percentage: formData.discount_percentage
          ? parseFloat(formData.discount_percentage)
          : null,
        discount_amount: formData.discount_amount
          ? parseFloat(formData.discount_amount)
          : null,
        code: formData.code || null,
        category: formData.category,
        location: formData.location,
        country: formData.country,
        valid_until: formData.valid_until,
        external_url: formData.external_url || null,
        brand_logo_url: formData.brand_logo_url || null,
        is_active: true,
      });

      if (error) throw error;

      setMessage('Coupon created successfully!');
      setFormData({
        brand_name: '',
        title: '',
        description: '',
        discount_percentage: '',
        discount_amount: '',
        code: '',
        category: 'General',
        location: 'Worldwide',
        country: 'Worldwide',
        valid_until: '',
        external_url: '',
        brand_logo_url: '',
      });
    } catch (error: any) {
      setMessage(error.message || 'Failed to create coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const fetchAllBrandLogos = async () => {
    setFetchingLogos(true);
    setLogoFetchResults('Fetching logos for all brands...');

    try {
      // Get all unique brands without logos
      const { data: coupons, error } = await supabase
        .from('coupons')
        .select('brand_name, brand_logo_url')
        .eq('is_active', true);

      if (error) throw error;

      const uniqueBrands = [...new Set(coupons?.map(c => c.brand_name) || [])];
      const brandsNeedingLogos = uniqueBrands.filter(brand => {
        const coupon = coupons?.find(c => c.brand_name === brand);
        return !coupon?.brand_logo_url;
      });

      setLogoFetchResults(`Found ${brandsNeedingLogos.length} brands without logos. Processing...`);

      let updated = 0;
      let notFound = 0;

      for (const brand of brandsNeedingLogos) {
        const logoUrl = await getBrandLogoUrl(brand);
        
        if (logoUrl) {
          const { error: updateError } = await supabase
            .from('coupons')
            .update({ brand_logo_url: logoUrl })
            .eq('brand_name', brand)
            .is('brand_logo_url', null);

          if (!updateError) {
            updated++;
          }
        } else {
          notFound++;
        }

        setLogoFetchResults(
          `Processing ${brand}...\n` +
          `Updated: ${updated} | Not found: ${notFound} | Remaining: ${brandsNeedingLogos.length - updated - notFound}`
        );

        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setLogoFetchResults(
        `✓ Completed!\n` +
        `Successfully updated: ${updated} brands\n` +
        `No logos found: ${notFound} brands\n` +
        `Total processed: ${brandsNeedingLogos.length}`
      );
    } catch (error: any) {
      setLogoFetchResults(`Error: ${error.message}`);
    } finally {
      setFetchingLogos(false);
    }
  };

  const getBrandLogoUrl = async (brandName: string): Promise<string | null> => {
    const cleanName = brandName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Try multiple services
    const services = [
      `https://logo.clearbit.com/${cleanName}.com`,
      `https://www.google.com/s2/favicons?domain=${cleanName}.com&sz=128`,
      `https://icons.duckduckgo.com/ip3/${cleanName}.com.ico`,
    ];

    for (const url of services) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          return url;
        }
      } catch (e) {
        continue;
      }
    }

    return null;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create New Coupon</h2>
        <button
          onClick={fetchAllBrandLogos}
          disabled={fetchingLogos}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {fetchingLogos ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Fetching Logos...
            </span>
          ) : (
            '🎨 Auto-Fetch All Brand Logos'
          )}
        </button>
      </div>

      {logoFetchResults && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 whitespace-pre-line">
          {logoFetchResults}
        </div>
      )}

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

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Brand Name *
            </label>
            <input
              type="text"
              name="brand_name"
              value={formData.brand_name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
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

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Discount Percentage
            </label>
            <input
              type="number"
              name="discount_percentage"
              value={formData.discount_percentage}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              min="0"
              max="100"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Discount Amount ($)
            </label>
            <input
              type="number"
              name="discount_amount"
              value={formData.discount_amount}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Coupon Code
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Valid Until *
            </label>
            <input
              type="date"
              name="valid_until"
              value={formData.valid_until}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Country
            </label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            External URL
          </label>
          <input
            type="url"
            name="external_url"
            value={formData.external_url}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            Brand Logo URL
          </label>
          <input
            type="url"
            name="brand_logo_url"
            value={formData.brand_logo_url}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Coupon'}
        </button>
      </form>
    </div>
  );
};
