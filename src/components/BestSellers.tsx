import React from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface BestSellersProps {
  products: Product[];
}

export const BestSellers: React.FC<BestSellersProps> = ({ products }) => {
  const navigate = useNavigate();
  const bestSellers = products.filter((p) => p.isBestSeller);
  const itemsToRender = bestSellers.length > 0 ? bestSellers : products.slice(0, 8);

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-6 bg-neutral-50 border-y border-neutral-200">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Customer Favorites</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight mt-0.5">Best Selling Homemade Products</h2>
        </div>

        <button
          onClick={() => navigate('/products')}
          className="text-xs font-bold text-black hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>Browse All</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Horizontal Side-by-Side Scroll Container when > 5 items */}
      <div className="flex overflow-x-auto gap-4 sm:gap-6 pb-4 scrollbar-none snap-x snap-mandatory">
        {itemsToRender.map((product) => (
          <div key={product.id} className="min-w-[235px] sm:min-w-[285px] max-w-[300px] shrink-0 snap-start">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

    </section>
  );
};
