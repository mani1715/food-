import React from 'react';
import { useApp } from '../../context/AppContext';

import { WeeklyHighlightsShowcase } from '../../components/WeeklyHighlightsShowcase';
import { BestSellers } from '../../components/BestSellers';
import { MadeWithLoveSection } from '../../components/MadeWithLoveSection';
import { RawMaterialSourcingSection } from '../../components/RawMaterialSourcingSection';
import { NoPreservativesPromiseBar } from '../../components/NoPreservativesPromiseBar';
import { PicklesCollection } from '../../components/PicklesCollection';
import { SweetsCollection } from '../../components/SweetsCollection';
import { RecentlyViewed } from '../../components/RecentlyViewed';
import { NewsletterSection } from '../../components/NewsletterSection';

export const HomePage: React.FC = () => {
  const { products } = useApp();

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* 1. Curated Weekly Highlights & Special Offers */}
      <WeeklyHighlightsShowcase />

      {/* 2. Top Picks / Best Sellers Showcase */}
      <BestSellers products={products} />

      {/* 3. Made With Love and Respect — 5 Step Heritage Guarantee */}
      <MadeWithLoveSection />

      {/* 4. Raw Material & Regional Sourcing Interactive Section */}
      <RawMaterialSourcingSection />

      {/* 5. No Artificial Preservatives Quality Guarantee Banner */}
      <NoPreservativesPromiseBar />

      {/* 6. Pickles Collection Showcase */}
      <PicklesCollection products={products} />

      {/* 7. Sweets Collection Showcase */}
      <SweetsCollection products={products} />

      {/* 8. Recently Viewed */}
      <RecentlyViewed />

      {/* 9. Newsletter */}
      <NewsletterSection />
    </div>
  );
};
