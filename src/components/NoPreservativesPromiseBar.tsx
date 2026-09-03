import React from 'react';
import { ShieldCheck, Sparkles, HeartHandshake, CheckCircle } from 'lucide-react';

export const NoPreservativesPromiseBar: React.FC = () => {
  return (
    <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto my-8">
      <div className="bg-black text-white rounded-3xl p-8 shadow-modal text-center space-y-4 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-white/20">
          <ShieldCheck className="w-4 h-4 text-white" />
          <span>Our Uncompromising Quality Promise</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white max-w-2xl mx-auto">
          No Artificial Preservatives, Colors or Flavors Added
        </h2>

        <p className="text-xs sm:text-sm text-neutral-300 max-w-xl mx-auto font-medium leading-relaxed">
          We use only natural rock salt, cold-pressed sesame oil, lemon juice, and traditional sun-curing methods to naturally preserve our handcrafted food items.
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs font-extrabold text-neutral-200">
          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-white" /> 100% Homemade</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-white" /> Pure A2 Cow Ghee</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-white" /> Fresh Small Batches</span>
          <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-white" /> Hygienic Glass & Earthen Jars</span>
        </div>
      </div>
    </section>
  );
};
