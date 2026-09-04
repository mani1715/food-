import React from 'react';
import { Search, Heart, ShoppingBag, User, Package, BookOpen, MapPin, ShieldCheck } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

interface HeaderProps {
  onOpenSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, wishlistProductIds } = useApp();

  const cartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'New Arrivals ✨', path: '/products?filter=new-arrivals', isSpecial: true },
    { label: 'Pickles 🌶️', path: '/products?category=Pickles' },
    { label: 'Sweets 🍬', path: '/products?category=Sweets' },
    { label: 'Snacks 🥨', path: '/products?category=Snacks' },
    { label: 'Powders / Podis 🌾', path: '/products?category=Powders' },
    { label: 'Veg ●', path: '/products?dietary=Veg' },
    { label: 'Non-Veg ▲', path: '/products?dietary=Non-Veg' },
    { label: 'All Categories', path: '/categories' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 transition-all shadow-subtle">
      
      {/* Main Top Header Line */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        
        {/* Left Side: Brand Logo with Circular Chef Hat Icon */}
        <div onClick={() => navigate('/')} className="flex items-center gap-3.5 cursor-pointer group shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-black bg-black flex items-center justify-center shadow-subtle group-hover:scale-105 transition-transform shrink-0">
            <img src="/aishu-logo.jpg" alt="Aishu Foods Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-black tracking-tight block leading-none font-serif">
              AISHU FOODS
            </span>
            <span className="text-[11px] sm:text-xs font-extrabold tracking-widest text-neutral-500 uppercase block mt-1">
              Pure Love & Handcrafted Foods
            </span>
          </div>
        </div>

        {/* Center Process Buttons (Desktop & Laptop) */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/our-process')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer border shadow-subtle flex items-center gap-1.5 ${
              location.pathname === '/our-process'
                ? 'bg-black text-white border-black'
                : 'bg-white text-neutral-800 border-neutral-200 hover:border-black hover:bg-black hover:text-white'
            }`}
          >
            <span>How We Do</span>
            <span>📜</span>
          </button>

          <button
            onClick={() => navigate('/sourcing')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer border shadow-subtle flex items-center gap-1.5 ${
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
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all cursor-pointer border shadow-subtle flex items-center gap-1.5 ${
              location.pathname === '/quality-promise'
                ? 'bg-black text-white border-black'
                : 'bg-white text-neutral-800 border-neutral-200 hover:border-black hover:bg-black hover:text-white'
            }`}
          >
            <span>Quality Promise</span>
            <span>🛡️</span>
          </button>
        </div>

        {/* Rightmost Action Symbol Icons (Search Symbol, Wishlist, Cart, Track, Profile) */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Compact Symbol Search Button (Not big text box) */}
          <button
            onClick={onOpenSearch}
            className="p-2.5 rounded-2xl border border-neutral-200 hover:border-black hover:bg-black hover:text-white text-black transition-all flex items-center gap-1.5 cursor-pointer shadow-subtle group"
            title="Search Store"
          >
            <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-extrabold hidden md:inline">Search</span>
          </button>

          {/* Wishlist Symbol Icon */}
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
            title="Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-xs font-extrabold hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-black text-[9px] font-black flex items-center justify-center ml-0.5">
                {cartCount}
              </span>
            )}
          </button>

          {/* Track Order Icon Button */}
          <button
            onClick={() => navigate('/track-order')}
            className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-1.5 px-3.5 shadow-subtle ${
              location.pathname === '/track-order'
                ? 'bg-black text-white border-black'
                : 'bg-neutral-100 hover:bg-black hover:text-white border-neutral-300 text-black font-extrabold'
            }`}
            title="Track Order Status"
          >
            <Package className="w-4 h-4" />
            <span className="text-xs font-bold hidden sm:inline">Track</span>
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

      {/* Category Horizontal Navigation Line */}
      <nav className="border-t border-neutral-100 bg-neutral-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto no-scrollbar py-2 text-xs font-extrabold">
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
