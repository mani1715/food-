import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Tag, ArrowRight, ShoppingBag, Star, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WeeklyHighlightsShowcase: React.FC = () => {
  const { products, weeklyHighlights, addToCart } = useApp();
  const navigate = useNavigate();

  const getProduct = (id: string) => {
    return products.find((p) => p.id === id) || products[0];
  };

  const dayProduct = getProduct(weeklyHighlights.specialOfDay.productId);
  const weekProduct = getProduct(weeklyHighlights.specialOfWeek.productId);
  const festivalProduct = getProduct(weeklyHighlights.festivalSpecial.productId);

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-6">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-neutral-400 mb-1">
            <Sparkles className="w-4 h-4 text-black" />
            <span>Curated Daily & Festive Offers</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            Special Highlights & Offers
          </h2>
        </div>
        <p className="text-xs text-neutral-500 max-w-sm font-medium">
          Handcrafted daily batches, weekly specials, and festival gift hampers delivered fresh.
        </p>
      </div>

      {/* 3 Distinct High-Contrast Black & White Highlight Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: Special of the Day — Inverted Jet Black Card */}
        {dayProduct && (
          <div className="group relative rounded-3xl overflow-hidden bg-black text-white p-6 shadow-modal border border-neutral-800 hover:border-white transition-all flex flex-col justify-between min-h-[400px]">
            {/* Background Image with Dark Vignette */}
            <div className="absolute inset-0 z-0">
              <img
                src={dayProduct.image}
                alt={dayProduct.name}
                className="w-full h-full object-cover opacity-35 group-hover:scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/30" />
            </div>

            {/* Top Badges */}
            <div className="relative z-10 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 bg-white text-black text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-modal">
                <Flame className="w-3.5 h-3.5 text-black" />
                <span>{weeklyHighlights.specialOfDay.badgeText || "TODAY'S SPECIAL"}</span>
              </span>

              {weeklyHighlights.specialOfDay.discountPercentage && weeklyHighlights.specialOfDay.discountPercentage > 0 && (
                <span className="bg-white text-black font-mono text-[10px] font-black uppercase px-2.5 py-1.5 rounded-full shadow-modal">
                  {weeklyHighlights.specialOfDay.discountPercentage}% OFF
                </span>
              )}
            </div>

            {/* Middle Content */}
            <div className="relative z-10 space-y-2 pt-16">
              <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider block">
                {dayProduct.category} • {dayProduct.isVeg ? '● Veg' : '▲ Non-Veg'}
              </span>
              <h3
                onClick={() => navigate(`/product/${dayProduct.id}`)}
                className="text-xl font-extrabold text-white tracking-tight cursor-pointer hover:underline line-clamp-2"
              >
                {weeklyHighlights.specialOfDay.title || dayProduct.name}
              </h3>
              <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed font-medium">
                {weeklyHighlights.specialOfDay.subtitle || dayProduct.description}
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="relative z-10 pt-4 border-t border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-neutral-400 font-bold block uppercase">Special Price</span>
                <span className="text-lg font-black font-mono text-white">₹{dayProduct.price}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => addToCart(dayProduct, dayProduct.defaultWeight || '500g', 1)}
                  className="px-4 py-2.5 bg-white text-black text-xs font-black rounded-2xl hover:bg-neutral-200 transition-all flex items-center gap-1.5 shadow-subtle cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-black" />
                  <span>Quick Add</span>
                </button>
                <button
                  onClick={() => navigate(`/product/${dayProduct.id}`)}
                  className="p-2.5 bg-neutral-900 border border-neutral-700 hover:border-white text-white rounded-2xl transition-all cursor-pointer"
                  title="View Details"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CARD 2: Special of the Week — Crisp White High-Contrast Card */}
        {weekProduct && (
          <div className="group relative rounded-3xl overflow-hidden bg-white text-black p-6 shadow-modal border-2 border-black hover:shadow-2xl transition-all flex flex-col justify-between min-h-[400px]">
            {/* Background Image Container */}
            <div className="absolute inset-0 bg-neutral-50 z-0">
              <img
                src={weekProduct.image}
                alt={weekProduct.name}
                className="w-full h-full object-cover opacity-20 group-hover:scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/90 to-transparent" />
            </div>

            {/* Top Badges */}
            <div className="relative z-10 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 bg-black text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-subtle">
                <Star className="w-3.5 h-3.5 text-white" />
                <span>{weeklyHighlights.specialOfWeek.badgeText || "WEEKLY HIGHLIGHT"}</span>
              </span>

              {weeklyHighlights.specialOfWeek.discountPercentage && weeklyHighlights.specialOfWeek.discountPercentage > 0 && (
                <span className="bg-black text-white font-mono text-[10px] font-black uppercase px-2.5 py-1.5 rounded-full shadow-subtle">
                  {weeklyHighlights.specialOfWeek.discountPercentage}% OFF
                </span>
              )}
            </div>

            {/* Middle Content */}
            <div className="relative z-10 space-y-2 pt-16">
              <span className="text-[10px] font-extrabold uppercase text-neutral-500 tracking-wider block">
                {weekProduct.category} • {weekProduct.isVeg ? '● Veg' : '▲ Non-Veg'}
              </span>
              <h3
                onClick={() => navigate(`/product/${weekProduct.id}`)}
                className="text-xl font-extrabold text-black tracking-tight cursor-pointer hover:underline line-clamp-2"
              >
                {weeklyHighlights.specialOfWeek.title || weekProduct.name}
              </h3>
              <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed font-medium">
                {weeklyHighlights.specialOfWeek.subtitle || weekProduct.description}
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="relative z-10 pt-4 border-t border-neutral-200 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-neutral-400 font-bold block uppercase">Weekly Price</span>
                <span className="text-lg font-black font-mono text-black">₹{weekProduct.price}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => addToCart(weekProduct, weekProduct.defaultWeight || '500g', 1)}
                  className="px-4 py-2.5 bg-black text-white text-xs font-black rounded-2xl hover:bg-neutral-800 transition-all flex items-center gap-1.5 shadow-subtle cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Quick Add</span>
                </button>
                <button
                  onClick={() => navigate(`/product/${weekProduct.id}`)}
                  className="p-2.5 bg-neutral-100 border border-neutral-300 hover:border-black text-black rounded-2xl transition-all cursor-pointer"
                  title="View Details"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CARD 3: Festival Special — Brushed Charcoal Luxury Card */}
        {festivalProduct && (
          <div className="group relative rounded-3xl overflow-hidden bg-neutral-900 text-white p-6 shadow-modal border border-neutral-700 hover:border-white transition-all flex flex-col justify-between min-h-[400px]">
            {/* Background Image Container */}
            <div className="absolute inset-0 z-0">
              <img
                src={festivalProduct.image}
                alt={festivalProduct.name}
                className="w-full h-full object-cover opacity-30 group-hover:scale-105 transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/85 to-transparent" />
            </div>

            {/* Top Badges */}
            <div className="relative z-10 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 bg-neutral-200 text-black text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-subtle">
                <Tag className="w-3.5 h-3.5 text-black" />
                <span>{weeklyHighlights.festivalSpecial.badgeText || "FESTIVAL HAMPER"}</span>
              </span>

              {weeklyHighlights.festivalSpecial.discountPercentage && weeklyHighlights.festivalSpecial.discountPercentage > 0 && (
                <span className="bg-white text-black font-mono text-[10px] font-black uppercase px-2.5 py-1.5 rounded-full shadow-subtle">
                  {weeklyHighlights.festivalSpecial.discountPercentage}% OFF
                </span>
              )}
            </div>

            {/* Middle Content */}
            <div className="relative z-10 space-y-2 pt-16">
              <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider block">
                {festivalProduct.category} • {festivalProduct.isVeg ? '● Veg' : '▲ Non-Veg'}
              </span>
              <h3
                onClick={() => navigate(`/product/${festivalProduct.id}`)}
                className="text-xl font-extrabold text-white tracking-tight cursor-pointer hover:underline line-clamp-2"
              >
                {weeklyHighlights.festivalSpecial.title || festivalProduct.name}
              </h3>
              <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed font-medium">
                {weeklyHighlights.festivalSpecial.subtitle || festivalProduct.description}
              </p>
            </div>

            {/* Bottom Actions */}
            <div className="relative z-10 pt-4 border-t border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-neutral-400 font-bold block uppercase">Hamper Price</span>
                <span className="text-lg font-black font-mono text-white">₹{festivalProduct.price}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => addToCart(festivalProduct, festivalProduct.defaultWeight || '1kg Box', 1)}
                  className="px-4 py-2.5 bg-white text-black text-xs font-black rounded-2xl hover:bg-neutral-200 transition-all flex items-center gap-1.5 shadow-subtle cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-black" />
                  <span>Quick Add</span>
                </button>
                <button
                  onClick={() => navigate(`/product/${festivalProduct.id}`)}
                  className="p-2.5 bg-neutral-800 border border-neutral-700 hover:border-white text-white rounded-2xl transition-all cursor-pointer"
                  title="View Details"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

    </section>
  );
};
