import React from 'react';
import { Dish } from '../../types';
import { X, Star, Clock, Flame, Plus, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickDishModalProps {
  isOpen: boolean;
  onClose: () => void;
  dish: Dish | null;
  onAddToCart: (dish: Dish) => void;
}

export const QuickDishModal: React.FC<QuickDishModalProps> = ({
  isOpen,
  onClose,
  dish,
  onAddToCart,
}) => {
  if (!isOpen || !dish) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white border border-neutral-200 rounded-3xl max-w-lg w-full overflow-hidden shadow-modal text-left relative"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 bg-black/60 text-white rounded-full backdrop-blur-md hover:bg-black transition-colors"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Dish Image Header */}
          <div className="relative aspect-[16/10] bg-neutral-100">
            <img
              src={dish.image}
              alt={dish.name}
              className="w-full h-full object-cover grayscale contrast-125"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            <div className="absolute bottom-4 left-4 right-4 text-white flex items-end justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-300">
                  {dish.category}
                </span>
                <h3 className="text-xl font-extrabold text-white tracking-tight">{dish.name}</h3>
              </div>
              <span className="text-xl font-extrabold font-mono bg-white text-black px-3 py-1 rounded-xl shadow-subtle">
                ${dish.price.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Dish Details Body */}
          <div className="p-6 space-y-6">
            {/* Chef Info Strip */}
            <div className="flex items-center justify-between p-3 rounded-2xl border border-neutral-200 bg-neutral-50">
              <div className="flex items-center gap-3">
                {dish.chefImage && (
                  <img
                    src={dish.chefImage}
                    alt={dish.chefName}
                    className="w-10 h-10 rounded-full object-cover border border-white"
                  />
                )}
                <div>
                  <p className="text-xs text-neutral-500 font-medium">Prepared fresh by</p>
                  <h4 className="text-sm font-bold text-black">{dish.chefName}</h4>
                </div>
              </div>

              <div className="flex items-center gap-1 font-bold text-xs text-black">
                <Star className="w-4 h-4 fill-black text-black" />
                <span>{dish.rating} ({dish.reviewsCount})</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-neutral-600 leading-relaxed font-normal">
              {dish.description}
            </p>

            {/* Specs & Tags */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-semibold">
              <div className="p-3 rounded-xl bg-neutral-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-black" />
                <div>
                  <p className="text-[10px] text-neutral-400 uppercase">Prep Time</p>
                  <p className="text-black">{dish.prepTime}</p>
                </div>
              </div>
              {dish.calories && (
                <div className="p-3 rounded-xl bg-neutral-100 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-black" />
                  <div>
                    <p className="text-[10px] text-neutral-400 uppercase">Energy</p>
                    <p className="text-black">{dish.calories} kcal</p>
                  </div>
                </div>
              )}
              <div className="p-3 rounded-xl bg-neutral-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-black" />
                <div>
                  <p className="text-[10px] text-neutral-400 uppercase">Dietary</p>
                  <p className="text-black">{dish.isVeg ? 'Pure Veg' : 'Non-Veg'}</p>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {dish.tags.map((tag) => (
                <span key={tag} className="text-[11px] font-bold bg-neutral-200 text-black px-3 py-1 rounded-lg">
                  #{tag}
                </span>
              ))}
            </div>

            {/* Add To Cart CTA */}
            <button
              onClick={() => {
                onAddToCart(dish);
                onClose();
              }}
              className="w-full py-4 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-subtle active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Dish To Order (${dish.price.toFixed(2)})</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
