import React from 'react';
import { Chef, Dish } from '../../types';
import { X, Star, MapPin, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChefMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  chef: Chef | null;
  dishes: Dish[];
  onAddToCart: (dish: Dish) => void;
}

export const ChefMenuModal: React.FC<ChefMenuModalProps> = ({
  isOpen,
  onClose,
  chef,
  dishes,
  onAddToCart,
}) => {
  if (!isOpen || !chef) return null;

  const chefDishes = dishes.filter((d) => d.chefId === chef.id || d.chefName === chef.name);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white border border-neutral-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-modal space-y-6 text-left relative max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-neutral-100 pb-4">
            <div className="flex items-center gap-4">
              <img
                src={chef.avatar}
                alt={chef.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-subtle shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-black">{chef.name}</h3>
                  <span className="text-[10px] bg-black text-white font-bold px-2 py-0.5 rounded">
                    Verified
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                  <div className="flex items-center gap-1 font-bold text-black">
                    <Star className="w-3.5 h-3.5 fill-black text-black" />
                    <span>{chef.rating} ({chef.reviewsCount} reviews)</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-neutral-400" />
                    <span>{chef.location}</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Bio & Specialty */}
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-2">
            <p className="text-xs text-neutral-700 italic">"{chef.bio}"</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {chef.badges.map((b) => (
                <span key={b} className="text-[10px] bg-white border border-neutral-200 text-black font-bold px-2.5 py-0.5 rounded-md">
                  ✓ {b}
                </span>
              ))}
            </div>
          </div>

          {/* Chef's Kitchen Dishes */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 no-scrollbar">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Daily Kitchen Menu ({chefDishes.length} Items)
            </h4>

            <div className="space-y-3">
              {chefDishes.map((dish) => (
                <div
                  key={dish.id}
                  className="p-4 rounded-2xl border border-neutral-200 bg-white flex items-center justify-between gap-4 shadow-subtle hover:border-black transition-colors"
                >
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-16 h-16 rounded-xl object-cover border border-neutral-200 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-bold text-black truncate">{dish.name}</h5>
                    <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">{dish.description}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] font-bold text-black">
                      <span>${dish.price.toFixed(2)}</span>
                      <span className="text-neutral-400 font-normal">• {dish.prepTime}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onAddToCart(dish);
                    }}
                    className="px-4 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-all flex items-center gap-1 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
