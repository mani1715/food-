import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from './ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const RecentlyViewed: React.FC = () => {
  const { products, recentlyViewedIds } = useApp();
  const scrollRef = useRef<HTMLDivElement>(null);

  const recentProducts = products.filter((p) => !p.isHidden && recentlyViewedIds.includes(p.id)).slice(0, 10);

  if (recentProducts.length === 0) return null;

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -Math.max(scrollRef.current.clientWidth * 0.75, 300) : Math.max(scrollRef.current.clientWidth * 0.75, 300);
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-6 border-t border-neutral-200">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Browsing History</span>
          <h2 className="text-2xl font-extrabold text-black tracking-tight mt-0.5">Recently Viewed Products</h2>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => handleScroll('left')}
            className="p-2 rounded-full border border-neutral-300 hover:bg-black hover:text-white transition-colors cursor-pointer text-black"
            title="Scroll Left"
            aria-label="Scroll Recently Viewed Left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            className="p-2 rounded-full border border-neutral-300 hover:bg-black hover:text-white transition-colors cursor-pointer text-black"
            title="Scroll Right"
            aria-label="Scroll Recently Viewed Right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative group/recently w-full">
        {/* Floating Left Arrow */}
        <button
          onClick={() => handleScroll('left')}
          className="absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/95 text-black hover:bg-black hover:text-white border border-neutral-300 shadow-xl flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
          title="Scroll Left"
          aria-label="Scroll Recently Viewed Left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 sm:gap-6 pb-4 no-scrollbar scroll-smooth snap-x snap-mandatory"
        >
          {recentProducts.map((prod) => (
            <div key={prod.id} className="w-[235px] sm:w-[280px] md:w-[295px] lg:w-[310px] shrink-0 snap-start">
              <ProductCard product={prod} />
            </div>
          ))}
        </div>

        {/* Floating Right Arrow */}
        <button
          onClick={() => handleScroll('right')}
          className="absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/95 text-black hover:bg-black hover:text-white border border-neutral-300 shadow-xl flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
          title="Scroll Right"
          aria-label="Scroll Recently Viewed Right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};
