import React, { useState, useEffect, useRef } from 'react';
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

  const categoriesScrollRef = useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoriesScrollRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      categoriesScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans space-y-10">
      
      {/* 1. HERO BANNER - SCENIC FULL-BLEED WITH DIRECT CLICK REDIRECTION & ADJUSTABLE ZOOM */}
      <section
        onClick={() => navigate(currentBanner.ctaLink || '/products')}
        className="relative overflow-hidden bg-black text-white min-h-[460px] sm:min-h-[540px] lg:min-h-[600px] flex items-center justify-center border-b border-neutral-800 cursor-pointer group"
      >
        
        {/* Carousel Background Images with High Clarity & Adjustable Zoom */}
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

          const zoomScale = typeof slide.imageScale === 'number' ? slide.imageScale : (Number(slide.imageScale) || 1);
          const panX = typeof slide.panOffsetX === 'number' ? slide.panOffsetX : (Number(slide.panOffsetX) || 0);
          const panY = typeof slide.panOffsetY === 'number' ? slide.panOffsetY : (Number(slide.panOffsetY) || 0);

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 z-0 overflow-hidden transition-opacity duration-1000 ease-in-out ${
                index === safeSlideIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                style={{
                  transform: `translate(${panX}px, ${panY}px) scale(${zoomScale})`,
                  transformOrigin: 'center center',
                }}
                className={`w-full h-full ${fitClass} ${posClass} opacity-85 transition-transform duration-700`}
              />
              {/* Subtle dark gradient overlay for text readability while keeping photo rich & clear */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/20 pointer-events-none" />
            </div>
          );
        })}

        {/* Hero Content Container (Centered Title, Subtitle, and Shop Now CTA) */}
        <div className="relative z-10 max-w-4xl mx-auto w-full text-center px-4 sm:px-6 py-16 sm:py-24 space-y-6">
          
          {/* Badge */}
          {currentBanner.badge && (
            <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/20 text-white text-[11px] sm:text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentBanner.badge}</span>
            </div>
          )}

          {/* Banner Main Headline (Clean, Large, Centered) */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white drop-shadow-lg leading-tight">
              {currentBanner.title}
            </h1>
            {currentBanner.subtitle && (
              <p className="text-sm sm:text-base lg:text-lg text-white/90 font-normal max-w-2xl mx-auto drop-shadow leading-relaxed">
                {currentBanner.subtitle}
              </p>
            )}
          </div>

          {/* Centered Shop Now Pill Button */}
          <div className="pt-2 flex items-center justify-center gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(currentBanner.ctaLink || '/products');
              }}
              className="px-8 sm:px-10 py-3 sm:py-3.5 bg-neutral-900/85 hover:bg-black backdrop-blur-md text-white font-bold text-sm sm:text-base rounded-full shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer border border-white/20"
            >
              <span>{currentBanner.ctaText || 'Shop Now'}</span>
            </button>
          </div>

        </div>

        {/* Bottom-Right Carousel Preview Widget (matching reference photo) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-4 right-4 sm:bottom-6 sm:right-8 z-20 flex items-center bg-black/80 backdrop-blur-md border border-white/15 rounded-xl overflow-hidden shadow-2xl"
        >
          {/* Left / Prev Arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
            aria-label="Previous Slide"
            className="p-3 sm:p-3.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Next Slide Thumbnail Preview */}
          {activeHeroSlides.length > 1 && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              className="cursor-pointer group flex items-center gap-2.5 px-3 py-1.5 border-l border-r border-white/15 hover:bg-white/10 transition-all"
              title="Next Slide"
            >
              <div className="w-12 h-8 sm:w-14 sm:h-9 rounded-md overflow-hidden bg-neutral-800 shrink-0 border border-white/20">
                <img
                  src={activeHeroSlides[(safeSlideIndex + 1) % activeHeroSlides.length]?.image}
                  alt="Next slide"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="hidden md:block text-left text-[11px] leading-tight pr-1">
                <span className="text-white/50 block text-[9px] uppercase font-bold tracking-wider">Next</span>
                <span className="text-white font-medium line-clamp-1 max-w-[100px]">
                  {activeHeroSlides[(safeSlideIndex + 1) % activeHeroSlides.length]?.title}
                </span>
              </div>
            </div>
          )}

          {/* Right / Next Arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
            aria-label="Next Slide"
            className="p-3 sm:p-3.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Center Slide Dots */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5"
        >
          {activeHeroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide(idx);
              }}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === safeSlideIndex ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

      </section>

      {/* 2. EXPLORE CATEGORIES (SIDE-BY-SIDE HORIZONTAL SCROLL) */}
      <section className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight">Explore Categories</h2>
            <p className="text-xs text-neutral-500 font-medium">Scroll horizontally to explore authentic homemade specialties.</p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Scroll Left Button */}
            <button
              onClick={() => scrollCategories('left')}
              className="p-2 rounded-full border border-neutral-300 hover:bg-black hover:text-white transition-colors cursor-pointer text-black"
              title="Scroll Left"
              aria-label="Scroll Categories Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {/* Scroll Right Button */}
            <button
              onClick={() => scrollCategories('right')}
              className="p-2 rounded-full border border-neutral-300 hover:bg-black hover:text-white transition-colors cursor-pointer text-black"
              title="Scroll Right"
              aria-label="Scroll Categories Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/categories')}
              className="text-xs font-extrabold text-black hover:underline flex items-center gap-1 cursor-pointer pl-1 sm:pl-2"
            >
              <span className="hidden sm:inline">View All</span>
              <span>({categories.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Categories Side-by-Side Horizontal Scroll Container (Single Line, Large Visibility) */}
        <div
          ref={categoriesScrollRef}
          className="flex flex-nowrap items-start gap-4 sm:gap-6 md:gap-8 overflow-x-auto no-scrollbar scroll-smooth py-4 px-1 snap-x w-full"
        >
          {categories.map((cat) => {
            const zoomScale = typeof cat.imageScale === 'number' ? cat.imageScale : (Number(cat.imageScale) || 1);
            const panX = typeof cat.panOffsetX === 'number' ? cat.panOffsetX : (Number(cat.panOffsetX) || 0);
            const panY = typeof cat.panOffsetY === 'number' ? cat.panOffsetY : (Number(cat.panOffsetY) || 0);

            return (
              <div
                key={cat.id}
                onClick={() => navigate(`/products?category=${encodeURIComponent(cat.name)}`)}
                className="group flex flex-col items-center cursor-pointer text-center space-y-2.5 shrink-0 flex-shrink-0 snap-start select-none w-28 sm:w-36 md:w-44 transition-transform duration-200"
              >
                {/* Circular Photo Container (Big Size) */}
                <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 aspect-square rounded-full overflow-hidden border-3 sm:border-4 border-neutral-200 group-hover:border-black shadow-md group-hover:shadow-xl group-hover:scale-105 transition-all duration-300 bg-neutral-100 p-0.5 relative">
                  <img
                    src={cat.image || 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=400&auto=format&fit=crop'}
                    alt={cat.name}
                    style={{
                      transform: `translate(${panX}px, ${panY}px) scale(${zoomScale})`,
                      transformOrigin: 'center center',
                    }}
                    className="w-full h-full object-cover rounded-full transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=400&auto=format&fit=crop';
                    }}
                  />
                </div>

                {/* Bold Title & Count Underneath */}
                <div className="w-full px-1">
                  <span className="text-sm sm:text-base font-black text-black group-hover:underline leading-tight block truncate">
                    {cat.name}
                  </span>
                  {cat.itemCount !== undefined && cat.itemCount > 0 && (
                    <span className="text-xs text-neutral-500 font-semibold block mt-1">
                      {cat.itemCount} items
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. DISCOUNTS & SPECIAL HIGHLIGHTS */}
      <WeeklyHighlightsShowcase />

      {/* 4. ITEMS DISPLAYING ONE BY ONE (DYNAMIC HOMEPAGE SHOWCASE SECTIONS) */}
      {homeSections
        .filter((sec) => sec.enabled)
        .map((sec) => {
          // 1. If admin explicitly assigned products, strictly use them in that order
          let sectionProducts = (sec.productIds || [])
            .map((id) => products.find((p) => p.id === id))
            .filter((p): p is typeof products[0] => Boolean(p && !p.isHidden));

          // 2. If no products were explicitly assigned, apply intelligent category & festival fallbacks
          if (sectionProducts.length === 0) {
            if (sec.categoryFilter && sec.categoryFilter !== 'all') {
              sectionProducts = products.filter(
                (p) => !p.isHidden && p.category.toLowerCase().trim() === (sec.categoryFilter || '').toLowerCase().trim()
              );
            } else if (sec.id === 'sec-festival' || sec.title.toLowerCase().includes('festival') || sec.title.toLowerCase().includes('festive') || (sec.badge && sec.badge.toLowerCase().includes('festiv'))) {
              const festivalProducts = products.filter((p) => !p.isHidden && p.isFestival);
              sectionProducts = festivalProducts.length > 0
                ? festivalProducts
                : products.filter((p) => !p.isHidden && (p.category.toLowerCase() === 'sweets' || p.category.toLowerCase() === 'snacks')).slice(0, 4);
            } else if (sec.id === 'sec-bestsellers' || sec.title.toLowerCase().includes('best selling') || sec.title.toLowerCase().includes('featured') || (sec.badge && sec.badge.toLowerCase().includes('favorite'))) {
              const bestProducts = products.filter((p) => !p.isHidden && p.isBestSeller);
              sectionProducts = bestProducts.length > 0 ? bestProducts : products.filter((p) => !p.isHidden).slice(0, 4);
            } else if (sec.title.toLowerCase().includes('pickle')) {
              sectionProducts = products.filter((p) => !p.isHidden && p.category.toLowerCase() === 'pickles');
            } else if (sec.title.toLowerCase().includes('sweet')) {
              sectionProducts = products.filter((p) => !p.isHidden && p.category.toLowerCase() === 'sweets');
            } else if (sec.title.toLowerCase().includes('snack') || sec.title.toLowerCase().includes('savor')) {
              sectionProducts = products.filter((p) => !p.isHidden && p.category.toLowerCase() === 'snacks');
            } else {
              sectionProducts = products.filter((p) => !p.isHidden).slice(0, 4);
            }
          }

          if (sectionProducts.length === 0) return null;

          const getViewAllLink = () => {
            if (sec.categoryFilter && sec.categoryFilter !== 'all') {
              return `/products?category=${encodeURIComponent(sec.categoryFilter)}`;
            }
            if (sec.id === 'sec-festival' || sec.title.toLowerCase().includes('festival') || sec.title.toLowerCase().includes('festive')) {
              return '/products?filter=festival';
            }
            if (sec.id === 'sec-bestsellers' || sec.title.toLowerCase().includes('best selling')) {
              return '/products?filter=bestsellers';
            }
            if (sec.title.toLowerCase().includes('pickle')) return '/products?category=Pickles';
            if (sec.title.toLowerCase().includes('sweet')) return '/products?category=Sweets';
            if (sec.title.toLowerCase().includes('snack')) return '/products?category=Snacks';
            return '/products';
          };

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
                  onClick={() => navigate(getViewAllLink())}
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

