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
} from '../data/mockData';

interface AppContextType {
  // Catalog & State
  products: Product[];
  categories: ProductCategory[];
  cartItems: CartItem[];
  wishlistProductIds: string[];
  recentlyViewedIds: string[];
  orders: Order[];
  userProfile: UserProfile;
  locations: UserLocation[];
  currentLocation: UserLocation;
  toasts: ToastMessage[];

  // Admin Data & State
  isAdminAuthenticated: boolean;
  deliveryCities: DeliveryCity[];
  citySuggestions: CitySuggestion[];
  whatsappContacts: WhatsAppContact[];
  newsletterSubscribers: string[];
  paymentEnabled: boolean;

  // Actions - Customer
  addToCart: (product: Product, selectedWeight: string, quantity?: number) => void;
  updateCartQuantity: (productId: string, selectedWeight: string, delta: number) => void;
  removeFromCart: (productId: string, selectedWeight: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  addRecentlyViewed: (productId: string) => void;
  createOrder: (paymentMethod: string, deliveryAddress: UserLocation) => Order;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  setCurrentLocation: (loc: UserLocation) => void;
  addToast: (title: string, message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;

  // Actions - Admin
  loginAdmin: (email: string, pass: string) => boolean;
  logoutAdmin: () => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updated: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  toggleProductBestSeller: (id: string) => void;
  toggleProductFestival: (id: string) => void;
  updateProductDiscount: (id: string, percentage: number, expiryDate: string) => void;
  removeProductDiscount: (id: string) => void;
  
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
  addWhatsAppContact: (name: string, phone: string) => void;
  updateWhatsAppContact: (id: string, updated: Partial<WhatsAppContact>) => void;
  deleteWhatsAppContact: (id: string) => void;
  addNewsletterSubscriber: (email: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [categories] = useState<ProductCategory[]>(MOCK_CATEGORIES);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [wishlistProductIds, setWishlistProductIds] = useState<string[]>(['prod-1', 'prod-6']);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(['prod-1', 'prod-7']);
  const [locations] = useState<UserLocation[]>(MOCK_LOCATIONS);
  const [currentLocation, setCurrentLocation] = useState<UserLocation>(MOCK_LOCATIONS[0]);
  const [userProfile, setUserProfile] = useState<UserProfile>(MOCK_USER_PROFILE);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Admin Specific State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('aura_admin_auth') === 'true';
  });
  const [deliveryCities, setDeliveryCities] = useState<DeliveryCity[]>(MOCK_DELIVERY_CITIES);
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>(MOCK_CITY_SUGGESTIONS);
  const [whatsappContacts, setWhatsappContacts] = useState<WhatsAppContact[]>(MOCK_WHATSAPP_CONTACTS);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<string[]>(MOCK_SUBSCRIBERS);
  const [paymentEnabled, setPaymentEnabledState] = useState<boolean>(true);

  // Initial Mock Orders
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'ord-1001',
      orderNumber: 'AURA-98214',
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
      deliveryDays: 2,
    },
    {
      id: 'ord-1002',
      orderNumber: 'AURA-97410',
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
      deliveryDays: 3,
    },
  ]);

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

  const updateCartQuantity = (productId: string, selectedWeight: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId && item.selectedWeight === selectedWeight) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
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
  const createOrder = (paymentMethod: string, deliveryAddress: UserLocation): Order => {
    const subtotal = cartItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);
    const deliveryFee = subtotal > 35 ? 0 : 3.5;
    const total = subtotal + deliveryFee;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `AURA-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toISOString().split('T')[0],
      items: [...cartItems],
      subtotal,
      deliveryFee,
      discount: 0,
      total,
      status: 'Active',
      orderStatus: 'pending',
      paymentStatus: 'completed',
      deliveryAddress,
      paymentMethod,
      deliveryDays: 3,
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...profile }));
    addToast('Profile Updated', 'Your details have been saved.', 'success');
  };

  // ADMIN ACTIONS
  const loginAdmin = (email: string, pass: string): boolean => {
    if (email === 'admin@aura.com' && pass === 'admin123') {
      setIsAdminAuthenticated(true);
      localStorage.setItem('aura_admin_auth', 'true');
      addToast('Admin Authenticated', 'Welcome to Aura Admin Portal.', 'success');
      return true;
    }
    addToast('Authentication Failed', 'Invalid admin email or password.', 'error');
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('aura_admin_auth');
    addToast('Signed Out', 'Logged out of Admin Portal.', 'info');
  };

  const addProduct = (product: Omit<Product, 'id'>) => {
    const newProd: Product = { ...product, id: `prod-${Date.now()}` };
    setProducts((prev) => [newProd, ...prev]);
    addToast('Product Created', `${newProd.name} added to catalog.`, 'success');
  };

  const updateProduct = (id: string, updated: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    addToast('Product Updated', 'Product changes saved successfully.', 'success');
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    addToast('Product Deleted', 'Product removed from catalog.', 'info');
  };

  const toggleProductBestSeller = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isBestSeller: !p.isBestSeller } : p))
    );
    addToast('Best Seller Toggled', 'Best seller status updated.', 'success');
  };

  const toggleProductFestival = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isFestival: !p.isFestival } : p))
    );
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
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId || o.orderNumber === orderId) {
          const mainStatus = status === 'delivered' ? 'Delivered' : status === 'pending' ? 'Active' : 'Active';
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
    addToast('Order Status Updated', `Order set to ${status}.`, 'success');
  };

  const updatePaymentStatus = (orderId: string, paymentStatus: Order['paymentStatus']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId || o.orderNumber === orderId ? { ...o, paymentStatus } : o))
    );
    addToast('Payment Status Updated', `Payment status updated to ${paymentStatus}.`, 'success');
  };

  const cancelOrder = (orderId: string, reason: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId || o.orderNumber === orderId
          ? { ...o, status: 'Cancelled', cancelReason: reason }
          : o
      )
    );
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
    if (!newsletterSubscribers.includes(email)) {
      setNewsletterSubscribers((prev) => [...prev, email]);
    }
  };

  return (
    <AppContext.Provider
      value={{
        products,
        categories,
        cartItems,
        wishlistProductIds,
        recentlyViewedIds,
        orders,
        userProfile,
        locations,
        currentLocation,
        toasts,
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
        addToast,
        removeToast,
        loginAdmin,
        logoutAdmin,
        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductBestSeller,
        toggleProductFestival,
        updateProductDiscount,
        removeProductDiscount,
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
