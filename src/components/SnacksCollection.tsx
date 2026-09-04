import React from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Utensils } from 'lucide-react';

interface SnacksCollectionProps {
  products: Product[];
}

export const SnacksCollection: React.FC<SnacksCollectionProps> = ({ products }) => {
  const navigate = useNavigate();
  const snacksProducts = products.filter((p) => p.category === 'Snacks');

  if (snacksProducts.length === 0) return null;

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-neutral-400">
            <Utensils className="w-4 h-4 text-black" />
            <span>Crunchy & Crispy Savories</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-1">Homemade Snacks & Savories</h2>
        </div>

        <button
          onClick={() => navigate('/products?category=Snacks')}
          className="text-xs font-extrabold text-black hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
        >
          <span>View All Snacks ({snacksProducts.length})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {snacksProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};
