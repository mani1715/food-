import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminTab } from '../../types';
import {
  Package,
  ShoppingBag,
  MapPin,
  Star,
  Percent,
  Settings,
  Mail,
  UserCheck,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

// Sub-Tab Components
import { ProductsManagementTab } from '../../components/admin/ProductsManagementTab';
import { OrdersManagementTab } from '../../components/admin/OrdersManagementTab';
import { LocationsManagementTab } from '../../components/admin/LocationsManagementTab';
import { FeaturedManagementTab } from '../../components/admin/FeaturedManagementTab';
import { DiscountsManagementTab } from '../../components/admin/DiscountsManagementTab';
import { SettingsManagementTab } from '../../components/admin/SettingsManagementTab';
import { NewsletterManagementTab } from '../../components/admin/NewsletterManagementTab';
import { AdminProfileTab } from '../../components/admin/AdminProfileTab';
import { AdminLoginModal } from '../../components/admin/AdminLoginModal';

export const AdminDashboardPage: React.FC = () => {
  const {
    isAdminAuthenticated,
    logoutAdmin,
    products,
    orders,
    deliveryCities,
    citySuggestions,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [showLoginModal, setShowLoginModal] = useState(false);

  const pendingSuggestionsCount = citySuggestions.filter((s) => s.status === 'pending').length;

  const tabs = [
    { id: 'products', label: 'Product Catalog', icon: <Package className="w-4 h-4" /> },
    { id: 'orders', label: 'Orders & Fulfillment', icon: <ShoppingBag className="w-4 h-4" />, badge: orders.filter((o) => o.status === 'Active').length },
    { id: 'locations', label: 'Cities & Requests', icon: <MapPin className="w-4 h-4" />, badge: pendingSuggestionsCount > 0 ? `${pendingSuggestionsCount}` : undefined },
    { id: 'bestsellers', label: 'Featured & Festival', icon: <Star className="w-4 h-4" /> },
    { id: 'discounts', label: 'Discounts & Offers', icon: <Percent className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings & WhatsApp', icon: <Settings className="w-4 h-4" /> },
    { id: 'newsletter', label: 'Newsletter Broadcast', icon: <Mail className="w-4 h-4" /> },
    { id: 'profile', label: 'Profile & Security', icon: <UserCheck className="w-4 h-4" /> },
  ];

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-white text-black py-16 px-4 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center shadow-modal">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <div className="space-y-2 max-w-md">
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Restricted Access</span>
          <h1 className="text-3xl font-extrabold text-black tracking-tight">Admin Portal Authentication</h1>
          <p className="text-xs text-neutral-500">
            Please log in with store administrator credentials to manage products, orders, delivery locations, and settings.
          </p>
        </div>

        <button
          onClick={() => setShowLoginModal(true)}
          className="px-8 py-4 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center gap-2 shadow-subtle"
        >
          <span>Log In to Admin Portal</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        <AdminLoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-8">
      
      {/* Top Banner & Header */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center font-black text-xl shadow-subtle">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-black tracking-tight">Aura Admin Console</h1>
              <span className="text-[10px] font-bold bg-black text-white px-2.5 py-0.5 rounded-full uppercase">Master</span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">Control store catalog, fulfillments, discounts & customer requests.</p>
          </div>
        </div>

        {/* Header Quick Metrics */}
        <div className="flex items-center gap-4 text-xs font-mono border-t md:border-t-0 md:border-l border-neutral-200 pt-4 md:pt-0 md:pl-6">
          <div>
            <span className="text-[10px] text-neutral-400 font-sans block font-bold uppercase">Products</span>
            <span className="font-extrabold text-black text-sm">{products.length} Items</span>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 font-sans block font-bold uppercase">Active Orders</span>
            <span className="font-extrabold text-black text-sm">{orders.filter((o) => o.status === 'Active').length} Orders</span>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 font-sans block font-bold uppercase">Cities</span>
            <span className="font-extrabold text-black text-sm">{deliveryCities.length} Cities</span>
          </div>

          <button
            onClick={logoutAdmin}
            className="p-2.5 bg-white border border-neutral-200 hover:border-black text-black rounded-2xl transition-all ml-2"
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
          <span className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 block">
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
          {activeTab === 'products' && <ProductsManagementTab />}
          {activeTab === 'orders' && <OrdersManagementTab />}
          {activeTab === 'locations' && <LocationsManagementTab />}
          {activeTab === 'bestsellers' && <FeaturedManagementTab />}
          {activeTab === 'discounts' && <DiscountsManagementTab />}
          {activeTab === 'settings' && <SettingsManagementTab />}
          {activeTab === 'newsletter' && <NewsletterManagementTab />}
          {activeTab === 'profile' && <AdminProfileTab />}
        </div>

      </div>

    </div>
  );
};
