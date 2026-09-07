import React, { useState } from 'react';
import { Search, Heart, ShoppingBag, User, Package, ChevronDown, Zap, Menu, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onOpenSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, wishlistProductIds } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  const categoryMenus = [
    {
      label: 'Pickles',
      path: '/products?category=Pickles',
      subCategories: [
        { label: 'Veg Pickles ●', path: '/products?category=Pickles&dietary=Veg' },
        { label: 'Non-Veg Pickles ▲', path: '/products?category=Pickles&dietary=Non-Veg' },
        { label: 'All Pickles Collection', path: '/products?category=Pickles' },
      ],
    },
    {
      label: 'Sweets',
      path: '/products?category=Sweets',
      subCategories: [
        { label: 'Pure Ghee Sweets 🍯', path: '/products?category=Sweets' },
        { label: 'Traditional Andhra Sweets 🍬', path: '/products?category=Sweets' },
        { label: 'All Sweets Collection', path: '/products?category=Sweets' },
      ],
    },
    {
      label: 'Snacks',
      path: '/products?category=Snacks',
      subCategories: [
        { label: 'Crispy Murukku & Savories 🥨', path: '/products?category=Snacks' },
        { label: 'Karam & Mixture 🌶️', path: '/products?category=Snacks' },
        { label: 'All Snacks Collection', path: '/products?category=Snacks' },
      ],
    },
    {
      label: 'Powders',
      path: '/products?category=Powders',
      subCategories: [
        { label: 'Idli & Dosa Podis 🌾', path: '/products?category=Powders' },
        { label: 'Rice Podis & Spices 🍚', path: '/products?category=Powders' },
        { label: 'All Powders Collection', path: '/products?category=Powders' },
      ],
    },
    {
      label: 'BEST SELLERS',
      path: '/products',
      subCategories: [
        { label: 'Top Rated Items ⭐', path: '/products' },
        { label: 'Grandma Specials 📜', path: '/products' },
      ],
    },
    {
      label: 'OFFERS & SPECIALS',
      path: '/products?filter=new-arrivals',
      isSpecial: true,
      subCategories: [
        { label: 'Use Code AF05 (5% OFF) 🎉', path: '/products' },
        { label: 'New Arrivals ✨', path: '/products?filter=new-arrivals' },
        { label: 'Festival Gift Hampers 🎁', path: '/products?category=Gift%20Boxes' },
      ],
    },
    {
      label: 'OUR PROCESS',
      path: '/our-process',
      subCategories: [
        { label: '5-Step Grandma Process 📜', path: '/our-process' },
        { label: 'Regional Farm Sourcing 📍', path: '/sourcing' },
        { label: '0% Preservative Guarantee 🛡️', path: '/quality-promise' },
      ],
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 transition-all shadow-subtle">
      
      {/* 1. TOP ANNOUNCEMENT BANNER */}
      <div className="bg-[#6B2D1D] text-white py-2 px-4 text-xs font-semibold tracking-wide text-center flex items-center justify-center overflow-hidden">
        <div className="flex items-center gap-4 sm:gap-6 whitespace-nowrap animate-pulse sm:animate-none">
          <span className="flex items-center gap-1.5">
            <span>Fast & reliable delivery within 3–4 days!</span>
          </span>
          <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />
          <span className="flex items-center gap-1.5 font-bold">
            <span>Use Code <strong className="text-amber-300 font-extrabold underline">AF05</strong> & get 5% additional discount on First Purchase</span>
          </span>
          <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0 hidden sm:inline" />
          <span className="hidden md:inline">Free Shipping All Over India</span>
        </div>
      </div>

      {/* 2. MAIN HEADER NAVIGATION BAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        
        {/* Left Side: Circular Brand Logo & Title */}
        <div className="flex items-center gap-3">
          {/* Mobile Burger Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-neutral-800 hover:text-black focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div onClick={() => navigate('/')} className="flex items-center gap-3 cursor-pointer group shrink-0">
            {/* Circular Logo Emblem */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-[#6B2D1D] bg-[#6B2D1D] flex items-center justify-center shadow-subtle group-hover:scale-105 transition-transform shrink-0 p-0.5">
              <img src="/aishu-logo.jpg" alt="Aishu Foods Logo" className="w-full h-full object-cover rounded-full" />
            </div>
            <div className="hidden sm:block">
              <span className="text-xl sm:text-2xl font-black text-black tracking-tight block leading-none font-serif">
                AISHU FOODS
              </span>
              <span className="text-[10px] font-extrabold tracking-widest text-neutral-500 uppercase block mt-1">
                Pure Homemade Flavors
              </span>
            </div>
          </div>
        </div>

        {/* Center: Category Navigation Links with Dropdown Carets (Desktop) */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-neutral-800">
          {categoryMenus.map((menu) => {
            const hasSub = menu.subCategories && menu.subCategories.length > 0;
            const isActive = location.pathname + location.search === menu.path;

            return (
              <div key={menu.label} className="relative group">
                <button
                  onClick={() => navigate(menu.path)}
                  className={`flex items-center gap-1.5 py-2 hover:text-[#6B2D1D] transition-colors cursor-pointer whitespace-nowrap tracking-wide uppercase ${
                    isActive ? 'text-[#6B2D1D] font-extrabold border-b-2 border-[#6B2D1D]' : ''
                  } ${menu.isSpecial ? 'text-[#6B2D1D] font-extrabold' : ''}`}
                >
                  <span>{menu.label}</span>
                  {hasSub && (
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-500 group-hover:text-[#6B2D1D] group-hover:rotate-180 transition-transform" />
                  )}
                </button>

                {/* Hover Dropdown Sub-Menu */}
                {hasSub && (
                  <div className="absolute top-full left-0 mt-0.5 w-56 bg-white border border-neutral-200 rounded-2xl shadow-modal opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-2 space-y-1 text-left">
                    {menu.subCategories?.map((sub) => (
                      <button
                        key={sub.label}
                        onClick={() => navigate(sub.path)}
                        className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold text-neutral-800 hover:bg-neutral-100 hover:text-[#6B2D1D] transition-all cursor-pointer block"
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right Side: Action Icons (Search, Wishlist, Profile, Cart, Track) */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Search Icon */}
          <button
            onClick={onOpenSearch}
            className="p-2 text-neutral-800 hover:text-[#6B2D1D] transition-colors cursor-pointer"
            title="Search Store"
          >
            <Search className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Wishlist Icon */}
          <button
            onClick={() => navigate('/wishlist')}
            className="relative p-2 text-neutral-800 hover:text-[#6B2D1D] transition-colors cursor-pointer"
            title="Wishlist"
          >
            <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
            {wishlistProductIds.length > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-[#6B2D1D] text-white text-[9px] font-bold flex items-center justify-center">
                {wishlistProductIds.length}
              </span>
            )}
          </button>

          {/* Profile / Account Icon */}
          <button
            onClick={() => navigate('/profile')}
            className="p-2 text-neutral-800 hover:text-[#6B2D1D] transition-colors cursor-pointer"
            title="Account Profile"
          >
            <User className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Track Order Icon */}
          <button
            onClick={() => navigate('/track-order')}
            className="p-2 text-neutral-800 hover:text-[#6B2D1D] transition-colors cursor-pointer hidden sm:block"
            title="Track Order"
          >
            <Package className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Cart Icon */}
          <button
            onClick={() => navigate('/cart')}
            className="relative p-2 text-neutral-800 hover:text-[#6B2D1D] transition-colors cursor-pointer"
            title="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-[#6B2D1D] text-white text-[9px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

        </div>

      </div>

      {/* 3. MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-200 bg-white px-4 py-4 space-y-3">
          {categoryMenus.map((menu) => (
            <div key={menu.label} className="space-y-1 border-b border-neutral-100 pb-2">
              <button
                onClick={() => {
                  navigate(menu.path);
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left font-bold text-sm text-neutral-900 py-1 flex items-center justify-between"
              >
                <span>{menu.label}</span>
                {menu.subCategories && <ChevronDown className="w-4 h-4 text-neutral-400" />}
              </button>
              {menu.subCategories && (
                <div className="pl-4 space-y-1">
                  {menu.subCategories.map((sub) => (
                    <button
                      key={sub.label}
                      onClick={() => {
                        navigate(sub.path);
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left text-xs font-semibold text-neutral-600 py-1"
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="pt-2 flex items-center gap-4">
            <button
              onClick={() => {
                navigate('/track-order');
                setMobileMenuOpen(false);
              }}
              className="text-xs font-bold text-neutral-800 flex items-center gap-1.5 py-1"
            >
              <Package className="w-4 h-4" />
              <span>Track Order</span>
            </button>
          </div>
        </div>
      )}

    </header>
  );
};

