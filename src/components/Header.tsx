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
  const { cartItems, wishlistProductIds, headerAnnouncements } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  const activeAnnouncements =
    headerAnnouncements && headerAnnouncements.filter((a) => a.enabled).length > 0
      ? headerAnnouncements.filter((a) => a.enabled).map((a) => a.text)
      : [
          "Fast & reliable delivery within 3–4 days across India!",
          "Use Code AF05 & get 5% additional discount on your First Purchase",
          "Free Shipping All Over India on orders over ₹499",
          "100% Homemade, Zero Preservatives & Cold-Pressed Oils",
        ];

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
      
      {/* 1. TOP SCROLLING ANNOUNCEMENT TICKER (BLACK & WHITE MARQUEE) */}
      <div className="bg-black text-white py-2 px-4 text-xs font-bold tracking-wide overflow-hidden border-b border-neutral-800">
        <div className="animate-marquee items-center gap-8 text-neutral-200">
          {/* First Copy */}
          {activeAnnouncements.map((text, index) => (
            <React.Fragment key={`a1-${index}`}>
              <span className="flex items-center gap-2 whitespace-nowrap">
                <Zap className="w-3.5 h-3.5 text-white shrink-0 fill-white" />
                <span>{text}</span>
              </span>
            </React.Fragment>
          ))}
          {/* Duplicate Copy for Seamless Infinite Scrolling */}
          {activeAnnouncements.map((text, index) => (
            <React.Fragment key={`a2-${index}`}>
              <span className="flex items-center gap-2 whitespace-nowrap">
                <Zap className="w-3.5 h-3.5 text-white shrink-0 fill-white" />
                <span>{text}</span>
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 2. MAIN HEADER NAVIGATION BAR */}
      <div className="w-full max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-6 py-2.5 flex items-center justify-between gap-4">
        
        {/* Left Side: Extra Large Circular Brand Logo (Shifted to Far Left) */}
        <div className="flex items-center gap-2 sm:gap-3 -ml-1 sm:-ml-3 lg:-ml-4">
          {/* Mobile Burger Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-neutral-800 hover:text-black focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div onClick={() => navigate('/')} className="flex items-center cursor-pointer group shrink-0">
            {/* Responsive Circular Logo Emblem */}
            <div className="w-14 h-14 sm:w-20 sm:h-20 lg:w-28 lg:h-28 rounded-full overflow-hidden border-2 sm:border-3 border-black bg-black flex items-center justify-center shadow-modal group-hover:scale-105 transition-transform shrink-0 my-[-4px] sm:my-[-8px]">
              <img
                src="/aishu-logo.jpg"
                alt="Aishu Foods Logo"
                className="w-full h-full object-cover scale-[1.38] rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Center: Category Navigation Links with Dropdown Carets (Desktop) */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-extrabold text-neutral-900">
          {categoryMenus.map((menu) => {
            const hasSub = menu.subCategories && menu.subCategories.length > 0;
            const isActive = location.pathname + location.search === menu.path;

            return (
              <div key={menu.label} className="relative group">
                <button
                  onClick={() => navigate(menu.path)}
                  className={`flex items-center gap-1.5 py-2 hover:text-black transition-colors cursor-pointer whitespace-nowrap tracking-wider uppercase ${
                    isActive ? 'text-black font-black border-b-2 border-black' : ''
                  }`}
                >
                  <span>{menu.label}</span>
                  {hasSub && (
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-500 group-hover:text-black group-hover:rotate-180 transition-transform" />
                  )}
                </button>

                {/* Hover Dropdown Sub-Menu */}
                {hasSub && (
                  <div className="absolute top-full left-0 mt-0.5 w-56 bg-white border border-neutral-200 rounded-2xl shadow-modal opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-2 space-y-1 text-left">
                    {menu.subCategories?.map((sub) => (
                      <button
                        key={sub.label}
                        onClick={() => navigate(sub.path)}
                        className="w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold text-neutral-800 hover:bg-black hover:text-white transition-all cursor-pointer block"
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

        {/* Right Side: Action Icons (Search, Wishlist, Profile, Track, Cart) */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Search Icon */}
          <button
            onClick={onOpenSearch}
            className="p-2.5 text-black hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
            title="Search Store"
          >
            <Search className="w-6 h-6" />
          </button>

          {/* Wishlist Icon */}
          <button
            onClick={() => navigate('/wishlist')}
            className="relative p-2.5 text-black hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
            title="Wishlist"
          >
            <Heart className="w-6 h-6" />
            {wishlistProductIds.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black text-white text-[9px] font-bold flex items-center justify-center">
                {wishlistProductIds.length}
              </span>
            )}
          </button>

          {/* Profile / Account Icon */}
          <button
            onClick={() => navigate('/profile')}
            className="p-2.5 text-black hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
            title="Account Profile"
          >
            <User className="w-6 h-6" />
          </button>

          {/* Track Order Icon */}
          <button
            onClick={() => navigate('/track-order')}
            className="p-2.5 text-black hover:bg-neutral-100 rounded-full transition-colors cursor-pointer hidden sm:block"
            title="Track Order"
          >
            <Package className="w-6 h-6" />
          </button>

          {/* Cart Icon */}
          <button
            onClick={() => navigate('/cart')}
            className="relative p-2.5 text-black hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
            title="Shopping Cart"
          >
            <ShoppingBag className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black text-white text-[9px] font-bold flex items-center justify-center">
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

