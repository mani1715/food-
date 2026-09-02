import React from 'react';
import { ChefHat, ArrowRight, Shield, HeartHandshake } from 'lucide-react';
import { motion } from 'framer-motion';

interface BecomeChefCTAProps {
  onJoinClick: () => void;
}

export const BecomeChefCTA: React.FC<BecomeChefCTAProps> = ({ onJoinClick }) => {
  return (
    <section className="py-20 bg-black text-white relative overflow-hidden">
      {/* Background Subtle Gradient */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-neutral-950 border border-neutral-800 rounded-4xl p-8 sm:p-14 shadow-modal grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-8 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-neutral-700 bg-neutral-900 text-xs font-semibold text-neutral-300">
              <ChefHat className="w-4 h-4 text-white" />
              <span>Partner With Aura Kitchens</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Turn Your Culinary Passion Into A Flourishing Home Business.
            </h2>

            <p className="text-base text-neutral-300 max-w-2xl leading-relaxed font-normal">
              Share your ancestral family recipes with thousands of food lovers in your neighborhood. We provide packaging, delivery logistics, marketing, and hygiene support.
            </p>

            {/* Benefit Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
                <Shield className="w-4 h-4 text-white shrink-0" />
                <span>Zero Onboarding Fee</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
                <HeartHandshake className="w-4 h-4 text-white shrink-0" />
                <span>Flexible Home Hours</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
                <ChefHat className="w-4 h-4 text-white shrink-0" />
                <span>100% Logistics Covered</span>
              </div>
            </div>
          </div>

          {/* Right Action Button Column */}
          <div className="lg:col-span-4 flex flex-col items-start lg:items-end justify-center">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onJoinClick}
              className="w-full sm:w-auto px-8 py-5 bg-white text-black text-sm font-extrabold rounded-2xl hover:bg-neutral-200 transition-all flex items-center justify-center gap-3 shadow-glow-white"
            >
              <span>Apply As A Home Chef</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            <p className="text-[11px] text-neutral-500 font-mono mt-3 text-center lg:text-right w-full sm:w-auto">
              Application takes less than 3 minutes
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};
