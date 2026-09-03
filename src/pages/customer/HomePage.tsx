import React from 'react';
import { useApp } from '../../context/AppContext';

import { WeeklyHighlightsShowcase } from '../../components/WeeklyHighlightsShowcase';
import { BestSellers } from '../../components/BestSellers';
import { PicklesCollection } from '../../components/PicklesCollection';
import { SweetsCollection } from '../../components/SweetsCollection';
import { MadeWithLoveSection } from '../../components/MadeWithLoveSection';
import { RawMaterialSourcingSection } from '../../components/RawMaterialSourcingSection';
import { NoPreservativesPromiseBar } from '../../components/NoPreservativesPromiseBar';
import { RecentlyViewed } from '../../components/RecentlyViewed';
import { NewsletterSection } from '../../components/NewsletterSection';

export const HomePage: React.FC = () => {
  const { products } = useApp();

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* ================= PRODUCTS FIRST ================= */}
      
      {/* 1. Curated Special Highlights & Offers */}
      <WeeklyHighlightsShowcase />

      {/* 2. Top Picks / Best Sellers Showcase */}
      <BestSellers products={products} />

      {/* 3. Pickles Collection Showcase */}
      <PicklesCollection products={products} />

      {/* 4. Sweets Collection Showcase */}
      <SweetsCollection products={products} />


      {/* ================= CONTENT SECTIONS AFTER PRODUCTS ================= */}

      {/* 5. Made With Love and Respect — 5 Step Heritage Guarantee */}
      <MadeWithLoveSection />

      {/* 6. Raw Material & Regional Sourcing Interactive Section */}
      <RawMaterialSourcingSection />

      {/* 7. No Artificial Preservatives Quality Guarantee Banner */}
      <NoPreservativesPromiseBar />

      {/* 8. Recently Viewed */}
      <RecentlyViewed />

      {/* 9. Newsletter */}
      <NewsletterSection />
    </div>
  );
};
