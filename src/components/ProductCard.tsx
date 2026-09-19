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
    <div className={`bg-white border border-neutral-200 rounded-3xl p-4 shadow-subtle hover:border-black transition-all flex flex-col justify-between group text-left h-full ${isOutOfStock ? 'opacity-90' : ''}`}>
      
      {/* Product Image & Badges */}
      <div className="relative rounded-2xl overflow-hidden aspect-square mb-3 bg-neutral-100 cursor-pointer" onClick={handleCardClick}>
        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isOutOfStock ? 'grayscale-[30%]' : ''}`}
        />
        
        {/* Top Left Badges: Best Seller, New, Veg/Non-Veg, Discount, Out of Stock */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10">
          {isOutOfStock ? (
            <span className="bg-rose-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-subtle flex items-center gap-1">
              <span>🚨</span>
              <span>Out of Stock</span>
            </span>
          ) : (
            <>
              {hasDiscount && (
                <span className="bg-rose-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-subtle flex items-center gap-1">
                  <span>🏷️</span>
                  <span>{product.discountPercentage}% OFF</span>
                </span>
              )}

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

              {product.isFestival && (
                <span className="bg-amber-400 text-black text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-subtle flex items-center gap-0.5">
                  <span>✨</span>
                  <span>Festival Special</span>
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
          className={`absolute top-2 right-2 p-2 rounded-full transition-all shadow-subtle cursor-pointer z-10 ${
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

        {/* Gram Package Weight Selector (e.g. 250g, 400g, 500g, 1kg) */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-extrabold text-neutral-600 uppercase tracking-wider block">
            Package Weight & Price
          </span>
          <div className="relative">
            <select
              value={selectedWeight}
              onChange={(e) => setSelectedWeight(e.target.value)}
              className="w-full py-2.5 pl-3.5 pr-8 rounded-2xl border-2 border-neutral-300 hover:border-black bg-white text-xs sm:text-sm font-black text-black shadow-xs appearance-none cursor-pointer transition-all focus:outline-none focus:border-black"
            >
              {product.weightOptions.map((opt) => {
                const optDiscounted = hasDiscount
                  ? Math.round(opt.price * (1 - (product.discountPercentage || 0) / 100))
                  : opt.price;
                return (
                  <option key={opt.weight} value={opt.weight}>
                    {opt.weight} — ₹{optDiscounted} {opt.stock !== undefined ? `(${opt.stock} left)` : ''} {hasDiscount ? `(was ₹${opt.price})` : ''}
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-4 h-4 text-neutral-700 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Price & Action Buttons (Quick Add + Buy Now) */}
        <div className="pt-3 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center justify-between sm:block">
            <span className="text-[10px] text-neutral-500 font-extrabold block uppercase tracking-wide leading-none mb-0.5">
              {selectedWeight} Price
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-black font-mono text-black leading-tight">
                ₹{discountedPrice}
              </span>
              {hasDiscount && (
                <span className="line-through text-neutral-400 text-xs font-mono font-bold">
                  ₹{currentPrice}
                </span>
              )}
            </div>
          </div>


          {isOutOfStock ? (
            <span className="w-full sm:w-auto text-center px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black rounded-2xl">
              Out of Stock 🚨
            </span>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product, selectedWeight, 1);
                }}
                className="flex-1 sm:flex-initial px-3.5 py-2 sm:py-2.5 bg-neutral-100 border border-neutral-300 hover:border-black text-black text-xs font-black rounded-2xl hover:bg-neutral-200 transition-all flex items-center justify-center gap-1.5 shadow-subtle cursor-pointer whitespace-nowrap active:scale-95"
                title="Add to Basket"
              >
                <Plus className="w-4 h-4 shrink-0 stroke-[2.5]" />
                <span>Add</span>
              </button>

              <button
                onClick={handleBuyNow}
                className="flex-1 sm:flex-initial px-4 py-2 sm:py-2.5 bg-black text-white text-xs font-black rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-1.5 shadow-subtle cursor-pointer whitespace-nowrap active:scale-95"
                title="Instant Checkout"
              >
                <Zap className="w-4 h-4 shrink-0 fill-white" />
                <span>Buy Now</span>
              </button>
            </div>
          )}
        </div>
      </div>


    </div>
  );
};
