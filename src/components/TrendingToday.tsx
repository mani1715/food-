import React, { useState } from 'react';
import { Dish, Chef } from '../types';
import { Flame, Star, Plus, Heart, Eye, ArrowRight } from 'lucide-react';

interface TrendingTodayProps {
  dishes: Dish[];
  chefs: Chef[];
  onAddToCart: (dish: Dish) => void;
  onToggleFavoriteDish: (dishId: string) => void;
  onToggleFavoriteChef: (chefId: string) => void;
  favoriteDishIds: string[];
  favoriteChefIds: string[];
  onQuickViewDish: (dish: Dish) => void;
  onViewChefMenu: (chef: Chef) => void;
}

export const TrendingToday: React.FC<TrendingTodayProps> = ({
  dishes,
  chefs,
  onAddToCart,
  onToggleFavoriteDish,
  onToggleFavoriteChef,
  favoriteDishIds,
  favoriteChefIds,
  onQuickViewDish,
  onViewChefMenu,
}) => {
  const [activeTab, setActiveTab] = useState<'dishes' | 'chefs' | 'mostOrdered'>('dishes');

  const trendingDishes = dishes.filter((d) => d.isTrending);
  const mostOrderedDishes = dishes.filter((d) => d.isMostOrdered);
  const trendingChefs = chefs.filter((c) => c.isTrending);

  return (
    <section id="trending" className="py-12 bg-neutral-50 border-y border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header & Segmented Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
              <Flame className="w-4 h-4 text-black fill-black" />
              <span>Real-Time Kitchen Activity</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
              Trending Today
            </h2>
          </div>

          {/* Segmented Tab Buttons */}
          <div className="flex items-center p-1.5 bg-white border border-neutral-200 rounded-2xl shadow-subtle self-start md:self-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('dishes')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'dishes'
                  ? 'bg-black text-white shadow-subtle'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              Trending Dishes
            </button>
            <button
              onClick={() => setActiveTab('chefs')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'chefs'
                  ? 'bg-black text-white shadow-subtle'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              Trending Home Chefs
            </button>
            <button
              onClick={() => setActiveTab('mostOrdered')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'mostOrdered'
                  ? 'bg-black text-white shadow-subtle'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              Most Ordered
            </button>
          </div>
        </div>

        {/* Tab Content 1: Trending Dishes */}
        {activeTab === 'dishes' && (
          <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar scroll-smooth snap-x snap-mandatory">
            {trendingDishes.map((dish) => {
              const isFav = favoriteDishIds.includes(dish.id);
              return (
                <div
                  key={dish.id}
                  className="min-w-[280px] sm:min-w-[320px] max-w-[340px] bg-white border border-neutral-200 rounded-3xl p-4 shadow-subtle hover:shadow-elevated transition-all flex flex-col justify-between snap-start group"
                >
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/3] mb-4 bg-neutral-100">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-black text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                      Trending
                    </div>
                    <button
                      onClick={() => onToggleFavoriteDish(dish.id)}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-colors ${
                        isFav
                          ? 'bg-black text-white'
                          : 'bg-white/80 text-black hover:bg-black hover:text-white'
                      }`}
                      aria-label="Toggle favorite dish"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
                    </button>
                  </div>

                  <div className="space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
                        <span>{dish.chefName}</span>
                        <div className="flex items-center gap-1 font-bold text-black">
                          <Star className="w-3.5 h-3.5 fill-black text-black" />
                          <span>{dish.rating}</span>
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-black line-clamp-1 mt-1">{dish.name}</h3>
                      <p className="text-xs text-neutral-500 line-clamp-2 mt-1">{dish.description}</p>
                    </div>

                    <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-neutral-400 font-semibold uppercase">Price</span>
                        <p className="text-lg font-extrabold text-black">${dish.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onQuickViewDish(dish)}
                          className="p-2 rounded-2xl border border-neutral-200 text-neutral-700 hover:text-black hover:bg-neutral-100 transition-colors"
                          title="Quick View"
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
                </div>
              );
            })}
          </div>
        )}

        {/* Tab Content 2: Trending Chefs */}
        {activeTab === 'chefs' && (
          <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar scroll-smooth snap-x snap-mandatory">
            {trendingChefs.map((chef) => {
              const isFav = favoriteChefIds.includes(chef.id);
              return (
                <div
                  key={chef.id}
                  className="min-w-[290px] sm:min-w-[340px] max-w-[360px] bg-white border border-neutral-200 rounded-3xl p-5 shadow-subtle hover:shadow-elevated transition-all flex flex-col justify-between snap-start group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={chef.avatar}
                        alt={chef.name}
                        className="w-12 h-12 rounded-full object-cover border border-neutral-300"
                      />
                      <div>
                        <h3 className="text-base font-bold text-black">{chef.name}</h3>
                        <p className="text-xs text-neutral-500">{chef.location}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => onToggleFavoriteChef(chef.id)}
                      className={`p-2 rounded-full border transition-colors ${
                        isFav
                          ? 'bg-black text-white border-black'
                          : 'bg-neutral-50 border-neutral-200 text-black hover:bg-black hover:text-white'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
                    </button>
                  </div>

                  <div className="relative rounded-2xl overflow-hidden aspect-[16/9] mb-4 bg-neutral-100">
                    <img
                      src={chef.image}
                      alt={chef.specialty}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="bg-neutral-100 text-black px-2.5 py-1 rounded-lg">
                        {chef.experienceYears} Yrs Experience
                      </span>
                      <div className="flex items-center gap-1 font-bold text-black">
                        <Star className="w-4 h-4 fill-black text-black" />
                        <span>{chef.rating} ({chef.reviewsCount})</span>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-neutral-600 italic">"{chef.specialty}"</p>

                    <button
                      onClick={() => onViewChefMenu(chef)}
                      className="w-full py-3 bg-black text-white text-xs font-bold rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-subtle"
                    >
                      <span>View Kitchen Menu</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab Content 3: Most Ordered */}
        {activeTab === 'mostOrdered' && (
          <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar scroll-smooth snap-x snap-mandatory">
            {mostOrderedDishes.map((dish) => {
              const isFav = favoriteDishIds.includes(dish.id);
              return (
                <div
                  key={dish.id}
                  className="min-w-[280px] sm:min-w-[320px] max-w-[340px] bg-white border border-neutral-200 rounded-3xl p-4 shadow-subtle hover:shadow-elevated transition-all flex flex-col justify-between snap-start group"
                >
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/3] mb-4 bg-neutral-100">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-white text-black text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-subtle">
                      Most Ordered
                    </div>
                    <button
                      onClick={() => onToggleFavoriteDish(dish.id)}
                      className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-colors ${
                        isFav
                          ? 'bg-black text-white'
                          : 'bg-white/80 text-black hover:bg-black hover:text-white'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-white' : ''}`} />
                    </button>
                  </div>

                  <div className="space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
                        <span>{dish.chefName}</span>
                        <div className="flex items-center gap-1 font-bold text-black">
                          <Star className="w-3.5 h-3.5 fill-black text-black" />
                          <span>{dish.rating}</span>
                        </div>
                      </div>
                      <h3 className="text-base font-bold text-black line-clamp-1 mt-1">{dish.name}</h3>
                      <p className="text-xs text-neutral-500 line-clamp-2 mt-1">{dish.description}</p>
                    </div>

                    <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-neutral-400 font-semibold uppercase">Price</span>
                        <p className="text-lg font-extrabold text-black">${dish.price.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onQuickViewDish(dish)}
                          className="p-2 rounded-2xl border border-neutral-200 text-neutral-700 hover:text-black hover:bg-neutral-100 transition-colors"
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
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};
