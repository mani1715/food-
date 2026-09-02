import React from 'react';
import { STATS_DATA } from '../data/mockData';
import { motion } from 'framer-motion';

export const StatisticsSection: React.FC = () => {
  return (
    <section className="py-14 bg-black text-white border-b border-neutral-800 relative overflow-hidden">
      {/* Subtle monochrome geometric background accent */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-neutral-800">
          {STATS_DATA.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="pt-6 md:pt-0 px-4 space-y-2"
            >
              <p className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-mono">
                {stat.value.toLocaleString()}
                <span className="text-neutral-400 font-sans">{stat.suffix}</span>
              </p>
              <p className="text-xs sm:text-sm font-semibold text-neutral-400 uppercase tracking-widest">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
