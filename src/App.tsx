import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';

// Scroll Restoration and Smooth Page Transition Component
const ScrollRestorationManager: React.FC = () => {
  const location = useLocation();
  const prevKeyRef = React.useRef<string>('');
  const isFirstMountRef = React.useRef(true);

  React.useEffect(() => {
    const currentKey = location.pathname + location.search;

    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      prevKeyRef.current = currentKey;

      // On initial page load / page refresh (F5), restore saved scroll position
      const savedPos = sessionStorage.getItem('scroll_pos_' + currentKey);
      if (savedPos !== null) {
        const y = parseInt(savedPos, 10);
        if (!isNaN(y) && y > 0) {
          requestAnimationFrame(() => {
            window.scrollTo({ top: y, left: 0, behavior: 'instant' });
          });
          setTimeout(() => {
            window.scrollTo({ top: y, left: 0, behavior: 'instant' });
          }, 60);
          setTimeout(() => {
            window.scrollTo({ top: y, left: 0, behavior: 'instant' });
          }, 180);
        }
      }
      return;
    }

    // If navigated to a DIFFERENT route/path, scroll smoothly to top
    if (prevKeyRef.current !== currentKey) {
      prevKeyRef.current = currentKey;
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [location.pathname, location.search]);

  // Continuously record scroll position for current page in sessionStorage
  React.useEffect(() => {
    const currentKey = location.pathname + location.search;

    let timeoutId: number | undefined;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        sessionStorage.setItem('scroll_pos_' + currentKey, window.scrollY.toString());
      }, 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', () => {
      sessionStorage.setItem('scroll_pos_' + currentKey, window.scrollY.toString());
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname, location.search]);

  return null;
};

// Layout & Global Components
import { AnnouncementBar } from './components/AnnouncementBar';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Toast } from './components/Toast';
import { SearchModal } from './components/SearchModal';
import { WelcomeOfferNotificationModal } from './components/modals/WelcomeOfferNotificationModal';
import { FloatingBundleWidget } from './components/FloatingBundleWidget';

// Pages
import { HomePage } from './pages/customer/HomePage';
import { ProductListingPage } from './pages/customer/ProductListingPage';
import { ProductDetailsPage } from './pages/customer/ProductDetailsPage';
import { OurProcessPage } from './pages/customer/OurProcessPage';
import { RegionalSourcingPage } from './pages/customer/RegionalSourcingPage';
import { QualityPromisePage } from './pages/customer/QualityPromisePage';
import { WishlistPage } from './pages/customer/WishlistPage';
import { CartPage } from './pages/customer/CartPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';
import { OrderSuccessPage } from './pages/customer/OrderSuccessPage';
import { OrdersPage } from './pages/customer/OrdersPage';
import { CustomerProfilePage } from './pages/customer/CustomerProfilePage';
import { CategoriesPage } from './pages/customer/CategoriesPage';
import { HelpSupportPage } from './pages/customer/HelpSupportPage';
import { TrackOrderPage } from './pages/customer/TrackOrderPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';

const MainLayout: React.FC = () => {
  const { toasts, removeToast } = useApp();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white pb-16 lg:pb-0">
      
      {/* 1. Customer Announcement Bar (Hidden on Admin routes) */}
      {!isAdminRoute && <AnnouncementBar />}

      {/* 2. Customer Header with Categories (Hidden on Admin routes) */}
      {!isAdminRoute && <Header onOpenSearch={() => setIsSearchOpen(true)} />}

      {/* Main Content Router */}
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductListingPage />} />
          <Route path="/product/:id" element={<ProductDetailsPage />} />
          <Route path="/our-process" element={<OurProcessPage />} />
          <Route path="/sourcing" element={<RegionalSourcingPage />} />
          <Route path="/quality-promise" element={<QualityPromisePage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/order-success/:id" element={<OrderSuccessPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/track-order" element={<TrackOrderPage />} />
          <Route path="/profile" element={<CustomerProfilePage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/help" element={<HelpSupportPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Routes>
      </main>

      {/* Footer (Hidden on Admin routes) */}
      {!isAdminRoute && <Footer />}

      {/* Customer Bottom Mobile Navigation (Hidden on Admin routes) */}
      {!isAdminRoute && <MobileBottomNav />}

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
        <ScrollRestorationManager />
        <MainLayout />
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
