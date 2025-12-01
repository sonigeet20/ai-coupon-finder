import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { CouponCard } from '../components/CouponCard';
import { useAuth } from '../contexts/AuthContext';

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
  valid_until: string;
  brand_logo_url: string | null;
  external_url: string | null;
}

export const SavedPage = () => {
  const { user } = useAuth();
  const [savedCoupons, setSavedCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSavedCoupons();
    }
  }, [user]);

  const fetchSavedCoupons = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_saved_coupons')
        .select(`
          coupon_id,
          coupons (*)
        `)
        .eq('user_id', user?.id);

      if (error) throw error;

      const coupons = data?.map((item: any) => item.coupons).filter(Boolean) || [];
      const validCoupons = coupons.filter((coupon: Coupon) =>
        new Date(coupon.valid_until) >= new Date()
      );
      setSavedCoupons(validCoupons);
    } catch (error) {
      console.error('Error fetching saved coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Saved Deals</h1>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : savedCoupons.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">You haven't saved any deals yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedCoupons.map((coupon) => (
              <CouponCard key={coupon.id} coupon={coupon} userId={user?.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
