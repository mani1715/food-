import React, { useState } from 'react';
import { Dish } from '../types';
import { Star, Plus, Eye, Heart, Clock, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

interface PopularDishesProps {
  dishes: Dish[];
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
  onAddToCart: (dish: Dish) => void;
  onQuickViewDish: (dish: Dish) => void;
  onToggleFavoriteDish: (dishId: string) => void;
  favoriteDishIds: string[];
}

export const PopularDishes: React.FC<PopularDishesProps> = ({
  dishes,
  selectedCategory,
  onSelectCategory,
  onAddToCart,
  onQuickViewDish,
  onToggleFavoriteDish,
  favoriteDishIds,
}) => {
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'nonveg'>('all');

  const categoriesList = ['All', 'Lunch', 'Dinner', 'Breakfast', 'Bakery', 'Sweets', 'Pickles', 'Healthy Meals'];

  const filteredDishes = dishes.filter((dish) => {
    // Category match
    const categoryMatch =
      selectedCategory === 'All' ||
      dish.category.toLowerCase() === selectedCategory.toLowerCase();

    // Dietary match
    let dietaryMatch = true;
    if (dietaryFilter === 'veg') dietaryMatch = dish.isVeg === true;
    if (dietaryFilter === 'nonveg') dietaryMatch = dish.isVeg === false;

    return categoryMatch && dietaryMatch;
  });

  return (
    <section id="dishes" className="py-16 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Daily Kitchen Menu</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight mt-1">
              Popular Home-Cooked Dishes
            </h2>
          </div>

          {/* Veg / Non-Veg Toggle Filter */}
          <div className="flex items-center p-1 bg-neutral-100 border border-neutral-200 rounded-2xl self-start md:self-auto">
            <button
              onClick={() => setDietaryFilter('all')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                dietaryFilter === 'all'
                  ? 'bg-black text-white shadow-subtle'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setDietaryFilter('veg')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                dietaryFilter === 'veg'
                  ? 'bg-black text-white shadow-subtle'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Pure Veg
            </button>
            <button
              onClick={() => setDietaryFilter('nonveg')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                dietaryFilter === 'nonveg'
                  ? 'bg-black text-white shadow-subtle'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              Non-Veg
            </button>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {categoriesList.map((cat) => (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-5 py-2.5 text-xs font-bold rounded-2xl border transition-all whitespace-nowrap ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-black text-white border-black shadow-subtle'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:border-black'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid of Dish Cards */}
        {filteredDishes.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-neutral-300 rounded-3xl bg-neutral-50">
            <p className="text-base font-bold text-black">No dishes found matching your selection.</p>
            <button
              onClick={() => {
                onSelectCategory('All');
                setDietaryFilter('all');
              }}
              className="mt-4 px-6 py-2.5 bg-black text-white text-xs font-bold rounded-2xl"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredDishes.map((dish, idx) => {
              const isFav = favoriteDishIds.includes(dish.id);
              return (
                <motion.div
                  key={dish.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="bg-white border border-neutral-200 rounded-3xl p-4 shadow-subtle hover:shadow-elevated hover:border-neutral-400 transition-all flex flex-col justify-between group"
                >
                  {/* Image Container */}
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/3] mb-4 bg-neutral-100">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Veg/Non-Veg Badge */}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-black border border-neutral-200 shadow-subtle flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${dish.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span>{dish.isVeg ? 'Veg' : 'Non-Veg'}</span>
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={() => onToggleFavoriteDish(dish.id)}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-colors ${
                        isFav
                          ? 'bg-black text-white'
                          : 'bg-white/80 text-black hover:bg-black hover:text-white'
                      }`}
                      aria-label="Favorite dish"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
                    </button>
                  </div>

                  {/* Dish Details */}
                  <div className="space-y-2 text-left flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
                        <span>{dish.chefName}</span>
                        <div className="flex items-center gap-1 font-bold text-black">
                          <Star className="w-3.5 h-3.5 fill-black text-black" />
                          <span>{dish.rating}</span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-black line-clamp-1 mt-1 group-hover:text-black">
                        {dish.name}
                      </h3>
                      <p className="text-xs text-neutral-500 line-clamp-2 mt-1">
                        {dish.description}
                      </p>

                      <div className="flex items-center gap-3 mt-3 text-[11px] text-neutral-500 font-semibold">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          {dish.prepTime}
                        </span>
                        {dish.calories && (
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3 text-neutral-400" />
                            {dish.calories} kcal
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Price and Add CTA */}
                    <div className="pt-4 border-t border-neutral-100 flex items-center justify-between mt-4">
                      <div>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Price</span>
                        <div className="flex items-baseline gap-1.5">
                          <p className="text-lg font-extrabold text-black">${dish.price.toFixed(2)}</p>
                          {dish.originalPrice && (
                            <span className="text-xs text-neutral-400 line-through">
                              ${dish.originalPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onQuickViewDish(dish)}
                          className="p-2.5 rounded-2xl border border-neutral-200 text-neutral-700 hover:text-black hover:bg-neutral-100 transition-colors"
                          title="Quick view dish details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onAddToCart(dish)}
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-black text-white text-xs font-bold rounded-2xl hover:bg-neutral-800 transition-all active:scale-95 shadow-subtle"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};
