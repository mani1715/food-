import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, Star, Plus, Eye, Heart, MapPin, ArrowRight, X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmptyState } from '../../components/EmptyState';

export const ExplorePage: React.FC = () => {
  const { dishes, chefs, categories, currentLocation, addToCart, toggleFavoriteDish, favoriteDishIds, setCurrentLocation } = useApp();
  const navigate = useNavigate();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [dietary, setDietary] = useState<'all' | 'veg' | 'nonveg' | 'healthy' | 'desserts'>('all');
  const [maxPrice, setMaxPrice] = useState<number>(30);
  const [minRating, setMinRating] = useState<number>(0);
  const [availableToday, setAvailableToday] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'priceLow' | 'priceHigh' | 'fastest'>('popular');

  // Mobile Bottom Sheet Filter Toggle
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Filter logic
  let filteredDishes = dishes.filter((dish) => {
    // Search query
    const matchSearch =
      !searchQuery.trim() ||
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.chefName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.category.toLowerCase().includes(searchQuery.toLowerCase());

    // Category
    const matchCat = selectedCat === 'All' || dish.category.toLowerCase() === selectedCat.toLowerCase();

    // Dietary
    let matchDiet = true;
    if (dietary === 'veg') matchDiet = dish.isVeg === true;
    if (dietary === 'nonveg') matchDiet = dish.isVeg === false;
    if (dietary === 'healthy') matchDiet = dish.category === 'Healthy Meals' || dish.tags.includes('Clean Eats');
    if (dietary === 'desserts') matchDiet = dish.category === 'Sweets' || dish.category === 'Bakery';

    // Price
    const matchPrice = dish.price <= maxPrice;

    // Rating
    const matchRating = dish.rating >= minRating;

    return matchSearch && matchCat && matchDiet && matchPrice && matchRating;
  });

  // Sorting logic
  filteredDishes = [...filteredDishes].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'priceLow') return a.price - b.price;
    if (sortBy === 'priceHigh') return b.price - a.price;
    return (b.reviewsCount || 0) - (a.reviewsCount || 0);
  });

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCat('All');
    setDietary('all');
    setMaxPrice(30);
    setMinRating(0);
    setAvailableToday(false);
    setSortBy('popular');
  };

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Neighborhood Marketplace</span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-black tracking-tight mt-1">
            Explore Home Food
          </h1>
        </div>

        {/* Location Chip */}
        <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-2xl px-4 py-2 text-xs font-semibold">
          <MapPin className="w-4 h-4 text-black shrink-0" />
          <span>Delivering to <strong className="text-black">{currentLocation.area}, {currentLocation.city}</strong></span>
        </div>
      </div>

      {/* Search Bar & Sort Strip */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dishes, home chefs, or categories (e.g. Biryani, Avakaya)..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-neutral-300 text-sm focus:outline-none focus:border-black transition-all bg-white shadow-subtle"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mobile Filter Button */}
        <button
          onClick={() => setShowMobileFilter(true)}
          className="lg:hidden flex items-center justify-center gap-2 px-5 py-3.5 bg-black text-white text-xs font-bold rounded-2xl shadow-subtle shrink-0"
        >
          <Filter className="w-4 h-4" />
          <span>Filters & Sort</span>
        </button>

        {/* Desktop Sort Selector */}
        <div className="hidden lg:flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-2xl px-4 shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-neutral-500" />
          <span className="text-xs text-neutral-500 font-semibold">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent text-xs font-bold text-black focus:outline-none py-3.5 cursor-pointer"
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="priceLow">Price: Low to High</option>
            <option value="priceHigh">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Sidebar + Dish List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block lg:col-span-3 bg-neutral-50 border border-neutral-200 rounded-3xl p-6 space-y-6 shadow-subtle sticky top-24">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <h3 className="text-base font-extrabold text-black flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </h3>
            <button onClick={resetFilters} className="text-xs text-neutral-500 hover:text-black font-semibold flex items-center gap-1">
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Categories</label>
            <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
              <button
                onClick={() => setSelectedCat('All')}
                className={`w-full text-left text-xs font-bold py-1.5 px-3 rounded-xl transition-all ${
                  selectedCat === 'All' ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                All Categories ({dishes.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.name)}
                  className={`w-full text-left text-xs font-bold py-1.5 px-3 rounded-xl transition-all flex items-center justify-between ${
                    selectedCat.toLowerCase() === cat.name.toLowerCase() ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-70">({cat.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dietary Restrictions */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Dietary Type</label>
            <div className="flex flex-col gap-1.5">
              {[
                { id: 'all', label: 'All Dishes' },
                { id: 'veg', label: 'Pure Veg Only' },
                { id: 'nonveg', label: 'Non-Veg Only' },
                { id: 'healthy', label: 'Healthy & Clean Eats' },
              ].map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDietary(d.id as any)}
                  className={`text-left text-xs font-bold py-2 px-3 rounded-xl border transition-all ${
                    dietary === d.id ? 'bg-black text-white border-black' : 'bg-white text-neutral-700 border-neutral-200 hover:border-black'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Max Price Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <span className="uppercase text-neutral-400">Max Price</span>
              <span className="text-black font-mono">${maxPrice.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="1"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-black cursor-pointer"
            />
          </div>

          {/* Rating Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Minimum Rating</label>
            <div className="flex items-center gap-2">
              {[0, 4.5, 4.8, 4.9].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setMinRating(rating)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                    minRating === rating ? 'bg-black text-white border-black' : 'bg-white text-neutral-700 border-neutral-200'
                  }`}
                >
                  {rating === 0 ? 'Any' : `${rating}+ ★`}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Dishes Grid Area */}
        <main className="lg:col-span-9 space-y-8">
          
          {/* Active Filter Pills Bar */}
          <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold border-b border-neutral-100 pb-3">
            <span>Showing <strong className="text-black">{filteredDishes.length}</strong> home-cooked dishes</span>
            {(selectedCat !== 'All' || dietary !== 'all' || searchQuery) && (
              <button onClick={resetFilters} className="text-black font-bold underline">
                Clear Filters
              </button>
            )}
          </div>

          {/* Dishes Grid (2-column on mobile, 3-column on desktop) */}
          {filteredDishes.length === 0 ? (
            <EmptyState
              type="search"
              title="No Dishes Match Your Selected Filters"
              description="Try adjusting your dietary restriction, price slider, or search query."
              onAction={resetFilters}
              actionLabel="Reset All Filters"
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredDishes.map((dish) => {
                const isFav = favoriteDishIds.includes(dish.id);
                return (
                  <div
                    key={dish.id}
                    className="bg-white border border-neutral-200 rounded-3xl p-3 sm:p-4 shadow-subtle hover:shadow-elevated hover:border-black transition-all flex flex-col justify-between group"
                  >
                    <div className="relative rounded-2xl overflow-hidden aspect-[4/3] mb-3 bg-neutral-100 cursor-pointer" onClick={() => navigate(`/food/${dish.id}`)}>
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteDish(dish.id);
                        }}
                        className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-colors ${
                          isFav ? 'bg-black text-white' : 'bg-white/80 text-black hover:bg-black hover:text-white'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-white' : ''}`} />
                      </button>
                    </div>

                    <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-neutral-500 font-medium">
                          <span className="truncate max-w-[100px]">{dish.chefName}</span>
                          <div className="flex items-center gap-1 font-bold text-black shrink-0">
                            <Star className="w-3 h-3 fill-black text-black" />
                            <span>{dish.rating}</span>
                          </div>
                        </div>

                        <h3
                          onClick={() => navigate(`/food/${dish.id}`)}
                          className="text-sm sm:text-base font-bold text-black line-clamp-1 cursor-pointer hover:underline mt-0.5"
                        >
                          {dish.name}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-neutral-500 line-clamp-2 mt-0.5">{dish.description}</p>
                      </div>

                      <div className="pt-3 border-t border-neutral-100 flex items-center justify-between mt-2">
                        <p className="text-base sm:text-lg font-extrabold text-black">${dish.price.toFixed(2)}</p>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => navigate(`/food/${dish.id}`)}
                            className="p-2 rounded-xl border border-neutral-200 text-neutral-700 hover:text-black hover:bg-neutral-100"
                            title="Quick View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => addToCart(dish)}
                            className="flex items-center gap-1 px-3 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-neutral-800 shadow-subtle"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Add</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Recommended Neighborhood Home Chefs Section */}
          <div className="pt-12 border-t border-neutral-200 space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Master Neighborhood Cooks</span>
              <h2 className="text-2xl font-extrabold text-black tracking-tight mt-1">Top Recommended Home Chefs</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {chefs.slice(0, 3).map((chef) => (
                <div
                  key={chef.id}
                  onClick={() => navigate(`/chef/${chef.id}`)}
                  className="p-4 rounded-3xl border border-neutral-200 bg-neutral-50 hover:bg-white hover:border-black cursor-pointer transition-all shadow-subtle flex items-center gap-4"
                >
                  <img src={chef.avatar} alt={chef.name} className="w-14 h-14 rounded-full object-cover border border-neutral-200 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-black truncate">{chef.name}</h4>
                    <p className="text-xs text-neutral-500 truncate">{chef.specialty}</p>
                    <div className="flex items-center gap-1 text-xs font-bold text-black mt-1">
                      <Star className="w-3.5 h-3.5 fill-black text-black" />
                      <span>{chef.rating} ({chef.reviewsCount})</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-neutral-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>

      {/* Mobile Bottom Sheet Filters */}
      <AnimatePresence>
        {showMobileFilter && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end flex-col lg:hidden">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white rounded-t-4xl p-6 space-y-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-lg font-bold text-black">Filter & Sort Dishes</h3>
                <button onClick={() => setShowMobileFilter(false)} className="p-2 text-neutral-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sort selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-neutral-400">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full p-3 rounded-2xl border border-neutral-300 text-sm font-bold bg-white"
                >
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="priceLow">Price: Low to High</option>
                  <option value="priceHigh">Price: High to Low</option>
                </select>
              </div>

              {/* Apply Button */}
              <button
                onClick={() => setShowMobileFilter(false)}
                className="w-full py-4 bg-black text-white font-bold rounded-2xl shadow-subtle"
              >
                Apply Filters ({filteredDishes.length} Dishes)
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
