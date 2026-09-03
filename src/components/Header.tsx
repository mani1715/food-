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
    { label: 'Categories', path: '/categories' },
    { label: 'Pickles', path: '/products?category=Pickles' },
    { label: 'Sweets', path: '/products?category=Sweets' },
    { label: 'Snacks', path: '/products?category=Snacks' },
    { label: 'Bakery', path: '/products?category=Bakery' },
    { label: 'Veg', path: '/products?dietary=Veg' },
    { label: 'Non-Veg', path: '/products?dietary=Non-Veg' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 transition-all">
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Brand Logo & Name */}
        <div onClick={() => navigate('/')} className="flex items-center gap-3 cursor-pointer group shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center font-extrabold text-lg tracking-tighter shadow-subtle group-hover:scale-105 transition-transform">
            A
          </div>
          <div>
            <span className="text-lg font-black text-black tracking-tight block leading-none">AURA</span>
            <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">Homemade Foods</span>
          </div>
        </div>

        {/* Center Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden lg:flex flex-1 max-w-sm relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onClick={() => onOpenSearch && onOpenSearch()}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pickles, sweets, snacks..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-neutral-200 text-xs font-medium focus:outline-none focus:border-black bg-neutral-50 transition-colors"
          />
        </form>

        {/* Right Nav Actions */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Search Trigger Button */}
          <button
            onClick={() => onOpenSearch ? onOpenSearch() : navigate('/products')}
            className="p-2.5 rounded-2xl border border-neutral-200 hover:border-black transition-all text-black lg:hidden cursor-pointer"
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

      {/* Primary Navigation Links (Desktop Row) */}
      <nav className="hidden md:block border-t border-neutral-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto no-scrollbar py-2 text-xs font-bold text-neutral-600">
          {navLinks.map((link) => {
            const isActive = location.pathname + location.search === link.path || (link.path === '/' && location.pathname === '/');
            return (
              <button
                key={link.label}
                onClick={() => navigate(link.path)}
                className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-black text-white shadow-subtle'
                    : link.isSpecial
                    ? 'bg-neutral-900 text-white font-extrabold hover:bg-black'
                    : 'hover:text-black hover:bg-neutral-100'
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
