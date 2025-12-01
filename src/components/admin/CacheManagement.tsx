import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface CacheEntry {
  id: string;
  brand_name: string;
  search_query: string;
  location: string;
  deals_count: number;
  last_scraped_at: string;
  created_at: string;
  updated_at: string;
}

export const CacheManagement = () => {
  const [cacheEntries, setCacheEntries] = useState<CacheEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchCache();
  }, []);

  const fetchCache = async () => {
    try {
      setLoading(true);
      setMessage('');
      const { data, error } = await supabase
        .from('brand_search_cache')
        .select('*')
        .order('last_scraped_at', { ascending: false });

      if (error) {
        console.error('Cache fetch error:', error);
        throw error;
      }

      console.log('Cache entries fetched:', data?.length || 0);
      setCacheEntries(data || []);
    } catch (error: any) {
      console.error('Failed to load cache:', error);
      setMessage(error.message || 'Failed to load cache');
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async (id?: string) => {
    if (!confirm(id ? 'Clear this cache entry?' : 'Clear all cache entries?')) return;

    try {
      setLoading(true);
      const { error } = id
        ? await supabase.from('brand_search_cache').delete().eq('id', id)
        : await supabase.from('brand_search_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;
      setMessage('Cache cleared successfully!');
      fetchCache();
    } catch (error: any) {
      setMessage(error.message || 'Failed to clear cache');
    } finally {
      setLoading(false);
    }
  };

  const refreshCache = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('brand_search_cache')
        .update({ last_scraped_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      setMessage('Cache entry refreshed!');
      fetchCache();
    } catch (error: any) {
      setMessage(error.message || 'Failed to refresh cache');
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = cacheEntries.filter((entry) => {
    if (filter === 'all') return true;
    return entry.location === filter;
  });

  const uniqueLocations = Array.from(new Set(cacheEntries.map(e => e.location)));
  const totalDeals = cacheEntries.reduce((sum, entry) => sum + entry.deals_count, 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cache Management</h2>
          <p className="text-gray-600 text-sm mt-1">
            {cacheEntries.length} cached searches • {totalDeals} total deals
          </p>
        </div>
        <button
          onClick={() => clearCache()}
          disabled={loading || cacheEntries.length === 0}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg disabled:opacity-50"
        >
          Clear All Cache
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <p className="text-blue-100 text-sm font-medium mb-1">Total Entries</p>
          <p className="text-4xl font-bold">{cacheEntries.length}</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <p className="text-purple-100 text-sm font-medium mb-1">Cached Deals</p>
          <p className="text-4xl font-bold">{totalDeals}</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <p className="text-green-100 text-sm font-medium mb-1">Locations</p>
          <p className="text-4xl font-bold">{uniqueLocations.length}</p>
        </div>
        <div className="bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl p-6 text-white">
          <p className="text-pink-100 text-sm font-medium mb-1">Avg Deals</p>
          <p className="text-4xl font-bold">
            {cacheEntries.length > 0 ? Math.round(totalDeals / cacheEntries.length) : 0}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-semibold mb-2">Filter by Location</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">All Locations ({cacheEntries.length})</option>
          {uniqueLocations.map((location) => (
            <option key={location} value={location}>
              {location} ({cacheEntries.filter(e => e.location === location).length})
            </option>
          ))}
        </select>
      </div>

      {loading && cacheEntries.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl">
          <div className="inline-block p-6 bg-gray-100 rounded-full mb-6">
            <svg className="h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">No Cache Entries</h3>
          <p className="text-gray-600">Cache entries will appear here as searches are performed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="bg-white rounded-xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{entry.brand_name}</h3>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                      {entry.deals_count} deals
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <p className="font-semibold text-gray-700">Search Query:</p>
                      <p className="font-mono bg-gray-50 px-2 py-1 rounded mt-1">{entry.search_query}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Location:</p>
                      <p className="flex items-center gap-1 mt-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {entry.location}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">Last Scraped:</p>
                      <p className="mt-1">
                        {new Date(entry.last_scraped_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => refreshCache(entry.id)}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 font-semibold disabled:opacity-50"
                    title="Refresh timestamp"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button
                    onClick={() => clearCache(entry.id)}
                    disabled={loading}
                    className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-semibold disabled:opacity-50"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
