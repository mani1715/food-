import React, { useState } from 'react';
import { Dish, Chef } from '../../types';
import { EmptyState } from '../EmptyState';
import { Search, X, Star, Plus, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  dishes: Dish[];
  chefs: Chef[];
  onAddToCart: (dish: Dish) => void;
  onViewChefMenu: (chef: Chef) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  dishes,
  chefs,
  onAddToCart,
  onViewChefMenu,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filteredDishes = query.trim()
    ? dishes.filter(
        (d) =>
          d.name.toLowerCase().includes(query.toLowerCase()) ||
          d.category.toLowerCase().includes(query.toLowerCase()) ||
          d.chefName.toLowerCase().includes(query.toLowerCase()) ||
          d.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  const filteredChefs = query.trim()
    ? chefs.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.specialty.toLowerCase().includes(query.toLowerCase()) ||
          c.location.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const popularSearches = ['Biryani', 'Avakaya Thali', 'Sourdough', 'Pure Veg', 'Clay Pot', 'Pastries'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white border border-neutral-200 rounded-3xl max-w-2xl w-full p-6 shadow-modal space-y-6 text-left relative max-h-[85vh] flex flex-col"
        >
          {/* Search Header Input */}
          <div className="relative flex items-center gap-3 border-b border-neutral-200 pb-4">
            <Search className="w-5 h-5 text-black shrink-0" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes, home chefs, or categories (e.g. Biryani, Lakshmi Rao)..."
              className="w-full text-base font-medium text-black placeholder:text-neutral-400 focus:outline-none bg-transparent"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 text-neutral-400 hover:text-black rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-full transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Popular Searches */}
          {!query && (
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Popular Searches
              </span>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-3.5 py-1.5 rounded-full border border-neutral-200 bg-neutral-50 text-xs font-semibold text-neutral-700 hover:border-black hover:bg-white hover:text-black transition-all"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results List */}
          <div className="flex-1 overflow-y-auto space-y-6 pr-1 no-scrollbar">
            {query.trim() && filteredDishes.length === 0 && filteredChefs.length === 0 && (
              <EmptyState
                type="search"
                title={`No matches for "${query}"`}
                description="Try checking for spelling errors or searching for broader terms like 'Lunch' or 'Biryani'."
                onAction={() => setQuery('')}
                actionLabel="Clear Search"
              />
            )}

            {/* Matching Dishes */}
            {filteredDishes.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Dishes ({filteredDishes.length})
                </span>
                <div className="space-y-3">
                  {filteredDishes.map((dish) => (
                    <div
                      key={dish.id}
                      className="p-3 rounded-2xl border border-neutral-200 bg-white flex items-center justify-between gap-4 hover:border-black transition-colors shadow-subtle"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="w-14 h-14 rounded-xl object-cover border border-neutral-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-black truncate">{dish.name}</h4>
                          <p className="text-xs text-neutral-500 font-medium">{dish.chefName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-extrabold text-black">${dish.price.toFixed(2)}</span>
                            <span className="text-[10px] text-neutral-400 font-bold">• {dish.prepTime}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onAddToCart(dish);
                          onClose();
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
            )}

            {/* Matching Chefs */}
            {filteredChefs.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Home Chefs ({filteredChefs.length})
                </span>
                <div className="space-y-3">
                  {filteredChefs.map((chef) => (
                    <div
                      key={chef.id}
                      className="p-3.5 rounded-2xl border border-neutral-200 bg-white flex items-center justify-between gap-4 hover:border-black transition-colors shadow-subtle"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={chef.avatar}
                          alt={chef.name}
                          className="w-12 h-12 rounded-full object-cover border border-neutral-200"
                        />
                        <div>
                          <h4 className="text-sm font-bold text-black">{chef.name}</h4>
                          <p className="text-xs text-neutral-500">{chef.location}</p>
                          <div className="flex items-center gap-1 text-[11px] font-bold text-black mt-0.5">
                            <Star className="w-3 h-3 fill-black text-black" />
                            <span>{chef.rating}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onViewChefMenu(chef);
                          onClose();
                        }}
                        className="px-4 py-2 border border-black text-black text-xs font-bold rounded-xl hover:bg-black hover:text-white transition-all flex items-center gap-1 shrink-0"
                      >
                        <span>View Menu</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
