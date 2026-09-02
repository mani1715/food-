import React from 'react';
import { Category } from '../types';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

interface FoodCategoriesProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryName: string) => void;
}

export const FoodCategories: React.FC<FoodCategoriesProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <section id="categories" className="py-16 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Curated Cuisines</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight mt-1">
              Explore Food Categories
            </h2>
          </div>
          <p className="text-sm text-neutral-500 max-w-md">
            Click any category to instantly filter today's fresh home kitchen menu creations.
          </p>
        </div>

        {/* 8 Category Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat, idx) => {
            const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                onClick={() => onSelectCategory(cat.name)}
                className={`relative rounded-3xl overflow-hidden cursor-pointer border transition-all duration-300 group aspect-[4/5] flex flex-col justify-end p-5 shadow-subtle ${
                  isSelected
                    ? 'border-black ring-2 ring-black shadow-elevated scale-[1.02]'
                    : 'border-neutral-200 hover:border-black hover:shadow-elevated'
                }`}
              >
                {/* Background Image with Zoom Effect */}
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover grayscale contrast-125 group-hover:scale-110 group-hover:grayscale-0 transition-all duration-700"
                />

                {/* Dark Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent group-hover:from-black/95 transition-colors" />

                {/* Top Badge */}
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md text-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                  <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
                </div>

                {/* Category Details */}
                <div className="relative z-10 space-y-1 text-white text-left">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-300">
                    {cat.count} Available Dishes
                  </span>
                  <h3 className="text-xl font-extrabold text-white tracking-tight">{cat.name}</h3>
                  <p className="text-xs text-neutral-300 line-clamp-2 hidden sm:block">
                    {cat.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
