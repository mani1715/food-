import React, { useState } from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { Heart, Star, Plus, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { wishlistProductIds, toggleWishlist, addToCart, addRecentlyViewed } = useApp();
  const navigate = useNavigate();

  const isWishlisted = wishlistProductIds.includes(product.id);
  const selectedWeight = product.defaultWeight || product.weightOptions[0]?.weight || '500g';
  const selectedOption = product.weightOptions.find((w) => w.weight === selectedWeight) || product.weightOptions[0];
  const currentPrice = selectedOption ? selectedOption.price : product.price;

  const handleCardClick = () => {
    addRecentlyViewed(product.id);
    navigate(`/product/${product.id}`);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, selectedWeight, 1);
    navigate('/checkout');
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-3xl p-4 shadow-subtle hover:border-black transition-all flex flex-col justify-between group text-left">
      
      {/* Product Image & Badges */}
      <div className="relative rounded-2xl overflow-hidden aspect-square mb-3 bg-neutral-100 cursor-pointer" onClick={handleCardClick}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Top Left Badges: Best Seller, New, Veg/Non-Veg */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {product.isVeg ? (
            <span className="bg-white/90 backdrop-blur-sm border border-emerald-800 text-emerald-900 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-subtle flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-700 inline-block" />
              Veg
            </span>
          ) : (
            <span className="bg-white/90 backdrop-blur-sm border border-rose-800 text-rose-900 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-subtle flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-700 inline-block" />
              Non-Veg
            </span>
          )}

          {product.isBestSeller && (
            <span className="bg-black text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-subtle">
              Best Seller
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className={`absolute top-2 right-2 p-2 rounded-full transition-all shadow-subtle cursor-pointer ${
            isWishlisted ? 'bg-black text-white' : 'bg-white/90 text-black hover:bg-black hover:text-white backdrop-blur-sm'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-white' : ''}`} />
        </button>
      </div>

      {/* Product Details */}
      <div className="space-y-3 flex-1 flex flex-col justify-between">
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

        {/* Price & Action Buttons (Quick Add + Buy Now) */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-1.5">
          <div>
            <span className="text-[9px] text-neutral-400 font-bold block uppercase">Price ({selectedWeight})</span>
            <span className="text-sm font-extrabold font-mono text-black">${currentPrice.toFixed(2)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                addToCart(product, selectedWeight, 1);
              }}
              className="px-2.5 py-2 bg-neutral-100 border border-neutral-300 text-black text-[10px] font-extrabold rounded-xl hover:bg-neutral-200 transition-all flex items-center gap-1 shadow-subtle cursor-pointer"
              title="Add to Basket"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Quick Add</span>
            </button>

            <button
              onClick={handleBuyNow}
              className="px-2.5 py-2 bg-black text-white text-[10px] font-extrabold rounded-xl hover:bg-neutral-800 transition-all flex items-center gap-1 shadow-subtle cursor-pointer"
              title="Instant Checkout"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
