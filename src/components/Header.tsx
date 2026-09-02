import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Heart, MapPin, User, Menu, X, ChevronDown } from 'lucide-react';
import { UserLocation } from '../types';

interface HeaderProps {
  currentLocation: UserLocation;
  onOpenModal: (type: 'location' | 'search' | 'cart' | 'favorites' | 'login' | 'becomeChef') => void;
  cartCount: number;
  favoritesCount: number;
  activeSection?: string;
  onNavigateSection: (sectionId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLocation,
  onOpenModal,
  cartCount,
  favoritesCount,
  onNavigateSection,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', sectionId: 'hero' },
    { label: 'Trending', sectionId: 'trending' },
    { label: 'Categories', sectionId: 'categories' },
    { label: 'Home Chefs', sectionId: 'chefs' },
    { label: 'Dishes', sectionId: 'dishes' },
    { label: 'How It Works', sectionId: 'how-it-works' },
    { label: 'FAQ', sectionId: 'faq' },
  ];

  const handleNavClick = (sectionId: string) => {
    onNavigateSection(sectionId);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-subtle py-3'
          : 'bg-white/70 backdrop-blur-sm border-b border-neutral-100 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo & Location Selector */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => handleNavClick('hero')}
            className="flex items-center gap-2.5 group text-left"
          >
            <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center text-white font-extrabold text-xl shadow-subtle group-hover:scale-105 transition-transform">
              A
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-wider text-black leading-tight">
                AURA
              </span>
              <span className="text-[10px] font-semibold tracking-widest text-neutral-500 uppercase">
                Home Kitchens
              </span>
            </div>
          </button>

          {/* Location Selector Chip */}
          <button
            onClick={() => onOpenModal('location')}
            className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-neutral-200 bg-neutral-50 hover:bg-white hover:border-black transition-all group max-w-xs text-left"
          >
            <MapPin className="w-4 h-4 text-black shrink-0 group-hover:animate-bounce" />
            <div className="flex flex-col text-xs leading-tight min-w-0">
              <span className="text-[10px] text-neutral-500 uppercase font-semibold">Deliver to</span>
              <span className="font-bold text-black truncate max-w-[140px]">
                {currentLocation.area}, {currentLocation.city}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0 group-hover:text-black transition-colors" />
          </button>
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => (
            <button
              key={link.sectionId}
              onClick={() => handleNavClick(link.sectionId)}
              className="text-sm font-semibold text-neutral-700 hover:text-black transition-colors relative py-1 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-black hover:after:w-full after:transition-all"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Location Chip */}
          <button
            onClick={() => onOpenModal('location')}
            className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-neutral-200 bg-neutral-50 text-xs font-semibold"
          >
            <MapPin className="w-3.5 h-3.5 text-black" />
            <span className="truncate max-w-[80px] sm:max-w-[120px]">{currentLocation.area}</span>
          </button>

          {/* Search Trigger */}
          <button
            onClick={() => onOpenModal('search')}
            className="p-2.5 text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-2xl border border-transparent hover:border-neutral-200 transition-all relative"
            title="Search dishes or chefs"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Favorites Trigger */}
          <button
            onClick={() => onOpenModal('favorites')}
            className="p-2.5 text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-2xl border border-transparent hover:border-neutral-200 transition-all relative"
            title="Saved Favorites"
            aria-label="Favorites"
          >
            <Heart className="w-5 h-5" />
            {favoritesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                {favoritesCount}
              </span>
            )}
          </button>

          {/* Cart Trigger */}
          <button
            onClick={() => onOpenModal('cart')}
            className="p-2.5 text-black bg-neutral-100 hover:bg-black hover:text-white rounded-2xl border border-neutral-200 hover:border-black transition-all relative group"
            title="Cart Drawer"
            aria-label="Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-black group-hover:bg-white text-white group-hover:text-black text-[10px] font-bold flex items-center justify-center border-2 border-white">
                {cartCount}
              </span>
            )}
          </button>

          {/* Login Button */}
          <button
            onClick={() => onOpenModal('login')}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-black text-white text-xs font-bold rounded-2xl hover:bg-neutral-800 transition-all shadow-subtle active:scale-95"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2.5 text-black hover:bg-neutral-100 rounded-2xl border border-neutral-200 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-neutral-200 px-6 py-6 space-y-4 animate-in slide-in-from-top duration-200 shadow-elevated">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <button
                key={link.sectionId}
                onClick={() => handleNavClick(link.sectionId)}
                className="text-left text-base font-bold text-black py-2 border-b border-neutral-100 hover:pl-2 transition-all"
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <button
              onClick={() => {
                onOpenModal('becomeChef');
                setMobileMenuOpen(false);
              }}
              className="w-full py-3 bg-neutral-100 hover:bg-neutral-200 text-black text-xs font-bold rounded-2xl transition-colors border border-neutral-300"
            >
              Partner as a Home Chef
            </button>
            <button
              onClick={() => {
                onOpenModal('login');
                setMobileMenuOpen(false);
              }}
              className="w-full py-3 bg-black text-white text-xs font-bold rounded-2xl shadow-subtle"
            >
              Sign In / Create Account
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
