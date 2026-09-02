import React from 'react';
import { Home, Compass, Heart, ShoppingBag, User } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  cartCount: number;
  favoritesCount: number;
  onOpenModal: (type: 'cart' | 'favorites' | 'login' | 'search') => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  cartCount,
  favoritesCount,
  onOpenModal,
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-2 py-2 shadow-modal">
      <div className="flex items-center justify-around max-w-md mx-auto">
        
        {/* Home */}
        <button
          onClick={() => onSelectTab('hero')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'hero' ? 'text-black font-extrabold' : 'text-neutral-500 font-medium'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Home</span>
        </button>

        {/* Explore */}
        <button
          onClick={() => onSelectTab('categories')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'categories' ? 'text-black font-extrabold' : 'text-neutral-500 font-medium'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Explore</span>
        </button>

        {/* Favorites */}
        <button
          onClick={() => onOpenModal('favorites')}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-neutral-500 hover:text-black transition-all relative"
        >
          <div className="relative">
            <Heart className="w-5 h-5" />
            {favoritesCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-black text-white text-[9px] font-bold flex items-center justify-center">
                {favoritesCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Favorites</span>
        </button>

        {/* Cart */}
        <button
          onClick={() => onOpenModal('cart')}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-neutral-500 hover:text-black transition-all relative"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-black text-white text-[9px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Cart</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => onOpenModal('login')}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-neutral-500 hover:text-black transition-all"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Profile</span>
        </button>

      </div>
    </nav>
  );
};
