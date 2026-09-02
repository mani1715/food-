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
  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 4);

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-8 bg-neutral-50 border-y border-neutral-200">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Customer Favorites</span>
          <h2 className="text-3xl font-extrabold text-black tracking-tight mt-1">Best Selling Homemade Products</h2>
        </div>

        <button
          onClick={() => navigate('/products')}
          className="text-xs font-bold text-black hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          <span>Browse All Best Sellers</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {bestSellers.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};
