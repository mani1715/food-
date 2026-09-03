import React from 'react';
import { Heart, Sun, Flame, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export const MadeWithLoveSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Freshly Picked Produce',
      desc: 'Selected raw mangoes, fresh herbs, and farm produce sourced directly from local orchards.',
      icon: <Sparkles className="w-5 h-5 text-black" />,
    },
    {
      num: '02',
      title: 'Natural Sun-Curing',
      desc: 'Traditional sun-drying under clean, hygienic conditions to preserve authentic aroma and natural taste.',
      icon: <Sun className="w-5 h-5 text-black" />,
    },
    {
      num: '03',
      title: 'Stone-Ground Spices',
      desc: 'Whole spices roasted in small batches and slow-ground using traditional stone mills.',
      icon: <Flame className="w-5 h-5 text-black" />,
    },
    {
      num: '04',
      title: 'Pure Oils & A2 Desi Ghee',
      desc: 'Prepared exclusively with cold-pressed sesame/groundnut oil and pure hand-churned A2 cow ghee.',
      icon: <CheckCircle2 className="w-5 h-5 text-black" />,
    },
    {
      num: '05',
      title: 'Traditional Earthen Storage',
      desc: 'Matured naturally in authentic ceramic jars (Jadi) without artificial chemicals or synthetic preservatives.',
      icon: <ShieldCheck className="w-5 h-5 text-black" />,
    },
  ];

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-8 bg-neutral-50 rounded-3xl border border-neutral-200 my-8 shadow-subtle">
      
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center justify-center gap-1.5">
          <Heart className="w-4 h-4 text-black fill-black" />
          <span>Our Heritage Craftsmanship</span>
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
          Made With Love and Respect
        </h2>
        <p className="text-xs text-neutral-500 font-medium leading-relaxed">
          We ensure that each batch is crafted with patience and care, honoring age-old grandmother recipes passed down across generations.
        </p>
      </div>

      {/* 5 Process Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4">
        {steps.map((s) => (
          <div
            key={s.num}
            className="p-5 rounded-2xl bg-white border border-neutral-200 hover:border-black transition-all shadow-subtle space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black font-mono text-neutral-300 group-hover:text-black transition-colors">
                {s.num}
              </span>
              <div className="p-2 bg-neutral-100 rounded-xl group-hover:bg-black group-hover:text-white transition-colors">
                {s.icon}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-black">{s.title}</h3>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
};
