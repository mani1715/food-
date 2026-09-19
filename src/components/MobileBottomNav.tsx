import React from 'react';
import { Home, Grid, Heart, ShoppingBag, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, wishlistProductIds } = useApp();

  const cartCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const path = location.pathname;

  const navItems = [
    { id: 'home', label: 'Home', path: '/', icon: <Home className="w-6 h-6 stroke-[2]" /> },
    { id: 'categories', label: 'Categories', path: '/categories', icon: <Grid className="w-6 h-6 stroke-[2]" /> },
    { id: 'wishlist', label: 'Wishlist', path: '/wishlist', icon: <Heart className="w-6 h-6 stroke-[2]" />, badge: wishlistProductIds.length },
    { id: 'cart', label: 'Cart', path: '/cart', icon: <ShoppingBag className="w-6 h-6 stroke-[2]" />, badge: cartCount },
    { id: 'profile', label: 'Profile', path: '/profile', icon: <User className="w-6 h-6 stroke-[2]" /> },
  ];

  // Hide bottom navigation on checkout page to prevent bar collision with checkout CTAs
  if (path === '/checkout') return null;

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom, 0px))' }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-neutral-200 pt-2 px-2 sm:px-4 lg:hidden shadow-modal"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = path === item.path || (item.path !== '/' && path.startsWith(item.path));
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              className={`relative flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2 py-1 rounded-2xl transition-all cursor-pointer select-none active:scale-95 ${
                isActive ? 'text-black font-black' : 'text-neutral-500 hover:text-black font-bold'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge !== undefined && item.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 bg-black text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center border-2 border-white shadow-sm leading-none">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[10px] tracking-tight leading-tight mt-0.5 ${isActive ? 'font-black text-black underline underline-offset-2' : 'font-bold'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
