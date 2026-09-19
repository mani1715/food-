import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';

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

    if (prevKeyRef.current !== currentKey) {
      prevKeyRef.current = currentKey;
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [location.pathname, location.search]);

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
import { FloatingWhatsAppWidget } from './components/FloatingWhatsAppWidget';

// Core Critical Pages (Eagerly Loaded for fast initial paint)
import { HomePage } from './pages/customer/HomePage';
import { ProductListingPage } from './pages/customer/ProductListingPage';
import { ProductDetailsPage } from './pages/customer/ProductDetailsPage';
import { CartPage } from './pages/customer/CartPage';
import { CheckoutPage } from './pages/customer/CheckoutPage';

// Lazy Loaded Secondary & Heavy Admin Routes (Route Code Splitting)
const OurProcessPage = lazy(() => import('./pages/customer/OurProcessPage').then(m => ({ default: m.OurProcessPage })));
const RegionalSourcingPage = lazy(() => import('./pages/customer/RegionalSourcingPage').then(m => ({ default: m.RegionalSourcingPage })));
const QualityPromisePage = lazy(() => import('./pages/customer/QualityPromisePage').then(m => ({ default: m.QualityPromisePage })));
const WishlistPage = lazy(() => import('./pages/customer/WishlistPage').then(m => ({ default: m.WishlistPage })));
const OrderSuccessPage = lazy(() => import('./pages/customer/OrderSuccessPage').then(m => ({ default: m.OrderSuccessPage })));
const OrdersPage = lazy(() => import('./pages/customer/OrdersPage').then(m => ({ default: m.OrdersPage })));
const CustomerProfilePage = lazy(() => import('./pages/customer/CustomerProfilePage').then(m => ({ default: m.CustomerProfilePage })));
const CategoriesPage = lazy(() => import('./pages/customer/CategoriesPage').then(m => ({ default: m.CategoriesPage })));
const HelpSupportPage = lazy(() => import('./pages/customer/HelpSupportPage').then(m => ({ default: m.HelpSupportPage })));
const TrackOrderPage = lazy(() => import('./pages/customer/TrackOrderPage').then(m => ({ default: m.TrackOrderPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/customer/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsConditionsPage = lazy(() => import('./pages/customer/TermsConditionsPage').then(m => ({ default: m.TermsConditionsPage })));
const ShippingPolicyPage = lazy(() => import('./pages/customer/ShippingPolicyPage').then(m => ({ default: m.ShippingPolicyPage })));
const RefundPolicyPage = lazy(() => import('./pages/customer/RefundPolicyPage').then(m => ({ default: m.RefundPolicyPage })));
const NotFoundPage = lazy(() => import('./pages/customer/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then(m => ({ default: m.AdminDashboardPage })));

// Loading Fallback Component
const RouteLoadingFallback: React.FC = () => (
  <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 space-y-3">
    <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Loading...</span>
  </div>
);

const MainLayout: React.FC = () => {
  const { toasts, removeToast } = useApp();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white pb-16 lg:pb-0">
      
      {/* 1. Customer Announcement Bar */}
      {!isAdminRoute && <AnnouncementBar />}

      {/* 2. Customer Header */}
      {!isAdminRoute && <Header onOpenSearch={() => setIsSearchOpen(true)} />}

      {/* Main Content Router with Suspense */}
      <main>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductListingPage />} />
            <Route path="/product/:id" element={<ProductDetailsPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success/:id" element={<OrderSuccessPage />} />
            <Route path="/our-process" element={<OurProcessPage />} />
            <Route path="/sourcing" element={<RegionalSourcingPage />} />
            <Route path="/quality-promise" element={<QualityPromisePage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/track-order" element={<TrackOrderPage />} />
            <Route path="/profile" element={<CustomerProfilePage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/help" element={<HelpSupportPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsConditionsPage />} />
            <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
            <Route path="/refund-policy" element={<RefundPolicyPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            {/* 404 Route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>

      {/* Footer */}
      {!isAdminRoute && <Footer />}

      {/* Floating WhatsApp Concierge with Abroad & Bulk Orders Popup */}
      {!isAdminRoute && <FloatingWhatsAppWidget />}

      {/* Customer Bottom Mobile Navigation */}
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
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <ScrollRestorationManager />
          <MainLayout />
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;
