import React, { useState } from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { Heart, Star, Plus, Zap, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { wishlistProductIds, toggleWishlist, addToCart, addRecentlyViewed } = useApp();
  const navigate = useNavigate();

  const isWishlisted = wishlistProductIds.includes(product.id);

  // Selected weight tier state (defaults to 500g or first weight option)
  const [selectedWeight, setSelectedWeight] = useState(
    product.defaultWeight || product.weightOptions[0]?.weight || '500g'
  );

  const selectedOption =
    product.weightOptions.find((w) => w.weight === selectedWeight) || product.weightOptions[0];
  const currentPrice = selectedOption ? selectedOption.price : product.price;

  const hasDiscount = Boolean(product.discountPercentage && product.discountPercentage > 0);
  const discountedPrice = hasDiscount
    ? Math.round(currentPrice * (1 - (product.discountPercentage || 0) / 100))
    : currentPrice;

  const handleCardClick = () => {
    addRecentlyViewed(product.id);
    navigate(`/product/${product.id}`);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, selectedWeight, 1);
    navigate('/checkout');
  };

  const isOutOfStock = Boolean(product.outOfStock) || product.inStock === false || (product.inventoryCount ?? 100) <= 0;

  return (
    <div className={`bg-white border border-neutral-200 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-subtle hover:border-black transition-all flex flex-col justify-between group text-left h-full ${isOutOfStock ? 'opacity-90' : ''}`}>
      
      {/* Product Image & Badges */}
      <div className="relative rounded-xl sm:rounded-2xl overflow-hidden aspect-square mb-2.5 sm:mb-3 bg-neutral-100 cursor-pointer" onClick={handleCardClick}>
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isOutOfStock ? 'grayscale-[30%]' : ''}`}
        />
        
        {/* Top Left Badges: Best Seller, New, Veg/Non-Veg, Discount, Out of Stock */}
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex flex-col gap-1 items-start z-10">
          {isOutOfStock ? (
            <span className="bg-rose-600 text-white text-[9px] sm:text-[10px] font-black uppercase px-2 sm:px-2.5 py-0.5 rounded-full shadow-subtle flex items-center gap-1">
              <span>🚨</span>
              <span>Out of Stock</span>
            </span>
          ) : (
            <>
              {hasDiscount && (
                <span className="bg-rose-600 text-white text-[9px] sm:text-[10px] font-black uppercase px-2 sm:px-2.5 py-0.5 rounded-full shadow-subtle flex items-center gap-1">
                  <span>🏷️</span>
                  <span>{product.discountPercentage}% OFF</span>
                </span>
              )}

              {product.isVeg ? (
                <span className="bg-white/90 backdrop-blur-sm border border-emerald-800 text-emerald-900 text-[9px] sm:text-[10px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-full shadow-subtle flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 inline-block" />
                  Veg
                </span>
              ) : (
                <span className="bg-white/90 backdrop-blur-sm border border-rose-800 text-rose-900 text-[9px] sm:text-[10px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-full shadow-subtle flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-700 inline-block" />
                  Non-Veg
                </span>
              )}

              {product.isBestSeller && (
                <span className="bg-black text-white text-[8px] sm:text-[9px] font-extrabold uppercase px-1.5 sm:px-2 py-0.5 rounded-full shadow-subtle">
                  Best Seller
                </span>
              )}

              {product.isFestival && (
                <span className="bg-amber-400 text-black text-[8px] sm:text-[9px] font-extrabold uppercase px-1.5 sm:px-2 py-0.5 rounded-full shadow-subtle flex items-center gap-0.5">
                  <span>✨</span>
                  <span>Festive</span>
                </span>
              )}
            </>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          className={`absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1.5 sm:p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-full transition-all shadow-subtle cursor-pointer z-10 ${
            isWishlisted ? 'bg-black text-white' : 'bg-white/90 text-black hover:bg-black hover:text-white backdrop-blur-sm'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-white' : ''}`} />
        </button>
      </div>

      {/* Product Details */}
      <div className="space-y-2 sm:space-y-3 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-neutral-400 font-bold uppercase mb-0.5">
            <span className="truncate pr-1">{product.category}</span>
            <div className="flex items-center gap-0.5 text-black font-extrabold shrink-0">
              <Star className="w-3 h-3 fill-black text-black" />
              <span>{product.rating}</span>
            </div>
          </div>

          <h3
            onClick={handleCardClick}
            className="text-xs sm:text-sm font-extrabold text-black line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] leading-snug break-words cursor-pointer hover:underline"
          >
            {product.name}
          </h3>
          <p className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5 hidden sm:block">{product.description}</p>
        </div>

        {/* Gram Package Weight Selector (e.g. 250g, 400g, 500g, 1kg) */}
        <div className="space-y-1">
          <span className="text-[10px] sm:text-[11px] font-extrabold text-neutral-600 uppercase tracking-wider block">
            Weight Tier
          </span>
          <div className="relative">
            <select
              value={selectedWeight}
              onChange={(e) => setSelectedWeight(e.target.value)}
              className="w-full py-2 sm:py-2.5 pl-2.5 sm:pl-3.5 pr-7 sm:pr-8 rounded-xl sm:rounded-2xl border-2 border-neutral-300 hover:border-black bg-white text-xs sm:text-sm font-black text-black shadow-xs appearance-none cursor-pointer transition-all focus:outline-none focus:border-black min-h-[38px]"
            >
              {product.weightOptions.map((opt) => {
                const optDiscounted = hasDiscount
                  ? Math.round(opt.price * (1 - (product.discountPercentage || 0) / 100))
                  : opt.price;
                return (
                  <option key={opt.weight} value={opt.weight}>
                    {opt.weight} — ₹{optDiscounted} {opt.stock !== undefined ? `(${opt.stock} left)` : ''}
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-700 absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Price & Action Buttons (Quick Add + Buy Now) */}
        <div className="pt-2 sm:pt-3 border-t border-neutral-100 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] text-neutral-500 font-extrabold block uppercase tracking-wide leading-none">
              {selectedWeight}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm sm:text-lg font-black font-mono text-black leading-tight">
                ₹{discountedPrice}
              </span>
              {hasDiscount && (
                <span className="line-through text-neutral-400 text-[10px] sm:text-xs font-mono font-bold">
                  ₹{currentPrice}
                </span>
              )}
            </div>
          </div>

          {isOutOfStock ? (
            <span className="w-full text-center px-2 sm:px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 text-[11px] sm:text-xs font-black rounded-xl sm:rounded-2xl">
              Out of Stock 🚨
            </span>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2 w-full">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product, selectedWeight, 1);
                }}
                className="flex-1 px-2.5 sm:px-3.5 py-2 sm:py-2.5 min-h-[38px] sm:min-h-[42px] bg-neutral-100 border border-neutral-300 hover:border-black text-black text-[11px] sm:text-xs font-black rounded-xl sm:rounded-2xl hover:bg-neutral-200 transition-all flex items-center justify-center gap-1 shadow-subtle cursor-pointer whitespace-nowrap active:scale-95"
                title="Add to Basket"
                aria-label={`Add ${product.name} to Cart`}
              >
                <Plus className="w-3.5 h-3.5 shrink-0 stroke-[2.5]" />
                <span>Add</span>
              </button>

              <button
                onClick={handleBuyNow}
                className="flex-1 px-2.5 sm:px-4 py-2 sm:py-2.5 min-h-[38px] sm:min-h-[42px] bg-black text-white text-[11px] sm:text-xs font-black rounded-xl sm:rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-1 shadow-subtle cursor-pointer whitespace-nowrap active:scale-95"
                title="Instant Checkout"
                aria-label={`Buy ${product.name} now`}
              >
                <Zap className="w-3.5 h-3.5 shrink-0 fill-white" />
                <span>Buy</span>
              </button>
            </div>
          )}
        </div>
      </div>


    </div>
  );
};
