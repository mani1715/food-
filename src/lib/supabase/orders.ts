import { supabase } from './client';
import { Order, CartItem, UserLocation } from '../../types';
import { DbOrder, DbOrderItem } from './types';

export interface CheckoutQuoteRequest {
  items: Array<{
    product_id: string;
    selected_weight?: string;
    quantity: number;
  }>;
  coupon_code?: string;
  selected_offer_id?: string;
  delivery_address?: Partial<UserLocation>;
}

export interface CheckoutQuoteResponse {
  valid: boolean;
  error?: string;
  subtotal: number;
  delivery_fee: number;
  offer_discount: number;
  coupon_discount: number;
  total_discount: number;
  grand_total: number;
  is_free_shipping: boolean;
  free_gift?: string | null;
  applied_offer_title?: string | null;
  applied_coupon_code?: string | null;
  items: Array<{
    product_id: string;
    name: string;
    selected_weight: string;
    unit_price: number;
    quantity: number;
    line_total: number;
    available_stock: number;
    in_stock: boolean;
  }>;
  warnings?: Array<any>;
}

export interface SecureOrderPlacementRequest {
  idempotency_key?: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  delivery_address: UserLocation;
  items: Array<{
    product_id: string;
    selected_weight?: string;
    quantity: number;
  }>;
  coupon_code?: string;
  selected_offer_id?: string;
  payment_method: string;
  delivery_notes?: string;
}

/**
 * Server-Authoritative Quote Preview RPC
 * Computes official prices, tiered promotions, coupon discounts, and delivery fee without committing order or locking stock.
 */
export const validateCheckoutQuoteFromDb = async (
  quotePayload: CheckoutQuoteRequest
): Promise<CheckoutQuoteResponse | null> => {
  try {
    const { data, error } = await supabase.rpc('validate_checkout_quote', {
      p_quote_payload: quotePayload,
    });

    if (error) {
      console.warn('RPC validate_checkout_quote error:', error.message);
      return null;
    }
    return data as CheckoutQuoteResponse;
  } catch (err) {
    console.warn('Failed to call validate_checkout_quote RPC:', err);
    return null;
  }
};

/**
 * Server-Authoritative Transactional Order Placement RPC
 * Executes atomic row locking, price calculation, coupon validation, order creation,
 * item snapshots, stock deduction, and audit logging inside one PostgreSQL transaction.
 */
export const placeOrderInDbSecure = async (
  orderPayload: SecureOrderPlacementRequest
): Promise<any> => {
  const { data, error } = await supabase.rpc('place_order_secure', {
    p_order_payload: orderPayload,
  });

  if (error) {
    throw new Error(error.message || 'Server failed to process order placement transaction.');
  }

  if (data && data.success === false) {
    throw new Error(data.error || 'Could not complete order checkout.');
  }

  return data;
};

/**
 * Backward compatible wrapper for legacy createOrder calls.
 * Transforms client parameters into server-authoritative placement contract.
 */
export const createOrderInDb = async (
  paymentMethod: string,
  deliveryAddress: UserLocation,
  cartItems: CartItem[],
  _clientSubtotal: number,
  _clientDeliveryFee: number,
  _clientDiscount: number,
  _clientGrandTotal: number,
  customerDetails?: {
    name?: string;
    phone?: string;
    email?: string;
    userId?: string;
    appliedOfferTitle?: string;
    couponCode?: string;
    idempotencyKey?: string;
  }
): Promise<Order> => {
  const securePayload: SecureOrderPlacementRequest = {
    idempotency_key: customerDetails?.idempotencyKey || `idem-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    customer: {
      name: customerDetails?.name || 'Customer',
      phone: customerDetails?.phone || '9876543210',
      email: customerDetails?.email || '',
    },
    delivery_address: deliveryAddress,
    items: cartItems.map((ci) => ({
      product_id: ci.product.id,
      selected_weight: ci.selectedWeight || 'Standard',
      quantity: ci.quantity,
    })),
    coupon_code: customerDetails?.couponCode,
    selected_offer_id: undefined,
    payment_method: paymentMethod,
  };

  const result = await placeOrderInDbSecure(securePayload);

  return {
    id: result.order_id,
    orderNumber: result.order_number,
    paymentSessionToken: result.payment_session_token,
    trackingCode: result.tracking_code,
    date: result.created_at ? result.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    items: cartItems,
    subtotal: Number(result.subtotal),
    deliveryFee: Number(result.delivery_fee),
    discount: Number(result.discount_amount),
    total: Number(result.grand_total),
    status: 'Active',
    orderStatus: result.order_status || 'placed',
    paymentStatus: result.payment_status as any,
    deliveryAddress: result.delivery_address || deliveryAddress,
    paymentMethod: result.payment_method || paymentMethod,
    customerName: customerDetails?.name,
    customerPhone: customerDetails?.phone,
    customerEmail: customerDetails?.email,
    deliveryDays: 3,
  };
};

/**
 * Fetches all orders with item snapshots for Admin Panel and authenticated history.
 */
export const fetchAllOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        product_id,
        product_name_snapshot,
        selected_weight,
        unit_price,
        quantity,
        line_total,
        is_free_gift
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('Error fetching orders from Supabase:', error.message);
    return [];
  }

  if (!data) return [];

  return data.map((o: any) => {
    const items: CartItem[] = (o.order_items || []).map((i: any) => ({
      product: {
        id: i.product_id || 'prod-custom',
        name: i.product_name_snapshot,
        category: 'General',
        price: Number(i.unit_price),
        rating: 5.0,
        reviewsCount: 1,
        image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=800&auto=format&fit=crop',
        description: 'Handcrafted food item',
        weightOptions: [{ weight: i.selectedWeight, price: Number(i.unit_price) }],
        defaultWeight: i.selectedWeight,
        isVeg: true,
      },
      selectedWeight: i.selectedWeight,
      unitPrice: Number(i.unit_price),
      quantity: i.quantity,
    }));

    const mainStatus =
      o.order_status === 'delivered'
        ? 'Delivered'
        : o.order_status === 'cancelled'
        ? 'Cancelled'
        : 'Active';

    return {
      id: o.id,
      orderNumber: o.order_number,
      trackingCode: o.tracking_code || undefined,
      date: o.created_at ? o.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      items,
      subtotal: Number(o.subtotal || 0),
      deliveryFee: Number(o.delivery_fee || 0),
      discount: Number(o.discount_amount || 0),
      total: Number(o.grand_total || 0),
      status: mainStatus,
      orderStatus: o.order_status || 'placed',
      paymentStatus: o.payment_status || 'completed',
      deliveryAddress: o.delivery_address_json || {
        id: 'loc-default',
        label: 'Home',
        address: 'Customer Address',
        city: 'Hyderabad',
        pincode: '500001',
      },
      paymentMethod: o.payment_method || 'UPI / PhonePe',
      customerName: o.customer_name || undefined,
      customerPhone: o.customer_phone || undefined,
      customerEmail: o.customer_email || undefined,
      cancelReason: o.cancel_reason || undefined,
    };
  });
};

/**
 * Server-Enforced Order Status Mutation RPC
 */
export const updateOrderStatusInDb = async (
  orderId: string,
  orderStatus: string,
  notes?: string
) => {
  const { data, error } = await supabase.rpc('update_order_status_secure', {
    p_order_id: orderId,
    p_new_status: orderStatus,
    p_admin_notes: notes || null,
  });

  if (error) throw error;
  if (data && data.success === false) {
    throw new Error(data.error || 'Failed to update order status');
  }
  return data;
};

/**
 * Server-Enforced Payment Status Update
 */
export const updatePaymentStatusInDb = async (orderId: string, paymentStatus: string) => {
  const { error } = await supabase
    .from('orders')
    .update({ payment_status: paymentStatus })
    .eq('id', orderId);
  if (error) throw error;
};

/**
 * Server-Enforced Atomic Order Cancellation & Restock RPC
 */
export const cancelOrderInDb = async (orderId: string, reason: string) => {
  const { data, error } = await supabase.rpc('cancel_order_secure', {
    p_order_id: orderId,
    p_reason: reason,
  });

  if (error) throw error;
  if (data && data.success === false) {
    throw new Error(data.error || 'Could not cancel order');
  }
  return data;
};

/**
 * Restricted order tracking query using database RPC to minimize exposed customer data.
 */
export const getOrderTrackingStatusFromDb = async (
  query: string,
  verification?: string
): Promise<any> => {
  try {
    const { data, error } = await supabase.rpc('get_order_tracking_status', {
      p_order_query: query,
      p_verification: verification || null,
    });

    if (error) {
      console.warn('RPC get_order_tracking_status unavailable or returned error:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Error calling get_order_tracking_status RPC:', err);
    return null;
  }
};
