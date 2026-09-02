export interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  date: string;
  comment: string;
  verifiedPurchase: boolean;
  chefReply?: string;
}

export interface Dish {
  id: string;
  name: string;
  chefId: string;
  chefName: string;
  chefImage?: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  category: string;
  image: string;
  gallery?: string[];
  description: string;
  portionSize: string;
  ingredients: string[];
  dietaryInfo: string[];
  calories?: number;
  prepTime: string;
  isVeg: boolean;
  isTrending?: boolean;
  isMostOrdered?: boolean;
  tags: string[];
  reviews?: Review[];
}

export interface ChefDocument {
  id: string;
  name: string;
  type: 'FSSAI License' | 'Government ID' | 'Kitchen Audit Report' | 'Bank Detail';
  fileUrl: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedDate: string;
}

export interface KitchenSchedule {
  openStatus: boolean;
  dailyHours: string;
  holidayMode: boolean;
  pauseOrders: boolean;
  weeklySchedule: { day: string; hours: string; isOpen: boolean }[];
}

export interface Chef {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviewsCount: number;
  experienceYears: number;
  specialty: string;
  image: string;
  coverImage: string;
  avatar: string;
  bio: string;
  about?: string;
  dishesCount: number;
  badges: string[];
  isTrending?: boolean;
  status: 'Pending' | 'Verified' | 'Rejected' | 'Suspended' | 'Active';
  documents?: ChefDocument[];
  schedule?: KitchenSchedule;
  reviews?: Review[];
  totalEarnings?: number;
  ordersCount?: number;
  joinedDate?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  count: number;
  image: string;
  description: string;
  isPopular?: boolean;
}

export interface Collection {
  id: string;
  title: string;
  subtitle: string;
  itemsCount: number;
  image: string;
  tag: string;
}

export interface CartItem {
  dish: Dish;
  quantity: number;
  notes?: string;
}

export interface UserLocation {
  id: string;
  label: string;
  name?: string;
  phone?: string;
  houseNo?: string;
  street?: string;
  area: string;
  city: string;
  state?: string;
  pincode?: string;
  landmark?: string;
  address: string;
  isDefault?: boolean;
}

export interface OrderTimelineStep {
  status: string;
  time: string;
  completed: boolean;
  current?: boolean;
  description: string;
}

export type OrderStatus =
  | 'Order Placed'
  | 'Confirmed'
  | 'Preparing'
  | 'Ready'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: UserLocation;
  chefId: string;
  chefName: string;
  chefAvatar: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  packagingFee: number;
  discount: number;
  taxes: number;
  total: number;
  paymentMethod: 'UPI' | 'Credit/Debit Card' | 'Cash on Delivery';
  status: OrderStatus;
  date: string;
  estimatedDeliveryTime: string;
  timeline: OrderTimelineStep[];
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  joinedDate: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'Orders' | 'Offers' | 'Platform';
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: 'Order' | 'Payment' | 'Delivery' | 'General';
  status: 'Open' | 'In Progress' | 'Resolved';
  date: string;
  messages: { sender: string; text: string; time: string }[];
}

export interface Promotion {
  id: string;
  name: string;
  code: string;
  discountPercent: number;
  maxDiscount: number;
  startDate: string;
  endDate: string;
  usageCount: number;
  usageLimit: number;
  status: 'Active' | 'Expired' | 'Disabled';
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  review: string;
  verifiedBuyer: boolean;
  chefOrderedFrom: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export type PortalMode = 'customer' | 'chef' | 'admin';

export type ModalType = 
  | null 
  | 'location' 
  | 'search' 
  | 'cart' 
  | 'favorites' 
  | 'login' 
  | 'chefMenu' 
  | 'quickDish'
  | 'becomeChef'
  | 'addAddress'
  | 'editAddress'
  | 'addDish'
  | 'editDish'
  | 'ticket';
