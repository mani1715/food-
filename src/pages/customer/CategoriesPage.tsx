import React from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const CategoriesPage: React.FC = () => {
  const { categories } = useApp();
  const navigate = useNavigate();

  const popularCategories = categories.filter((c) => c.isPopular);

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
      
      {/* Page Header */}
      <div className="space-y-2 mb-12">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Curated Cuisines & Flavors</span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-black tracking-tight">
          Explore All Categories
        </h1>
        <p className="text-sm text-neutral-600 max-w-2xl">
          Browse through authentic regional recipes, heritage sweets, sun-dried pickles, and daily protein thalis.
        </p>
      </div>

      {/* Popular Categories Highlight Strip */}
      <div className="mb-12 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500">
          <Sparkles className="w-4 h-4 text-black" />
          <span>Most Ordered Categories</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {popularCategories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => navigate('/explore')}
              className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50 hover:bg-black hover:text-white cursor-pointer transition-all shadow-subtle flex flex-col justify-between aspect-square group"
            >
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 group-hover:text-neutral-300">
                {cat.count} Dishes
              </span>
              <div>
                <h4 className="text-base font-extrabold tracking-tight group-hover:text-white">{cat.name}</h4>
                <p className="text-[11px] text-neutral-500 group-hover:text-neutral-300 line-clamp-1 mt-0.5">{cat.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editorial Large Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat, idx) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            onClick={() => navigate('/explore')}
            className="relative rounded-3xl overflow-hidden border border-neutral-200 cursor-pointer group aspect-[4/3] flex flex-col justify-end p-6 shadow-subtle hover:border-black transition-all"
          >
            <img
              src={cat.image}
              alt={cat.name}
              className="absolute inset-0 w-full h-full object-cover grayscale contrast-125 group-hover:scale-105 group-hover:grayscale-0 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 text-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
              <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
            </div>

            <div className="relative z-10 space-y-1 text-white text-left">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-300">
                {cat.count} Available Items
              </span>
              <h3 className="text-2xl font-extrabold text-white tracking-tight">{cat.name}</h3>
              <p className="text-xs text-neutral-300 line-clamp-2">
                {cat.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  );
};
