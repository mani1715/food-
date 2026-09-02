import React from 'react';
import { MOCK_COLLECTIONS } from '../data/mockData';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

interface FeaturedCollectionsProps {
  onSelectCollection: (tag: string) => void;
}

export const FeaturedCollections: React.FC<FeaturedCollectionsProps> = ({ onSelectCollection }) => {
  return (
    <section className="py-16 bg-neutral-900 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">
              <Sparkles className="w-4 h-4 text-white" />
              <span>Editorial Selection</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Featured Food Collections
            </h2>
          </div>
          <p className="text-sm text-neutral-400 max-w-md">
            Handpicked theme collections crafted for special occasions, regional cravings, and healthy dietary lifestyles.
          </p>
        </div>

        {/* Large Editorial Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_COLLECTIONS.map((col, idx) => {
            const isLarge = idx === 0 || idx === 3;
            return (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                onClick={() => onSelectCollection(col.tag)}
                className={`relative rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-950 cursor-pointer group shadow-modal flex flex-col justify-between p-6 sm:p-8 min-h-[340px] ${
                  isLarge ? 'lg:col-span-2' : ''
                }`}
              >
                {/* Background Image */}
                <img
                  src={col.image}
                  alt={col.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale group-hover:scale-105 group-hover:opacity-75 transition-all duration-700"
                />

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                {/* Top Tag Chip */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="bg-white/90 text-black text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full shadow-subtle">
                    {col.tag}
                  </span>
                  <span className="text-xs font-mono text-neutral-300 bg-black/60 px-2.5 py-1 rounded-lg backdrop-blur-md">
                    {col.itemsCount} Specialties
                  </span>
                </div>

                {/* Bottom Content */}
                <div className="relative z-10 space-y-2 text-left pt-12">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight group-hover:translate-x-1 transition-transform">
                    {col.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-300 max-w-xl leading-relaxed">
                    {col.subtitle}
                  </p>
                  
                  <div className="pt-3 inline-flex items-center gap-2 text-xs font-bold text-white group-hover:underline">
                    <span>Explore Collection</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
