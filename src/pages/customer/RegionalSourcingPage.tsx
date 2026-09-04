import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft, Check, Compass, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export const RegionalSourcingPage: React.FC = () => {
  const navigate = useNavigate();

  const sourcingItems = [
    {
      emoji: '🥭',
      name: 'Raw Avakaya Mangoes',
      origin: 'Vijayawada & Guntur Orchards',
      desc: 'Selected raw mangoes known for firm texture and crisp sour flavor. Cut into perfect square pieces and seasoned on the same day.',
      tags: ['Firm & Sour Pulp', 'Hand-washed & Air Dried', 'Direct Farm Sourcing'],
      details: 'Harvested early morning from designated heritage groves in Krishna and Guntur districts for optimum acidity.',
    },
    {
      emoji: '🌶️',
      name: 'Guntur Red Chillies',
      origin: 'Guntur, Andhra Pradesh',
      desc: 'World-renowned fiery red chillies sun-dried naturally and ground fresh for vibrant natural color and rich spiciness.',
      tags: ['Pungent Flavor', 'Zero Synthetic Color', 'Sun-cured'],
      details: 'Sourced directly from Guntur agricultural markets, ensuring high capsaicin content and pure natural red hue.',
    },
    {
      emoji: '🛢️',
      name: 'Cold-Pressed Sesame Oil',
      origin: 'Wooden Chekku Mills',
      desc: 'Extracted slowly using traditional wooden press (Chekku) without heat or chemical solvents to preserve essential nutrients.',
      tags: ['Unrefined & Cold-pressed', 'High Smoke Point', 'Rich Aroma'],
      details: 'Cold pressing retains natural antioxidants and Vitamin E, giving pickles their golden glow and long shelf life.',
    },
    {
      emoji: '🧈',
      name: 'Pure A2 Cow Ghee',
      origin: 'Fresh Bilona Churn',
      desc: 'Crafted from indigenous A2 cow milk using the traditional curd-churning (Bilona) method for rich golden aroma.',
      tags: ['Traditional Bilona Process', '100% Pure A2 Ghee', 'Granular Texture'],
      details: 'Curd is churned bi-directionally by hand to extract butter, which is slow-simmered over low flame for granular ghee.',
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

        <span className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Traceability & Sourcing</span>
      </div>

      {/* Hero Banner */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 sm:p-10 shadow-subtle space-y-4">
        <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-500">
          <Compass className="w-4 h-4 text-black" />
          <span>Origin Sourcing Guarantee</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-black tracking-tight leading-tight">
          Raw Material Regional Sourcing
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 max-w-3xl leading-relaxed font-medium">
          We source every key ingredient directly from its region of origin to ensure uncompromised quality, authentic flavor, and traditional taste. Every spice and oil can be traced back to its farm origin.
        </p>
      </div>

      {/* Sourcing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sourcingItems.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-subtle hover:border-black transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl">{item.emoji}</span>
                <span className="text-[10px] font-extrabold uppercase bg-black text-white px-3 py-1 rounded-full flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-white" />
                  {item.origin}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-black">{item.name}</h3>
                <p className="text-xs font-extrabold text-neutral-400 font-mono mt-0.5">{item.origin}</p>
              </div>

              <p className="text-xs text-neutral-600 font-medium leading-relaxed">{item.desc}</p>
              <p className="text-xs text-neutral-400 italic pt-1 border-t border-neutral-100">{item.details}</p>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-3">
              {item.tags.map((tag, tIdx) => (
                <span key={tIdx} className="text-[10px] font-bold bg-neutral-100 text-black px-2.5 py-1 rounded-lg border border-neutral-200 flex items-center gap-1">
                  <Check className="w-3 h-3 text-black" />
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Sourcing Summary Card */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-subtle">
        <div className="space-y-1">
          <h3 className="text-lg font-extrabold text-black flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-black" />
            <span>100% Authentic Regional Taste Guarantee</span>
          </h3>
          <p className="text-xs text-neutral-500 font-medium max-w-xl">
            By eliminating middlemen and procuring directly from regional spice hubs, we guarantee pure taste free from chemicals or adulterants.
          </p>
        </div>

        <button
          onClick={() => navigate('/products')}
          className="px-6 py-3 bg-black text-white text-xs font-extrabold rounded-2xl hover:bg-neutral-800 transition-all shrink-0 cursor-pointer"
        >
          View Regional Products
        </button>
      </div>

    </div>
  );
};
