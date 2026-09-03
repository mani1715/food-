import React from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Calendar, Tag, ArrowRight, ShoppingBag, Star, Flame } from 'lucide-react';
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

  const highlightCards = [
    {
      item: weeklyHighlights.specialOfDay,
      product: dayProduct,
      icon: <Flame className="w-4 h-4 text-white" />,
      accentBg: 'bg-black text-white',
    },
    {
      item: weeklyHighlights.specialOfWeek,
      product: weekProduct,
      icon: <Star className="w-4 h-4 text-white" />,
      accentBg: 'bg-neutral-900 text-white',
    },
    {
      item: weeklyHighlights.festivalSpecial,
      product: festivalProduct,
      icon: <Tag className="w-4 h-4 text-white" />,
      accentBg: 'bg-neutral-950 text-white',
    },
  ];

  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-6">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400 mb-1">
            <Sparkles className="w-4 h-4 text-black" />
            <span>Curated Daily & Festive Offers</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">
            Special Highlights & Offers
          </h2>
        </div>
        <p className="text-xs text-neutral-500 max-w-sm">
          Handcrafted daily batches, weekly specials, and festival gift hampers delivered fresh.
        </p>
      </div>

      {/* 3 Large Highlight Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {highlightCards.map((card, idx) => {
          const { item, product, icon } = card;
          if (!product) return null;

          const defaultWeight = product.defaultWeight || product.weightOptions[0]?.weight || '500g';
          const defaultPrice = product.price;

          return (
            <div
              key={idx}
              className="group relative rounded-3xl overflow-hidden border border-neutral-200 bg-neutral-50 p-6 shadow-subtle hover:border-black transition-all flex flex-col justify-between min-h-[380px]"
            >
              {/* Background Image Container */}
              <div className="absolute inset-0 bg-neutral-100 z-0">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover opacity-25 group-hover:opacity-35 group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
              </div>

              {/* Top Badge & Discount Tag */}
              <div className="relative z-10 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 bg-black text-white text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full shadow-subtle">
                  {icon}
                  <span>{item.badgeText}</span>
                </span>

                {item.discountPercentage && item.discountPercentage > 0 && (
                  <span className="bg-neutral-900 text-white font-mono text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-subtle">
                    {item.discountPercentage}% OFF
                  </span>
                )}
              </div>

              {/* Middle Content */}
              <div className="relative z-10 space-y-2 pt-16">
                <span className="text-[10px] font-extrabold uppercase text-neutral-400 tracking-wider">
                  {product.category} • {product.isVeg ? '● Veg' : '▲ Non-Veg'}
                </span>
                <h3
                  onClick={() => navigate(`/product/${product.id}`)}
                  className="text-xl font-extrabold text-black tracking-tight cursor-pointer hover:underline line-clamp-2"
                >
                  {item.title || product.name}
                </h3>
                <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed font-medium">
                  {item.subtitle || product.description}
                </p>
              </div>

              {/* Bottom Price & CTAs */}
              <div className="relative z-10 pt-4 border-t border-neutral-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-neutral-400 font-bold block uppercase">Special Price ({defaultWeight})</span>
                  <span className="text-lg font-extrabold font-mono text-black">${defaultPrice.toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => addToCart(product, defaultWeight, 1)}
                    className="px-3.5 py-2.5 bg-black text-white text-xs font-bold rounded-2xl hover:bg-neutral-800 transition-all flex items-center gap-1.5 shadow-subtle"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Quick Add</span>
                  </button>
                  <button
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="p-2.5 bg-white border border-neutral-300 hover:border-black rounded-2xl transition-all"
                    title="View Details"
                  >
                    <ArrowRight className="w-4 h-4 text-black" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </section>
  );
};
