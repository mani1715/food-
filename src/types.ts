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
  inStock?: boolean;
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
  date: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  status: 'Active' | 'Delivered' | 'Cancelled';
  deliveryAddress: UserLocation;
  paymentMethod: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info';
}

export type ModalType = 'location' | 'cart' | 'wishlist' | 'search' | 'login' | 'quickView' | null;
