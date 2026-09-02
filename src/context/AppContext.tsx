import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  ProductCategory,
  CartItem,
  Order,
  UserProfile,
  UserLocation,
  ToastMessage,
  ModalType,
} from '../types';
import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_USER_PROFILE, MOCK_LOCATIONS } from '../data/mockData';

interface AppContextType {
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

  // Cart Actions
  addToCart: (product: Product, selectedWeight?: string, quantity?: number) => void;
  updateCartQuantity: (productId: string, selectedWeight: string, newQty: number) => void;
  removeFromCart: (productId: string, selectedWeight: string) => void;
  clearCart: () => void;

  // Wishlist Actions
  toggleWishlist: (productId: string) => void;

  // Recently Viewed Actions
  addRecentlyViewed: (productId: string) => void;

  // Order Actions
  createOrder: (paymentMethod: string, address: UserLocation) => Order;

  // Location Actions
  setCurrentLocation: (loc: UserLocation) => void;
  addLocation: (loc: Omit<UserLocation, 'id'>) => void;
  deleteLocation: (id: string) => void;

  // Profile Actions
  updateUserProfile: (profile: Partial<UserProfile>) => void;

  // Toast Notifications
  addToast: (title: string, message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products] = useState<Product[]>(MOCK_PRODUCTS);
  const [categories] = useState<ProductCategory[]>(MOCK_CATEGORIES);
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      product: MOCK_PRODUCTS[0], // Grandma Avakaya
      selectedWeight: '500g',
      unitPrice: 9.99,
      quantity: 1,
    },
    {
      product: MOCK_PRODUCTS[5], // Pure Ghee Mysore Pak
      selectedWeight: '500g',
      unitPrice: 12.99,
      quantity: 1,
    },
  ]);

  const [wishlistProductIds, setWishlistProductIds] = useState<string[]>(['prod-1', 'prod-6', 'prod-14']);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>(['prod-1', 'prod-2', 'prod-6', 'prod-7']);
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'ord-101',
      orderNumber: 'AURA-84920',
      date: '2026-08-28',
      items: [
        { product: MOCK_PRODUCTS[0], selectedWeight: '500g', unitPrice: 9.99, quantity: 2 },
        { product: MOCK_PRODUCTS[6], selectedWeight: '500g', unitPrice: 15.99, quantity: 1 },
      ],
      subtotal: 35.97,
      deliveryFee: 3.50,
      discount: 5.00,
      total: 34.47,
      status: 'Delivered',
      deliveryAddress: MOCK_LOCATIONS[0],
      paymentMethod: 'UPI (GPay)',
    },
  ]);

  const [userProfile, setUserProfile] = useState<UserProfile>(MOCK_USER_PROFILE);
  const [locations, setLocations] = useState<UserLocation[]>(MOCK_LOCATIONS);
  const [currentLocation, setCurrentLocation] = useState<UserLocation>(MOCK_LOCATIONS[0]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast Helper
  const addToast = (title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Cart Handlers
  const addToCart = (product: Product, selectedWeight?: string, quantity: number = 1) => {
    const weight = selectedWeight || product.defaultWeight;
    const option = product.weightOptions.find((w) => w.weight === weight);
    const unitPrice = option ? option.price : product.price;

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) => i.product.id === product.id && i.selectedWeight === weight
      );
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      return [...prev, { product, selectedWeight: weight, unitPrice, quantity }];
    });

    addToast('Added to Cart', `${product.name} (${weight}) added to your cart.`);
  };

  const updateCartQuantity = (productId: string, selectedWeight: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(productId, selectedWeight);
      return;
    }
    setCartItems((prev) =>
      prev.map((i) =>
        i.product.id === productId && i.selectedWeight === selectedWeight
          ? { ...i, quantity: newQty }
          : i
      )
    );
  };

  const removeFromCart = (productId: string, selectedWeight: string) => {
    setCartItems((prev) => prev.filter((i) => !(i.product.id === productId && i.selectedWeight === selectedWeight)));
    addToast('Item Removed', 'Item removed from cart.', 'info');
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Wishlist Handler
  const toggleWishlist = (productId: string) => {
    setWishlistProductIds((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        addToast('Removed from Wishlist', 'Product removed from saved items.', 'info');
        return prev.filter((id) => id !== productId);
      } else {
        addToast('Saved to Wishlist', 'Product added to your wishlist.');
        return [...prev, productId];
      }
    });
  };

  // Recently Viewed Handler
  const addRecentlyViewed = (productId: string) => {
    setRecentlyViewedIds((prev) => {
      const filtered = prev.filter((id) => id !== productId);
      return [productId, ...filtered].slice(0, 8);
    });
  };

  // Create Order Handler
  const createOrder = (paymentMethod: string, address: UserLocation): Order => {
    const subtotal = cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const deliveryFee = subtotal > 35 ? 0 : 3.50;
    const discount = subtotal > 50 ? 5.00 : 0;
    const total = subtotal + deliveryFee - discount;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `AURA-${Math.floor(10000 + Math.random() * 90000)}`,
      date: new Date().toISOString().split('T')[0],
      items: [...cartItems],
      subtotal,
      deliveryFee,
      discount,
      total,
      status: 'Active',
      deliveryAddress: address,
      paymentMethod,
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  // Location Handlers
  const addLocation = (loc: Omit<UserLocation, 'id'>) => {
    const newLoc: UserLocation = { id: `loc-${Date.now()}`, ...loc };
    setLocations((prev) => [...prev, newLoc]);
    setCurrentLocation(newLoc);
    addToast('Address Saved', `${newLoc.label} address saved.`);
  };

  const deleteLocation = (id: string) => {
    setLocations((prev) => prev.filter((l) => l.id !== id));
    addToast('Address Deleted', 'Address removed.', 'info');
  };

  // Profile Handler
  const updateUserProfile = (updated: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...updated }));
    addToast('Profile Updated', 'Profile details updated.');
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

        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,

        toggleWishlist,
        addRecentlyViewed,

        createOrder,

        setCurrentLocation,
        addLocation,
        deleteLocation,

        updateUserProfile,

        addToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
