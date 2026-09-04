import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Check, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export const QualityPromisePage: React.FC = () => {
  const navigate = useNavigate();

  const promises = [
    {
      title: '100% Homemade Recipe',
      desc: 'Crafted strictly in small home batches following traditional grandmother recipes without commercial factory shortcuts.',
      icon: <Sparkles className="w-5 h-5 text-black" />
    },
    {
      title: 'Pure A2 Cow Ghee',
      desc: 'Sweets are prepared exclusively with hand-churned A2 cow milk ghee for rich digestive health and golden taste.',
      icon: <Check className="w-5 h-5 text-black" />
    },
    {
      title: 'Fresh Small Batches',
      desc: 'Food items are prepared daily in limited batches to ensure you receive fresh stock with maximum aroma and shelf life.',
      icon: <RefreshCw className="w-5 h-5 text-black" />
    },
    {
      title: 'Hygienic Glass & Earthen Jars',
      desc: 'Packed in food-grade glass jars and traditional ceramic (Jadi) containers that maintain natural taste without plastic contamination.',
      icon: <ShieldCheck className="w-5 h-5 text-black" />
    },
  ];

  const excludedList = [
    'No Chemical Preservatives (Sodium Benzoate Free)',
    'No Artificial Food Colors or Dyes',
    'No Synthetic Fragrances or Flavors',
    'No Palm Oil, Mineral Oil, or Hydrogenated Fats',
    'No Excess Vinegar or Synthetic Acids',
  ];

  return (
    <div className="min-h-screen bg-white text-black py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-left space-y-10">
      
      {/* Top Back Nav */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-extrabold text-neutral-600 hover:text-black transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Store</span>
        </button>

        <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Clean Quality Assurance</span>
      </div>

      {/* Hero Banner */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 sm:p-10 shadow-subtle space-y-4">
        <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-500">
          <ShieldCheck className="w-4 h-4 text-black" />
          <span>Our Uncompromising Quality Promise</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-black tracking-tight leading-tight">
          No Artificial Preservatives, Colors or Flavors Added
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 max-w-3xl leading-relaxed font-medium">
          We use only natural rock salt, cold-pressed sesame oil, lemon juice, and traditional sun-curing methods to naturally preserve our handcrafted food items.
        </p>
      </div>

      {/* 4 Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {promises.map((p, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-subtle space-y-3 hover:border-black transition-all"
          >
            <div className="p-3 bg-neutral-100 rounded-2xl w-fit border border-neutral-200">
              {p.icon}
            </div>
            <h3 className="text-base font-extrabold text-black">{p.title}</h3>
            <p className="text-xs text-neutral-600 font-medium leading-relaxed">{p.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* What We NEVER Use Section */}
      <div className="bg-neutral-950 text-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-modal">
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-neutral-400">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>Zero Harmful Additives</span>
        </div>
        <h3 className="text-2xl font-black">What We NEVER Add To Our Foods</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-bold">
          {excludedList.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 p-3 rounded-2xl">
              <span className="text-rose-400 font-bold">✕</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="text-center pt-4">
        <button
          onClick={() => navigate('/products')}
          className="px-8 py-4 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all shadow-subtle cursor-pointer"
        >
          Shop Pure & Chemical-Free Foods
        </button>
      </div>

    </div>
  );
};
