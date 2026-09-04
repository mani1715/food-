import React from 'react';
import { useApp } from '../../context/AppContext';
import { WeeklyHighlightsShowcase } from '../../components/WeeklyHighlightsShowcase';
import { ProductCard } from '../../components/ProductCard';
import { RecentlyViewed } from '../../components/RecentlyViewed';
import { NewsletterSection } from '../../components/NewsletterSection';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, MapPin, BookOpen, Flame, Heart, CheckCircle2, Award, Zap } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { products, categories, homeSections } = useApp();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-black font-sans space-y-10">
      
      {/* 1. HERO BANNER AT THE VERY TOP */}
      <section className="relative overflow-hidden bg-black text-white py-12 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-neutral-800">
        {/* Background Image Container with Soft Gradient Dark Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=1600&auto=format&fit=crop"
            alt="Aishu Foods Traditional Spices & Pickles"
            className="w-full h-full object-cover opacity-40 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-left space-y-8">
          
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-subtle">
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
            <span>Handcrafted at Home with Pure Love & Energy</span>
          </div>

          {/* Banner Main Headline & Subtitle */}
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight font-serif">
              Authentic Home Flavors Made with Pure Resources & Passion.
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 font-medium leading-relaxed">
              At <strong className="text-white font-black">AISHU FOODS</strong>, every pickle jar, sweet box, and spice powder is prepared at home using 100% natural ingredients, cold-pressed oils, stone-ground spices, and pure A2 cow ghee. <span className="text-amber-400 font-bold">Uncompromising quality & generous quantity at fair, affordable prices.</span>
            </p>
          </div>

          {/* 4 Differentiator Cards Grid (What Makes Us Different) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
            
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3.5 sm:p-4 rounded-2xl space-y-1.5 hover:border-amber-400 transition-all">
              <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>100% Pure & Natural</span>
              </div>
              <p className="text-[11px] text-neutral-300 font-medium">Zero chemical preservatives, synthetic colors or palm oil.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3.5 sm:p-4 rounded-2xl space-y-1.5 hover:border-amber-400 transition-all">
              <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs">
                <BookOpen className="w-4 h-4" />
                <span>Grandma's Recipe</span>
              </div>
              <p className="text-[11px] text-neutral-300 font-medium">Stone-ground spices & authentic traditional Andhra curing.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3.5 sm:p-4 rounded-2xl space-y-1.5 hover:border-amber-400 transition-all">
              <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs">
                <Award className="w-4 h-4" />
                <span>Full Quantity & Value</span>
              </div>
              <p className="text-[11px] text-neutral-300 font-medium">Generous portion sizes at honest, budget-friendly prices.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3.5 sm:p-4 rounded-2xl space-y-1.5 hover:border-amber-400 transition-all">
              <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs">
                <Zap className="w-4 h-4" />
                <span>Made Fresh on Order</span>
              </div>
              <p className="text-[11px] text-neutral-300 font-medium">Prepared in small hygienic batches with positive energy.</p>
            </div>

          </div>

          {/* Hero Action Buttons */}
          <div className="flex items-center flex-wrap gap-3 pt-2">
            <button
              onClick={() => navigate('/products')}
              className="px-7 py-3.5 bg-white text-black text-xs font-black rounded-2xl hover:bg-neutral-200 transition-all flex items-center gap-2 shadow-modal cursor-pointer"
            >
              <span>Explore All Products</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/our-process')}
              className="px-6 py-3.5 bg-neutral-900 border border-neutral-700 hover:border-white text-white text-xs font-black rounded-2xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>How We Do</span>
              <span>📜</span>
            </button>
          </div>

        </div>
      </section>

      {/* 2. SPECIAL HIGHLIGHTS & OFFERS (SECOND SECTION ON HOMEPAGE) */}
      <WeeklyHighlightsShowcase />

      {/* 3. CATEGORIES BAR WITH ANIMATED SMALL PHOTOS */}
      <section className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight">Explore Categories</h2>
            <p className="text-xs text-neutral-500 font-medium">Tap to view authentic homemade specialties by category.</p>
          </div>
          <button
            onClick={() => navigate('/categories')}
            className="text-xs font-extrabold text-black hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({categories.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Animated Category Small Photos Horizontal Grid */}
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => navigate(`/products?category=${encodeURIComponent(cat.name)}`)}
              className="group flex flex-col items-center gap-2 cursor-pointer shrink-0"
            >
              {/* Animated Small Circle Photo */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-neutral-200 group-hover:border-black shadow-subtle group-hover:scale-110 transition-all duration-300 bg-neutral-100 p-0.5">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-full group-hover:rotate-3 transition-transform duration-500"
                />
              </div>
              <span className="text-xs font-extrabold text-black group-hover:underline text-center">
                {cat.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. DYNAMIC HOMEPAGE SHOWCASE SECTIONS (Best Selling, Pickles Collection, Authentic Sweets, etc.) */}
      {homeSections
        .filter((sec) => sec.enabled)
        .map((sec) => {
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
            <section key={sec.id} className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-6">
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

              {/* Mobile Friendly Grid: Exactly 2 Items Per Row on Mobile (`grid-cols-2 gap-3`) */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {sectionProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          );
        })}

      {/* 5. BRAND PROCESS & QUALITY PROMISE BANNER */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
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
                  <span>How We Do</span>
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
