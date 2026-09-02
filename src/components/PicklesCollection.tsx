import React from 'react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Flame } from 'lucide-react';

interface PicklesCollectionProps {
  products: Product[];
}

export const PicklesCollection: React.FC<PicklesCollectionProps> = ({ products }) => {
  const navigate = useNavigate();
  const pickleProducts = products.filter((p) => p.category === 'Pickles');

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-8 bg-neutral-950 text-white rounded-3xl my-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
            <Flame className="w-4 h-4 text-white" />
            <span>Spicy & Tangy Signature</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight mt-1">Homestyle Pickles Collection</h2>
        </div>

        <button
          onClick={() => navigate('/products?category=Pickles')}
          className="text-xs font-bold text-white hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          <span>View All Pickles</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Horizontal Scroll Showcase */}
      <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
        {pickleProducts.map((prod) => (
          <div key={prod.id} className="min-w-[280px] sm:min-w-[320px] shrink-0 text-black">
            <ProductCard product={prod} />
          </div>
        ))}
      </div>
    </section>
  );
};
