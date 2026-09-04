import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Sun, Flame, Droplet, Shield, ShieldCheck, Heart, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export const OurProcessPage: React.FC = () => {
  const navigate = useNavigate();

  const steps = [
    {
      num: '01',
      title: 'Freshly Picked Produce',
      subtitle: 'Direct Farm Sourcing',
      desc: 'Selected raw mangoes, fresh Gongura leaves, and farm produce sourced directly from trusted local Andhra & Telangana orchards at peak freshness.',
      icon: <Sparkles className="w-6 h-6 text-black" />,
      detail: 'Every piece of produce is hand-inspected for firm texture, crisp sourness, and optimal oil absorption before washing.'
    },
    {
      num: '02',
      title: 'Natural Sun-Curing',
      subtitle: 'Traditional Solar Maturation',
      desc: 'Traditional sun-drying under clean, hygienic solar conditions to preserve authentic aroma, natural color, and deep rustic flavor.',
      icon: <Sun className="w-6 h-6 text-black" />,
      detail: 'No heat lamps or industrial dehydrators. Sun-curing preserves natural enzymes and locks in rich taste for months.'
    },
    {
      num: '03',
      title: 'Stone-Ground Spices',
      subtitle: 'Slow Batch Grinding',
      desc: 'Whole Guntur chillies, mustard, fenugreek, and coriander roasted in small batches and slow-ground using traditional stone mills (Rolu).',
      icon: <Flame className="w-6 h-6 text-black" />,
      detail: 'Slow stone grinding prevents heat buildup, ensuring essential oils and pungent aromas remain intact.'
    },
    {
      num: '04',
      title: 'Pure Oils & A2 Desi Ghee',
      subtitle: 'Cold-Pressed Chekku Oils & Bilona Ghee',
      desc: 'Prepared exclusively with cold-pressed sesame & groundnut oils from wooden mills, and pure hand-churned A2 cow ghee.',
      icon: <Droplet className="w-6 h-6 text-black" />,
      detail: 'Zero mineral oil, zero palm oil, and zero adulteration. Only pure unrefined cold-pressed oils that nourish health.'
    },
    {
      num: '05',
      title: 'Traditional Earthen Storage',
      subtitle: 'Authentic Ceramic Jars (Jadi)',
      desc: 'Matured naturally in authentic ceramic jars (Jadi) sealed with clean cotton cloth, without artificial chemicals or synthetic preservatives.',
      icon: <Shield className="w-6 h-6 text-black" />,
      detail: 'Ceramic jars maintain a constant cool temperature, allowing flavors to blend deeply while maintaining natural longevity.'
    },
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

        <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Heritage Craftsmanship</span>
      </div>

      {/* Hero Banner */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 sm:p-10 shadow-subtle space-y-4">
        <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-500">
          <Heart className="w-4 h-4 text-black" />
          <span>Made With Love and Respect</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-black tracking-tight leading-tight">
          Our Heritage Craftsmanship Process
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 max-w-3xl leading-relaxed font-medium">
          We ensure that each batch is crafted with patience and care, honoring age-old grandmother recipes passed down across generations. No shortcuts, no factory automation—just pure homemade perfection.
        </p>
      </div>

      {/* 5-Step Process Timeline */}
      <div className="space-y-6">
        <h2 className="text-xl font-extrabold text-black tracking-tight border-b border-neutral-200 pb-3">
          The 5-Step Traditional Process
        </h2>

        <div className="space-y-4">
          {steps.map((step) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-subtle hover:border-black transition-all flex flex-col sm:flex-row items-start gap-6"
            >
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-3xl font-black font-mono text-neutral-300">{step.num}</span>
                <div className="p-3 bg-neutral-100 rounded-2xl border border-neutral-200">
                  {step.icon}
                </div>
              </div>

              <div className="space-y-1.5 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h3 className="text-lg font-extrabold text-black">{step.title}</h3>
                  <span className="text-[10px] font-extrabold uppercase bg-neutral-100 text-neutral-700 px-2.5 py-0.5 rounded-full w-fit">
                    {step.subtitle}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-600 font-medium leading-relaxed">{step.desc}</p>
                <p className="text-xs text-neutral-400 pt-1 italic">{step.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quality Certification Footer */}
      <div className="bg-black text-white rounded-3xl p-8 text-center space-y-4 shadow-modal">
        <Award className="w-10 h-10 mx-auto text-white" />
        <h3 className="text-xl font-black">100% Traditional Small-Batch Guarantee</h3>
        <p className="text-xs text-neutral-300 max-w-xl mx-auto leading-relaxed">
          Every jar leaving our kitchen is prepared under strict hygiene standards using only authentic grandmother formulations.
        </p>
        <button
          onClick={() => navigate('/products')}
          className="px-6 py-3.5 bg-white text-black text-xs font-extrabold rounded-2xl hover:bg-neutral-200 transition-all cursor-pointer"
        >
          Explore Handcrafted Foods
        </button>
      </div>

    </div>
  );
};
