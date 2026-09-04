import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

import { WeeklyHighlightsShowcase } from '../../components/WeeklyHighlightsShowcase';
import { BestSellers } from '../../components/BestSellers';
import { PicklesCollection } from '../../components/PicklesCollection';
import { SweetsCollection } from '../../components/SweetsCollection';
import { SnacksCollection } from '../../components/SnacksCollection';

import { MadeWithLoveSection } from '../../components/MadeWithLoveSection';
import { RawMaterialSourcingSection } from '../../components/RawMaterialSourcingSection';
import { NoPreservativesPromiseBar } from '../../components/NoPreservativesPromiseBar';

import { RecentlyViewed } from '../../components/RecentlyViewed';
import { NewsletterSection } from '../../components/NewsletterSection';
import { Sparkles, ShieldCheck, MapPin, BookOpen } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { products } = useApp();
  const [activeProcessTab, setActiveProcessTab] = useState<'process' | 'sourcing' | 'quality'>('process');

  return (
    <div className="min-h-screen bg-white text-black font-sans space-y-4">
      
      {/* ========================================================================= */}
      {/* 1. SPECIAL ITEMS FIRST                                                    */}
      {/* ========================================================================= */}

      {/* Curated Special Highlights & Festive Offers */}
      <WeeklyHighlightsShowcase />

      {/* Top Picks / Best Sellers Showcase */}
      <BestSellers products={products} />


      {/* ========================================================================= */}
      {/* 2. FOOD ITEMS ONE BY ONE WITH THEIR CATEGORIES                            */}
      {/* ========================================================================= */}

      {/* Category 1: Homestyle Pickles Collection */}
      <PicklesCollection products={products} />

      {/* Category 2: Authentic Sweets Collection */}
      <SweetsCollection products={products} />

      {/* Category 3: Homemade Snacks Collection */}
      <SnacksCollection products={products} />


      {/* ========================================================================= */}
      {/* 3. KNOW OUR PROCESS & QUALITY — BRAND GUARANTEES (SEPARATE FROM FOODS)     */}
      {/* ========================================================================= */}
      
      <section className="pt-12 border-t-2 border-neutral-200 mt-12 bg-neutral-50/60 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left space-y-6">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-black" />
                <span>Our Heritage & Craftsmanship Standard</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight mt-1">
                Know Our Process & Cleanliness
              </h2>
            </div>

            {/* Quick Process Filter Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveProcessTab('process')}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                  activeProcessTab === 'process' ? 'bg-black text-white border-black shadow-subtle' : 'bg-white text-black border-neutral-200 hover:border-black'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>📜 5-Step Process</span>
              </button>

              <button
                onClick={() => setActiveProcessTab('sourcing')}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                  activeProcessTab === 'sourcing' ? 'bg-black text-white border-black shadow-subtle' : 'bg-white text-black border-neutral-200 hover:border-black'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>🗺️ Regional Sourcing</span>
              </button>

              <button
                onClick={() => setActiveProcessTab('quality')}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border cursor-pointer flex items-center gap-1.5 ${
                  activeProcessTab === 'quality' ? 'bg-black text-white border-black shadow-subtle' : 'bg-white text-black border-neutral-200 hover:border-black'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>🛡️ Quality Guarantee</span>
              </button>
            </div>
          </div>

          {/* Process Content Cards */}
          <div className="space-y-8">
            <div id="our-process" className="scroll-mt-32">
              <MadeWithLoveSection />
            </div>

            <div id="sourcing" className="scroll-mt-32">
              <RawMaterialSourcingSection />
            </div>

            <div id="quality" className="scroll-mt-32">
              <NoPreservativesPromiseBar />
            </div>
          </div>

        </div>
      </section>

      {/* Recently Viewed */}
      <RecentlyViewed />

      {/* Newsletter Subscription */}
      <NewsletterSection />

    </div>
  );
};
