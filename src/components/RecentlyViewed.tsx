import React from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from './ProductCard';

export const RecentlyViewed: React.FC = () => {
  const { products, recentlyViewedIds } = useApp();

  const recentProducts = products.filter((p) => !p.isHidden && recentlyViewedIds.includes(p.id)).slice(0, 10);

  if (recentProducts.length === 0) return null;

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-6 border-t border-neutral-200">
      <div className="border-b border-neutral-200 pb-3">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Browsing History</span>
        <h2 className="text-2xl font-extrabold text-black tracking-tight mt-0.5">Recently Viewed Products</h2>
      </div>

      <div className="flex overflow-x-auto gap-4 sm:gap-6 pb-4 scrollbar-none snap-x snap-mandatory">
        {recentProducts.map((prod) => (
          <div key={prod.id} className="min-w-[210px] sm:min-w-[260px] max-w-[270px] shrink-0 snap-start">
            <ProductCard product={prod} />
          </div>
        ))}
      </div>
    </section>
  );
};
