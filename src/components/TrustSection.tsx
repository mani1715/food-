import React from 'react';
import { ShieldCheck, Utensils, Leaf, Truck } from 'lucide-react';
import { motion } from 'framer-motion';

export const TrustSection: React.FC = () => {
  const trustItems = [
    {
      icon: <ShieldCheck className="w-8 h-8 text-black stroke-[1.5]" />,
      title: 'Verified Home Chefs',
      description: '100% background-checked, hygiene-certified home kitchens audited by food safety experts.',
    },
    {
      icon: <Utensils className="w-8 h-8 text-black stroke-[1.5]" />,
      title: 'Freshly Prepared Food',
      description: 'Every dish is cooked fresh upon order confirmation — zero reheating or batch storage.',
    },
    {
      icon: <Leaf className="w-8 h-8 text-black stroke-[1.5]" />,
      title: 'Safe Pure Ingredients',
      description: 'Prepared using cold-pressed oils, organic A2 ghee, and farm-fresh daily produce.',
    },
    {
      icon: <Truck className="w-8 h-8 text-black stroke-[1.5]" />,
      title: 'Fast Thermal Delivery',
      description: 'Delivered in insulated eco-friendly containers within 30 minutes of kitchen exit.',
    },
  ];

  return (
    <section className="py-16 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Our Uncompromising Promise</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight">
            Why Thousands Trust Aura Kitchens
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustItems.map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
              className="bg-neutral-50/70 border border-neutral-200 rounded-3xl p-6 sm:p-8 flex flex-col items-start justify-between space-y-6 shadow-subtle hover:shadow-elevated hover:bg-white hover:border-black transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-white border border-neutral-200 shadow-subtle flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                <div className="group-hover:text-white transition-colors">{item.icon}</div>
              </div>

              <div className="space-y-2 text-left">
                <h3 className="text-lg font-bold text-black tracking-tight">{item.title}</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
