import React, { useState } from 'react';
import { MOCK_TESTIMONIALS } from '../data/mockData';
import { Star, ChevronLeft, ChevronRight, Quote, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CustomerTestimonials: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? MOCK_TESTIMONIALS.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % MOCK_TESTIMONIALS.length);
  };

  const activeTestimonial = MOCK_TESTIMONIALS[currentIndex];

  return (
    <section className="py-20 bg-neutral-50 border-b border-neutral-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Verified Reviews</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight mt-1">
              Loved by Food Enthusiasts
            </h2>
          </div>

          {/* Carousel Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrev}
              className="p-3 rounded-2xl border border-neutral-300 bg-white hover:bg-black hover:text-white transition-all shadow-subtle active:scale-95"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-mono font-bold text-neutral-500">
              0{currentIndex + 1} / 0{MOCK_TESTIMONIALS.length}
            </span>
            <button
              onClick={handleNext}
              className="p-3 rounded-2xl border border-neutral-300 bg-white hover:bg-black hover:text-white transition-all shadow-subtle active:scale-95"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Testimonial Card */}
        <div className="relative max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTestimonial.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
              className="bg-white border border-neutral-200 rounded-3xl p-8 sm:p-12 shadow-modal relative"
            >
              <Quote className="w-16 h-16 text-neutral-200 absolute top-8 right-8 stroke-[1]" />

              <div className="space-y-6 relative z-10 text-left">
                {/* Rating Stars */}
                <div className="flex items-center gap-1">
                  {[...Array(activeTestimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-black text-black" />
                  ))}
                </div>

                {/* Review Quote */}
                <p className="text-lg sm:text-2xl font-semibold text-black leading-relaxed italic">
                  "{activeTestimonial.review}"
                </p>

                {/* User Info Footer */}
                <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={activeTestimonial.avatar}
                      alt={activeTestimonial.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-subtle"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-extrabold text-black">{activeTestimonial.name}</h4>
                        {activeTestimonial.verifiedBuyer && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-neutral-100 text-black px-2 py-0.5 rounded-full border border-neutral-200">
                            <ShieldCheck className="w-3 h-3 text-black" />
                            Verified Order
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500">{activeTestimonial.role}</p>
                    </div>
                  </div>

                  <div className="text-xs text-neutral-400 font-mono">
                    Ordered from: <span className="font-bold text-black">{activeTestimonial.chefOrderedFrom}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};
