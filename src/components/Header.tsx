import React, { useState } from 'react';
import { Search, Heart, ShoppingBag, User, Package } from 'lucide-react';
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

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 transition-all shadow-subtle">
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Left Side Group: Logo + Bigger Search Bar */}
        <div className="flex items-center gap-3 shrink-0 flex-1 max-w-lg">
          {/* Brand Logo */}
          <div onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer group shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center font-black text-lg tracking-tighter shadow-subtle group-hover:scale-105 transition-transform">
              A
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-black text-black tracking-tight block leading-none">AURA</span>
              <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">Homemade Foods</span>
            </div>
          </div>

          {/* Bigger Search Bar (Left Aligned Next to Logo) */}
          <form onSubmit={handleSearchSubmit} className="flex flex-1 max-w-xs sm:max-w-sm lg:max-w-md w-full relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onClick={() => onOpenSearch && onOpenSearch()}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pickles, sweets, snacks..."
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-neutral-200 text-xs font-bold focus:outline-none focus:border-black bg-neutral-50 transition-colors shadow-inner"
            />
          </form>
        </div>

        {/* Center/Right Group: Compact Process Option Buttons (Right of Search Bar) */}
        <div className="hidden lg:flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => navigate('/our-process')}
            className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all whitespace-nowrap cursor-pointer border shadow-subtle flex items-center gap-1 ${
              location.pathname === '/our-process'
                ? 'bg-black text-white border-black'
                : 'bg-white text-neutral-800 border-neutral-200 hover:border-black hover:bg-black hover:text-white'
            }`}
          >
            <span>Our Process</span>
            <span>📜</span>
          </button>

          <button
            onClick={() => navigate('/sourcing')}
            className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all whitespace-nowrap cursor-pointer border shadow-subtle flex items-center gap-1 ${
              location.pathname === '/sourcing'
                ? 'bg-black text-white border-black'
                : 'bg-white text-neutral-800 border-neutral-200 hover:border-black hover:bg-black hover:text-white'
            }`}
          >
            <span>Regional Sourcing</span>
            <span>🗺️</span>
          </button>

          <button
            onClick={() => navigate('/quality-promise')}
            className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all whitespace-nowrap cursor-pointer border shadow-subtle flex items-center gap-1 ${
              location.pathname === '/quality-promise'
                ? 'bg-black text-white border-black'
                : 'bg-white text-neutral-800 border-neutral-200 hover:border-black hover:bg-black hover:text-white'
            }`}
          >
            <span>Quality Promise</span>
            <span>🛡️</span>
          </button>
        </div>

        {/* Rightmost Actions (Wishlist, Cart, Track Order, Profile) */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Wishlist Icon */}
          <button
            onClick={() => navigate('/wishlist')}
            className="relative p-2.5 rounded-2xl border border-neutral-200 hover:border-black transition-all group cursor-pointer"
            title="Wishlist"
          >
            <Heart className="w-4 h-4 text-black group-hover:scale-110 transition-transform" />
            {wishlistProductIds.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-black text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
                {wishlistProductIds.length}
              </span>
            )}
          </button>

          {/* Cart Icon */}
          <button
            onClick={() => navigate('/cart')}
            className="relative p-2.5 rounded-2xl bg-black text-white hover:bg-neutral-800 transition-all flex items-center gap-2 px-3.5 shadow-subtle cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-xs font-bold hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-black text-[9px] font-extrabold flex items-center justify-center ml-0.5">
                {cartCount}
              </span>
            )}
          </button>

          {/* Track Order Icon Button (Side of Cart) */}
          <button
            onClick={() => navigate('/track-order')}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-1.5 px-3.5 shadow-subtle ${
              location.pathname === '/track-order'
                ? 'bg-black text-white border-black'
                : 'bg-neutral-100 hover:bg-black hover:text-white border-neutral-300 text-black font-extrabold'
            }`}
            title="Track Your Order"
          >
            <Package className="w-4 h-4" />
            <span className="text-xs font-bold hidden sm:inline">Track Order</span>
          </button>

          {/* Profile Icon */}
          <button
            onClick={() => navigate('/profile')}
            className="p-2.5 rounded-2xl border border-neutral-200 hover:border-black transition-all cursor-pointer"
            title="Account Profile"
          >
            <User className="w-4 h-4 text-black" />
          </button>
        </div>

      </div>

      {/* Second Line: Mobile & Desktop Clean Food Category Navigation Links */}
      <nav className="border-t border-neutral-100 bg-neutral-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto no-scrollbar py-2 text-xs font-extrabold">
          {navLinks.map((link) => {
            const isActive = location.pathname + location.search === link.path || (link.path === '/' && location.pathname === '/');
            return (
              <button
                key={link.label}
                onClick={() => navigate(link.path)}
                className={`px-3 py-1.5 rounded-full transition-all whitespace-nowrap cursor-pointer border ${
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
