import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Tag, ArrowRight, ShoppingBag, Star, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const WeeklyHighlightsShowcase: React.FC = () => {
  const { products, weeklyHighlights, addToCart } = useApp();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const getProduct = (id: string) => {
    return products.find((p) => p.id === id) || products[0];
  };

  const slides = [
    {
      type: 'day',
      badgeText: weeklyHighlights.specialOfDay.badgeText || "TODAY'S HOT SPECIAL",
      icon: <Flame className="w-4 h-4 text-amber-400" />,
      title: weeklyHighlights.specialOfDay.title,
      subtitle: weeklyHighlights.specialOfDay.subtitle,
      discount: weeklyHighlights.specialOfDay.discountPercentage,
      product: getProduct(weeklyHighlights.specialOfDay.productId),
      bgClass: 'bg-black text-white border-neutral-800',
    },
    {
      type: 'week',
      badgeText: weeklyHighlights.specialOfWeek.badgeText || "WEEKLY HIGHLIGHT",
      icon: <Star className="w-4 h-4 text-black" />,
      title: weeklyHighlights.specialOfWeek.title,
      subtitle: weeklyHighlights.specialOfWeek.subtitle,
      discount: weeklyHighlights.specialOfWeek.discountPercentage,
      product: getProduct(weeklyHighlights.specialOfWeek.productId),
      bgClass: 'bg-neutral-900 text-white border-neutral-700',
    },
    {
      type: 'festival',
      badgeText: weeklyHighlights.festivalSpecial.badgeText || "FESTIVAL HAMPER",
      icon: <Tag className="w-4 h-4 text-amber-400" />,
      title: weeklyHighlights.festivalSpecial.title,
      subtitle: weeklyHighlights.festivalSpecial.subtitle,
      discount: weeklyHighlights.festivalSpecial.discountPercentage,
      product: getProduct(weeklyHighlights.festivalSpecial.productId),
      bgClass: 'bg-neutral-950 text-white border-neutral-800',
    },
  ];

  // Auto-advance slide every 5 seconds
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const activeSlide = slides[currentSlide];
  const activeProduct = activeSlide.product;

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
          Handcrafted daily batches, weekly specials, and festival gift hampers prepared fresh and delivered fast.
        </p>
      </div>

      {/* Interactive Sliding Carousel Container */}
      <div
        className="relative rounded-3xl overflow-hidden shadow-modal border border-neutral-800 min-h-[380px] sm:min-h-[420px] transition-all duration-500"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {activeProduct && (
          <div key={currentSlide} className={`relative p-6 sm:p-10 ${activeSlide.bgClass} min-h-[380px] sm:min-h-[420px] flex flex-col justify-between transition-all duration-700 animate-fadeIn`}>
            
            {/* Background Image Overlay */}
            <div className="absolute inset-0 z-0">
              <img
                src={activeProduct.image}
                alt={activeProduct.name}
                className="w-full h-full object-cover opacity-35 scale-105 transition-all duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/40" />
            </div>

            {/* Slide Top Bar: Badge & Discount */}
            <div className="relative z-10 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 bg-white text-black text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-modal">
                {activeSlide.icon}
                <span>{activeSlide.badgeText}</span>
              </span>

              {activeSlide.discount && activeSlide.discount > 0 && (
                <span className="bg-amber-400 text-black font-mono text-xs font-black uppercase px-3 py-1.5 rounded-full shadow-modal">
                  {activeSlide.discount}% SPECIAL DISCOUNT
                </span>
              )}
            </div>

            {/* Slide Middle Content */}
            <div className="relative z-10 space-y-3 my-6 max-w-2xl">
              <span className="text-xs font-extrabold uppercase text-amber-400 tracking-widest block">
                {activeProduct.category} • {activeProduct.isVeg ? '● 100% Pure Veg' : '▲ Non-Veg Special'}
              </span>
              <h3
                onClick={() => navigate(`/product/${activeProduct.id}`)}
                className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight cursor-pointer hover:underline"
              >
                {activeSlide.title || activeProduct.name}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 line-clamp-2 leading-relaxed font-medium">
                {activeSlide.subtitle || activeProduct.description}
              </p>
            </div>

            {/* Slide Bottom Bar: Price & CTA Action Buttons */}
            <div className="relative z-10 pt-4 border-t border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-black font-mono text-white">₹{activeProduct.price}</span>
                <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">Per {activeProduct.defaultWeight || '500g'} Jar</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => addToCart(activeProduct, activeProduct.defaultWeight || '500g', 1)}
                  className="px-6 py-3 bg-white text-black text-xs font-black rounded-2xl hover:bg-neutral-200 transition-all flex items-center gap-2 shadow-subtle cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-black" />
                  <span>Add to Cart</span>
                </button>
                <button
                  onClick={() => navigate(`/product/${activeProduct.id}`)}
                  className="px-5 py-3 bg-neutral-900 border border-neutral-700 hover:border-white text-white text-xs font-extrabold rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Explore Offer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Next / Prev Nav Controls */}
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer backdrop-blur-sm"
              title="Previous Offer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer backdrop-blur-sm"
              title="Next Offer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Slide Dot Indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    currentSlide === idx ? 'w-8 bg-amber-400' : 'w-2 bg-white/40 hover:bg-white'
                  }`}
                />
              ))}
            </div>

          </div>
        )}
      </div>

    </section>
  );
};
