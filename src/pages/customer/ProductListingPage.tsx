import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductCard } from '../../components/ProductCard';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, Search, X } from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';

export const ProductListingPage: React.FC = () => {
  const { products, categories } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryParam = searchParams.get('category') || 'All';
  const dietaryParam = searchParams.get('dietary') || 'All';
  const queryParam = searchParams.get('search') || '';

  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [selectedDietary, setSelectedDietary] = useState<string>(dietaryParam);
  const [searchQuery, setSearchQuery] = useState<string>(queryParam);
  const [maxPrice, setMaxPrice] = useState<number>(60);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'price-low' | 'price-high'>('popular');
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || 'All');
    setSelectedDietary(searchParams.get('dietary') || 'All');
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory =
          selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
        
        const matchesDietary =
          selectedDietary === 'All' ||
          (selectedDietary === 'Veg' && p.isVeg) ||
          (selectedDietary === 'Non-Veg' && !p.isVeg);

        const matchesQuery =
          !searchQuery.trim() ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesPrice = p.price <= maxPrice;
        const matchesRating = p.rating >= minRating;

        return matchesCategory && matchesDietary && matchesQuery && matchesPrice && matchesRating;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        return b.reviewsCount - a.reviewsCount; // popular
      });
  }, [products, selectedCategory, selectedDietary, searchQuery, maxPrice, minRating, sortBy]);

  const resetFilters = () => {
    setSelectedCategory('All');
    setSelectedDietary('All');
    setSearchQuery('');
    setMaxPrice(60);
    setMinRating(0);
    setSortBy('popular');
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-8">
      
      {/* Title & Page Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Products Catalog</span>
          <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">
            {selectedCategory === 'All' ? 'All Homemade Products' : `${selectedCategory} Collection`}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">Showing {filteredProducts.length} handcrafted products</p>
        </div>

        {/* Sort & Mobile Filter Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMobileFilter(true)}
            className="md:hidden px-4 py-2.5 bg-neutral-100 border border-neutral-200 rounded-2xl text-xs font-bold flex items-center gap-2"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-white border border-neutral-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-black"
            >
              <option value="popular">Most Popular</option>
              <option value="newest">Newest Arrivals</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Veg / Non-Veg Filter Chips Strip */}
      <div className="flex items-center gap-2 pb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 mr-2">Dietary Filter:</span>
        {['All', 'Veg', 'Non-Veg'].map((diet) => (
          <button
            key={diet}
            onClick={() => setSelectedDietary(diet)}
            className={`px-4 py-2 rounded-2xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedDietary === diet
                ? 'bg-black text-white border-black shadow-subtle'
                : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-black'
            }`}
          >
            {diet === 'Veg' && <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />}
            {diet === 'Non-Veg' && <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" />}
            <span>{diet}</span>
          </button>
        ))}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Desktop Sidebar Filters */}
        <div className="hidden md:block md:col-span-3 space-y-6 sticky top-32 bg-neutral-50 p-6 rounded-3xl border border-neutral-200 shadow-subtle">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-extrabold text-black uppercase tracking-wider flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </h3>
            <button onClick={resetFilters} className="text-[11px] font-bold text-neutral-400 hover:text-black underline">
              Reset
            </button>
          </div>

          {/* Search Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-neutral-500">Search Product</label>
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs font-bold"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase text-neutral-500">Category</label>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1 text-xs">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`w-full text-left py-1.5 px-3 rounded-xl font-bold transition-all ${
                  selectedCategory === 'All' ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`w-full text-left py-1.5 px-3 rounded-xl font-bold transition-all ${
                    selectedCategory.toLowerCase() === cat.name.toLowerCase() ? 'bg-black text-white' : 'text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold">
              <label className="uppercase text-neutral-500">Max Price</label>
              <span className="font-mono text-black">${maxPrice}</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="1"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-black cursor-pointer"
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="md:col-span-9">
          {filteredProducts.length === 0 ? (
            <EmptyState
              type="search"
              title="No Products Found"
              description="No homemade food products matched your current filters. Try resetting your search filters."
              onAction={resetFilters}
              actionLabel="Reset All Filters"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Mobile Filter Sheet */}
      {showMobileFilter && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end">
          <div className="bg-white rounded-t-3xl w-full p-6 space-y-6 text-left max-h-[85vh] overflow-y-auto shadow-modal">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-black">Filter Products</h3>
              <button onClick={() => setShowMobileFilter(false)}>
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Dietary Filter</label>
                <div className="flex gap-2">
                  {['All', 'Veg', 'Non-Veg'].map((d) => (
                    <button
                      key={d}
                      onClick={() => setSelectedDietary(d)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                        selectedDietary === d ? 'bg-black text-white border-black' : 'bg-neutral-50 text-black border-neutral-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Select Category</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('All')}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
                      selectedCategory === 'All' ? 'bg-black text-white border-black' : 'bg-neutral-50 text-black border-neutral-200'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.name)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
                        selectedCategory === c.name ? 'bg-black text-white border-black' : 'bg-neutral-50 text-black border-neutral-200'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowMobileFilter(false)}
              className="w-full py-3.5 bg-black text-white text-xs font-bold rounded-2xl"
            >
              Apply Filters ({filteredProducts.length} Results)
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
