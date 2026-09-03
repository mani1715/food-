import React from 'react';
import { useApp } from '../../context/AppContext';
import { Star, Tag, Check } from 'lucide-react';

export const FeaturedManagementTab: React.FC = () => {
  const { products, toggleProductBestSeller, toggleProductFestival } = useApp();

  return (
    <div className="space-y-6 text-left">
      <div className="border-b border-neutral-200 pb-4">
        <h2 className="text-xl font-extrabold text-black tracking-tight">Best Sellers & Festival Specials Selection</h2>
        <p className="text-xs text-neutral-500">Toggle featured badges to highlight items on the homepage grid and festival banners.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((prod) => (
          <div key={prod.id} className="bg-white border border-neutral-200 rounded-3xl p-4 shadow-subtle flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <img src={prod.image} alt={prod.name} className="w-12 h-12 rounded-xl object-cover border border-neutral-200 shrink-0" />
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-black truncate">{prod.name}</h4>
                <p className="text-[10px] text-neutral-400 font-mono">{prod.category} • ${prod.price.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => toggleProductBestSeller(prod.id)}
                className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-extrabold transition-all flex items-center gap-1 ${
                  prod.isBestSeller ? 'bg-black text-white border-black' : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-black'
                }`}
              >
                <Star className="w-3 h-3" />
                <span>Best Seller</span>
              </button>

              <button
                onClick={() => toggleProductFestival(prod.id)}
                className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-extrabold transition-all flex items-center gap-1 ${
                  prod.isFestival ? 'bg-black text-white border-black' : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-black'
                }`}
              >
                <Tag className="w-3 h-3" />
                <span>Festival</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
