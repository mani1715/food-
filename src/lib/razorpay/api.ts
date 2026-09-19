import { supabase, isSupabaseConfigured } from '../supabase/client';

export interface CreateRazorpayOrderResponse {
  success: boolean;
  orderId: string;
  orderNumber: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
  };
}

export interface VerifyRazorpayPaymentResponse {
  success: boolean;
  message: string;
  orderId: string;
  paymentStatus: string;
  orderStatus: string;
  isLatePayment?: boolean;
}

/**
 * Invokes create-razorpay-order Edge Function.
 * Includes paymentToken proof for guest checkout security.
 */
export const initiateRazorpayOrder = async (
  orderId: string,
  paymentToken?: string,
  customerNotes?: string
): Promise<CreateRazorpayOrderResponse> => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase database is not configured. Online payments require active server connection.');
  }

  const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
    body: { orderId, paymentToken, customerNotes },
  });

  if (error || !data || !data.success) {
    const errorMsg = data?.error || error?.message || 'Could not initiate Razorpay payment order.';
    throw new Error(errorMsg);
  }

  return data as CreateRazorpayOrderResponse;
};

/**
 * Invokes verify-razorpay-payment Edge Function.
 * Verifies signature and caller payment authority.
 */
export const verifyRazorpayPaymentOnServer = async (
  orderId: string,
  paymentToken: string | undefined,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<VerifyRazorpayPaymentResponse> => {
  const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
    body: {
      orderId,
      paymentToken,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    },
  });

  if (error || !data || !data.success) {
    const errorMsg = data?.error || error?.message || 'Payment signature verification failed.';
    throw new Error(errorMsg);
  }

  return data as VerifyRazorpayPaymentResponse;
};
