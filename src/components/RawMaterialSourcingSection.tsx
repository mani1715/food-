import React, { useState } from 'react';
import { MapPin, CheckCircle, Leaf, Shield, Award } from 'lucide-react';

export const RawMaterialSourcingSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mango' | 'chilli' | 'oil' | 'ghee'>('mango');

  const materials = {
    mango: {
      title: 'Raw Avakaya Mangoes',
      region: 'Vijayawada & Guntur Orchards',
      desc: 'Selected raw mangoes known for firm texture and crisp sour flavor. Cut into perfect square pieces and seasoned on the same day.',
      benefits: ['Firm & Sour Pulp', 'Hand-washed & Air Dried', 'Direct Farm Sourcing'],
    },
    chilli: {
      title: 'Guntur 334 Red Chillies',
      region: 'Guntur, Andhra Pradesh',
      desc: 'Famous Guntur chillies sun-dried naturally and ground into a vibrant red powder without artificial colors or added oleoresins.',
      benefits: ['Authentic Rich Color', 'Medium Natural Heat', '100% Pure Sun-Dried'],
    },
    oil: {
      title: 'Cold-Pressed Sesame Oil',
      region: 'Traditional Wooden Chekku Mills',
      desc: 'Extracted slowly using traditional wooden presses (Chekku) at ambient temperatures to preserve healthy nutrients and natural sesame aroma.',
      benefits: ['Unrefined & Unfiltered', 'Zero Solvents/Chemicals', 'Natural Anti-Oxidants'],
    },
    ghee: {
      title: 'Pure A2 Cow Ghee',
      region: 'Local Dairy Farms',
      desc: 'Hand-churned from curd using the traditional Bilona method, bringing unmatched aroma and granary richness to all sweets and savories.',
      benefits: ['100% Pure A2 Quality', 'Golden Granular Texture', 'Traditional Bilona Churn'],
    },
  };

  const current = materials[activeTab];

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left space-y-8 bg-white border border-neutral-200 rounded-3xl my-8 shadow-subtle">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-black" />
            <span>Traceability & Sourcing</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-1">
            Raw Material Regional Sourcing
          </h2>
        </div>
        <p className="text-xs text-neutral-500 max-w-md font-medium">
          We source every key ingredient directly from its region of origin to ensure uncompromised quality, authentic flavor, and traditional taste.
        </p>
      </div>

      {/* Tabs & Detail Box Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Material Selection Tabs */}
        <div className="md:col-span-4 space-y-2">
          {[
            { id: 'mango', label: '🥭 Raw Avakaya Mangoes', sub: 'Vijayawada / Guntur' },
            { id: 'chilli', label: '🌶️ Guntur Red Chillies', sub: 'Guntur AP' },
            { id: 'oil', label: '🛢️ Cold-Pressed Sesame Oil', sub: 'Wooden Chekku Mills' },
            { id: 'ghee', label: '🧈 Pure A2 Cow Ghee', sub: 'Fresh Bilona Churn' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-black text-white border-black shadow-subtle'
                  : 'bg-neutral-50 text-black border-neutral-200 hover:border-black'
              }`}
            >
              <div>
                <span className="text-xs font-extrabold block">{tab.label}</span>
                <span className={`text-[10px] font-mono ${activeTab === tab.id ? 'text-neutral-300' : 'text-neutral-500'}`}>
                  {tab.sub}
                </span>
              </div>
              <MapPin className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-neutral-400'}`} />
            </button>
          ))}
        </div>

        {/* Right Sourcing Info & Regional Card */}
        <div className="md:col-span-8 p-6 bg-neutral-50 border border-neutral-200 rounded-3xl space-y-5">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider">Region of Origin</span>
              <h3 className="text-xl font-black text-black">{current.title}</h3>
              <p className="text-xs font-bold text-neutral-600 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-black" />
                <span>{current.region}</span>
              </p>
            </div>
            <span className="bg-black text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
              100% Authentic
            </span>
          </div>

          <p className="text-xs text-neutral-700 leading-relaxed font-medium">
            {current.desc}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {current.benefits.map((b, i) => (
              <div key={i} className="p-3 bg-white rounded-xl border border-neutral-200 text-xs font-extrabold text-black flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </section>
  );
};
