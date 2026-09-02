import React, { useState } from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { Heart, ShoppingBag, Star, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { wishlistProductIds, toggleWishlist, addToCart, addRecentlyViewed } = useApp();
  const navigate = useNavigate();

  const isWishlisted = wishlistProductIds.includes(product.id);
  const [selectedWeight, setSelectedWeight] = useState(product.defaultWeight || product.weightOptions[0]?.weight);

  const selectedOption = product.weightOptions.find((w) => w.weight === selectedWeight) || product.weightOptions[0];
  const currentPrice = selectedOption ? selectedOption.price : product.price;

  const handleCardClick = () => {
    addRecentlyViewed(product.id);
    navigate(`/product/${product.id}`);
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-3xl p-4 shadow-subtle hover:border-black transition-all flex flex-col justify-between group">
      
      {/* Product Image & Wishlist Toggle */}
      <div className="relative rounded-2xl overflow-hidden aspect-square mb-3 bg-neutral-100 cursor-pointer" onClick={handleCardClick}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isBestSeller && (
            <span className="bg-black text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-subtle">
              Best Seller
            </span>
          )}
          {product.isNewArrival && (
            <span className="bg-white border border-black text-black text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-subtle">
              New
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-2 right-2 p-2 rounded-full transition-all shadow-subtle ${
            isWishlisted ? 'bg-black text-white' : 'bg-white/90 text-black hover:bg-black hover:text-white backdrop-blur-sm'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white' : ''}`} />
        </button>
      </div>

      {/* Product Details */}
      <div className="space-y-3 flex-1 flex flex-col justify-between text-left">
        <div>
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-bold uppercase mb-1">
            <span>{product.category}</span>
            <div className="flex items-center gap-1 text-black font-extrabold">
              <Star className="w-3 h-3 fill-black text-black" />
              <span>{product.rating}</span>
            </div>
          </div>

          <h3
            onClick={handleCardClick}
            className="text-sm font-bold text-black line-clamp-1 cursor-pointer hover:underline"
          >
            {product.name}
          </h3>
          <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">{product.description}</p>
        </div>

        {/* Weight Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {product.weightOptions.map((opt) => (
            <button
              key={opt.weight}
              onClick={() => setSelectedWeight(opt.weight)}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all whitespace-nowrap ${
                selectedWeight === opt.weight
                  ? 'bg-black text-white border-black shadow-subtle'
                  : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:border-black'
              }`}
            >
              {opt.weight}
            </button>
          ))}
        </div>

        {/* Price & Add to Cart Footer */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-neutral-400 font-bold block">Price</span>
            <span className="text-base font-extrabold font-mono text-black">${currentPrice.toFixed(2)}</span>
          </div>

          <button
            onClick={() => addToCart(product, selectedWeight, 1)}
            className="px-4 py-2.5 bg-black text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-all flex items-center gap-1.5 shadow-subtle"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>
        </div>
      </div>

    </div>
  );
};
