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
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Explore Catalog</span>
          <h2 className="text-3xl font-extrabold text-black tracking-tight mt-1">Shop By Category</h2>
        </div>

        <button
          onClick={() => navigate('/products')}
          className="text-xs font-bold text-black hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          <span>View All Categories</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => navigate(`/products?category=${encodeURIComponent(cat.name)}`)}
            className="group relative rounded-3xl overflow-hidden border border-neutral-200 bg-neutral-100 aspect-square cursor-pointer shadow-subtle hover:border-black transition-all"
          >
            <img
              src={cat.image}
              alt={cat.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight">{cat.name}</h3>
              <p className="text-[11px] text-neutral-300 line-clamp-1">{cat.description}</p>
              <span className="inline-block text-[10px] bg-white/20 backdrop-blur-md text-white font-mono px-2 py-0.5 rounded-full pt-1">
                {cat.itemCount}+ Products
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
