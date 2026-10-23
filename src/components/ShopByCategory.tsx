import React from 'react';
import { ProductCategory } from '../types';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

interface ShopByCategoryProps {
  categories: ProductCategory[];
}

export const ShopByCategory: React.FC<ShopByCategoryProps> = ({ categories }) => {
  const navigate = useNavigate();

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Handcrafted Catalog</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight mt-0.5">Categories</h2>
        </div>

        <button
          onClick={() => navigate('/categories')}
          className="text-xs font-bold text-black hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>View All</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Horizontal Side-by-Side Scroll Container */}
      <div className="flex overflow-x-auto gap-4 sm:gap-6 pb-4 scrollbar-none snap-x snap-mandatory">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => navigate(`/products?category=${encodeURIComponent(cat.name)}`)}
            className="group relative rounded-3xl overflow-hidden border border-neutral-200 bg-neutral-100 min-w-[190px] sm:min-w-[240px] max-w-[260px] aspect-[4/5] shrink-0 snap-start cursor-pointer shadow-subtle hover:border-black transition-all"
          >
            <img
              src={cat.image || 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=600&auto=format&fit=crop'}
              alt={cat.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=600&auto=format&fit=crop';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight">{cat.name}</h3>
              <p className="text-[11px] text-neutral-300 line-clamp-1">{cat.description}</p>
              <span className="inline-block text-[10px] bg-white/20 backdrop-blur-md text-white font-mono px-2 py-0.5 rounded-full">
                Explore Collection
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
