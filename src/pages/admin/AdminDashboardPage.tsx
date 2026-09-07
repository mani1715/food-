import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AdminTab } from '../../types';
import {
  Package,
  ShoppingBag,
  Star,
  Percent,
  Settings,
  UserCheck,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  BarChart3,
  Bell,
  Image as ImageIcon,
  Home,
  ArrowLeft,
  Store,
} from 'lucide-react';

// Sub-Tab Components
import { AnalyticsManagementTab } from '../../components/admin/AnalyticsManagementTab';
import { ProductsManagementTab } from '../../components/admin/ProductsManagementTab';
import { NotificationsManagementTab } from '../../components/admin/NotificationsManagementTab';
import { OrdersManagementTab } from '../../components/admin/OrdersManagementTab';
import { BannersManagementTab } from '../../components/admin/BannersManagementTab';
import { FeaturedManagementTab } from '../../components/admin/FeaturedManagementTab';
import { DiscountsManagementTab } from '../../components/admin/DiscountsManagementTab';
import { SettingsManagementTab } from '../../components/admin/SettingsManagementTab';
import { AdminProfileTab } from '../../components/admin/AdminProfileTab';
import { AdminLoginModal } from '../../components/admin/AdminLoginModal';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    isAdminAuthenticated,
    logoutAdmin,
    products,
    orders,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [showLoginModal, setShowLoginModal] = useState(false);

  const alertStockCount = products.filter((p) => (p.inventoryCount ?? 100) < 10 || p.outOfStock).length;

  const tabs = [
    { id: 'analytics', label: 'Analytics & Insights', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications & Stock', icon: <Bell className="w-4 h-4" />, badge: alertStockCount > 0 ? `${alertStockCount}` : undefined },
    { id: 'products', label: 'Product Catalog', icon: <Package className="w-4 h-4" /> },
    { id: 'orders', label: 'Orders & Fulfillment', icon: <ShoppingBag className="w-4 h-4" />, badge: orders.filter((o) => o.status === 'Active').length },
    { id: 'banners', label: 'Banners & Header Text', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'bestsellers', label: 'Featured & Festival', icon: <Star className="w-4 h-4" /> },
    { id: 'discounts', label: 'Discounts & Offers', icon: <Percent className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings & WhatsApp', icon: <Settings className="w-4 h-4" /> },
    { id: 'profile', label: 'Profile & Security', icon: <UserCheck className="w-4 h-4" /> },
  ];

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 text-black flex flex-col justify-between">
        
        {/* Top Navbar with Clickable Logo to return Home */}
        <div className="bg-white border-b border-neutral-200 py-3.5 px-4 sm:px-8 flex items-center justify-between shadow-subtle">
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer group"
            title="Click to return to Store Homepage"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-black bg-black flex items-center justify-center shadow-subtle group-hover:scale-105 transition-transform">
              <img src="/aishu-logo.jpg" alt="Aishu Foods Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="text-base font-extrabold text-black tracking-tight group-hover:text-neutral-700 transition-colors">
                AISHU FOODS
              </span>
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Store Homepage ↗</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-neutral-100 hover:bg-black hover:text-white text-black text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-neutral-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Store Homepage</span>
          </button>
        </div>

        {/* Restricted Access Login Center Card */}
        <div className="py-16 px-4 flex flex-col items-center justify-center text-center space-y-6 max-w-md mx-auto">
          {/* Clickable Brand Emblem */}
          <div
            onClick={() => navigate('/')}
            className="w-24 h-24 rounded-full border-4 border-black overflow-hidden shadow-modal cursor-pointer hover:scale-105 transition-transform relative group"
            title="Click to visit Store Homepage"
          >
            <img src="/aishu-logo.jpg" alt="Aishu Foods Logo" className="w-full h-full object-cover" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 bg-neutral-200/60 px-3 py-1 rounded-full">
              Restricted Access
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">Admin Portal Authentication</h1>
            <p className="text-xs text-neutral-500">
              Please log in with store administrator credentials to manage products, orders, banners, and settings.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex-1 w-full py-3.5 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-subtle cursor-pointer"
            >
              <span>Log In to Admin Portal</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/')}
              className="flex-1 w-full py-3.5 bg-white border border-neutral-300 text-black text-xs font-bold rounded-2xl hover:bg-neutral-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4 text-neutral-500" />
              <span>Go to Store Homepage</span>
            </button>
          </div>

          <AdminLoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
          />
        </div>

        {/* Footer */}
        <div className="py-4 text-center border-t border-neutral-200 text-[10px] text-neutral-400 font-medium">
          AISHU FOODS Admin Portal • <span onClick={() => navigate('/')} className="underline cursor-pointer hover:text-black">Visit Customer Homepage</span>
        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-8">
      
      {/* Top Banner & Header */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Clickable Logo & Brand Title leading to Homepage */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-4 cursor-pointer group"
          title="Click to visit Store Customer Homepage"
        >
          <div className="w-14 h-14 rounded-2xl overflow-hidden border border-black bg-black flex items-center justify-center font-black text-xl shadow-subtle group-hover:scale-105 transition-transform shrink-0">
            <img src="/aishu-logo.jpg" alt="Aishu Foods Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-black tracking-tight group-hover:underline">
                Aishu Foods Admin Portal
              </h1>
              <span className="text-[10px] font-bold bg-black text-white px-2.5 py-0.5 rounded-full uppercase">Master</span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1 group-hover:text-black transition-colors">
              <Home className="w-3 h-3 text-neutral-400 group-hover:text-black" />
              <span>Control store catalog, fulfillments & settings • <span className="font-bold underline text-black">Click logo to visit Store Homepage ↗</span></span>
            </p>
          </div>
        </div>

        {/* Header Quick Metrics & Navigation Actions */}
        <div className="flex items-center gap-4 text-xs font-mono border-t md:border-t-0 md:border-l border-neutral-200 pt-4 md:pt-0 md:pl-6">
          <div>
            <span className="text-[10px] text-neutral-400 font-sans block font-bold uppercase">Products</span>
            <span className="font-extrabold text-black text-sm">{products.length} Items</span>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 font-sans block font-bold uppercase">Active Orders</span>
            <span className="font-extrabold text-black text-sm">{orders.filter((o) => o.status === 'Active').length} Orders</span>
          </div>

          {/* Go to Store Homepage Button */}
          <button
            onClick={() => navigate('/')}
            className="px-3 py-2 bg-black text-white hover:bg-neutral-800 text-xs font-bold rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ml-2 font-sans"
            title="Go to Customer Store Homepage"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Store Homepage</span>
          </button>

          {/* Log Out Admin Button */}
          <button
            onClick={logoutAdmin}
            className="p-2.5 bg-white border border-neutral-200 hover:border-black hover:bg-rose-50 hover:text-rose-600 text-black rounded-2xl transition-all"
            title="Log Out Admin"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Admin Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Sidebar Navigation */}
        <div className="lg:col-span-3 space-y-1 bg-neutral-50 p-2.5 rounded-3xl border border-neutral-200 shadow-subtle sticky top-24">
          
          {/* Quick Home Store Link */}
          <button
            onClick={() => navigate('/')}
            className="w-full p-3 mb-2 rounded-2xl text-xs font-extrabold bg-white border border-neutral-200 text-black hover:bg-black hover:text-white transition-all flex items-center justify-between shadow-subtle group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Home className="w-4 h-4 text-neutral-600 group-hover:text-white transition-colors" />
              <span>Back to Customer Store</span>
            </div>
            <ArrowLeft className="w-3.5 h-3.5 rotate-180 text-neutral-400 group-hover:text-white transition-colors" />
          </button>

          <span className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 block border-t border-neutral-200 pt-2">
            Navigation Menu
          </span>

          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`w-full p-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-between group ${
                  isActive
                    ? 'bg-black text-white shadow-subtle'
                    : 'text-neutral-700 hover:bg-neutral-200/80 hover:text-black'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {tab.icon}
                  <span>{tab.label}</span>
                </div>

                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white text-black' : 'bg-neutral-200 text-black'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panel */}
        <div className="lg:col-span-9 min-h-[500px]">
          {activeTab === 'analytics' && <AnalyticsManagementTab />}
          {activeTab === 'notifications' && <NotificationsManagementTab />}
          {activeTab === 'products' && <ProductsManagementTab />}
          {activeTab === 'orders' && <OrdersManagementTab />}
          {activeTab === 'banners' && <BannersManagementTab />}
          {activeTab === 'bestsellers' && <FeaturedManagementTab />}
          {activeTab === 'discounts' && <DiscountsManagementTab />}
          {activeTab === 'settings' && <SettingsManagementTab />}
          {activeTab === 'profile' && <AdminProfileTab />}
        </div>

      </div>

    </div>
  );
};
