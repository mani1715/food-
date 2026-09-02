import React from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const { categories } = useApp();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-8">
      
      <div className="border-b border-neutral-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">All Collections</span>
        <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">Shop By Product Category</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => navigate(`/products?category=${encodeURIComponent(cat.name)}`)}
            className="group relative rounded-3xl overflow-hidden border border-neutral-200 bg-neutral-100 aspect-[4/5] cursor-pointer shadow-subtle hover:border-black transition-all"
          >
            <img
              src={cat.image}
              alt={cat.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

            <div className="absolute bottom-5 left-5 right-5 text-white space-y-1">
              <h3 className="text-xl font-extrabold tracking-tight">{cat.name}</h3>
              <p className="text-xs text-neutral-300 line-clamp-2">{cat.description}</p>
              <div className="pt-2 flex items-center justify-between text-xs font-bold">
                <span className="text-[10px] bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full font-mono">
                  {cat.itemCount}+ Items
                </span>
                <div className="flex items-center gap-1 hover:underline">
                  <span>Shop</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
