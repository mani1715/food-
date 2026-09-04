import React from 'react';
import { useApp } from '../../context/AppContext';
import { WeeklyHighlightsShowcase } from '../../components/WeeklyHighlightsShowcase';
import { ProductCard } from '../../components/ProductCard';
import { RecentlyViewed } from '../../components/RecentlyViewed';
import { NewsletterSection } from '../../components/NewsletterSection';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, MapPin, BookOpen, Flame } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { products, homeSections } = useApp();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-black font-sans space-y-4">
      
      {/* 1. SPECIAL ITEMS FIRST */}
      <WeeklyHighlightsShowcase />

      {/* 2. DYNAMIC HOMEPAGE SHOWCASE SECTIONS (Best Selling, Pickles Collection, Authentic Sweets, etc.) */}
      {homeSections
        .filter((sec) => sec.enabled)
        .map((sec) => {
          // Get products assigned to section
          const sectionProducts = products.filter((p) => {
            if (sec.productIds && sec.productIds.length > 0) {
              return sec.productIds.includes(p.id);
            }
            if (sec.categoryFilter && sec.categoryFilter !== 'all') {
              return p.category.toLowerCase() === sec.categoryFilter.toLowerCase();
            }
            return true;
          });

          if (sectionProducts.length === 0) return null;

          return (
            <section key={sec.id} className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200 pb-4">
                <div>
                  {sec.badge && (
                    <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-neutral-400">
                      <Flame className="w-4 h-4 text-black" />
                      <span>{sec.badge}</span>
                    </div>
                  )}
                  <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-1">{sec.title}</h2>
                  {sec.subtitle && <p className="text-xs text-neutral-500 font-medium mt-1">{sec.subtitle}</p>}
                </div>

                <button
                  onClick={() =>
                    navigate(
                      sec.categoryFilter && sec.categoryFilter !== 'all'
                        ? `/products?category=${encodeURIComponent(sec.categoryFilter)}`
                        : '/products'
                    )
                  }
                  className="text-xs font-extrabold text-black hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer shrink-0"
                >
                  <span>View All ({sectionProducts.length})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Product Card Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {sectionProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          );
        })}

      {/* 3. BRAND PROCESS & QUALITY PROMISE QUICK BANNER (LEADS TO DEDICATED PAGES) */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
        <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-subtle space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-black" />
                <span>Our Heritage & Cleanliness Standards</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-1">
                How We Craft & Guarantee Our Foods
              </h2>
            </div>

            <p className="text-xs text-neutral-500 max-w-sm font-medium">
              Explore our traditional 5-step grandmother process, regional spice origins, and 100% preservative-free quality guarantee.
            </p>
          </div>

          {/* 3 Interactive Cards Leading to Dedicated Standalone Pages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => navigate('/our-process')}
              className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-subtle hover:border-black transition-all cursor-pointer space-y-3 group"
            >
              <div className="p-3 bg-neutral-100 rounded-xl w-fit">
                <BookOpen className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-black group-hover:underline flex items-center justify-between">
                  <span>Our Heritage Process</span>
                  <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-neutral-500 font-medium mt-1">
                  5-Step grandmother recipe process: fresh produce, sun-curing, stone grinding & earthen jar maturation.
                </p>
              </div>
            </div>

            <div
              onClick={() => navigate('/sourcing')}
              className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-subtle hover:border-black transition-all cursor-pointer space-y-3 group"
            >
              <div className="p-3 bg-neutral-100 rounded-xl w-fit">
                <MapPin className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-black group-hover:underline flex items-center justify-between">
                  <span>Regional Sourcing</span>
                  <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-neutral-500 font-medium mt-1">
                  Direct farm traceability: Vijayawada raw mangoes, Guntur chillies, Chekku sesame oil & A2 Bilona ghee.
                </p>
              </div>
            </div>

            <div
              onClick={() => navigate('/quality-promise')}
              className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-subtle hover:border-black transition-all cursor-pointer space-y-3 group"
            >
              <div className="p-3 bg-neutral-100 rounded-xl w-fit">
                <ShieldCheck className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-black group-hover:underline flex items-center justify-between">
                  <span>Quality Guarantee</span>
                  <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                </h3>
                <p className="text-xs text-neutral-500 font-medium mt-1">
                  0% artificial preservatives, synthetic colors or palm oil. 100% natural homemade purity guaranteed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recently Viewed */}
      <RecentlyViewed />

      {/* Newsletter Subscription */}
      <NewsletterSection />

    </div>
  );
};
