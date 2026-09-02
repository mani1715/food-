import React from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from './ProductCard';

export const RecentlyViewed: React.FC = () => {
  const { products, recentlyViewedIds } = useApp();

  const recentProducts = products.filter((p) => recentlyViewedIds.includes(p.id));

  if (recentProducts.length === 0) return null;

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-8 border-t border-neutral-200">
      <div className="border-b border-neutral-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Your Browsing History</span>
        <h2 className="text-2xl font-extrabold text-black tracking-tight mt-1">Recently Viewed Products</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recentProducts.slice(0, 4).map((prod) => (
          <ProductCard key={prod.id} product={prod} />
        ))}
      </div>
    </section>
  );
};
