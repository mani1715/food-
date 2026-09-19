export interface WeightOption {
  weight: string; // e.g. "250g", "500g", "1kg"
  price: number;  // e.g. 8.99, 15.99, 29.99
  stock?: number;  // remaining stock for this weight (e.g. 11 for 250g, 31 for 500g)
  shippingWeightGrams?: number;
  packageLengthCm?: number;
  packageWidthCm?: number;
  packageHeightCm?: number;
  isFragile?: boolean;
  requiresSpecialHandling?: boolean;
}

export interface ProcessStep {
  stepNumber: string; // e.g. "01", "02", "03", "04", "05"
  title: string;      // e.g. "Freshly Picked Produce"
  subtitle: string;   // e.g. "Direct Farm Sourcing"
  description: string;// e.g. "Selected raw mangoes and Gongura leaves sourced directly from local Andhra orchards..."
}

export interface Product {
  id: string;
  name: string;
  category: string; // "Pickles" | "Sweets" | "Snacks" | "Bakery" | "Powders" | "Instant Mixes" | "Dry Fruits" | "Gift Boxes"
  price: number; // Base price for default weight
  rating: number;
  reviewsCount: number;
  image: string;
  gallery?: string[];
  description: string;
  ingredients?: string[];
  weightOptions: WeightOption[];
  defaultWeight: string; // e.g. "500g"
  isVeg: boolean; // true for Veg, false for Non-Veg
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isPickleSpecial?: boolean;
  isSweetSpecial?: boolean;
  isFestival?: boolean;
  discountPercentage?: number;
  discountExpiryDate?: string;
  inventoryCount?: number;
  outOfStock?: boolean;
  availableCities?: string[];
  inStock?: boolean;
  isHidden?: boolean;
  statusReason?: string;
  grandmaStory?: string;
  howWeDoText?: string;
  sourcingText?: string;
  qualityGuaranteeText?: string;
  customProcessSteps?: ProcessStep[];
  shelfLife?: string;
  storageInstructions?: string;
  allergenInfo?: string;
  packagingInfo?: string;
  shippingWeightGrams?: number;
  packageLengthCm?: number;
  packageWidthCm?: number;
  packageHeightCm?: number;
  isFragile?: boolean;
  requiresSpecialHandling?: boolean;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  itemCount: number;
  image: string;
  description: string;
  imageScale?: number; // Zoom scale (0.5 to 3.0)
  panOffsetX?: number; // Horizontal pan offset in px
  panOffsetY?: number; // Vertical pan offset in px
}

export interface CartItem {
  product: Product;
  selectedWeight: string;
  unitPrice: number;
  quantity: number;
}

export interface UserLocation {
  id: string;
  label: string; // "Home", "Work", "Other"
  address: string;
  city: string;
  pincode: string;
}

export interface DeliveryCity {
  id: string;
  name: string;
  state: string;
  charge: number;
  freeDeliveryThreshold?: number | null;
  enabled: boolean;
}

export interface CitySuggestion {
  id: string;
  city: string;
  state: string;
  customerName: string;
  phone: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  suggestedAt: string;
}

export interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  enabled: boolean;
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  joinedDate: string;
  role?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  trackingCode?: string;
  paymentSessionToken?: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: 'Active' | 'Delivered' | 'Cancelled';
  orderStatus: 'placed' | 'pending' | 'confirmed' | 'processing' | 'ready_to_ship' | 'shipped' | 'out for delivery' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'authorized' | 'paid' | 'failed' | 'refunded' | 'cod_pending' | 'cod_collected' | 'cod';
  deliveryAddress: UserLocation;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  appliedCouponCode?: string;
  appliedOfferTitle?: string;
  freeGiftSnapshot?: string;
  idempotencyKey?: string;
  adminNotes?: string;
  deliveryDays?: number;
  cancelReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  courierPartner?: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

export interface HighlightItem {
  type: 'day' | 'week' | 'festival';
  badgeText: string;
  title: string;
  subtitle: string;
  productId: string;
  discountPercentage?: number;
  image?: string;
  redirectLink?: string;
  imageScale?: number;
  panOffsetX?: number;
  panOffsetY?: number;
}

export interface WeeklyHighlights {
  specialOfDay: HighlightItem;
  specialOfWeek: HighlightItem;
  festivalSpecial: HighlightItem;
}

export interface HomeSection {
  id: string;
  badge?: string;
  title: string;
  subtitle?: string;
  productIds: string[];
  categoryFilter?: string;
  enabled: boolean;
}

export interface HeroBannerSlide {
  id: string;
  image: string;
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  enabled: boolean;
  objectPosition?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  objectFit?: 'cover' | 'contain' | 'fill';
  overlayOpacity?: 'light' | 'medium' | 'dark' | 'heavy';
  imageScale?: number; // 0.5 to 3.0 (e.g. 1 = 100%, 1.2 = 120% zoom in, 0.8 = 80% zoom out)
  panOffsetX?: number; // Horizontal pan offset in px or %
  panOffsetY?: number; // Vertical pan offset in px or %
}

export interface HeaderAnnouncement {
  id: string;
  text: string;
  enabled: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderAmount: number;
  appliesTo: 'all' | 'category' | 'product';
  targetCategory?: string;
  targetProductId?: string;
  expiryDate?: string;
  enabled: boolean;
  usageCount: number;
}

export interface CartOffer {
  id: string;
  title: string;
  description: string;
  offerType: 'percentage' | 'flat' | 'free_shipping' | 'free_gift';
  discountValue: number; // e.g. 10 (10%) or 150 (₹150)
  minCartValue: number;  // min subtotal in ₹ to qualify
  minCartQuantity?: number; // min item count to qualify
  maxDiscount?: number; // maximum discount cap for percentage offers
  freeGiftItemName?: string; // name of complimentary item (e.g. "Mini Kaju Katli Sample Box")
  badgeText?: string; // e.g. "HOT DEAL", "LIMITED TIME", "POPULAR"
  expiryDate?: string;
  enabled: boolean;
  autoApply: boolean; // if true, automatically applied when qualifying; otherwise 1-click apply
  usageCount?: number;
}


export type AdminTab =
  | 'analytics'
  | 'products'
  | 'notifications'
  | 'banners'
  | 'orders'
  | 'shipping'
  | 'locations'
  | 'bestsellers'
  | 'discounts'
  | 'settings'
  | 'newsletter'
  | 'profile';

export interface HeaderSubMenuItem {
  id: string;
  label: string;
  path: string;
  type?: 'category' | 'product' | 'custom';
  targetId?: string;
}

export interface CustomHeaderMenuItem {
  id: string;
  label: string;
  path: string;
  subCategories?: HeaderSubMenuItem[];
  enabled: boolean;
  order?: number;
  isSpecial?: boolean;
}

export interface HeaderSettings {
  showSearch: boolean;
  showWishlist: boolean;
  showAccount: boolean;
  showTrackOrder: boolean;
  showCart: boolean;
  showTopRotatingBar?: boolean;
  showMarqueeTicker?: boolean;
  topRotatingAnnouncements?: HeaderAnnouncement[];
  customMenuItems?: CustomHeaderMenuItem[];
  disabledCategoryNames: string[];
}

export interface StockHistoryLog {
  id: string;
  productId: string;
  productName: string;
  type: 'restock' | 'destock' | 'out_of_stock' | 'in_stock' | 'hidden' | 'visible';
  quantity?: number;
  date: string;
  time: string;
  note?: string;
  adminName?: string;
  previousStock?: number;
  newStock?: number;
}

export interface SubAdmin {
  id: string;
  name: string;
  email: string;
  password: string;
  roleTitle: string;
  allowedTabs: AdminTab[];
  createdAt: string;
}

export interface StoreInfo {
  storeName: string;
  tagline: string;
  supportEmail: string;
  supportPhone: string;
  supportWhatsApp?: string;
  kitchenAddress: string;
  fssaiNumber: string;
  gstin: string;
  currencySymbol: string;
  minOrderAmount: number;
  freeShippingThreshold: number;
  codEnabled: boolean;
  orderAcceptanceStatus: 'open' | 'vacation' | 'paused';
  vacationNotice?: string;
  deliveryTimeNotice?: string;
}

export type AdminRole = 'super_admin' | 'admin' | 'sub_admin';

export type AdminPermission =
  | 'products.read'
  | 'products.write'
  | 'orders.read'
  | 'orders.update'
  | 'inventory.read'
  | 'inventory.write'
  | 'coupons.read'
  | 'coupons.write'
  | 'banners.read'
  | 'banners.write'
  | 'delivery.read'
  | 'delivery.write'
  | 'shipping.view'
  | 'shipping.create'
  | 'shipping.update'
  | 'shipping.cancel'
  | 'shipping.pickup'
  | 'shipping.return'
  | 'shipping.reconcile'
  | 'shipping.settings'
  | 'settings.read'
  | 'settings.write'
  | 'analytics.read'
  | 'staff.manage'
  | '*';

export interface AdminSessionIdentity {
  userId: string;
  email: string;
  name: string;
  role: AdminRole;
  status: 'active' | 'suspended' | 'revoked';
  allowedTabs: string[];
  permissions: string[];
}

export interface StoreAdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin';
  createdAt: string;
  password?: string;
}

