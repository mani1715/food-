import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { MOCK_DISHES, MOCK_CHEFS, MOCK_CATEGORIES } from '../../data/mockData';

import { Hero } from '../../components/Hero';
import { TrendingToday } from '../../components/TrendingToday';
import { TrustSection } from '../../components/TrustSection';
import { StatisticsSection } from '../../components/StatisticsSection';
import { FoodCategories } from '../../components/FoodCategories';
import { FeaturedCollections } from '../../components/FeaturedCollections';
import { FeaturedChefs } from '../../components/FeaturedChefs';
import { PopularDishes } from '../../components/PopularDishes';
import { WhyChooseUs } from '../../components/WhyChooseUs';
import { HowItWorks } from '../../components/HowItWorks';
import { CustomerTestimonials } from '../../components/CustomerTestimonials';
import { BecomeChefCTA } from '../../components/BecomeChefCTA';
import { MobileAppShowcase } from '../../components/MobileAppShowcase';
import { FAQSection } from '../../components/FAQSection';
import { NewsletterSection } from '../../components/NewsletterSection';
import { DishCardSkeleton, ChefCardSkeleton } from '../../components/SkeletonLoader';

import { ChefMenuModal } from '../../components/modals/ChefMenuModal';
import { QuickDishModal } from '../../components/modals/QuickDishModal';
import { Chef, Dish } from '../../types';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart, toggleFavoriteDish, toggleFavoriteChef, favoriteDishIds, favoriteChefIds, addToast } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedChef, setSelectedChef] = useState<Chef | null>(null);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [activeModal, setActiveModal] = useState<'chefMenu' | 'quickDish' | null>(null);
  const [isLoadingSkeleton, setIsLoadingSkeleton] = useState(false);

  const handleNavigateSection = (sectionId: string) => {
    if (sectionId === 'dishes' || sectionId === 'categories') {
      navigate('/explore');
      return;
    }
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Shimmer Skeleton Preview Banner Toggle */}
      <div className="bg-neutral-100 border-b border-neutral-200 py-2 px-4 text-center">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-semibold">
          <span className="text-neutral-600">UX Quality Preview Tool:</span>
          <button
            onClick={() => setIsLoadingSkeleton(!isLoadingSkeleton)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
              isLoadingSkeleton
                ? 'bg-black text-white border-black'
                : 'bg-white text-black border-neutral-300 hover:border-black'
            }`}
          >
            {isLoadingSkeleton ? '✓ Showing Shimmer Loading Skeletons' : '⚡ Toggle Shimmer Skeleton Loader Preview'}
          </button>
        </div>
      </div>

      {isLoadingSkeleton ? (
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Simulating Shimmer Loading Experience...</h2>
            <p className="text-xs text-neutral-500 font-mono">Progressive skeleton cards for dishes, chefs, and categories.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <DishCardSkeleton key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
            {[...Array(3)].map((_, i) => (
              <ChefCardSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* 3. Hero Section */}
          <Hero
            onExploreClick={() => navigate('/explore')}
            onHowItWorksClick={() => handleNavigateSection('how-it-works')}
          />

          {/* 4. Trending Today Section */}
          <TrendingToday
            dishes={MOCK_DISHES}
            chefs={MOCK_CHEFS}
            onAddToCart={addToCart}
            onToggleFavoriteDish={toggleFavoriteDish}
            onToggleFavoriteChef={toggleFavoriteChef}
            favoriteDishIds={favoriteDishIds}
            favoriteChefIds={favoriteChefIds}
            onQuickViewDish={(dish) => {
              setSelectedDish(dish);
              setActiveModal('quickDish');
            }}
            onViewChefMenu={(chef) => {
              setSelectedChef(chef);
              setActiveModal('chefMenu');
            }}
          />

          {/* 5. Trust Section */}
          <TrustSection />

          {/* 6. Statistics Section */}
          <StatisticsSection />

          {/* 7. Food Categories Section */}
          <FoodCategories
            categories={MOCK_CATEGORIES}
            selectedCategory={selectedCategory}
            onSelectCategory={(catName) => {
              setSelectedCategory(catName);
              navigate('/explore');
            }}
          />

          {/* 8. Featured Editorial Collections */}
          <FeaturedCollections
            onSelectCollection={(tag) => {
              navigate('/explore');
              addToast('Filter Applied', `Showing collection: ${tag}`);
            }}
          />

          {/* 9. Featured Home Chefs */}
          <FeaturedChefs
            chefs={MOCK_CHEFS}
            onViewChefMenu={(chef) => navigate(`/chef/${chef.id}`)}
            onToggleFavoriteChef={toggleFavoriteChef}
            favoriteChefIds={favoriteChefIds}
          />

          {/* 10. Popular Dishes Section */}
          <PopularDishes
            dishes={MOCK_DISHES}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onAddToCart={addToCart}
            onQuickViewDish={(dish) => {
              setSelectedDish(dish);
              setActiveModal('quickDish');
            }}
            onToggleFavoriteDish={toggleFavoriteDish}
            favoriteDishIds={favoriteDishIds}
          />

          {/* 11. Why Choose Us Section */}
          <WhyChooseUs />

          {/* 12. How It Works Section */}
          <HowItWorks />

          {/* 13. Customer Testimonials */}
          <CustomerTestimonials />

          {/* 14. Become A Home Chef Section */}
          <BecomeChefCTA
            onJoinClick={() => navigate('/chef/onboarding')}
          />

          {/* 15. Mobile App Showcase Section */}
          <MobileAppShowcase />

          {/* 16. FAQ Section */}
          <FAQSection />

          {/* 17. Newsletter Subscription */}
          <NewsletterSection
            onSubscribe={(email) => {
              addToast('Subscribed!', `Welcome ${email} to Aura Kitchens weekly newsletter.`);
            }}
          />
        </>
      )}

      {/* Quick Modals */}
      <ChefMenuModal
        isOpen={activeModal === 'chefMenu'}
        onClose={() => setActiveModal(null)}
        chef={selectedChef}
        dishes={MOCK_DISHES}
        onAddToCart={addToCart}
      />

      <QuickDishModal
        isOpen={activeModal === 'quickDish'}
        onClose={() => setActiveModal(null)}
        dish={selectedDish}
        onAddToCart={addToCart}
      />
    </>
  );
};
