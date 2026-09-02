import React, { createContext, useContext, useState } from 'react';
import {
  Dish,
  Chef,
  Category,
  CartItem,
  UserLocation,
  Order,
  NotificationItem,
  SupportTicket,
  Promotion,
  UserProfile,
  PortalMode,
  OrderStatus,
} from '../types';
import {
  MOCK_DISHES,
  MOCK_CHEFS,
  MOCK_CATEGORIES,
  MOCK_LOCATIONS,
  MOCK_ORDERS,
  MOCK_NOTIFICATIONS,
  MOCK_TICKETS,
  MOCK_PROMOTIONS,
  MOCK_USER_PROFILE,
} from '../data/mockData';
import { ToastContainer, ToastMessage } from '../components/Toast';

interface AppContextType {
  portalMode: PortalMode;
  setPortalMode: (mode: PortalMode) => void;
  dishes: Dish[];
  chefs: Chef[];
  categories: Category[];
  locations: UserLocation[];
  currentLocation: UserLocation;
  setCurrentLocation: (loc: UserLocation) => void;
  cartItems: CartItem[];
  addToCart: (dish: Dish, quantity?: number, notes?: string) => void;
  updateCartQuantity: (dishId: string, delta: number) => void;
  removeFromCart: (dishId: string) => void;
  clearCart: () => void;
  favoriteDishIds: string[];
  favoriteChefIds: string[];
  toggleFavoriteDish: (dishId: string) => void;
  toggleFavoriteChef: (chefId: string) => void;
  orders: Order[];
  createOrder: (order: Partial<Order>) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  tickets: SupportTicket[];
  createSupportTicket: (subject: string, category: 'Order' | 'Payment' | 'Delivery' | 'General', text: string) => void;
  promotions: Promotion[];
  createPromotion: (promo: Partial<Promotion>) => void;
  togglePromotionStatus: (id: string) => void;
  userProfile: UserProfile;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  addLocation: (loc: Partial<UserLocation>) => void;
  updateLocation: (loc: UserLocation) => void;
  deleteLocation: (id: string) => void;
  addDish: (dish: Partial<Dish>) => void;
  updateDish: (dish: Dish) => void;
  deleteDish: (id: string) => void;
  updateChefStatus: (chefId: string, status: 'Verified' | 'Rejected' | 'Suspended' | 'Active') => void;
  addToast: (title: string, message: string, type?: 'success' | 'info' | 'error') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [portalMode, setPortalMode] = useState<PortalMode>('customer');
  const [dishes, setDishes] = useState<Dish[]>(MOCK_DISHES);
  const [chefs, setChefs] = useState<Chef[]>(MOCK_CHEFS);
  const [categories] = useState<Category[]>(MOCK_CATEGORIES);
  const [locations, setLocations] = useState<UserLocation[]>(MOCK_LOCATIONS);
  const [currentLocation, setCurrentLocation] = useState<UserLocation>(MOCK_LOCATIONS[0]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [favoriteDishIds, setFavoriteDishIds] = useState<string[]>(['dish-1', 'dish-2']);
  const [favoriteChefIds, setFavoriteChefIds] = useState<string[]>(['chef-1']);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [tickets, setTickets] = useState<SupportTicket[]>(MOCK_TICKETS);
  const [promotions, setPromotions] = useState<Promotion[]>(MOCK_PROMOTIONS);
  const [userProfile, setUserProfile] = useState<UserProfile>(MOCK_USER_PROFILE);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (title: string, message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random()}`,
      title,
      message,
      type,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addToCart = (dish: Dish, quantity = 1, notes = '') => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.dish.id === dish.id);
      if (existing) {
        return prev.map((item) =>
          item.dish.id === dish.id ? { ...item, quantity: item.quantity + quantity, notes: notes || item.notes } : item
        );
      }
      return [...prev, { dish, quantity, notes }];
    });
    addToast('Added to Order Basket', `${quantity}x "${dish.name}" added to cart.`);
  };

  const updateCartQuantity = (dishId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.dish.id === dishId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (dishId: string) => {
    setCartItems((prev) => prev.filter((item) => item.dish.id !== dishId));
    addToast('Item Removed', 'Dish removed from your cart.', 'info');
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const toggleFavoriteDish = (dishId: string) => {
    setFavoriteDishIds((prev) => {
      const isFav = prev.includes(dishId);
      if (isFav) {
        addToast('Wishlist Updated', 'Dish removed from saved favorites.', 'info');
        return prev.filter((id) => id !== dishId);
      }
      addToast('Saved to Wishlist ❤️', 'Dish bookmarked in your favorites.');
      return [...prev, dishId];
    });
  };

  const toggleFavoriteChef = (chefId: string) => {
    setFavoriteChefIds((prev) => {
      const isFav = prev.includes(chefId);
      if (isFav) {
        addToast('Wishlist Updated', 'Home chef unfollowed.', 'info');
        return prev.filter((id) => id !== chefId);
      }
      addToast('Chef Followed ❤️', 'Home chef saved to your favorite cooks list.');
      return [...prev, chefId];
    });
  };

  const createOrder = (orderData: Partial<Order>): Order => {
    const subtotal = cartItems.reduce((acc, i) => acc + i.dish.price * i.quantity, 0);
    const deliveryFee = 3.50;
    const packagingFee = 1.50;
    const taxes = Number((subtotal * 0.05).toFixed(2));
    const total = Number((subtotal + deliveryFee + packagingFee + taxes).toFixed(2));

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `AURA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: userProfile.name,
      customerPhone: userProfile.phone,
      customerEmail: userProfile.email,
      deliveryAddress: currentLocation,
      chefId: cartItems[0]?.dish.chefId || 'chef-1',
      chefName: cartItems[0]?.dish.chefName || 'Chef Lakshmi Rao',
      chefAvatar: cartItems[0]?.dish.chefImage || MOCK_CHEFS[0].avatar,
      items: [...cartItems],
      subtotal,
      deliveryFee,
      packagingFee,
      discount: 0,
      taxes,
      total,
      paymentMethod: orderData.paymentMethod || 'UPI',
      status: 'Order Placed',
      date: 'Just now',
      estimatedDeliveryTime: '25-30 Mins',
      timeline: [
        { status: 'Order Placed', time: 'Just now', completed: true, current: true, description: 'Order submitted to kitchen' },
        { status: 'Chef Confirmed', time: 'Pending', completed: false, description: 'Waiting for chef acceptance' },
        { status: 'Preparing Meal', time: 'Pending', completed: false, description: 'Clay pot cooking' },
        { status: 'Quality Packed', time: 'Pending', completed: false, description: 'Eco thermal container seal' },
        { status: 'Out for Delivery', time: 'Pending', completed: false, description: 'Express delivery partner' },
        { status: 'Delivered', time: 'Pending', completed: false, description: 'Delivered hot to door' },
      ],
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    addToast('Order Placed Successfully!', `Order #${newOrder.orderNumber} sent to ${newOrder.chefName}.`);
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId) {
          const updatedTimeline = ord.timeline.map((step) => {
            if (step.status.toLowerCase() === status.toLowerCase()) {
              return { ...step, completed: true, current: true, time: 'Just now' };
            }
            return step;
          });
          return { ...ord, status, timeline: updatedTimeline };
        }
        return ord;
      })
    );
    addToast('Order Status Updated', `Order status changed to "${status}".`, 'info');
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
    addToast('Notifications Cleared', 'All notifications cleared.', 'info');
  };

  const createSupportTicket = (subject: string, category: 'Order' | 'Payment' | 'Delivery' | 'General', text: string) => {
    const newTkt: SupportTicket = {
      id: `tkt-${Date.now()}`,
      ticketNumber: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      subject,
      category,
      status: 'Open',
      date: 'Just now',
      messages: [{ sender: 'You', text, time: 'Just now' }],
    };
    setTickets((prev) => [newTkt, ...prev]);
    addToast('Support Ticket Created', `Ticket #${newTkt.ticketNumber} opened. Our team will reply shortly.`);
  };

  const createPromotion = (promoData: Partial<Promotion>) => {
    const newPromo: Promotion = {
      id: `promo-${Date.now()}`,
      name: promoData.name || 'New Discount Offer',
      code: (promoData.code || 'AURA10').toUpperCase(),
      discountPercent: promoData.discountPercent || 10,
      maxDiscount: promoData.maxDiscount || 5,
      startDate: promoData.startDate || '2026-08-01',
      endDate: promoData.endDate || '2026-12-31',
      usageCount: 0,
      usageLimit: promoData.usageLimit || 1000,
      status: 'Active',
    };
    setPromotions((prev) => [newPromo, ...prev]);
    addToast('Promotion Created', `Coupon code ${newPromo.code} is now active.`);
  };

  const togglePromotionStatus = (id: string) => {
    setPromotions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: p.status === 'Active' ? 'Disabled' : 'Active' } : p))
    );
  };

  const updateUserProfile = (data: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...data }));
    addToast('Profile Updated', 'Your profile details have been saved.');
  };

  const addLocation = (locData: Partial<UserLocation>) => {
    const newLoc: UserLocation = {
      id: `loc-${Date.now()}`,
      label: locData.label || 'Saved Location',
      name: locData.name || userProfile.name,
      phone: locData.phone || userProfile.phone,
      houseNo: locData.houseNo || '',
      street: locData.street || '',
      area: locData.area || 'Jubilee Hills',
      city: locData.city || 'Hyderabad',
      state: locData.state || 'Telangana',
      pincode: locData.pincode || '500033',
      address: `${locData.houseNo ? locData.houseNo + ', ' : ''}${locData.area}, ${locData.city}`,
      isDefault: locData.isDefault || false,
    };
    setLocations((prev) => [...prev, newLoc]);
    addToast('Address Saved', `New delivery address "${newLoc.label}" added.`);
  };

  const updateLocation = (loc: UserLocation) => {
    setLocations((prev) => prev.map((l) => (l.id === loc.id ? loc : l)));
    addToast('Address Updated', 'Saved address modifications saved.');
  };

  const deleteLocation = (id: string) => {
    setLocations((prev) => prev.filter((l) => l.id !== id));
    addToast('Address Removed', 'Address deleted from saved list.', 'info');
  };

  const addDish = (dishData: Partial<Dish>) => {
    const newDish: Dish = {
      id: `dish-${Date.now()}`,
      name: dishData.name || 'New Kitchen Specialty',
      chefId: 'chef-1',
      chefName: 'Chef Lakshmi Rao',
      chefImage: MOCK_CHEFS[0].avatar,
      price: dishData.price || 12.50,
      rating: 5.0,
      reviewsCount: 0,
      category: dishData.category || 'Lunch',
      image: dishData.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=800&auto=format&fit=crop',
      description: dishData.description || 'Fresh homemade preparation cooked with pure ingredients.',
      portionSize: dishData.portionSize || 'Serves 1 Person',
      ingredients: dishData.ingredients || ['Fresh Produce', 'A2 Cow Ghee', 'Hand Ground Spices'],
      dietaryInfo: dishData.dietaryInfo || ['100% Home Cooked'],
      prepTime: dishData.prepTime || '25 min',
      isVeg: dishData.isVeg !== undefined ? dishData.isVeg : true,
      tags: ['Home Chef Special'],
    };
    setDishes((prev) => [newDish, ...prev]);
    addToast('Dish Added to Menu', `"${newDish.name}" is now live on your menu.`);
  };

  const updateDish = (dish: Dish) => {
    setDishes((prev) => prev.map((d) => (d.id === dish.id ? dish : d)));
    addToast('Dish Updated', `Changes saved for "${dish.name}".`);
  };

  const deleteDish = (id: string) => {
    setDishes((prev) => prev.filter((d) => d.id !== id));
    addToast('Dish Removed', 'Dish deleted from kitchen menu.', 'info');
  };

  const updateChefStatus = (chefId: string, status: 'Verified' | 'Rejected' | 'Suspended' | 'Active') => {
    setChefs((prev) =>
      prev.map((c) => (c.id === chefId ? { ...c, status } : c))
    );
    addToast('Chef Status Updated', `Chef verification status set to ${status}.`);
  };

  return (
    <AppContext.Provider
      value={{
        portalMode,
        setPortalMode,
        dishes,
        chefs,
        categories,
        locations,
        currentLocation,
        setCurrentLocation,
        cartItems,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        favoriteDishIds,
        favoriteChefIds,
        toggleFavoriteDish,
        toggleFavoriteChef,
        orders,
        createOrder,
        updateOrderStatus,
        notifications,
        markNotificationRead,
        clearNotifications,
        tickets,
        createSupportTicket,
        promotions,
        createPromotion,
        togglePromotionStatus,
        userProfile,
        updateUserProfile,
        addLocation,
        updateLocation,
        deleteLocation,
        addDish,
        updateDish,
        deleteDish,
        updateChefStatus,
        addToast,
      }}
    >
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
