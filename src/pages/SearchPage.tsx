import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CouponCard } from '../components/CouponCard';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';

interface Coupon {
  id: string;
  brand_name: string;
  title: string;
  description: string;
  discount_percentage: number | null;
  discount_amount: number | null;
  code: string | null;
  category: string;
  location: string;
  country: string;
  valid_until: string;
  brand_logo_url: string | null;
  external_url: string | null;
}

interface SearchPageProps {
  initialSearch?: string;
  initialCategory?: string;
}

export const SearchPage = ({ initialSearch = '', initialCategory = 'all' }: SearchPageProps) => {
  const { user } = useAuth();
  const { location } = useLocation();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [aiSearching, setAiSearching] = useState(false);
  const [useAiSearch, setUseAiSearch] = useState(true);
  const categories = ['all', 'Food', 'Fashion', 'Electronics', 'Travel', 'Health', 'Entertainment'];

  useEffect(() => {
    if (searchTerm && useAiSearch) {
      const timeoutId = setTimeout(() => {
        performAiSearch();
      }, 1000);
      return () => clearTimeout(timeoutId);
    } else {
      fetchCoupons();
    }
  }, [location, searchTerm, selectedCategory, useAiSearch]);

  const performAiSearch = async () => {
    try {
      setAiSearching(true);
      setLoading(true);

      const dbCouponsPromise = fetchDatabaseCoupons();

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-deal-scraper`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const [dbCoupons, aiResponse] = await Promise.allSettled([
        dbCouponsPromise,
        fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            query: searchTerm,
            location: location?.country || 'Worldwide',
            city: location?.city || '',
            category: selectedCategory !== 'all' ? selectedCategory : undefined,
          }),
        })
      ]);

      let localDeals: Coupon[] = [];
      let aiDeals: Coupon[] = [];

      if (dbCoupons.status === 'fulfilled') {
        localDeals = dbCoupons.value;
      }

      if (aiResponse.status === 'fulfilled' && aiResponse.value.ok) {
        const result = await aiResponse.value.json();
        if (result.deals && Array.isArray(result.deals)) {
          aiDeals = result.deals.map((deal: any) => ({
            id: deal.id || `ai-${Date.now()}-${Math.random()}`,
            brand_name: deal.brand_name || deal.brand || 'Unknown Brand',
            title: deal.title,
            description: deal.description || '',
            discount_percentage: deal.discount_percentage || null,
            discount_amount: deal.discount_amount || null,
            code: deal.code || null,
            category: deal.category || selectedCategory,
            location: deal.location || location?.country || 'Worldwide',
            country: deal.country || location?.country || 'Worldwide',
            valid_until: deal.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            brand_logo_url: deal.brand_logo_url || null,
            external_url: deal.external_url || deal.url || null,
          }));
        }
      }

      const sortedDeals = prioritizeLocalDeals([...localDeals, ...aiDeals]);
      setCoupons(sortedDeals);

    } catch (error) {
      console.error('AI search error:', error);
      await fetchCoupons();
    } finally {
      setAiSearching(false);
      setLoading(false);
    }
  };

  const fetchDatabaseCoupons = async (): Promise<Coupon[]> => {
    try {
      const query = supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString());

      const { data, error } = await query;
      if (error) throw error;

      console.log(`Fetched ${data?.length || 0} coupons from database`);
      console.log('User location:', location?.country);

      return data || [];
    } catch (error) {
      console.error('Error fetching database coupons:', error);
      return [];
    }
  };

  const prioritizeLocalDeals = (deals: Coupon[]): Coupon[] => {
    if (!location?.country) {
      console.log('No location, returning unsorted deals');
      return deals;
    }

    console.log(`Prioritizing deals for: ${location.country}`);

    const deduped = new Map<string, Coupon>();
    deals.forEach(deal => {
      const key = `${deal.brand_name}-${deal.title}`.toLowerCase();
      const existing = deduped.get(key);
      if (!existing) {
        deduped.set(key, deal);
      } else if (deal.country === location.country && existing.country !== location.country) {
        deduped.set(key, deal);
      }
    });

    const uniqueDeals = Array.from(deduped.values());

    const localDeals = uniqueDeals.filter(deal =>
      deal.country === location.country
    );
    const worldwideDeals = uniqueDeals.filter(deal =>
      deal.country === 'Worldwide'
    );
    const otherDeals = uniqueDeals.filter(deal =>
      deal.country !== location.country &&
      deal.country !== 'Worldwide'
    );

    console.log(`Local deals: ${localDeals.length}, Worldwide: ${worldwideDeals.length}, Other: ${otherDeals.length}`);
    console.log('First 3 local deals:', localDeals.slice(0, 3).map(d => `${d.brand_name} - ${d.title} (${d.country})`));

    const sorted = [...localDeals, ...worldwideDeals, ...otherDeals];
    console.log('First 5 sorted deals:', sorted.slice(0, 5).map(d => `${d.brand_name} - ${d.country}`));

    return sorted;
  };

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const coupons = await fetchDatabaseCoupons();
      const sortedCoupons = prioritizeLocalDeals(coupons);
      setCoupons(sortedCoupons);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch =
      searchTerm === '' ||
      coupon.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || coupon.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAgMTJjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search brands, deals, categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-4 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-xl glass transition-all"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-6 py-4 rounded-xl text-gray-900 focus:outline-none focus:ring-4 focus:ring-white/30 shadow-xl glass font-medium transition-all cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
            {location && (
              <p className="text-white/90">
                📍 {location.city}, {location.country}
              </p>
            )}
            <label className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl cursor-pointer hover:bg-white/20 transition-all">
              <input
                type="checkbox"
                checked={useAiSearch}
                onChange={(e) => setUseAiSearch(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-white/90 text-sm font-medium flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI-Powered Search
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
            <p className="mt-4 text-gray-600 font-medium">
              {aiSearching ? 'AI is searching for the best deals...' : 'Finding amazing deals...'}
            </p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block p-6 bg-white rounded-full shadow-lg mb-6">
              <svg className="h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No deals found</h3>
            <p className="text-gray-600">Try adjusting your search or browse all categories</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {searchTerm ? `Results for "${searchTerm}"` : selectedCategory === 'all' ? 'All Deals' : `${selectedCategory} Deals`}
                </h2>
                <div className="flex items-center gap-4 mt-2">
                  {aiSearching && (
                    <p className="text-sm text-purple-600 flex items-center gap-2">
                      <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Powered by AI
                    </p>
                  )}
                  {location && (
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                      {filteredCoupons.filter(c => c.country === location.country).length} local deals
                    </p>
                  )}
                </div>
              </div>
              <span className="text-gray-600 font-medium">{filteredCoupons.length} total results</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCoupons.map((coupon) => (
                <CouponCard key={coupon.id} coupon={coupon} userId={user?.id} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
