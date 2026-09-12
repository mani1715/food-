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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-neutral-200 py-2.5 px-3 lg:hidden shadow-modal">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = path === item.path || (item.path !== '/' && path.startsWith(item.path));
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center gap-1 py-1 px-2.5 rounded-2xl transition-all cursor-pointer ${
                isActive ? 'text-black font-black scale-105' : 'text-neutral-500 hover:text-black font-bold'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2.5 bg-black text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center border-2 border-white shadow-sm leading-none">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[11px] font-bold tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
