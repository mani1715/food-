import React from 'react';
import { ChefHat, ShieldCheck, Tag, Sparkles, Layers, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

export const WhyChooseUs: React.FC = () => {
  const features = [
    {
      num: '01',
      title: 'Home-Cooked Authentic Quality',
      subtitle: 'No commercial additives or reused frying oils.',
      description: 'Meals prepared in home clay pots and cast iron pans using ancestral family recipes passed down across generations.',
      icon: <ChefHat className="w-6 h-6 text-black" />,
      image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=800&auto=format&fit=crop',
    },
    {
      num: '02',
      title: 'Audited & Trusted Home Chefs',
      subtitle: 'Rigorous 5-step background & safety checks.',
      description: 'Every partner kitchen undergoes quarterly food hygiene audits, water purity testing, and ingredient verification.',
      icon: <ShieldCheck className="w-6 h-6 text-black" />,
      image: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?q=80&w=800&auto=format&fit=crop',
    },
    {
      num: '03',
      title: 'Transparent & Affordable Pricing',
      subtitle: 'Direct home kitchen to table value.',
      description: 'No inflated restaurant markups or hidden service platform fees. Pure home comfort food at honest prices.',
      icon: <Tag className="w-6 h-6 text-black" />,
      image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=800&auto=format&fit=crop',
    },
    {
      num: '04',
      title: 'Fresh Daily Meal Subscriptions',
      subtitle: 'Pre-order your daily lunch or dinner schedule.',
      description: 'Never worry about daily cooking again. Set up weekly recurring home meal deliveries delivered on your exact time.',
      icon: <Sparkles className="w-6 h-6 text-black" />,
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop',
    },
    {
      num: '05',
      title: 'Multiple Food & Regional Options',
      subtitle: 'From Andhra spice to North Awadhi thalis.',
      description: 'Explore over 30 regional Indian micro-cuisines and artisanal bakery specialties from diverse neighborhood cooks.',
      icon: <Layers className="w-6 h-6 text-black" />,
      image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=800&auto=format&fit=crop',
    },
    {
      num: '06',
      title: 'Convenient One-Tap Ordering',
      subtitle: 'Instant search, live thermal tracking & WhatsApp order support.',
      description: 'Enjoy Apple-level simple mobile ordering with live kitchen prep milestones and instant customer support.',
      icon: <Smartphone className="w-6 h-6 text-black" />,
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=800&auto=format&fit=crop',
    },
  ];

  return (
    <section className="py-20 bg-neutral-50 border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">The Aura Distinction</span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-black tracking-tight">
            Why Choose Our Home Food Marketplace
          </h2>
          <p className="text-sm text-neutral-600 pt-2">
            Redefining how urban households experience authentic, nutritious, and soul-satisfying daily home meals.
          </p>
        </div>

        {/* Alternating Feature Blocks */}
        <div className="space-y-16 lg:space-y-24">
          {features.map((feat, idx) => {
            const isReverse = idx % 2 !== 0;
            return (
              <div
                key={idx}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center ${
                  isReverse ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Text Content */}
                <motion.div
                  initial={{ opacity: 0, x: isReverse ? 30 : -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className={`lg:col-span-6 space-y-6 text-left ${
                    isReverse ? 'lg:order-2' : 'lg:order-1'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-extrabold font-mono text-black">{feat.num}</span>
                    <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 shadow-subtle flex items-center justify-center">
                      {feat.icon}
                    </div>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight leading-tight">
                    {feat.title}
                  </h3>

                  <p className="text-sm font-bold text-neutral-900">
                    {feat.subtitle}
                  </p>

                  <p className="text-sm text-neutral-600 leading-relaxed max-w-xl">
                    {feat.description}
                  </p>
                </motion.div>

                {/* Image Visual */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className={`lg:col-span-6 ${
                    isReverse ? 'lg:order-1' : 'lg:order-2'
                  }`}
                >
                  <div className="rounded-3xl overflow-hidden border border-neutral-200 shadow-modal aspect-[16/10] bg-neutral-200 group">
                    <img
                      src={feat.image}
                      alt={feat.title}
                      className="w-full h-full object-cover grayscale contrast-125 group-hover:scale-105 group-hover:grayscale-0 transition-all duration-700"
                    />
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
