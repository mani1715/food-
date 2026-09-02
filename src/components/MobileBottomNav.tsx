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
    { id: 'home', label: 'Home', path: '/', icon: <Home className="w-5 h-5" /> },
    { id: 'categories', label: 'Categories', path: '/categories', icon: <Grid className="w-5 h-5" /> },
    { id: 'wishlist', label: 'Wishlist', path: '/wishlist', icon: <Heart className="w-5 h-5" />, badge: wishlistProductIds.length },
    { id: 'cart', label: 'Cart', path: '/cart', icon: <ShoppingBag className="w-5 h-5" />, badge: cartCount },
    { id: 'profile', label: 'Profile', path: '/profile', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-neutral-200 py-2 px-4 lg:hidden shadow-modal">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = path === item.path || (item.path !== '/' && path.startsWith(item.path));
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
                isActive ? 'text-black font-extrabold' : 'text-neutral-400 hover:text-black font-medium'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 bg-black text-white text-[9px] font-extrabold rounded-full w-4 h-4 flex items-center justify-center border border-white">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
