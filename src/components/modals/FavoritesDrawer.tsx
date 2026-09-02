import React, { useState } from 'react';
import { Dish, Chef } from '../../types';
import { EmptyState } from '../EmptyState';
import { X, Heart, Plus, ArrowRight, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  favoriteDishes: Dish[];
  favoriteChefs: Chef[];
  onToggleFavoriteDish: (dishId: string) => void;
  onToggleFavoriteChef: (chefId: string) => void;
  onAddToCart: (dish: Dish) => void;
  onViewChefMenu: (chef: Chef) => void;
}

export const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({
  isOpen,
  onClose,
  favoriteDishes,
  favoriteChefs,
  onToggleFavoriteDish,
  onToggleFavoriteChef,
  onAddToCart,
  onViewChefMenu,
}) => {
  const [activeTab, setActiveTab] = useState<'dishes' | 'chefs'>('dishes');

  if (!isOpen) return null;

  const totalFavorites = favoriteDishes.length + favoriteChefs.length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="bg-white w-full max-w-md h-full shadow-modal flex flex-col justify-between relative text-left border-l border-neutral-200"
        >
          {/* Header */}
          <div className="p-6 border-b border-neutral-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-extrabold text-black tracking-tight">Saved Favorites</h3>
              <span className="text-xs bg-black text-white font-mono px-2.5 py-0.5 rounded-full">
                {totalFavorites}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Segmented Control */}
          <div className="p-4 border-b border-neutral-100 flex items-center gap-2 bg-neutral-50">
            <button
              onClick={() => setActiveTab('dishes')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'dishes'
                  ? 'bg-black text-white shadow-subtle'
                  : 'bg-white text-neutral-600 border border-neutral-200'
              }`}
            >
              Dishes ({favoriteDishes.length})
            </button>
            <button
              onClick={() => setActiveTab('chefs')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'chefs'
                  ? 'bg-black text-white shadow-subtle'
                  : 'bg-white text-neutral-600 border border-neutral-200'
              }`}
            >
              Home Chefs ({favoriteChefs.length})
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {activeTab === 'dishes' && (
              favoriteDishes.length === 0 ? (
                <EmptyState
                  type="favorites"
                  title="No Saved Dishes"
                  description="Tap the heart icon on any dish card to bookmark your favorite home meals."
                  onAction={onClose}
                  actionLabel="Explore Dishes"
                />
              ) : (
                <div className="space-y-4">
                  {favoriteDishes.map((dish) => (
                    <div
                      key={dish.id}
                      className="p-4 rounded-2xl border border-neutral-200 bg-white flex gap-4 items-center justify-between shadow-subtle hover:border-black transition-colors"
                    >
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-16 h-16 rounded-xl object-cover border border-neutral-200 shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-black truncate">{dish.name}</h4>
                        <p className="text-xs text-neutral-500 font-medium">{dish.chefName}</p>
                        <p className="text-sm font-extrabold text-black mt-1">${dish.price.toFixed(2)}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onToggleFavoriteDish(dish.id)}
                          className="p-2 text-rose-500 hover:text-neutral-400 transition-colors"
                          title="Remove from favorites"
                        >
                          <Heart className="w-5 h-5 fill-rose-500" />
                        </button>
                        <button
                          onClick={() => onAddToCart(dish)}
                          className="p-2 bg-black text-white rounded-xl hover:bg-neutral-800 transition-colors"
                          title="Add to cart"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {activeTab === 'chefs' && (
              favoriteChefs.length === 0 ? (
                <EmptyState
                  type="favorites"
                  title="No Saved Home Chefs"
                  description="Tap the heart icon on any chef profile to follow your favorite neighborhood cooks."
                  onAction={onClose}
                  actionLabel="Discover Chefs"
                />
              ) : (
                <div className="space-y-4">
                  {favoriteChefs.map((chef) => (
                    <div
                      key={chef.id}
                      className="p-4 rounded-2xl border border-neutral-200 bg-white space-y-3 shadow-subtle hover:border-black transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={chef.avatar}
                            alt={chef.name}
                            className="w-10 h-10 rounded-full object-cover border border-neutral-200"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-black">{chef.name}</h4>
                            <p className="text-[11px] text-neutral-500">{chef.location}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => onToggleFavoriteChef(chef.id)}
                          className="p-1.5 text-rose-500"
                        >
                          <Heart className="w-4 h-4 fill-rose-500" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs font-semibold pt-2 border-t border-neutral-100">
                        <div className="flex items-center gap-1 font-bold text-black">
                          <Star className="w-3.5 h-3.5 fill-black text-black" />
                          <span>{chef.rating}</span>
                        </div>
                        <button
                          onClick={() => {
                            onViewChefMenu(chef);
                            onClose();
                          }}
                          className="flex items-center gap-1 text-xs font-bold text-black hover:underline"
                        >
                          <span>View Menu</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
