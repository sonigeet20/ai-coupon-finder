import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BlogManagement } from '../components/admin/BlogManagement';
import { BrandManagement } from '../components/admin/BrandManagement';
import { APISettings } from '../components/admin/APISettings';
import { AIPromptsManagement } from '../components/admin/AIPromptsManagement';
import { CouponManagement } from '../components/admin/CouponManagement';
import { CacheManagement } from '../components/admin/CacheManagement';

type TabType = 'coupons' | 'blogs' | 'brands' | 'api' | 'prompts' | 'cache';

export const AdminPage = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('coupons');

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-12">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'coupons' as TabType, label: 'Coupons', icon: '🎟️' },
    { id: 'blogs' as TabType, label: 'Blogs', icon: '📝' },
    { id: 'brands' as TabType, label: 'Brands', icon: '🏢' },
    { id: 'cache' as TabType, label: 'Cache', icon: '💾' },
    { id: 'api' as TabType, label: 'API Keys', icon: '🔑' },
    { id: 'prompts' as TabType, label: 'AI Prompts', icon: '🤖' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your platform content and settings</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-2 p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'coupons' && <CouponManagement />}
            {activeTab === 'blogs' && <BlogManagement />}
            {activeTab === 'brands' && <BrandManagement />}
            {activeTab === 'cache' && <CacheManagement />}
            {activeTab === 'api' && <APISettings />}
            {activeTab === 'prompts' && <AIPromptsManagement />}
          </div>
        </div>
      </div>
    </div>
  );
};
