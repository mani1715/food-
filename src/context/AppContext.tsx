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
  CartOffer,
  HeaderSettings,
  StockHistoryLog,
  SubAdmin,
  StoreInfo,
  AdminRole,
  StoreAdminUser,
  AdminPermission,
  AdminSessionIdentity,
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
  MOCK_CART_OFFERS,
} from '../data/mockData';
import {
  sanitizeInput,
  sanitizePrice,
  sanitizeQuantity,
  validateEmail,
  validateIndianPhone,
  rateLimiter,
} from '../utils/security';
import { isSupabaseConfigured, isProductionEnv, supabase } from '../lib/supabase/client';
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
import {
  fetchStockHistoryLogs,
  logStockMovementInDb,
  decrementStockInDb,
} from '../lib/supabase/inventory';
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
import {
  fetchUserProfile,
  logoutSupabaseUser,
  getCurrentSession,
  getCurrentAdminIdentityFromDb,
  getAdminRoleFromDb,
  manageStaffAccountInDb,
} from '../lib/supabase/auth';

interface AppContextType {
  // Supabase State
  isSupabaseConnected: boolean;
  supabaseUser: any;
  adminAuthLoading: boolean;
  currentAdminIdentity: AdminSessionIdentity | null;
  hasPermission: (permission: AdminPermission | string) => boolean;
  hasTabAccess: (tabName: string) => boolean;

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

  // Cart Offers State & Actions
  cartOffers: CartOffer[];
  addCartOffer: (offer: Omit<CartOffer, 'id' | 'usageCount'>) => void;
  updateCartOffer: (id: string, updated: Partial<CartOffer>) => void;
  deleteCartOffer: (id: string) => void;
  toggleCartOfferStatus: (id: string) => void;
  getBestCartOffer: (
    cartItemsList: CartItem[],
    cartSubtotal: number
  ) => {
    eligibleOffers: CartOffer[];
    bestOffer?: CartOffer;
    discountAmount: number;
    freeGift?: string;
    isFreeShipping: boolean;
    nextOffer?: {
      offer: CartOffer;
      missingAmount: number;
      missingQuantity: number;
      progressPercentage: number;
    };
  };

  // Admin Data & State
  isAdminAuthenticated: boolean;
  currentAdminRole: AdminRole | null;
  currentAdminEmail: string | null;
  storeAdminUsers: StoreAdminUser[];
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
    customerDetails?: {
      name?: string;
      phone?: string;
      email?: string;
      discount?: number;
      appliedOfferTitle?: string;
      couponCode?: string;
      idempotencyKey?: string;
    }
  ) => Promise<Order>;
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
  addCategory: (
    name: string,
    image?: string,
    description?: string,
    imageScale?: number,
    panOffsetX?: number,
    panOffsetY?: number
  ) => ProductCategory;
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
  moveHomeSection: (id: string, direction: 'up' | 'down') => void;
  setSectionProducts: (sectionId: string, productIds: string[]) => void;
  
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
  cancelOrder: (orderId: string, reason: string, cancelledBy?: string) => void;

  // Store Settings & Controls Admin
  storeInfo: StoreInfo;
  updateStoreInfo: (updated: Partial<StoreInfo>) => void;
  setPaymentEnabled: (enabled: boolean) => void;
  updateHeaderSettings: (settings: Partial<HeaderSettings>) => void;
  exportStoreBackupJson: () => string;
  resetStoreToDefault: () => void;
  restockProduct: (productId: string, quantity: number, note?: string, targetWeight?: string) => void;
  destockProduct: (productId: string, quantity: number, note?: string, targetWeight?: string) => void;
  setProductStock: (productId: string, newStock: number, targetWeight?: string, note?: string) => void;
  toggleProductOutOfStock: (productId: string, reason?: string) => void;
  toggleProductVisibility: (productId: string, reason?: string) => void;
  addSubAdmin: (subAdmin: Omit<SubAdmin, 'id' | 'createdAt'>) => void;
  updateSubAdmin: (id: string, updated: Partial<SubAdmin>) => void;
  deleteSubAdmin: (id: string) => void;
  addStoreAdminUser: (admin: Omit<StoreAdminUser, 'id' | 'createdAt'>) => void;
  deleteStoreAdminUser: (idOrEmail: string) => void;
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

export const DEFAULT_STORE_INFO: StoreInfo = {
  storeName: 'AISHU FOODS - Handcrafted Homemade Specialties',
  tagline: 'Authentic Andhra Pickles, Pure A2 Ghee Sweets & Crunchy Savories Made with Grandmother Recipes',
  supportEmail: 'care@aishufoods.com',
  supportPhone: '+91 98480 12345',
  supportWhatsApp: '+91 98480 12345',
  kitchenAddress: 'Plot 42, Heritage Food Enclave, Near Benz Circle, Vijayawada, Andhra Pradesh - 520008',
  fssaiNumber: '10123999000142',
  gstin: '37AAAAA0000A1Z5',
  currencySymbol: '₹',
  minOrderAmount: 199,
  freeShippingThreshold: 499,
  codEnabled: true,
  orderAcceptanceStatus: 'open',
  vacationNotice: 'Our kitchen is currently preparing fresh holiday batches. Orders placed will be dispatched promptly on next working day.',
  deliveryTimeNotice: 'Prepared fresh & delivered in 24-48 hours across AP & Telangana. All-India express shipping available.',
};

export const DEFAULT_STORE_ADMIN_USERS: StoreAdminUser[] = [
  {
    id: 'admin-aishu',
    name: 'Aishu Foods Store Admin',
    email: 'aishuhomefoods@gmail.com',
    role: 'admin',
    createdAt: '2026-01-01',
  },
  {
    id: 'admin-demo',
    name: 'General Store Admin',
    email: 'admin@aura.com',
    role: 'admin',
    createdAt: '2026-01-01',
  },
];

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
    id: 'sec-festival',
    badge: 'Festive Delights & Gift Hampers',
    title: 'Festival Specials & Hampers',
    subtitle: 'Handcrafted traditional sweets, festive snacks & celebratory gift packs.',
    productIds: ['prod-6', 'prod-7', 'prod-8', 'prod-11'],
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

const getMockOrderDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const INITIAL_MOCK_ORDERS: Order[] = [
  {
    id: 'ord-1001',
    orderNumber: 'AISHU-98214',
    trackingCode: 'TRK-DEL-883921',
    date: getMockOrderDate(0), // Today
    items: [
      { product: MOCK_PRODUCTS[0] || MOCK_PRODUCTS[0], selectedWeight: '500g', unitPrice: 299, quantity: 2 },
      { product: MOCK_PRODUCTS[5] || MOCK_PRODUCTS[0], selectedWeight: '500g', unitPrice: 349, quantity: 1 },
    ],
    subtotal: 947,
    deliveryFee: 0,
    discount: 50,
    total: 897,
    status: 'Active',
    orderStatus: 'placed',
    paymentStatus: 'completed',
    deliveryAddress: MOCK_LOCATIONS[0],
    paymentMethod: 'UPI / PhonePe',
    customerName: 'Anantha Lakshmi',
    customerPhone: '9876543210',
    customerEmail: 'anantha.l@gmail.com',
    deliveryDays: 2,
    adminNotes: 'Customer requested medium spicy oil batch.',
  },
  {
    id: 'ord-1002',
    orderNumber: 'AISHU-97410',
    trackingCode: 'TRK-DTDC-554109',
    date: getMockOrderDate(0), // Today
    items: [{ product: MOCK_PRODUCTS[1] || MOCK_PRODUCTS[0], selectedWeight: '500g', unitPrice: 249, quantity: 1 }],
    subtotal: 249,
    deliveryFee: 49,
    discount: 0,
    total: 298,
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
    adminNotes: 'Batch cooking started in kitchen.',
  },
  {
    id: 'ord-1003',
    orderNumber: 'AISHU-96112',
    trackingCode: 'TRK-BLUEDART-991204',
    date: getMockOrderDate(1), // Yesterday
    items: [
      { product: MOCK_PRODUCTS[2] || MOCK_PRODUCTS[0], selectedWeight: '1kg', unitPrice: 549, quantity: 2 },
      { product: MOCK_PRODUCTS[3] || MOCK_PRODUCTS[0], selectedWeight: '500g', unitPrice: 299, quantity: 1 },
    ],
    subtotal: 1397,
    deliveryFee: 0,
    discount: 100,
    total: 1297,
    status: 'Active',
    orderStatus: 'ready_to_ship',
    paymentStatus: 'completed',
    deliveryAddress: {
      id: 'loc-vjz-1',
      label: 'Home',
      address: 'Flat 301, M.G. Road',
      city: 'Vijayawada',
      pincode: '520002',
    },
    paymentMethod: 'UPI / GPay',
    customerName: 'Venkatesh K.',
    customerPhone: '9123456789',
    customerEmail: 'venkatesh.k@gmail.com',
    deliveryDays: 2,
    courierPartner: 'Delhivery',
    adminNotes: 'Packed in authentic ceramic Jadi with clean cloth seal.',
  },
  {
    id: 'ord-1004',
    orderNumber: 'AISHU-95208',
    trackingCode: 'TRK-DEL-771402',
    date: getMockOrderDate(2),
    items: [
      { product: MOCK_PRODUCTS[4] || MOCK_PRODUCTS[0], selectedWeight: '500g', unitPrice: 399, quantity: 2 },
    ],
    subtotal: 798,
    deliveryFee: 0,
    discount: 0,
    total: 798,
    status: 'Active',
    orderStatus: 'shipped',
    paymentStatus: 'completed',
    deliveryAddress: {
      id: 'loc-vsp-1',
      label: 'Office',
      address: 'Sector 4, MVP Colony',
      city: 'Visakhapatnam',
      pincode: '530017',
    },
    paymentMethod: 'Credit Card',
    customerName: 'Priya Sharma',
    customerPhone: '9849012345',
    customerEmail: 'priya.s@gmail.com',
    deliveryDays: 3,
    courierPartner: 'DTDC Express',
  },
  {
    id: 'ord-1005',
    orderNumber: 'AISHU-94109',
    trackingCode: 'TRK-POST-334188',
    date: getMockOrderDate(4),
    items: [
      { product: MOCK_PRODUCTS[0] || MOCK_PRODUCTS[0], selectedWeight: '1kg', unitPrice: 549, quantity: 1 },
    ],
    subtotal: 549,
    deliveryFee: 0,
    discount: 50,
    total: 499,
    status: 'Delivered',
    orderStatus: 'delivered',
    paymentStatus: 'completed',
    deliveryAddress: MOCK_LOCATIONS[0],
    paymentMethod: 'Cash on Delivery',
    customerName: 'Rajesh Varma',
    customerPhone: '9848011223',
    customerEmail: 'rajesh.varma@yahoo.com',
    deliveryDays: 2,
  },
  {
    id: 'ord-1006',
    orderNumber: 'AISHU-93005',
    trackingCode: 'TRK-CAN-119283',
    date: getMockOrderDate(1), // Yesterday
    items: [
      { product: MOCK_PRODUCTS[0] || MOCK_PRODUCTS[0], selectedWeight: '1kg', unitPrice: 549, quantity: 2 },
    ],
    subtotal: 1098,
    deliveryFee: 0,
    discount: 0,
    total: 1098,
    status: 'Cancelled',
    orderStatus: 'cancelled',
    paymentStatus: 'refunded',
    deliveryAddress: {
      id: 'loc-blr-1',
      label: 'Home',
      address: 'Indiranagar 100ft Road',
      city: 'Bengaluru',
      pincode: '560038',
    },
    paymentMethod: 'UPI / PhonePe',
    customerName: 'Kavitha Reddy',
    customerPhone: '9740112345',
    customerEmail: 'kavitha.reddy@gmail.com',
    deliveryDays: 3,
    cancelReason: '🚨 Product Item Out of Stock / Kitchen Batch Exhausted: Raw mango seasonal harvest batch completed. Spoke with customer and initiated full refund.',
    cancelledAt: `${getMockOrderDate(1)} 02:45 PM`,
    cancelledBy: 'Store Admin',
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
  const [cartOffers, setCartOffers] = useState<CartOffer[]>(() =>
    getInitialState('aura_cart_offers', MOCK_CART_OFFERS)
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
        if (dbOrdersResult.status === 'fulfilled' && dbOrdersResult.value && dbOrdersResult.value.length > 0) {
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

    // Subscribe to Auth State Changes & Verify Admin Session
    const resolveAdminSession = async (user: any) => {
      if (!user) {
        setIsAdminAuthenticated(false);
        setCurrentAdminRole(null);
        setCurrentAdminEmail(null);
        setCurrentAdminIdentity(null);
        setAdminAuthLoading(false);
        return;
      }

      try {
        const identity = await getCurrentAdminIdentityFromDb();
        if (identity && identity.isActive) {
          setIsAdminAuthenticated(true);
          setCurrentAdminRole(identity.role);
          setCurrentAdminEmail(identity.email);
          setCurrentAdminIdentity(identity);
        } else {
          const roleRow = await getAdminRoleFromDb(user.id);
          if (roleRow && roleRow.status === 'active') {
            const resolved: AdminSessionIdentity = {
              userId: user.id,
              email: user.email || '',
              name: user.email?.split('@')[0] || 'Admin',
              role: roleRow.role,
              status: roleRow.status,
              allowedTabs: roleRow.allowed_tabs || [],
              permissions: roleRow.permissions || [],
            };
            setIsAdminAuthenticated(true);
            setCurrentAdminRole(roleRow.role);
            setCurrentAdminEmail(user.email || null);
            setCurrentAdminIdentity(resolved);
          } else {
            setIsAdminAuthenticated(false);
            setCurrentAdminRole(null);
            setCurrentAdminEmail(null);
            setCurrentAdminIdentity(null);
          }
        }
      } catch (err) {
        console.warn('Could not resolve admin identity from database:', err);
        setIsAdminAuthenticated(false);
        setCurrentAdminRole(null);
        setCurrentAdminEmail(null);
        setCurrentAdminIdentity(null);
      } finally {
        setAdminAuthLoading(false);
      }
    };

    // Initial check on mount
    getCurrentSession().then((session) => {
      if (isMounted) {
        if (session?.user) {
          setSupabaseUser(session.user);
          resolveAdminSession(session.user);
        } else {
          setAdminAuthLoading(false);
        }
      }
    });

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
        await resolveAdminSession(session.user);
      } else {
        setSupabaseUser(null);
        setIsAdminAuthenticated(false);
        setCurrentAdminRole(null);
        setCurrentAdminEmail(null);
        setCurrentAdminIdentity(null);
        setAdminAuthLoading(false);
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
    if (!isProductionEnv()) {
      localStorage.setItem('aura_categories', JSON.stringify(categories));
    }
  }, [categories]);

  useEffect(() => {
    if (!isProductionEnv()) {
      localStorage.setItem('aura_products', JSON.stringify(products));
    }
  }, [products]);

  useEffect(() => {
    if (!isProductionEnv()) {
      localStorage.setItem('aura_hero_banners', JSON.stringify(heroBanners));
    }
  }, [heroBanners]);

  useEffect(() => {
    if (!isProductionEnv()) {
      localStorage.setItem('aura_header_announcements', JSON.stringify(headerAnnouncements));
    }
  }, [headerAnnouncements]);

  useEffect(() => {
    localStorage.setItem('aura_header_settings', JSON.stringify(headerSettings));
  }, [headerSettings]);

  useEffect(() => {
    if (!isProductionEnv()) {
      localStorage.setItem('aura_stock_history_logs', JSON.stringify(stockHistoryLogs));
    }
  }, [stockHistoryLogs]);

  useEffect(() => {
    if (!isProductionEnv()) {
      localStorage.setItem('aura_sub_admins', JSON.stringify(subAdmins));
    }
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

  const restockProduct = (productId: string, quantity: number, note = 'Inventory Restock', targetWeight?: string) => {
    let prodName = '';
    let oldQty = 0;
    let newQty = 0;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          prodName = p.name;
          oldQty = p.inventoryCount ?? 0;
          newQty = oldQty + quantity;

          let updatedWeightOptions = p.weightOptions;
          if (targetWeight) {
            updatedWeightOptions = p.weightOptions.map((opt) => {
              if (opt.weight === targetWeight) {
                const currentOptStock = opt.stock !== undefined ? opt.stock : (p.inventoryCount ?? 0);
                return { ...opt, stock: Math.max(0, currentOptStock + quantity) };
              }
              return opt;
            });
          }

          return {
            ...p,
            inventoryCount: newQty,
            outOfStock: newQty <= 0,
            inStock: newQty > 0,
            weightOptions: updatedWeightOptions,
          };
        }
        return p;
      })
    );

    if (isSupabaseConfigured()) {
      updateProductInDb(productId, { inventoryCount: newQty, outOfStock: newQty <= 0 }).catch((err) =>
        console.warn('Could not update inventory in Supabase:', err)
      );
      logStockMovementInDb(
        productId,
        prodName || 'Product',
        'restock',
        quantity,
        targetWeight ? `${note} [Variant: ${targetWeight}]` : note
      ).catch((err) => console.warn('Could not log restock in Supabase:', err));
    }

    const now = new Date();
    const newLog: StockHistoryLog = {
      id: `log-${Date.now()}`,
      productId,
      productName: prodName || 'Product',
      type: 'restock',
      quantity,
      previousStock: oldQty,
      newStock: newQty,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      note: targetWeight ? `${note} (${targetWeight})` : note,
      adminName: 'Store Admin',
    };

    setStockHistoryLogs((prev) => [newLog, ...prev]);
    addToast(
      'Stock Restocked ✅',
      `Added +${quantity} units to ${prodName || 'Product'}${targetWeight ? ` (${targetWeight})` : ''} (Total: ${newQty}).`,
      'success'
    );
  };

  const destockProduct = (productId: string, quantity: number, note = 'Inventory Destock', targetWeight?: string) => {
    let prodName = '';
    let oldQty = 0;
    let newQty = 0;
    let isOut = false;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          prodName = p.name;
          oldQty = p.inventoryCount ?? 0;
          newQty = Math.max(0, oldQty - quantity);
          isOut = newQty <= 0;

          let updatedWeightOptions = p.weightOptions;
          if (targetWeight) {
            updatedWeightOptions = p.weightOptions.map((opt) => {
              if (opt.weight === targetWeight) {
                const currentOptStock = opt.stock !== undefined ? opt.stock : (p.inventoryCount ?? 0);
                return { ...opt, stock: Math.max(0, currentOptStock - quantity) };
              }
              return opt;
            });
          }

          return {
            ...p,
            inventoryCount: newQty,
            outOfStock: isOut,
            inStock: !isOut,
            weightOptions: updatedWeightOptions,
          };
        }
        return p;
      })
    );

    if (isSupabaseConfigured()) {
      updateProductInDb(productId, { inventoryCount: newQty, outOfStock: isOut }).catch((err) =>
        console.warn('Could not update inventory in Supabase:', err)
      );
      logStockMovementInDb(
        productId,
        prodName || 'Product',
        'destock',
        quantity,
        targetWeight ? `${note} [Variant: ${targetWeight}]` : note
      ).catch((err) => console.warn('Could not log destock in Supabase:', err));
    }

    const now = new Date();
    const newLog: StockHistoryLog = {
      id: `log-${Date.now()}`,
      productId,
      productName: prodName || 'Product',
      type: 'destock',
      quantity,
      previousStock: oldQty,
      newStock: newQty,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      note: targetWeight ? `${note} (${targetWeight})` : note,
      adminName: 'Store Admin',
    };

    setStockHistoryLogs((prev) => [newLog, ...prev]);
    addToast(
      isOut ? 'Product Sold Out ⚠️' : 'Stock Destocked',
      `Deducted -${quantity} units from ${prodName || 'Product'}${targetWeight ? ` (${targetWeight})` : ''} (Remaining: ${newQty}).`,
      isOut ? 'error' : 'info'
    );
  };

  const setProductStock = (productId: string, newStock: number, targetWeight?: string, note = 'Manual Stock Level Set') => {
    const validStock = Math.max(0, newStock);
    let prodName = '';
    let oldQty = 0;
    const isOut = validStock <= 0;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          prodName = p.name;
          oldQty = p.inventoryCount ?? 0;

          let updatedWeightOptions = p.weightOptions;
          if (targetWeight) {
            updatedWeightOptions = p.weightOptions.map((opt) => {
              if (opt.weight === targetWeight) {
                return { ...opt, stock: validStock };
              }
              return opt;
            });
          }

          return {
            ...p,
            inventoryCount: validStock,
            outOfStock: isOut,
            inStock: !isOut,
            weightOptions: updatedWeightOptions,
          };
        }
        return p;
      })
    );

    if (isSupabaseConfigured()) {
      updateProductInDb(productId, { inventoryCount: validStock, outOfStock: isOut }).catch((err) =>
        console.warn('Could not update inventory in Supabase:', err)
      );
      const stockDiff = validStock - oldQty;
      const moveType = stockDiff >= 0 ? 'restock' : 'destock';
      logStockMovementInDb(
        productId,
        prodName || 'Product',
        moveType,
        Math.abs(stockDiff),
        `${note} (Set stock to ${validStock}${targetWeight ? ` for ${targetWeight}` : ''})`
      ).catch((err) => console.warn('Could not log stock change in Supabase:', err));
    }

    const now = new Date();
    const newLog: StockHistoryLog = {
      id: `log-${Date.now()}`,
      productId,
      productName: prodName || 'Product',
      type: validStock >= oldQty ? 'restock' : 'destock',
      quantity: Math.abs(validStock - oldQty),
      previousStock: oldQty,
      newStock: validStock,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      note: `${note}: Set stock to ${validStock}${targetWeight ? ` (${targetWeight})` : ''}`,
      adminName: 'Store Admin',
    };

    setStockHistoryLogs((prev) => [newLog, ...prev]);
    addToast(
      isOut ? 'Marked Out of Stock ⚠️' : 'Stock Updated ✅',
      `${prodName || 'Product'}${targetWeight ? ` (${targetWeight})` : ''} stock set to ${validStock} units.`,
      isOut ? 'error' : 'success'
    );
  };

  const toggleProductOutOfStock = (productId: string, reason?: string) => {
    let prodName = '';
    let newOutOfStock = false;
    let currentStock = 0;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          prodName = p.name;
          newOutOfStock = !(p.outOfStock || (p.inventoryCount ?? 100) <= 0);
          currentStock = p.inventoryCount ?? 100;
          return {
            ...p,
            outOfStock: newOutOfStock,
            inStock: !newOutOfStock,
            statusReason: reason || p.statusReason,
          };
        }
        return p;
      })
    );

    if (isSupabaseConfigured()) {
      updateProductInDb(productId, {
        outOfStock: newOutOfStock,
        inStock: !newOutOfStock,
      }).catch((err) => console.warn('Could not toggle out of stock in Supabase:', err));
    }

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const newLog: StockHistoryLog = {
      id: `log-${Date.now()}`,
      productId,
      productName: prodName || 'Product',
      type: newOutOfStock ? 'out_of_stock' : 'in_stock',
      date: now.toISOString().split('T')[0],
      time: formattedTime,
      note: reason || (newOutOfStock ? 'Marked Out of Stock by Admin' : 'Marked In Stock by Admin'),
      adminName: 'Store Admin',
      previousStock: currentStock,
      newStock: newOutOfStock ? 0 : currentStock,
    };

    setStockHistoryLogs((prev) => [newLog, ...prev]);
    addToast(
      newOutOfStock ? 'Marked Out of Stock 🚨' : 'Marked In Stock ✅',
      `${prodName || 'Product'} is now ${newOutOfStock ? 'marked Out of Stock on storefront' : 'marked In Stock'}.`,
      newOutOfStock ? 'info' : 'success'
    );
  };

  const toggleProductVisibility = (productId: string, reason?: string) => {
    let prodName = '';
    let newIsHidden = false;

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          prodName = p.name;
          newIsHidden = !p.isHidden;
          return {
            ...p,
            isHidden: newIsHidden,
            statusReason: reason || p.statusReason,
          };
        }
        return p;
      })
    );

    if (isSupabaseConfigured()) {
      updateProductInDb(productId, {
        isHidden: newIsHidden,
      }).catch((err) => console.warn('Could not toggle visibility in Supabase:', err));
    }

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const newLog: StockHistoryLog = {
      id: `log-${Date.now()}`,
      productId,
      productName: prodName || 'Product',
      type: newIsHidden ? 'hidden' : 'visible',
      date: now.toISOString().split('T')[0],
      time: formattedTime,
      note: reason || (newIsHidden ? 'Hidden from storefront by Admin' : 'Restored to storefront by Admin'),
      adminName: 'Store Admin',
    };

    setStockHistoryLogs((prev) => [newLog, ...prev]);
    addToast(
      newIsHidden ? 'Product Hidden 🙈' : 'Product Made Visible 👁️',
      `${prodName || 'Product'} is now ${newIsHidden ? 'hidden from storefront & homepage' : 'visible on storefront'}.`,
      newIsHidden ? 'info' : 'success'
    );
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

  // Production RBAC & Admin Session State
  const [adminAuthLoading, setAdminAuthLoading] = useState<boolean>(true);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [currentAdminRole, setCurrentAdminRole] = useState<AdminRole | null>(null);
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string | null>(null);
  const [currentAdminIdentity, setCurrentAdminIdentity] = useState<AdminSessionIdentity | null>(null);

  const hasPermission = (permission: AdminPermission | string): boolean => {
    if (!isAdminAuthenticated || !currentAdminRole) return false;
    if (currentAdminRole === 'super_admin' || currentAdminRole === 'admin') return true;
    if (currentAdminIdentity?.permissions?.includes('*')) return true;
    if (currentAdminIdentity?.permissions?.includes(permission)) return true;
    const category = permission.split('.')[0];
    if (currentAdminIdentity?.allowedTabs?.includes(category)) return true;
    return false;
  };

  const hasTabAccess = (tabName: string): boolean => {
    if (!isAdminAuthenticated || !currentAdminRole) return false;
    if (currentAdminRole === 'super_admin' || currentAdminRole === 'admin') return true;
    if (tabName === 'profile') return true;
    return currentAdminIdentity?.allowedTabs?.includes(tabName) || false;
  };

  const [storeAdminUsers, setStoreAdminUsers] = useState<StoreAdminUser[]>(() =>
    getInitialState('aura_store_admin_users', DEFAULT_STORE_ADMIN_USERS)
  );

  useEffect(() => {
    if (!isProductionEnv()) {
      localStorage.setItem('aura_store_admin_users', JSON.stringify(storeAdminUsers));
    }
  }, [storeAdminUsers]);

  const addStoreAdminUser = (admin: Omit<StoreAdminUser, 'id' | 'createdAt'>) => {
    const newAdmin: StoreAdminUser = {
      ...admin,
      id: `admin-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      role: 'admin',
    };
    setStoreAdminUsers((prev) => [...prev, newAdmin]);
    addToast('Store Admin Added 👤', `Account for ${admin.name} (${admin.email}) created.`, 'success');
  };

  const deleteStoreAdminUser = (idOrEmail: string) => {
    setStoreAdminUsers((prev) =>
      prev.filter((a) => a.id !== idOrEmail && a.email.toLowerCase() !== idOrEmail.toLowerCase())
    );
    addToast('Store Admin Removed 🗑️', 'Admin account permanently deleted from the store system.', 'info');
  };

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
  const [storeInfo, setStoreInfo] = useState<StoreInfo>(() =>
    getInitialState('aura_store_info', DEFAULT_STORE_INFO)
  );
  const [orders, setOrders] = useState<Order[]>(() =>
    getInitialState('aura_orders', INITIAL_MOCK_ORDERS)
  );

  // Persistent LocalStorage Effects (Isolate business and order state to development mode)
  useEffect(() => {
    if (!isProductionEnv()) {
      localStorage.setItem('aura_products', JSON.stringify(products));
    }
  }, [products]);

  useEffect(() => {
    if (!isProductionEnv()) {
      localStorage.setItem('aura_categories', JSON.stringify(categories));
    }
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
    if (!isProductionEnv()) {
      localStorage.setItem('aura_weekly_highlights', JSON.stringify(weeklyHighlights));
    }
  }, [weeklyHighlights]);

  useEffect(() => {
    if (!isProductionEnv()) {
      localStorage.setItem('aura_home_sections', JSON.stringify(homeSections));
    }
  }, [homeSections]);

  useEffect(() => {
    if (!isProductionEnv()) {
      localStorage.setItem('aura_hero_banners', JSON.stringify(heroBanners));
    }
  }, [heroBanners]);

  useEffect(() => {
    if (!isProductionEnv()) {
      localStorage.setItem('aura_header_announcements', JSON.stringify(headerAnnouncements));
    }
  }, [headerAnnouncements]);

  useEffect(() => {
    if (!isProductionEnv()) {
      localStorage.setItem('aura_coupons', JSON.stringify(coupons));
    }
  }, [coupons]);

  useEffect(() => {
    if (!isProductionEnv()) {
      localStorage.setItem('aura_cart_offers', JSON.stringify(cartOffers));
    }
  }, [cartOffers]);

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
    if (!isProductionEnv()) {
      localStorage.setItem('aura_store_info', JSON.stringify(storeInfo));
    }
  }, [storeInfo]);

  useEffect(() => {
    if (!isProductionEnv()) {
      localStorage.setItem('aura_orders', JSON.stringify(orders));
    }
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
      const rawPrice = weightOpt ? weightOpt.price : product.price;
      const unitPrice = product.discountPercentage && product.discountPercentage > 0
        ? Math.round(rawPrice * (1 - product.discountPercentage / 100))
        : rawPrice;

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

  // Order Placement (Server-Authoritative)
  const createOrder = async (
    paymentMethod: string,
    deliveryAddress: UserLocation,
    customerDetails?: {
      name?: string;
      phone?: string;
      email?: string;
      discount?: number;
      appliedOfferTitle?: string;
      couponCode?: string;
      idempotencyKey?: string;
    }
  ): Promise<Order> => {
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

    let authoritativeOrder: Order;

    if (isSupabaseConfigured()) {
      // 1. Invoke Server-Authoritative PostgreSQL Transactional RPC
      authoritativeOrder = await createOrderInDb(
        paymentMethod,
        deliveryAddress,
        cartItems,
        0, // Ignored by server
        0, // Ignored by server
        0, // Ignored by server
        0, // Ignored by server
        {
          name: finalName,
          phone: finalPhone,
          email: finalEmail,
          userId: supabaseUser?.id,
          appliedOfferTitle: customerDetails?.appliedOfferTitle,
          couponCode: customerDetails?.couponCode,
          idempotencyKey: customerDetails?.idempotencyKey,
        }
      );
    } else {
      // Local fallback for offline/development mode
      const localSubtotal = cartItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
      const localDiscount = customerDetails?.discount || 0;
      const localDeliveryFee = localSubtotal > 499 || localSubtotal === 0 ? 0 : 49;
      const localTotal = Math.max(0, localSubtotal + localDeliveryFee - localDiscount);

      authoritativeOrder = {
        id: `ord-${Date.now()}`,
        orderNumber: `Aishu-00${Math.floor(1000 + Math.random() * 9000)}`,
        trackingCode: `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toISOString().split('T')[0],
        items: [...cartItems],
        subtotal: localSubtotal,
        deliveryFee: localDeliveryFee,
        discount: localDiscount,
        total: localTotal,
        status: 'Active',
        orderStatus: 'placed',
        paymentStatus: paymentMethod.toLowerCase().includes('cash') || paymentMethod.toLowerCase().includes('cod') ? 'cod' : 'completed',
        deliveryAddress,
        paymentMethod,
        customerName: finalName,
        customerPhone: finalPhone,
        customerEmail: finalEmail,
        deliveryDays: 3,
      };
    }

    // Deduct stock in client state to reflect server deduction
    if (cartItems.length > 0) {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setProducts((prevProducts) =>
        prevProducts.map((p) => {
          const purchasedItems = cartItems.filter((ci) => ci.product.id === p.id);
          if (purchasedItems.length === 0) return p;

          const totalPurchasedQty = purchasedItems.reduce((sum, item) => sum + item.quantity, 0);
          const currentStock = p.inventoryCount ?? 100;
          const newStock = Math.max(0, currentStock - totalPurchasedQty);
          const isOut = newStock <= 0;

          return {
            ...p,
            inventoryCount: newStock,
            outOfStock: isOut,
            inStock: !isOut,
          };
        })
      );

      const newStockLogs: StockHistoryLog[] = cartItems.map((ci, idx) => {
        const prod = products.find((p) => p.id === ci.product.id) || ci.product;
        const currentStock = prod.inventoryCount ?? 100;
        const newStock = Math.max(0, currentStock - ci.quantity);
        return {
          id: `log-sale-${Date.now()}-${idx}-${ci.product.id}`,
          productId: ci.product.id,
          productName: ci.product.name,
          type: 'destock',
          quantity: ci.quantity,
          previousStock: currentStock,
          newStock: newStock,
          date: dateStr,
          time: timeStr,
          note: `Live Order Sale #${authoritativeOrder.orderNumber} (${ci.quantity} × ${ci.selectedWeight || '500g'})`,
          adminName: 'Live Order System',
        };
      });

      setStockHistoryLogs((prev) => [...newStockLogs, ...prev]);
    }

    setOrders((prev) => [authoritativeOrder, ...prev]);

    // Increment usage count for applied offer / coupon if applicable
    if (customerDetails?.appliedOfferTitle) {
      const appliedTitle = customerDetails.appliedOfferTitle.trim().toLowerCase();
      setCartOffers((prev) =>
        prev.map((o) =>
          o.title.toLowerCase() === appliedTitle || o.badgeText?.toLowerCase() === appliedTitle
            ? { ...o, usageCount: (o.usageCount || 0) + 1 }
            : o
        )
      );
    }
    if (customerDetails?.couponCode) {
      const cleanCoupon = customerDetails.couponCode.trim().toLowerCase();
      setCoupons((prev) =>
        prev.map((c) =>
          c.code.toLowerCase() === cleanCoupon
            ? { ...c, usageCount: (c.usageCount || 0) + 1 }
            : c
        )
      );
    }

    clearCart();
    return authoritativeOrder;
  };

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...profile }));
    addToast('Profile Updated', 'Your details have been saved.', 'success');
  };

  // ADMIN ACTIONS (Production Supabase Auth & PostgreSQL RBAC Authorization)
  const loginAdmin = async (email: string, pass: string): Promise<boolean> => {
    const cleanEmail = sanitizeInput(email).trim().toLowerCase();
    const cleanPass = pass.trim();

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

    if (!isSupabaseConfigured()) {
      addToast(
        'Backend Unavailable',
        'Supabase backend is not configured. Please check your environment configuration.',
        'error'
      );
      return false;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass,
      });

      if (authError || !authData.user) {
        rateLimiter.recordAttempt('admin_login_rate');
        addToast(
          'Authentication Failed ❌',
          'Invalid email or password. Please verify your administrative credentials.',
          'error'
        );
        return false;
      }

      // Query verified admin role from PostgreSQL
      const adminIdentity = await getCurrentAdminIdentityFromDb();
      const adminRoleRow = adminIdentity ? null : await getAdminRoleFromDb(authData.user.id);

      const resolvedRole: AdminRole | null =
        adminIdentity?.role || adminRoleRow?.role || null;
      const isActive: boolean =
        adminIdentity?.isActive ?? (adminRoleRow?.status === 'active');

      if (!resolvedRole || !isActive) {
        // Not an authorized active staff member; sign out immediately
        await supabase.auth.signOut();
        setIsAdminAuthenticated(false);
        setCurrentAdminRole(null);
        setCurrentAdminEmail(null);
        setCurrentAdminIdentity(null);
        addToast(
          'Access Denied 🚫',
          'You do not have active administrative privileges. Contact the store owner for access.',
          'error'
        );
        return false;
      }

      const activeIdentity: AdminSessionIdentity = adminIdentity || {
        userId: authData.user.id,
        email: cleanEmail,
        name: authData.user.user_metadata?.full_name || cleanEmail.split('@')[0],
        role: resolvedRole,
        status: 'active',
        allowedTabs: adminRoleRow?.allowed_tabs || ['products', 'orders', 'inventory'],
        permissions: adminRoleRow?.permissions || ['products.read', 'orders.read', 'inventory.read'],
      };

      rateLimiter.reset('admin_login_rate');
      setSupabaseUser(authData.user);
      setIsAdminAuthenticated(true);
      setCurrentAdminRole(resolvedRole);
      setCurrentAdminEmail(cleanEmail);
      setCurrentAdminIdentity(activeIdentity);

      addToast(
        resolvedRole === 'super_admin'
          ? '👑 Super Admin Authenticated'
          : resolvedRole === 'sub_admin'
          ? 'Sub-Admin Authenticated 🔒'
          : 'Store Admin Authenticated 🔒',
        `Welcome back, ${activeIdentity.name}!`,
        'success'
      );
      return true;
    } catch (err: any) {
      console.error('Error during administrative authentication:', err);
      addToast('Authentication Error', 'An unexpected error occurred. Please try again.', 'error');
      return false;
    }
  };

  const logoutAdmin = async () => {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Error signing out Supabase user:', err);
    }
    setIsAdminAuthenticated(false);
    setCurrentAdminRole(null);
    setCurrentAdminEmail(null);
    setCurrentAdminIdentity(null);
    setSupabaseUser(null);
    localStorage.removeItem('aura_admin_auth');
    localStorage.removeItem('aura_admin_role');
    localStorage.removeItem('aura_admin_email');
    localStorage.removeItem('aura_admin_auth_time');
    addToast('Signed Out 🔒', 'Admin session terminated safely.', 'info');
  };

  const addCategory = (
    name: string,
    image?: string,
    description?: string,
    imageScale?: number,
    panOffsetX?: number,
    panOffsetY?: number
  ): ProductCategory => {
    const trimmedName = name.trim();
    const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newCat: ProductCategory = {
      id: `cat-${Date.now()}`,
      name: trimmedName,
      slug,
      itemCount: 0,
      image: image || 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=800&auto=format&fit=crop',
      description: description || `Authentic handcrafted homemade ${trimmedName}.`,
      imageScale: imageScale ?? 1,
      panOffsetX: panOffsetX ?? 0,
      panOffsetY: panOffsetY ?? 0,
    };

    setCategories((prev) => {
      const exists = prev.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase());
      if (exists) return prev;
      return [...prev, newCat];
    });

    if (isSupabaseConfigured()) {
      createCategoryInDb(trimmedName, image, description, imageScale, panOffsetX, panOffsetY).catch((err) =>
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
    const initialQty = typeof product.inventoryCount === 'number' ? product.inventoryCount : 100;
    const isOut = Boolean(product.outOfStock) || initialQty <= 0;
    const newProd: Product = {
      ...product,
      id: product.id || `prod-${Date.now()}`,
      inventoryCount: initialQty,
      outOfStock: isOut,
      inStock: !isOut,
    };
    setProducts((prev) => [newProd, ...prev]);

    if (isSupabaseConfigured()) {
      createProductInDb(newProd).catch((err) =>
        console.warn('Could not persist product to Supabase:', err)
      );
    }

    const now = new Date();
    const newLog: StockHistoryLog = {
      id: `log-init-${Date.now()}`,
      productId: newProd.id,
      productName: newProd.name,
      type: 'restock',
      quantity: initialQty,
      previousStock: 0,
      newStock: initialQty,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      note: 'Initial catalog stock batch added',
      adminName: 'Store Admin',
    };
    setStockHistoryLogs((prev) => [newLog, ...prev]);

    addToast('Product Created ✅', `${newProd.name} added to catalog with ${initialQty} units in stock.`, 'success');
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

  const moveHomeSection = (id: string, direction: 'up' | 'down') => {
    setHomeSections((prev) => {
      const index = prev.findIndex((s) => s.id === id);
      if (index === -1) return prev;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, item);
      if (isSupabaseConfigured()) {
        copy.forEach((sec, idx) => {
          saveHomeSectionInDb(sec, idx).catch(console.warn);
        });
      }
      return copy;
    });
    addToast('Section Reordered', `Section moved ${direction}.`, 'info');
  };

  const setSectionProducts = (sectionId: string, productIds: string[]) => {
    setHomeSections((prev) => {
      const updatedList = prev.map((s) => (s.id === sectionId ? { ...s, productIds } : s));
      const targetSec = updatedList.find((s) => s.id === sectionId);
      if (targetSec && isSupabaseConfigured()) {
        const order = updatedList.findIndex((s) => s.id === sectionId);
        saveHomeSectionInDb(targetSec, order >= 0 ? order : 0).catch(console.warn);
      }
      return updatedList;
    });
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


  // Cart Offers Admin & Dynamic Evaluation
  const addCartOffer = (offer: Omit<CartOffer, 'id' | 'usageCount'>) => {
    const newOffer: CartOffer = {
      ...offer,
      id: `co-${Date.now()}`,
      title: sanitizeInput(offer.title).trim(),
      description: sanitizeInput(offer.description).trim(),
      usageCount: 0,
    };
    setCartOffers((prev) => [newOffer, ...prev]);
    addToast('Cart Offer Created 🎉', `Cart offer "${newOffer.title}" activated.`, 'success');
  };

  const updateCartOffer = (id: string, updated: Partial<CartOffer>) => {
    setCartOffers((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              ...updated,
              title: updated.title ? sanitizeInput(updated.title).trim() : o.title,
              description: updated.description ? sanitizeInput(updated.description).trim() : o.description,
            }
          : o
      )
    );
    addToast('Cart Offer Updated', 'Cart offer settings saved successfully.', 'success');
  };

  const deleteCartOffer = (id: string) => {
    setCartOffers((prev) => prev.filter((o) => o.id !== id));
    addToast('Cart Offer Removed', 'Cart offer removed from store.', 'info');
  };

  const toggleCartOfferStatus = (id: string) => {
    setCartOffers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, enabled: !o.enabled } : o))
    );
    addToast('Status Updated', 'Cart offer status toggled.', 'info');
  };

  const getBestCartOffer = (
    cartItemsList: CartItem[],
    cartSubtotal: number
  ) => {
    const totalQty = cartItemsList.reduce((acc, i) => acc + i.quantity, 0);
    const activeOffers = cartOffers.filter((o) => {
      if (!o.enabled) return false;
      if (o.expiryDate) {
        const today = new Date().toISOString().split('T')[0];
        if (today > o.expiryDate) return false;
      }
      return true;
    });

    const eligibleOffers: CartOffer[] = [];
    let nextOffer: { offer: CartOffer; missingAmount: number; missingQuantity: number; progressPercentage: number } | undefined = undefined;
    let smallestMissingVal = Infinity;

    for (const offer of activeOffers) {
      const meetsValue = cartSubtotal >= offer.minCartValue;
      const meetsQty = !offer.minCartQuantity || totalQty >= offer.minCartQuantity;

      if (meetsValue && meetsQty) {
        eligibleOffers.push(offer);
      } else {
        const missingAmount = Math.max(0, offer.minCartValue - cartSubtotal);
        const missingQuantity = offer.minCartQuantity ? Math.max(0, offer.minCartQuantity - totalQty) : 0;

        if (missingAmount > 0 && missingAmount < smallestMissingVal) {
          smallestMissingVal = missingAmount;
          const progress = Math.min(99, Math.round((cartSubtotal / offer.minCartValue) * 100));
          nextOffer = {
            offer,
            missingAmount,
            missingQuantity,
            progressPercentage: Math.max(10, progress),
          };
        }
      }
    }

    let bestOffer: CartOffer | undefined = undefined;
    let bestDiscount = 0;
    let freeGift: string | undefined = undefined;
    let isFreeShipping = false;

    for (const offer of eligibleOffers) {
      let currentDiscount = 0;
      if (offer.offerType === 'percentage') {
        const raw = Math.round((cartSubtotal * offer.discountValue) / 100);
        currentDiscount = offer.maxDiscount ? Math.min(raw, offer.maxDiscount) : raw;
      } else if (offer.offerType === 'flat') {
        currentDiscount = Math.min(cartSubtotal, offer.discountValue);
      } else if (offer.offerType === 'free_shipping') {
        isFreeShipping = true;
      } else if (offer.offerType === 'free_gift') {
        if (offer.freeGiftItemName) {
          freeGift = offer.freeGiftItemName;
        }
      }

      if (currentDiscount > bestDiscount) {
        bestDiscount = currentDiscount;
        bestOffer = offer;
      }
    }

    if (!bestOffer && eligibleOffers.length > 0) {
      bestOffer = eligibleOffers[0];
    }

    return {
      eligibleOffers,
      bestOffer,
      discountAmount: bestDiscount,
      freeGift,
      isFreeShipping,
      nextOffer,
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

  const cancelOrder = (orderId: string, reason: string, cancelledBy = 'Store Admin') => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const cancelledAt = `${dateStr} ${timeStr}`;

    const targetOrder = orders.find((o) => o.id === orderId || o.orderNumber === orderId);

    // Restore stock if the order had purchased items
    if (targetOrder && targetOrder.items && targetOrder.items.length > 0 && targetOrder.orderStatus !== 'cancelled') {
      setProducts((prevProducts) =>
        prevProducts.map((p) => {
          const matchingItems = targetOrder.items.filter((item) => item.product.id === p.id);
          if (matchingItems.length === 0) return p;

          const totalRestoredQty = matchingItems.reduce((acc, item) => acc + item.quantity, 0);
          const currentStock = p.inventoryCount ?? 0;
          const newStock = currentStock + totalRestoredQty;

          if (isSupabaseConfigured()) {
            updateProductInDb(p.id, { inventoryCount: newStock, outOfStock: false }).catch(console.warn);
            logStockMovementInDb(
              p.id,
              p.name,
              'restock',
              totalRestoredQty,
              `Order #${targetOrder.orderNumber} Cancelled - Restocked units (${reason})`
            ).catch(console.warn);
          }

          return {
            ...p,
            inventoryCount: newStock,
            outOfStock: false,
            inStock: true,
          };
        })
      );

      const restoreLogs: StockHistoryLog[] = targetOrder.items.map((ci, idx) => {
        const prod = products.find((p) => p.id === ci.product.id) || ci.product;
        const currentStock = prod.inventoryCount ?? 0;
        const newStock = currentStock + ci.quantity;
        return {
          id: `log-cancel-${Date.now()}-${idx}-${ci.product.id}`,
          productId: ci.product.id,
          productName: ci.product.name,
          type: 'restock',
          quantity: ci.quantity,
          previousStock: currentStock,
          newStock: newStock,
          date: dateStr,
          time: timeStr,
          note: `Order #${targetOrder.orderNumber} Cancelled - Restocked items (${reason})`,
          adminName: cancelledBy,
        };
      });

      setStockHistoryLogs((prev) => [...restoreLogs, ...prev]);
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId || o.orderNumber === orderId
          ? {
              ...o,
              orderStatus: 'cancelled',
              status: 'Cancelled',
              cancelReason: reason,
              cancelledAt,
              cancelledBy,
            }
          : o
      )
    );

    if (isSupabaseConfigured()) {
      cancelOrderInDb(orderId, reason).catch((err) =>
        console.warn('Could not cancel order in Supabase:', err)
      );
    }
    addToast('Order Cancelled 🚨', `Order #${orderId} marked as Cancelled & stock restored.`, 'info');
  };

  // Settings & WhatsApp Admin
  const updateStoreInfo = (updated: Partial<StoreInfo>) => {
    setStoreInfo((prev) => ({ ...prev, ...updated }));
    addToast('Store Settings Saved', 'Business details & checkout configuration updated.', 'success');
  };

  const exportStoreBackupJson = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      storeInfo,
      productsCount: products.length,
      categoriesCount: categories.length,
      ordersCount: orders.length,
      products,
      categories,
      coupons,
      deliveryCities,
      homeSections,
      heroBanners,
      headerAnnouncements,
      headerSettings,
    };
    return JSON.stringify(backupData, null, 2);
  };

  const resetStoreToDefault = () => {
    setStoreInfo(DEFAULT_STORE_INFO);
    setPaymentEnabledState(true);
    addToast('Settings Reset', 'Store settings restored to default values.', 'info');
  };

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
        storeInfo,
        updateStoreInfo,
        exportStoreBackupJson,
        resetStoreToDefault,
        subAdmins,
        adminAuthLoading,
        isAdminAuthenticated,
        currentAdminRole,
        currentAdminEmail,
        currentAdminIdentity,
        hasPermission,
        hasTabAccess,
        storeAdminUsers,
        addStoreAdminUser,
        deleteStoreAdminUser,
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
        moveHomeSection,
        setSectionProducts,
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
        cartOffers,
        addCartOffer,
        updateCartOffer,
        deleteCartOffer,
        toggleCartOfferStatus,
        getBestCartOffer,
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
        setProductStock,
        toggleProductOutOfStock,
        toggleProductVisibility,
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
