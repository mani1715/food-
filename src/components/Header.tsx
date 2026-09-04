import React, { useState } from 'react';
import { Search, Heart, ShoppingBag, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onOpenSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, wishlistProductIds } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const cartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    } else if (onOpenSearch) {
      onOpenSearch();
    }
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'New Arrivals ✨', path: '/products?filter=new-arrivals', isSpecial: true },
    { label: 'Pickles', path: '/products?category=Pickles' },
    { label: 'Sweets', path: '/products?category=Sweets' },
    { label: 'Snacks', path: '/products?category=Snacks' },
    { label: 'Bakery', path: '/products?category=Bakery' },
    { label: 'Veg ●', path: '/products?dietary=Veg' },
    { label: 'Non-Veg ▲', path: '/products?dietary=Non-Veg' },
    { label: 'All Categories', path: '/categories' },
  ];

  const handleProcessClick = (anchorId: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(anchorId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(anchorId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 transition-all shadow-subtle">
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Left Side Group: Logo + Search Bar */}
        <div className="flex items-center gap-4 shrink-0 max-w-md w-full md:w-auto">
          {/* Brand Logo */}
          <div onClick={() => navigate('/')} className="flex items-center gap-2.5 cursor-pointer group shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center font-black text-lg tracking-tighter shadow-subtle group-hover:scale-105 transition-transform">
              A
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-black text-black tracking-tight block leading-none">AURA</span>
              <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">Homemade Foods</span>
            </div>
          </div>

          {/* Search Bar Moved to the Left (Right Next to Logo) */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex max-w-[220px] lg:max-w-[260px] w-full relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onClick={() => onOpenSearch && onOpenSearch()}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pickles, sweets..."
              className="w-full pl-10 pr-3 py-2 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:border-black bg-neutral-50 transition-colors"
            />
          </form>
        </div>

        {/* Center/Right Group: Process & Quality Options (To the Right of Search Bar) */}
        <div className="hidden md:flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => handleProcessClick('our-process')}
            className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-white border border-neutral-200 text-black hover:border-black hover:bg-black hover:text-white transition-all whitespace-nowrap cursor-pointer shadow-subtle flex items-center gap-1"
          >
            <span>Our Process</span>
            <span>📜</span>
          </button>

          <button
            onClick={() => handleProcessClick('sourcing')}
            className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-white border border-neutral-200 text-black hover:border-black hover:bg-black hover:text-white transition-all whitespace-nowrap cursor-pointer shadow-subtle flex items-center gap-1"
          >
            <span>Regional Sourcing</span>
            <span>🗺️</span>
          </button>

          <button
            onClick={() => handleProcessClick('quality')}
            className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-white border border-neutral-200 text-black hover:border-black hover:bg-black hover:text-white transition-all whitespace-nowrap cursor-pointer shadow-subtle flex items-center gap-1"
          >
            <span>Quality Promise</span>
            <span>🛡️</span>
          </button>
        </div>

        {/* Rightmost Actions (Search Mobile, Wishlist, Cart, Profile) */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* Search Trigger Button for Mobile */}
          <button
            onClick={() => onOpenSearch ? onOpenSearch() : navigate('/products')}
            className="p-2.5 rounded-2xl border border-neutral-200 hover:border-black transition-all text-black md:hidden cursor-pointer"
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Wishlist Icon */}
          <button
            onClick={() => navigate('/wishlist')}
            className="relative p-2.5 rounded-2xl border border-neutral-200 hover:border-black transition-all group cursor-pointer"
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
            className="relative p-2.5 rounded-2xl bg-black text-white hover:bg-neutral-800 transition-all flex items-center gap-2 px-4 shadow-subtle cursor-pointer"
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
            className="p-2.5 rounded-2xl border border-neutral-200 hover:border-black transition-all cursor-pointer"
            title="Account Profile"
          >
            <User className="w-5 h-5 text-black" />
          </button>
        </div>

      </div>

      {/* Second Line: Clean Food Category Navigation Links */}
      <nav className="hidden md:block border-t border-neutral-100 bg-neutral-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar py-2 text-xs font-extrabold">
          {navLinks.map((link) => {
            const isActive = location.pathname + location.search === link.path || (link.path === '/' && location.pathname === '/');
            return (
              <button
                key={link.label}
                onClick={() => navigate(link.path)}
                className={`px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer border ${
                  isActive
                    ? 'bg-black text-white border-black shadow-subtle'
                    : link.isSpecial
                    ? 'bg-neutral-900 text-white border-black hover:bg-black'
                    : 'bg-white text-neutral-800 border-neutral-200 hover:border-black hover:bg-black hover:text-white'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </div>
      </nav>

    </header>
  );
};
