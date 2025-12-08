import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLocation } from '../contexts/LocationContext';
import { formatCurrency } from '../lib/currency';
import { localizeUrl } from '../lib/urlLocalization';
import Toast from './Toast';

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

interface CouponCardProps {
  coupon: Coupon;
  userId?: string;
}

export const CouponCard = ({ coupon, userId }: CouponCardProps) => {
  const { location } = useLocation();
  const [isSaved, setIsSaved] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const handleSave = async () => {
    if (!userId) return;

    try {
      if (isSaved) {
        await supabase
          .from('user_saved_coupons')
          .delete()
          .eq('user_id', userId)
          .eq('coupon_id', coupon.id);
        setIsSaved(false);
      } else {
        await supabase
          .from('user_saved_coupons')
          .insert({ user_id: userId, coupon_id: coupon.id });
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const handleRevealCode = () => {
    setShowCode(true);
    const localizedUrl = localizeUrl(coupon.external_url, coupon.brand_name, location?.country || coupon.country);
    if (localizedUrl) {
      window.open(localizedUrl, '_blank');
    }
  };

  const handleCopyCode = async (code: string | null) => {
    if (!code) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const el = document.createElement('textarea');
        el.value = code;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const getLocalizedExternalUrl = () => {
    return localizeUrl(coupon.external_url, coupon.brand_name, location?.country || coupon.country);
  };

  const getDiscountDisplay = () => {
    if (coupon.discount_percentage) {
      return `${coupon.discount_percentage}% OFF`;
    }
    if (coupon.discount_amount) {
      return `${formatCurrency(coupon.discount_amount, coupon.country)} OFF`;
    }
    return 'Special Offer';
  };

  const isLocalDeal = location?.country && coupon.country === location.country;

  return (
    <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden border border-gray-100">
      <div className="relative p-6">
        <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
            {getDiscountDisplay()}
          </div>
          {isLocalDeal && (
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              </svg>
              Local
            </div>
          )}
        </div>

        <div className="flex items-start gap-4 mb-4">
          {coupon.brand_logo_url && !logoError ? (
            <div className="w-16 h-16 flex-shrink-0 bg-white rounded-xl shadow-md p-2 border border-gray-100">
              <img
                src={coupon.brand_logo_url}
                alt={coupon.brand_name}
                className="w-full h-full object-contain"
                onError={() => setLogoError(true)}
              />
            </div>
          ) : (
            <div className="w-16 h-16 flex-shrink-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">
                {coupon.brand_name.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">{coupon.brand_name}</h3>
            <span className="inline-block px-3 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded-full">
              {coupon.category}
            </span>
          </div>
          {userId && (
            <button
              onClick={handleSave}
              className="flex-shrink-0 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg
                className={`w-6 h-6 transition-colors ${isSaved ? 'text-red-500 fill-current' : 'text-gray-400 hover:text-red-400'}`}
                fill={isSaved ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          )}
        </div>

        <h4 className="font-bold text-gray-900 mb-3 text-lg leading-snug">{coupon.title}</h4>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">{coupon.description}</p>

        <div className="flex items-center gap-2 mb-4 text-sm">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-gray-500 font-medium">
            Valid until {new Date(coupon.valid_until).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

          {coupon.code ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleRevealCode}
              className="col-span-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl group-hover:scale-105"
            >
              {showCode ? (
                <span className="font-mono tracking-widest text-lg">{coupon.code}</span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Reveal
                </span>
              )}
            </button>
            <button
              onClick={() => handleCopyCode(coupon.code)}
              className="col-span-1 bg-white text-purple-600 font-bold py-3.5 px-4 rounded-xl border border-purple-200 shadow-sm hover:shadow-md transition-all"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16h8M8 12h8M8 8h8" />
                </svg>
                Copy
              </span>
            </button>
            {copied && (
              <div className="col-span-2 mt-3 text-center text-sm text-green-600 font-semibold">Copied!</div>
            )}
          </div>
        ) : (
          <a
            href={getLocalizedExternalUrl() || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-center font-bold py-3.5 px-4 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl group-hover:scale-105"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              Get Deal
            </span>
          </a>
        )}

        {coupon.location && (
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="font-medium">{coupon.location}</span>
          </div>
        )}
      </div>
      <Toast message="Copied to clipboard" visible={copied} />
    </div>
  );
};
