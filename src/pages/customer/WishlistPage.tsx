import React from 'react';
import { useApp } from '../../context/AppContext';
import { ProductCard } from '../../components/ProductCard';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';

export const WishlistPage: React.FC = () => {
  const { products, wishlistProductIds } = useApp();
  const navigate = useNavigate();

  const wishlistedProducts = products.filter((p) => wishlistProductIds.includes(p.id));

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-8">
      
      <div className="border-b border-neutral-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Saved Wishlist</span>
        <h1 className="text-3xl font-extrabold text-black tracking-tight mt-1">My Saved Products</h1>
      </div>

      {wishlistedProducts.length === 0 ? (
        <EmptyState
          type="favorites"
          title="Your Wishlist is Empty"
          description="Tap the heart icon on any homemade pickle, sweet, or snack to save your favorites."
          onAction={() => navigate('/products')}
          actionLabel="Discover Products"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {wishlistedProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      )}

    </div>
  );
};
