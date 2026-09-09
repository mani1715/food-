import React, { useState } from 'react';
import { Search, Heart, ShoppingBag, User, Package, ChevronDown, Zap, Menu, X, Home, ShieldCheck } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onOpenSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, wishlistProductIds, headerAnnouncements, siteLogo, categories, headerSettings } = useApp();
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
    ...(categories || [])
      .filter((cat) => !(headerSettings?.disabledCategoryNames || []).includes(cat.name))
      .map((cat) => ({
        label: cat.name,
        path: `/products?category=${encodeURIComponent(cat.name)}`,
        subCategories: [
          { label: `All ${cat.name} Collection`, path: `/products?category=${encodeURIComponent(cat.name)}` },
        ],
      })),
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
      <div className="w-full max-w-[1400px] mx-auto px-2 sm:px-4 lg:px-6 py-2 flex items-center justify-between gap-4">
        
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Burger Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-neutral-800 hover:text-black focus:outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div onClick={() => navigate('/')} className="flex items-center cursor-pointer group shrink-0">
            {/* Dynamic Circular Store Logo */}
            <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden border-2 border-black bg-black flex items-center justify-center shadow-subtle group-hover:scale-105 transition-transform shrink-0">
              <img
                src={siteLogo || '/aishu-logo.jpg'}
                alt="Aishu Foods Logo"
                className="w-full h-full object-cover"
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
        <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0 ml-auto">
          
          {/* Search Icon */}
          {headerSettings?.showSearch !== false && (
            <button
              onClick={onOpenSearch}
              className="p-2 sm:p-2.5 text-black hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
              title="Search Store"
            >
              <Search className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          {/* Wishlist Icon */}
          {headerSettings?.showWishlist !== false && (
            <button
              onClick={() => navigate('/wishlist')}
              className="relative p-2 sm:p-2.5 text-black hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
              title="Wishlist"
            >
              <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
              {wishlistProductIds.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black text-white text-[9px] font-bold flex items-center justify-center">
                  {wishlistProductIds.length}
                </span>
              )}
            </button>
          )}

          {/* Profile / Account Icon */}
          {headerSettings?.showAccount !== false && (
            <button
              onClick={() => navigate('/profile')}
              className="p-2 sm:p-2.5 text-black hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
              title="Account Profile"
            >
              <User className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          {/* Track Order Icon */}
          {headerSettings?.showTrackOrder !== false && (
            <button
              onClick={() => navigate('/track-order')}
              className="p-2 sm:p-2.5 text-black hover:bg-neutral-100 rounded-full transition-colors cursor-pointer hidden sm:block"
              title="Track Order"
            >
              <Package className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          {/* Cart Icon */}
          {headerSettings?.showCart !== false && (
            <button
              onClick={() => navigate('/cart')}
              className="relative p-2 sm:p-2.5 text-black hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black text-white text-[9px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          )}

        </div>

      </div>

      {/* 3. MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-200 bg-white px-4 py-4 space-y-4 shadow-modal">
          
          {/* Top Home Shortcut Button */}
          <button
            onClick={() => {
              navigate('/');
              setMobileMenuOpen(false);
            }}
            className="w-full p-3 bg-black text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-subtle"
          >
            <Home className="w-4 h-4 text-white" />
            <span>🏠 STORE HOME</span>
          </button>

          <div className="space-y-3 border-t border-b border-neutral-100 py-3">
            {categoryMenus.map((menu) => (
              <div key={menu.label} className="space-y-1">
                <button
                  onClick={() => {
                    navigate(menu.path);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left font-extrabold text-sm text-neutral-900 py-1 flex items-center justify-between hover:text-black"
                >
                  <span>{menu.label}</span>
                  {menu.subCategories && <ChevronDown className="w-4 h-4 text-neutral-400" />}
                </button>
                {menu.subCategories && (
                  <div className="pl-4 space-y-1 border-l-2 border-neutral-100">
                    {menu.subCategories.map((sub) => (
                      <button
                        key={sub.label}
                        onClick={() => {
                          navigate(sub.path);
                          setMobileMenuOpen(false);
                        }}
                        className="block w-full text-left text-xs font-semibold text-neutral-600 py-1 hover:text-black"
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Shortcuts Bar */}
          <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-1">
            <button
              onClick={() => {
                navigate('/cart');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center gap-2 text-neutral-800"
            >
              <ShoppingBag className="w-4 h-4 text-black" />
              <span>Basket ({cartCount})</span>
            </button>

            <button
              onClick={() => {
                navigate('/wishlist');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center gap-2 text-neutral-800"
            >
              <Heart className="w-4 h-4 text-black" />
              <span>Wishlist ({wishlistProductIds.length})</span>
            </button>

            <button
              onClick={() => {
                navigate('/profile');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center gap-2 text-neutral-800"
            >
              <User className="w-4 h-4 text-black" />
              <span>My Profile</span>
            </button>

            <button
              onClick={() => {
                navigate('/track-order');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center gap-2 text-neutral-800"
            >
              <Package className="w-4 h-4 text-black" />
              <span>Track Order</span>
            </button>
          </div>

          <button
            onClick={() => {
              navigate('/admin');
              setMobileMenuOpen(false);
            }}
            className="w-full p-2.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-black" />
            <span>Admin Portal Login</span>
          </button>

        </div>
      )}

    </header>
  );
};

