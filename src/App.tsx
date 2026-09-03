import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';

// Layout & Global Components
import { AnnouncementBar } from './components/AnnouncementBar';
import { Header } from './components/Header';
import { SecondaryCategoryBar } from './components/SecondaryCategoryBar';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Toast } from './components/Toast';
import { SearchModal } from './components/SearchModal';
import { WelcomeOfferNotificationModal } from './components/modals/WelcomeOfferNotificationModal';

// Pages
import { HomePage } from './pages/customer/HomePage';
import { ProductListingPage } from './pages/customer/ProductListingPage';
import { ProductDetailsPage } from './pages/customer/ProductDetailsPage';
import { WishlistPage } from './pages/customer/WishlistPage';
import { CartPage } from './pages/customer/CartPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { OrderSuccessPage } from './pages/customer/OrderSuccessPage';
import { OrdersPage } from './pages/customer/OrdersPage';
import { CustomerProfilePage } from './pages/customer/CustomerProfilePage';
import { CategoriesPage } from './pages/customer/CategoriesPage';
import { HelpSupportPage } from './pages/customer/HelpSupportPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

const MainLayout: React.FC = () => {
  const { toasts, removeToast } = useApp();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white pb-16 lg:pb-0">
      
      {/* 1. Announcement Bar */}
      <AnnouncementBar />

      {/* 2. Sticky Header with Primary Navigation */}
      <Header onOpenSearch={() => setIsSearchOpen(true)} />

      {/* 3. Secondary Category Bar */}
      <SecondaryCategoryBar />

      {/* Main Content Router */}
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductListingPage />} />
          <Route path="/product/:id" element={<ProductDetailsPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success/:id" element={<OrderSuccessPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/profile" element={<CustomerProfilePage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/help" element={<HelpSupportPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Routes>
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Navigation Bar (Home, Categories, Wishlist, Cart, Profile) */}
      <MobileBottomNav />

      {/* Welcome Specials & New Arrivals Notification Popup */}
      <WelcomeOfferNotificationModal />

      {/* Search Experience Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Toast Notifications */}
      <div className="fixed bottom-20 right-4 z-50 space-y-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            title={toast.title}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

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
