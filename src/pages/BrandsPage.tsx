import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Brand {
  id: string;
  brand_name: string;
  category: string;
  coupon_count: number;
}

export const BrandsPage = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('coupons')
        .select('brand_name, category')
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString());

      if (error) throw error;

      const brandMap = new Map<string, Brand>();
      data?.forEach((coupon: any) => {
        const existing = brandMap.get(coupon.brand_name);
        if (existing) {
          existing.coupon_count++;
        } else {
          brandMap.set(coupon.brand_name, {
            id: coupon.brand_name,
            brand_name: coupon.brand_name,
            category: coupon.category,
            coupon_count: 1,
          });
        }
      });

      setBrands(Array.from(brandMap.values()).sort((a, b) =>
        a.brand_name.localeCompare(b.brand_name)
      ));
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBrands = brands.filter((brand) =>
    brand.brand_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">All Brands</h1>

        <div className="mb-8">
          <input
            type="text"
            placeholder="Search brands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredBrands.map((brand) => (
              <div
                key={brand.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{brand.brand_name}</h3>
                <p className="text-sm text-gray-600 mb-2">{brand.category}</p>
                <div className="text-sm text-blue-600 font-medium">
                  {brand.coupon_count} {brand.coupon_count === 1 ? 'deal' : 'deals'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
