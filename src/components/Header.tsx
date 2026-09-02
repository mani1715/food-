import React, { useState } from 'react';
import { Search, Heart, ShoppingBag, User, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { cartItems, wishlistProductIds, currentLocation } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const cartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Name */}
        <div onClick={() => navigate('/')} className="flex items-center gap-3 cursor-pointer group">
          <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center font-extrabold text-lg tracking-tighter shadow-subtle group-hover:scale-105 transition-transform">
            A
          </div>
          <div>
            <span className="text-lg font-black text-black tracking-tight block leading-none">AURA</span>
            <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">Homemade Foods</span>
          </div>
        </div>

        {/* Center Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pickles, sweets, snacks, gift hampers..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:border-black bg-neutral-50 transition-colors"
          />
        </form>

        {/* Right Nav Options */}
        <div className="flex items-center gap-3">
          
          {/* Location Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-neutral-200 text-xs text-neutral-600 font-medium">
            <MapPin className="w-3.5 h-3.5 text-black" />
            <span className="font-bold text-black">{currentLocation.city}</span>
          </div>

          {/* Wishlist Icon */}
          <button
            onClick={() => navigate('/wishlist')}
            className="relative p-2.5 rounded-2xl border border-neutral-200 hover:border-black transition-all group"
            title="Wishlist"
          >
            <Heart className="w-5 h-5 text-black group-hover:scale-110 transition-transform" />
            {wishlistProductIds.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                {wishlistProductIds.length}
              </span>
            )}
          </button>

          {/* Cart Icon */}
          <button
            onClick={() => navigate('/cart')}
            className="relative p-2.5 rounded-2xl bg-black text-white hover:bg-neutral-800 transition-all flex items-center gap-2 px-4 shadow-subtle"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-xs font-bold hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-black text-[10px] font-extrabold flex items-center justify-center ml-1">
                {cartCount}
              </span>
            )}
          </button>

          {/* Profile Icon */}
          <button
            onClick={() => navigate('/profile')}
            className="p-2.5 rounded-2xl border border-neutral-200 hover:border-black transition-all"
            title="Account Profile"
          >
            <User className="w-5 h-5 text-black" />
          </button>
        </div>

      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pickles, sweets, hampers..."
            className="w-full pl-11 pr-4 py-2 rounded-xl border border-neutral-200 text-xs font-medium focus:outline-none focus:border-black bg-neutral-50"
          />
        </form>
      </div>
    </header>
  );
};
