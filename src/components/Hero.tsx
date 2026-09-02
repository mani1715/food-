import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Clock, Award } from 'lucide-react';

interface HeroProps {
  onExploreClick: () => void;
  onHowItWorksClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onExploreClick,
  onHowItWorksClick,
}) => {
  return (
    <section id="hero" className="relative pt-6 pb-16 lg:py-20 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Split: Typography & CTAs */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-8 text-left"
          >
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-neutral-300 bg-neutral-50 text-xs font-semibold text-neutral-800">
              <span className="w-2 h-2 rounded-full bg-black animate-ping" />
              <span>Directly From Certified Neighborhood Kitchens</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-black tracking-tight leading-[1.06]">
              Authentic <span className="underline decoration-neutral-300 decoration-wavy underline-offset-8">Home-Cooked</span> Meals, Delivered Fresh.
            </h1>

            {/* Short Supporting Description */}
            <p className="text-base sm:text-xl text-neutral-600 font-normal max-w-2xl leading-relaxed">
              Experience grandmother recipes, clay-pot curries, and handcrafted bakery items prepared daily by verified home chefs in your city.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={onExploreClick}
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-black text-white text-base font-bold rounded-2xl hover:bg-neutral-800 transition-all shadow-elevated group active:scale-95"
              >
                <span>Explore Today’s Menu</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onHowItWorksClick}
                className="inline-flex items-center justify-center px-7 py-4 bg-white text-black text-base font-bold rounded-2xl border-2 border-black hover:bg-neutral-100 transition-all active:scale-95"
              >
                How It Works
              </button>
            </div>

            {/* Social Trust Metrics */}
            <div className="pt-6 border-t border-neutral-200 grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">500+</p>
                <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Verified Chefs</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">4.96 ★</p>
                <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Taste Rating</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">25 Min</p>
                <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Avg Express Time</p>
              </div>
            </div>
          </motion.div>

          {/* Right Split: Premium Food Visuals & Floating Cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Image Frame */}
              <div className="relative rounded-3xl overflow-hidden border border-neutral-200 shadow-modal aspect-[4/5]">
                <img
                  src="https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=1200&auto=format&fit=crop"
                  alt="Authentic Home Cooked Thali"
                  className="w-full h-full object-cover grayscale contrast-125 hover:scale-105 transition-transform duration-700"
                />
                {/* Monochrome overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-300">Featured Chef Creation</span>
                  <h3 className="text-xl font-bold text-white">Grandma Lakshmi’s Special Avakaya Thali</h3>
                  <p className="text-xs text-neutral-300">Prepared fresh at 10:30 AM in Jubilee Hills</p>
                </div>
              </div>

              {/* Floating Glass Card 1: Chef Rating */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-6 -left-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-neutral-200 shadow-modal flex items-center gap-3 hidden sm:flex"
              >
                <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1 text-black font-bold text-sm">
                    <Star className="w-4 h-4 fill-black text-black" />
                    <span>4.98 Master Rating</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">100% Hygiene Certified</p>
                </div>
              </motion.div>

              {/* Floating Glass Card 2: Express Delivery */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute -bottom-6 -right-4 sm:-right-6 bg-black text-white p-4 rounded-2xl border border-neutral-800 shadow-modal flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Hot & Fresh Express</p>
                  <p className="text-[11px] text-neutral-400">Insulated thermal delivery</p>
                </div>
              </motion.div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};
