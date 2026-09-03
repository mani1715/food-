import React from 'react';
import { useApp } from '../../context/AppContext';

import { WeeklyHighlightsShowcase } from '../../components/WeeklyHighlightsShowcase';
import { ShopByCategory } from '../../components/ShopByCategory';
import { BestSellers } from '../../components/BestSellers';
import { NewArrivals } from '../../components/NewArrivals';
import { PicklesCollection } from '../../components/PicklesCollection';
import { SweetsCollection } from '../../components/SweetsCollection';
import { RecentlyViewed } from '../../components/RecentlyViewed';
import { NewsletterSection } from '../../components/NewsletterSection';

export const HomePage: React.FC = () => {
  const { products, categories } = useApp();

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* 3. Weekly Highlights & Special Offers Showcase */}
      <WeeklyHighlightsShowcase />

      {/* 4. Shop By Category */}
      <ShopByCategory categories={categories} />

      {/* 5. Best Sellers */}
      <BestSellers products={products} />

      {/* 6. New Arrivals */}
      <NewArrivals products={products} />

      {/* 7. Pickles Collection Showcase */}
      <PicklesCollection products={products} />

      {/* 8. Sweets Collection Showcase */}
      <SweetsCollection products={products} />

      {/* 9. Recently Viewed */}
      <RecentlyViewed />

      {/* 10. Newsletter */}
      <NewsletterSection />
    </div>
  );
};
