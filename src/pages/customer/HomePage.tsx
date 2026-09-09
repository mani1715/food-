import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { WeeklyHighlightsShowcase } from '../../components/WeeklyHighlightsShowcase';
import { ProductCard } from '../../components/ProductCard';
import { RecentlyViewed } from '../../components/RecentlyViewed';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, MapPin, BookOpen, Flame, Heart, CheckCircle2, Award, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { HeroBannerSlide } from '../../types';

const heroSlides: HeroBannerSlide[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=1600&auto=format&fit=crop',
    badge: 'Handcrafted at Home with Pure Love',
    title: 'Authentic Home Flavors Made with Pure Resources & Passion.',
    subtitle: 'At AISHU FOODS, every pickle jar, sweet box, and spice powder is prepared at home using 100% natural ingredients, cold-pressed oils, and pure A2 cow ghee.',
    ctaText: 'Explore All Products',
    ctaLink: '/products',
    enabled: true,
    objectPosition: 'center',
    objectFit: 'cover',
    overlayOpacity: 'dark',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=1600&auto=format&fit=crop',
    badge: "Grandma's Special Recipe",
    title: 'Traditional Andhra Avakaya & Mouth-Watering Pickles.',
    subtitle: 'Aromatic Vijayawada raw mangoes marinated in stone-ground Guntur chili powder & Chekku sesame oil for that irresistible authentic taste.',
    ctaText: 'Shop Pickles Collection',
    ctaLink: '/products?category=Pickles',
    enabled: true,
    objectPosition: 'center',
    objectFit: 'cover',
    overlayOpacity: 'dark',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=1600&auto=format&fit=crop',
    badge: 'Pure A2 Cow Ghee Specialties',
    title: 'Authentic Sweets & Crunchy Homemade Snacks.',
    subtitle: 'Zero chemical preservatives, zero palm oil. Uncompromising quality & generous quantity at fair, budget-friendly prices.',
    ctaText: 'Explore Sweets & Snacks',
    ctaLink: '/products?category=Sweets',
    enabled: true,
    objectPosition: 'center',
    objectFit: 'cover',
    overlayOpacity: 'dark',
  },
];

export const HomePage: React.FC = () => {
  const { products, categories, homeSections, heroBanners } = useApp();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const activeHeroSlides =
    heroBanners && heroBanners.filter((b) => b.enabled).length > 0
      ? heroBanners.filter((b) => b.enabled)
      : heroSlides;

  // Auto-scrolling Hero Banner effect (scrolls every 3 seconds)
  useEffect(() => {
    if (activeHeroSlides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeHeroSlides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [activeHeroSlides.length]);

  const nextSlide = () => {
    if (activeHeroSlides.length === 0) return;
    setCurrentSlide((prev) => (prev + 1) % activeHeroSlides.length);
  };

  const prevSlide = () => {
    if (activeHeroSlides.length === 0) return;
    setCurrentSlide((prev) => (prev - 1 + activeHeroSlides.length) % activeHeroSlides.length);
  };

  const safeSlideIndex = currentSlide % (activeHeroSlides.length || 1);
  const currentBanner = activeHeroSlides[safeSlideIndex] || heroSlides[0];

  return (
    <div className="min-h-screen bg-white text-black font-sans space-y-10">
      
      {/* 1. AUTO-SCROLLING HERO BANNER AT THE TOP */}
      <section className="relative overflow-hidden bg-black text-white py-12 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-neutral-800 min-h-[460px] flex items-center">
        
        {/* Carousel Background Images with Custom Alignment & Fitting */}
        {activeHeroSlides.map((slide, index) => {
          const posClass =
            slide.objectPosition === 'top' ? 'object-top' :
            slide.objectPosition === 'bottom' ? 'object-bottom' :
            slide.objectPosition === 'left' ? 'object-left' :
            slide.objectPosition === 'right' ? 'object-right' :
            slide.objectPosition === 'top-left' ? '[object-position:left_top]' :
            slide.objectPosition === 'top-right' ? '[object-position:right_top]' :
            slide.objectPosition === 'bottom-left' ? '[object-position:left_bottom]' :
            slide.objectPosition === 'bottom-right' ? '[object-position:right_bottom]' : 'object-center';

          const fitClass =
            slide.objectFit === 'contain' ? 'object-contain' :
            slide.objectFit === 'fill' ? 'object-fill' : 'object-cover';

          const overlayClass =
            slide.overlayOpacity === 'light' ? 'from-black/60 via-black/40 to-black/20' :
            slide.overlayOpacity === 'medium' ? 'from-black/80 via-black/60 to-black/30' :
            slide.overlayOpacity === 'heavy' ? 'from-black via-black to-black/80' : 'from-black via-black/90 to-black/60';

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${
                index === safeSlideIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className={`w-full h-full ${fitClass} ${posClass} opacity-50 scale-105 transition-all duration-700`}
              />
              <div className={`absolute inset-0 bg-gradient-to-r ${overlayClass}`} />
            </div>
          );
        })}

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto w-full text-left space-y-6">
          
          {/* Top Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-subtle">
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
            <span>{currentBanner.badge}</span>
          </div>

          {/* Banner Main Headline & Subtitle */}
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight font-serif transition-all duration-500">
              {currentBanner.title}
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 font-medium leading-relaxed">
              {currentBanner.subtitle}
            </p>
          </div>

          {/* 4 Differentiator Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3 sm:p-3.5 rounded-2xl space-y-1 hover:border-amber-400 transition-all">
              <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>100% Pure & Natural</span>
              </div>
              <p className="text-[11px] text-neutral-300 font-medium">Zero preservatives or synthetic colors.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3 sm:p-3.5 rounded-2xl space-y-1 hover:border-amber-400 transition-all">
              <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs">
                <BookOpen className="w-4 h-4" />
                <span>Grandma's Recipe</span>
              </div>
              <p className="text-[11px] text-neutral-300 font-medium">Stone-ground spices & traditional curing.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3 sm:p-3.5 rounded-2xl space-y-1 hover:border-amber-400 transition-all">
              <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs">
                <Award className="w-4 h-4" />
                <span>Full Quantity & Value</span>
              </div>
              <p className="text-[11px] text-neutral-300 font-medium">Generous portions at honest prices.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-3 sm:p-3.5 rounded-2xl space-y-1 hover:border-amber-400 transition-all">
              <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs">
                <Zap className="w-4 h-4" />
                <span>Made Fresh on Order</span>
              </div>
              <p className="text-[11px] text-neutral-300 font-medium">Prepared in small hygienic batches.</p>
            </div>
          </div>

          {/* Hero Action Buttons & Slide Controls */}
          <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(currentBanner.ctaLink)}
                className="px-7 py-3.5 bg-white text-black text-xs font-black rounded-2xl hover:bg-neutral-200 transition-all flex items-center gap-2 shadow-modal cursor-pointer"
              >
                <span>{currentBanner.ctaText}</span>
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

            {/* Slide Navigation Dots & Prev/Next Arrows */}
            <div className="flex items-center gap-3 z-20">
              <button
                onClick={prevSlide}
                aria-label="Previous Slide"
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5">
                {activeHeroSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === safeSlideIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                aria-label="Next Slide"
                className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 2. EXPLORE CATEGORIES (3 ITEMS PER ROW GRID) */}
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

        {/* Category Grid (Responsive 2 cols on mobile, 3 on tablet/desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6 py-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => navigate(`/products?category=${encodeURIComponent(cat.name)}`)}
              className="group flex flex-col items-center cursor-pointer text-center space-y-2 py-1"
            >
              {/* 1:1 Aspect-Square Circle Photo Container */}
              <div className="w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 aspect-square rounded-full overflow-hidden border-2 sm:border-4 border-neutral-100 group-hover:border-black shadow-modal group-hover:scale-105 transition-all duration-300 bg-neutral-100 p-0.5">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-full group-hover:rotate-3 transition-transform duration-500"
                />
              </div>

              {/* Bold Title Underneath */}
              <span className="text-xs sm:text-sm font-extrabold text-black group-hover:underline leading-tight">
                {cat.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. DISCOUNTS & SPECIAL HIGHLIGHTS */}
      <WeeklyHighlightsShowcase />

      {/* 4. ITEMS DISPLAYING ONE BY ONE (DYNAMIC HOMEPAGE SHOWCASE SECTIONS) */}
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

    </div>
  );
};

