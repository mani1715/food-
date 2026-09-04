export interface WeightOption {
  weight: string; // e.g. "250g", "500g", "1kg"
  price: number;  // e.g. 8.99, 15.99, 29.99
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
  grandmaStory?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  itemCount: number;
  image: string;
  description: string;
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
  name: string;
  email: string;
  phone: string;
  avatar: string;
  joinedDate: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  trackingCode?: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: 'Active' | 'Delivered' | 'Cancelled';
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'out for delivery' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed';
  deliveryAddress: UserLocation;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  adminNotes?: string;
  deliveryDays?: number;
  cancelReason?: string;
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

export type AdminTab =
  | 'analytics'
  | 'products'
  | 'orders'
  | 'locations'
  | 'bestsellers'
  | 'discounts'
  | 'settings'
  | 'newsletter'
  | 'profile';
