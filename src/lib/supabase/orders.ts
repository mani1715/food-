import { supabase } from './client';
import { Order, CartItem, UserLocation } from '../../types';
import { DbOrder, DbOrderItem } from './types';

export const createOrderInDb = async (
  paymentMethod: string,
  deliveryAddress: UserLocation,
  cartItems: CartItem[],
  subtotal: number,
  deliveryFee: number,
  discount: number,
  grandTotal: number,
  customerDetails?: { name?: string; phone?: string; email?: string; userId?: string }
): Promise<Order> => {
  const orderId = `ord-${Date.now()}`;
  const orderNumber = `AURA-${Math.floor(10000 + Math.random() * 90000)}`;
  const trackingCode = `TRK-${Math.floor(100000 + Math.random() * 900000)}`;
  const createdAt = new Date().toISOString();

  // 1. Insert main Order row
  const { data: dbOrder, error: orderErr } = await supabase
    .from('orders')
    .insert([
      {
        id: orderId,
        order_number: orderNumber,
        tracking_code: trackingCode,
        customer_id: customerDetails?.userId || null,
        customer_name: customerDetails?.name || 'Valued Customer',
        customer_phone: customerDetails?.phone || '9876543210',
        customer_email: customerDetails?.email || 'customer@aurafoods.in',
        delivery_address_json: deliveryAddress,
        subtotal,
        delivery_fee: deliveryFee,
        discount_amount: discount,
        grand_total: grandTotal,
        payment_method: paymentMethod,
        payment_status: paymentMethod.toLowerCase().includes('cash') ? 'pending' : 'completed',
        order_status: 'placed',
        created_at: createdAt,
      },
    ])
    .select()
    .single();

  if (orderErr) throw orderErr;

  // 2. Insert Order Items Snapshots
  const lineItemRows = cartItems.map((item) => ({
    order_id: dbOrder.id,
    product_id: item.product.id,
    product_name_snapshot: item.product.name,
    selected_weight: item.selectedWeight,
    unit_price: item.unitPrice,
    quantity: item.quantity,
  }));

  const { error: itemsErr } = await supabase.from('order_items').insert(lineItemRows);
  if (itemsErr) console.warn('Could not insert line item snapshots:', itemsErr.message);

  return {
    id: dbOrder.id,
    orderNumber: dbOrder.order_number,
    trackingCode: dbOrder.tracking_code || trackingCode,
    date: dbOrder.created_at.split('T')[0],
    items: cartItems,
    subtotal: Number(dbOrder.subtotal),
    deliveryFee: Number(dbOrder.delivery_fee),
    discount: Number(dbOrder.discount_amount),
    total: Number(dbOrder.grand_total),
    status: 'Active',
    orderStatus: 'placed',
    paymentStatus: dbOrder.payment_status as any,
    deliveryAddress,
    paymentMethod,
    customerName: dbOrder.customer_name || undefined,
    customerPhone: dbOrder.customer_phone || undefined,
    customerEmail: dbOrder.customer_email || undefined,
    deliveryDays: 3,
  };
};

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
        quantity
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

    const mainStatus = o.order_status === 'delivered' ? 'Delivered' : o.order_status === 'cancelled' ? 'Cancelled' : 'Active';

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

export const updateOrderStatusInDb = async (
  orderId: string,
  orderStatus: string,
  notes?: string
) => {
  const updates: any = { order_status: orderStatus };
  if (orderStatus === 'shipped') updates.shipped_at = new Date().toISOString();
  if (orderStatus === 'delivered') updates.delivered_at = new Date().toISOString();

  const { error } = await supabase.from('orders').update(updates).eq('id', orderId);
  if (error) throw error;
};

export const updatePaymentStatusInDb = async (orderId: string, paymentStatus: string) => {
  const { error } = await supabase.from('orders').update({ payment_status: paymentStatus }).eq('id', orderId);
  if (error) throw error;
};

export const cancelOrderInDb = async (orderId: string, reason: string) => {
  const { error } = await supabase
    .from('orders')
    .update({
      order_status: 'cancelled',
      cancel_reason: reason,
    })
    .eq('id', orderId);

  if (error) throw error;
};
