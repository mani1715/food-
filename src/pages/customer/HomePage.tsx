import React from 'react';
import { useApp } from '../../context/AppContext';

import { Hero } from '../../components/Hero';
import { ShopByCategory } from '../../components/ShopByCategory';
import { BestSellers } from '../../components/BestSellers';
import { FestivalCollections } from '../../components/FestivalCollections';
import { NewArrivals } from '../../components/NewArrivals';
import { PicklesCollection } from '../../components/PicklesCollection';
import { SweetsCollection } from '../../components/SweetsCollection';
import { RecentlyViewed } from '../../components/RecentlyViewed';
import { NewsletterSection } from '../../components/NewsletterSection';

export const HomePage: React.FC = () => {
  const { products, categories } = useApp();

  return (
    <div className="min-h-screen bg-white text-black font-sans">
      {/* 3. Hero Banner */}
      <Hero />

      {/* 4. Shop By Category */}
      <ShopByCategory categories={categories} />

      {/* 5. Best Sellers */}
      <BestSellers products={products} />

      {/* 6. Festival Collections & Gift Boxes */}
      <FestivalCollections />

      {/* 7. New Arrivals */}
      <NewArrivals products={products} />

      {/* 8. Pickles Collection Showcase */}
      <PicklesCollection products={products} />

      {/* 9. Sweets Collection Showcase */}
      <SweetsCollection products={products} />

      {/* 10. Recently Viewed */}
      <RecentlyViewed />

      {/* 11. Newsletter */}
      <NewsletterSection />
    </div>
  );
};
