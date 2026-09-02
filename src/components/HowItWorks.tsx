import React from 'react';
import { Search, ChefHat, ShoppingBag, Smile } from 'lucide-react';
import { motion } from 'framer-motion';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Browse Food',
      description: 'Explore today’s freshly curated home kitchen menus, thalis, and artisan baked goods.',
      icon: <Search className="w-6 h-6 text-black stroke-[1.5]" />,
    },
    {
      step: '02',
      title: 'Choose Home Chef',
      description: 'Review chef hygiene ratings, cooking experience, and ancestral regional specialties.',
      icon: <ChefHat className="w-6 h-6 text-black stroke-[1.5]" />,
    },
    {
      step: '03',
      title: 'Place Order',
      description: 'Select your preferred delivery window and customize dietary requirements in one click.',
      icon: <ShoppingBag className="w-6 h-6 text-black stroke-[1.5]" />,
    },
    {
      step: '04',
      title: 'Enjoy Fresh Meal',
      description: 'Unpack your piping hot, clay-pot sealed home cooked food delivered in eco insulated containers.',
      icon: <Smile className="w-6 h-6 text-black stroke-[1.5]" />,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Simple & Seamless</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
            How Aura Works
          </h2>
          <p className="text-sm text-neutral-500">
            From neighborhood kitchen stoves to your dining table in 4 effortless steps.
          </p>
        </div>

        {/* 4 Step Grid / Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Subtle connecting line for desktop */}
          <div className="hidden lg:block absolute top-1/2 left-12 right-12 h-[2px] bg-neutral-200 -translate-y-6 z-0" />

          {steps.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="relative z-10 bg-white border border-neutral-200 rounded-3xl p-6 shadow-subtle hover:border-black hover:shadow-elevated transition-all flex flex-col items-center text-center space-y-4 group"
            >
              {/* Step Badge & Icon */}
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-neutral-50 border border-neutral-200 shadow-subtle flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                  <div className="group-hover:text-white transition-colors">{item.icon}</div>
                </div>
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-black text-white text-xs font-extrabold font-mono flex items-center justify-center border-2 border-white shadow-subtle">
                  {item.step}
                </span>
              </div>

              <h3 className="text-lg font-extrabold text-black tracking-tight">{item.title}</h3>
              <p className="text-xs text-neutral-600 leading-relaxed max-w-xs">{item.description}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
