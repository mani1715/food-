import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';

// Layout
import { TopPortalSwitcher } from './components/layout/TopPortalSwitcher';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { FloatingActionButtons } from './components/FloatingActionButtons';

// Customer Pages
import { HomePage } from './pages/customer/HomePage';
import { ExplorePage } from './pages/customer/ExplorePage';
import { FoodDetailsPage } from './pages/customer/FoodDetailsPage';
import { ChefProfilePage } from './pages/customer/ChefProfilePage';
import { CategoriesPage } from './pages/customer/CategoriesPage';
import { CartPage } from './pages/customer/CartPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { OrderSuccessPage } from './pages/customer/OrderSuccessPage';
import { OrdersPage } from './pages/customer/OrdersPage';
import { OrderDetailsPage } from './pages/customer/OrderDetailsPage';
import { CustomerProfilePage } from './pages/customer/CustomerProfilePage';
import { FavoritesPage } from './pages/customer/FavoritesPage';
import { AddressesPage } from './pages/customer/AddressesPage';
import { NotificationsPage } from './pages/customer/NotificationsPage';
import { HelpSupportPage } from './pages/customer/HelpSupportPage';

// Chef Pages
import { ChefOnboardingPage } from './pages/chef/ChefOnboardingPage';
import { ChefDashboardPage } from './pages/chef/ChefDashboardPage';
import { ChefMenuPage } from './pages/chef/ChefMenuPage';
import { ChefOrdersPage } from './pages/chef/ChefOrdersPage';
import { ChefEarningsPage } from './pages/chef/ChefEarningsPage';
import { ChefReviewsPage } from './pages/chef/ChefReviewsPage';
import { ChefProfileEditPage } from './pages/chef/ChefProfileEditPage';
import { ChefSchedulePage } from './pages/chef/ChefSchedulePage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminChefsPage } from './pages/admin/AdminChefsPage';
import { AdminVerificationPage } from './pages/admin/AdminVerificationPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminPromotionsPage } from './pages/admin/AdminPromotionsPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

// Modals
import { LocationModal } from './components/modals/LocationModal';
import { CartDrawer } from './components/modals/CartDrawer';
import { FavoritesDrawer } from './components/modals/FavoritesDrawer';
import { SearchModal } from './components/modals/SearchModal';
import { LoginModal } from './components/modals/LoginModal';
import { ChefMenuModal } from './components/modals/ChefMenuModal';
import { QuickDishModal } from './components/modals/QuickDishModal';
import { MOCK_DISHES, MOCK_CHEFS } from './data/mockData';
import { ModalType, Chef, Dish } from './types';

const MainLayout: React.FC = () => {
  const {
    portalMode,
    currentLocation,
    setCurrentLocation,
    cartItems,
    favoriteDishIds,
    favoriteChefIds,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    createOrder,
    toggleFavoriteDish,
    toggleFavoriteChef,
    addToCart,
    addToast,
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation();

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedChef, setSelectedChef] = useState<Chef | null>(null);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);

  const isChefOrAdmin = location.pathname.startsWith('/chef') || location.pathname.startsWith('/admin');

  const favoriteDishes = MOCK_DISHES.filter((d) => favoriteDishIds.includes(d.id));
  const favoriteChefs = MOCK_CHEFS.filter((c) => favoriteChefIds.includes(c.id));

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white pb-16 lg:pb-0">
      
      {/* Environment Portal Switcher */}
      <TopPortalSwitcher />

      {/* Show Customer Nav Header when in Customer View */}
      {!isChefOrAdmin && (
        <>
          <AnnouncementBar />
          <Header
            currentLocation={currentLocation}
            onOpenModal={(type) => setActiveModal(type)}
            cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
            favoritesCount={favoriteDishIds.length + favoriteChefIds.length}
            onNavigateSection={(secId) => {
              if (location.pathname !== '/') {
                navigate('/');
              }
              const elem = document.getElementById(secId);
              if (elem) elem.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        </>
      )}

      {/* Main Content Router */}
      <main>
        <Routes>
          {/* Customer Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/food/:id" element={<FoodDetailsPage />} />
          <Route path="/chef/:id" element={<ChefProfilePage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success/:id" element={<OrderSuccessPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailsPage />} />
          <Route path="/profile" element={<CustomerProfilePage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/addresses" element={<AddressesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/help" element={<HelpSupportPage />} />

          {/* Chef Routes */}
          <Route path="/chef/onboarding" element={<ChefOnboardingPage />} />
          <Route path="/chef/dashboard" element={<ChefDashboardPage />} />
          <Route path="/chef/menu" element={<ChefMenuPage />} />
          <Route path="/chef/orders" element={<ChefOrdersPage />} />
          <Route path="/chef/earnings" element={<ChefEarningsPage />} />
          <Route path="/chef/reviews" element={<ChefReviewsPage />} />
          <Route path="/chef/profile" element={<ChefProfileEditPage />} />
          <Route path="/chef/schedule" element={<ChefSchedulePage />} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/customers" element={<AdminCustomersPage />} />
          <Route path="/admin/chefs" element={<AdminChefsPage />} />
          <Route path="/admin/verification" element={<AdminVerificationPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/categories" element={<AdminCategoriesPage />} />
          <Route path="/admin/promotions" element={<AdminPromotionsPage />} />
          <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
        </Routes>
      </main>

      {/* Footer for Customer View */}
      {!isChefOrAdmin && (
        <Footer
          onNavigateSection={(secId) => {
            navigate('/');
            const elem = document.getElementById(secId);
            if (elem) elem.scrollIntoView({ behavior: 'smooth' });
          }}
          onOpenModal={(type) => setActiveModal(type)}
        />
      )}

      {/* Mobile Bottom Navigation Bar */}
      {!isChefOrAdmin && (
        <MobileBottomNav
          activeTab={location.pathname === '/' ? 'hero' : location.pathname}
          onSelectTab={(tab) => navigate(tab === 'hero' ? '/' : tab === 'categories' ? '/categories' : tab)}
          cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
          favoritesCount={favoriteDishIds.length + favoriteChefIds.length}
          onOpenModal={(type) => setActiveModal(type)}
        />
      )}

      {/* Floating Action Buttons */}
      <FloatingActionButtons
        onShowToast={(title, msg) => addToast(title, msg, 'info')}
      />

      {/* Drawers & Modals */}
      <LocationModal
        isOpen={activeModal === 'location'}
        onClose={() => setActiveModal(null)}
        currentLocation={currentLocation}
        onSelectLocation={(loc) => setCurrentLocation(loc)}
      />

      <CartDrawer
        isOpen={activeModal === 'cart'}
        onClose={() => setActiveModal(null)}
        cartItems={cartItems}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        onCheckout={() => {
          setActiveModal(null);
          navigate('/checkout');
        }}
      />

      <FavoritesDrawer
        isOpen={activeModal === 'favorites'}
        onClose={() => setActiveModal(null)}
        favoriteDishes={favoriteDishes}
        favoriteChefs={favoriteChefs}
        onToggleFavoriteDish={toggleFavoriteDish}
        onToggleFavoriteChef={toggleFavoriteChef}
        onAddToCart={addToCart}
        onViewChefMenu={(chef) => {
          setActiveModal(null);
          navigate(`/chef/${chef.id}`);
        }}
      />

      <SearchModal
        isOpen={activeModal === 'search'}
        onClose={() => setActiveModal(null)}
        dishes={MOCK_DISHES}
        chefs={MOCK_CHEFS}
        onAddToCart={addToCart}
        onViewChefMenu={(chef) => {
          setActiveModal(null);
          navigate(`/chef/${chef.id}`);
        }}
      />

      <LoginModal
        isOpen={activeModal === 'login' || activeModal === 'becomeChef'}
        onClose={() => setActiveModal(null)}
        initialTab={activeModal === 'becomeChef' ? 'chef' : 'customer'}
        onShowToast={(t, m) => addToast(t, m)}
      />

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

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
