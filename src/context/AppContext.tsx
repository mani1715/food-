import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  ProductCategory,
  CartItem,
  Order,
  UserLocation,
  UserProfile,
  ToastMessage,
  DeliveryCity,
  CitySuggestion,
  WhatsAppContact,
  WeeklyHighlights,
  HomeSection,
  HeroBannerSlide,
  HeaderAnnouncement,
  Coupon,
  HeaderSettings,
  StockHistoryLog,
  SubAdmin,
} from '../types';
import {
  MOCK_PRODUCTS,
  MOCK_CATEGORIES,
  MOCK_LOCATIONS,
  MOCK_USER_PROFILE,
  MOCK_DELIVERY_CITIES,
  MOCK_CITY_SUGGESTIONS,
  MOCK_WHATSAPP_CONTACTS,
  MOCK_SUBSCRIBERS,
  MOCK_WEEKLY_HIGHLIGHTS,
  MOCK_HERO_BANNERS,
  MOCK_HEADER_ANNOUNCEMENTS,
  MOCK_COUPONS,
} from '../data/mockData';
import {
  sanitizeInput,
  sanitizePrice,
  sanitizeQuantity,
  validateEmail,
  validateIndianPhone,
  rateLimiter,
} from '../utils/security';
import { isSupabaseConfigured, supabase } from '../lib/supabase/client';
import {
  fetchAllProducts,
  fetchAllCategories,
  createProductInDb,
  updateProductInDb,
  deleteProductFromDb,
  createCategoryInDb,
  updateCategoryInDb,
  deleteCategoryFromDb,
} from '../lib/supabase/products';
import {
  fetchAllOrders,
  createOrderInDb,
  updateOrderStatusInDb,
  updatePaymentStatusInDb,
  cancelOrderInDb,
} from '../lib/supabase/orders';
import { fetchStockHistoryLogs, logStockMovementInDb } from '../lib/supabase/inventory';
import {
  fetchHomeSections,
  saveHomeSectionInDb,
  deleteHomeSectionFromDb,
  fetchHeroBanners,
  saveHeroBannersInDb,
  fetchHeaderAnnouncements,
  fetchCoupons,
  fetchStoreSettings,
  saveStoreSettingsInDb,
} from '../lib/supabase/home';
import { fetchUserProfile, logoutSupabaseUser } from '../lib/supabase/auth';

interface AppContextType {
  // Supabase State
  isSupabaseConnected: boolean;
  supabaseUser: any;

  // Catalog & State
  products: Product[];
  categories: ProductCategory[];
  siteLogo: string;
  cartItems: CartItem[];
  wishlistProductIds: string[];
  recentlyViewedIds: string[];
  orders: Order[];
  userProfile: UserProfile;
  locations: UserLocation[];
  currentLocation: UserLocation;
  toasts: ToastMessage[];
  weeklyHighlights: WeeklyHighlights;
  homeSections: HomeSection[];
  heroBanners: HeroBannerSlide[];
  headerAnnouncements: HeaderAnnouncement[];
  coupons: Coupon[];
  headerSettings: HeaderSettings;
  stockHistoryLogs: StockHistoryLog[];
  subAdmins: SubAdmin[];

  // Coupon Actions
  addCoupon: (coupon: Omit<Coupon, 'id' | 'usageCount'>) => void;
  updateCoupon: (id: string, updated: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;
  validateAndApplyCoupon: (
    code: string,
    cartItemsList: CartItem[],
    cartSubtotal: number
  ) => { success: boolean; discountAmount: number; coupon?: Coupon; message: string };

  // Admin Data & State
  isAdminAuthenticated: boolean;
  deliveryCities: DeliveryCity[];
  citySuggestions: CitySuggestion[];
  whatsappContacts: WhatsAppContact[];
  newsletterSubscribers: string[];
  paymentEnabled: boolean;

  // Actions - Customer
  addToCart: (product: Product, selectedWeight: string, quantity?: number) => void;
  updateCartQuantity: (productId: string, selectedWeight: string, newQuantity: number) => void;
  removeFromCart: (productId: string, selectedWeight: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  addRecentlyViewed: (productId: string) => void;
  createOrder: (
    paymentMethod: string,
    deliveryAddress: UserLocation,
    customerDetails?: { name?: string; phone?: string; email?: string }
  ) => Order;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  setCurrentLocation: (loc: UserLocation) => void;
  addLocation: (loc: Omit<UserLocation, 'id'>) => void;
  deleteLocation: (id: string) => void;
  addToast: (title: string, message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // Actions - Admin
  loginAdmin: (email: string, pass: string) => Promise<boolean> | boolean;
  logoutAdmin: () => void;
  updateSiteLogo: (logoUrl: string) => void;
  addCategory: (name: string, image?: string, description?: string) => ProductCategory;
  updateCategory: (id: string, updated: Partial<ProductCategory>) => void;
  deleteCategory: (id: string) => void;
  addProduct: (product: Omit<Product, 'id'> & { id?: string }) => Product;
  updateProduct: (id: string, updated: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductBestSeller: (id: string) => void;
  toggleProductNewArrival: (id: string) => void;
  toggleProductFestival: (id: string) => void;
  updateProductDiscount: (id: string, percentage: number, expiryDate: string) => void;
  removeProductDiscount: (id: string) => void;
  updateWeeklyHighlights: (highlights: WeeklyHighlights) => void;
  addHomeSection: (section: Omit<HomeSection, 'id'>) => void;
  updateHomeSection: (id: string, updated: Partial<HomeSection>) => void;
  deleteHomeSection: (id: string) => void;
  toggleProductInHomeSection: (sectionId: string, productId: string) => void;
  
  // Hero Banners & Announcements Admin
  addHeroBanner: (banner: Omit<HeroBannerSlide, 'id'>) => void;
  updateHeroBanner: (id: string, updated: Partial<HeroBannerSlide>) => void;
  deleteHeroBanner: (id: string) => void;
  addHeaderAnnouncement: (text: string) => void;
  updateHeaderAnnouncement: (id: string, updated: Partial<HeaderAnnouncement>) => void;
  deleteHeaderAnnouncement: (id: string) => void;

  // Locations & Suggestions Admin
  addDeliveryCity: (city: Omit<DeliveryCity, 'id'>) => void;
  updateDeliveryCity: (id: string, updated: Partial<DeliveryCity>) => void;
  deleteDeliveryCity: (id: string) => void;
  approveCitySuggestion: (suggestionId: string, charge: number, threshold?: number) => void;
  rejectCitySuggestion: (suggestionId: string) => void;
  deleteCitySuggestion: (suggestionId: string) => void;

  // Orders Admin
  updateOrderStatus: (orderId: string, status: Order['orderStatus'], notes?: string, deliveryDays?: number) => void;
  updatePaymentStatus: (orderId: string, paymentStatus: Order['paymentStatus']) => void;
  cancelOrder: (orderId: string, reason: string) => void;

  // Settings & WhatsApp Admin
  setPaymentEnabled: (enabled: boolean) => void;
  updateHeaderSettings: (settings: Partial<HeaderSettings>) => void;
  restockProduct: (productId: string, quantity: number, note?: string) => void;
  destockProduct: (productId: string, quantity: number, note?: string) => void;
  addSubAdmin: (subAdmin: Omit<SubAdmin, 'id' | 'createdAt'>) => void;
  updateSubAdmin: (id: string, updated: Partial<SubAdmin>) => void;
  deleteSubAdmin: (id: string) => void;
  addWhatsAppContact: (name: string, phone: string) => void;
  updateWhatsAppContact: (id: string, updated: Partial<WhatsAppContact>) => void;
  deleteWhatsAppContact: (id: string) => void;
  addNewsletterSubscriber: (email: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getInitialState = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (saved !== null && saved !== undefined) {
      try {
        return JSON.parse(saved);
      } catch {
        // If it's a plain string (like "/aishu-logo.png" or raw text), return directly
        if (typeof fallback === 'string') {
          return saved as unknown as T;
        }
      }
    }
  } catch (err) {
    // ignore
  }
  return fallback;
};

const DEFAULT_HOME_SECTIONS: HomeSection[] = [
  {
    id: 'sec-bestsellers',
    badge: 'Customer Favorites',
    title: 'Best Selling Homemade Products',
    subtitle: 'Top rated authentic homemade delicacies loved by thousands of families.',
    productIds: ['prod-1', 'prod-2', 'prod-6', 'prod-7'],
    categoryFilter: 'all',
    enabled: true,
  },
  {
    id: 'sec-pickles',
    badge: 'Spicy & Tangy Signature',
    title: 'Homestyle Pickles Collection',
    subtitle: 'Authentic raw mango, chicken, mutton & gongura pickles made with cold-pressed oil.',
    productIds: ['prod-1', 'prod-2', 'prod-3', 'prod-4', 'prod-5'],
    categoryFilter: 'Pickles',
    enabled: true,
  },
  {
    id: 'sec-sweets',
    badge: 'Pure Ghee Delights',
    title: 'Authentic Traditional Sweets',
    subtitle: 'Hand-churned A2 cow ghee sweets prepared fresh without artificial preservatives.',
    productIds: ['prod-6', 'prod-7', 'prod-8'],
    categoryFilter: 'Sweets',
    enabled: true,
  },
  {
    id: 'sec-snacks',
    badge: 'Crunchy Evening Savories',
    title: 'Homestyle Snacks & Savories',
    subtitle: 'Traditional crispy murukku, chekodi & karam mixture roasted in small batches.',
    productIds: ['prod-9', 'prod-10', 'prod-11'],
    categoryFilter: 'Snacks',
    enabled: true,
  },
];

const INITIAL_MOCK_ORDERS: Order[] = [
  {
    id: 'ord-1001',
    orderNumber: 'AURA-98214',
    trackingCode: 'TRK-883921',
    date: '2026-09-01',
    items: [
      { product: MOCK_PRODUCTS[0], selectedWeight: '500g', unitPrice: 9.99, quantity: 2 },
      { product: MOCK_PRODUCTS[5], selectedWeight: '500g', unitPrice: 12.99, quantity: 1 },
    ],
    subtotal: 32.97,
    deliveryFee: 0,
    discount: 5.0,
    total: 27.97,
    status: 'Active',
    orderStatus: 'shipped',
    paymentStatus: 'completed',
    deliveryAddress: MOCK_LOCATIONS[0],
    paymentMethod: 'UPI / GPay',
    customerName: 'Anantha Lakshmi',
    customerPhone: '9876543210',
    customerEmail: 'anantha@example.com',
    deliveryDays: 2,
  },
  {
    id: 'ord-1002',
    orderNumber: 'AURA-97410',
    trackingCode: 'TRK-554109',
    date: '2026-08-25',
    items: [{ product: MOCK_PRODUCTS[6], selectedWeight: '500g', unitPrice: 15.99, quantity: 1 }],
    subtotal: 15.99,
    deliveryFee: 3.5,
    discount: 0,
    total: 19.49,
    status: 'Delivered',
    orderStatus: 'delivered',
    paymentStatus: 'completed',
    deliveryAddress: MOCK_LOCATIONS[1],
    paymentMethod: 'Credit Card',
    customerName: 'Anantha Lakshmi',
    customerPhone: '9876543210',
    customerEmail: 'anantha@example.com',
    deliveryDays: 3,
  },
  {
    id: 'ord-1003',
    orderNumber: 'AURA-96112',
    trackingCode: 'TRK-991204',
    date: '2026-09-02',
    items: [
      { product: MOCK_PRODUCTS[1], selectedWeight: '1kg', unitPrice: 16.99, quantity: 2 },
      { product: MOCK_PRODUCTS[2], selectedWeight: '500g', unitPrice: 8.99, quantity: 1 },
    ],
    subtotal: 42.97,
    deliveryFee: 0,
    discount: 4.0,
    total: 38.97,
    status: 'Active',
    orderStatus: 'processing',
    paymentStatus: 'completed',
    deliveryAddress: {
      id: 'loc-hyd-1',
      label: 'Home',
      address: 'Plot 42, Jubilee Hills Road 36',
      city: 'Hyderabad',
      pincode: '500033',
    },
    paymentMethod: 'UPI / GPay',
    customerName: 'Srinivas Rao',
    customerPhone: '9988776655',
    customerEmail: 'srinivas.rao@gmail.com',
    deliveryDays: 1,
  },
  {
    id: 'ord-1004',
    orderNumber: 'AURA-95208',
    trackingCode: 'TRK-771402',
    date: '2026-08-28',
    items: [
      { product: MOCK_PRODUCTS[3], selectedWeight: '500g', unitPrice: 7.99, quantity: 3 },
      { product: MOCK_PRODUCTS[7], selectedWeight: '250g', unitPrice: 11.5, quantity: 2 },
    ],
    subtotal: 46.97,
    deliveryFee: 2.5,
    discount: 0,
    total: 49.47,
    status: 'Delivered',
    orderStatus: 'delivered',
    paymentStatus: 'completed',
    deliveryAddress: {
      id: 'loc-vjz-1',
      label: 'Home',
      address: 'Flat 301, M.G. Road',
      city: 'Vijayawada',
      pincode: '520002',
    },
    paymentMethod: 'Cash on Delivery',
    customerName: 'Venkatesh K.',
    customerPhone: '9123456789',
    customerEmail: 'venkatesh.k@gmail.com',
    deliveryDays: 2,
  },
  {
    id: 'ord-1005',
    orderNumber: 'AURA-94109',
    trackingCode: 'TRK-334188',
    date: '2026-08-20',
    items: [
      { product: MOCK_PRODUCTS[4], selectedWeight: '1kg', unitPrice: 22.99, quantity: 1 },
    ],
    subtotal: 22.99,
    deliveryFee: 0,
    discount: 2.0,
    total: 20.99,
    status: 'Delivered',
    orderStatus: 'delivered',
    paymentStatus: 'completed',
    deliveryAddress: {
      id: 'loc-vsp-1',
      label: 'Office',
      address: 'Sector 4, MVP Colony',
      city: 'Visakhapatnam',
      pincode: '530017',
    },
    paymentMethod: 'UPI / PhonePe',
    customerName: 'Priya Sharma',
    customerPhone: '9849012345',
    customerEmail: 'priya.s@gmail.com',
    deliveryDays: 3,
  },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(isSupabaseConfigured());
  const [supabaseUser, setSupabaseUser] = useState<any>(null);

  const [products, setProducts] = useState<Product[]>(() =>
    getInitialState('aura_products', MOCK_PRODUCTS)
  );
  const [categories, setCategories] = useState<ProductCategory[]>(() =>
    getInitialState('aura_categories', MOCK_CATEGORIES)
  );
  const [siteLogo, setSiteLogo] = useState<string>(() => {
    const val = getInitialState<string>('aura_site_logo', '/aishu-logo.png');
    return val === '/aishu-logo.jpg' ? '/aishu-logo.png' : val;
  });

  useEffect(() => {
    localStorage.setItem('aura_site_logo', siteLogo);
  }, [siteLogo]);

  const updateSiteLogo = (logoUrl: string) => {
    setSiteLogo(logoUrl);
    addToast('Store Logo Updated 🖼️', 'Site logo updated successfully.', 'success');
  };
  const [cartItems, setCartItems] = useState<CartItem[]>(() =>
    getInitialState('aura_cart', [])
  );
  const [wishlistProductIds, setWishlistProductIds] = useState<string[]>(() =>
    getInitialState('aura_wishlist', ['prod-1', 'prod-6'])
  );
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(() =>
    getInitialState('aura_recently_viewed', ['prod-1', 'prod-7'])
  );
  const [locations, setLocations] = useState<UserLocation[]>(() =>
    getInitialState('aura_locations', MOCK_LOCATIONS)
  );
  const [currentLocation, setCurrentLocation] = useState<UserLocation>(() =>
    getInitialState('aura_current_location', MOCK_LOCATIONS[0])
  );
  const [userProfile, setUserProfile] = useState<UserProfile>(() =>
    getInitialState('aura_user_profile', MOCK_USER_PROFILE)
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [weeklyHighlights, setWeeklyHighlights] = useState<WeeklyHighlights>(() =>
    getInitialState('aura_weekly_highlights', MOCK_WEEKLY_HIGHLIGHTS)
  );
  const [homeSections, setHomeSections] = useState<HomeSection[]>(() =>
    getInitialState('aura_home_sections', DEFAULT_HOME_SECTIONS)
  );
  const [heroBanners, setHeroBanners] = useState<HeroBannerSlide[]>(() =>
    getInitialState('aura_hero_banners', MOCK_HERO_BANNERS)
  );
  const [headerAnnouncements, setHeaderAnnouncements] = useState<HeaderAnnouncement[]>(() =>
    getInitialState('aura_header_announcements', MOCK_HEADER_ANNOUNCEMENTS)
  );
  const [coupons, setCoupons] = useState<Coupon[]>(() =>
    getInitialState('aura_coupons', MOCK_COUPONS)
  );

  // Load data from Supabase when configured
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let isMounted = true;

    const loadSupabaseData = async () => {
      try {
        const [
          dbProductsResult,
          dbCategoriesResult,
          dbOrdersResult,
          dbSectionsResult,
          dbBannersResult,
          dbAnnouncementsResult,
          dbCouponsResult,
          dbLogsResult,
          dbSettingsResult,
        ] = await Promise.allSettled([
          fetchAllProducts(),
          fetchAllCategories(),
          fetchAllOrders(),
          fetchHomeSections(),
          fetchHeroBanners(),
          fetchHeaderAnnouncements(),
          fetchCoupons(),
          fetchStockHistoryLogs(),
          fetchStoreSettings(),
        ]);

        if (!isMounted) return;

        if (dbProductsResult.status === 'fulfilled') {
          setProducts(dbProductsResult.value);
        }
        if (dbCategoriesResult.status === 'fulfilled' && dbCategoriesResult.value.length > 0) {
          setCategories(dbCategoriesResult.value);
        }
        if (dbOrdersResult.status === 'fulfilled') {
          setOrders(dbOrdersResult.value);
        }
        if (dbSectionsResult.status === 'fulfilled' && dbSectionsResult.value.length > 0) {
          setHomeSections(dbSectionsResult.value);
        }
        if (dbBannersResult.status === 'fulfilled' && dbBannersResult.value.length > 0) {
          const localBanners = getInitialState<HeroBannerSlide[]>('aura_hero_banners', []);
          const merged = dbBannersResult.value.map((dbBanner) => {
            const local = localBanners.find((lb) => lb.id === dbBanner.id);
            return {
              ...dbBanner,
              imageScale: dbBanner.imageScale !== undefined ? dbBanner.imageScale : (local?.imageScale ?? 1),
              panOffsetX: dbBanner.panOffsetX !== undefined ? dbBanner.panOffsetX : (local?.panOffsetX ?? 0),
              panOffsetY: dbBanner.panOffsetY !== undefined ? dbBanner.panOffsetY : (local?.panOffsetY ?? 0),
            };
          });
          setHeroBanners(merged);
        }
        if (dbAnnouncementsResult.status === 'fulfilled' && dbAnnouncementsResult.value.length > 0) {
          setHeaderAnnouncements(dbAnnouncementsResult.value);
        }
        if (dbCouponsResult.status === 'fulfilled' && dbCouponsResult.value.length > 0) {
          setCoupons(dbCouponsResult.value);
        }
        if (dbLogsResult.status === 'fulfilled' && dbLogsResult.value.length > 0) {
          setStockHistoryLogs(dbLogsResult.value);
        }
        if (dbSettingsResult.status === 'fulfilled' && dbSettingsResult.value) {
          if (dbSettingsResult.value.logoUrl) setSiteLogo(dbSettingsResult.value.logoUrl);
          if (dbSettingsResult.value.headerSettings) setHeaderSettings(dbSettingsResult.value.headerSettings);
        }
      } catch (err) {
        console.warn('Could not load data from Supabase DB, using default state:', err);
      }
    };

    loadSupabaseData();

    // Subscribe to Auth State Changes
    const { data: authSub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        setSupabaseUser(session.user);
        const profile = await fetchUserProfile(session.user.id);
        if (profile && isMounted) {
          setUserProfile((prev) => ({
            ...prev,
            id: session.user.id,
            name: profile.full_name || prev.name,
            email: session.user.email || prev.email,
            phone: profile.phone_number || prev.phone,
            role: profile.role,
          }));
        }
      } else {
        setSupabaseUser(null);
      }
    });

    return () => {
      isMounted = false;
      authSub.subscription.unsubscribe();
    };
  }, []);
  const [headerSettings, setHeaderSettings] = useState<HeaderSettings>(() =>
    getInitialState('aura_header_settings', {
      showSearch: true,
      showWishlist: true,
      showAccount: true,
      showTrackOrder: true,
      showCart: true,
      disabledCategoryNames: [],
    })
  );
  const [stockHistoryLogs, setStockHistoryLogs] = useState<StockHistoryLog[]>(() =>
    getInitialState('aura_stock_history_logs', [])
  );
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>(() =>
    getInitialState('aura_sub_admins', [])
  );

  useEffect(() => {
    localStorage.setItem('aura_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('aura_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('aura_hero_banners', JSON.stringify(heroBanners));
  }, [heroBanners]);

  useEffect(() => {
    localStorage.setItem('aura_header_announcements', JSON.stringify(headerAnnouncements));
  }, [headerAnnouncements]);

  useEffect(() => {
    localStorage.setItem('aura_header_settings', JSON.stringify(headerSettings));
  }, [headerSettings]);

  useEffect(() => {
    localStorage.setItem('aura_stock_history_logs', JSON.stringify(stockHistoryLogs));
  }, [stockHistoryLogs]);

  useEffect(() => {
    localStorage.setItem('aura_sub_admins', JSON.stringify(subAdmins));
  }, [subAdmins]);

  const updateHeaderSettings = (settings: Partial<HeaderSettings>) => {
    setHeaderSettings((prev) => {
      const updated = { ...prev, ...settings };
      if (isSupabaseConfigured()) {
        saveStoreSettingsInDb(undefined, updated).catch((err) =>
          console.warn('Could not save header settings to Supabase:', err)
        );
      }
      return updated;
    });
    addToast('Header Display Updated ⚙️', 'Header layout updated.', 'success');
  };

  const restockProduct = (productId: string, quantity: number, note = 'Inventory Restock') => {
    let prodName = '';
    let newQty = 0;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          prodName = p.name;
          newQty = (p.inventoryCount ?? 0) + quantity;
          return { ...p, inventoryCount: newQty, outOfStock: false, inStock: true };
        }
        return p;
      })
    );

    if (isSupabaseConfigured()) {
      updateProductInDb(productId, { inventoryCount: newQty, outOfStock: false }).catch((err) =>
        console.warn('Could not update inventory in Supabase:', err)
      );
      logStockMovementInDb(productId, prodName || 'Product', 'restock', quantity, note).catch((err) =>
        console.warn('Could not log restock in Supabase:', err)
      );
    }

    const now = new Date();
    const newLog: StockHistoryLog = {
      id: `log-${Date.now()}`,
      productId,
      productName: prodName || 'Product',
      type: 'restock',
      quantity,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      note,
      adminName: 'Store Admin',
    };

    setStockHistoryLogs((prev) => [newLog, ...prev]);
    addToast('Stock Restocked ✅', `Added +${quantity} units to ${prodName || 'Product'}.`, 'success');
  };

  const destockProduct = (productId: string, quantity: number, note = 'Inventory Destock') => {
    let prodName = '';
    let newQty = 0;
    let isOut = false;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          prodName = p.name;
          const current = p.inventoryCount ?? 0;
          newQty = Math.max(0, current - quantity);
          isOut = newQty <= 0;
          return { ...p, inventoryCount: newQty, outOfStock: isOut, inStock: !isOut };
        }
        return p;
      })
    );

    if (isSupabaseConfigured()) {
      updateProductInDb(productId, { inventoryCount: newQty, outOfStock: isOut }).catch((err) =>
        console.warn('Could not update inventory in Supabase:', err)
      );
      logStockMovementInDb(productId, prodName || 'Product', 'destock', quantity, note).catch((err) =>
        console.warn('Could not log destock in Supabase:', err)
      );
    }

    const now = new Date();
    const newLog: StockHistoryLog = {
      id: `log-${Date.now()}`,
      productId,
      productName: prodName || 'Product',
      type: 'destock',
      quantity,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      note,
      adminName: 'Store Admin',
    };

    setStockHistoryLogs((prev) => [newLog, ...prev]);
    addToast('Stock Destocked 🔻', `Removed -${quantity} units from ${prodName || 'Product'}.`, 'info');
  };

  const addSubAdmin = (subAdmin: Omit<SubAdmin, 'id' | 'createdAt'>) => {
    const newSubAdmin: SubAdmin = {
      ...subAdmin,
      id: `sub-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setSubAdmins((prev) => [...prev, newSubAdmin]);
    addToast('Sub-Admin Created 👤', `Account for ${subAdmin.name} added.`, 'success');
  };

  const updateSubAdmin = (id: string, updated: Partial<SubAdmin>) => {
    setSubAdmins((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    addToast('Sub-Admin Updated', 'Permissions updated.', 'success');
  };

  const deleteSubAdmin = (id: string) => {
    setSubAdmins((prev) => prev.filter((s) => s.id !== id));
    addToast('Sub-Admin Deleted', 'Account removed.', 'info');
  };

  // Admin Specific State (with 4-hour automatic session expiration)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    const isAuth = localStorage.getItem('aura_admin_auth') === 'true';
    const authTimeStr = localStorage.getItem('aura_admin_auth_time');
    if (isAuth && authTimeStr) {
      const authTime = parseInt(authTimeStr, 10);
      const fourHoursMs = 4 * 60 * 60 * 1000;
      if (Date.now() - authTime > fourHoursMs) {
        localStorage.removeItem('aura_admin_auth');
        localStorage.removeItem('aura_admin_auth_time');
        return false;
      }
    }
    return isAuth;
  });
  const [deliveryCities, setDeliveryCities] = useState<DeliveryCity[]>(() =>
    getInitialState('aura_delivery_cities', MOCK_DELIVERY_CITIES)
  );
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>(() =>
    getInitialState('aura_city_suggestions', MOCK_CITY_SUGGESTIONS)
  );
  const [whatsappContacts, setWhatsappContacts] = useState<WhatsAppContact[]>(() =>
    getInitialState('aura_whatsapp_contacts', MOCK_WHATSAPP_CONTACTS)
  );
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<string[]>(() =>
    getInitialState('aura_subscribers', MOCK_SUBSCRIBERS)
  );
  const [paymentEnabled, setPaymentEnabledState] = useState<boolean>(() =>
    getInitialState('aura_payment_enabled', true)
  );
  const [orders, setOrders] = useState<Order[]>(() =>
    getInitialState('aura_orders', INITIAL_MOCK_ORDERS)
  );

  // Persistent LocalStorage Effects
  useEffect(() => {
    localStorage.setItem('aura_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('aura_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('aura_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('aura_wishlist', JSON.stringify(wishlistProductIds));
  }, [wishlistProductIds]);

  useEffect(() => {
    localStorage.setItem('aura_recently_viewed', JSON.stringify(recentlyViewedIds));
  }, [recentlyViewedIds]);

  useEffect(() => {
    localStorage.setItem('aura_locations', JSON.stringify(locations));
  }, [locations]);

  useEffect(() => {
    localStorage.setItem('aura_current_location', JSON.stringify(currentLocation));
  }, [currentLocation]);

  useEffect(() => {
    localStorage.setItem('aura_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('aura_weekly_highlights', JSON.stringify(weeklyHighlights));
  }, [weeklyHighlights]);

  useEffect(() => {
    localStorage.setItem('aura_home_sections', JSON.stringify(homeSections));
  }, [homeSections]);

  useEffect(() => {
    localStorage.setItem('aura_hero_banners', JSON.stringify(heroBanners));
  }, [heroBanners]);

  useEffect(() => {
    localStorage.setItem('aura_header_announcements', JSON.stringify(headerAnnouncements));
  }, [headerAnnouncements]);

  useEffect(() => {
    localStorage.setItem('aura_coupons', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    localStorage.setItem('aura_delivery_cities', JSON.stringify(deliveryCities));
  }, [deliveryCities]);

  useEffect(() => {
    localStorage.setItem('aura_city_suggestions', JSON.stringify(citySuggestions));
  }, [citySuggestions]);

  useEffect(() => {
    localStorage.setItem('aura_whatsapp_contacts', JSON.stringify(whatsappContacts));
  }, [whatsappContacts]);

  useEffect(() => {
    localStorage.setItem('aura_subscribers', JSON.stringify(newsletterSubscribers));
  }, [newsletterSubscribers]);

  useEffect(() => {
    localStorage.setItem('aura_payment_enabled', JSON.stringify(paymentEnabled));
  }, [paymentEnabled]);

  useEffect(() => {
    localStorage.setItem('aura_orders', JSON.stringify(orders));
  }, [orders]);

  // Toast Helper
  const addToast = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Saved Delivery Address Management
  const addLocation = (loc: Omit<UserLocation, 'id'>) => {
    const newLoc: UserLocation = { ...loc, id: `loc-${Date.now()}` };
    setLocations((prev) => [...prev, newLoc]);
    addToast('Address Saved', `${newLoc.label} address saved to your profile.`, 'success');
  };

  const deleteLocation = (id: string) => {
    setLocations((prev) => prev.filter((l) => l.id !== id));
    addToast('Address Removed', 'Saved address deleted.', 'info');
  };

  // Cart Management
  const addToCart = (product: Product, selectedWeight: string, quantity = 1) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedWeight === selectedWeight
      );

      const weightOpt = product.weightOptions.find((w) => w.weight === selectedWeight) || product.weightOptions[0];
      const unitPrice = weightOpt ? weightOpt.price : product.price;

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [...prev, { product, selectedWeight, unitPrice, quantity }];
      }
    });

    addToast('Added to Cart', `${product.name} (${selectedWeight}) added.`, 'success');
  };

  const updateCartQuantity = (productId: string, selectedWeight: string, newQuantity: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId && item.selectedWeight === selectedWeight) {
            return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string, selectedWeight: string) => {
    setCartItems((prev) => prev.filter((i) => !(i.product.id === productId && i.selectedWeight === selectedWeight)));
    addToast('Item Removed', 'Product removed from basket.', 'info');
  };

  const clearCart = () => setCartItems([]);

  // Wishlist
  const toggleWishlist = (productId: string) => {
    setWishlistProductIds((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        addToast('Removed from Wishlist', 'Item removed from wishlist.', 'info');
        return prev.filter((id) => id !== productId);
      } else {
        addToast('Added to Wishlist', 'Item saved to your wishlist.', 'success');
        return [...prev, productId];
      }
    });
  };

  // Recently Viewed
  const addRecentlyViewed = (productId: string) => {
    setRecentlyViewedIds((prev) => [productId, ...prev.filter((id) => id !== productId)].slice(0, 8));
  };

  // Order Placement
  const createOrder = (
    paymentMethod: string,
    deliveryAddress: UserLocation,
    customerDetails?: { name?: string; phone?: string; email?: string }
  ): Order => {
    const subtotal = cartItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
    const deliveryFee = subtotal > 35 ? 0 : 3.5;
    const total = subtotal + deliveryFee;

    const finalName = sanitizeInput(customerDetails?.name || userProfile.name || 'Customer');
    const finalPhone = sanitizeInput(customerDetails?.phone || userProfile.phone || '');
    const finalEmail = sanitizeInput(customerDetails?.email || userProfile.email || '');

    // Save/Update user profile details if provided
    if (customerDetails?.name || customerDetails?.phone || customerDetails?.email) {
      setUserProfile((prev) => ({
        ...prev,
        name: finalName,
        phone: finalPhone,
        email: finalEmail,
      }));
    }

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `AURA-${Math.floor(10000 + Math.random() * 90000)}`,
      trackingCode: `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toISOString().split('T')[0],
      items: [...cartItems],
      subtotal,
      deliveryFee,
      discount: 0,
      total,
      status: 'Active',
      orderStatus: 'placed',
      paymentStatus: 'completed',
      deliveryAddress,
      paymentMethod,
      customerName: finalName,
      customerPhone: finalPhone,
      customerEmail: finalEmail,
      deliveryDays: 3,
    };

    setOrders((prev) => [newOrder, ...prev]);

    if (isSupabaseConfigured()) {
      createOrderInDb(paymentMethod, deliveryAddress, cartItems, subtotal, deliveryFee, 0, total, {
        name: finalName,
        phone: finalPhone,
        email: finalEmail,
        userId: supabaseUser?.id,
      }).catch((err) => console.warn('Could not insert order to Supabase:', err));
    }

    clearCart();
    return newOrder;
  };

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...profile }));
    addToast('Profile Updated', 'Your details have been saved.', 'success');
  };

  // ADMIN ACTIONS (Security-hardened login with rate limiting & Supabase Auth)
  const loginAdmin = async (email: string, pass: string): Promise<boolean> => {
    const cleanEmail = sanitizeInput(email).trim().toLowerCase();

    // Brute-force Prevention: Max 5 failed attempts per 5 mins; locks for 15 mins if exceeded
    const rateCheck = rateLimiter.check('admin_login_rate', 5, 5 * 60 * 1000, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      addToast(
        '🚨 Security Lockout',
        `Too many failed attempts! Account locked for ${rateCheck.retryAfterSec}s to block brute-force attacks.`,
        'error'
      );
      return false;
    }

    if (isSupabaseConfigured()) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: pass,
        });

        if (authError || !authData.user) {
          rateLimiter.recordAttempt('admin_login_rate');
          addToast('Authentication Failed ❌', authError?.message || 'Invalid admin credentials.', 'error');
          return false;
        }

        // Check public.admin_profiles table
        const { data: adminProf } = await supabase
          .from('admin_profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        // Fallback check on public.profiles role
        const { data: userProf } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .maybeSingle();

        const isAuthorizedAdmin = Boolean(adminProf) || ['admin', 'owner', 'super_admin'].includes(userProf?.role || '');

        if (!isAuthorizedAdmin) {
          await supabase.auth.signOut();
          addToast('Access Denied 🚫', 'Your account is not authorized as an Administrator in public.admin_profiles.', 'error');
          return false;
        }

        rateLimiter.reset('admin_login_rate');
        setIsAdminAuthenticated(true);
        setSupabaseUser(authData.user);
        localStorage.setItem('aura_admin_auth', 'true');
        localStorage.setItem('aura_admin_auth_time', Date.now().toString());
        addToast('Admin Authenticated 🔒', `Welcome back, ${adminProf?.name || authData.user.email}!`, 'success');
        return true;
      } catch (err: any) {
        addToast('Login Error', err?.message || 'Could not authenticate with Supabase.', 'error');
        return false;
      }
    }

    if (cleanEmail === 'admin@aura.com' && pass === 'admin123') {
      rateLimiter.reset('admin_login_rate');
      setIsAdminAuthenticated(true);
      localStorage.setItem('aura_admin_auth', 'true');
      localStorage.setItem('aura_admin_auth_time', Date.now().toString());
      addToast('Admin Authenticated 🔒', 'Welcome to Aura Admin Portal (Demo Mode).', 'success');
      return true;
    }

    rateLimiter.recordAttempt('admin_login_rate');
    const remaining = rateCheck.remaining - 1;
    addToast(
      'Authentication Failed ❌',
      `Invalid credentials. ${remaining > 0 ? `${remaining} attempt(s) remaining.` : 'Account temporarily locked.'}`,
      'error'
    );
    return false;
  };

  const logoutAdmin = async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Error signing out Supabase user:', err);
      }
    }
    setIsAdminAuthenticated(false);
    setSupabaseUser(null);
    localStorage.removeItem('aura_admin_auth');
    localStorage.removeItem('aura_admin_auth_time');
    addToast('Signed Out 🔒', 'Admin session terminated safely.', 'info');
  };

  const addCategory = (name: string, image?: string, description?: string): ProductCategory => {
    const trimmedName = name.trim();
    const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newCat: ProductCategory = {
      id: `cat-${Date.now()}`,
      name: trimmedName,
      slug,
      itemCount: 0,
      image: image || 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=800&auto=format&fit=crop',
      description: description || `Authentic handcrafted homemade ${trimmedName}.`,
    };

    setCategories((prev) => {
      const exists = prev.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase());
      if (exists) return prev;
      return [...prev, newCat];
    });

    if (isSupabaseConfigured()) {
      createCategoryInDb(trimmedName, image, description).catch((err) =>
        console.warn('Could not persist category to Supabase:', err)
      );
    }

    addToast('Category Created', `Category "${trimmedName}" added to catalog.`, 'success');
    return newCat;
  };

  const updateCategory = (id: string, updated: Partial<ProductCategory>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));

    if (isSupabaseConfigured()) {
      updateCategoryInDb(id, updated).catch((err) =>
        console.warn('Could not update category in Supabase:', err)
      );
    }

    addToast('Category Updated', 'Category details updated.', 'success');
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));

    if (isSupabaseConfigured()) {
      deleteCategoryFromDb(id).catch((err) =>
        console.warn('Could not delete category in Supabase:', err)
      );
    }

    addToast('Category Removed', 'Category deleted from store.', 'info');
  };

  const addProduct = (product: Omit<Product, 'id'> & { id?: string }): Product => {
    const newProd: Product = { ...product, id: product.id || `prod-${Date.now()}` };
    setProducts((prev) => [newProd, ...prev]);

    if (isSupabaseConfigured()) {
      createProductInDb(newProd).catch((err) =>
        console.warn('Could not persist product to Supabase:', err)
      );
    }

    addToast('Product Created', `${newProd.name} added to catalog.`, 'success');
    return newProd;
  };

  const updateProduct = (id: string, updated: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));

    if (isSupabaseConfigured()) {
      updateProductInDb(id, updated).catch((err) =>
        console.warn('Could not update product in Supabase:', err)
      );
    }

    addToast('Product Updated', 'Product changes saved successfully.', 'success');
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setHomeSections((prev) =>
      prev.map((s) => ({
        ...s,
        productIds: s.productIds.filter((pId) => pId !== id),
      }))
    );
    setCartItems((prev) => prev.filter((item) => item.product.id !== id));
    setWishlistProductIds((prev) => prev.filter((pId) => pId !== id));
    setRecentlyViewedIds((prev) => prev.filter((pId) => pId !== id));

    if (isSupabaseConfigured()) {
      deleteProductFromDb(id).catch((err) =>
        console.warn('Could not delete product in Supabase:', err)
      );
    }

    addToast('Product Deleted', 'Product removed from catalog.', 'info');
  };

  const toggleProductBestSeller = (id: string) => {
    let newValue = false;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          newValue = !p.isBestSeller;
          return { ...p, isBestSeller: newValue };
        }
        return p;
      })
    );

    if (isSupabaseConfigured()) {
      updateProductInDb(id, { isBestSeller: newValue }).catch((err) =>
        console.warn('Could not toggle bestseller in Supabase:', err)
      );
    }

    addToast('Best Seller Toggled', 'Best seller status updated.', 'success');
  };

  const toggleProductNewArrival = (id: string) => {
    let newValue = false;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          newValue = !p.isNewArrival;
          return { ...p, isNewArrival: newValue };
        }
        return p;
      })
    );

    if (isSupabaseConfigured()) {
      updateProductInDb(id, { isNewArrival: newValue }).catch((err) =>
        console.warn('Could not toggle new arrival in Supabase:', err)
      );
    }

    addToast('New Arrival Toggled', 'New arrival status updated.', 'success');
  };

  const toggleProductFestival = (id: string) => {
    let newValue = false;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          newValue = !p.isFestival;
          return { ...p, isFestival: newValue };
        }
        return p;
      })
    );

    if (isSupabaseConfigured()) {
      updateProductInDb(id, { isFestival: newValue }).catch((err) =>
        console.warn('Could not toggle festival item in Supabase:', err)
      );
    }

    addToast('Festival Item Toggled', 'Festival status updated.', 'success');
  };

  const updateProductDiscount = (id: string, percentage: number, expiryDate: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, discountPercentage: percentage, discountExpiryDate: expiryDate }
          : p
      )
    );
    addToast('Discount Applied', `${percentage}% discount added.`, 'success');
  };

  const removeProductDiscount = (id: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, discountPercentage: 0, discountExpiryDate: undefined } : p
      )
    );
    addToast('Discount Removed', 'Product discount cleared.', 'info');
  };

  const updateWeeklyHighlights = (highlights: WeeklyHighlights) => {
    setWeeklyHighlights(highlights);
    addToast('Highlights Updated', 'Weekly Highlights & Festive Specials saved & live on homepage!', 'success');
  };

  const addHomeSection = (section: Omit<HomeSection, 'id'>) => {
    const newSec: HomeSection = { ...section, id: `sec-${Date.now()}` };
    setHomeSections((prev) => {
      const updatedList = [...prev, newSec];
      if (isSupabaseConfigured()) {
        saveHomeSectionInDb(newSec, updatedList.length - 1).catch(console.warn);
      }
      return updatedList;
    });
    addToast('Section Created', `"${newSec.title}" showcase section added to homepage.`, 'success');
  };

  const updateHomeSection = (id: string, updated: Partial<HomeSection>) => {
    setHomeSections((prev) => {
      const updatedList = prev.map((s) => (s.id === id ? { ...s, ...updated } : s));
      const targetSec = updatedList.find((s) => s.id === id);
      if (targetSec && isSupabaseConfigured()) {
        const order = updatedList.findIndex((s) => s.id === id);
        saveHomeSectionInDb(targetSec, order >= 0 ? order : 0).catch(console.warn);
      }
      return updatedList;
    });
    addToast('Section Updated', 'Showcase section title & options updated.', 'success');
  };

  const deleteHomeSection = (id: string) => {
    setHomeSections((prev) => {
      const updatedList = prev.filter((s) => s.id !== id);
      if (isSupabaseConfigured()) {
        deleteHomeSectionFromDb(id).catch(console.warn);
      }
      return updatedList;
    });
    addToast('Section Removed', 'Showcase section removed from homepage.', 'info');
  };

  const toggleProductInHomeSection = (sectionId: string, productId: string) => {
    setHomeSections((prev) => {
      const updatedList = prev.map((s) => {
        if (s.id === sectionId) {
          const exists = s.productIds.includes(productId);
          const updatedProductIds = exists
            ? s.productIds.filter((pId: string) => pId !== productId)
            : [...s.productIds, productId];
          return { ...s, productIds: updatedProductIds };
        }
        return s;
      });
      const targetSec = updatedList.find((s) => s.id === sectionId);
      if (targetSec && isSupabaseConfigured()) {
        const order = updatedList.findIndex((s) => s.id === sectionId);
        saveHomeSectionInDb(targetSec, order >= 0 ? order : 0).catch(console.warn);
      }
      return updatedList;
    });
    addToast('Section Updated', 'Product assigned to showcase section.', 'success');
  };

  // Hero Banners & Announcements Admin
  const addHeroBanner = (banner: Omit<HeroBannerSlide, 'id'>) => {
    const newBanner: HeroBannerSlide = { ...banner, id: `banner-${Date.now()}` };
    setHeroBanners((prev) => {
      const updatedList = [...prev, newBanner];
      if (isSupabaseConfigured()) {
        saveHeroBannersInDb(updatedList).catch(console.warn);
      }
      return updatedList;
    });
    addToast('Banner Added', 'New hero slide added.', 'success');
  };

  const updateHeroBanner = (id: string, updated: Partial<HeroBannerSlide>) => {
    setHeroBanners((prev) => {
      const updatedList = prev.map((b) => (b.id === id ? { ...b, ...updated } : b));
      if (isSupabaseConfigured()) {
        saveHeroBannersInDb(updatedList).catch(console.warn);
      }
      return updatedList;
    });
    addToast('Banner Updated', 'Hero slide updated successfully.', 'success');
  };

  const deleteHeroBanner = (id: string) => {
    setHeroBanners((prev) => {
      const updatedList = prev.filter((b) => b.id !== id);
      if (isSupabaseConfigured()) {
        saveHeroBannersInDb(updatedList).catch(console.warn);
      }
      return updatedList;
    });
    addToast('Banner Removed', 'Hero slide removed.', 'info');
  };

  const addHeaderAnnouncement = (text: string) => {
    const newAnnouncement: HeaderAnnouncement = { id: `ann-${Date.now()}`, text, enabled: true };
    setHeaderAnnouncements((prev) => [...prev, newAnnouncement]);
    addToast('Announcement Added', 'New top announcement ticker line added.', 'success');
  };

  const updateHeaderAnnouncement = (id: string, updated: Partial<HeaderAnnouncement>) => {
    setHeaderAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, ...updated } : a)));
    addToast('Announcement Updated', 'Header ticker line updated.', 'success');
  };

  const deleteHeaderAnnouncement = (id: string) => {
    setHeaderAnnouncements((prev) => prev.filter((a) => a.id !== id));
    addToast('Announcement Removed', 'Header announcement removed.', 'info');
  };

  // Coupon Management Admin & Validation
  const addCoupon = (coupon: Omit<Coupon, 'id' | 'usageCount'>) => {
    const newCoupon: Coupon = {
      ...coupon,
      id: `coup-${Date.now()}`,
      code: sanitizeInput(coupon.code).trim().toUpperCase(),
      usageCount: 0,
    };
    setCoupons((prev) => [newCoupon, ...prev]);
    addToast('Coupon Created 🎉', `Coupon code "${newCoupon.code}" created successfully.`, 'success');
  };

  const updateCoupon = (id: string, updated: Partial<Coupon>) => {
    setCoupons((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              ...updated,
              code: updated.code ? sanitizeInput(updated.code).trim().toUpperCase() : c.code,
            }
          : c
      )
    );
    addToast('Coupon Updated', 'Coupon rules and availability saved.', 'success');
  };

  const deleteCoupon = (id: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    addToast('Coupon Deleted', 'Coupon removed from system.', 'info');
  };

  const validateAndApplyCoupon = (
    code: string,
    cartItemsList: CartItem[],
    cartSubtotal: number
  ): { success: boolean; discountAmount: number; coupon?: Coupon; message: string } => {
    const cleanCode = sanitizeInput(code).trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, discountAmount: 0, message: 'Please enter a coupon code.' };
    }

    const foundCoupon = coupons.find((c) => c.code.trim().toUpperCase() === cleanCode);
    if (!foundCoupon) {
      return { success: false, discountAmount: 0, message: `Invalid coupon code "${cleanCode}".` };
    }

    if (!foundCoupon.enabled) {
      return { success: false, discountAmount: 0, message: `Coupon "${cleanCode}" is currently inactive.` };
    }

    if (foundCoupon.expiryDate) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (todayStr > foundCoupon.expiryDate) {
        return { success: false, discountAmount: 0, message: `Coupon "${cleanCode}" expired on ${foundCoupon.expiryDate}.` };
      }
    }

    // Minimum Order Subtotal Condition Check (e.g., >= ₹1500)
    if (cartSubtotal < foundCoupon.minOrderAmount) {
      const missingAmount = Math.ceil(foundCoupon.minOrderAmount - cartSubtotal);
      return {
        success: false,
        discountAmount: 0,
        message: `Coupon "${cleanCode}" requires a minimum cart subtotal of ₹${foundCoupon.minOrderAmount}. Add ₹${missingAmount} more to activate!`,
      };
    }

    // Item / Category Condition Check
    let eligibleSubtotal = cartSubtotal;

    if (foundCoupon.appliesTo === 'category' && foundCoupon.targetCategory) {
      const matchingItems = cartItemsList.filter(
        (item) => item.product.category.toLowerCase() === foundCoupon.targetCategory!.toLowerCase()
      );

      if (matchingItems.length === 0) {
        return {
          success: false,
          discountAmount: 0,
          message: `Coupon "${cleanCode}" is valid ONLY when purchasing items from the "${foundCoupon.targetCategory}" category!`,
        };
      }

      eligibleSubtotal = matchingItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
    } else if (foundCoupon.appliesTo === 'product' && foundCoupon.targetProductId) {
      const matchingItems = cartItemsList.filter((item) => item.product.id === foundCoupon.targetProductId);

      if (matchingItems.length === 0) {
        const targetProdName = products.find((p) => p.id === foundCoupon.targetProductId)?.name || 'target item';
        return {
          success: false,
          discountAmount: 0,
          message: `Coupon "${cleanCode}" is valid ONLY when purchasing "${targetProdName}"!`,
        };
      }

      eligibleSubtotal = matchingItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
    }

    // Calculate Discount Amount
    let calculatedDiscount = 0;
    if (foundCoupon.discountType === 'percentage') {
      calculatedDiscount = Math.round((eligibleSubtotal * foundCoupon.discountValue) / 100);
    } else {
      calculatedDiscount = Math.min(eligibleSubtotal, foundCoupon.discountValue);
    }

    return {
      success: true,
      discountAmount: calculatedDiscount,
      coupon: foundCoupon,
      message: `Coupon "${foundCoupon.code}" activated! ₹${calculatedDiscount} discount applied.`,
    };
  };

  // Locations & Suggestions Admin
  const addDeliveryCity = (city: Omit<DeliveryCity, 'id'>) => {
    const newCity: DeliveryCity = { ...city, id: `city-${Date.now()}` };
    setDeliveryCities((prev) => [...prev, newCity]);
    addToast('City Added', `${newCity.name} added to delivery locations.`, 'success');
  };

  const updateDeliveryCity = (id: string, updated: Partial<DeliveryCity>) => {
    setDeliveryCities((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    addToast('Location Updated', 'Delivery settings saved.', 'success');
  };

  const deleteDeliveryCity = (id: string) => {
    setDeliveryCities((prev) => prev.filter((c) => c.id !== id));
    addToast('Location Removed', 'City deleted from delivery list.', 'info');
  };

  const approveCitySuggestion = (suggestionId: string, charge: number, threshold?: number) => {
    const sug = citySuggestions.find((s) => s.id === suggestionId);
    if (sug) {
      setCitySuggestions((prev) =>
        prev.map((s) => (s.id === suggestionId ? { ...s, status: 'approved' } : s))
      );
      addDeliveryCity({
        name: sug.city,
        state: sug.state,
        charge,
        freeDeliveryThreshold: threshold || 1000,
        enabled: true,
      });
      addToast('Suggestion Approved', `${sug.city} approved and added to active cities!`, 'success');
    }
  };

  const rejectCitySuggestion = (suggestionId: string) => {
    setCitySuggestions((prev) =>
      prev.map((s) => (s.id === suggestionId ? { ...s, status: 'rejected' } : s))
    );
    addToast('Suggestion Rejected', 'City request marked as rejected.', 'info');
  };

  const deleteCitySuggestion = (suggestionId: string) => {
    setCitySuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
    addToast('Deleted', 'Suggestion removed.', 'info');
  };

  // Orders Admin
  const updateOrderStatus = (
    orderId: string,
    status: Order['orderStatus'],
    notes?: string,
    deliveryDays?: number
  ) => {
    let prevStatusOfOrder: Order['orderStatus'] | undefined;
    let targetOrderItems: CartItem[] = [];

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId || o.orderNumber === orderId) {
          prevStatusOfOrder = o.orderStatus;
          targetOrderItems = o.items;
          const mainStatus = status === 'delivered' ? 'Delivered' : status === 'cancelled' ? 'Cancelled' : 'Active';
          return {
            ...o,
            orderStatus: status,
            status: mainStatus,
            adminNotes: notes !== undefined ? notes : o.adminNotes,
            deliveryDays: deliveryDays !== undefined ? deliveryDays : o.deliveryDays,
          };
        }
        return o;
      })
    );

    // Stock only updates AFTER shipping the product!
    if (status === 'shipped' && prevStatusOfOrder !== 'shipped' && targetOrderItems.length > 0) {
      setProducts((prevProducts) =>
        prevProducts.map((p) => {
          const orderedItems = targetOrderItems.filter((item) => item.product.id === p.id);
          if (orderedItems.length === 0) return p;

          const totalOrderedQty = orderedItems.reduce((acc, item) => acc + item.quantity, 0);
          const currentStock = p.inventoryCount ?? 100;
          const newStock = Math.max(0, currentStock - totalOrderedQty);
          const isOut = newStock <= 0;

          if (newStock < 10 && newStock > 0) {
            setTimeout(() => {
              addToast(
                '⚠️ Low Stock Alert',
                `Stock for "${p.name}" is low (${newStock} units left)!`,
                'info'
              );
            }, 600);
          } else if (isOut) {
            setTimeout(() => {
              addToast(
                '🚨 Out of Stock Alert',
                `"${p.name}" is now completely Out of Stock!`,
                'error'
              );
            }, 600);
          }

          return {
            ...p,
            inventoryCount: newStock,
            outOfStock: isOut,
            inStock: !isOut,
          };
        })
      );
    }

    if (isSupabaseConfigured()) {
      updateOrderStatusInDb(orderId, status, notes).catch((err) =>
        console.warn('Could not update order status in Supabase:', err)
      );
    }

    addToast('Order Status Updated', `Order set to ${status}.`, 'success');
  };

  const updatePaymentStatus = (orderId: string, paymentStatus: Order['paymentStatus']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId || o.orderNumber === orderId ? { ...o, paymentStatus } : o))
    );

    if (isSupabaseConfigured()) {
      updatePaymentStatusInDb(orderId, paymentStatus).catch((err) =>
        console.warn('Could not update payment status in Supabase:', err)
      );
    }

    addToast('Payment Status Updated', `Payment status updated to ${paymentStatus}.`, 'success');
  };

  const cancelOrder = (orderId: string, reason: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId || o.orderNumber === orderId
          ? { ...o, orderStatus: 'cancelled', status: 'Cancelled', cancelReason: reason }
          : o
      )
    );

    if (isSupabaseConfigured()) {
      cancelOrderInDb(orderId, reason).catch((err) =>
        console.warn('Could not cancel order in Supabase:', err)
      );
    }
    addToast('Order Cancelled', 'Order has been cancelled.', 'info');
  };

  // Settings & WhatsApp Admin
  const setPaymentEnabled = (enabled: boolean) => {
    setPaymentEnabledState(enabled);
    addToast('Payment Settings Saved', `Payment gateway is now ${enabled ? 'ENABLED' : 'DISABLED'}.`, 'success');
  };

  const addWhatsAppContact = (name: string, phone: string) => {
    const newContact: WhatsAppContact = { id: `wa-${Date.now()}`, name, phone, enabled: true };
    setWhatsappContacts((prev) => [...prev, newContact]);
    addToast('Contact Added', `${name} added to WhatsApp concierge list.`, 'success');
  };

  const updateWhatsAppContact = (id: string, updated: Partial<WhatsAppContact>) => {
    setWhatsappContacts((prev) => prev.map((w) => (w.id === id ? { ...w, ...updated } : w)));
    addToast('Contact Updated', 'WhatsApp number updated.', 'success');
  };

  const deleteWhatsAppContact = (id: string) => {
    setWhatsappContacts((prev) => prev.filter((w) => w.id !== id));
    addToast('Contact Deleted', 'WhatsApp contact removed.', 'info');
  };

  const addNewsletterSubscriber = (email: string) => {
    const cleanEmail = sanitizeInput(email).toLowerCase();
    if (validateEmail(cleanEmail) && !newsletterSubscribers.includes(cleanEmail)) {
      setNewsletterSubscribers((prev) => [...prev, cleanEmail]);
      addToast('Subscribed! 🎉', 'You have been subscribed to Aishu Foods VIP offers.', 'success');
    }
  };

  return (
    <AppContext.Provider
      value={{
        isSupabaseConnected,
        supabaseUser,
        products,
        categories,
        siteLogo,
        cartItems,
        wishlistProductIds,
        recentlyViewedIds,
        orders,
        userProfile,
        locations,
        currentLocation,
        toasts,
        weeklyHighlights,
        homeSections,
        heroBanners,
        headerAnnouncements,
        coupons,
        headerSettings,
        stockHistoryLogs,
        subAdmins,
        isAdminAuthenticated,
        deliveryCities,
        citySuggestions,
        whatsappContacts,
        newsletterSubscribers,
        paymentEnabled,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        toggleWishlist,
        addRecentlyViewed,
        createOrder,
        updateUserProfile,
        setCurrentLocation,
        addLocation,
        deleteLocation,
        addToast,
        removeToast,
        loginAdmin,
        logoutAdmin,
        updateSiteLogo,
        addCategory,
        updateCategory,
        deleteCategory,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductBestSeller,
        toggleProductNewArrival,
        toggleProductFestival,
        updateProductDiscount,
        removeProductDiscount,
        updateWeeklyHighlights,
        addHomeSection,
        updateHomeSection,
        deleteHomeSection,
        toggleProductInHomeSection,
        addHeroBanner,
        updateHeroBanner,
        deleteHeroBanner,
        addHeaderAnnouncement,
        updateHeaderAnnouncement,
        deleteHeaderAnnouncement,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        validateAndApplyCoupon,
        addDeliveryCity,
        updateDeliveryCity,
        deleteDeliveryCity,
        approveCitySuggestion,
        rejectCitySuggestion,
        deleteCitySuggestion,
        updateOrderStatus,
        updatePaymentStatus,
        cancelOrder,
        setPaymentEnabled,
        updateHeaderSettings,
        restockProduct,
        destockProduct,
        addSubAdmin,
        updateSubAdmin,
        deleteSubAdmin,
        addWhatsAppContact,
        updateWhatsAppContact,
        deleteWhatsAppContact,
        addNewsletterSubscriber,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
